// Gravação do ritmo da entrada na jornada: /previa (base, smooth do navegador) × /previa/a e
// /previa/b (1000 ms, 3t²−2t³). Clique no CTA, pausa na chegada; depois, uma interrupção pela roda.
// Grava também a trajetória medida (t, scrollY, p) de cada execução em JSON.
//   node tests/record-entrada.mjs <pasta>    (servidor em :3000). Vídeo headless: ritmo, não FPS.
import { chromium } from "playwright";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/previa-entrada";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
const traj = {};
for (const [w, h] of (process.env.VPS ?? "1440x900,390x844").split(",").map((v) => v.split("x").map(Number))) {
  // ROUTES="base:/previa,refinada:/previa/refinada" escolhe as rotas (padrão: base, a, b).
  for (const [name, path] of (process.env.ROUTES ?? "base:/previa,a:/previa/a,b:/previa/b").split(",").map((r) => r.split(":"))) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: out, size: { width: w, height: h } } });
    const p = await ctx.newPage();
    await p.addInitScript(() => {
      sessionStorage.setItem("ararat:intro", "1");
      window.__f = [];
      const tick = (t) => { const r = document.querySelector("[data-opening=root]"); window.__f.push([Math.round(t), Math.round(scrollY), r ? +parseFloat(r.style.getPropertyValue("--opening-p") || "0").toFixed(3) : 0]); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      // instante real do clique (o tempo de ação do Playwright não entra na medida)
      addEventListener("click", (e) => { if (e.target.closest?.('a[href="#jornada"]')) window.__click = e.timeStamp; }, true);
    });
    await p.goto(BASE + path, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    await p.locator("#inicio a", { hasText: "Entre na imagem" }).click();
    await p.waitForTimeout(2600);
    const tc = await p.evaluate(() => window.__click);
    traj[`${w}-${name}`] = await p.evaluate((tc) => window.__f.filter((f) => f[0] >= tc - 50 && f[0] <= tc + 1600).map((f) => [Math.round(f[0] - tc), f[1], f[2]]), tc);
    // interrupção pela roda no meio da entrada
    await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.waitForTimeout(1200);
    await p.locator("#inicio a", { hasText: "Entre na imagem" }).click();
    await p.waitForTimeout(420);
    await p.mouse.move(w / 2, h / 2);
    await p.mouse.wheel(0, 100);
    await p.waitForTimeout(2200);
    const v = p.video();
    await ctx.close();
    renameSync(await v.path(), `${out}/entrada-${name}-${w}x${h}.webm`);
  }
}
writeFileSync(`${out}/trajetorias.json`, JSON.stringify(traj));
await b.close();
console.log("ok");
