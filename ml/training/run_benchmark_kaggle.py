# KAGGLE AUTO-BENCHMARK SUITE (100 QUESTIONS FOR RHYNIA 8B)
import os, json
import torch
from unsloth import FastVisionModel

# 1. Load Model & Adapter
adapter_path = "/kaggle/input/results-1/rhynia_v3_VL/checkpoint-1250" # Update if needed

print("1. Loading Rhynia Model for 100-Question Benchmark...")
model, tokenizer = FastVisionModel.from_pretrained(
    model_name = adapter_path,
    load_in_4bit = True,
)
FastVisionModel.for_inference(model)

# 2. Import 100 Questions Benchmark
from rhynia_100_tests import TEST_BENCHMARK

print(f"2. Loaded {len(TEST_BENCHMARK)} Benchmark Questions across 6 Categories!")

results = []
SYSTEM_PROMPT = "Tum Rhynia ho, ek advanced AI assistant jise Rhynia Intelligence ne banaya hai."

# 3. Automated Benchmark Loop
for idx, test in enumerate(TEST_BENCHMARK, 1):
    category = test["cat"]
    question = test["q"]
    
    print(f"[{idx}/100] Testing ({category}): {question[:50]}...")
    
    msgs = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": [{"type": "text", "text": question}]}
    ]
    text = tokenizer.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
    inputs = tokenizer(text=text, return_tensors="pt", add_special_tokens=False).to("cuda")
    
    out = model.generate(**inputs, max_new_tokens=256, temperature=0.3, use_cache=True)
    ans = tokenizer.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
    
    results.append({
        "id": idx,
        "category": category,
        "question": question,
        "answer": ans
    })

# 4. Save Audit Report
report_path = "/kaggle/working/RHYNIA_100_TEST_AUDIT_REPORT.json"
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("=" * 60)
print(f"🎉 100-Question Benchmark Completed! Audit Report saved at: {report_path}")
print("=" * 60)
