/**
 * Retratos do time para a /previa/refinada (rodada 6). Fonte INTACTA: site/media-fontes/time/
 * (cópias exatas de C:/Site_ararat/assets/img, conferidas por SHA-256). Ferramenta: sharp (libvips).
 *  · Recorte 4:5 por pessoa, ajustado à mão para olhos em ~1/3 da altura e cabeça com escala
 *    parecida, sem cortar testa nem queixo (onde a fonte não tem margem acima, o recorte começa no
 *    topo da foto e os olhos ficam um pouco mais altos).
 *  · Só redução (nunca ampliação): larguras acima do recorte não são geradas. Victor (fonte de
 *    400 × 400) fica com 304 px de largura no máximo — sem upscale generativo.
 *  · Cor original; a versão em preto e branco é aplicada por CSS (reversível).
 * Saída: public/refinada/time/<id>-<largura>.webp + derivados.json.
 *   node scripts/derivar-time-refinada.mjs
 */
import sharp from "sharp";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = "media-fontes/time";
const OUT = "public/refinada/time";
mkdirSync(OUT, { recursive: true });
const PESSOAS = {
  matheus: { f: "matheus.jpeg", sha: "ed6177d91beb52326239015b9bedd896e983e118b5ff97bffb20b8aa5d225f37", left: 273, top: 225, w: 746, h: 933 },
  miguel: { f: "Miguel.png", sha: "9dbc6648819ca67a78e964683eed2a91a8db99d78080d8791efcb25f57bdfd33", left: 121, top: 0, w: 938, h: 1173 },
  rodrigo: { f: "rodrigo_gobbo.jpeg", sha: "1bc8d1a1b694e681dc2a8e85257a37ae0df1ec0aeca65a32964643afa4db7f3c", left: 297, top: 0, w: 552, h: 690 },
  hartmann: { f: "Hartmann.png", sha: "bca23e0c321df7a6b40641c6bdcfc30868bb27d3993891b82b3fa92ee4f44f06", left: 106, top: 0, w: 960, h: 1200 },
  victor: { f: "victor.jpg", sha: "b7f96ec649b03fef57e8fc098fe97bb9d2d21f41d3c39ff4cf05a8962640a30d", left: 33, top: 0, w: 304, h: 380 },
};
const LARGURAS = [240, 360, 560, 880];
const out = { fontes: {}, arquivos: [] };
for (const [id, p] of Object.entries(PESSOAS)) {
  const buf = readFileSync(join(SRC, p.f));
  const sha = createHash("sha256").update(buf).digest("hex");
  if (sha !== p.sha) throw new Error(`${p.f}: SHA-256 ${sha} ≠ esperado`);
  const meta = await sharp(buf).metadata();
  out.fontes[id] = { arquivo: `site/media-fontes/time/${p.f}`, largura: meta.width, altura: meta.height, bytes: buf.length, sha256: sha, recorte: { left: p.left, top: p.top, width: p.w, height: p.h } };
  const ws = [...LARGURAS.filter((w) => w < p.w), p.w].filter((w, i, a) => a.indexOf(w) === i && w <= 880);
  for (const w of ws) {
    const name = `${id}-${w}.webp`;
    const info = await sharp(buf).rotate().extract({ left: p.left, top: p.top, width: p.w, height: p.h }).resize({ width: w, kernel: "lanczos3" }).webp({ quality: 82, effort: 6 }).toFile(join(OUT, name));
    out.arquivos.push({ id, arquivo: `${OUT}/${name}`, largura: info.width, altura: info.height, bytes: statSync(join(OUT, name)).size });
  }
}
writeFileSync(join(OUT, "derivados.json"), JSON.stringify(out, null, 1));
for (const a of out.arquivos) console.log(`${a.arquivo}  ${a.largura}×${a.altura}  ${(a.bytes / 1024).toFixed(0)} KB`);
