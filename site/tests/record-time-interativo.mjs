/**
 * Gravações da seção Time (direção de 07/10 com o módulo real do Motion 0.2.0), página real
 * /previa/refinada, velocidade normal. O Chromium headless não desenha o ponteiro do sistema: um
 * marcador de cursor (círculo dourado) é injetado só nestas gravações e segue os eventos reais de mouse.
 *   1. time-foto-transformacao-desktop-1440x900: abertura em foto, cursor no retrato sem efeito, troca
 *      dos cinco por clique, clique no atual, trocas por teclado, seleções rápidas, pausa no meio.
 *   2. time-celular-390x844: acordeão por toque, foto íntegra, troca direta.
 *   node tests/record-time-interativo.mjs <pasta>      (servidor em :3000)
 */
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/time-interativo";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();

const CURSOR = () => {
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.style.cssText = "position:fixed;z-index:2147483647;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:rgba(212,175,55,.55);border:2px solid #0D1B2A;pointer-events:none;transition:transform 80ms";
    document.body.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => (c.style.transform = "scale(.7)"), true);
    addEventListener("mouseup", () => (c.style.transform = ""), true);
  });
};
async function rec(name, vp, fn, o = {}) {
  const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: out, size: vp }, hasTouch: !!o.touch });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  if (!o.touch) await p.addInitScript(CURSOR);
  await p.goto(BASE + "/previa/refinada", { waitUntil: "networkidle" });
  await p.evaluate(() => { const t = document.querySelector("#time [data-shown]") ?? document.getElementById("time"); scrollTo(0, t.getBoundingClientRect().top + scrollY - 100); });
  await p.mouse.move(vp.width - 80, 300);
  await p.waitForTimeout(1200);
  await fn(p);
  const v = p.video();
  await ctx.close();
  renameSync(await v.path(), `${out}/${name}.webm`);
  console.log(name, "ok");
}
const centro = async (p) => { const r = await p.locator("#time [data-shown]").boundingBox(); return [r.x + r.width / 2, r.y + r.height * 0.42, r]; };
async function entrarSair(p, pausa = 1400) {
  const [x, y, r] = await centro(p);
  await p.mouse.move(x, y, { steps: 18 });
  await p.waitForTimeout(pausa);
  await p.mouse.move(r.x + r.width + 160, y, { steps: 18 });
  await p.waitForTimeout(pausa);
}
async function clicar(p, id) {
  const s = p.locator(`#time details[data-id=${id}] > summary`);
  let r = await s.boundingBox();
  if (r.y < 110 || r.y + r.height > 860) {
    await p.mouse.wheel(0, r.y - 420);
    await p.waitForTimeout(700);
    r = await s.boundingBox();
  }
  await p.mouse.move(r.x + 140, r.y + r.height / 2, { steps: 16 });
  await p.waitForTimeout(250);
  await p.mouse.down(); await p.mouse.up();
  await p.waitForTimeout(1100);
}

// MÓDULO REAL do Motion 0.2.0 (public/refinada/time-interativo-0.2.0), sem stub.
await rec("time-foto-transformacao-desktop-1440x900", { width: 1440, height: 900 }, async (p) => {
  await p.waitForTimeout(1200); // abertura: foto natural de Matheus, sem pontos
  await entrarSair(p, 900); // cursor no retrato: nada muda
  for (const id of ["miguel", "rodrigo", "hartmann", "victor", "matheus"]) { await clicar(p, id); await p.waitForTimeout(1300); } // foto → pontos → reorganização → foto
  await clicar(p, "matheus"); // clique no atual: nada acontece
  await p.waitForTimeout(800);
  for (const id of ["victor", "rodrigo"]) { await p.locator(`#time details[data-id=${id}] > summary`).focus(); await p.waitForTimeout(300); await p.keyboard.press("Enter"); await p.waitForTimeout(2200); } // teclado
  // seleções rápidas
  for (const id of ["hartmann", "miguel", "victor"]) { await p.locator(`#time details[data-id=${id}] > summary`).click(); await p.waitForTimeout(90); }
  await p.waitForTimeout(2600);
  // pausa durante a transformação → foto parada do escolhido
  await p.locator("#time details[data-id=matheus] > summary").click();
  await p.waitForTimeout(450);
  await p.evaluate(() => document.querySelector("header button[aria-pressed]").click());
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector("header button[aria-pressed]").click());
  await p.waitForTimeout(1200);
});

await rec("time-celular-390x844", { width: 390, height: 844 }, async (p) => {
  for (const id of ["miguel", "rodrigo", "hartmann", "victor"]) {
    await p.locator(`#time details[data-id=${id}] > summary`).tap();
    await p.waitForTimeout(300);
    await p.locator(`#time details[data-id=${id}] > summary`).scrollIntoViewIfNeeded();
    await p.waitForTimeout(1000);
  }
}, { touch: true });
await b.close();
