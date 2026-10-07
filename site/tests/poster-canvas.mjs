// Poster → canvas na /previa real (pacote home-v2 0.2.1-draft): para cada largura e densidade,
// a variante escolhida pelo <picture>, a diferença média, a extensão horizontal e a razão de
// espessura do traço (poster ÷ canvas). Pausa global ANTES do módulo chegar: o canvas nasce na
// pose do poster (abertura concluída, ambiente fase 0).
//   [ROUTE=/previa/refinada] node tests/poster-canvas.mjs [pasta-de-saída]     (servidor em :3000)
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/previa-0.2.1/poster-canvas";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const WIDTHS = (process.env.WIDTHS ?? "320,340,360,375,390,410,430,475,520,599,600,640,666,691,726,768,810,860,910,960,1000,1040,1070,1280,1440").split(",").map(Number);
const DPRS = (process.env.DPRS ?? "1,2").split(",").map(Number);
const SAVE = new Set((process.env.SAVE ?? "320,390,768").split(",").map(Number));
const b = await chromium.launch();

async function measure(page) {
  return page.evaluate(() => {
    const host = document.querySelector("[data-opening=sticky] > div:last-child");
    const canvas = host.querySelector("canvas");
    const img = document.querySelector("[data-opening=poster]");
    const slot = document.querySelector("[data-opening=slot]").getBoundingClientRect();
    const hr = host.getBoundingClientRect();
    const k = canvas.width / hr.width; // densidade do canvas
    const top = Math.max(0, slot.top - hr.top), bottom = Math.min(hr.height, slot.bottom - hr.top);
    const W = Math.round(hr.width * k), H = Math.round((bottom - top) * k);
    const mk = () => { const c = new OffscreenCanvas(W, H), x = c.getContext("2d"); x.fillStyle = "#0D1B2A"; x.fillRect(0, 0, W, H); return [c, x]; };
    const [ca, a] = mk(); a.drawImage(canvas, 0, top * k, W, H, 0, 0, W, H);
    const [cb, bx] = mk(); bx.imageSmoothingQuality = "high"; bx.drawImage(img, (slot.left - hr.left) * k, (slot.top - hr.top - top) * k, slot.width * k, slot.height * k);
    const A = a.getImageData(0, 0, W, H).data, B = bx.getImageData(0, 0, W, H).data;
    const bg = (13 + 27 + 42) / 3;
    let sum = 0, inkA = 0, inkB = 0, minA = 1e9, maxA = -1, minB = 1e9, maxB = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const la = (A[i] + A[i + 1] + A[i + 2]) / 3, lb = (B[i] + B[i + 1] + B[i + 2]) / 3;
      sum += Math.abs(la - lb);
      if (la > bg + 25) inkA += la - bg;
      if (lb > bg + 25) inkB += lb - bg;
      if (la > 90) { minA = Math.min(minA, x); maxA = Math.max(maxA, x); }
      if (lb > 90) { minB = Math.min(minB, x); maxB = Math.max(maxB, x); }
    }
    const crop = (c) => { const w = Math.min(W, Math.round(360 * k)), h = Math.min(H, Math.round(220 * k)); const o = new OffscreenCanvas(w, h); o.getContext("2d").drawImage(c, Math.round((W - w) / 2), 0, w, h, 0, 0, w, h); return o; };
    return {
      variant: (img.currentSrc.match(/arte-escultura-[^/]+$/) || [img.currentSrc])[0],
      slotW: Math.round(slot.width), dpr: devicePixelRatio, canvasK: +k.toFixed(2),
      mean: sum / (W * H), thick: inkB / inkA,
      xA: [Math.round(minA / k), Math.round(maxA / k)], xB: [Math.round(minB / k), Math.round(maxB / k)], vw: innerWidth,
      _png: { W, H, k },
    };
  });
}
async function pngs(page, name) {
  const data = await page.evaluate(async () => {
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
    const cb = draw((x) => x.drawImage(img, (slot.left - hr.left) * k, (slot.top - hr.top - top) * k, slot.width * k, slot.height * k));
    // lado a lado (poster | canvas) + recorte do cume ampliado 3× sem filtro
    const zw = Math.round(120 * k), zh = Math.round(80 * k), zx = Math.round(W / 2 - zw / 2), zy = Math.round(Math.min(H - zh, 60 * k));
    const out = new OffscreenCanvas(W * 2 + 12, H + zh * 3 + 12), o = out.getContext("2d");
    o.fillStyle = "#fff"; o.fillRect(0, 0, out.width, out.height);
    o.drawImage(cb, 0, 0); o.drawImage(ca, W + 12, 0);
    o.imageSmoothingEnabled = false;
    o.drawImage(cb, zx, zy, zw, zh, 0, H + 12, zw * 3, zh * 3);
    o.drawImage(ca, zx, zy, zw, zh, W + 12, H + 12, zw * 3, zh * 3);
    const blob = await out.convertToBlob({ type: "image/png" });
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  });
  writeFileSync(`${out}/${name}.png`, Buffer.from(data, "base64"));
}
async function openAt(w, dpr) {
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: dpr });
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
const rows = [];
for (const dpr of DPRS) for (const w of WIDTHS) {
  const { ctx, page } = await openAt(w, dpr);
  const m = await measure(page);
  rows.push({ w, ...m });
  if (SAVE.has(w)) await pngs(page, `${w}-dpr${dpr}`);
  await ctx.close();
}
// Resize sem recarregar: 390 → 360 → 430 → 768 → 320 (DPR 2)
const { ctx, page } = await openAt(390, 2);
const resize = [];
for (const w of [360, 430, 768, 320]) {
  await page.setViewportSize({ width: w, height: 844 });
  await page.waitForFunction((ww) => { const i = document.querySelector("[data-opening=poster]"); return innerWidth === ww && i.complete && i.naturalWidth > 0; }, w);
  await page.waitForTimeout(500);
  resize.push({ w, ...(await measure(page)) });
}
await ctx.close();
await b.close();
const fmt = (r) => `${String(r.w).padStart(4)} px DPR ${r.dpr} | slot ${String(r.slotW).padStart(4)} | ${r.variant.padEnd(38)} | Δ ${r.mean.toFixed(2).padStart(5)} | traço poster÷canvas ${r.thick.toFixed(3)} | x canvas ${r.xA.join("–")} poster ${r.xB.join("–")}`;
console.log(rows.map(fmt).join("\n"));
console.log("\nresize (sem recarregar, DPR 2):\n" + resize.map(fmt).join("\n"));
writeFileSync(`${out}/metricas.json`, JSON.stringify({ rows, resize }, (k, v) => (k === "_png" ? undefined : v), 2));
const bad = [...rows, ...resize].filter((r) => r.mean > 4 || Math.abs(r.thick - 1) > 0.15 || Math.abs(r.xA[0] - r.xB[0]) > 3 || Math.abs(r.xA[1] - r.xB[1]) > 3 || r.xA[0] <= 0 || r.xA[1] >= r.vw - 1);
console.log(bad.length ? `\n${bad.length} caso(s) fora do limite` : `\nok: ${rows.length + resize.length} casos dentro do limite (Δ ≤ 4, traço 1 ± 0,15, extensão ± 3 px, sem corte lateral)`);
process.exit(bad.length ? 1 : 0);
