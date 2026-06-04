import os, json, glob
SRC = r'C:/Users/Administrator/.accio/accounts/1754518429/agents/MID-34518429U1775887-BC56CE-1468-089A69/project/learn-site/src'
CT = r'C:/Users/Administrator/.accio/accounts/1754518429/agents/MID-34518429U1775887-BC56CE-1468-089A69/project/learn-site/content'
os.makedirs(SRC+'/components',exist_ok=True)
os.makedirs(SRC+'/app/admin',exist_ok=True)
os.makedirs(SRC+'/app/note/[id]',exist_ok=True)
os.makedirs(SRC+'/app/api/notes/[id]',exist_ok=True)
os.makedirs(CT+'/components',exist_ok=True)
os.makedirs(CT+'/app/admin',exist_ok=True)
os.makedirs(CT+'/app/note/[id]',exist_ok=True)
os.makedirs(CT+'/app/api/notes/[id]',exist_ok=True)
os.makedirs(CT+'/app',exist_ok=True)

def w(name, content):
    fp = os.path.join(CT, name)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    print('CT OK:', name)

def deploy():
    for tf in glob.glob(CT+'/**/*.txt',recursive=True):
        rel = os.path.relpath(tf, CT).replace('\\','/').replace('.txt','.tsx')
        fp = os.path.join(SRC, rel)
        os.makedirs(os.path.dirname(fp),exist_ok=True)
        with open(tf,'r',encoding='utf-8') as src:
            data = src.read()
        # 解码 node -e 写入时产生的转义字符
        data = data.replace('\\x22', '"').replace('\\x27', "'")
        with open(fp,'w',encoding='utf-8') as dst:
            dst.write(data)
        print('DEPLOY OK:', rel)

if __name__ == '__main__':
    deploy()
