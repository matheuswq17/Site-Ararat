/**
 * Área REAL da arte na /previa/refinada para o Motion: slot (px de página, topo), faixa da área
 * efetivamente vista antes da dobra (em coordenadas da ÁREA, 0 = topo do slot), último texto,
 * convite "Role para explorar" e cabeçalho — com a variante do poster em uso.
 *   node tests/medir-area-arte.mjs [saida.json]     (servidor em :3000)
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch();
const out = {};
for (const [w, h] of [[1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto(BASE + "/previa/refinada", { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
  const m = await p.evaluate(() => {
    const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } : null; };
    const slot = R(document.querySelector("[data-opening=slot]"));
    const els = [...document.querySelectorAll('[data-opening="content"] > *')].filter((e) => e.getBoundingClientRect().height > 0);
    const textBottom = Math.round(Math.max(...els.map((e) => e.getBoundingClientRect().bottom)));
    const inv = document.querySelector("[data-opening=invite]");
    const invite = inv && getComputedStyle(inv).display !== "none" ? R(inv) : null;
    const img = document.querySelector("[data-opening=poster]");
    return { slot, textBottom, invite, header: Math.round(document.querySelector("header").getBoundingClientRect().bottom), poster: img ? new URL(img.currentSrc).pathname.split("/").pop() : null, pkg: document.querySelector("[data-opening=root]").dataset.previewVersion };
  });
  const visH = Math.max(0, Math.min(m.slot.h, h - m.slot.y));
  out[`${w}x${h}`] = {
    ...m,
    visivelNaArea: { y0: 0, y1: visH, fracao: +(visH / m.slot.h).toFixed(3) },
    // convite em coordenadas da área (para a onda evitar competir com o texto do convite)
    conviteNaArea: m.invite ? { x: m.invite.x - m.slot.x, y: m.invite.y - m.slot.y, w: m.invite.w, h: m.invite.h } : null,
  };
  await ctx.close();
}
await b.close();
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
for (const [k, v] of Object.entries(out)) {
  console.log(`${k}: slot ${v.slot.x},${v.slot.y} ${v.slot.w}×${v.slot.h} · área vista y 0–${v.visivelNaArea.y1} (${Math.round(v.visivelNaArea.fracao * 100)} %) · último texto ${v.textBottom} · convite ${v.conviteNaArea ? `${v.conviteNaArea.x},${v.conviteNaArea.y} ${v.conviteNaArea.w}×${v.conviteNaArea.h} (na área)` : "oculto"} · poster ${v.poster}`);
}
