/**
 * Fonte única da RM demonstrativa usada por hero, jornada (fallback) e
 * explicabilidade. Todas as sobreposições usam coordenadas em pixels desta
 * mesma imagem (viewBox = 0 0 width height), garantindo a mesma transformação.
 *
 * Origem da base do site: references/imaging/mri-axial-demo.png (cópia feita
 * pelo maestro a partir do site anterior). Procedência, licença e
 * desidentificação pendentes — ver docs/coordination/status-site.md.
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Pt = { x: number; y: number };

export type MriMap = {
  width: number;
  height: number;
  glandPath: string;
  roiPath: string | null;
  glandBox: Rect;
  roiCenter: Pt | null;
};

export type MriSource = {
  src: string;
  width: number;
  height: number;
  origin: "site" | "motion";
  version: string | null;
  /** Máscaras demonstrativas do pacote Motion; null enquanto não houver pacote ready. */
  map: MriMap | null;
  /** Centro de foco (âncora do arco, das chamadas e da câmera). */
  focus: Pt;
  /** Janela de amostragem da região central (recortes de Dados/Explicabilidade). */
  sample: Rect;
};

/**
 * Base do site: mri-axial-demo.png convertida para WebP sem perdas, com
 * remoção de 1 px de borda preta à esquerda/topo e 5 px à direita (806 × 802).
 * A fonte tem pixels duplicados (resolução efetiva ≈ 406 × 402): exibir até
 * ~800 px CSS evita ampliação excessiva.
 *
 * Foco e janela enquadram a região central da pelve (próstata) por inspeção
 * visual, usando mri-axial-segmentation.png apenas como referência de
 * alinhamento. NÃO são contorno, ROI ou máscara: nenhuma região é desenhada
 * sobre o tecido até existir o mapa demonstrativo do pacote Motion.
 */
export const SITE_MRI: MriSource = {
  src: "/imaging/mri-axial-demo.webp",
  width: 806,
  height: 802,
  origin: "site",
  version: null,
  map: null,
  focus: { x: 379, y: 398 },
  sample: { x: 262, y: 318, w: 234, h: 162 },
};

/** Extrai pares numéricos absolutos de um path SVG (M/L/C/Q/Z) ou de uma lista de pontos. */
export function pathPoints(path: unknown): Pt[] {
  if (Array.isArray(path)) {
    return path
      .map((p) => (Array.isArray(p) ? { x: Number(p[0]), y: Number(p[1]) } : { x: Number(p?.x), y: Number(p?.y) }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  }
  if (typeof path !== "string") return [];
  if (/[a-y]/.test(path.replace(/e-?\d/gi, ""))) return []; // comandos relativos não suportados
  const nums = path.match(/-?\d*\.?\d+(?:e-?\d+)?/gi)?.map(Number) ?? [];
  const pts: Pt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
  return pts;
}

export function pointsToPath(pts: Pt[]): string {
  return pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("") + "Z";
}

export function bbox(pts: Pt[]): Rect {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/**
 * Normaliza o mri-map.json do pacote Motion (revisão 02). Retorna null se o
 * mapa for inválido — o site então usa a base sem máscaras.
 */
export function normalizeMap(raw: unknown): MriMap | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const width = Number(m.width);
  const height = Number(m.height);
  if (!(width > 0 && height > 0)) return null;
  const glandPts = pathPoints(m.glandPath);
  if (glandPts.length < 3) return null;
  const inside = (p: Pt) => p.x >= -1 && p.y >= -1 && p.x <= width + 1 && p.y <= height + 1;
  if (!glandPts.every(inside)) return null;
  const roiPts = m.roiPath == null ? [] : pathPoints(m.roiPath);
  const validRoi = roiPts.length >= 3 && roiPts.every(inside);
  const roiBox = validRoi ? bbox(roiPts) : null;
  return {
    width,
    height,
    glandPath: typeof m.glandPath === "string" ? m.glandPath : pointsToPath(glandPts),
    roiPath: validRoi ? (typeof m.roiPath === "string" ? (m.roiPath as string) : pointsToPath(roiPts)) : null,
    glandBox: bbox(glandPts),
    roiCenter: roiBox ? { x: roiBox.x + roiBox.w / 2, y: roiBox.y + roiBox.h / 2 } : null,
  };
}

/** Constrói a fonte a partir do pacote Motion (base + mapa da mesma imagem). */
export function sourceFromMotion(src: string, map: MriMap, version: string | null): MriSource {
  const b = map.glandBox;
  const pad = 0.12;
  return {
    src,
    width: map.width,
    height: map.height,
    origin: "motion",
    version,
    map,
    focus: { x: b.x + b.w / 2, y: b.y + b.h / 2 },
    sample: { x: b.x - b.w * pad, y: b.y - b.h * pad, w: b.w * (1 + 2 * pad), h: b.h * (1 + 2 * pad) },
  };
}

/** Região visível de uma imagem W×H num quadro de proporção `aspect` com preserveAspectRatio slice. */
export function visibleRect(width: number, height: number, aspect: number): Rect {
  const imgAspect = width / height;
  if (aspect > imgAspect) {
    const h = width / aspect;
    return { x: 0, y: (height - h) / 2, w: width, h };
  }
  const w = height * aspect;
  return { x: (width - w) / 2, y: 0, w, h: height };
}
