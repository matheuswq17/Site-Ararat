// Barra de rolagem da marca nas propostas (Chromium com barras visíveis): /previa (nativa) ×
// /previa/a; forced-colors (alto contraste emulado) volta à barra do sistema.
//   node tests/capture-barra.mjs <pasta>
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/previa-propostas/barra";
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
for (const [name, path, forced] of [["base", "/previa", false], ["proposta", "/previa/a", false], ["proposta-forced-colors", "/previa/a", true]]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2, forcedColors: forced ? "active" : "none" });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto("http://localhost:3000" + path, { waitUntil: "networkidle" });
  await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight * 0.3, behavior: "instant" }));
  await p.waitForTimeout(800);
  const vw = await p.evaluate(() => [innerWidth, document.documentElement.clientWidth]);
  await p.screenshot({ path: `${out}/${name}-borda.png`, clip: { x: 1280 - 160, y: 0, width: 160, height: 720 } });
  console.log(name, "largura da barra", vw[0] - vw[1], "px");
  // arraste do indicador pela barra: a página acompanha (comportamento nativo)
  if (name === "proposta") {
    const y0 = await p.evaluate(() => scrollY);
    const thumbY = await p.evaluate(() => (scrollY / (document.documentElement.scrollHeight - innerHeight)) * (innerHeight - 48) + 24);
    await p.mouse.move(1274, thumbY); await p.mouse.down(); await p.mouse.move(1274, thumbY + 120, { steps: 6 }); await p.mouse.up();
    await p.waitForTimeout(300);
    console.log("arraste do indicador: scrollY", Math.round(y0), "→", Math.round(await p.evaluate(() => scrollY)));
    await p.keyboard.press("PageDown"); await p.waitForTimeout(800);
    console.log("PageDown: scrollY", Math.round(await p.evaluate(() => scrollY)));
  }
  await ctx.close();
}
await b.close();
