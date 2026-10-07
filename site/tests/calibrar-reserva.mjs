/**
 * Calibração da reserva métrica da /previa/refinada (refinada.css → @font-face "… Reserva").
 * Com as fontes recusadas (404), redefine as faces de reserva com cada size-adjust candidato e
 * conta, por grupo (títulos 500/600, rótulos em caixa-alta, corpo 400/600), quantos textos mudam
 * o número de linhas em relação à carga normal, em 1440/1280/768/390/320 (movimento reduzido).
 * Ponto de partida: largura média dos textos reais com kerning. Fonte de reserva no teste:
 * Liberation Sans (métricas de Arial).   node tests/calibrar-reserva.mjs   (servidor em :3000)
 */
import { chromium } from "playwright";
// métricas verticais (UPM 1000): Space Grotesk 984/292 · Source Sans 3 1024/400
const FACES = {
  T500: { fam: "ARARAT Titulo Reserva", w: 500, bold: false, asc: 984, desc: 292 },
  T600: { fam: "ARARAT Titulo Reserva", w: 600, bold: true, asc: 984, desc: 292 },
  C500: { fam: "ARARAT Rotulo Reserva", w: 500, bold: false, asc: 984, desc: 292 },
  C600: { fam: "ARARAT Rotulo Reserva", w: 600, bold: true, asc: 984, desc: 292 },
  X400: { fam: "ARARAT Texto Reserva", w: 400, bold: false, asc: 1024, desc: 400 },
  X600: { fam: "ARARAT Texto Reserva", w: 600, bold: true, asc: 1024, desc: 400 },
};
const GRID = { T500: [1.03, 1.12], T600: [0.97, 1.04], C500: [0.88, 0.96], C600: [0.87, 0.95], X400: [0.90, 0.95], X600: [0.87, 0.93] };
const face = (k, sa) => { const f = FACES[k]; const src = f.bold ? 'local("Arial Bold"), local("Liberation Sans Bold"), local("LiberationSans-Bold")' : 'local("Arial"), local("Liberation Sans"), local("LiberationSans")';
  return `@font-face{font-family:"${f.fam}";src:${src};font-weight:${f.w};size-adjust:${(sa * 100).toFixed(2)}%;ascent-override:${(f.asc / 10 / sa).toFixed(2)}%;descent-override:${(f.desc / 10 / sa).toFixed(2)}%;line-gap-override:0%}`; };
// Blocos de texto (títulos, parágrafos, rótulos, botões, itens): número de linhas do bloco.
const SNAP = () => { const out = [];
  for (const el of document.querySelectorAll("[data-proposta] :is(h1, h2, h3, h4, p, dt, dd, li, a, button, figcaption, span)")) {
    if (!el.getClientRects().length) { out.push(null); continue; }
    if (el.tagName === "SPAN" || el.tagName === "LI") { if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) { out.push(null); continue; } }
    const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize);
    const ff = cs.fontFamily; const up = /Rotulo/.test(ff); const kind = /Titulo/.test(ff) ? (up ? "C" : "T") + (+cs.fontWeight) : /Texto/.test(ff) ? "X" + cs.fontWeight : null; if (!kind) { out.push(null); continue; }
    const tops = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); for (const x of r.getClientRects()) if (x.width > 1) tops.push(x.top); }
    if (!tops.length) { out.push(null); continue; }
    tops.sort((a, b) => a - b); const lines = tops.filter((t, i) => i === 0 || t - tops[i - 1] > fs * 0.5).length;
    out.push([kind, lines, el.textContent.trim().slice(0, 24)]);
  } return out; };
const b = await chromium.launch();
const VPS = [[1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]];
const base = {}, ctxs = {};
for (const vp of VPS) {
  const c1 = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, reducedMotion: "reduce" }); const p1 = await c1.newPage();
  await p1.goto("http://localhost:3000/previa/refinada", { waitUntil: "networkidle" }); await p1.evaluate(() => document.fonts.ready);
  base[vp] = await p1.evaluate(SNAP); await c1.close();
  const c2 = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, reducedMotion: "reduce" }); const p2 = await c2.newPage();
  await p2.route(/tipografia\/fontes/, (r) => r.fulfill({ status: 404, body: "" }));
  await p2.goto("http://localhost:3000/previa/refinada", { waitUntil: "networkidle" });
  await p2.evaluate(() => { const s = document.createElement("style"); s.id = "cal"; document.head.append(s); });
  ctxs[vp] = p2;
}
async function mism(cfg) { // cfg: {T500:sa,...} → mismatches per group
  const css = Object.entries(cfg).map(([k, v]) => face(k, v)).join("\n"); const per = {}; const ex = {};
  for (const vp of VPS) { const p = ctxs[vp];
    await p.evaluate(async (css) => { document.getElementById("cal").textContent = css; await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, css);
    const s = await p.evaluate(SNAP); const bs = base[vp];
    s.forEach((x, i) => { if (!x || !bs[i]) return; const k = x[0]; per[k] ??= 0; if (x[1] !== bs[i][1]) { per[k]++; (ex[k] ||= []).push(`${vp[0]}:${x[2]} ${bs[i][1]}→${x[1]}`); } });
  } return { per, ex }; }
// Valores atuais de refinada.css (largura média com kerning: T500 1,073 · T600 1,006 · C 0,917 ·
// X400 0,923 · X600 0,900; depois ajustados pela busca abaixo).
const best = { T500: 1.075, T600: 0.995, C500: 0.915, C600: 0.915, X400: 0.93, X600: 0.9 };
const start = await mism(best); console.log("valores atuais:", JSON.stringify(start.per)); for (const k in start.ex) console.log("   ", k, start.ex[k].slice(0, 6).join(" | "));
for (const k of Object.keys(GRID)) {
  const [lo, hi] = GRID[k]; const scores = [];
  for (let v = lo; v <= hi + 1e-9; v += 0.005) { const r = await mism({ ...best, [k]: +v.toFixed(3) }); scores.push([+v.toFixed(3), r.per[k] ?? 0]); }
  const min = Math.min(...scores.map(s => s[1])); const okv = scores.filter(s => s[1] === min).map(s => s[0]);
  // escolhe, entre os valores de mínimo erro, o mais próximo da largura média
  const pick = okv.reduce((a, c) => Math.abs(c - best[k]) < Math.abs(a - best[k]) ? c : a);
  console.log(k, "erros mín", min, "faixa", okv[0], "–", okv.at(-1), "→", pick, " (", scores.map(s => s.join(":")).join(" "), ")");
  best[k] = pick;
}
const fin = await mism(best); console.log("final:", JSON.stringify(best), JSON.stringify(fin.per)); for (const k in fin.ex) console.log("   ", k, fin.ex[k].join(" | "));
await b.close();
