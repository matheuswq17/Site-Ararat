/**
 * Pesos declarados × pesos usados na /previa/refinada: nenhum texto com peso fora dos arquivos
 * (títulos 500/600 · corpo 400/600), em 1440×900 e 390×844.
 *   node tests/pesos-fontes.mjs [/rota]      (servidor em :3000; padrão /previa/refinada)
 */
import { chromium } from "playwright";
const route = process.argv[2] || "/previa/refinada";
const ok = { Titulo: [500, 600], Texto: [400, 600] };
const b = await chromium.launch();
for (const vp of [[1440, 900], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: vp[0], height: vp[1] } });
  await p.goto("http://localhost:3000" + route, { waitUntil: "networkidle" });
  const rows = await p.evaluate((ok) => {
    const name = (el) => { const c = typeof el.className === "string" ? el.className.split(" ").find(x => x.includes("__")) || el.className.split(" ")[0] : ""; return el.tagName.toLowerCase() + (c ? "." + c.replace(/^.*__/, "") : ""); };
    const out = new Set();
    for (const el of document.querySelectorAll("[data-proposta] *")) {
      if (["SCRIPT","STYLE"].includes(el.tagName)) continue;
      if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el); const fam = cs.fontFamily.split(",")[0].replace(/"/g, "").trim();
      const kind = /Titulo/.test(fam) ? "Titulo" : /Texto/.test(fam) ? "Texto" : null;
      if (!kind || ok[kind].includes(+cs.fontWeight)) continue;
      out.add(`${kind} ${cs.fontWeight}: ${name(el.parentElement.parentElement)} > ${name(el.parentElement)} > ${name(el)}`);
    }
    return [...out];
  }, ok);
  console.log(vp.join("x"), rows.length ? "" : "— nenhum"); rows.sort().forEach(r => console.log("  " + r));
  if (rows.length) process.exitCode = 1;
}
await b.close();
console.log(process.exitCode ? "" : "ok: nenhum peso fora dos arquivos");
