// Capturas comparáveis para revisão (viewports 1440x900 e 390x844).
//   node tests/capture-review.mjs <pasta-de-saida>
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/review";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
for (const [w, h] of (process.env.VIEWPORTS ?? "1440x900,768x900,390x844").split(",").map((s) => s.split("x").map(Number))) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  // BLOCK_MOTION=1: força a cena estática (fallback) mesmo com pacote integrado.
  if (process.env.BLOCK_MOTION === "1") await p.route("**/motion/web/journey.js", (r) => r.fulfill({ status: 404, body: "" }));
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}/hero-${w}.png` });
  await p.evaluate(() => {
    const t = document.querySelector("#jornada [class*='track']");
    window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
  });
  await p.waitForTimeout(1500);
  for (let i = 0; i < 4; i++) {
    await p.locator("#jornada [role=group] button").nth(i).click();
    await p.waitForTimeout(1600);
    if (w < 960) await p.locator("#jornada [class*='frame']").first().evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    if (w < 960) await p.evaluate(() => window.scrollBy(0, -80));
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/jornada-${w}-etapa${i + 1}.png` });
  }
  await p.locator("#explicabilidade").evaluate((el, block) => el.scrollIntoView({ block, behavior: "instant" }), w < 960 ? "start" : "center");
  await p.waitForTimeout(800);
  if (w < 960) {
    await p.locator("#explicabilidade [class*='explorer']").evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await p.evaluate(() => window.scrollBy(0, -80));
    await p.waitForTimeout(400);
  }
  await p.screenshot({ path: `${out}/explicabilidade-${w}.png` });
  console.log(w, "erros:", errs);
  await p.close();
}
await b.close();
