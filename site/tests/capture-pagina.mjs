/**
 * Página inteira e por seção (antes/depois de uma rodada editorial).
 *   · seções: captura do elemento com movimento reduzido (TextReveal no estado final; o hero
 *     fica no layout estático) — leitura editorial, não a abertura;
 *   · página inteira: as seções empilhadas (sem fullPage, que muda a altura da janela e o vh);
 *   · 1ª tela com movimento normal (abertura assentada) em cada viewport de FIRST.
 *   ROUTE=/previa/refinada node tests/capture-pagina.mjs <pasta>     (servidor em :3000)
 *   VPS=1440x900,390x844 (seções) · FIRST=320x568,390x844,768x1024,1280x720,1440x900
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const out = process.argv[2] ?? "screenshots/pagina";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const ROUTE = process.env.ROUTE ?? "/previa/refinada";
const parse = (s) => s.split(",").map((v) => v.split("x").map(Number));
const VPS = parse(process.env.VPS ?? "1440x900,390x844");
const FIRST = parse(process.env.FIRST ?? "320x568,390x844,768x1024,1280x720,1440x900");
const b = await chromium.launch();
const report = {};
for (const [w, h] of VPS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(BASE + ROUTE, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  const ids = await p.$$eval("header ~ main > *, main section[id], footer", (els) => [...new Set(els.map((e) => (e.tagName === "FOOTER" ? "footer" : e.id)).filter(Boolean))]);
  const files = [];
  for (const id of ["cabecalho", ...ids]) {
    const loc = id === "footer" ? p.locator("footer").first() : id === "cabecalho" ? p.locator("body > header, header").first() : p.locator(`#${id}`).first();
    if (!(await loc.count())) continue;
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    await p.waitForTimeout(200);
    const f = `${out}/${w}-${String(files.length).padStart(2, "0")}-${id}.png`;
    await loc.screenshot({ path: f, animations: "disabled" });
    files.push(f);
  }
  report[`${w}x${h}`] = await p.evaluate(() => ({
    altura: document.documentElement.scrollHeight,
    secoes: Object.fromEntries([...document.querySelectorAll("main section[id], footer")].map((s) => [s.id || "footer", Math.round(s.getBoundingClientRect().height)])),
    scrollLateral: document.documentElement.scrollWidth > innerWidth,
  }));
  // página inteira = seções empilhadas (sem o cabeçalho fixo)
  try {
    execFileSync("python3", ["-c", `
import sys
from PIL import Image
fs=sys.argv[2:]; ims=[Image.open(f).convert("RGB") for f in fs]
W=max(i.width for i in ims); H=sum(i.height for i in ims)
c=Image.new("RGB",(W,H),(13,27,42)); y=0
for i in ims: c.paste(i,(0,y)); y+=i.height
sc=min(1,(1200 if W>700 else 600)/W); c=c.resize((int(W*sc),int(H*sc))); c.save(sys.argv[1])`, `${out}/${w}-pagina-inteira.png`, ...files.slice(1)]);
  } catch (e) { console.error("montagem:", e.message); }
  await ctx.close();
}
for (const [w, h] of FIRST) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.goto(BASE + ROUTE, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/primeira-tela-${w}x${h}.png` });
  await ctx.close();
}
writeFileSync(`${out}/medidas.json`, JSON.stringify(report, null, 2));
await b.close();
console.log(JSON.stringify(report, null, 1));
