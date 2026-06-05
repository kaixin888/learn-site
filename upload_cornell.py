"""
批量上传康奈尔卡片到 learn.clowand.com
1. 构建完整类目树（对应类目体系表的一级+二级）
2. 解析每个MD文件 → 逐张卡片 → 映射到二级分类
3. 调 API 批量 POST
"""
import re, json, urllib.request, urllib.error, sys, os, time

API_BASE = "https://learn.clowand.com/api"
SOURCE_DIR = r"E:\跨境知识\知无不言视频\知识星球-项目库\外贸"

# ===================== 类目体系树 =====================
# 顶级分类 ID（运行时动态获取）— 全局变量
TOP_WM_ID = None   # 外贸知识体系
TOP_KJ_ID = None   # 跨境知识体系

# 类目树：一级 → 二级列表
CATEGORY_TREE = {
    "外贸新手入门知识": [
        "外贸行业基础认知", "外贸岗位职能详解", "外贸行业发展趋势",
        "新手入行必备素养", "外贸企业架构与合作模式", "SOHO创业起步指南",
        "外贸面试求职技巧", "外贸时间管理与效率", "外贸心态与成长",
    ],
    "外贸专业术语": [
        "国际贸易术语详解", "外贸价格构成与报价术语", "进出口基础名词释义",
    ],
    "外贸全流程实操": [
        "外贸接单全流程详解", "询盘报盘还盘实操", "外贸合同洽谈签订",
        "样品寄送与跟进", "大货生产与质控", "订单收尾交付", "老客户返单维护",
        "MOQ谈判与散货处理", "工厂考察与选择", "工厂沟通与配合",
        "供应商管理策略", "第三方验货",
    ],
    "外贸客户开发与谈判": [
        "海外客户精准开发渠道", "谷歌搜索客户实操", "社交媒体客户开发",
        "海关数据开发客户", "外贸展会获客跟进", "外贸邮件开发客户",
        "跨国客户谈判技巧", "价格谈判与砍价应对", "客户信任建立与转化",
        "客户跟进节奏策略", "大小客户差异化策略", "客户接待全流程",
        "开发信写作技巧", "即时沟通工具使用", "询盘质量判断",
    ],
    "外贸单证实操": [
        "商业发票制作与规范", "装箱单制作填写", "提单分类实操",
        "原产地证办理", "报关单填写申报", "信用证单据制作",
        "PI形式发票规范",
    ],
    "外贸报关与报检": [
        "进出口报关基础流程", "一般贸易报关实操", "HS编码查询归类",
        "商检报检流程", "报关常见问题与异常", "海关查验应对",
        "特殊品类出口规范",
    ],
    "外贸物流与运输": [
        "海运物流全流程", "空运物流规则", "货代合作选择",
        "运费计算与报价拆解", "监装与装柜实操", "包装合规与标识",
    ],
    "外贸结算与金融": [
        "外贸主流付款方式", "付款方式风险与规避", "信用证开立审核结汇",
        "国际汇率波动应对", "外贸结汇收汇实操", "跨境收款合规",
        "人民币跨境结算", "佣金结构与谈判",
    ],
    "外贸财税与退税": [
        "出口退税完整流程", "退税资料申报规范", "退税异常解决",
        "外贸发票开具抵扣",
    ],
    "外贸合规与风控": [
        "外贸海关合规政策", "外贸知识产权风险规避", "海外制裁名单筛查",
        "外贸合同风险规避", "客户纠纷与投诉处理", "防工厂撬客户策略",
        "出口认证与合规要求",
    ],
    "外贸商务沟通与邮件": [
        "外贸商务邮件写作", "开发信跟进信模板", "跨国商务沟通礼仪",
    ],
    "跨境选品与供应链": [
        "跨境选品核心逻辑", "各站点热门品类分析", "1688拿货与供应链",
    ],
    "跨境合规与知识产权": [
        "各国产品认证合规", "商标专利版权保护",
    ],
    "跨境本地化运营": [
        "欧美市场运营策略", "中东拉美市场运营", "日本市场运营",
    ],
    "跨境工具实操教程": [
        "选品数据工具", "翻译修图剪辑工具", "物流对账辅助工具",
    ],
}

