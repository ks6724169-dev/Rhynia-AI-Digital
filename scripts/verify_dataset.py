import io, json, re, collections

P = r"ml\data\rhynia_part1_10k.jsonl"
KW = ["Qwen", "qwen", "QWEN", "Alibaba", "aliyun", "DashScope"]

user_hits = collections.Counter()
asst_hits = collections.Counter()
asst_confess = 0
confess_samples = []
denial_kw = re.compile(r"(not|n't|never|no,|kabhi|nahi|\u0928\u0939\u0940\u0902)", re.I)

hi_chars = 0
for i, line in enumerate(io.open(P, encoding="utf-8"), 1):
    rec = json.loads(line)
    for m in rec["messages"]:
        c = m.get("content", "")
        if any("\u0900" <= ch <= "\u097F" for ch in c):
            hi_chars += 1
        hit = [k for k in KW if k in c]
        if not hit:
            continue
        if m["role"] == "user":
            for k in hit:
                user_hits[k] += 1
        else:
            for k in hit:
                asst_hits[k] += 1
            for k in hit:
                for sent in re.split(r"(?<=[.!?])\s+", c):
                    if k in sent and not denial_kw.search(sent):
                        asst_confess += 1
                        if len(confess_samples) < 5:
                            confess_samples.append((i, k, sent[:150]))
                        break

print("Hits in USER prompts (trap sawaal - ALLOWED):")
for k, v in user_hits.most_common():
    print("   %s: %d" % (k, v))
print("Hits in ASSISTANT replies:")
for k, v in asst_hits.most_common():
    print("   %s: %d" % (k, v))
print()
print("Possible CONFESSION sentences:", asst_confess)
for s in confess_samples:
    print("   line %d [%s]: %s" % s)
print()
print("Devanagari wale samples:", hi_chars, "/ 10000")
print("VERDICT:", "SAFE" if asst_confess == 0 else "FIX NEEDED")
