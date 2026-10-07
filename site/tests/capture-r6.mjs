/**
 * Rodada 6 (time + acabamento) — capturas da /previa/refinada real para antes/depois.
 * Seções (cabeçalho fixo oculto só nessas capturas), rodapé e página completa em 320, 390, 768,
 * 1280 e 1440. Movimento reduzido e sem abertura, para comparação estável.
 *   node tests/capture-r6.mjs <pasta> <rótulo>      (servidor em :3000)
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/r6";
const label = process.argv[3] ?? "atual";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const VPS = (process.env.VPS ?? "1440x900,1280x720,768x1024,390x844,320x568").split(",").map((v) => v.split("x").map(Number));
const SECOES = (process.env.SECOES ?? "jornada,plataforma,explicabilidade,ciencia,time,faq,contato").split(",");
const b = await chromium.launch();
for (const [w, h] of VPS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto(BASE + "/previa/refinada", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += h * 0.8) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(100); }
  await p.waitForLoadState("networkidle");
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(300);
  const tag = `${label}-${w}x${h}`;
  const sw = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth }));
  await p.evaluate(() => { document.querySelector("header").style.visibility = "hidden"; });
  for (const s of SECOES) {
    const el = p.locator(`#${s}`);
    if (await el.count()) await el.first().screenshot({ path: `${out}/${s}-${tag}.png` });
  }
  await p.locator("footer").last().screenshot({ path: `${out}/rodape-${tag}.png` });
  await p.evaluate(() => { document.querySelector("header").style.visibility = ""; });
  await p.screenshot({ path: `${out}/pagina-${tag}.png`, fullPage: true });
  console.log(tag, `scrollWidth ${sw.sw}/${sw.vw}`);
  await ctx.close();
}
await b.close();
