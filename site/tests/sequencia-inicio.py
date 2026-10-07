# Sequência dos primeiros segundos da carga (poster → módulo → início do ambiente) a partir de
# tests/record-ambiente.mjs: quadros a cada 0,25 s de 0,5 a 4,5 s, numa prancha com o tempo.
#   python3 tests/sequencia-inicio.py <pasta> <rótulo> <vp>
import sys, subprocess, glob, os
from PIL import Image, ImageDraw, ImageFont
d, lab, vp = sys.argv[1:4]
vid = f"{d}/ambiente-{lab}-{vp}.webm"
tmp = f"/tmp/seq-{lab}-{vp}"; os.makedirs(tmp, exist_ok=True)
for f in glob.glob(f"{tmp}/*.png"): os.remove(f)
subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", "0.5", "-t", "4.25", "-i", vid, "-vf", "fps=4", f"{tmp}/f%03d.png"], check=True)
fs = sorted(glob.glob(f"{tmp}/*.png"))
ims = [Image.open(f).convert("RGB") for f in fs]
w = 360 if ims[0].width > 700 else 200
ims = [i.resize((w, int(i.height * w / i.width))) for i in ims]
cols = 6; rows = (len(ims) + cols - 1) // cols
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
c = Image.new("RGB", (cols * (w + 8) + 8, rows * (ims[0].height + 26) + 8), (245, 247, 250)); g = ImageDraw.Draw(c)
for k, im in enumerate(ims):
    x = 8 + (k % cols) * (w + 8); y = 8 + (k // cols) * (ims[0].height + 26)
    g.text((x, y), f"{0.5 + k * 0.25:.2f} s", fill=(13, 27, 42), font=F); c.paste(im, (x, y + 20))
c.save(f"{d}/inicio-{lab}-{vp}.png"); print(f"{d}/inicio-{lab}-{vp}.png", len(ims))
