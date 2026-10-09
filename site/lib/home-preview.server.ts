import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isSafeRelativePath, type MotionPackageInfo } from "./motion-contract";
import { normalizeMap, sourceFromMotion, SITE_MRI, type MriSource } from "./mri";
import { ART_SLOT, EDITORIAL_SLOT, editorialSlotWidth, PREVIEW_PACKAGE, type ArtPoster, type PosterSource, type PreviewConfig, type PreviewPackage } from "./home-preview";

/* Leitura de um pacote experimental da prévia (public/previa/<pkg.dir>/manifest.json).
 * Padrão: PREVIEW_PACKAGE (0.2.1-draft: /previa, /previa/a, /previa/b). A /previa/refinada passa
 * REFINADA_PACKAGE (montanha B, 0.4.0-draft) — mesmo leitor, mesmos critérios.
 * Qualquer incoerência → null: a página fica no layout estático/jornada padrão, sem quebrar. */

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function readJson(pkg: PreviewPackage, rel: string): Raw | null {
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), "public", "previa", pkg.dir, rel), "utf8"));
  } catch {
    return null;
  }
}

function manifest(pkg: PreviewPackage): { m: Raw; listed: Set<string> } | null {
  const m = readJson(pkg, "manifest.json");
  if (!m || m.schemaVersion !== 1 || m.version !== pkg.version || !Array.isArray(m.files)) return null;
  return { m, listed: new Set(m.files.map((f: Raw) => f?.path)) };
}

// Caminho relativo seguro do pacote: o mesmo critério do contrato, mais "@" (nomes "w691@2x").
const SAFE_PKG_PATH = /^(?!\/)(?!.*\.\.)(?!.*:)[A-Za-z0-9._@\-/]+$/;
const ok = (listed: Set<string>, p: unknown): p is string =>
  typeof p === "string" && (isSafeRelativePath(p) || SAFE_PKG_PATH.test(p)) && listed.has(p);

function poster(pkg: PreviewPackage, listed: Set<string>, key: string): ArtPoster | null {
  const img = `assets/${key}-transparente.webp`;
  const meta = readJson(pkg, `assets/${key}.json`);
  if (!ok(listed, img) || !ok(listed, `assets/${key}.json`) || !meta) return null;
  const a = meta.areaCss, px = meta.pixels;
  if (![a?.w, a?.h, px?.w, px?.h].every((v) => Number.isFinite(v) && v > 0)) return null;
  return { src: pkg.baseUrl + img, areaW: a.w, areaH: a.h, pixelsW: px.w, pixelsH: px.h };
}

/**
 * Faixas do <picture> a partir de assets/arte-escultura-variantes.json, pela LARGURA REAL do slot
 * do Site (min(1100, largura da camada); celular = largura inteira) — não pelas faixas de exemplo
 * do Motion, que supõem outro slot (≈ 0,9 × viewport).
 *  · Família: só variantes cuja área tem a mesma composição do módulo para o slot (área < 600 px
 *    = "narrow", 5:4; ≥ 600 px = "wide", 5:3). Ex.: a desktop-w560 é "narrow" no módulo e por isso
 *    não serve a nenhum slot ≥ 600 px deste layout.
 *  · Escolha: medida na /previa (tests/poster-canvas.mjs), reduzir um poster afina o traço ~2–3×
 *    mais do que ampliar o engrossa. A fronteira entre duas variantes vizinhas fica a 5/6 do
 *    caminho (usa-se a menor, levemente ampliada, até perto da maior).
 *  · 1x/2x pela densidade da tela (srcset com descritor x).
 * O slot ≈ viewport sem barra de rolagem lateral; com barra clássica (~15–17 px) o slot fica um
 * pouco menor que o viewport (escala ≤ 3 %).
 */
