/**
 * Gravação da seção Time da /previa/refinada (rodada 6), página real, velocidade normal:
 * desktop 1440×900 — seleção de cada integrante por clique e depois por teclado (Tab/Enter),
 * "Ler biografia"; celular 390×844 — acordeão por toque, retrato dentro do item aberto.
 *   node tests/record-time.mjs <pasta>      (servidor em :3000)
 */
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/time";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const IDS = ["matheus", "miguel", "rodrigo", "hartmann", "victor"];

async function rec(name, vp, fn, opts = {}) {
  const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: out, size: vp }, hasTouch: !!opts.touch });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto(BASE + "/previa/refinada", { waitUntil: "networkidle" });
  await p.evaluate(() => { const t = document.getElementById("time"); scrollTo(0, t.getBoundingClientRect().top + scrollY - 80); });
  await p.waitForTimeout(1200);
  await fn(p);
  const v = p.video();
  await ctx.close();
  renameSync(await v.path(), `${out}/${name}.webm`);
  console.log(name, "ok");
}

await rec("time-desktop-1440x900", { width: 1440, height: 900 }, async (p) => {
  for (const id of IDS.slice(1)) {
    await p.locator(`#time details[data-id=${id}] > summary`).click();
    await p.waitForTimeout(1300);
  }
  await p.locator("#time details[data-id=victor] details > summary").click();
  await p.waitForTimeout(1500);
  // teclado: volta ao 1º integrante com Shift+Tab e abre com Enter
  await p.locator(`#time details[data-id=matheus] > summary`).focus();
  await p.waitForTimeout(500);
  await p.keyboard.press("Enter");
  await p.waitForTimeout(1300);
  await p.keyboard.press("Tab"); // Ler biografia
  await p.waitForTimeout(400);
  await p.keyboard.press("Enter");
  await p.waitForTimeout(1300);
  await p.keyboard.press("Tab"); // próximo integrante
  await p.waitForTimeout(400);
  await p.keyboard.press("Enter");
  await p.waitForTimeout(1500);
});

await rec("time-celular-390x844", { width: 390, height: 844 }, async (p) => {
  for (const id of IDS.slice(1)) {
    await p.locator(`#time details[data-id=${id}] > summary`).tap();
    await p.waitForTimeout(400);
    await p.locator(`#time details[data-id=${id}] > summary`).scrollIntoViewIfNeeded();
    await p.waitForTimeout(1000);
  }
  await p.locator("#time details[data-id=victor] details > summary").tap();
  await p.waitForTimeout(1500);
}, { touch: true });
await b.close();
