# -*- coding: utf-8 -*-
"""
批量 AI 精炼 + 上传康奈尔卡片到 learn.clowand.com

用法:
  python batch_convert.py 0 200    # 处理 learn[0:200]
  python batch_convert.py 0 50     # 处理 learn[0:50]

依赖: pip install anthropic
"""
import json, os, sys, re, time, urllib.request, urllib.error

SOURCE = r"E:\学习\知识星球AMZ下载\MD转换结果"
TRIAGE = os.path.join(os.path.dirname(__file__), "triage_result.json")
CAT_MAP = os.path.join(os.path.dirname(__file__), "category_map.json")
API_BASE = "https://learn.clowand.com/api"

# ---- Anthropic ----
ANTH_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ARK_KEY = os.environ.get("ARK_API_KEY", "")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")

LLM_PROVIDER = "ark"  # "ark" | "anthropic" | "gemini"

# 优先使用 Ark（火山引擎，国内可达）
if LLM_PROVIDER == "ark" and ARK_KEY:
    API_KEY = ARK_KEY
    API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
    MODEL = "deepseek-v3-1-250821"  # 或 doubao-seed-1-6-250615
elif LLM_PROVIDER == "anthropic" and ANTH_KEY:
    import anthropic
    client = anthropic.Anthropic(api_key=ANTH_KEY)
elif GEMINI_KEY:
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_KEY)
else:
    print("ERROR: No valid API key found")
    sys.exit(1)

# ---- 加载数据 ----
d = json.load(open(TRIAGE, encoding="utf-8"))
cats = json.load(open(CAT_MAP, encoding="utf-8"))

# 按业务领域分组的分类名（用于提示词）
ALL_CATEGORIES = json.dumps(list(cats.keys()), ensure_ascii=False)

# ---- 工具函数 ----
IMG_LIST = re.compile(r"##\s*文件内嵌图片清单")
PIC_TEXT = re.compile(r"[-]{3,}\s*(Start|End)\s+of\s+picture", re.I)
INT_OMIT = re.compile(r"intentionally omitted")
COPYRIGHT = re.compile(r'本文由.*|生成于|采集于|仅供学习|免责申明.*', re.I)
SPACE_CJK = re.compile(r"([\u4e00-\u9fff]) +([\u4e00-\u9fff])")

def clean_md(content):
    """清理OCR噪声"""
    # 去掉图片清单section
    content = IMG_LIST.split(content)[0]
    lines = []
    for l in content.split("\n"):
        s = l.strip()
        # 去掉图片占位
        if INT_OMIT.search(s): continue
        if PIC_TEXT.search(s): continue
        # 去掉版权信息尾部
        if COPYRIGHT.search(s) and len(s) < 60:
            # 短版权行跳过，但如果是一段中的长句则保留
            continue
        # 保留所有其他行（包括|表格行）
        lines.append(l)
    content = "\n".join(lines)
    # 修复CJK字间空格
    while SPACE_CJK.search(content):
        content = SPACE_CJK.sub(r"\1\2", content)
    return content.strip()

def api(method, path, body=None):
    url = API_BASE + path
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        b = e.read().decode("utf-8", errors="replace")
        return {"_err": f"HTTP {e.code}: {b[:300]}"}
    except Exception as e:
        return {"_err": str(e)}

