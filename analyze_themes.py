# -*- coding: utf-8 -*-
"""分析1577个学习文件的主题分布"""
import json, re, collections

d = json.load(open("triage_result.json", encoding="utf-8"))

kw = {
    "选品/产品研究": "选品|产品研究|市场调研|品类分析|热卖|Best.?Seller|BSR|新品",
    "Listing优化": "listing|标题|Bullet|五点|图片|主图|A\\+|EBC|视频|优化.*页面",
    "PPC/广告": "广告|PPC|SP|SB|SD|竞价|ACoS|投放|关键词.*广告",
    "品牌/旗舰店": "品牌|旗舰店|Brand|旗舰|注册.*品牌|备案|品牌故事",
    "物流/仓储": "物流|FBA|仓储|头程|发货|配送|运输|关税|清关",
    "合规/认证": "合规|认证|CE|FDA|FCC|UL|CPC|专利|商标|侵权",
    "运营/策略": "运营|打法|策略|技巧|优化|提高|增长|小卖家|新手|避坑",
    "申诉/账号": "申诉|账号|关联|被封|审核|KYC|二审|解封|被关",
    "工具/软件": "工具|软件|插件|ERP|JS|Helium|H10|Sif|DeepSeek|AI",
    "供应链/1688": "供应链|1688|拿货|工厂|采购|供应商|成本|备货",
    "评价/评论": "评价|评论|Review|Feedback|Rating|留评|差评",
    "报告/趋势": "趋势|报告|预测|\\d{4}|分析|洞察|白皮书",
    "TikTok/社媒": "TikTok|社媒|社交媒体|网红|红人|短视频",
}

cnt = collections.Counter()
unsorted = []
for r in d["learn"]:
    n = r["name"]
    matched = False
    for k, pat in kw.items():
        if re.search(pat, n, re.I):
            cnt[k] += 1
            matched = True
            break
    if not matched:
        unsorted.append(r)

print("=== 主题分布(文件名模糊匹配) ===")
for k, v in cnt.most_common():
    print(f"  {k}: {v}")
print(f"\n匹配率: {sum(cnt.values())}/{len(d['learn'])}")
print(f"未匹配: {len(unsorted)}")
print("\n=== 未匹配文件(前50个) ===")
for r in unsorted[:50]:
    print(f"  {r['name'][:65]}  (body={r.get('tbody','?')})")