/**
 * Cumes na 1ª tela da /previa/refinada (montanha B 0.4.0-draft): a partir da variante que o
 * <picture> escolheu (currentSrc) e das coordenadas do objeto que o Motion publicou em
 * assets/arte-escultura-variantes.json, posição real do cume e do pico secundário na página,
 * margem acima da dobra e distância ao último texto do hero.
 *   node tests/medir-cumes.mjs      (servidor em :3000)
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const PKG = "public/previa/home-montanha-0.7.0/";
const idx = JSON.parse(readFileSync(PKG + "assets/arte-escultura-variantes.json", "utf8"));
const all = [...idx.familias.movel.variantes, ...idx.familias.desktop.variantes];
const b = await chromium.launch();
for (const [w, h] of [[1280, 720], [1440, 900], [768, 1024], [390, 844], [320, 568]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto("http://localhost:3000/previa/refinada", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  const m = await p.evaluate(() => {
    const img = document.querySelector("[data-opening=poster]"); const s = document.querySelector("[data-opening=slot]").getBoundingClientRect();
    const els = [...document.querySelectorAll('[data-opening="content"] > *')].filter((e) => e.getBoundingClientRect().height > 0);
    return { src: new URL(img.currentSrc).pathname, slot: [s.x, s.y, s.width, s.height], textBottom: Math.max(...els.map((e) => e.getBoundingClientRect().bottom)) };
  });
  const v = all.find((x) => m.src.endsWith(x.arquivos["1x"]) || m.src.endsWith(x.arquivos["2x"]));
  const k = m.slot[2] / v.areaCss.w; // a variante é exibida na largura do slot
  const y = (o) => Math.round(m.slot[1] + o.y * k);
  const cume = y(v.objeto.cume), sec = y(v.objeto.secundario), arco = Math.round(m.slot[1] + v.objeto.arcoTopo * k);
  console.log(`${w}x${h}  variante ${m.src.split("/").pop()} (escala ${k.toFixed(3)}) · topo do arco ${arco} · cume ${cume} (+${h - cume} px acima da dobra) · secundário ${sec} (+${h - sec}) · último texto ${Math.round(m.textBottom)} (folga até o arco ${arco - Math.round(m.textBottom)} px)`);
  await ctx.close();
}
await b.close();
