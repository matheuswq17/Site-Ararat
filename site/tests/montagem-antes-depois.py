# Antes × depois por seção e página inteira (após tests/capture-pagina.mjs nas duas pastas).
#   python3 tests/montagem-antes-depois.py <antes> <depois> <saída>
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
a_dir, d_dir, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
names = sorted(set(os.path.basename(f) for f in glob.glob(f"{a_dir}/*.png")) & set(os.path.basename(f) for f in glob.glob(f"{d_dir}/*.png")))
for n in names:
    A = Image.open(f"{a_dir}/{n}").convert("RGB"); D = Image.open(f"{d_dir}/{n}").convert("RGB")
    W = A.width + D.width + 60; H = max(A.height, D.height) + 50
    c = Image.new("RGB", (W, H), (245, 247, 250)); g = ImageDraw.Draw(c)
    g.text((20, 12), "antes", fill=(13, 27, 42), font=F); g.text((A.width + 40, 12), "depois", fill=(13, 27, 42), font=F)
    c.paste(A, (20, 46)); c.paste(D, (A.width + 40, 46))
    if c.width > 2400: c = c.resize((2400, int(c.height * 2400 / c.width)))
    c.save(f"{out}/{n}")
print(len(names), "montagens")
