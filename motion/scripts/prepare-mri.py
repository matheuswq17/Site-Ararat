"""Prepara a imagem-base e o mapa de sobreposição da jornada (rodada 02).

Entrada (somente leitura): references/imaging/mri-axial-demo.png e mri-axial-segmentation.png
Saída: deliverables/assets/mri-base.webp, deliverables/assets/mri-map.json, review/mri-masks-check.png

Requisitos (ferramenta de produção, não runtime): Python 3, numpy, Pillow (com WebP), scikit-image, scipy.
Uso: python scripts/prepare-mri.py [pasta-de-references-imaging]
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from skimage import measure

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "references" / "imaging"
OUT = ROOT / "deliverables" / "assets"
OUT.mkdir(parents=True, exist_ok=True)
(ROOT / "review").mkdir(exist_ok=True)

demo_rgb = Image.open(SRC / "mri-axial-demo.png").convert("RGB")
seg_rgb = Image.open(SRC / "mri-axial-segmentation.png").convert("RGB")
demo = np.asarray(demo_rgb.convert("L")).astype(np.float64)
seg = np.asarray(seg_rgb).astype(np.int32)
H0, W0 = demo.shape

# 1) Registro: o PNG segmentado é a mesma grade de pixels (recorte 808x801 a partir de 0,0).
sg = seg.mean(2)
sat = seg.max(2) - seg.min(2)
gray_px = sat < 15
h, w = sg.shape
reg_err = float(np.abs(demo[:h, :w] - sg)[gray_px].mean())
assert reg_err < 0.5, f"registro inesperado (erro médio {reg_err:.2f})"

# 2) Recorte das bordas pretas (coluna 0, linha 0 e as 5 últimas colunas sem sinal).
col_mean = demo.mean(0)
row_mean = demo.mean(1)
x0 = int(np.argmax(col_mean > 1))
x1 = int(W0 - np.argmax(col_mean[::-1] > 1))
y0 = int(np.argmax(row_mean > 1))
y1 = int(H0 - np.argmax(row_mean[::-1] > 1))
base = demo_rgb.crop((x0, y0, x1, y1)).convert("L")
BW, BH = base.size
base_arr = np.asarray(base).astype(np.float64)

# 3) Máscaras a partir das cores da sobreposição (mesmas coordenadas, deslocadas pelo recorte).
r, g, b = seg[..., 0], seg[..., 1], seg[..., 2]
colored = sat > 25
orange = colored & (r > g + 30) & (b < g)
full = np.zeros((H0, W0), bool)
full[:h, :w] = colored
roi_full = np.zeros((H0, W0), bool)
roi_full[:h, :w] = orange


def clean(mask):
    lab, n = ndimage.label(mask)
    if n == 0:
        return mask
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    keep = lab == (int(np.argmax(sizes)) + 1)
    keep = ndimage.binary_closing(keep, iterations=2)
    return ndimage.binary_fill_holes(keep)


gland_m = clean(full)[y0:y1, x0:x1]
roi_m = clean(roi_full)[y0:y1, x0:x1]


def to_path(mask, tol=0.6, sigma=1.2):
    sm = ndimage.gaussian_filter(mask.astype(float), sigma)
    cs = measure.find_contours(np.pad(sm, 1), 0.5)
    c = max(cs, key=len) - 1  # (row, col)
    c = measure.approximate_polygon(c, tolerance=tol)
    pts = [(round(float(p[1]) + 0.5, 1), round(float(p[0]) + 0.5, 1)) for p in c[:-1]]
    d = "M" + "L".join(f"{x} {y}" for x, y in pts) + "Z"
    return d, pts


gland_d, gland_pts = to_path(gland_m)
roi_d, roi_pts = to_path(roi_m)


def stats(mask):
    ys, xs = np.nonzero(mask)
    return {
        "centroid": [round(float(xs.mean()) + 0.5, 1), round(float(ys.mean()) + 0.5, 1)],
        "bbox": [int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)],
        "areaPx": int(mask.sum()),
    }


g_st, r_st = stats(gland_m), stats(roi_m)

# 4) Recorte de amostra (textura) centrado na região, inteiro dentro da máscara quando possível.
cx, cy = r_st["centroid"]
size = 64
best = None
for dy in range(-20, 21, 2):
    for dx in range(-20, 21, 2):
        sx, sy = int(round(cx - size / 2 + dx)), int(round(cy - size / 2 + dy))
        inside = roi_m[sy:sy + size, sx:sx + size].mean()
        score = inside - 0.002 * (dx * dx + dy * dy) ** 0.5
        if best is None or score > best[0]:
            best = (score, sx, sy, inside)
_, csx, csy, inside = best

# 4b) Recorte de exibição da textura (rodada 05): mais amplo, para ser mostrado perto de 1:1 no painel
#     em vez de ampliar 64 px ~2x (o que evidenciava a grade de pixels). Mesmo centro da região.
tsize = 96
tbest = None
for dy in range(-24, 25, 2):
    for dx in range(-24, 25, 2):
        sx, sy = int(round(cx - tsize / 2 + dx)), int(round(cy - tsize / 2 + dy))
        inside_t = roi_m[sy:sy + tsize, sx:sx + tsize].mean()
        score = inside_t - 0.002 * (dx * dx + dy * dy) ** 0.5
        if tbest is None or score > tbest[0]:
            tbest = (score, sx, sy, inside_t)
_, tsx, tsy, tinside = tbest

# 5) Histograma ilustrativo dos valores 8-bit do PNG dentro da região.
vals = base_arr[roi_m]
lo, hi = np.percentile(vals, 1), np.percentile(vals, 99)
hist, edges = np.histogram(np.clip(vals, lo, hi), bins=16, range=(lo, hi))
hist_n = (hist / hist.max()).round(3).tolist()
bin_gray = [int(round((edges[i] + edges[i + 1]) / 2)) for i in range(16)]

# 6) Exportar base (WebP sem perdas: preserva textura; sem upscale, sem filtros).
base_path = OUT / "mri-base.webp"
if base_path.exists() and np.array_equal(np.asarray(Image.open(base_path).convert("L")), np.asarray(base)):
    pass  # base inalterada: preserva o arquivo existente (mesmos pixels)
else:
    base.save(base_path, "WEBP", lossless=True, method=6)

# Resolução efetiva: linhas/colunas duplicadas indicam ampliação ~2x por vizinho mais próximo.
dup_r = int(sum(np.abs(base_arr[i] - base_arr[i + 1]).mean() < 0.5 for i in range(BH - 1)))
dup_c = int(sum(np.abs(base_arr[:, i] - base_arr[:, i + 1]).mean() < 0.5 for i in range(BW - 1)))

mri_map = {
    "schemaVersion": 1,
    "image": "assets/mri-base.webp",
    "width": BW,
    "height": BH,
    "coordinateSystem": "pixels da imagem-base exportada; origem no canto superior esquerdo; x para a direita, y para baixo",
    "orientation": "axial, conforme a fonte (sem espelhamento nem rotação)",
    "glandPath": gland_d,
    "roiPath": roi_d,
    "gland": g_st,
    "roi": {**r_st, "label": "subregião central da segmentação demonstrativa de origem (exemplo didático)"},
    "sampleCrop": {"x": csx, "y": csy, "size": size, "insideRoi": round(float(inside), 3)},
    "textureCrop": {"x": tsx, "y": tsy, "size": tsize, "insideRoi": round(float(tinside), 3), "note": "recorte de exibição do painel Textura (v0.4): mostrado a ~1:1, sem ampliar a grade de pixels"},
    "intensityHistogram": {
        "bins": hist_n,
        "binGray": bin_gray,
        "note": "Ilustrativo: valores 8-bit do PNG renderizado dentro da região. Não é feature radiômica (DICOM), sem unidade física.",
    },
    "resolution": {
        "fileWidth": BW,
        "fileHeight": BH,
        "duplicatedRows": dup_r,
        "duplicatedColumns": dup_c,
        "effective": f"≈{BW - dup_c}×{BH - dup_r} px distintos: a fonte já é uma ampliação ~2× por vizinho mais próximo",
        "maxRecommendedCssScale": 1.3,
    },
    "metadata": {
        "source": "references/imaging/mri-axial-demo.png (cópia do maestro de C:/Site_ararat/assets/img/, site anterior)",
        "maskSource": "references/imaging/mri-axial-segmentation.png — sobreposição colorida na mesma grade de pixels (deslocamento 0, erro médio %.3f nos pixels cinza)" % reg_err,
        "crop": {"x": x0, "y": y0, "width": BW, "height": BH, "sourceSize": [W0, H0]},
        "nature": "Imagem demonstrativa e máscaras demonstrativas. Não processada pelo ARARAT, não validada clinicamente; a região não representa lesão.",
        "glandPathFrom": "união das cores da sobreposição (contorno suavizado σ=1,2 px, tolerância 0,6 px)",
        "roiPathFrom": "componente laranja central da sobreposição",
        "license": "PENDENTE — autoria, licença e desidentificação não confirmadas",
        "deidentification": "PENDENTE",
        "clinicalValidation": False,
    },
}
(OUT / "mri-map.json").write_text(json.dumps(mri_map, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# 7) Prova de alinhamento: base + contornos + recorte.
chk = base.convert("RGB").resize((BW * 2, BH * 2), Image.NEAREST)
dr = ImageDraw.Draw(chk)
dr.line([(x * 2, y * 2) for x, y in gland_pts + gland_pts[:1]], fill=(245, 247, 250), width=2)
dr.line([(x * 2, y * 2) for x, y in roi_pts + roi_pts[:1]], fill=(212, 175, 55), width=2)
dr.rectangle([csx * 2, csy * 2, (csx + size) * 2, (csy + size) * 2], outline=(225, 196, 101), width=2)
gx, gy, gw, gh = g_st["bbox"]
pad = 40
chk.crop(((gx - pad) * 2, (gy - pad) * 2, (gx + gw + pad) * 2, (gy + gh + pad) * 2)).save(ROOT / "review" / "mri-masks-check.png")
print(json.dumps({k: mri_map[k] for k in ("width", "height", "gland", "roi", "sampleCrop", "textureCrop", "resolution")}, ensure_ascii=False))
print("base bytes", base_path.stat().st_size)
