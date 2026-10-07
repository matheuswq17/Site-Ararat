/**
 * Gravação do fechamento da Ciência na /previa/refinada (frases + paisagem + módulo topo-revisao do
 * Motion, versão padrão ou a indicada), página real, rolagem normal com a roda do mouse (sem script de rolagem): ida lenta pelas quatro
 * frases, volta, ida de novo, pausa global no meio (composição estática) e retomada, e chegada ao Time.
 * O Chromium headless não desenha o ponteiro: um marcador de cursor é injetado só na gravação.
 *   node tests/record-ciencia-revisao.mjs <pasta> [versão-da-paisagem]      (servidor em :3000; padrão = versão padrão)
 */
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/ciencia-revisao/gravacoes";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const QS = process.argv[3] ? `?paisagem=${process.argv[3]}` : "";
const b = await chromium.launch();
const CURSOR = () => addEventListener("DOMContentLoaded", () => {
  const c = document.createElement("div");
  c.style.cssText = "position:fixed;z-index:2147483647;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:rgba(212,175,55,.55);border:2px solid #0D1B2A;pointer-events:none";
  document.body.appendChild(c);
  addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
});
async function rec(name, vp, fn, o = {}) {
  const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: out, size: vp }, hasTouch: !!o.touch });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  if (!o.touch) await p.addInitScript(CURSOR);
  await p.goto(BASE + "/previa/refinada" + QS, { waitUntil: "networkidle" });
  const y = await p.evaluate(() => document.querySelector("[data-frase-ativa]").getBoundingClientRect().top + scrollY - innerHeight * 0.95);
  await p.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
  await p.mouse.move(vp.width * 0.7, vp.height * 0.5);
  await p.waitForTimeout(900);
  await fn(p);
  const v = p.video(); await ctx.close();
  renameSync(await v.path(), `${out}/${name}.webm`);
  console.log(name, "ok");
}
const roda = async (p, dy, passos, ms) => { for (let i = 0; i < passos; i++) { await p.mouse.wheel(0, dy); await p.waitForTimeout(ms); } };
await rec("ciencia-revisao-desktop-1440x900", { width: 1440, height: 900 }, async (p) => {
  await roda(p, 20, 34, 160); // ida lenta pelas quatro etapas (≈ 680 px)
  await p.waitForTimeout(1400);
  await roda(p, -20, 24, 140); // volta
  await p.waitForTimeout(900);
  await roda(p, 20, 14, 160); // ida até o meio
  await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector("header button[aria-pressed]").click()); // pausa: estático
  await p.waitForTimeout(1600);
  await p.evaluate(() => document.querySelector("header button[aria-pressed]").click()); // retoma
  await p.waitForTimeout(1000);
  await roda(p, 20, 16, 160);
  await p.waitForTimeout(800);
  await roda(p, 100, 6, 160); // segue para o Time
  await p.waitForTimeout(1000);
});
await rec("ciencia-revisao-celular-390x844", { width: 390, height: 844 }, async (p) => {
  for (let i = 0; i < 18; i++) { await p.evaluate(() => scrollBy({ top: 30, behavior: "instant" })); await p.waitForTimeout(140); }
  await p.waitForTimeout(900);
  for (let i = 0; i < 14; i++) { await p.evaluate(() => scrollBy({ top: -30, behavior: "instant" })); await p.waitForTimeout(120); }
  await p.waitForTimeout(700);
  for (let i = 0; i < 22; i++) { await p.evaluate(() => scrollBy({ top: 30, behavior: "instant" })); await p.waitForTimeout(140); }
  await p.waitForTimeout(800);
}, { touch: true });
await b.close();
