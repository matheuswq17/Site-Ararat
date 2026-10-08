/**
 * Gravação da demonstração "do Hub ao Viewer" na /previa/refinada (página real, build de produção).
 * Rolagem com a roda do mouse (desktop) ou rolagem por toque simulada (celular): percurso com paradas
 * intermediárias (o quadro fica), fim, volta com paradas, pausa do Site no meio (roteiro estático na mesma etapa) e
 * retomada. Uma leitura p / etapa / modo é sobreposta SÓ na gravação; o cursor também é injetado só aqui.
 *   node tests/record-plataforma-fluxo.mjs <pasta>
 */
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/plataforma-fluxo/gravacoes";
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const HUD = () => addEventListener("DOMContentLoaded", () => {
  const h = document.createElement("div");
  h.style.cssText = "position:fixed;z-index:2147483647;right:8px;bottom:8px;padding:4px 8px;font:12px/1.3 monospace;background:rgba(0,0,0,.7);color:#fff;border-radius:4px;pointer-events:none";
  document.body.appendChild(h);
  const tick = () => { const r = document.querySelector("[data-fluxo=root]"); if (r) h.textContent = `p ${r.dataset.progresso ?? "-"} · etapa ${r.dataset.fluxoEtapa ?? "-"} · ${r.dataset.fluxoModo ?? "-"}`; requestAnimationFrame(tick); };
  tick();
});
const CURSOR = () => addEventListener("DOMContentLoaded", () => {
  const c = document.createElement("div");
  c.style.cssText = "position:fixed;z-index:2147483647;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:rgba(212,175,55,.55);border:2px solid #0D1B2A;pointer-events:none";
  document.body.appendChild(c);
  addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
});
async function rec(name, vp, passo, o = {}) {
  const ctx = await b.newContext({ viewport: vp, recordVideo: { dir: out, size: vp }, hasTouch: !!o.touch });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.addInitScript(HUD);
  if (!o.touch) await p.addInitScript(CURSOR);
  await p.goto("http://localhost:3000/previa/refinada", { waitUntil: "networkidle" });
  const t = await p.evaluate(() => { const r = document.querySelector("[data-fluxo=trilho]").getBoundingClientRect(); const cab = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72; return { top: r.top + scrollY, curso: r.height - (innerHeight - cab), cab }; });
  const Y = (f) => Math.round(t.top - t.cab + f * t.curso);
  await p.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), Y(0) - 260);
  await p.mouse.move(vp.width * 0.72, vp.height * 0.5);
  await p.waitForTimeout(900);
  const rolar = async (ate, ms = 110) => {
    for (;;) {
      const y = await p.evaluate(() => scrollY);
      const d = ate - y; if (Math.abs(d) < passo / 2) break;
      const s = Math.sign(d) * Math.min(passo, Math.abs(d));
      if (o.touch) await p.evaluate((v) => scrollBy({ top: v, behavior: "instant" }), s); else await p.mouse.wheel(0, s);
      await p.waitForTimeout(ms);
    }
  };
  for (const f of [0.12, 0.27, 0.4, 0.55, 0.68, 0.82, 1]) { await rolar(Y(f)); await p.waitForTimeout(1100); } // ida com paradas
  await rolar(Y(0.62)); await p.waitForTimeout(1000); // volta com paradas
  await rolar(Y(0.33)); await p.waitForTimeout(1000);
  await rolar(Y(0.52)); await p.waitForTimeout(800);
  if (!o.touch) {
    await p.evaluate(() => document.querySelector("header button[aria-pressed]").click()); // pausa: roteiro estático
    await p.waitForTimeout(2000);
    await p.evaluate(() => document.querySelector("header button[aria-pressed]").click()); // retoma
    await p.waitForTimeout(1500);
  }
  await rolar(Y(1) + 500); await p.waitForTimeout(1000);
  const v = p.video(); await ctx.close();
  renameSync(await v.path(), `${out}/${name}.webm`);
  console.log(name, "ok");
}
await rec("plataforma-fluxo-desktop-1440x900", { width: 1440, height: 900 }, 40);
await rec("plataforma-fluxo-desktop-1920x1080", { width: 1920, height: 1080 }, 48);
await rec("plataforma-fluxo-celular-390x844", { width: 390, height: 844 }, 36, { touch: true });
await b.close();
