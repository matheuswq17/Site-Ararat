// Validador da GEOMETRIA da montanha (Ciência, /previa/refinada) contra o enquadramento combinado com o Motion
// (docs/coordination/CIENCIA-MONTANHA-ENQUADRAMENTO-SITE.md). Roda sobre o arquivo de dados, antes mesmo da
// integração, e gera uma lâmina com as zonas. Não substitui a validação na página real (tests/refinada.mjs).
//
// Uso: node tests/validar-montanha.mjs <geometria.json> [pasta-saida]
//
// Verifica, em unidades do desenho, para 1440×900, 1280×720, 768×1024, 390×844 e 320×568:
//  · cume dominante, pico secundário e sela detectados pelo perfil (skyline) — e dentro da janela visível;
//  · nenhum cume cortado (folga ≥ 8 u do topo visível);
//  · zona do texto (≥ 901 px, onde a paisagem sobe sob as frases): nada acima do limite;
//  · curva dourada passando pelo cume;
//  · nota (canto inferior direito, desktop): densidade de traço — informativo.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const arq = process.argv[2];
const saida = process.argv[3] ?? "screenshots/ciencia-montanha/validacao";
if (!arq) {
  console.error("uso: node tests/validar-montanha.mjs <geometria.json> [pasta]");
  process.exit(2);
}
mkdirSync(saida, { recursive: true });
const geo = JSON.parse(readFileSync(arq, "utf8"));
// Dois formatos: o do Motion 0.2.0 (svgAtributos, defs, elementos com atributos SVG, ouroIndice) e o simples
// (viewBox, linhas|caminhos|paths, ouro).
const attrs = geo.svgAtributos ?? {};
const vb = (typeof (attrs.viewBox ?? geo.viewBox) === "string" ? (attrs.viewBox ?? geo.viewBox).trim().split(/[\s,]+/) : geo.viewBox).map(Number);
const [VX, VY, VW, VH] = vb;
const defs = geo.defs ?? "";
let linhas, fundo = "";
if (geo.elementos) {
  const at = (e) => Object.entries(e).map(([k, v]) => `${k}="${String(v).replace(/"/g, "&quot;")}"`).join(" ");
  linhas = [];
  geo.elementos.forEach((e, i) => {
    const traco = e.stroke && e.stroke !== "none";
    if (!traco) { fundo += `<path ${at(e)}/>`; return; } // preenchimentos (massa, sombra): só na imagem
    linhas.push({ d: e.d, raw: at(e), opacity: +(e["stroke-opacity"] ?? 1), ouro: i === geo.ouroIndice || "data-topo-ouro" in e });
  });
} else {
  const brutas = geo.linhas ?? geo.caminhos ?? geo.paths ?? [];
  const idxOuro = new Set([geo.ouro ?? geo.dourada ?? []].flat());
  linhas = brutas.map((b, i) => {
    const o = typeof b === "string" ? { d: b } : b;
    const ouro = idxOuro.has(i) || o.ouro === true || o.gold === true;
    return { d: o.d, opacity: +(o.opacity ?? o.strokeOpacity ?? 1), ouro, raw: `d="${o.d}" fill="none" stroke="${o.stroke ?? (ouro ? "#D4AF37" : "#415A77")}" stroke-opacity="${o.opacity ?? 1}" stroke-width="${o.width ?? (ouro ? 1.8 : 1)}"` };
  });
}
const pAR = attrs.preserveAspectRatio ?? geo.preserveAspectRatio ?? "xMidYMax slice";

// Enquadramento 0.2.0 (RevisaoHumanaRefinada.module.css, [data-paisagem="0.2.0"]).
const clamp = (a, x, b) => Math.max(a, Math.min(b, x));
const altura = (w) => (w >= 901 ? Math.min(0.25 * w, 360) : w >= 601 ? clamp(170, 0.3 * w, 240) : clamp(150, 0.44 * w, 210));
const sobe = (w) => (w >= 901 ? clamp(48, 0.07 * w, 110) : 0);
const medidas = JSON.parse(readFileSync("screenshots/ciencia-montanha/medidas2.json", "utf8"));
const TELAS = ["1440x900", "1280x720", "768x1024", "390x844", "320x568"];

