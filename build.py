import os
SRC = r"C:/Users/Administrator/.accio/accounts/1754518429/agents/MID-34518429U1775887-BC56CE-1468-089A69/project/learn-site/src"
def w(path, content):
    fp = os.path.join(SRC, path)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    with open(fp, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK:", path)
