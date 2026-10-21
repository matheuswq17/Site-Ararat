/**
 * Experimento brand-sinal-v1 — conferência de layout da identidade ARARAT Sinal.
 *
 *   BASE=http://localhost:3020 node tests/sinal-layout.mjs
 *
 * Para "/" e "/pt" em 320, 390, 768, 1280, 1440, 1920 e 2560 px (+ telas baixas 1280×600 e 390×640):
 *  · sem rolagem horizontal do documento;
 *  · fontes oficiais carregadas (Geist 400/500/600, Geist Mono 400/500);
 *  · h1/h2 em Geist 500; botões em Geist; só Geist 400/500/600 e Geist Mono 400/500 no texto;
 *  · cabeçalho com o lockup COMPACTO (< 40 px de altura) e rodapé com o FULL (≥ 40 px), proporções
 *    do arquivo preservadas, sem corte; sem o ciclo MODEL/PROSTATE;
 *  · favicon oficial do Sinal declarado; mensagem do Sinal na 1ª dobra;
 *  · CLS acumulado ao percorrer a página (rolagem por passos) ≤ 0,1;
 *  · nenhum erro de console/página.
 * Sai com código 1 em qualquer falha.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3020";
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
      const logo = document.querySelector("header img[src*='lockup-horizontal-compacto-escuro']");
      const lr = logo?.getBoundingClientRect();
      const rod = document.querySelector("footer img[src*='lockup-horizontal-escuro.svg']")?.getBoundingClientRect();
      return {
        overflow: de.scrollWidth - de.clientWidth,
        lora: ["400", "500", "600"].every((p) => document.fonts.check(`${p} 16px "Geist"`)) && [...document.fonts].some((f) => f.family.replace(/"/g, "") === "Geist" && f.status === "loaded"),
        inter: ["400", "500"].every((p) => document.fonts.check(`${p} 11px "Geist Mono"`)) && [...document.fonts].some((f) => f.family.replace(/"/g, "") === "Geist Mono" && f.status === "loaded"),
        rodape: rod ? { w: rod.width, h: rod.height, right: rod.right } : null,
        titulo: document.getElementById("hero-title")?.textContent.replace(/\s+/g, " ").trim(),
        h: [...document.querySelectorAll("main h1, main h2")].map((e) => `${getComputedStyle(e).fontFamily.split(",")[0]}/${getComputedStyle(e).fontWeight}`),
        btn: [...document.querySelectorAll("main .btn, header .btn")].map((e) => getComputedStyle(e).fontFamily.split(",")[0]),
        pesos: [...pesos],
        logo: lr ? { w: lr.width, h: lr.height, left: lr.left, right: lr.right } : null,
        vw: innerWidth,
        ciclo: !!document.querySelector("header [data-word]"),
        favicon: [...document.querySelectorAll("link[rel~=icon]")].map((l) => l.getAttribute("href")),
        cls: window.__cls,
      };
    });
    const nome = `${path} ${w}×${h}`;
    const antes = falhas;
    if (r.overflow > 0) falha(`${nome}: rolagem horizontal de ${r.overflow}px`);
    if (!r.lora || !r.inter) falha(`${nome}: fontes oficiais não carregadas (Geist ${r.lora}, Geist Mono ${r.inter})`);
    const hRuins = r.h.filter((x) => !/^"?Geist"?\/500$/.test(x));
    if (hRuins.length) falha(`${nome}: títulos fora de Geist 500: ${[...new Set(hRuins)].join(", ")}`);
    if (r.btn.some((f) => !/^"?Geist"?$/.test(f))) falha(`${nome}: botão fora de Geist`);
    const permitidos = /^(Geist (400|500|600)|Geist Mono (400|500))$/;
    const fora = r.pesos.filter((p) => !permitidos.test(p));
    if (fora.length) falha(`${nome}: família/peso fora do sistema: ${fora.join(", ")}`);
    if (!r.logo || r.logo.h >= 40 || r.logo.left < 0 || r.logo.right > r.vw || Math.abs(r.logo.w / r.logo.h - 704.1 / 106.5) > 0.03) falha(`${nome}: lockup compacto ${JSON.stringify(r.logo)}`);
    if (!r.rodape || r.rodape.h < 40 || r.rodape.right > r.vw || Math.abs(r.rodape.w / r.rodape.h - 722.9 / 124.2) > 0.03) falha(`${nome}: lockup full do rodapé ${JSON.stringify(r.rodape)}`);
    const esperado = path === "/" ? "Contrast is information. We measure. You decide." : "Contraste é informação. Nós medimos. Você decide.";
    if (r.titulo !== esperado) falha(`${nome}: 1ª dobra "${r.titulo}"`);
    if (r.ciclo) falha(`${nome}: ciclo MODEL/PROSTATE presente`);
    if (!r.favicon.some((f) => f?.includes("/marca-sinal/v1.0/favicon/"))) falha(`${nome}: favicon do Sinal ausente`);
    if (r.cls > 0.1) falha(`${nome}: CLS ${r.cls.toFixed(3)}`);
    if (erros.length) falha(`${nome}: erros ${erros.slice(0, 2).join(" | ")}`);
    if (falhas === antes) console.log(`  ✔ ${nome}: logo ${Math.round(r.logo.w)}×${Math.round(r.logo.h)} · CLS ${r.cls.toFixed(3)} · ${r.pesos.length} combinações tipográficas`);
    await ctx.close();
  }
}
await browser.close();
console.log(falhas ? `\n✘ ${falhas} falha(s)` : "\n✔ layout da identidade Sinal conferido");
process.exit(falhas ? 1 : 0);
