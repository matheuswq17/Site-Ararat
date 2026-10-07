/**
 * Rodada 5 (conteúdo + Hub/Viewer) — capturas da /previa/refinada real para antes/depois:
 * Plataforma e Ciência (seção inteira; Ciência também com detalhes abertos) e página completa,
 * em 1440×900, 768×1024, 390×844 e 320×568. Movimento reduzido (revelações estáticas, sem animação
 * da montanha) e 1ª visita sem abertura, para as capturas serem comparáveis.
 *   node tests/capture-r5.mjs <pasta> <rótulo>      (servidor em :3000)
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/r5";
const label = process.argv[3] ?? "atual";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const VPS = (process.env.VPS ?? "1440x900,768x1024,390x844,320x568").split(",").map((v) => v.split("x").map(Number));
const b = await chromium.launch();
for (const [w, h] of VPS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto(BASE + "/previa/refinada", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  // rola a página inteira para disparar carregamentos preguiçosos
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += h * 0.8) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(120); }
  await p.waitForLoadState("networkidle");
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(300);
  const tag = `${label}-${w}x${h}`;
  // o cabeçalho fixo cobriria o topo das capturas de seção: oculto só para elas (não na página inteira)
  const hideHeader = (v) => p.evaluate((v) => { document.querySelector("header").style.visibility = v ? "hidden" : ""; }, v);
  await hideHeader(true);
  await p.locator("#plataforma").screenshot({ path: `${out}/plataforma-${tag}.png` });
  await p.locator("#ciencia").screenshot({ path: `${out}/ciencia-${tag}.png` });
  await p.evaluate(() => document.querySelectorAll("#ciencia details").forEach((d) => (d.open = true)));
  await p.waitForTimeout(200);
  await p.locator("#ciencia").screenshot({ path: `${out}/ciencia-aberta-${tag}.png` });
  await p.evaluate(() => document.querySelectorAll("#ciencia details").forEach((d) => (d.open = false)));
  await hideHeader(false);
  await p.screenshot({ path: `${out}/pagina-${tag}.png`, fullPage: true });
  console.log(tag, "ok");
  await ctx.close();
}
await b.close();
