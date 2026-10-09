/**
 * Alternativa codex/brand-03d2-v1 — conferência de layout da identidade ARARAT 03D2.
 *
 *   BASE=http://localhost:3030 node tests/marca-03d2-layout.mjs
 *
 * Para "/" e "/pt" em 320, 390, 768, 1280, 1440, 1920 e 2560 px (+ telas baixas 1280×600 e 390×640):
 *  · sem rolagem horizontal do documento;
 *  · fontes oficiais REALMENTE carregadas: as WOFF2 variáveis do kit (/marca-03d2/…/03_tipografia/fontes/)
 *    baixadas (Resource Timing) e as famílias "Geist"/"Geist Mono" com status loaded; nenhuma fonte do Sinal;
 *  · h1/h2 em Geist 500; botões em Geist; só Geist 400/500/600 e Geist Mono 400/500 no texto;
 *  · cabeçalho com a assinatura HORIZONTAL (símbolo mestre) com ≥ 160 px de largura, proporção do arquivo
 *    (sem esticar), dentro da tela e com a área de proteção (1 a) até o próximo controle; rodapé com a
 *    horizontal negativa, ≥ 160 px, mesma proporção; sem o ciclo MODEL/PROSTATE; sem a compacta/micro;
 *  · favicon oficial do 03D2 declarado (ICO + SVG) e manifesto web; mensagem na 1ª dobra;
 *  · CLS acumulado ao percorrer a página (rolagem por passos) ≤ 0,1;
 *  · nenhum erro de console/página.
 * Sai com código 1 em qualquer falha.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3030";
const TELAS = [
  [320, 700], [390, 844], [768, 1024], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440],
  [1280, 600], [390, 640], [360, 780], [375, 667],
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
      const logoEl = document.querySelector("header [data-assinatura] svg, header img[data-assinatura]");
      const lr = logoEl?.getBoundingClientRect();
      // próximo controle visível à direita da assinatura, na mesma faixa do cabeçalho
      const prox = [...document.querySelectorAll("header .language-switch, header button, header nav a")]
        .map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0 && lr && r.top < lr.bottom && r.bottom > lr.top && r.left >= lr.left)
        .map((r) => r.left);
      const rod = document.querySelector("footer img[data-assinatura]")?.getBoundingClientRect();
      const fontes = performance.getEntriesByType("resource").map((e) => e.name).filter((n) => /\.woff2$/.test(n));
      return {
        overflow: de.scrollWidth - de.clientWidth,
        lora: ["400", "500", "600"].every((p) => document.fonts.check(`${p} 16px "Geist"`)) && [...document.fonts].some((f) => f.family.replace(/"/g, "") === "Geist" && f.status === "loaded"),
        inter: ["400", "500"].every((p) => document.fonts.check(`${p} 11px "Geist Mono"`)) && [...document.fonts].some((f) => f.family.replace(/"/g, "") === "Geist Mono" && f.status === "loaded"),
        rodape: rod ? { w: rod.width, h: rod.height, right: rod.right } : null,
        titulo: document.getElementById("hero-title")?.textContent.replace(/\s+/g, " ").trim(),
        h: [...document.querySelectorAll("main h1, main h2")].map((e) => `${getComputedStyle(e).fontFamily.split(",")[0]}/${getComputedStyle(e).fontWeight}`),
        btn: [...document.querySelectorAll("main .btn, header .btn")].map((e) => getComputedStyle(e).fontFamily.split(",")[0]),
        pesos: [...pesos],
        // 1 a (altura das maiúsculas) = 100/118 da altura da tinta; no SVG animável a tinta ocupa 118 de 122 u.
        logo: lr ? { a: Math.round(lr.height * (logoEl.tagName === "svg" ? 118 / 122 : 1) * (100 / 118) * 10) / 10, w: lr.width, h: lr.height, left: lr.left, right: lr.right, tipo: logoEl.tagName, prox: prox.length ? Math.min(...prox) : null } : null,
        compacta: !!document.querySelector("img[src*='compacta'], img[src*='micro']"),
        fontes,
        manifesto: document.querySelector("link[rel=manifest]")?.getAttribute("href"),
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
    const baixadas = ["Geist-Variable.woff2", "GeistMono-Variable.woff2"].every((f) => r.fontes.some((u) => u.includes("/marca-03d2/v1.0/03_tipografia/fontes/" + f)));
    if (!baixadas) falha(`${nome}: WOFF2 do kit não baixadas: ${r.fontes.join(", ")}`);
    if (r.fontes.some((u) => u.includes("/marca-sinal/") || u.includes("/previa/tipografia/"))) falha(`${nome}: fonte de outra identidade baixada: ${r.fontes.join(", ")}`);
    const hRuins = r.h.filter((x) => !/^"?Geist"?\/500$/.test(x));
    if (hRuins.length) falha(`${nome}: títulos fora de Geist 500: ${[...new Set(hRuins)].join(", ")}`);
    if (r.btn.some((f) => !/^"?Geist"?$/.test(f))) falha(`${nome}: botão fora de Geist`);
    const permitidos = /^(Geist (400|500|600)|Geist Mono (400|500))$/;
    const fora = r.pesos.filter((p) => !permitidos.test(p));
    if (fora.length) falha(`${nome}: família/peso fora do sistema: ${fora.join(", ")}`);
    const propCab = r.logo?.tipo === "svg" ? 1025.6 / 122 : 1021.65 / 118;
    if (!r.logo || r.logo.w < 160 || r.logo.left < 0 || r.logo.right > r.vw || Math.abs(r.logo.w / r.logo.h - propCab) > 0.05 || (r.logo.prox !== null && r.logo.prox - r.logo.right < r.logo.a))
      falha(`${nome}: assinatura do cabeçalho ${JSON.stringify(r.logo)}`);
    if (!r.rodape || r.rodape.w < 160 || r.rodape.right > r.vw || Math.abs(r.rodape.w / r.rodape.h - 1021.65 / 118) > 0.05) falha(`${nome}: assinatura do rodapé ${JSON.stringify(r.rodape)}`);
    if (r.compacta) falha(`${nome}: compacta/micro usada numa assinatura`);
    const esperado = path === "/" ? "Contrast is information. We measure. You decide." : "Contraste é informação. Nós medimos. Você decide.";
    if (r.titulo !== esperado) falha(`${nome}: 1ª dobra "${r.titulo}"`);
    if (r.ciclo) falha(`${nome}: ciclo MODEL/PROSTATE presente`);
    if (!r.favicon.some((f) => f?.endsWith("/marca-03d2/v1.0/01_logo/favicon/favicon.ico")) || !r.favicon.some((f) => f?.endsWith("/marca-03d2/v1.0/01_logo/favicon/favicon.svg"))) falha(`${nome}: favicon do 03D2 ausente: ${r.favicon.join(", ")}`);
    if (r.manifesto !== "/marca-03d2/v1.0/01_logo/favicon/site.webmanifest") falha(`${nome}: manifesto web ${r.manifesto}`);
    if (r.cls > 0.1) falha(`${nome}: CLS ${r.cls.toFixed(3)}`);
    if (erros.length) falha(`${nome}: erros ${erros.slice(0, 2).join(" | ")}`);
    if (falhas === antes) console.log(`  ✔ ${nome}: assinatura ${Math.round(r.logo.w)}×${Math.round(r.logo.h)} (respiro ${r.logo.prox === null ? "—" : Math.round(r.logo.prox - r.logo.right)} px) · rodapé ${Math.round(r.rodape.w)} px · CLS ${r.cls.toFixed(3)} · ${r.pesos.length} combinações tipográficas`);
    await ctx.close();
  }
}
await browser.close();
console.log(falhas ? `\n✘ ${falhas} falha(s)` : "\n✔ layout da identidade 03D2 conferido");
process.exit(falhas ? 1 : 0);