def call_llm(prompt, max_tokens=3000):
    """调用 LLM API（Ark/火山引擎）返回文本"""
    if LLM_PROVIDER == "ark":
        body = {
            "model": MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": 0.3,
        }
        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(API_URL, data=data, method="POST")
        req.add_header("Authorization", f"Bearer {API_KEY}")
        req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                resp = json.loads(r.read().decode("utf-8"))
            return resp["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as e:
            b = e.read().decode("utf-8", errors="replace")
            raise Exception(f"API HTTP {e.code}: {b[:300]}")
        except Exception as e:
            raise Exception(f"API error: {e}")
    elif LLM_PROVIDER == "anthropic":
        resp = client.messages.create(
            model="claude-sonnet-4-20250515",
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        return resp.content[0].text if resp.content else ""
    else:
        import google.generativeai as genai
        m = genai.GenerativeModel("gemini-2.0-flash")
        resp = m.generate_content(prompt)
        return resp.text

def generate_cornell(filename, cleaned_text):
    """生成康奈尔卡片"""
    prompt = f"""你是一位专业的知识管理助手。请将以下跨境电商/亚马逊运营的学习内容提炼为康奈尔卡片格式。

文件标题：{filename}

分类选项（选择最匹配的一个）：
{ALL_CATEGORIES}

要求：
1. 从以上分类列表中选出最匹配的一个二级分类名，输出为下面的 "category" 字段
2. 提取3-5个中英文混合标签，放在 "tags" 字段
3. 用康奈尔格式输出：
   - ## 提示：从原文提炼5-10个关键概念/核心要点/问题线索，用bullet points
   - ## 笔记：原文精华内容整理，保留专业术语和实操步骤（含数据指标）
   - ## 总结：本文的核心洞见/结论/行动建议，2-5句话
4. 只输出json，不包含其他内容：
{{"category":"分类名","tags":["标签1","标签2","标签3"],"cue":"提示内容...","notes":"笔记内容...","summary":"总结内容..."}}

原文内容：
{cleaned_text[:8000]}"""

    try:
        text = call_llm(prompt)
        # 提取json
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        result = json.loads(text)
        return result
    except Exception as e:
        return {"_err": f"LLM error: {e}"}

def main():
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    end = int(sys.argv[2]) if len(sys.argv) > 2 else min(start + 50, len(d["learn"]))

    batch = d["learn"][start:end]
    print(f"Batch [{start}:{end}] - {len(batch)} files")

    report = {"batch_start": start, "batch_end": end, "total": len(batch), "success": 0, "failed": 0, "results": []}

    for idx, rec in enumerate(batch):
        fname = rec["name"]
        fpath = rec["path"]
        print(f"\n[{start+idx+1}/{len(d['learn'])}] {fname} ...", end=" ", flush=True)

        # 1. 读取文件
        try:
            with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                raw = f.read()
        except Exception as e:
            print(f"READ_FAIL: {e}")
            report["results"].append({"file": fname, "status": "fail", "error": f"read:{e}"})
            report["failed"] += 1
            continue

        cleaned = clean_md(raw)
        if len(cleaned) < 100:
            print("TOO_SHORT after clean - skip")
            report["results"].append({"file": fname, "status": "skip", "error": "too_short"})
            report["failed"] += 1
            continue

        # 2. AI 生成
        result = generate_cornell(fname, cleaned)
        if "_err" in result:
            print(f"LLM_FAIL: {result['_err'][:60]}")
            report["results"].append({"file": fname, "status": "fail", "error": result["_err"]})
            report["failed"] += 1
            continue

        category = result.get("category", "")
        if category not in cats and category not in [k for k in cats if k in [v for v in cats]]:
            # 尝试模糊匹配
            found = False
            for k in cats:
                if category in k or k in category:
                    category = k
                    found = True
                    break
            if not found:
                print(f"CAT_MISMATCH: '{category}' - using fallback")
                category = "市场洞察与分析"  # fallback
        elif category not in cats:
            print(f"CAT_NOT_EXACT: '{category}' - using fallback")
            category = "市场洞察与分析"

        tags = result.get("tags", [])
        if "亚马逊" not in tags:
            tags.insert(0, "亚马逊")

        cue = result.get("cue", "").strip()
        notes = result.get("notes", "").strip()
        summary = result.get("summary", "").strip()
        if not notes:
            print("NO_NOTES - skip")
            report["results"].append({"file": fname, "status": "skip", "error": "no_notes"})
            report["failed"] += 1
            continue

        content_md = f"## 提示\n{cue}\n\n## 笔记\n{notes}\n\n## 总结\n{summary}"
        title = fname.replace(".md", "")

        # 3. POST上传（重试1次）
        for attempt in range(2):
            body = {
                "title": title,
                "content_md": content_md,
                "category": category,
                "tags": tags,
            }
            res = api("POST", "/notes", body)
            if isinstance(res, dict) and "id" in res:
                print(f"OK [{category}] id={res['id'][:12]}")
                report["results"].append({"file": fname, "title": title, "category": category, "status": "ok"})
                report["success"] += 1
                break
            elif attempt == 0:
                err = res.get("_err", str(res)[:60])
                print(f"retry({err})...", end=" ", flush=True)
                time.sleep(1)
            else:
                print(f"FAIL: {res.get('_err', str(res)[:80])}")
                report["results"].append({"file": fname, "status": "fail", "error": str(res)})
                report["failed"] += 1

        if (idx + 1) % 5 == 0:
            time.sleep(0.5)

    print(f"\n\nBatch result: {report['success']} ok / {report['failed']} fail/skip")
    # 保存report
    rep_path = os.path.join(os.path.dirname(__file__), f"report_{start}_{end}.json")
    json.dump(report, open(rep_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Report saved: {rep_path}")

if __name__ == "__main__":
    main()