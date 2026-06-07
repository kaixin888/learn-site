# -*- coding: utf-8 -*-
import json, io, sys
sys.stdout.reconfigure(encoding="utf-8")
d = json.load(io.open("triage_result.json", encoding="utf-8"))
targets = sys.argv[1:]
for r in d["learn"]:
    if any(t in r["name"] for t in targets):
        print("========", r["name"], "tbody=", r.get("tbody"), "========")
        c = io.open(r["path"], encoding="utf-8", errors="replace").read()
        c = c.split("## 文件内嵌图片清单")[0]
        # 去图片占位
        lines = [l for l in c.split("\n") if "intentionally omitted" not in l]
        print("\n".join(lines)[:2200])
        print("\n\n")