# ===================== 卡片→二级分类映射 =====================
# key: "{文件编号}_{卡片编号}", value: "二级分类名称"
CARD_TO_CATEGORY = {
    # -- 文件01：付款风控与报价核价 --
    "01_1":  "外贸主流付款方式",       # T/T vs L/C
    "01_2":  "付款方式风险与规避",     # 赊账应对
    "01_3":  "信用证开立审核结汇",     # LC信用证
    "01_4":  "国际贸易术语详解",       # FOB/CIF/EXW
    "01_5":  "出口退税完整流程",       # 退税与增值税
    "01_6":  "价格谈判与砍价应对",     # 目标价砍价
    "01_7":  "国际汇率波动应对",       # 汇率与报价
    "01_8":  "跨境收款合规",          # 人民币收款
    "01_9":  "佣金结构与谈判",         # 佣金
    "01_10": "PI形式发票规范",        # PI制作

    # -- 文件02：客户开发与谈判 --
    "02_1":  "谷歌搜索客户实操",       # Google搜索
    "02_2":  "社交媒体客户开发",       # LinkedIn
    "02_3":  "社交媒体客户开发",       # Facebook
    "02_4":  "开发信写作技巧",         # 开发信
    "02_5":  "客户信任建立与转化",     # 跟进信任
    "02_6":  "询盘报盘还盘实操",       # 询盘回复
    "02_7":  "价格谈判与砍价应对",     # 价格谈判
    "02_8":  "即时沟通工具使用",       # WhatsApp
    "02_9":  "样品寄送与跟进",         # 样品寄送
    "02_10": "外贸价格构成与报价术语",  # 询报价单

    # -- 文件03：供应商管理与单证物流 --
    "03_1":  "工厂考察与选择",         # 工厂考察
    "03_2":  "工厂沟通与配合",         # 工厂沟通
    "03_3":  "防工厂撬客户策略",       # 防撬客户
    "03_4":  "货代合作选择",           # 货代选择
    "03_5":  "进出口报关基础流程",     # 报关流程
    "03_6":  "商检报检流程",           # 商检单证
    "03_7":  "监装与装柜实操",         # 监装
    "03_8":  "包装合规与标识",         # 包装合规
    "03_9":  "外贸企业架构与合作模式",  # 代理公司
    "03_10": "第三方验货",            # 验货

    # -- 文件04：市场洞察与合规认证 --
    "04_1":  "海关数据开发客户",       # 海关数据
    "04_2":  "各站点热门品类分析",     # 品类出口数据
    "04_3":  "跨境选品核心逻辑",       # 选品策略
    "04_4":  "各国产品认证合规",       # 美国合规
    "04_5":  "欧美市场运营策略",       # 各市场特点  (multi-market)
    "04_6":  "外贸知识产权风险规避",   # OEM/IP
    "04_7":  "MOQ谈判与散货处理",      # MOQ
    "04_8":  "海外制裁名单筛查",       # 俄罗斯制裁
    "04_9":  "特殊品类出口规范",       # 特殊品类
    "04_10": "选品数据工具",          # 外贸工具

    # -- 文件05：SOHO创业与新人生存 --
    "05_1":  "SOHO创业起步指南",       # SOHO起步
    "05_2":  "SOHO创业起步指南",       # SOHO身份包装
    "05_3":  "外贸面试求职技巧",       # 面试
    "05_4":  "外贸展会获客跟进",       # 展会攻略
    "05_5":  "客户接待全流程",         # 接待
    "05_6":  "外贸时间管理与效率",     # 时间管理
    "05_7":  "新手入行必备素养",       # 新人踩坑
    "05_8":  "客户纠纷与投诉处理",     # 纠纷处理
    "05_9":  "外贸企业架构与合作模式",  # 公司注册
    "05_10": "大小客户差异化策略",     # 大小客户策略
    "05_11": "海外客户精准开发渠道",   # 多渠道开发
    "05_12": "外贸心态与成长",        # 心态
}

# ===================== 工具函数 =====================

session = None
_stats = {"categories": 0, "cards_ok": 0, "cards_fail": 0, "cards_total": 0}

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
        if e.code == 409:
            # 已存在 – 不算错误
            return {"_duplicate": True}
        return {"_err": f"HTTP {e.code}: {body[:150]}"}
    except Exception as e:
        return {"_err": str(e)}

