# -*- coding: utf-8 -*-
"""
创建跨境电商类目体系到 learn.clowand.com

归在「跨境知识体系」顶级分类下（已存在）。
新增一级分类 + 二级分类。

运行前确认：跨境知识体系 ID 为 KJ_TOP_ID（从 API GET 获取）
"""
import urllib.request, urllib.error, json, sys, time

API = "https://learn.clowand.com/api"

def api(method, path, body=None):
    url = API + path
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        b = e.read().decode("utf-8", errors="replace")
        if e.code == 409:
            return {"_dup": True, "msg": b}
        return {"_err": f"HTTP {e.code}: {b[:200]}"}
    except Exception as e:
        return {"_err": str(e)}

# 获取现有顶级分类
cats = api("GET", "/categories")
kj_id = None
for c in cats:
    if c["name"] == "跨境知识体系":
        kj_id = c["id"]
        # 索引现有子分类
        existing = {}
        for ch in c.get("children", []):
            existing[ch["name"]] = ch["id"]
            for gch in ch.get("children", []):
                existing[gch["name"]] = gch["id"]
        break

if not kj_id:
    print("ERROR: 未找到跨境知识体系顶级分类")
    sys.exit(1)

print(f"跨境知识体系 ID: {kj_id}")
print(f"现有分类数: {len(existing)}")

# ---- 跨境电商一级分类 + 二级分类 ----
# 注意：大部分要与现有外贸/跨境分类区隔，专门为亚马逊卖家场景设计
CAT_TREE = {
    "亚马逊运营基础": [
        "账号注册与审核", "账号安全与申诉", "亚马逊界面与工具",
        "新手入门必知", "收款与财务设置",
    ],
    "选品与产品调研": [
        "选品方法论", "市场分析与判断", "BSR与竞品分析",
        "侵权与选品避坑", "产品开发",
    ],
    "Listing优化": [
        "标题与Bullet优化", "图片与A+设计", "关键词研究与布局",
        "类目节点与属性", "视频与增强型内容", "Listing诊断与分析",
    ],
    "PPC广告运营": [
        "SP广告(搜索)", "SB广告(品牌)", "SD广告(展示)",
        "竞价策略与预算", "ACoS控制与优化", "广告数据分析",
        "品牌指标与洞察",
    ],
    "品牌与旗舰店": [
        "品牌注册与备案", "品牌旗舰店搭建", "A+内容与品牌故事",
        "Brand Analytics工具", "品牌保护与防跟卖",
    ],
    "运营策略与增长": [
        "推品/爆品打造思路", "促销与优惠券策略", "秒杀与BD/LD",
        "站外引流与Deal", "库存管理与补货", "利润分析",
        "季节性/节日运营", "多站点/多账号运营",
        "跨境物流与FBA",
    ],
    "工具与服务": [
        "选品工具(JungleScout/H10/Sif)", "运营工具(ERP/插件)",
        "AI工具与自动化", "数据分析工具", "关键词工具",
        "图片与视频制作工具",
    ],
    "行业报告与趋势": [
        "亚马逊年度报告", "品类趋势报告", "市场洞察与分析",
        "政策与规则变化",
    ],
    "会员日与促销": [
        "Prime Day复盘", "黑五/网一", "大促运营策略",
        "Deal提报与审核",
    ],
    "案例分析与选品案例": [
        "每日一店/店铺分析", "品类案例分析", "爆款拆解",
        "失败教训复盘",
    ],
}

created_cats = 0
# 先创建一级分类（parent = kj_id）
for fname in CAT_TREE:
    if fname in existing:
        pid = existing[fname]
        print(f"一级已存在: {fname}")
    else:
        res = api("POST", "/categories", {"name": fname, "parent_id": kj_id})
        if isinstance(res, dict) and "id" in res:
            pid = res["id"]
            existing[fname] = pid
            created_cats += 1
            print(f"+ 创建一级: {fname}")
        elif res.get("_dup"):
            pid = existing.get(fname) or (
                lambda: (api("GET", "/categories"), [
                    c for c in cats if c["name"] == "跨境知识体系"
                ][0])
            )
            print(f"一级已存在(409): {fname}")
            continue
        else:
            print(f"! 创建一级失败 {fname}: {res}")
            continue
    # 创建二级分类
    for sname in CAT_TREE[fname]:
        if sname in existing:
            print(f"  二级已存在: {sname}")
        else:
            res = api("POST", "/categories", {"name": sname, "parent_id": pid})
            if isinstance(res, dict) and "id" in res:
                existing[sname] = res["id"]
                created_cats += 1
                print(f"  + 创建二级: {sname}")
            elif res.get("_dup"):
                print(f"  二级已存在(409): {sname}")
            else:
                print(f"  ! 创建二级失败 {sname}: {res}")
    time.sleep(0.05)

print(f"\n创建完成: 新增 {created_cats} 个分类")
# 将所有分类名→ID 映射持久化
json.dump(existing, open("category_map.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"分类映射已保存到 category_map.json ({len(existing)} 条)")