# Plano 006 — movimento visível DURANTE AS PARADAS de tests/record-passagem-ambiente.mjs.
# Em cada parada a rolagem está parada (p constante nas amostras da página); toda mudança abaixo do
# cabeçalho vem da cena. Capturas da própria página a cada 0,5 s; mudança = fração de pixels com
# diferença > 14 níveis entre capturas consecutivas (0,5 s); o 1º par é descartado (assentamento).
#   python3 tests/analisar-passagem.py <pasta> <rótulo> [<rótulo> …]
import json, sys, os, glob
import numpy as np
from PIL import Image
LIMIAR = 14
d = sys.argv[1]
res = {}
for lab in sys.argv[2:]:
    for js in sorted(glob.glob(f"{d}/passagem-{lab}-*.json")):
        info = json.load(open(js))
        key = os.path.basename(js)[9:-5]
        pas = js[:-5] + "-paradas"
        row = {"versao": info["version"]}
        amb = info["amb"]
        for m in info["marks"]:
            fs = sorted(glob.glob(f"{pas}/{m['k']}-*.png"))
            L = [np.asarray(Image.open(f).convert("L"), dtype=np.int16) for f in fs]
            ch = [float((np.abs(L[i] - L[i - 1]) > LIMIAR).mean()) for i in range(2, len(L))]
            near = sorted(set(s[1] for s in amb if s[1] and abs(s[2] - m["p"]) < 0.002))
            row[m["k"]] = {
                "p": m["p"], "scrollY": m["scrollY"],
                "mudanca_media_pct": round(100 * float(np.mean(ch)), 3) if ch else None,
                "mudanca_max_pct": round(100 * float(np.max(ch)), 3) if ch else None,
                "pares_com_mudanca": f"{sum(c > 0.0005 for c in ch)}/{len(ch)}",
                "data_ambient": near,
            }
        res[key] = row
print(json.dumps(res, indent=1, ensure_ascii=False))
json.dump(res, open(f"{d}/paradas-{'-'.join(sys.argv[2:])}.json", "w"), indent=1, ensure_ascii=False)
