import sys
try:
    from pypdf import PdfReader
except ImportError:
    sys.exit("PYPDF_NOT_INSTALLED")

r = PdfReader(r"c:/Users/MANISH KUMAR/Downloads/Ai project.pdf")
text = []
for i, p in enumerate(r.pages):
    text.append(f"\n===== PAGE {i+1} =====\n" + (p.extract_text() or ""))
out = r"c:/Users/MANISH KUMAR/Downloads/Ai_project_text.txt"
with open(out, "w", encoding="utf-8") as f:
    f.write("".join(text))
print("DONE pages:", len(r.pages))
