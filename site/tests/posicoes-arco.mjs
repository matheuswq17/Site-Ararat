// Posições de referência do fechamento da Ciência (/previa/refinada) para a continuação "crista → arco":
// P1 = meio das frases (p = 0,5) · P2 = fim das frases (p = 1, centro da 4ª frase a 45 % da janela)
// P3 = último ponto com a paisagem inteira visível abaixo do cabeçalho (topo da paisagem = --header-h + 16)
// E  = fim do desenho (e = 1, contrato 0.3.0): topo da área a --header-h + 12, janela mínima 0,2 × altura
// Mede a área visível do desenho e o espaço livre acima dele, e captura a página real em cada posição.
//   node tests/posicoes-arco.mjs <pasta> [versão]
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
const out = process.argv[2] ?? "screenshots/ciencia-arco/posicoes";
const QS = process.argv[3] ? `?paisagem=${process.argv[3]}` : "";
mkdirSync(out, { recursive: true });
const TELAS = [[2560, 1440], [1920, 1080], [1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]];
const b = await chromium.launch();
const res = {};
for (const [w, h] of TELAS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto("http://localhost:3000/previa/refinada" + QS, { waitUntil: "networkidle" });
  const m = await p.evaluate(() => {
    const c = document.querySelector("[data-frase-ativa]");
    const pa = c.querySelector("[class*=paisagem]");
    const svg = pa.querySelector("svg");
    const u = c.querySelector("[data-i='3']");
    const Y = (el) => el.getBoundingClientRect().top + scrollY;
    const vh = innerHeight;
    const hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72;
    const r = pa.getBoundingClientRect();
    const paT = Y(pa), uC = Y(u) + u.getBoundingClientRect().height / 2;
    const frases = [...c.querySelectorAll("#ciencia-revisao span[data-i]")].map((s) => { const g = document.createRange(); g.selectNodeContents(s); const q = g.getBoundingClientRect(); return { x: Math.round(q.left), y: Math.round(q.top + scrollY - paT), w: Math.round(q.width), h: Math.round(q.height) }; });
    const vb = svg.viewBox.baseVal; const k = Math.max(r.width / vb.width, r.height / vb.height);
    const janela = { x: [Math.round(vb.x + (vb.width - r.width / k) / 2), Math.round(vb.x + (vb.width + r.width / k) / 2)], y: [Math.round(vb.y + vb.height - r.height / k), vb.y + vb.height], escala: +k.toFixed(3) };
    const time = document.querySelector("#time-title");
    const s0 = paT - 0.85 * vh, s1 = uC - 0.45 * vh, s3 = paT - hdr - 16;
    return { vh, hdr, paisagem: { w: Math.round(r.width), h: Math.round(r.height) }, janela, frases, timeTituloAbaixo: Math.round(Y(time) - (paT + r.height)), scroll: { P1: Math.round(s0 + 0.5 * (s1 - s0)), P2: Math.round(s1), meio: Math.round((s1 + Math.max(s1 + 0.2 * vh, paT - hdr - 12)) / 2), E: Math.round(Math.max(s1 + 0.2 * vh, paT - hdr - 12)), P3: Math.round(Math.max(s3, Math.max(s1 + 0.2 * vh, paT - hdr - 12) + 80)) }, faixaFrases: Math.round(s1 - s0), faixaExtra: Math.round(Math.max(s1 + 0.2 * vh, paT - hdr - 12) - s1) };
  });
  const caps = [];
  for (const [nome, y] of Object.entries(m.scroll)) {
    await p.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
    await p.waitForTimeout(1500);
    const st = await p.evaluate(() => { const c = document.querySelector("[data-frase-ativa]"); const pa = c.querySelector("[class*=paisagem]").getBoundingClientRect(); return { p: c.dataset.progresso, arco: c.dataset.encerramento ?? null, etapa: c.querySelector("p").dataset.topoEtapa ?? null, paisagemTopo: Math.round(pa.top), paisagemBase: Math.round(pa.bottom) }; });
    m[nome] = st;
    const f = `${out}/${w}x${h}-${nome}.png`;
    await p.screenshot({ path: f });
    caps.push({ f, nome, st });
  }
  // lâmina por tela: 4 posições lado a lado com legenda
  const esc = Math.min(1, 640 / w);
  const tw = Math.round(w * esc), th = Math.round(h * esc);
  const tiles = await Promise.all(caps.map(async (c, i) => ({ input: await sharp(c.f).resize(tw, th).toBuffer(), left: i * (tw + 16), top: 34 })));
  const legenda = caps.map((c, i) => `<text x="${i * (tw + 16) + 4}" y="22" font-family="sans-serif" font-size="15" fill="#0D1B2A">${c.nome} · rolagem ${m.scroll[c.nome]} · p ${c.st.p}${c.st.arco != null ? " · e " + c.st.arco : ""} · etapa ${c.st.etapa}</text>`).join("");
  const W = caps.length * (tw + 16) - 16, H = th + 34;
  await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } }).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="34">${legenda}</svg>`), left: 0, top: 0 }, ...tiles]).png().toFile(`${out}/lamina-${w}x${h}.png`);
  res[`${w}x${h}`] = m;
  await ctx.close();
  console.log(w, h, "ok");
}
writeFileSync(`${out}/posicoes.json`, JSON.stringify(res, null, 1));
await b.close();
