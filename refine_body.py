# -*- coding: utf-8 -*-
"""精确统计真实正文长度（排除图片清单section、图片占位、编号图片行），写回 tbody 字段。"""
import json, io, re, collections

d = json.load(io.open("triage_result.json", encoding="utf-8"))

IMG_LIST_HEAD = re.compile(r"##\s*文件内嵌图片清单")
STRIP = re.compile(r"[#*\-=|\s`]")
NUM_IMG = re.compile(r"^\d+\.\s+`?\[")

def true_body(path):
    c = io.open(path, encoding="utf-8", errors="replace").read()
    c = IMG_LIST_HEAD.split(c)[0]               # 去掉图片清单及之后
    lines = [l for l in c.split("\n") if l.strip()]
    body = []
    for l in lines:
        s = l.strip()
        if s.startswith("|"): continue
        if "intentionally omitted" in s: continue
        if s.startswith(">"): continue
        if NUM_IMG.match(s): continue
        body.append(l)
    t = STRIP.sub("", "".join(body))
    return len(t)

b = collections.Counter()
for r in d["learn"]:
    n = true_body(r["path"])
    r["tbody"] = n
    if n < 200: b["<200"] += 1
    elif n < 500: b["200-500"] += 1
    elif n < 1500: b["500-1500"] += 1
    elif n < 4000: b["1500-4000"] += 1
    else: b[">4000"] += 1

for k, v in sorted(b.items()):
    print(k, v)
json.dump(d, io.open("triage_result.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("saved tbody")
