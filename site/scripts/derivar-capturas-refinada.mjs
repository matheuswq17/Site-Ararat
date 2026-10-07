/**
 * Derivados otimizados das capturas do Hub e do Viewer para a /previa/refinada (rodada 5).
 * Fonte INTACTA: references/produto/capturas-2026-10-06/{hub-demo,viewer-demo}.png (conferidas por
 * SHA-256 antes de derivar; o script falha se a fonte mudou). Ferramenta: sharp (libvips), WebP.
 *  · Imagem inteira em larguras para srcset (sem redimensionar acima do original).
 *  · Recorte para celular (enquadramento útil), em 1× e no tamanho nativo do recorte — o recorte
 *    não esconde avisos que não estejam repetidos na legenda (ver lib/refinada-capturas.ts).
 *  · Texto da interface: WebP com qualidade alta e `smartSubsample` para não borrar letras finas.
 * Saída: public/product/refinada/*.webp + derivados.json (dimensões e bytes por arquivo).
 *   node scripts/derivar-capturas-refinada.mjs [pasta-das-fontes]
 */
import sharp from "sharp";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2] ?? "../references/produto/capturas-2026-10-06";
const OUT = "public/product/refinada";
mkdirSync(OUT, { recursive: true });

const FONTES = {
  hub: { file: "hub-demo.png", sha256: "5e3f7e19e32d29038975bb3bc25920a7dcd014d54576b69f74e136e3ee7e1d3e", w: 1672, h: 941 },
  viewer: { file: "viewer-demo.png", sha256: "30bb264f6fe8c2a1309bfc978712507a8c91a203ae3da6df9f7fa070576bc133", w: 1600, h: 900 },
};
/** Larguras da imagem inteira (a maior = original). */
const LARGURAS = { hub: [640, 960, 1280, 1672], viewer: [800, 1200, 1600] };
/** Recortes para celular (px do original). */
const RECORTES = {
  // fila: título, filtros de status (Todos…Revisados) e as três linhas com caso, chegada e etapa
  "hub-fila": { fonte: "hub", left: 62, top: 238, width: 640, height: 322 },
  // plano axial T2 com a ROI ilustrativa, identificação da série e o aviso "RM SINTÉTICA • ILUSTRATIVA"
  "viewer-axial": { fonte: "viewer", left: 232, top: 84, width: 500, height: 370 },
};
const WEBP = { quality: 90, smartSubsample: true, effort: 6 };

const out = { fonte: {}, arquivos: [] };
const add = (name, info) => out.arquivos.push({ arquivo: `${OUT}/${name}`, largura: info.width, altura: info.height, bytes: statSync(join(OUT, name)).size });

for (const [id, f] of Object.entries(FONTES)) {
  const buf = readFileSync(join(SRC, f.file));
  const sha = createHash("sha256").update(buf).digest("hex");
  if (sha !== f.sha256) throw new Error(`${f.file}: SHA-256 ${sha} ≠ esperado ${f.sha256} (a fonte mudou)`);
  const meta = await sharp(buf).metadata();
  if (meta.width !== f.w || meta.height !== f.h) throw new Error(`${f.file}: ${meta.width}×${meta.height} ≠ ${f.w}×${f.h}`);
  out.fonte[id] = { arquivo: `references/produto/capturas-2026-10-06/${f.file}`, largura: f.w, altura: f.h, bytes: buf.length, sha256: sha };
  for (const w of LARGURAS[id]) {
    const name = `${id}-${w}.webp`;
    const info = await sharp(buf).resize({ width: w, kernel: "lanczos3" }).webp(WEBP).toFile(join(OUT, name));
    add(name, info);
  }
}
for (const [name, r] of Object.entries(RECORTES)) {
  const f = FONTES[r.fonte];
  const buf = readFileSync(join(SRC, f.file));
  const base = sharp(buf).extract({ left: r.left, top: r.top, width: r.width, height: r.height });
  // nativo (telas 2×) e 72 % (telas 1× em ~360 px de coluna)
  const n1 = `${name}-${r.width}.webp`;
  add(n1, await base.clone().webp(WEBP).toFile(join(OUT, n1)));
  const n2 = `${name}-${Math.round(r.width * 0.72)}.webp`;
  add(n2, await base.clone().resize({ width: Math.round(r.width * 0.72), kernel: "lanczos3" }).webp(WEBP).toFile(join(OUT, n2)));
  out[`recorte:${name}`] = r;
}
writeFileSync(join(OUT, "derivados.json"), JSON.stringify(out, null, 1));
for (const a of out.arquivos) console.log(`${a.arquivo}  ${a.largura}×${a.altura}  ${(a.bytes / 1024).toFixed(0)} KB`);
