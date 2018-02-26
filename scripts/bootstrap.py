#!/usr/bin/env python
from PIL import Image
import os
import shutil
MX_WIDTH = 1024
staticPath = os.path.join("..", "static_assets")
digestPath = staticPath.replace("static_assets", "static")
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
print("Step#3 compressing javascripts...")
os.system("node build-assets.js {} {}".format(staticPath, digestPath))
print("Finished!")