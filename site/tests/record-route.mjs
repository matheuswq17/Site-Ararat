// Grava o percurso Jornada (fim) → Passagem → Plataforma → Explicabilidade → Ciência → Contato.
//   node tests/record-route.mjs <pasta>   (servidor em :3000)
// Vídeo headless: mostra ordem e ritmo; não mede FPS.
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/percurso";
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
for (const [w, h] of (process.env.VIEWPORTS ?? "1440x900,390x844").split(",").map((v) => v.split("x").map(Number))) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: out, size: { width: w, height: h } } });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  // começa no fim da jornada, sem animar a rolagem até lá
  await p.evaluate(() => {
    const j = document.querySelector("#jornada");
    window.scrollTo({ top: j.offsetTop + j.offsetHeight - innerHeight * 0.9, behavior: "instant" });
  });
  await p.waitForTimeout(700);
  const wheel = async (n, dy, pause = 120) => {
    for (let i = 0; i < n; i++) {
      await p.mouse.wheel(0, dy);
      await p.waitForTimeout(pause);
    }
  };
  await wheel(10, w > 900 ? 110 : 90, 140); // passagem
  await p.waitForTimeout(900);
  await wheel(14, w > 900 ? 140 : 110); // plataforma
  await p.waitForTimeout(700);
  await p.evaluate(() => document.querySelector("#explicabilidade").scrollIntoView({ behavior: "smooth" }));
  await p.waitForTimeout(1300);
  for (const name of ["Forma", "Intensidade", "Textura"]) {
    await p.locator("#explicabilidade").getByRole("button", { name }).click();
    await p.waitForTimeout(900);
  }
  await p.evaluate(() => document.querySelector("#ciencia").scrollIntoView({ behavior: "smooth" }));
  await p.waitForTimeout(1300);
  await wheel(8, w > 900 ? 140 : 110);
  await p.evaluate(() => document.querySelector("#contato").scrollIntoView({ behavior: "smooth" }));
  await p.waitForTimeout(1500);
  const v = p.video();
  await ctx.close();
  renameSync(await v.path(), `${out}/percurso-${w}.webm`);
}
await b.close();
