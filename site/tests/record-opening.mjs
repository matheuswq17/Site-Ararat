// Grava a /previa em rolagem natural (roda do mouse), da abertura até as etapas da jornada.
//   ROUTE=/previa/refinada node tests/record-opening.mjs <pasta>   (servidor em :3000). Vídeo headless: ordem e ritmo, não FPS.
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/previa-video";
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
for (const [w, h] of (process.env.VIEWPORTS ?? "1440x900,390x844").split(",").map((v) => v.split("x").map(Number))) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: out, size: { width: w, height: h } } });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000" + (process.env.ROUTE ?? "/previa"), { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2600); // abertura (~1,2 s) + ambiente
  await p.mouse.move(w / 2, h / 2);
  const step = w > 900 ? 60 : 28;
  const total = Math.round((w > 900 ? 2.6 : 2.2) * h);
  for (let y = 0; y < total; y += step) {
    await p.mouse.wheel(0, step);
    await p.waitForTimeout(70);
  }
  await p.waitForTimeout(1200);
  // e de volta, até a home
  for (let y = 0; y < total * 0.55; y += step * 2) {
    await p.mouse.wheel(0, -step * 2);
    await p.waitForTimeout(60);
  }
  await p.waitForTimeout(1000);
  const v = p.video();
  await ctx.close();
  renameSync(await v.path(), `${out}/rolagem-${w}x${h}.webm`);
}
await b.close();
