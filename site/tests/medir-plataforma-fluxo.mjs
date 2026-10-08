// Medidas da demonstração "do Hub ao Viewer" (/previa/refinada) para combinar enquadramento e progresso com o
// Motion: coluna do quadro, palco proposto (≥ 901 px), linhas das etapas e faixa de rolagem de cada uma.
//   node tests/medir-plataforma-fluxo.mjs <saida.json>
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/plataforma-fluxo/medidas.json";
const b = await chromium.launch();
const res = {};
for (const [w, h] of [[1920, 1080], [1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto("http://localhost:3000/previa/refinada", { waitUntil: "networkidle" });
  res[`${w}x${h}`] = await p.evaluate(() => {
    const Y = (r) => Math.round(r.top + scrollY);
    const f = document.querySelector("[data-fluxo]");
    const lis = [...f.querySelectorAll("ol > li")];
    const cab = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72;
    const vh = innerHeight;
    const q0 = lis[0].querySelector("[data-parte=quadro]").getBoundingClientRect();
    const t0 = lis[0].querySelector("[data-parte=texto]").getBoundingClientRect();
    const sec = document.querySelector("#plataforma").getBoundingClientRect();
    const linha = cab + 0.5 * (vh - cab);
    const palcoAlt = Math.round(parseFloat(getComputedStyle(lis[0].querySelector("[data-parte=quadro]")).minHeight) || 0);
    return {
      vh, cabecalho: cab, linhaDeLeitura: Math.round(linha),
      secao: { top: Y(sec), altura: Math.round(sec.height) },
      colunaTexto: { x: Math.round(t0.left), largura: Math.round(t0.width) },
      colunaQuadro: { x: Math.round(q0.left), largura: Math.round(q0.width) },
      palcoProposto: innerWidth >= 901 ? { x: Math.round(q0.left), largura: Math.round(q0.width), altura: palcoAlt, topoSticky: cab + 24 } : null,
      etapas: lis.map((li, i) => { const r = li.getBoundingClientRect(); const q = li.querySelector("[data-parte=quadro]").getBoundingClientRect(); const fim = i + 1 < lis.length ? lis[i + 1].getBoundingClientRect().top : r.bottom; return { id: li.dataset.etapaId, top: Y(r), faixaRolagem: Math.round(fim - r.top), quadro: { largura: Math.round(q.width), altura: Math.round(q.height) } }; }),
      rolagemTotal: Math.round(lis.at(-1).getBoundingClientRect().bottom - lis[0].getBoundingClientRect().top),
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  await p.close();
}
writeFileSync(out, JSON.stringify(res, null, 1));
for (const [k, v] of Object.entries(res)) console.log(k, "texto", v.colunaTexto, "quadro", v.colunaQuadro, "palco", v.palcoProposto, "faixas", v.etapas.map((e) => e.faixaRolagem).join(","), "total", v.rolagemTotal, "sw", v.scrollWidth);
await b.close();
