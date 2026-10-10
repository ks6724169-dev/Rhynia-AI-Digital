"""
Real Training Script - Chota GPT-style Transformer (CPU-friendly)
Actually trains on ml/data/datasets/train.jsonl and saves a real model.
"""

import json
import math
import yaml
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from pathlib import Path


# ---------------- Char-level Tokenizer ----------------
class CharTokenizer:
    def __init__(self):
        self.char_to_id = {}
        self.id_to_char = {}

    def build(self, texts):
        chars = sorted(set("".join(texts)))
        self.char_to_id = {c: i for i, c in enumerate(chars)}
        self.id_to_char = {i: c for i, c in enumerate(chars)}

    @property
    def vocab_size(self):
        return len(self.char_to_id)

    def encode(self, text):
        return [self.char_to_id[c] for c in text if c in self.char_to_id]

    def decode(self, ids):
        return "".join(self.id_to_char[i] for i in ids)


# ---------------- Model ----------------
class Block(nn.Module):
    def __init__(self, d_model, n_heads):
        super().__init__()
        self.ln1 = nn.LayerNorm(d_model)
        self.attn = nn.MultiheadAttention(d_model, n_heads, batch_first=True)
        self.ln2 = nn.LayerNorm(d_model)
        self.ff = nn.Sequential(
            nn.Linear(d_model, 4 * d_model), nn.GELU(), nn.Linear(4 * d_model, d_model)
        )

    def forward(self, x, mask):
        a, _ = self.attn(self.ln1(x), self.ln1(x), self.ln1(x), attn_mask=mask, need_weights=False)
        x = x + a
        x = x + self.ff(self.ln2(x))
        return x


class TinyGPT(nn.Module):
    def __init__(self, vocab_size, d_model=128, n_heads=4, n_layers=4, block_size=128):
        super().__init__()
        self.block_size = block_size
        self.tok = nn.Embedding(vocab_size, d_model)
        self.pos = nn.Embedding(block_size, d_model)
        self.blocks = nn.ModuleList([Block(d_model, n_heads) for _ in range(n_layers)])
        self.ln = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, vocab_size)
        mask = torch.triu(torch.ones(block_size, block_size) * float("-inf"), diagonal=1)
        self.register_buffer("mask", mask)

    def forward(self, idx):
        B, T = idx.shape
        x = self.tok(idx) + self.pos(torch.arange(T, device=idx.device))
        for blk in self.blocks:
            x = blk(x, self.mask[:T, :T])
        return self.head(self.ln(x))


# ---------------- Training ----------------
def main():
    config = yaml.safe_load(open("ml/training/configs/config.yaml"))
    epochs = 20
    batch_size = 16
    block_size = 64
    lr = 3e-3
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    # Load data
    texts = [json.loads(l)["text"] for l in open("ml/data/datasets/train.jsonl", encoding="utf-8") if l.strip()]
    full_text = "\n".join(texts)
    print(f"Total characters: {len(full_text):,}")

    tok = CharTokenizer()
    tok.build(full_text)
    print(f"Vocab size: {tok.vocab_size}")

    ids = torch.tensor(tok.encode(full_text), dtype=torch.long)
    # Build training sequences
    x_list, y_list = [], []
    for i in range(0, len(ids) - block_size - 1, block_size // 2):
        x_list.append(ids[i : i + block_size])
        y_list.append(ids[i + 1 : i + block_size + 1])
    X = torch.stack(x_list)
    Y = torch.stack(y_list)
    print(f"Training sequences: {X.shape[0]}")

    loader = DataLoader(TensorDataset(X, Y), batch_size=batch_size, shuffle=True)

    model = TinyGPT(tok.vocab_size, block_size=block_size).to(device)
    print(f"Parameters: {sum(p.numel() for p in model.parameters()):,}")

    opt = torch.optim.AdamW(model.parameters(), lr=lr)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs * len(loader))
    loss_fn = nn.CrossEntropyLoss()

    ckpt_dir = Path("ml/checkpoints")
    ckpt_dir.mkdir(exist_ok=True)

    for epoch in range(epochs):
        model.train()
        total = 0.0
        for xb, yb in loader:
            xb, yb = xb.to(device), yb.to(device)
            logits = model(xb)
            loss = loss_fn(logits.view(-1, logits.size(-1)), yb.view(-1))
            opt.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            sched.step()
            total += loss.item()
        avg = total / len(loader)
        print(f"Epoch {epoch+1}/{epochs} - loss: {avg:.4f} - perplexity: {math.exp(avg):.2f}")

        torch.save(
            {"model": model.state_dict(), "epoch": epoch + 1, "loss": avg},
            ckpt_dir / "real_model.pt",
        )

    # Save final model + tokenizer
    Path("ml/model_registry").mkdir(exist_ok=True)
    torch.save(
        {
            "model": model.state_dict(),
            "char_to_id": tok.char_to_id,
            "block_size": block_size,
            "config": {"d_model": 128, "n_heads": 4, "n_layers": 4},
        },
        "ml/model_registry/real_model.pt",
    )

    # Test generation
    model.eval()
    ctx = torch.tensor([tok.encode("The ")], dtype=torch.long, device=device)
    with torch.no_grad():
        for _ in range(100):
            logits = model(ctx[:, -block_size:])
            nxt = torch.multinomial(torch.softmax(logits[:, -1] / 0.8, -1), 1)
            ctx = torch.cat([ctx, nxt], dim=1)
    print("\nSample generation:")
    print(tok.decode(ctx[0].tolist()))


if __name__ == "__main__":
    main()
