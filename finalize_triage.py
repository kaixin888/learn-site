# -*- coding: utf-8 -*-
"""把真实正文 <200 字的图片型文件从 learn 移到 data(skip)，输出最终统计。"""
import json, io, sys
sys.stdout.reconfigure(encoding="utf-8")

d = json.load(io.open("triage_result.json", encoding="utf-8"))
learn, moved = [], []
for r in d["learn"]:
    if r.get("tbody", 999) < 200:
        r["reason"] = "image_only,tbody=%d" % r.get("tbody", 0)
        moved.append(r)
    else:
        learn.append(r)

d["data"].extend(moved)
d["learn"] = learn
d["data_count"] = len(d["data"])
d["learn_count"] = len(learn)
json.dump(d, io.open("triage_result.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

print("最终 - 跳过(纯数据/图片): %d" % len(d["data"]))
print("最终 - 转卡片(有文本价值): %d" % len(learn))
# 文本量分档
import collections
b = collections.Counter()
chars = 0
for r in learn:
    n = r.get("tbody", 0); chars += n
    if n < 500: b["200-500"] += 1
    elif n < 1500: b["500-1500"] += 1
    elif n < 4000: b["1500-4000"] += 1
    else: b[">4000"] += 1
print("转卡片文本分档:", dict(b))
print("总文本量约 %.1f 万字" % (chars/10000))
