#!/usr/bin/env python3
"""Upload batch DD+EE (10 cards) via API"""
import json, urllib.request, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
with open('_cards_batch5.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)
API = 'https://learn.clowand.com/api/notes'
ok = 0
for i, c in enumerate(cards):
    body = json.dumps(c, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(API, data=body, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        resp = urllib.request.urlopen(req)
        r = json.loads(resp.read())
        slug = r.get('slug', r.get('id', '?'))
        print(f'  [{i+1}/{len(cards)}] OK  {c["title"][:40]} -> {slug}')
        ok += 1
    except Exception as e:
        print(f'  [{i+1}/{len(cards)}] FAIL {c["title"][:40]} -> {e}')
print(f'Done: {ok}/{len(cards)} uploaded')
