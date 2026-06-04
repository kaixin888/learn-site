import os, glob
SRC = 'C:/Users/Administrator/.accio/accounts/1754518429/agents/MID-34518429U1775887-BC56CE-1468-089A69/project/learn-site/src'
CONTENT = 'C:/Users/Administrator/.accio/accounts/1754518429/agents/MID-34518429U1775887-BC56CE-1468-089A69/project/learn-site/content'
os.makedirs(SRC+"/components",exist_ok=True)
os.makedirs(SRC+"/app/admin",exist_ok=True)
os.makedirs(SRC+"/app/note/[id]",exist_ok=True)
os.makedirs(SRC+"/app/api/notes/[id]",exist_ok=True)
for tf in glob.glob(CONTENT+"/**/*.txt",recursive=True):
  rel = os.path.relpath(tf,CONTENT).replace("\.txt","")
  fp = os.path.join(SRC,rel)
  os.makedirs(os.path.dirname(fp),exist_ok=True)
  with open(tf,"r",encoding="utf-8") as src:
    data = src.read()
  with open(fp,"w",encoding="utf-8") as dst:
    dst.write(data)
  print("OK:",rel)