function posterSources(pkg: PreviewPackage, listed: Set<string>): PosterSource[] | null {
  const BASE = pkg.baseUrl;
  const idx = readJson(pkg, "assets/arte-escultura-variantes.json");
  const fams = idx?.familias;
  if (!fams?.movel?.variantes || !fams?.desktop?.variantes) return null;
  const out: PosterSource[] = [];
  const family = (vs: Raw[], lo: number, hi: number, narrow: boolean) => {
    const all = vs.map((v) => ({ w: Number(v.areaCss?.w), h: Number(v.areaCss?.h), x1: v.arquivos?.["1x"], x2: v.arquivos?.["2x"] }));
    if (!all.every((v) => v.w > 0 && v.h > 0 && ok(listed, v.x1) && ok(listed, v.x2))) return false; // índice × manifesto
    const list = all.filter((v) => (v.w < ART_SLOT.narrowBelow) === narrow).sort((a, b) => a.w - b.w);
    if (!list.length) return false;
    list.forEach((v, i) => {
      const next = list[i + 1];
      const from = i === 0 ? lo : out[out.length - 1].slotMax + 1;
      const to = next ? Math.min(hi, Math.ceil(next.w - (next.w - v.w) / 6) - 1) : hi;
      if (to < from) return;
      const media = Number.isFinite(to) ? `(min-width: ${from}px) and (max-width: ${to}.98px)` : `(min-width: ${from}px)`;
      out.push({ media, srcSet: `${BASE}${v.x1} 1x, ${BASE}${v.x2} 2x`, areaW: v.w, areaH: v.h, slotMin: from, slotMax: Number.isFinite(to) ? to : ART_SLOT.maxWidth });
    });
    return true;
  };
  if (!family(fams.movel.variantes, 0, ART_SLOT.narrowBelow - 1, true)) return null;
  if (!family(fams.desktop.variantes, ART_SLOT.narrowBelow, Infinity, false)) return null;
  const editorial = editorialSources(pkg, listed);
  if (editorial === null) return null;
  if (!editorial.length) return out;
  // Com a família editorial: as faixas acima terminam antes de 1200 px (viewport = slot até lá) …
  const below = out.filter((s) => s.slotMin < EDITORIAL_SLOT.minViewport);
  const last = below[below.length - 1];
  // (a última faixa abaixo era aberta: vai até 1199 px, onde o slot de uma coluna já está no teto de 1100)
  const lastTo = EDITORIAL_SLOT.minViewport - 1;
  below[below.length - 1] = { ...last, media: `(min-width: ${last.slotMin}px) and (max-width: ${lastTo}.98px)` };
  // … e a partir de 1200 px vale a família editorial, escolhida pela largura do slot de duas colunas.
  return [...below, ...editorial];
}

/**
 * Família editorial (montanha ≥ 1.1.0-03d2, assets/arte-escultura-editorial-variantes.json): posters desenhados com
 * alinhar "centro" para o slot de duas colunas. A escolha segue as faixas do próprio índice (faixasPorLarguraDoSlot,
 * mesma regra de 5/6), aplicadas à função REAL do slot (editorialSlotWidth), e não à função estimada do exemplo
 * do Motion. Como a largura do slot não cresce sempre com a viewport (o gap aumenta até 64 px depois que o
 * conteúdo atinge 1320 px), as faixas são calculadas viewport a viewport e depois agrupadas.
 * [] = pacote sem família editorial (≤ 1.0.0-03d2); null = índice incoerente com o manifesto.
 */