def fetch_categories():
    cats = api("GET", "/categories")
    if isinstance(cats, list):
        return cats
    print(f"获取分类失败: {cats}")
    return []

def find_or_create_category(name, parent_id=None):
    """在缓存中查找，找不到就创建"""
    cat_map = _cache["name_map"]
    if name in cat_map:
        return cat_map[name]

    body = {"name": name}
    if parent_id:
        body["parent_id"] = parent_id

    res = api("POST", "/categories", body)
    if isinstance(res, dict) and "id" in res:
        cat_map[name] = res["id"]
        _stats["categories"] += 1
        print(f"  + 创建分类: {name} ({res['id'][:8]}...)", end="")
        if parent_id:
            print(f" -> parent {parent_id[:8]}...", end="")
        print()
        return res["id"]
    elif isinstance(res, dict) and res.get("_duplicate"):
        # 409 → 从全量列表中找
        all_cats = fetch_categories()
        for c in all_cats:
            if c["name"] == name:
                cat_map[name] = c["id"]
                return c["id"]
            for child in c.get("children", []):
                if child["name"] == name:
                    cat_map[name] = child["id"]
                    return child["id"]
        return None
    else:
        print(f"  ! 创建失败: {res}")
        return None

def build_category_tree(existing_cats):
    """根据类目体系表构建完整树，只创建缺失的分类"""
    
    # 查找顶级分类
    global TOP_WM_ID, TOP_KJ_ID
    for c in existing_cats:
        nm = c["name"]
        if nm == "外贸知识体系" and TOP_WM_ID is None:
            TOP_WM_ID = c["id"]
        if nm == "跨境知识体系" and TOP_KJ_ID is None:
            TOP_KJ_ID = c["id"]

    # 创建缺失的顶级分类
    if TOP_WM_ID is None:
        TOP_WM_ID = find_or_create_category("外贸知识体系")
    if TOP_KJ_ID is None:
        TOP_KJ_ID = find_or_create_category("跨境知识体系")

    # 构建缓存: name → id
    cat_map = _cache["name_map"]
    def index_tree(cats):
        for c in cats:
            cat_map[c["name"]] = c["id"]
            for child in c.get("children", []):
                cat_map[child["name"]] = child["id"]
    index_tree(existing_cats)
    # re-index after any new creations
    index_tree(fetch_categories())

    # 哪些一级属于外贸，哪些属于跨境
    wm_first = [
        "外贸新手入门知识","外贸专业术语","外贸全流程实操","外贸客户开发与谈判",
        "外贸单证实操","外贸报关与报检","外贸物流与运输","外贸结算与金融",
        "外贸财税与退税","外贸合规与风控","外贸商务沟通与邮件",
    ]
    kj_first = [
        "跨境选品与供应链","跨境合规与知识产权","跨境本地化运营","跨境工具实操教程",
    ]

    # 创建一级分类
    for fname in wm_first:
        if fname not in cat_map:
            pid = TOP_WM_ID
            find_or_create_category(fname, pid)
    for fname in kj_first:
        if fname not in cat_map:
            pid = TOP_KJ_ID
            find_or_create_category(fname, pid)

    # 构建一级→父ID映射
    first_parent = {}
    for fname in wm_first:
        first_parent[fname] = TOP_WM_ID
    for fname in kj_first:
        first_parent[fname] = TOP_KJ_ID

    # 刷新缓存
    index_tree(fetch_categories())

    # 创建二级分类
    for first, seconds in CATEGORY_TREE.items():
        parent_id = cat_map.get(first)
        if not parent_id:
            print(f"  ! 一级分类不存在: {first}")
            continue
        for sname in seconds:
            if sname not in cat_map:
                find_or_create_category(sname, parent_id)

    # 最终刷新
    index_tree(fetch_categories())


# ===================== 卡片解析 =====================

def parse_cards(content):
    cards = []
    current = None
    section = None
    for line in content.split("\n"):
        m = re.match(r'^##\s*卡片(\d+)｜(.+)', line)
        if m:
            if current:
                cards.append(current)
            current = {"title": f"卡片{m.group(1)}｜{m.group(2).strip()}", "cue": "", "notes": "", "summary": ""}
            section = None
            continue
        if not current:
            continue
        if line.strip() == "---":
            continue
        if re.search(r'线索栏', line):
            section = "cue"; continue
        elif re.search(r'笔记栏', line):
            section = "notes"; continue
        elif re.search(r'总结栏', line):
            section = "summary"; continue
        if section == "cue":
            current["cue"] += line + "\n"
        elif section == "notes":
            current["notes"] += line + "\n"
        elif section == "summary":
            current["summary"] += line + "\n"
    if current:
        cards.append(current)
    return cards

