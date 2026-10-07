// Medidas reais da /previa integrada (home-v2 0.2.1-draft): texto, slot da arte, composição do
// módulo, quadro da jornada, pista e fim da passagem.   node tests/measure-opening.mjs
import { chromium } from "playwright";
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto("http://localhost:3000/previa", { waitUntil: "networkidle" });
  await p.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas");
  const m = await p.evaluate(async () => {
    const mod = await import("/previa/home-v2-0.2.1/web/home-sculpture.js");
    const host = document.querySelector("[data-opening=sticky] > div:last-child").getBoundingClientRect();
    const slot = document.querySelector("[data-opening=slot]").getBoundingClientRect();
    const content = document.querySelector("[data-opening=content]").getBoundingClientRect();
    const f = document.querySelector("#jornada [data-layout]").getBoundingClientRect();
    const comp = mod.homeComposition({ x: slot.left - host.left, y: slot.top - host.top, w: slot.width, h: slot.height });
    const col = document.querySelector("[data-opening=stage-col]");
    const rd = document.querySelector("[data-opening=runway-desktop]").offsetHeight;
    const rm = document.querySelector("[data-opening=runway-mobile]").offsetHeight;
    const end = rd || rm - (parseFloat(getComputedStyle(col).top) || 0);
    const arc = JSON.parse(document.querySelector("#jornada .ararat-journey").dataset.startArc);
    const r1 = (v) => +v.toFixed(1);
    return {
      textoFim: r1(content.bottom), slot: [slot.left, slot.top, slot.width, slot.height].map(r1),
      layout: comp.layout, arcR: r1(comp.arcR), R0: r1(comp.R0), topoArco: r1(comp.cy - comp.arcR),
      quadro: [f.left, f.top, f.width, f.height].map(r1), pista: rd || rm, fimPassagem: end,
      arcoCena: [arc.cx, arc.cy, arc.r].map(r1), arcoWH: [arc.W, arc.H],
    };
  });
  console.log(`${w}x${h}`, JSON.stringify(m));
  await p.close();
}
await b.close();
