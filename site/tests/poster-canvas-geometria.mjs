/**
 * Poster × canvas com GEOMETRIA (rodada 5): separa reamostragem de linhas de deslocamento real.
 * Para cada largura/DPR (mesma preparação de tests/poster-canvas.mjs: pausa antes do módulo, o
 * canvas nasce na pose do poster), exporta o par poster|canvas recortado no slot, em pixels do
 * canvas, para tests/poster-canvas-geometria.py, que mede: deslocamento por correlação de fase
 * (subpixel) sobre as imagens desfocadas; extensão horizontal do traço com limiar relativo sobre o
 * desfocado; e a diferença residual depois de alinhar. Os limites da suíte original NÃO mudam.
 *   ROUTE=/previa/refinada node tests/poster-canvas-geometria.mjs <pasta>     (servidor em :3000)
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/poster-canvas-geometria";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const WIDTHS = (process.env.WIDTHS ?? "320,340,360,375,390,410,430,475,520,599,600,640,666,691,726,768,810,860,910,960,1000,1040,1070,1280,1440").split(",").map(Number);
const DPRS = (process.env.DPRS ?? "1,2").split(",").map(Number);
const b = await chromium.launch();
async function openAt(w, dpr) {
  const ctx = await b.newContext({ viewport: { width: w, height: Number(process.env.H ?? 844) }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await page.route(/home-sculpture\.js/, async (r) => { await new Promise((x) => setTimeout(x, 1200)); await r.continue(); });
  await page.goto(BASE + (process.env.ROUTE ?? "/previa"), { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => { const i = document.querySelector("[data-opening=poster]"); return i && i.complete && i.naturalWidth > 0; });
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click()); // pausa global antes do módulo
  await page.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 10000 });
  await page.waitForTimeout(200);
  return { ctx, page };
}
async function pair(page) {
  return page.evaluate(async () => {
    const host = document.querySelector("[data-opening=sticky] > div:last-child");
    const canvas = host.querySelector("canvas");
    const img = document.querySelector("[data-opening=poster]");
    const slot = document.querySelector("[data-opening=slot]").getBoundingClientRect();
    const hr = host.getBoundingClientRect();
    const k = canvas.width / hr.width;
    const top = Math.max(0, slot.top - hr.top), bottom = Math.min(hr.height, slot.bottom - hr.top);
    const W = Math.round(hr.width * k), H = Math.round((bottom - top) * k);
    const draw = (fn) => { const c = new OffscreenCanvas(W, H), x = c.getContext("2d"); x.fillStyle = "#0D1B2A"; x.fillRect(0, 0, W, H); fn(x); return c; };
    const ca = draw((x) => x.drawImage(canvas, 0, top * k, W, H, 0, 0, W, H));
    const cb = draw((x) => { x.imageSmoothingQuality = "high"; x.drawImage(img, (slot.left - hr.left) * k, (slot.top - hr.top - top) * k, slot.width * k, slot.height * k); });
    const o = new OffscreenCanvas(W, H * 2), ox = o.getContext("2d");
    ox.drawImage(cb, 0, 0); ox.drawImage(ca, 0, H);
    const blob = await o.convertToBlob({ type: "image/png" });
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { png: btoa(s), k, W, H, variant: (img.currentSrc.match(/arte-escultura-[^/]+$/) || [img.currentSrc])[0], slotW: Math.round(slot.width) };
  });
}
const index = [];
for (const dpr of DPRS) for (const w of WIDTHS) {
  const { ctx, page } = await openAt(w, dpr);
  const p = await pair(page);
  const name = `par-${w}-dpr${dpr}.png`;
  writeFileSync(`${out}/${name}`, Buffer.from(p.png, "base64"));
  index.push({ w, dpr, k: p.k, W: p.W, H: p.H, variant: p.variant, slotW: p.slotW, arquivo: name });
  await ctx.close();
}
await b.close();
writeFileSync(`${out}/indice.json`, JSON.stringify(index, null, 1));
console.log(`${index.length} pares em ${out}`);
