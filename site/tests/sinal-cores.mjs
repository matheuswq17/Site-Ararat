/**
 * Experimento brand-sinal-v1 — busca de cor com matiz na interface RENDERIZADA (complementa o
 * lint-sinal.mjs, que só lê código). Percorre todos os elementos visíveis de "/" e "/pt" e lista cores
 * computadas (texto, fundo, borda, contorno, fill/stroke de SVG do Site) que não sejam cinza puro.
 * Fora do escopo por definição: pixels de <img>/<canvas>/<video> (capturas reais, RM e módulos do
 * Motion), conferidos visualmente nas capturas. O desenho dos módulos do Motion montado em SVG
 * (SVG do fechamento da Ciência, geometria e cores do pacote topo-revisao) é listado à parte como PENDENTE DO MOTION, sem reprovar.
 *   BASE=http://localhost:3020 node tests/sinal-cores.mjs
 */
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3020";
const b = await chromium.launch();
let total = 0;
for (const path of ["/", "/pt"]) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })).newPage();
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  await p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
  const achados = await p.evaluate(() => {
    const out = new Map();
    const props = ["color", "backgroundColor", "borderTopColor", "borderBottomColor", "borderLeftColor", "borderRightColor", "outlineColor", "fill", "stroke"];
    const cinza = (c) => { const m = c.match(/[\d.]+/g); if (!m) return true; const [r, g, bl, a = 1] = m.map(Number); return +a === 0 || (r === g && g === bl); };
    for (const el of document.querySelectorAll("body *")) {
      if (el.closest(".ararat-journey, canvas, [data-fluxo-palco], picture") || ["IMG", "CANVAS", "VIDEO", "SOURCE"].includes(el.tagName)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      for (const k of props) {
        const v = cs[k];
        if (!v || v === "none" || v.startsWith("url")) continue;
        if (k.startsWith("border") && parseFloat(cs[k.replace("Color", "Width")]) === 0) continue;
        if (k === "outlineColor" && cs.outlineStyle === "none") continue;
        if ((k === "fill" || k === "stroke") && !el.closest("svg")) continue;
        if (!cinza(v)) { const key = `${el.closest("[class*=RevisaoHumanaRefinada][class*=__comp] svg") ? "[Motion · pendente] " : ""}${k}: ${v}`; const s = out.get(key) ?? []; if (s.length < 3) s.push(`${el.tagName.toLowerCase()}.${String(el.className?.baseVal ?? el.className).split(" ")[0].slice(0, 50)}`); out.set(key, s); }
      }
    }
    return [...out].map(([k, v]) => `${k}  ← ${v.join(", ")}`);
  });
  const site = achados.filter((a) => !a.startsWith("[Motion"));
  total += site.length;
  console.log(`${path}: ${site.length} cor(es) com matiz na camada do Site; ${achados.length - site.length} no desenho do Motion (pendente)`);
  achados.forEach((a) => console.log((a.startsWith("[Motion") ? "  · " : "  ✘ ") + a));
}
await b.close();
console.log(total ? `\n✘ ${total}` : "\n✔ nenhuma cor com matiz na camada renderizada do Site");
process.exit(total ? 1 : 0);
