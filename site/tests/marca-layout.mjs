/**
 * Experimento brand-canonical-v1 — conferência de layout da identidade canônica.
 *
 *   BASE=http://localhost:3010 node tests/marca-layout.mjs
 *
 * Para "/" e "/pt" em 320, 390, 768, 1280, 1440, 1920 e 2560 px (+ telas baixas 1280×600 e 390×640):
 *  · sem rolagem horizontal do documento;
 *  · fontes canônicas carregadas (Lora 600, Inter 400/500/600) e sem família de reserva no uso final;
 *  · títulos h1/h2 em Lora 600; botões/navegação em Inter; nenhum peso fora de Lora 600 · Inter 400/500/600;
 *  · lockup do cabeçalho ≥ 120 px de largura, proporção 1800:620 preservada; sem o ciclo MODEL/PROSTATE;
 *  · favicon canônico declarado;
 *  · CLS acumulado ao percorrer a página (rolagem por passos) ≤ 0,1;
 *  · nenhum erro de console/página.
 * Sai com código 1 em qualquer falha.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3010";
const TELAS = [
  [320, 700], [390, 844], [768, 1024], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440],
  [1280, 600], [390, 640],
];
const browser = await chromium.launch();
let falhas = 0;
const falha = (m) => { falhas++; console.log("  ✘ " + m); };

for (const path of ["/", "/pt"]) {
  for (const [w, h] of TELAS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const erros = [];
    page.on("pageerror", (e) => erros.push(String(e)));
    page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    // Percorre a página em passos (aciona revelações, módulos e carregamentos tardios).
    const altura = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < altura; y += Math.round(h * 0.8)) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const pesos = new Set();
      for (const el of document.querySelectorAll("main *, header *, footer *")) {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        pesos.add(`${cs.fontFamily.split(",")[0].replace(/"/g, "")} ${cs.fontWeight}`);
      }
      const logo = document.querySelector("header img[src*='masterbrand-logo-horizontal']");
      const lr = logo?.getBoundingClientRect();
      return {
        overflow: de.scrollWidth - de.clientWidth,
        lora: document.fonts.check('600 32px "ARARAT Lora"'),
        inter: ["400", "500", "600"].every((p) => document.fonts.check(`${p} 16px "ARARAT Inter"`)),
        h: [...document.querySelectorAll("main h1, main h2")].map((e) => `${getComputedStyle(e).fontFamily.split(",")[0]}/${getComputedStyle(e).fontWeight}`),
        btn: [...document.querySelectorAll("main .btn, header .btn")].map((e) => getComputedStyle(e).fontFamily.split(",")[0]),
        pesos: [...pesos],
        logo: lr ? { w: lr.width, h: lr.height } : null,
        ciclo: !!document.querySelector("header [data-word]"),
        favicon: [...document.querySelectorAll("link[rel~=icon]")].map((l) => l.getAttribute("href")),
        cls: window.__cls,
      };
    });
    const nome = `${path} ${w}×${h}`;
    const antes = falhas;
    if (r.overflow > 0) falha(`${nome}: rolagem horizontal de ${r.overflow}px`);
    if (!r.lora || !r.inter) falha(`${nome}: fontes canônicas não carregadas (Lora ${r.lora}, Inter ${r.inter})`);
    const hRuins = r.h.filter((x) => !/ARARAT Lora.*\/600$/.test(x));
    if (hRuins.length) falha(`${nome}: títulos fora de Lora 600: ${[...new Set(hRuins)].join(", ")}`);
    if (r.btn.some((f) => !/ARARAT Inter/.test(f))) falha(`${nome}: botão fora de Inter`);
    const permitidos = /^(ARARAT Lora 600|ARARAT Inter (400|500|600))$/;
    const fora = r.pesos.filter((p) => !permitidos.test(p));
    if (fora.length) falha(`${nome}: família/peso fora do sistema: ${fora.join(", ")}`);
    if (!r.logo || r.logo.w < 120 || Math.abs(r.logo.w / r.logo.h - 1800 / 620) > 0.02) falha(`${nome}: lockup ${JSON.stringify(r.logo)}`);
    if (r.ciclo) falha(`${nome}: ciclo MODEL/PROSTATE presente`);
    if (!r.favicon.some((f) => f?.includes("ararat-favicon-reversed-16px"))) falha(`${nome}: favicon canônico ausente`);
    if (r.cls > 0.1) falha(`${nome}: CLS ${r.cls.toFixed(3)}`);
    if (erros.length) falha(`${nome}: erros ${erros.slice(0, 2).join(" | ")}`);
    if (falhas === antes) console.log(`  ✔ ${nome}: logo ${Math.round(r.logo.w)}×${Math.round(r.logo.h)} · CLS ${r.cls.toFixed(3)} · ${r.pesos.length} combinações tipográficas`);
    await ctx.close();
  }
}
await browser.close();
console.log(falhas ? `\n✘ ${falhas} falha(s)` : "\n✔ layout da identidade canônica conferido");
process.exit(falhas ? 1 : 0);
