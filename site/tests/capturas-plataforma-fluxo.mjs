// Capturas da demonstração "do Hub ao Viewer" (/previa/refinada, página real): percurso animado no meio de cada uma
// das 7 etapas nas 6 larguras (lâmina por largura) e o roteiro estático (movimento reduzido) em 1440 e 390.
//   node tests/capturas-plataforma-fluxo.mjs <pasta>
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import sharp from "sharp";
const out = process.argv[2] ?? "screenshots/plataforma-fluxo/capturas";
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const PONTOS = [0.08, 0.23, 0.38, 0.53, 0.66, 0.8, 0.94];
for (const [w, h] of [[1920, 1080], [1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto("http://localhost:3000/previa/refinada", { waitUntil: "networkidle" });
  const t = await p.evaluate(() => { const r = document.querySelector("[data-fluxo=trilho]").getBoundingClientRect(); return { top: r.top + scrollY, curso: r.height - (innerHeight - 72) }; });
  const fs = [];
  for (const [i, f] of PONTOS.entries()) {
    await p.evaluate((y) => scrollTo(0, y), Math.round(t.top - 72 + f * t.curso));
    await p.waitForTimeout(1800);
    const e = await p.evaluate(() => document.querySelector("[data-fluxo=root]").dataset.fluxoEtapa);
    const arq = `${out}/${w}x${h}-etapa${i + 1}.png`;
    await p.screenshot({ path: arq });
    fs.push({ arq, rot: `p ${f} · etapa ${e}` });
  }
  const esc = Math.min(1, 520 / w), tw = Math.round(w * esc), th = Math.round(h * esc), cols = w >= 768 ? 4 : 7;
  const tiles = await Promise.all(fs.map(async (x, i) => ({ input: await sharp(x.arq).resize(tw, th).toBuffer(), left: (i % cols) * (tw + 12), top: Math.floor(i / cols) * (th + 30) + 24 })));
  const leg = fs.map((x, i) => `<text x="${(i % cols) * (tw + 12) + 2}" y="${Math.floor(i / cols) * (th + 30) + 16}" font-family="sans-serif" font-size="14">${x.rot}</text>`).join("");
  const W = cols * (tw + 12), H = Math.ceil(fs.length / cols) * (th + 30);
  await sharp({ create: { width: W, height: H, channels: 3, background: "#fff" } }).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${leg}</svg>`), left: 0, top: 0 }, ...tiles]).png().toFile(`${out}/lamina-percurso-${w}x${h}.png`);
  await p.close();
  console.log(w, "ok");
}
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto("http://localhost:3000/previa/refinada", { waitUntil: "networkidle" });
  const r = await p.evaluate(() => { const e = document.querySelector("[data-fluxo=root]").getBoundingClientRect(); return { top: e.top + scrollY, h: e.height }; });
  for (let y = r.top - h; y < r.top + r.h; y += h / 2) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(100); }
  await p.waitForLoadState("networkidle");
  await (await p.$("[data-fluxo=root]")).screenshot({ path: `${out}/roteiro-estatico-${w}x${h}.png` });
  await ctx.close();
  console.log("roteiro", w, "ok");
}
await b.close();
