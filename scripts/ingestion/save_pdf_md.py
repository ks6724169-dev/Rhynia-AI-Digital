import re
from pathlib import Path

src = Path(r"c:/Users/MANISH KUMAR/Downloads/Ai_project_text.txt")
text = src.read_text(encoding="utf-8")

parts = re.split(r"={5} PAGE (\d+) ={5}", text)
pages = []
for i in range(1, len(parts) - 1, 2):
    pages.append((int(parts[i]), parts[i + 1]))

md = []
md.append("# 📘 AI Project — Full PDF Content\n")
md.append("> Source: **Ai project.pdf** (39 pages) | Same-to-same content, clean readable Markdown format.\n")
md.append("\n---\n")

for num, content in pages:
    words = [w for w in content.split() if w]
    # Poora page ek clean paragraph — har word jod do (same content, proper flow)
    paragraph = " ".join(words)
    md.append(f"\n## 📄 Page {num}\n")
    md.append(paragraph)
    md.append("\n---\n")

out = Path(__file__).resolve().parents[2] / "ml" / "data" / "raw" / "ai_project_pdf" / "AI_PROJECT_FULL.md"
out.write_text("\n".join(md), encoding="utf-8")
print("Saved:", out, f"({out.stat().st_size:,} bytes)")

