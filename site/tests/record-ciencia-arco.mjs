/**
 * Gravação do fechamento da Ciência na /previa/refinada com o ENCERRAMENTO (crista → arco, topo-revisao 0.3.0),
 * página real, rolagem normal com a roda do mouse (desktop) ou rolagem por toque simulada (celular): quatro frases,
 * encerramento com paradas intermediárias (o quadro fica), final, chegada ao Time, volta com paradas, pausa do
 * Site no meio do encerramento e retomada. Uma legenda com p / e / fase é injetada SÓ na gravação.
 *   node tests/record-ciencia-arco.mjs <pasta> [versão]      (servidor em :3000)
 */
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/ciencia-arco/gravacoes";
const QS = process.argv[3] ? `?paisagem=${process.argv[3]}` : "";
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const HUD = () => addEventListener("DOMContentLoaded", () => {
  const h = document.createElement("div");
  h.style.cssText = "position:fixed;z-index:2147483647;right:8px;bottom:8px;padding:4px 8px;font:12px/1.3 monospace;background:rgba(13,27,42,.78);color:#fff;border-radius:4px;pointer-events:none";
  document.body.appendChild(h);
  const tick = () => { const c = document.querySelector("[data-frase-ativa]"); if (c) { const f = c.querySelector("p"); h.textContent = `p ${c.dataset.progresso} · e ${c.dataset.encerramento ?? "-"} · ${f.dataset.topoFase ?? f.dataset.topoModo ?? "estático"}`; } requestAnimationFrame(tick); };
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
  await p.goto("http://localhost:3000/previa/refinada" + QS, { waitUntil: "networkidle" });
  // posições pela página real (as mesmas definições do Site)
  const pos = await p.evaluate(() => {
    const c = document.querySelector("[data-frase-ativa]"); const pa = c.querySelector("[class*=paisagem]"); const u = c.querySelector("[data-i='3']");
    const Y = (el) => el.getBoundingClientRect().top + scrollY; const vh = innerHeight;
    const hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72;
    const s0 = Y(pa) - 0.85 * vh, s1 = Y(u) + u.getBoundingClientRect().height / 2 - 0.45 * vh;
    return { s0, s1, sE: Math.max(s1 + 0.2 * vh, Y(pa) - hdr - 12) };
  });
  await p.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), Math.round(pos.s0 - 60));
  await p.mouse.move(vp.width * 0.7, vp.height * 0.5);
  await p.waitForTimeout(900);
  const rolar = async (ate, ms = 150) => {
    for (;;) {
      const y = await p.evaluate(() => scrollY);
      const d = ate - y; if (Math.abs(d) < passo / 2) break;
      const s = Math.sign(d) * Math.min(passo, Math.abs(d));
      if (o.touch) await p.evaluate((v) => scrollBy({ top: v, behavior: "instant" }), s); else await p.mouse.wheel(0, s);
      await p.waitForTimeout(ms);
    }
  };
  const E = (f) => pos.s1 + f * (pos.sE - pos.s1);
  await rolar(pos.s1); await p.waitForTimeout(900); // quatro frases → decisão dourada
  await rolar(E(0.3)); await p.waitForTimeout(1300); // parada no encerramento
  await rolar(E(0.6)); await p.waitForTimeout(1300); // parada
  await rolar(E(1)); await p.waitForTimeout(1300); // final
  await rolar(E(1) + 160); await p.waitForTimeout(900); // segue para o Time
  await rolar(E(0.6)); await p.waitForTimeout(1200); // volta com paradas
  await rolar(E(0.25)); await p.waitForTimeout(1200);
  await rolar(pos.s1 - 80); await p.waitForTimeout(1000);
  await rolar(E(0.5)); await p.waitForTimeout(900);
  if (!o.touch) {
    await p.evaluate(() => document.querySelector("header button[aria-pressed]").click()); // pausa: estático (final com arco)
    await p.waitForTimeout(1800);
    await p.evaluate(() => document.querySelector("header button[aria-pressed]").click()); // retoma: volta ao quadro da posição
    await p.waitForTimeout(1300);
  }
  await rolar(E(1) + 220); await p.waitForTimeout(1000);
  const v = p.video(); await ctx.close();
  renameSync(await v.path(), `${out}/${name}.webm`);
  console.log(name, "ok");
}
await rec("ciencia-arco-desktop-1440x900", { width: 1440, height: 900 }, 20);
await rec("ciencia-arco-desktop-1920x1080", { width: 1920, height: 1080 }, 24);
await rec("ciencia-arco-celular-390x844", { width: 390, height: 844 }, 24, { touch: true });
await b.close();