function editorialSources(pkg: PreviewPackage, listed: Set<string>): PosterSource[] | null {
  if (!listed.has("assets/arte-escultura-editorial-variantes.json")) return [];
  const idx = readJson(pkg, "assets/arte-escultura-editorial-variantes.json");
  const vs: Raw[] = idx?.familia?.variantes ?? [];
  const faixas: Raw[] = idx?.faixasPorLarguraDoSlot ?? [];
  const byW = new Map<number, { w: number; h: number; x1: string; x2: string }>();
  for (const v of vs) {
    const w = Number(v.areaCss?.w), h = Number(v.areaCss?.h);
    if (!(w > 0 && h > 0) || !ok(listed, v.arquivos?.["1x"]) || !ok(listed, v.arquivos?.["2x"])) return null;
    byW.set(w, { w, h, x1: v.arquivos["1x"], x2: v.arquivos["2x"] });
  }
  const pick = (slot: number) => {
    const s = Math.round(slot);
    const f = faixas.find((x) => s >= Number(x.de) && s <= Number(x.ate));
    return f ? byW.get(Number(f.variante)) : undefined;
  };
  const LAST = 2600; // a partir daqui o slot é constante (gap e conteúdo no teto)
  const out: PosterSource[] = [];
  let cur: { v: { w: number; h: number; x1: string; x2: string }; from: number; to: number; lo: number; hi: number } | null = null;
  const flush = (open: boolean) => {
    if (!cur) return;
    const media = open ? `(min-width: ${cur.from}px)` : `(min-width: ${cur.from}px) and (max-width: ${cur.to}.98px)`;
    out.push({ media, srcSet: `${pkg.baseUrl}${cur.v.x1} 1x, ${pkg.baseUrl}${cur.v.x2} 2x`, areaW: cur.v.w, areaH: cur.v.h, slotMin: Math.round(cur.lo), slotMax: Math.round(cur.hi) });
  };
  for (let vw = EDITORIAL_SLOT.minViewport; vw <= LAST; vw++) {
    const slot = editorialSlotWidth(vw);
    const v = pick(slot);
    if (!v) return null;
    if (cur && cur.v === v) {
      cur.to = vw;
      cur.lo = Math.min(cur.lo, slot);
      cur.hi = Math.max(cur.hi, slot);
    } else {
      flush(false);
      cur = { v, from: vw, to: vw, lo: slot, hi: slot };
    }
  }
  flush(true);
  return out;
}

/** Escultura + posters oficiais; null se o pacote não estiver completo. */
export function readPreviewConfig(pkg: PreviewPackage = PREVIEW_PACKAGE): PreviewConfig | null {
  const r = manifest(pkg);
  if (!r) return null;
  const { m, listed } = r;
  const entry = m.sculpture?.entry;
  const desktop = poster(pkg, listed, "arte-escultura-desktop");
  const mobile = poster(pkg, listed, "arte-escultura-movel");
  const sources = posterSources(pkg, listed);
  if (!ok(listed, entry) || !desktop || !mobile || !sources || typeof m.journey?.version !== "string") return null;
  return {
    version: m.version,
    sculptureModule: pkg.baseUrl + entry,
    journeyVersion: m.journey.version,
    posterDesktop: desktop,
    posterMobile: mobile,
    posterSources: sources,
  };
}

/** Jornada experimental (0.4.1-exp, start-arc-v1) — só /previa. */
export function readPreviewJourney(pkg: PreviewPackage = PREVIEW_PACKAGE): MotionPackageInfo | null {
  const r = manifest(pkg);
  if (!r) return null;
  const { m, listed } = r;
  const j = m.journey;
  if (!j || !ok(listed, j.entry) || !ok(listed, j.stylesheet)) return null;
  if (!Array.isArray(j.capabilities) || !j.capabilities.includes("start-arc-v1")) return null;
  return {
    version: typeof j.version === "string" ? j.version : null,
    entry: j.entry,
    stylesheet: j.stylesheet,
    poster: "assets/mri-base.webp",
    implementation: "svg",
    baseUrl: pkg.baseUrl,
  };
}

/** RM do mesmo pacote (a cena estática de reserva usa a mesma imagem que a jornada 0.4.1-exp). */
export function readPreviewMri(pkg: PreviewPackage = PREVIEW_PACKAGE): MriSource {
  const r = manifest(pkg);
  if (!r || !r.listed.has("assets/mri-map.json") || !r.listed.has("assets/mri-base.webp")) return SITE_MRI;
  const map = normalizeMap(readJson(pkg, "assets/mri-map.json"));
  if (!map) return SITE_MRI;
  return sourceFromMotion(pkg.baseUrl + "assets/mri-base.webp", map, r.m.journey?.version ?? null);
}