function janela(w, h) {
  // slice + xMidYMax: escala = max; centro em x, base alinhada.
  const s = Math.max(w / VW, h / VH);
  const uw = w / s, uh = h / s;
  return { s, x0: VX + (VW - uw) / 2, x1: VX + (VW + uw) / 2, y0: VY + VH - uh, y1: VY + VH };
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Math.ceil(VW), height: Math.ceil(VH) } });
const svgTxt = (extra = "", comFundo = true) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}" preserveAspectRatio="${pAR}" style="display:block;width:100%;height:100%"><defs>${defs}</defs>${comFundo ? fundo : ""}${linhas
    .map((l) => `<path ${l.raw} data-amostra=""${l.ouro ? ' data-ouro=""' : ""}/>`)
    .join("")}${extra}</svg>`;
await page.setContent(`<body style="margin:0;background:#F7F5F0;width:${VW}px;height:${VH}px">${svgTxt()}</body>`);

// Amostra todos os caminhos (unidades do usuário — sem transformações).
const amostras = await page.evaluate(() =>
  [...document.querySelectorAll("path[data-amostra]")].map((p) => {
    const L = p.getTotalLength();
    const n = Math.max(40, Math.ceil(L / 3));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const q = p.getPointAtLength((L * i) / n);
      pts.push([q.x, q.y]);
    }
    return { ouro: p.hasAttribute("data-ouro"), op: +(p.getAttribute("stroke-opacity") ?? 1), pts };
  }),
);

// Perfil superior (menor y por coluna de 4 u) e picos com proeminência.
const COL = 4;
const ncol = Math.ceil(VW / COL);
const sky = new Array(ncol).fill(Infinity);
for (const a of amostras) for (const [x, y] of a.pts) {
  const c = Math.floor((x - VX) / COL);
  if (c >= 0 && c < ncol) sky[c] = Math.min(sky[c], y);
}
const xs = (c) => VX + c * COL + COL / 2;
// picos: mínimos locais de y numa vizinhança de 40 u
const picos = [];
for (let c = 0; c < ncol; c++) {
  if (!Number.isFinite(sky[c])) continue;
  let ok = true;
  for (let d = -10; d <= 10 && ok; d++) if (d && sky[c + d] < sky[c]) ok = false;
  if (ok) picos.push({ c, x: xs(c), y: sky[c] });
}
// proeminência: quanto descer até encontrar terreno mais alto
for (const p of picos) {
  let sela = Infinity;
  for (const dir of [-1, 1]) {
    let maxY = p.y, achou = false;
    for (let c = p.c + dir; c >= 0 && c < ncol; c += dir) {
      maxY = Math.max(maxY, sky[c]);
      if (sky[c] < p.y) { achou = true; break; }
    }
    if (achou) sela = Math.min(sela, maxY - p.y);
  }
  p.prom = Number.isFinite(sela) ? sela : VH;
}
picos.sort((a, b) => a.y - b.y);
const cume = picos[0];
const secundario = picos.slice(1).filter((p) => p.prom >= 24 && Math.abs(p.x - cume.x) > 80).sort((a, b) => a.y - b.y)[0];
let sela = null;
if (secundario) {
  const [a, b] = [cume.c, secundario.c].sort((m, n) => m - n);
  let m = -Infinity, mc = a;
  for (let c = a; c <= b; c++) if (sky[c] > m) { m = sky[c]; mc = c; }
  sela = { x: xs(mc), y: m };
}
const ouro = amostras.find((a) => a.ouro);
const ouroNoCume = ouro ? Math.min(...ouro.pts.filter(([x]) => Math.abs(x - cume.x) <= 60).map(([, y]) => y)) : Infinity;

const r = (n) => Math.round(n);
const resultado = {
  arquivo: arq,
  viewBox: vb,
  curvas: linhas.length,
  douradas: linhas.filter((l) => l.ouro).length,
  cume: { x: r(cume.x), y: r(cume.y) },
  secundario: secundario ? { x: r(secundario.x), y: r(secundario.y), proeminencia: r(secundario.prom) } : null,
  sela: sela ? { x: r(sela.x), y: r(sela.y) } : null,
  ouroNoCume: r(ouroNoCume - cume.y),
  telas: {},
  falhas: [],
  avisos: [],
};
const falha = (m) => resultado.falhas.push(m);
const aviso = (m) => resultado.avisos.push(m);
if (resultado.douradas !== 1) falha(`esperada 1 curva dourada, há ${resultado.douradas}`);
if (!secundario) falha("pico secundário não identificado (proeminência ≥ 24 u, a > 80 u do cume)");
if (secundario && secundario.y <= cume.y + 20) aviso("pico secundário quase da altura do cume — o dominante pode não se ler");
if (ouroNoCume - cume.y > 40) aviso(`curva dourada passa ${r(ouroNoCume - cume.y)} u abaixo do cume (pedido: pelo cume)`);

for (const t of TELAS) {
  const [w] = t.split("x").map(Number);
  const h = altura(w);
  const j = janela(w, h);
  const m = medidas[t];
  const tela = { paisagem: `${w}×${r(h)}`, escala: +j.s.toFixed(3), janelaX: [r(j.x0), r(j.x1)], janelaY: [r(j.y0), r(j.y1)] };
  const dentro = (x, margem = 24) => x >= j.x0 + margem && x <= j.x1 - margem;
  if (cume.y < j.y0 + 8) falha(`${t}: cume cortado (y ${r(cume.y)} < topo visível ${r(j.y0)} + 8)`);
  if (!dentro(cume.x)) falha(`${t}: cume (x ${r(cume.x)}) fora da janela ${r(j.x0)}–${r(j.x1)}`);
  if (secundario && !dentro(secundario.x)) falha(`${t}: pico secundário (x ${r(secundario.x)}) fora da janela`);
  if (sela && !dentro(sela.x, 0)) falha(`${t}: sela fora da janela`);
  // Zona do texto: só quando a paisagem sobe sob as frases (≥ 901). Medidas relativas ao topo da paisagem;
  // com a nova altura, o topo da paisagem sobe (sobe) igual ao de hoje, então as frases ficam no mesmo lugar.
  const sb = sobe(w);
  if (sb > 0) {
    const z = m.zonaTexto;
    const zx0 = j.x0 + z.x / j.s, zx1 = j.x0 + (z.x + z.w) / j.s;
    const zyBase = j.y0 + (z.y + z.h) / j.s; // base da zona do texto, em unidades
    const folga = 16 / j.s;
    let alto = Infinity;
    for (const a of amostras) for (const [x, y] of a.pts) if (x >= zx0 && x <= zx1) alto = Math.min(alto, y);
    tela.zonaTexto = { x: [r(zx0), r(zx1)], baseY: r(zyBase), maisAlto: r(alto) };
    if (alto < zyBase + folga) falha(`${t}: traço sobe a y ${r(alto)} sob o texto (limite ${r(zyBase + folga)})`);
    // Nota (canto inferior direito): densidade de traço.
    const n = m.nota;
    const nx0 = j.x0 + n.x / j.s, nx1 = j.x0 + (n.x + n.w) / j.s, ny0 = j.y0 + n.y / j.s, ny1 = j.y0 + (n.y + n.h) / j.s;
    let cnt = 0;
    for (const a of amostras) for (const [x, y] of a.pts) if (x >= nx0 && x <= nx1 && y >= ny0 && y <= ny1) cnt += a.op;
    tela.notaDensidade = +cnt.toFixed(1);
  }
  resultado.telas[t] = tela;
}

// Lâmina: o desenho inteiro com zonas e janelas + cada tela no tamanho real.
const cores = { "1440x900": "#1b7f3b", "1280x720": "#2a6fdb", "768x1024": "#9b51e0", "390x844": "#d94f04", "320x568": "#c0392b" };
let extra = "";
for (const t of TELAS) {
  const tl = resultado.telas[t];
  extra += `<rect x="${tl.janelaX[0]}" y="${tl.janelaY[0] + 1}" width="${tl.janelaX[1] - tl.janelaX[0]}" height="${tl.janelaY[1] - tl.janelaY[0] - 2}" fill="none" stroke="${cores[t]}" stroke-dasharray="6 4" stroke-width="1.5"/>`;
  extra += `<text x="${tl.janelaX[0] + 4}" y="${tl.janelaY[1] - 6 - TELAS.indexOf(t) * 14}" font-size="12" font-family="sans-serif" fill="${cores[t]}">${t}</text>`;
  if (tl.zonaTexto) extra += `<rect x="${tl.zonaTexto.x[0]}" y="${VY}" width="${tl.zonaTexto.x[1] - tl.zonaTexto.x[0]}" height="${tl.zonaTexto.baseY - VY}" fill="${cores[t]}" fill-opacity="0.08" stroke="${cores[t]}" stroke-width="1"/>`;
}
const marca = (p, rot, cor) => (p ? `<circle cx="${p.x}" cy="${p.y}" r="5" fill="none" stroke="${cor}" stroke-width="2"/><text x="${p.x + 8}" y="${p.y - 6}" font-size="13" font-family="sans-serif" fill="${cor}">${rot}</text>` : "");
extra += marca(resultado.cume, "cume", "#000") + marca(resultado.secundario, "secundário", "#000") + marca(resultado.sela, "sela", "#555");
const telasHtml = TELAS.map((t) => {
  const [w] = t.split("x").map(Number);
  const h = altura(w);
  return `<div style="margin:18px 0 0;font:12px sans-serif;color:#333">${t} — paisagem ${w}×${r(h)}</div><div style="width:${w}px;height:${r(h)}px;outline:1px solid #ccc;background:#F7F5F0">${svgTxt()}</div>`;
}).join("");
await page.setViewportSize({ width: Math.max(1440, Math.ceil(VW)) + 40, height: 900 });
await page.setContent(
  `<body style="margin:20px;background:#fff"><div style="font:14px sans-serif;margin-bottom:8px">Validação da geometria — ${arq} — zonas do enquadramento combinado</div><div style="width:${VW}px;height:${VH}px;outline:1px solid #ccc;background:#F7F5F0">${svgTxt(extra)}</div>${telasHtml}</body>`,
);
await page.screenshot({ path: `${saida}/lamina-geometria.png`, fullPage: true });
await browser.close();
writeFileSync(`${saida}/validacao.json`, JSON.stringify(resultado, null, 1));
console.log(JSON.stringify(resultado, null, 1));
process.exit(resultado.falhas.length ? 1 : 0);
