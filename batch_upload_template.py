# -*- coding: utf-8 -*-
"""
批量上传预先生成的康奈尔卡片数据到 learn.clowand.com。
用法: python batch_upload_template.py <json_data_file>
"""
import json, urllib.request, urllib.error, sys, time

API = "https://learn.clowand.com/api"

def api(method, path, body=None):
    url = API + path
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

def main():
    if len(sys.argv) < 2:
        print("用法: python batch_upload_template.py <data.json>")
        sys.exit(1)
    
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    report = {"total": len(data), "ok": 0, "fail": 0, "results": []}
    
    for i, item in enumerate(data):
        title = item["title"]
        print(f"[{i+1}/{len(data)}] {title[:40]}...", end=" ", flush=True)
        
        res = api("POST", "/notes", item)
        if isinstance(res, dict) and "id" in res:
            print(f"OK {res['id'][:12]}")
            report["ok"] += 1
            report["results"].append({"title": title, "status": "ok"})
        else:
            err = res.get("_err", str(res)[:80])
            print(f"FAIL: {err}")
            report["fail"] += 1
            report["results"].append({"title": title, "status": "fail", "error": err})
        
        if (i + 1) % 10 == 0:
            time.sleep(0.3)
    
    print(f"\n完成: {report['ok']} OK / {report['fail']} FAIL / {report['total']} TOTAL")
    report_path = sys.argv[1].replace(".json", "_upload_report.json")
    json.dump(report, open(report_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"报告: {report_path}")

if __name__ == "__main__":
    main()