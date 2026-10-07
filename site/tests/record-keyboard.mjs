// Grava a /previa por teclado (Tab, Shift+Tab, Enter) e a chegada tardia da RM.
//   node tests/record-keyboard.mjs <pasta>   (servidor em :3000)
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/previa-video";
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: out, size: { width: w, height: h } } });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto("http://localhost:3000/previa", { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  await p.locator("a", { hasText: "Entre na imagem" }).focus();
  await p.waitForTimeout(700);
  await p.keyboard.press("Tab"); // Conhecer a plataforma
  await p.waitForTimeout(900);
  await p.keyboard.press("Shift+Tab"); // de volta ao CTA
  await p.waitForTimeout(900);
  await p.keyboard.press("Enter"); // jornada utilizável
  await p.waitForTimeout(1600);
  for (let i = 0; i < 3; i++) { await p.keyboard.press("Tab"); await p.waitForTimeout(700); }
  await p.keyboard.press("Enter");
  await p.waitForTimeout(1200);
  // volta rolando com o foco num controle: o foco sai antes de a escultura cobrir
  await p.mouse.move(w / 2, h / 2);
  for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, -60); await p.waitForTimeout(70); }
  await p.waitForTimeout(1200);
  const v = p.video();
  await ctx.close();
  renameSync(await v.path(), `${out}/teclado-${w}x${h}.webm`);
}
{
  let release;
  const gate = new Promise((r) => (release = r));
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: out, size: { width: 1440, height: 900 } } });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.route(/mri-base\.webp/, async (r) => { await gate; await r.continue(); });
  await p.goto("http://localhost:3000/previa", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1200);
  await p.mouse.move(720, 450);
  for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, 60); await p.waitForTimeout(70); }
  await p.waitForTimeout(1800); // passagem concluída, RM ainda não chegou: quadro coberto
  release();
  await p.waitForTimeout(2200);
  const v = p.video();
  await ctx.close();
  renameSync(await v.path(), `${out}/rm-tardia-1440x900.webm`);
}
await b.close();
console.log("ok");
