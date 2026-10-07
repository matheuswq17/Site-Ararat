// Contraste (WCAG 2.x) de textos selecionados, com cores COMPUTADAS no navegador.
// Fundo = primeira cor de fundo opaca dos ancestrais (gradientes/imagens não são considerados:
// para textos sobre a RM ou gradiente, o valor é aproximado e marcado com "~").
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:3000" + (process.env.PATHNAME ?? "/"), { waitUntil: "networkidle" });
await p.evaluate(() => document.querySelectorAll("[data-reveal-state]").forEach((e) => (e.dataset.revealState = "shown")));
const rows = await p.evaluate(() => {
  const SEL = {
    "Prévia · eyebrow do hero": "[data-home-variant] .eyebrow",
    "Prévia · título": "[data-home-variant] h1",
    "Prévia · descrição": "[data-home-variant] [class*='description']",
    "Prévia · botão secundário": "[data-home-variant] a.btn-ghost",
    "Prévia · etiqueta do espaço reservado": "[data-home-variant] [class*='reserved']",
    "Prévia · legenda da RM (passagem)": "#entrada figcaption",
    "Ciência · eyebrow": "#ciencia .eyebrow",
    "Ciência · números das partes": "#ciencia [class*='partNum']",
    "Ciência · termo (dt)": "#ciencia dl dt",
    "Ciência · definição (dd)": "#ciencia dl dd",
    "Ciência · nota de princípios": "#ciencia [class*='partNote']",
    "Ciência · ênfase final": "#ciencia p > span:last-child",
    "Ciência · lead": "#ciencia [class*='lead']",
    "Ciência · aviso": "#ciencia [class*='disclaimer']",
    "Ciência · nota da paisagem": "#ciencia [class*='landNote']",
    "Hero · nota (ill-note)": "#inicio .ill-note",
    "Jornada · legenda da cena": "#jornada [class*='caption']",
    "Jornada · botão de etapa": "#jornada [role=group] button",
    "Jornada · pausar": "#jornada button[aria-pressed]:not([role])",
    "Plataforma · legenda Hub": "#plataforma figcaption",
    "Plataforma · nota Viewer": "#plataforma [class*='viewerNote']",
    "Explicabilidade · aviso": "#explicabilidade [class*='disclaimer']",
    "Explicabilidade · rótulo barra": "#explicabilidade ul li > span:first-child",
    "Contato · aviso de canal": "#contato [role=note]",
    "Contato · rótulo (dt)": "#contato dl dt",
    "Contato · texto (dd)": "#contato dl dd",
    "Contato · ação": "#contato article a",
    "Passagem · texto": "#passagem p",
    "Plataforma · etapa (texto)": "#plataforma ol li p",
    "Plataforma · rótulo de parada": "#plataforma h3[id^='parada']",
    "Explicabilidade · leitura": "#xai-reading > li > p",
    "Explicabilidade · rótulo da leitura": "#xai-reading h3",
    "Rodapé · nota": "footer [class*='small']",
    "Cabeçalho · link": "header nav a",
  };
  const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const out = [];
  for (const [name, sel] of Object.entries(SEL)) {
    const el = document.querySelector(sel);
    if (!el) { out.push([name, "não encontrado"]); continue; }
    const cs = getComputedStyle(el);
    let n = el, bg = null, approx = false;
    while (n && n !== document.documentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage !== "none") approx = true;
      const c = parse(s.backgroundColor);
      if (c.length >= 3 && (c[3] === undefined || c[3] >= 0.95)) { bg = c; break; }
      n = n.parentElement;
    }
    bg ??= parse(getComputedStyle(document.body).backgroundColor);
    let fg = parse(cs.color);
    // Cor com alfa: compõe sobre o fundo antes de medir (senão o contraste sai superestimado).
    if (fg[3] !== undefined && fg[3] < 1) fg = [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
    const [L1, L2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    out.push([name, `${cs.color}${fg.length === 3 && parse(cs.color)[3] < 1 ? ` (composta rgb(${fg.map(Math.round).join(", ")}))` : ""} sobre rgb(${bg.slice(0, 3).join(", ")})`, `${approx ? "~" : ""}${((L1 + 0.05) / (L2 + 0.05)).toFixed(2)}:1`, `${cs.fontSize} / ${cs.fontWeight}`]);
  }
  return out;
});
for (const r of rows) console.log(r.join(" | "));
await b.close();
