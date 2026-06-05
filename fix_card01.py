import urllib.request, json, re

md = """## 卡片1|付款方式：T/T vs L/C
### 🔍 线索栏（提问自测）
外贸常见付款方式有哪些？各有什么适用场景？
### 📝 笔记栏（核心知识点）
1. **T/T电汇**：新客户首选30%预付+70%见提单副本；老客户可谈30天账期但需中信保
2. **L/C信用证**：审核交单条件，确定单据可提供；约定不符点扣款标准（50-200美金/处）
3. **L/C费用**：银行费用按总金额3%估算，报价时需计入
4. **空运严控**：空运无需正本提单控货，必须坚持发货前付清全款
5. **安全铁律**：货权必须掌握在自己手里直到收到全款
### ✅ 总结栏（精简口诀）
新客预付见提单，老客账期中信保；货权不到手不放款。"""

lines = md.strip().split('\n')
cue = notes = summary = ''
section = None
for line in lines:
    if re.search(r'线索栏', line): section = 'cue'; continue
    elif re.search(r'笔记栏', line): section = 'notes'; continue
    elif re.search(r'总结栏', line): section = 'summary'; continue
    if section == 'cue': cue += line + '\n'
    elif section == 'notes': notes += line + '\n'
    elif section == 'summary': summary += line + '\n'

title = '卡片1|付款方式：T/T vs L/C'
api_md = f'# {title}\n\n## 提示\n{cue.strip()}\n\n## 笔记\n{notes.strip()}\n\n## 总结\n{summary.strip()}'

body = json.dumps({
    'title': title,
    'content_md': api_md,
    'category': '外贸主流付款方式',
    'tags': ['付款方式', 'T/T', 'L/C', '外贸结算']
}).encode()

req = urllib.request.Request('https://learn.clowand.com/api/notes', data=body, method='POST')
req.add_header('Content-Type', 'application/json')
try:
    resp = urllib.request.urlopen(req, timeout=30)
    result = json.loads(resp.read())
    print(f'SUCCESS: id={result.get("id","?")[:12]}')
    print(f'category={result.get("category")}')
    print(f'title={result.get("title")}')
except urllib.error.HTTPError as e:
    err = e.read().decode()
    print(f'HTTP {e.code}: {err[:300]}')
except Exception as e:
    print(f'Error: {type(e).__name__}: {e}')
