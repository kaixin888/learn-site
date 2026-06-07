# -*- coding: utf-8 -*-
"""
扫描 MD 文件，判定「纯数据无学习价值」(skip) vs「有学习价值」(convert)。
判定规则（命中任一即判为纯数据）：
  1. 源类型为 XLSX/XLS（表头注释行包含 类型: XLSX）
  2. 文件总字符 > 80000
  3. 表格行（以 | 开头）占非空行比例 > 60%
  4. 文件名命中纯数据关键词（数据汇总/TOP1000/新品列表/爆款.*列表/5000个/子类目/销量.*top/产品列表 等）
输出 triage_result.json：{data:[...], learn:[...]}
"""
import os, re, json, io

SRC = r"E:\学习\知识星球AMZ下载\MD转换结果"

# 文件名纯数据关键词
NAME_DATA_PAT = re.compile(
    r"(数据汇总|新品数据|新品列表|爆款.{0,6}(新品|列表|产品|5000|1000)|"
    r"TOP\s?\d{3,}|top\s?\d{3,}|子类目|大盘数据|销量.{0,4}top|产品列表|"
    r"飙升.{0,4}top|联系方式|红人.{0,6}(列表|联系)|价目表|费用变更表|"
    r"\d{2,4}个.{0,6}(产品|爆款|新品|链接))",
    re.IGNORECASE,
)

# 头部元信息：类型
TYPE_PAT = re.compile(r"\*\*类型\*\*[:：]\s*(\w+)")
CHAR_PAT = re.compile(r"\*\*字符\*\*[:：]\s*(\d+)")

def analyze(path):
    try:
        with io.open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception as e:
        return ("learn", f"read_error:{e}")

    name = os.path.basename(path)
    reasons = []

    # 头部元信息
    head = content[:300]
    mtype = TYPE_PAT.search(head)
    src_type = mtype.group(1).upper() if mtype else ""

    total_chars = len(content)

    # 行统计
    lines = [l for l in content.split("\n") if l.strip()]
    table_lines = sum(1 for l in lines if l.lstrip().startswith("|"))
    table_ratio = table_lines / max(len(lines), 1)

    # 正文有效字数（去掉表格行和图片占位）
    body_lines = [l for l in lines if not l.lstrip().startswith("|")
                  and "intentionally omitted" not in l
                  and not l.startswith(">")]
    body_text = "".join(body_lines)
    body_text = re.sub(r"[#*\-=|\s]", "", body_text)
    body_len = len(body_text)

    # --- 判定逻辑（优先级从高到低）---
    # 1. XLSX 源 = 几乎都是 Excel 导出的纯数据表，直接 skip
    if src_type in ("XLSX", "XLS"):
        return ("data", "src=xlsx")
    # 2. 文件名命中纯数据/联系方式类关键词
    if NAME_DATA_PAT.search(name):
        return ("data", "name_data")
    # 3. 表格为主 + 正文很短 = 纯数据表（白皮书等正文长的不在此列）
    if table_ratio > 0.6 and len(lines) > 30 and body_len < 600:
        return ("data", f"table_ratio={table_ratio:.2f},body={body_len}")
    # 4. 正文太短无意义
    if body_len < 150:
        return ("data", f"too_short,body={body_len}")
    # 5. 其余均视为有学习价值（含贸易白皮书、物流附加费、长教程等）
    return ("learn", f"body={body_len}")

def main():
    data_files, learn_files = [], []
    all_md = []
    for root, _, files in os.walk(SRC):
        for fn in files:
            if fn.endswith(".md") and not fn.startswith("_"):
                all_md.append(os.path.join(root, fn))

    for p in all_md:
        verdict, reason = analyze(p)
        rec = {"path": p, "name": os.path.basename(p), "reason": reason}
        if verdict == "data":
            data_files.append(rec)
        else:
            learn_files.append(rec)

    out = {
        "total": len(all_md),
        "data_count": len(data_files),
        "learn_count": len(learn_files),
        "data": data_files,
        "learn": learn_files,
    }
    out_path = os.path.join(os.path.dirname(__file__), "triage_result.json")
    with io.open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    print(f"总文件: {len(all_md)}")
    print(f"纯数据(skip): {len(data_files)}")
    print(f"学习内容(convert): {len(learn_files)}")
    print(f"结果写入: {out_path}")

if __name__ == "__main__":
    main()
