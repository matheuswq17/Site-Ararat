// Capturas por seção (antes/depois da rodada 06) e do cabeçalho em larguras estreitas.
//   node tests/capture-sections.mjs <pasta>   (servidor em :3000)
// Abertura desligada (sessão marcada) para capturar o estado assentado.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/secoes";
mkdirSync(out, { recursive: true });
const SECTIONS = (process.env.SECTIONS ?? "passagem,plataforma,explicabilidade,ciencia,contato").split(",");
const VIEWPORTS = (process.env.VIEWPORTS ?? "1440x900,768x900,390x844,360x780").split(",").map((v) => v.split("x").map(Number));
const b = await chromium.launch();
const errors = [];
for (const [w, h] of VIEWPORTS) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on("pageerror", (e) => errors.push(`${w}: ${e.message}`));
  await p.addInitScript(() => {
    try {
      sessionStorage.setItem("ararat:intro", "1");
    } catch {}
  });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  for (const id of SECTIONS) {
    const el = p.locator(`#${id}`);
    if (!(await el.count())) continue;
    await el.evaluate((n) => n.scrollIntoView({ behavior: "instant", block: "start" }));
    await p.waitForTimeout(1100);
    await el.screenshot({ path: `${out}/${id}-${w}.png` });
  }
  await p.close();
}
// Cabeçalho estreito: fechado e com menu aberto.
for (const w of [320, 360, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: 780 } });
  await p.addInitScript(() => {
    try {
      sessionStorage.setItem("ararat:intro", "1");
    } catch {}
  });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await p.screenshot({ path: `${out}/cabecalho-${w}.png`, clip: { x: 0, y: 0, width: w, height: 120 } });
  const menu = p.locator('header button[aria-expanded]').first();
  if (await menu.count()) {
    await menu.click();
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/menu-${w}.png` });
  }
  await p.close();
}
await b.close();
console.log(errors.length ? errors.join("\n") : "sem erros de página");
