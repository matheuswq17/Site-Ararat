# Montagem da prova visual de carregamento das fontes (após tests/capture-fontes.mjs).
#   python3 tests/montagem-fontes.py [pasta]   (padrão: screenshots/previa-refinada)
import sys
from PIL import Image, ImageDraw, ImageFont
base = sys.argv[1] if len(sys.argv) > 1 else "screenshots/previa-refinada"
d = f"{base}/fontes"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
items = [("atraso-1500ms-previa-a-block", "/previa/a · fontes atrasadas · 1,5 s (block)"),
         ("atraso-1500ms-refinada-swap", "refinada · fontes atrasadas · 1,5 s (swap+reserva)"),
         ("404-refinada-reserva", "refinada · fontes com 404 (reserva)"),
         ("normal-refinada", "refinada · carga normal")]
for t in ["1440x900", "390x844"]:
    wide = t.startswith("1440")
    F = ImageFont.truetype(FONT, 18 if wide else 13)
    ims = [Image.open(f"{d}/{t}-{k}.png").convert("RGB") for k, _ in items]
    sc = (700 if wide else 390) / ims[0].width
    ims = [i.resize((int(i.width * sc), int(i.height * sc))) for i in ims]
    W = sum(i.width for i in ims) + 20 * 5
    H = ims[0].height + 60
    c = Image.new("RGB", (W, H), (245, 247, 250)); g = ImageDraw.Draw(c); x = 20
    for (k, l), i in zip(items, ims):
        c.paste(i, (x, 50)); g.text((x, 8 if not wide else 14), l if wide else l.replace(" · ", "\n", 1), fill=(13, 27, 42), font=F); x += i.width + 20
    c.save(f"{base}/fontes-{t}.png"); print(t, c.size)
