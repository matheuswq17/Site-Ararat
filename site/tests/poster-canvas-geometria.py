# Análise dos pares poster|canvas de tests/poster-canvas-geometria.mjs (rodada 5).
# Para cada par (pixels do canvas; k = densidade):
#  · luminância acima do fundo (#0D1B2A) = "tinta"; desfoque gaussiano σ = 1,5 px do canvas (some a
#    diferença de amostragem de linhas de 1 px, preserva posição e forma do desenho);
#  · DESLOCAMENTO: correlação de fase entre os desfocados, com pico subpixel (parábola) → em px CSS;
#  · ESCALA/ESTIRAMENTO: correlação de fase também no terço esquerdo e no terço direito; a diferença
#    entre os dois deslocamentos (px CSS) acusa escala ou corte lateral. (Uma "extensão" por limiar
#    de brilho foi testada e descartada: o limiar cruza a cauda esmaecida das encostas em pontos
#    diferentes por 1 nível de brilho — 3 a 30 px de "extensão" sem deslocamento algum, conferido por
#    ampliação. Fica só informativa.)
#  · RESÍDUO: diferença média absoluta (0–255) entre os desfocados depois de aplicar o deslocamento;
#  · ESPESSURA: razão de tinta total poster ÷ canvas (sem desfoque).
# Classificação: "deslocamento real" se |desl.| > 1 px CSS ou extensão difere > 2 px CSS;
# "reamostragem" se isso não ocorre mas a métrica bruta da suíte (lum > 90, ± 3 px) falharia.
#   python3 tests/poster-canvas-geometria.py <pasta>
import json, sys
import numpy as np
from PIL import Image

d = sys.argv[1]
idx = json.load(open(f"{d}/indice.json"))
BG = (13 + 27 + 42) / 3

def gblur(a, s):
    r = int(3 * s) + 1
    x = np.arange(-r, r + 1); g = np.exp(-x * x / (2 * s * s)); g /= g.sum()
    a = np.apply_along_axis(lambda v: np.convolve(v, g, mode="same"), 0, a)
    return np.apply_along_axis(lambda v: np.convolve(v, g, mode="same"), 1, a)

def phase_shift(a, b):
    A, B = np.fft.fft2(a), np.fft.fft2(b)
    R = A * np.conj(B); R /= np.abs(R) + 1e-9
    c = np.fft.ifft2(R).real
    y, x = np.unravel_index(np.argmax(c), c.shape)
    def sub(arr, i, n):
        l, m, r = arr[(i - 1) % n], arr[i], arr[(i + 1) % n]
        den = l - 2 * m + r
        return i + (0.5 * (l - r) / den if den != 0 else 0)
    sy, sx = sub(c[:, x], y, c.shape[0]), sub(c[y, :], x, c.shape[1])
    if sy > c.shape[0] / 2: sy -= c.shape[0]
    if sx > c.shape[1] / 2: sx -= c.shape[1]
    return sx, sy  # quanto o poster (a) está deslocado em relação ao canvas (b)

def raw_extent(L):
    cols = np.where((L > 90).any(axis=0))[0]
    return (int(cols[0]), int(cols[-1])) if len(cols) else (None, None)

rows = []
for e in idx:
    im = np.asarray(Image.open(f"{d}/{e['arquivo']}").convert("L"), dtype=float)
    H = e["H"]; P, C = im[:H], im[H:2 * H]
    k = e["k"]
    tP, tC = np.clip(P - BG, 0, None), np.clip(C - BG, 0, None)
    bP, bC = gblur(tP, 1.5), gblur(tC, 1.5)
    sx, sy = phase_shift(bP, bC)
    # resíduo após alinhar (deslocamento inteiro mais próximo)
    ix, iy = int(round(sx)), int(round(sy))
    al = np.roll(np.roll(bP, -iy, axis=0), -ix, axis=1)
    m = 8
    res = float(np.abs(al[m:-m, m:-m] - bC[m:-m, m:-m]).mean())
    def ext(b):
        thr = 0.30 * b.max(); cols = np.where((b >= thr).any(axis=0))[0]
        return (cols[0] / k, cols[-1] / k) if len(cols) else (None, None)
    eP, eC = ext(bP), ext(bC)
    rP, rC = raw_extent(P), raw_extent(C)
    raw_fail = rP[0] is not None and rC[0] is not None and (abs(rP[0] - rC[0]) / k > 3 or abs(rP[1] - rC[1]) / k > 3)
    thick = float(tP.sum() / max(tC.sum(), 1))
    dx, dy = sx / k, sy / k
    dext = max(abs(eP[0] - eC[0]), abs(eP[1] - eC[1]))
    Wd = bP.shape[1] // 3
    lx, ly = phase_shift(bP[:, :Wd], bC[:, :Wd])
    rx, ry = phase_shift(bP[:, -Wd:], bC[:, -Wd:])
    esc = max(abs(lx - rx), abs(ly - ry)) / k
    real = abs(dx) > 1 or abs(dy) > 1 or esc > 1
    rows.append({**{x: e[x] for x in ("w", "dpr", "variant", "slotW")}, "desloc_css": [round(dx, 2), round(dy, 2)], "ext_poster_css": [round(eP[0], 1), round(eP[1], 1)], "ext_canvas_css": [round(eC[0], 1), round(eC[1], 1)], "dif_ext_css_informativo": round(dext, 2), "terco_esq_css": [round(lx / k, 2), round(ly / k, 2)], "terco_dir_css": [round(rx / k, 2), round(ry / k, 2)], "estiramento_css": round(esc, 2), "residuo": round(res, 2), "espessura": round(thick, 3), "bruto_falharia": bool(raw_fail), "classe": "deslocamento real" if real else ("reamostragem" if raw_fail or abs(thick - 1) > 0.15 else "ok")})
for r in rows:
    print(f"{r['w']:>4} DPR{r['dpr']} {r['variant']:<36} desl {r['desloc_css'][0]:+.2f},{r['desloc_css'][1]:+.2f} px · estir. {r['estiramento_css']:.2f} px · resíduo {r['residuo']:.2f} · traço {r['espessura']:.3f} · bruto {'falha' if r['bruto_falharia'] else 'ok'} → {r['classe']}")
cls = {}
for r in rows: cls[r["classe"]] = cls.get(r["classe"], 0) + 1
print("resumo:", cls)
json.dump({"casos": rows, "resumo": cls}, open(f"{d}/geometria.json", "w"), indent=1, ensure_ascii=False)
