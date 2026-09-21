import re
from pathlib import Path

src = Path(r"c:/Users/MANISH KUMAR/Downloads/Ai_project_text.txt")
text = src.read_text(encoding="utf-8")

# 1) Save folder banao
folder = Path(__file__).resolve().parents[2] / "ml" / "data" / "raw" / "ai_project_pdf"
folder.mkdir(exist_ok=True)

# 2) Full text same-to-save
(folder / "FULL_CONTENT_same_to_same.txt").write_text(text, encoding="utf-8")

# 3) Page-wise files
pages = re.split(r"={5} PAGE (\d+) ={5}", text)
# pages[0] khali hai, uske baad [num, content, num, content...]
count = 0
for i in range(1, len(pages) - 1, 2):
    num = pages[i]
    content = pages[i + 1].strip()
    # Word-per-line ko readable lines me convert karo (same words, better formatting)
    (folder / f"PAGE_{num}.txt").write_text(content, encoding="utf-8")
    count += 1

print(f"Saved: FULL_CONTENT + {count} page files in {folder}")
