/**
 * Comparação das paisagens do fechamento da Ciência na /previa/refinada (página real):
 * para cada versão (?paisagem=<v>) e tela, captura a composição em p = 0 (antes de qualquer luz),
 * p = 0,5 e p = 1, e o estado estático (pausa global). Monta lâminas lado a lado por tela.
 *   node tests/comparar-paisagens.mjs <pasta> 0.1.0,0.2.0      (servidor em :3000)
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import sharp from "sharp";
const out = process.argv[2] ?? "screenshots/ciencia-montanha/comparacao";
const versoes = (process.argv[3] ?? "0.1.0").split(",");
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const TELAS = [[1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]];
const b = await chromium.launch();
const yDe = (p, k) => p.evaluate((k) => { const c = document.querySelector("[data-frase-ativa]"); const pa = c.querySelector("[class*=paisagem]"); const u = c.querySelector("[data-i='3']"); const vh = innerHeight; const cr = c.getBoundingClientRect(); const ini = 0.85 * vh - (pa.getBoundingClientRect().top - cr.top); const fim = 0.45 * vh - (u.getBoundingClientRect().top + u.getBoundingClientRect().height / 2 - cr.top); return cr.top + scrollY - (ini + (fim - ini) * k); }, k);
const recorte = (p) => p.evaluate(() => { const c = document.querySelector("[data-frase-ativa]").getBoundingClientRect(); const n = document.querySelector("[data-frase-ativa] [class*=nota]").getBoundingClientRect(); return { x: 0, y: Math.max(0, Math.round(c.top) - 24), width: innerWidth, height: Math.min(innerHeight, Math.round(Math.max(c.bottom, n.bottom) - c.top) + 48) }; });
for (const [w, h] of TELAS) {
  const lamina = [];
  for (const v of versoes) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
    await p.goto(`${BASE}/previa/refinada?paisagem=${v}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(400);
    const real = await p.evaluate(() => document.querySelector("[data-frase-ativa]").dataset.paisagem);
    for (const k of [0, 0.5, 1]) {
      await p.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), await yDe(p, k));
      await p.waitForTimeout(1300);
      const f = `${out}/${real}-${w}x${h}-p${k}.png`;
      await p.screenshot({ path: f, clip: await recorte(p) });
      lamina.push(f);
    }
    await p.evaluate(() => document.querySelector("header button[aria-pressed]").click());
    await p.waitForTimeout(300);
    const f = `${out}/${real}-${w}x${h}-estatico.png`;
    await p.screenshot({ path: f, clip: await recorte(p) });
    lamina.push(f);
    await ctx.close();
  }
  // lâmina: linhas = versões, colunas = p0, p0.5, p1, estático
  const metas = await Promise.all(lamina.map((f) => sharp(f).metadata()));
  const cw = Math.max(...metas.map((m) => m.width)), ch = Math.max(...metas.map((m) => m.height));
  const esc = Math.min(1, 1800 / (cw * 4));
  const W = Math.round(cw * esc), H = Math.round(ch * esc);
  const comp = await Promise.all(lamina.map(async (f, i) => ({ input: await sharp(f).resize({ width: W }).toBuffer(), left: (i % 4) * (W + 8), top: Math.floor(i / 4) * (H + 8) })));
  await sharp({ create: { width: 4 * (W + 8), height: versoes.length * (H + 8), channels: 3, background: "#ffffff" } }).composite(comp).png().toFile(`${out}/lamina-${w}x${h}.png`);
  console.log(w, h, "ok");
}
await b.close();
