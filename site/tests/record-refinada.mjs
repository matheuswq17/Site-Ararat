/**
 * Gravações da /previa/refinada (Chromium headless; vídeo serve para ritmo, não mede FPS):
 *   · cabecalho-<vp>.webm — ~16 s parado no topo, 1ª visita (abertura → MODEL ↔ PROSTATE, arte);
 *   · cta-clique-<vp>.webm — clique em "Entre na imagem" (entrada de 1000 ms) e chegada;
 *   · cta-teclado-<vp>.webm — Tab até o CTA e Enter.
 *   node tests/record-refinada.mjs <pasta>     (servidor em :3000)
 */
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/previa-refinada-r2/gravacoes";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const ROUTE = "/previa/refinada";
const b = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
async function rec(name, [w, h], fn, intro = false) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: out, size: { width: w, height: h } } });
  const p = await ctx.newPage();
  if (!intro) await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto(BASE + ROUTE, { waitUntil: "domcontentloaded" });
  await fn(p);
  const v = p.video();
  await ctx.close();
  renameSync(await v.path(), `${out}/${name}-${w}x${h}.webm`);
}
for (const vp of [[1440, 900], [390, 844]]) await rec("cabecalho", vp, (p) => p.waitForTimeout(16000), true);
for (const vp of [[1280, 720], [390, 844]]) {
  await rec("cta-clique", vp, async (p) => {
    await p.waitForLoadState("networkidle");
    await p.waitForTimeout(1500);
    await p.locator("#inicio a", { hasText: "Entre na imagem" }).click();
    await p.waitForTimeout(2800);
  });
  await rec("cta-teclado", vp, async (p) => {
    await p.waitForLoadState("networkidle");
    await p.waitForTimeout(1500);
    // Tab a partir do início do documento até o CTA principal (foco visível no caminho)
    for (let i = 0; i < 30; i++) {
      await p.keyboard.press("Tab");
      await p.waitForTimeout(120);
      if (await p.evaluate(() => document.activeElement?.textContent?.trim().startsWith("Entre na imagem"))) break;
    }
    await p.waitForTimeout(600);
    await p.keyboard.press("Enter");
    await p.waitForTimeout(2800);
  });
}
await b.close();
console.log("ok");