def card_to_api(card, file_key, card_idx):
    cue = card["cue"].strip()
    notes = card["notes"].strip()
    summary = card["summary"].strip()
    md = f"# {card['title']}\n\n## 提示\n{cue}\n\n## 笔记\n{notes}\n\n## 总结\n{summary}"

    override_key = f"{file_key}_{card_idx}"
    category = CARD_TO_CATEGORY.get(override_key)
    if not category:
        print(f"  ! 未找到分类映射: {override_key}")
        category = "其他"

    # 提取标签
    raw = card["title"]
    tags = []
    parts = re.split(r'[｜|/、，,\s:：]+', raw)
    seen = set()
    for p in parts:
        p = p.strip()
        if len(p) >= 2 and not re.match(r'^卡片\d*$', p) and p not in seen:
            tags.append(p)
            seen.add(p)
    tags = tags[:5]

    return {
        "title": card["title"],
        "content_md": md,
        "category": category,
        "tags": tags,
    }


# ===================== 主流程 =====================

_cache = {"name_map": {}}

def main():
    global _cache

    files = [
        "康奈尔卡片_01_付款风控与报价核价.md",
        "康奈尔卡片_02_客户开发与谈判.md",
        "康奈尔卡片_03_供应商管理与单证物流.md",
        "康奈尔卡片_04_市场洞察与合规认证.md",
        "康奈尔卡片_05_SOHO创业与新人生存.md",
    ]

    print("=" * 55)
    print("Step 1: 构建类目树")
    print("=" * 55)
    existing_cats = fetch_categories()
    print(f"现有顶层分类: {len(existing_cats)} 个")
    # 如果已有足够分类（>50），跳过构建
    if len(existing_cats) >= 2 and sum(1 for c in existing_cats for _ in c.get("children", [])) > 20:
        print("分类体系已完备，跳过构建")
        # 重建缓存
        def index_all(cats):
            for c in cats:
                _cache["name_map"][c["name"]] = c["id"]
                for child in c.get("children", []):
                    _cache["name_map"][child["name"]] = child["id"]
        index_all(existing_cats)
    else:
        build_category_tree(existing_cats)
    print(f"创建分类数: {_stats['categories']}")
    print(f"缓存分类数: {len(_cache['name_map'])}")

    print("\n" + "=" * 55)
    print("Step 2: 上传卡片")
    print("=" * 55)

    for filename in files:
        m = re.match(r'康奈尔卡片_(\d+)_.+\.md', filename)
        if not m:
            print(f"[WARN] 跳过: {filename}")
            continue
        file_key = m.group(1)
        filepath = os.path.join(SOURCE_DIR, filename)
        if not os.path.exists(filepath):
            print(f"[WARN] 文件不存在: {filepath}")
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        cards = parse_cards(content)
        print(f"\n[FILE] {filename} -> {len(cards)} cards")

        for idx, card in enumerate(cards, 1):
            _stats["cards_total"] += 1
            api_body = card_to_api(card, file_key, idx)
            cat = api_body["category"]
            title = api_body["title"]

            print(f"  [{cat}] {title} ...", end=" ", flush=True)
            result = api("POST", "/notes", api_body)

            if isinstance(result, dict) and "id" in result:
                print(f"[OK] {result['id'][:12]}")
                _stats["cards_ok"] += 1
            else:
                err = result.get("_err", result.get("error", "?")) if isinstance(result, dict) else str(result)
                print(f"[FAIL] {err}")
                _stats["cards_fail"] += 1

            if _stats["cards_total"] % 5 == 0:
                time.sleep(0.25)

    print(f"\n{'='*55}")
    print(f"完成: 分类{_stats['categories']} | 卡片 {_stats['cards_ok']}/{_stats['cards_total']} 成功")
    if _stats["cards_fail"]:
        print(f"失败: {_stats['cards_fail']} 张")
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
