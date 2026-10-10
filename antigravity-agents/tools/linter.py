"""
Rhynia Intelligence SaaS — Multi-Agent Automated Brand & Code Linter
"""

import os
import re
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BANNED_PATTERNS = [
    r"\bChatGPT\b",
    r"\bGemini\b",
    r"\bQwen\b",
    r"\bManish\b",
    r"\bbot\b",
    r"\bassistant\b",
]

TARGET_EXTENSIONS = {".py", ".js", ".html", ".css", ".md", ".sql"}
EXCLUDE_DIRS = {"ai_env", "node_modules", ".git", "__pycache__", "ml"}


def lint_project(target_dir: str = ".") -> bool:
    """Scan all project files for brand compliance and code quality."""
    root_path = Path(target_dir).resolve()
    violations = []

    print(f"🔍 [Rhynia Linter] Scanning workspace: {root_path}")

    for root, dirs, files in os.walk(root_path):
        # Filter excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]

        for file in files:
            file_path = Path(root) / file
            if file_path.suffix.lower() not in TARGET_EXTENSIONS:
                continue

            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()

                for line_idx, line in enumerate(lines, start=1):
                    for pattern in BANNED_PATTERNS:
                        if re.search(pattern, line, re.IGNORECASE):
                            # Skip legitimate references in this linter tool itself
                            if "tools/linter.py" in str(file_path).replace("\\", "/"):
                                continue
                            violations.append({
                                "file": str(file_path.relative_to(root_path)),
                                "line": line_idx,
                                "pattern": pattern,
                                "content": line.strip(),
                            })
            except Exception as e:
                print(f"⚠️ Error reading {file_path}: {e}")

    if violations:
        print(f"\n❌ [LINTER FAILED] {len(violations)} Brand Compliance Violation(s) Found:")
        for v in violations:
            print(f"   {v['file']}:{v['line']} -> Matches '{v['pattern']}': \"{v['content']}\"")
        return False

    print("✅ [LINTER PASSED] 100% Brand Clean. Zero Vendor Leakage Detected.")
    return True


if __name__ == "__main__":
    scan_dir = sys.argv[1] if len(sys.argv) > 1 else "services/rhynia_saas"
    success = lint_project(scan_dir)
    sys.exit(0 if success else 1)
