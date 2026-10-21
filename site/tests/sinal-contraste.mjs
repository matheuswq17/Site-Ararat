/**
 * Contraste no USO REAL da identidade ARARAT Sinal (experimento brand-sinal-v1).
 *
 *   BASE=http://localhost:3020 node tests/marca-contraste.mjs            # "/" e "/pt", 1440 e 390
 *   BASE=… PATHS=/,/pt WIDTHS=1440,390 node tests/marca-contraste.mjs
 *
 * Percorre TODOS os elementos com texto próprio visível, abre os <details> e compõe a cor do texto
 * e os fundos semitransparentes dos ancestrais até um fundo opaco (WCAG 2.x, luminância sRGB).
 * Limiar: 4,5:1 para texto normal; 3:1 para texto grande (≥ 24 px, ou ≥ 18,66 px com peso ≥ 600).
 * Textos sobre imagem/canvas/gradiente são listados como "aproximado" (~) e não reprovam sozinhos —
 * conferidos à parte nas capturas. Sai com código 1 se algum texto sobre fundo determinado reprovar.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3020";
const PATHS = (process.env.PATHS ?? "/,/pt").split(",");
const WIDTHS = (process.env.WIDTHS ?? "1440,390").split(",").map(Number);

const browser = await chromium.launch();
let reprovados = 0;
for (const path of PATHS) {
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      document.querySelectorAll("[data-reveal-state]").forEach((e) => (e.dataset.revealState = "shown"));
      document.querySelectorAll("details").forEach((d) => (d.open = true));
    });
    await page.waitForTimeout(300);
    const linhas = await page.evaluate(() => {
      const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number);
      const lum = ([r, g, b]) =>
        [r, g, b]
          .map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
      const sobre = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
      const visivel = (el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return false;
        for (let n = el; n; n = n.parentElement) {
          const s = getComputedStyle(n);
          if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
          if (n.classList?.contains("visually-hidden") || s.clip === "rect(0px, 0px, 0px, 0px)") return false;
        }
        return true;
      };
      const out = [];
      const vistos = new Set();
      for (const el of document.querySelectorAll("body *")) {
        if (["SCRIPT", "STYLE", "NOSCRIPT", "svg", "SVG"].includes(el.tagName) || el.closest("svg")) continue;
        const texto = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
        if (!texto || !visivel(el)) continue;
        const cs = getComputedStyle(el);
        // Fundo: compõe as camadas semitransparentes de baixo para cima a partir do 1º fundo opaco.
        const camadas = [];
        let aprox = false;
        let opaco = null;
        for (let n = el; n; n = n.parentElement) {
          const s = getComputedStyle(n);
          if (s.backgroundImage !== "none") aprox = true;
          if (["IMG", "CANVAS", "VIDEO", "PICTURE"].some((t) => n.querySelector?.(":scope > " + t.toLowerCase()) && n !== el)) aprox = true;
          const c = parse(s.backgroundColor);
          if (c.length >= 3) {
            const a = c[3] ?? 1;
            if (a >= 0.999) { opaco = c.slice(0, 3); break; }
            if (a > 0) camadas.push([...c.slice(0, 3), a]);
          }
        }
        if (!opaco) opaco = parse(getComputedStyle(document.body).backgroundColor).slice(0, 3);
        let bg = opaco;
        for (const c of camadas.reverse()) bg = sobre(c, bg);
        let fg = parse(cs.color);
        if (fg.length === 3) fg.push(1);
        // opacidade acumulada dos ancestrais (texto esmaecido conta)
        let op = 1;
        for (let n = el; n; n = n.parentElement) op *= Number(getComputedStyle(n).opacity);
        fg = sobre([...fg.slice(0, 3), (fg[3] ?? 1) * op], bg);
        const [L1, L2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
        const razao = (L1 + 0.05) / (L2 + 0.05);
        const px = parseFloat(cs.fontSize);
        const grande = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 600);
        const limiar = grande ? 3 : 4.5;
        const chave = `${cs.color}|${bg.map(Math.round)}|${px}|${cs.fontWeight}`;
        const sec = el.closest("section[id], header, footer")?.id || el.closest("header, footer")?.tagName.toLowerCase() || "?";
        if (vistos.has(chave + sec)) continue;
        vistos.add(chave + sec);
        out.push({ sec, texto: texto.slice(0, 48), razao: Math.round(razao * 100) / 100, limiar, aprox, fonte: `${px}px/${cs.fontWeight} ${cs.fontFamily.split(",")[0]}`, cor: `rgb(${fg.map(Math.round)}) / rgb(${bg.map(Math.round)})` });
      }
      return out;
    });
    const falhas = linhas.filter((l) => l.razao < l.limiar);
    const duras = falhas.filter((l) => !l.aprox);
    reprovados += duras.length;
    const menor = linhas.filter((l) => !l.aprox).sort((a, b) => a.razao - b.razao).slice(0, 5);
    console.log(`\n${path} @ ${width}px — ${linhas.length} combinações; reprovadas: ${duras.length}; aproximadas abaixo do limiar: ${falhas.length - duras.length}`);
    for (const l of falhas) console.log(`  ${l.aprox ? "~" : "✘"} [${l.sec}] ${l.razao}:1 (mín ${l.limiar}) ${l.fonte} ${l.cor} "${l.texto}"`);
    console.log("  menores razões determinadas:", menor.map((l) => `${l.razao} [${l.sec}] "${l.texto.slice(0, 24)}"`).join(" · "));
    await ctx.close();
  }
}
await browser.close();
console.log(reprovados ? `\n✘ ${reprovados} combinação(ões) reprovada(s)` : "\n✔ nenhum texto reprovado sobre fundo determinado");
process.exit(reprovados ? 1 : 0);
