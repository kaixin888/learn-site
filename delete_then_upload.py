"""删除所有已有卡片 + 全量重新上传"""
import re, json, urllib.request, urllib.error, sys, os, time

API_BASE = "https://learn.clowand.com/api"
SOURCE_DIR = r"E:\跨境知识\知无不言视频\知识星球-项目库\外贸"

CARD_TO_CATEGORY = {
    "01_1": "外贸主流付款方式","01_2": "付款方式风险与规避","01_3": "信用证开立审核结汇",
    "01_4": "国际贸易术语详解","01_5": "出口退税完整流程","01_6": "价格谈判与砍价应对",
    "01_7": "国际汇率波动应对","01_8": "跨境收款合规","01_9": "佣金结构与谈判",
    "01_10": "PI形式发票规范",
    "02_1": "谷歌搜索客户实操","02_2": "社交媒体客户开发","02_3": "社交媒体客户开发",
    "02_4": "开发信写作技巧","02_5": "客户信任建立与转化","02_6": "询盘报盘还盘实操",
    "02_7": "价格谈判与砍价应对","02_8": "即时沟通工具使用","02_9": "样品寄送与跟进",
    "02_10": "外贸价格构成与报价术语",
    "03_1": "工厂考察与选择","03_2": "工厂沟通与配合","03_3": "防工厂撬客户策略",
    "03_4": "货代合作选择","03_5": "进出口报关基础流程","03_6": "商检报检流程",
    "03_7": "监装与装柜实操","03_8": "包装合规与标识","03_9": "外贸企业架构与合作模式",
    "03_10": "第三方验货",
    "04_1": "海关数据开发客户","04_2": "各站点热门品类分析","04_3": "跨境选品核心逻辑",
    "04_4": "各国产品认证合规","04_5": "欧美市场运营策略","04_6": "外贸知识产权风险规避",
    "04_7": "MOQ谈判与散货处理","04_8": "海外制裁名单筛查","04_9": "特殊品类出口规范",
    "04_10": "选品数据工具",
    "05_1": "SOHO创业起步指南","05_2": "SOHO创业起步指南","05_3": "外贸面试求职技巧",
    "05_4": "外贸展会获客跟进","05_5": "客户接待全流程","05_6": "外贸时间管理与效率",
    "05_7": "新手入行必备素养","05_8": "客户纠纷与投诉处理","05_9": "外贸企业架构与合作模式",
    "05_10": "大小客户差异化策略","05_11": "海外客户精准开发渠道","05_12": "外贸心态与成长",
}

def api(method, path, body=None):
    url = API_BASE + path
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return {"_err": f"HTTP {e.code}: {body[:120]}"}
    except Exception as e:
        return {"_err": str(e)}


# ========= Step 1: Delete all existing notes =========
print("=== Step 1: Delete existing notes ===")
notes = api("GET", "/notes")
if isinstance(notes, list):
    print(f"Found {len(notes)} existing notes")
    deleted = 0
    for n in notes:
        slug = n.get("slug", "")
        if not slug:
            continue
        res = api("DELETE", f"/notes/{slug}")
        if isinstance(res, dict) and res.get("success"):
            deleted += 1
    print(f"Deleted {deleted}/{len(notes)} notes")
else:
    print(f"Failed to fetch notes: {notes}")

time.sleep(1)

# ========= Step 2: Parse & upload =========
print("\n=== Step 2: Upload all cards ===")

files = [
    ("01", "康奈尔卡片_01_付款风控与报价核价.md"),
    ("02", "康奈尔卡片_02_客户开发与谈判.md"),
    ("03", "康奈尔卡片_03_供应商管理与单证物流.md"),
    ("04", "康奈尔卡片_04_市场洞察与合规认证.md"),
    ("05", "康奈尔卡片_05_SOHO创业与新人生存.md"),
]

total, ok, fail = 0, 0, 0

for file_key, fname in files:
    filepath = os.path.join(SOURCE_DIR, fname)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Parse cards
    cards = []
    current, section = None, None
    for line in content.split("\n"):
        m = re.match(r'^##\s*卡片(\d+)｜(.+)', line)
        if m:
            if current: cards.append(current)
            current = {"title": f"卡片{m.group(1)}|{m.group(2).strip()}", "cue": "", "notes": "", "summary": ""}
            section = None; continue
        if not current: continue
        if line.strip() == "---": continue
        if re.search(r'线索栏', line): section = "cue"; continue
        elif re.search(r'笔记栏', line): section = "notes"; continue
        elif re.search(r'总结栏', line): section = "summary"; continue
        if section == "cue": current["cue"] += line + "\n"
        elif section == "notes": current["notes"] += line + "\n"
        elif section == "summary": current["summary"] += line + "\n"
    if current: cards.append(current)

    print(f"\n[FILE {file_key}] {fname} -> {len(cards)} cards")

    for idx, card in enumerate(cards, 1):
        total += 1
        cat = CARD_TO_CATEGORY.get(f"{file_key}_{idx}", "其他")
        title = card["title"]

        md = f"# {title}\n\n## 提示\n{card['cue'].strip()}\n\n## 笔记\n{card['notes'].strip()}\n\n## 总结\n{card['summary'].strip()}"

        tags = []
        parts = re.split(r'[|/、，,\s:：]+', title)
        seen = set()
        for p in parts:
            p = p.strip()
            if len(p) >= 2 and not re.match(r'^卡片\d*$', p) and p not in seen:
                tags.append(p); seen.add(p)
        tags = tags[:5]

        body = {"title": title, "content_md": md, "category": cat, "tags": tags}
        result = api("POST", "/notes", body)

        status = "OK" if (isinstance(result, dict) and "id" in result) else f"FAIL ({result.get('_err','?')})"
        print(f"  [{cat}] {title[:60]} ... {status}")
        if "OK" in status:
            ok += 1
        else:
            fail += 1

        if total % 10 == 0:
            time.sleep(0.5)

print(f"\n=== DONE: {ok}/{total} success, {fail} failed ===")
