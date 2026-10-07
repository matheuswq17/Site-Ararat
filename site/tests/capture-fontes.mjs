/**
 * Prova visual do carregamento das fontes (1ª tela):
 *   · fontes atrasadas 4 s, quadro a 1,5 s: /previa/a (font-display: block) × /previa/refinada
 *     (swap + reserva métrica);
 *   · fontes com 404 na /previa/refinada × carga normal.
 * Capturas pelo CDP (page.screenshot do Playwright espera as fontes web).
 *   node tests/capture-fontes.mjs <pasta>      (servidor em :3000)
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/previa-refinada/fontes";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
async function shot(route, [w, h], mode, at, file) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.route(/\/previa\/tipografia\/fontes\//, async (r) => {
    if (mode === "404") return r.fulfill({ status: 404, body: "" });
    if (mode === "atraso") await new Promise((x) => setTimeout(x, 4000));
    return r.continue();
  });
  const t0 = Date.now();
  await p.goto(BASE + route, { waitUntil: "domcontentloaded" });
  if (at) await p.waitForTimeout(Math.max(0, at - (Date.now() - t0)));
  else { await p.waitForLoadState("networkidle"); await p.waitForTimeout(1500); }
  const cdp = await ctx.newCDPSession(p);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${out}/${file}`, Buffer.from(data, "base64"));
  await ctx.close();
}
for (const vp of [[1440, 900], [390, 844]]) {
  const t = vp.join("x");
  await shot("/previa/a", vp, "atraso", 1500, `${t}-atraso-1500ms-previa-a-block.png`);
  await shot("/previa/refinada", vp, "atraso", 1500, `${t}-atraso-1500ms-refinada-swap.png`);
  await shot("/previa/refinada", vp, "404", 0, `${t}-404-refinada-reserva.png`);
  await shot("/previa/refinada", vp, "normal", 0, `${t}-normal-refinada.png`);
}
await b.close();
console.log("ok");
