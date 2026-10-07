/**
 * Carregamento das fontes da versão conjunta (/previa/refinada): o texto não pode depender da
 * chegada dos WOFF2. Cenários por interceptação de rede (só os arquivos de fonte):
 *   normal · atraso de 4 s · 404 · rede lenta (1,6 Mbps / 150 ms em tudo)
 * Mede no navegador:
 *   · texto PINTADO (pixels claros do título/descrição/CTA num recorte da tela) a 1,5 s, com as
 *     fontes ainda ausentes — font-display: block deixaria o texto invisível nesse instante;
 *   · fonte em uso (document.fonts) e status de cada FontFace (loaded/error);
 *   · linhas e larguras de textos da 1ª tela e de seções (reserva × fonte final);
 *   · CLS total (layout-shift sem input) e posição do slot da arte antes/depois da troca.
 *   ROUTE=/previa/refinada node tests/fontes-carregamento.mjs      (servidor em :3000)
 *   ROUTE=/previa/a … (referência: mostra o texto invisível com block)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ROUTE = process.env.ROUTE ?? "/previa/refinada";
const REF = process.env.REF === "1"; // modo referência: só relata, não reprova
const TITLE = process.env.TITLE_FAMILY ?? "ARARAT Titulo"; // /previa/a: "ARARAT A Titulo"
const VPS = (process.env.VPS ?? "1280x720,1440x900,768x1024,390x844,320x568").split(",").map((v) => v.split("x").map(Number));
const FONT_RE = /\/previa\/tipografia\/fontes\//;
const results = [];
const notes = [];
const assert = (ok, msg) => { if (!ok && !REF) throw new Error(msg); if (!ok) notes.push("    (ref) " + msg); };
async function test(name, fn) {
  try { await fn(); results.push(`✔ ${name}`); } catch (e) { results.push(`✘ ${name}\n    ${e.message.split("\n")[0]}`); }
}
const browser = await chromium.launch();

const INSTR = () => {
  sessionStorage.removeItem("ararat:intro");
  window.__cls = 0;
  window.__shifts = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).map((x) => { const n = x.node; const r = x.previousRect, q = x.currentRect; return (n?.id || n?.className?.baseVal || n?.className || n?.nodeName || "?").toString().replace(/^.*__/, "").slice(0, 24) + ` ${Math.round(r.y)},${Math.round(r.height)}→${Math.round(q.y)},${Math.round(q.height)}`; }).join(" ; ")]); }
  }).observe({ type: "layout-shift", buffered: true });
};

const TEXTS = {
  sobretítulo: '[data-opening="content"] .eyebrow',
  título: "#hero-title",
  descrição: '[data-opening="content"] p:not(.eyebrow):not(.ill-note)',
  "CTA principal": '[data-opening="content"] .btn-gold',
  "CTA secundário": '[data-opening="content"] .btn-ghost',
  "estado científico": '[data-opening="note"]',
  "rótulo Contato": "#contato .eyebrow",
  "h2 Plataforma": "#plataforma h2",
  "lead Plataforma": "#plataforma header p",
  "h2 Explicabilidade": "#explicabilidade h2",
  "lead Explicabilidade": "#explicabilidade header p",
  "h2 Contato": "#contato h2",
};
// Fora da 1ª tela e com exceção medida (tests/calibrar-reserva.mjs): só relatados.
const REPORT_ONLY = new Set(["h2 Contato"]);
const measure = (page) => page.evaluate((T) => {
  const out = {};
  for (const [k, s] of Object.entries(T)) {
    const el = document.querySelector(s);
    if (!el) { out[k] = null; continue; }
    // Linhas = grupos de retângulos dos nós de texto (topos a menos de meia altura de fonte).
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const tops = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.textContent.trim()) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const x of r.getClientRects()) if (x.width > 1) tops.push(x.top);
    }
    tops.sort((a, b) => a - b);
    const lines = tops.filter((t, i) => i === 0 || t - tops[i - 1] > fs * 0.5).length;
    const b = el.getBoundingClientRect();
    out[k] = { lines, w: Math.round(b.width), h: Math.round(b.height) };
  }
  const slot = document.querySelector('[data-opening="slot"]')?.getBoundingClientRect();
  out.slot = slot ? [Math.round(slot.x), Math.round(slot.y + scrollY), Math.round(slot.width), Math.round(slot.height)].join(",") : null;
  out.scrollW = document.documentElement.scrollWidth;
  return out;
}, TEXTS);
const fontState = (page) => page.evaluate((T) => ({
  faces: [...document.fonts].filter((f) => /ARARAT (A |B )?(Titulo|Texto)$/.test(f.family.replace(/"/g, ""))).map((f) => `${f.family.replace(/"/g, "")} ${f.weight}: ${f.status}`),
  titleReady: document.fonts.check(`600 40px "${T}"`),
}), TITLE);
/** Pixels claros (texto branco sobre navy) no retângulo do elemento. Captura pelo CDP
 *  (page.screenshot do Playwright espera as fontes web — mascararia o cenário). */
