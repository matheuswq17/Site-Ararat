// Comparação tipográfica no contexto real: /previa (base, Montserrat + Open Sans) × /previa/a ×
// /previa/b — hero, Plataforma e Explicabilidade, desktop e celular, mesmos textos.
// Mede também linhas dos títulos, cortes (overflow) e deslocamento de layout (CLS) na carga.
//   node tests/capture-tipografia.mjs <pasta>     (servidor em :3000)
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/previa-tipografia";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
// ROUTES="base:/previa,a:/previa/a,refinada:/previa/refinada" escolhe as rotas (padrão: base, a, b).
const ROUTES = (process.env.ROUTES ?? "base:/previa,a:/previa/a,b:/previa/b").split(",").map((r) => r.split(":"));
const VPS = (process.env.VPS ?? "1440x900,390x844").split(",").map((v) => v.split("x").map(Number));
const b = await chromium.launch();
const report = [];
for (const [w, h] of VPS) for (const [name, path] of ROUTES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    sessionStorage.setItem("ararat:intro", "1");
    window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  });
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(600);
  const tag = `${w}-${name}`;
  await p.screenshot({ path: `${out}/${tag}-1-hero.png` });
  const m = await p.evaluate(() => {
    const lines = (el) => { if (!el) return null; const cs = getComputedStyle(el); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2; return Math.round(el.getBoundingClientRect().height / lh); };
    const box = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)]; };
    const cut = [...document.querySelectorAll("h1,h2,h3,p,a,button,li,span")].filter((e) => {
      const cs = getComputedStyle(e);
      if (cs.display === "inline" || e.closest("[aria-hidden=true], .visually-hidden") || e.getBoundingClientRect().width <= 2) return false;
      return e.scrollWidth > e.clientWidth + 1 && cs.overflowX !== "visible";
    }).map((e) => e.textContent.trim().slice(0, 40));
    const fam = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontFamily.split(",")[0] + " " + getComputedStyle(e).fontWeight + " " + getComputedStyle(e).fontSize : null; };
    const loaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight}`);
    return {
      heroTitle: { lines: lines(document.getElementById("hero-title")), box: box("#hero-title"), font: fam("#hero-title") },
      heroText: { lines: lines(document.querySelector("[data-opening=content] p:not(.eyebrow)")), font: fam("[data-opening=content] p:not(.eyebrow)") },
      slot: box("[data-opening=slot]"),
      platTitle: { lines: lines(document.querySelector("#plataforma h2")), font: fam("#plataforma h2") },
      explTitle: { lines: lines(document.querySelector("#explicabilidade h2")), font: fam("#explicabilidade h2") },
      wordmark: fam("header a[href='#inicio'] [class*=ararat]"),
      overflowX: document.documentElement.scrollWidth > innerWidth,
      cut, fontsLoaded: [...new Set(loaded)], cls: window.__cls,
    };
  });
  // Seções: rolagem real até o topo da seção e capturas da viewport (a captura "fullPage"
  // redimensiona a janela e altera as unidades vh do layout de abertura).
  for (const [n, id] of [[2, "plataforma"], [3, "explicabilidade"]]) {
    const top = await p.evaluate((i) => Math.round(document.getElementById(i).getBoundingClientRect().top + scrollY), id);
    for (const [k, off] of [[1, 0], [2, Math.round(h * 0.85)]]) {
      await p.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), top + off);
      await p.waitForTimeout(1600); // revelações de texto (TextReveal) concluídas
      await p.screenshot({ path: `${out}/${tag}-${n}-${id}-${k}.png` });
    }
  }
  report.push({ w, route: name, ...m });
  console.log(w, name, JSON.stringify(m));
  await ctx.close();
}
writeFileSync(`${out}/medidas.json`, JSON.stringify(report, null, 2));
await b.close();
