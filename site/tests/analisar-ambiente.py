# Movimento VISÍVEL do ambiente em repouso, medido no vídeo da página real (tests/record-ambiente.mjs).
# Quadros a 10 fps, só a área da arte vista antes da dobra. Para cada quadro: fração de pixels
# que mudaram > LIMIAR níveis em relação ao quadro 0,5 s antes (compressão do vídeo dá ruído de
# poucos níveis), e a maior variação de luminância. Mede a partir do assentamento (ASSENTA s).
# Também: "flash" = fração de pixels quase brancos (> 235) por quadro nos primeiros segundos.
#   python3 tests/analisar-ambiente.py <pasta> <rótulo> [<rótulo> ...]
import json, subprocess, sys, os, glob
import numpy as np
from PIL import Image

LIMIAR = 14
ASSENTA = 3.0  # s desde o início do vídeo (abertura ~1,2 s + carga)
d = sys.argv[1]
labels = sys.argv[2:]
rows = {}
for lab in labels:
    for vid in sorted(glob.glob(f"{d}/ambiente-{lab}-*.webm")):
        vp = vid.rsplit("-", 1)[1].replace(".webm", "")
        info = json.load(open(f"{d}/area-{lab}-{vp}.json"))
        a = info["area"]
        tmp = f"/tmp/amb-{lab}-{vp}"
        os.makedirs(tmp, exist_ok=True)
        for f in glob.glob(f"{tmp}/*.png"): os.remove(f)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-i", vid, "-vf", f"fps=10,crop={a['w']}:{a['h']}:{a['x']}:{a['y']}", f"{tmp}/f%04d.png"], check=True)
        frames = sorted(glob.glob(f"{tmp}/*.png"))
        L = [np.asarray(Image.open(f).convert("L"), dtype=np.int16) for f in frames]
        n = len(L)
        changed, maxd, white = [], [], []
        for i in range(n):
            white.append(float((L[i] > 235).mean()))
            if i >= 5:
                dif = np.abs(L[i] - L[i - 5])
                changed.append(float((dif > LIMIAR).mean()))
                maxd.append(int(dif.max()))
        t0 = int(ASSENTA * 10)
        after = changed[max(0, t0 - 5):]
        # primeiro instante (após o assentamento) com mudança perceptível: > 0,2 % da área
        first = next((i + 5 for i, c in enumerate(changed) if i + 5 >= t0 and c > 0.002), None)
        rows[f"{lab} {vp}"] = {
            "quadros": n,
            "mudanca_media_pct": round(100 * float(np.mean(after)), 3),
            "mudanca_p90_pct": round(100 * float(np.percentile(after, 90)), 3),
            "quadros_com_mudanca_pct": round(100 * float(np.mean([c > 0.002 for c in after])), 1),
            "maior_variacao": int(max(maxd[max(0, t0 - 5):])),
            "primeira_mudanca_s": round(first / 10, 1) if first else None,
            # quadros iniciais em branco são do gravador antes da 1ª pintura: conta a partir dela
            "branco_max_pct_3s": round(100 * max(white[next(i for i, x in enumerate(white) if x < 0.5):][:30]), 3),
        }
        # curva no tempo (para o gráfico)
        json.dump({"changed": changed, "white": white}, open(f"{d}/curva-{lab}-{vp}.json", "w"))
print(json.dumps(rows, indent=1, ensure_ascii=False))
json.dump(rows, open(f"{d}/movimento-{'-'.join(labels)}.json", "w"), indent=1, ensure_ascii=False)