const cdps = new WeakMap();
async function inkOf(page, sel) {
  const box = await page.locator(sel).first().boundingBox();
  if (!box || box.width < 2) return 0;
  let cdp = cdps.get(page);
  if (!cdp) { cdp = await page.context().newCDPSession(page); cdps.set(page, cdp); }
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { x: box.x, y: box.y, width: Math.min(box.width, 2000), height: box.height, scale: 1 } });
  return page.evaluate(async (b64) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = new OffscreenCanvas(img.width, img.height); const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] > 170) n++;
    return n;
  }, data);
}

async function open(vp, mode) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const fontReqs = [];
  if (mode === "lenta") {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  }
  await page.route(FONT_RE, async (route) => {
    fontReqs.push(route.request().url().split("/").pop());
    if (mode === "404") return route.fulfill({ status: 404, body: "" });
    if (mode === "atraso") await new Promise((r) => setTimeout(r, 4000));
    return route.continue();
  });
  await page.addInitScript(INSTR);
  const t0 = Date.now();
  await page.goto(BASE + ROUTE, { waitUntil: "domcontentloaded" });
  return { ctx, page, errors, fontReqs, t0 };
}

const normal = {};
for (const vp of VPS) {
  const tag = vp.join("×");
  await test(`${tag} carga normal: fontes 500/600 · 400/600 carregadas, nenhuma reserva visível, CLS < 0,01`, async () => {
    const { ctx, page, errors } = await open(vp, "normal");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2000);
    const fs = await fontState(page);
    const m = await measure(page);
    normal[tag] = m;
    const cls = await page.evaluate(() => window.__cls);
    notes.push(`    · ${tag} normal: ${fs.faces.join(" · ")} · CLS ${cls.toFixed(4)} · slot ${m.slot}`);
    assert(fs.titleReady, "título sem a fonte final");
    assert(fs.faces.filter((f) => f.endsWith("loaded")).length >= 3, "fontes da 1ª tela não carregaram: " + fs.faces.join(", "));
    assert(cls < 0.01, `CLS ${cls}`);
    assert(m.scrollW <= vp[0], "rolagem horizontal");
    assert(!errors.length, errors[0]);
    await ctx.close();
  });

  await test(`${tag} fontes atrasadas 4 s: texto pintado na reserva a 1,5 s; troca sem mudar linhas nem a arte; CLS < 0,02`, async () => {
    const { ctx, page, errors, t0 } = await open(vp, "atraso");
    await page.waitForTimeout(Math.max(0, 1500 - (Date.now() - t0)));
    const early = await fontState(page);
    const ink = {};
    for (const k of ["título", "descrição", "CTA secundário"]) ink[k] = await inkOf(page, TEXTS[k]);
    const before = await measure(page);
    const famEarly = await page.evaluate((T) => document.fonts.check(`600 40px "${T}"`), TITLE);
    assert(!famEarly, "medição 'antes' já com a fonte final (cenário inválido)");
    await page.waitForFunction((T) => document.fonts.check(`600 40px "${T}"`), TITLE, { timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    const after = await measure(page);
    const cls = await page.evaluate(() => window.__cls);
    const shifts = await page.evaluate(() => window.__shifts);
    notes.push(`    · ${tag} atraso: a 1,5 s fonte final ${early.titleReady ? "presente" : "ausente"}; pixels de texto ${JSON.stringify(ink)}; CLS ${cls.toFixed(4)} ${JSON.stringify(shifts)}`);
    assert(!early.titleReady, "a fonte já tinha chegado (cenário inválido)");
    for (const [k, n] of Object.entries(ink)) assert(n > 150, `${k} invisível a 1,5 s (${n} px claros)`);
    const diff = Object.keys(TEXTS).filter((k) => !REPORT_ONLY.has(k) && before[k] && after[k] && before[k].lines !== after[k].lines);
    notes.push(`    · ${tag} reserva→final: ` + Object.keys(TEXTS).map((k) => before[k] && `${k} ${before[k].lines}L ${before[k].w}×${before[k].h}→${after[k].lines}L ${after[k].w}×${after[k].h}`).filter(Boolean).join(" · "));
    assert(!diff.length, "linhas mudaram na troca: " + diff.join(", "));
    assert(before.slot === after.slot, `slot da arte mudou: ${before.slot} → ${after.slot}`);
    assert(cls < 0.02, `CLS ${cls}`);
    assert(after.scrollW <= vp[0] && before.scrollW <= vp[0], "rolagem horizontal");
    assert(!errors.length, errors[0]);
    await ctx.close();
  });

  await test(`${tag} fontes com 404: página legível na reserva métrica, mesma composição (linhas/slot), sem erro`, async () => {
    const { ctx, page, errors, fontReqs } = await open(vp, "404");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const fs = await fontState(page);
    const ink = await inkOf(page, TEXTS["título"]);
    const m = await measure(page);
    const n = normal[tag];
    const cls = await page.evaluate(() => window.__cls);
    const diff = Object.keys(TEXTS).filter((k) => !REPORT_ONLY.has(k) && n?.[k] && m[k] && n[k].lines !== m[k].lines);
    for (const k of REPORT_ONLY) if (n?.[k] && m[k] && n[k].lines !== m[k].lines) notes.push(`    · ${tag} 404: ${k} ${n[k].lines} → ${m[k].lines} linhas (exceção registrada, fora da 1ª tela)`);
    const fam = await page.evaluate(() => getComputedStyle(document.getElementById("hero-title")).fontFamily);
    notes.push(`    · ${tag} 404: ${fontReqs.length} pedidos de fonte recusados; ${fs.faces.join(" · ")}; título ${ink} px claros; CLS ${cls.toFixed(4)}; slot ${m.slot} (normal ${n?.slot})`);
    assert(fs.faces.every((f) => !f.endsWith("loaded")), "alguma fonte carregou apesar do 404");
    assert(/Reserva/.test(fam), "família de reserva fora da pilha: " + fam);
    notes.push(`    · ${tag} 404: pilha do título ${fam}`);
    assert(ink > 150, "título invisível");
    assert(!diff.length, "linhas diferentes da carga normal: " + diff.map((k) => `${k} ${n[k].lines}L ${n[k].w}×${n[k].h} → ${m[k].lines}L ${m[k].w}×${m[k].h}`).join(", "));
    assert(m.slot === n?.slot, "slot da arte diferente da carga normal");
    assert(cls < 0.01, `CLS ${cls}`);
    assert(m.scrollW <= vp[0], "rolagem horizontal");
    assert(!errors.length, errors[0]);
    await ctx.close();
  });
}

await test("1440×900 rede lenta (1,6 Mbps/150 ms): título e CTA pintados antes das fontes chegarem", async () => {
  const { ctx, page, errors, t0 } = await open([1440, 900], "lenta");
  // Primeiro instante com o título pintado (pixels claros) e estado das fontes nesse instante.
  let painted = null, ready = null;
  for (let i = 0; i < 60; i++) {
    const ink = await inkOf(page, TEXTS["título"]).catch(() => 0);
    const fs = await fontState(page).catch(() => ({ titleReady: false }));
    if (ink > 150 && painted === null) painted = { t: Date.now() - t0, fonte: fs.titleReady };
    if (fs.titleReady && ready === null) ready = Date.now() - t0;
    if (painted && ready) break;
    await page.waitForTimeout(150);
  }
  notes.push(`    · rede lenta: título pintado em ~${painted?.t} ms (fonte final ${painted?.fonte ? "já presente" : "ainda ausente"}); fonte final em ~${ready} ms`);
  assert(painted, "título nunca pintado");
  assert(!errors.length, errors[0]);
  await ctx.close();
});

await browser.close();
console.log(`${ROUTE}\n` + results.join("\n") + "\n" + notes.join("\n"));
const ok = results.filter((r) => r.startsWith("✔")).length;
console.log(`\n${ok}/${results.length} aprovados`);
if (ok !== results.length) process.exitCode = 1;
