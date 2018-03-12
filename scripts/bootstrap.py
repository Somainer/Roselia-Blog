#!/usr/bin/env python
from PIL import Image
import os
import shutil
import sys
import re
sys.path.append(os.path.join("..", "api_server"))
from config import BLOG_INFO, COLOR

MX_WIDTH = 1024
staticPath = os.path.join("..", "static_assets")
digestPath = staticPath.replace("static_assets", "static")
renderFiles = [
    os.path.join(digestPath, "css", "roselia.css"),
    os.path.join(digestPath, "js", "utils.js")
]

REPLACEMENT = dict(BLOG_INFO, COLOR)

print("Start building assets...")
print("Step#1 creating & copying dir:", staticPath, '=>', digestPath)
if os.path.exists(digestPath):
    print("  previous version found, removing...")
    shutil.rmtree(digestPath)
shutil.copytree(staticPath, digestPath)
PIC_COMP = ['jpg', 'jpeg', 'png']
print("Step#2 compressing images...")
for p, d, f in os.walk(digestPath):
    if len(f): print('  |> In dir:', p)
    for tf in f:
        postfix = tf.split('.')[-1]
        if postfix.lower() in PIC_COMP:
            dep = len(p.split(os.pathsep)) + 1
            print('  '*dep, '|>', tf)
            path = os.path.join(p, tf)
            im = Image.open(path)
            w, h = im.size
            if w > MX_WIDTH:
                h = h * MX_WIDTH // w
                w = MX_WIDTH
            print('  '*(dep+1), "=> {} * {}".format(w, h))
            im = im.resize((w, h), Image.ANTIALIAS)
            im.save(path)
print("Step#3 Setting up CSS StyleSheets...")
for fs in renderFiles:
    with open(fs, "r") as f:
        content = f.read()
    content = re.sub(r"{{\s*(.*?)\s*}}", lambda x: REPLACEMENT.get(x.group(1), x.group(0)), content)
    with open(fs, "w") as f:
        f.write(content)
print("Step#4 compressing javascripts...")
os.system("node build-assets.js -s {} -d {}".format(digestPath, digestPath))
print("Finished!")