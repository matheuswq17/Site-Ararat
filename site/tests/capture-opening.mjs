// Capturas da /previa integrada (composição completa, passagem, pose de entrega, tipografia).
//   node tests/capture-opening.mjs <pasta>   (servidor em :3000)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/previa-integrada";
for (const d of ["composicao", "home-aprovada", "passagem", "pose", "estatico", "foco", "carregamento"]) mkdirSync(`${out}/${d}`, { recursive: true });
const VPS = [[1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]];
const b = await chromium.launch();
const ready = (p) => p.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 8000 });
const loaded = (p) => p.waitForFunction(() => document.querySelector("#jornada [data-loaded]")?.dataset.loaded === "true", null, { timeout: 8000 });
const go = async (p, y) => {
  await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
  await p.waitForTimeout(450);
};
// Rolagem em que a passagem termina (p = 1): desktop = pista; celular/tablet = pista − topo do quadro preso.
const runway = (p) => p.evaluate(() => {
  const d = document.querySelector("[data-opening=runway-desktop]").offsetHeight;
  if (d) return d;
  const col = document.querySelector("[data-opening=stage-col]");
  return document.querySelector("[data-opening=runway-mobile]").offsetHeight - (parseFloat(getComputedStyle(col).top) || 0);
});

for (const [w, h] of VPS) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto("http://localhost:3000/previa", { waitUntil: "networkidle" });
  await ready(p);
  await loaded(p);
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/composicao/primeira-tela-${w}x${h}.png` });
  if ([1440, 768, 390].includes(w)) {
    const R = await runway(p);
    let i = 1;
    for (const f of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      await go(p, Math.round(R * f));
      await p.screenshot({ path: `${out}/passagem/${w}-${i++}-p${f.toFixed(1)}.png` });
    }
    await go(p, Math.round(R + h * 0.6));
    await p.screenshot({ path: `${out}/passagem/${w}-${i}-etapas.png` });
    // Pose de entrega: quadro no fim da passagem (p = 1) × início das etapas (progress ≈ 0).
    const frame = p.locator("#jornada [data-layout]").first();
    await go(p, R - 2);
    await frame.screenshot({ path: `${out}/pose/${w}-fim-da-passagem.png` });
    await go(p, R + 2);
    await frame.screenshot({ path: `${out}/pose/${w}-inicio-da-jornada.png` });
  }
  await p.close();
  // Home aprovada nas mesmas medidas
  const q = await b.newPage({ viewport: { width: w, height: h } });
  await q.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await q.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await q.waitForTimeout(500);
  await q.screenshot({ path: `${out}/home-aprovada/primeira-tela-${w}x${h}.png` });
  await q.close();
}
// Layout estático (movimento reduzido) e foco por teclado
for (const [w, h] of VPS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000/previa", { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/estatico/reduzido-${w}x${h}.png` });
  await ctx.close();
}
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto("http://localhost:3000/previa", { waitUntil: "networkidle" });
  await ready(p);
  await p.locator("a", { hasText: "Entre na imagem" }).focus();
  await p.keyboard.press("Tab");
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/foco/${w}-1-conhecer-a-plataforma.png` });
  await p.locator("a", { hasText: "Entre na imagem" }).focus();
  await p.keyboard.press("Enter");
  await p.waitForTimeout(1400);
  await p.keyboard.press("Tab");
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/foco/${w}-2-enter-e-tab-na-jornada.png` });
  await p.close();
}
// RM atrasada: quadro coberto em p = 1 e revelação quando chega
{
  let release;
  const gate = new Promise((r) => (release = r));
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.route(/mri-base\.webp/, async (r) => { await gate; await r.continue(); });
  await p.goto("http://localhost:3000/previa", { waitUntil: "domcontentloaded" });
  await ready(p);
  await go(p, await runway(p));
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/carregamento/1440-rm-atrasada-coberta.png` });
  release();
  await p.waitForFunction(() => document.querySelector("[data-opening=sticky] canvas").dataset.reveal === "opening", null, { timeout: 8000 });
  await p.screenshot({ path: `${out}/carregamento/1440-rm-chegando.png` });
  await p.waitForFunction(() => document.querySelector("[data-opening=sticky] canvas").dataset.reveal === "ready", null, { timeout: 8000 });
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${out}/carregamento/1440-rm-revelada.png` });
  await p.close();
}
await b.close();
console.log("ok");
