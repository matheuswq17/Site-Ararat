/**
 * Plano 006 — estados do ambiente PARADO NA POSE 3 (p 0,41) da /previa/refinada, página real:
 * pausa geral (para e congela; retomar volta), aba oculta, movimento reduzido (sem canvas: poster),
 * resize no meio da passagem (segue vivo, sem rolagem lateral, p preservado), cena fora da tela
 * (rolar além da jornada) e desmontagem por navegação de cliente (destroy chamado, sem erro).
 *   node tests/passagem-estados.mjs     (servidor em :3000)   VPS=1440x900,390x844
 * Instrumentação só no teste (window.__sc e contagem de destroy), como em passagem-ambiente.mjs.
 */
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3000";
const POSE3 = Number(process.env.POSE3 ?? 0.41);
const VPS = (process.env.VPS ?? "1440x900,390x844").split(",").map((v) => v.split("x").map(Number));
let pass = 0, fail = 0, skip = 0;
const notes = [];
async function test(name, fn) {
  try { const r = await fn(); if (r === "skip") { skip++; console.log("– " + name + " (não exercitado)"); } else { pass++; console.log("✔ " + name); } } catch (e) { fail++; console.log("✘ " + name + "\n    " + e.message); }
  while (notes.length) console.log(notes.shift());
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const b = await chromium.launch();
async function open([w, h], opts = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await page.route(/home-sculpture\.js$/, async (route) => {
    const r = await route.fetch();
    let s = await r.text();
    s = s.replace("export function createHomeSculpture(", "function __createHomeSculpture(");
    s += `\nexport function createHomeSculpture(c, o) { const s = __createHomeSculpture(c, o); window.__sc = s; window.__destroyed = 0; const d = s.destroy.bind(s); s.destroy = () => { window.__destroyed++; return d(); }; return s; }\n`;
    await route.fulfill({ response: r, body: s, headers: { ...r.headers(), "content-type": "text/javascript" } });
  });
  await page.goto(BASE + "/previa/refinada", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const readP = () => page.evaluate(() => parseFloat(document.querySelector("[data-opening=root]").style.getPropertyValue("--opening-p")) || 0);
  const go = async (y) => { await page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), y); await page.waitForTimeout(120); return readP(); };
  const yFor = async (t) => { let a = 0, z = 1600; for (let i = 0; i < 18; i++) { const m = (a + z) / 2; if ((await go(m)) < t) a = m; else z = m; } return Math.round(z); };
  const st = () => page.evaluate(() => { const c = document.querySelector("[data-opening=sticky] canvas"); const d = window.__sc?._debug(); return { data: c?.dataset.ambient ?? "sem canvas", t: d ? Math.round(d.ambient.t) : null, running: d?.ambient.running, p: +(parseFloat(document.querySelector("[data-opening=root]").style.getPropertyValue("--opening-p")) || 0).toFixed(3), sw: document.documentElement.scrollWidth, vw: innerWidth }; });
  return { ctx, page, errors, go, yFor, st, readP };
}
// botão de pausa geral do cabeçalho (no celular fica no menu: clique programático no mesmo botão)
const togglePause = (page) => page.evaluate(() => document.querySelector("header button[aria-pressed]").click());
const frozen = async (page, w, h) => { const a = await page.screenshot({ clip: { x: 0, y: 80, width: w, height: h - 80 } }); await page.waitForTimeout(1200); const z = await page.screenshot({ clip: { x: 0, y: 80, width: w, height: h - 80 } }); return a.equals(z); };

for (const vp of VPS) {
  const tag = `${vp[0]}×${vp[1]}`;
  await test(`${tag} pose 3: pausa para e congela; retomar volta sem salto de rolagem; aba oculta para e volta`, async () => {
    const { ctx, page, errors, go, yFor, st } = await open(vp);
    const y = await yFor(POSE3); await go(y); await page.waitForTimeout(800);
    const s0 = await st();
    await togglePause(page); await page.waitForTimeout(400);
    const sp = await st(); const fz = await frozen(page, ...vp);
    await togglePause(page); await page.waitForTimeout(600);
    const sr = await st(); const yr = await page.evaluate(() => scrollY);
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForTimeout(500); const sh = await st(); await page.waitForTimeout(800); const sh2 = await st();
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForTimeout(600); const sv = await st();
    notes.push(`    · p ${s0.p}: ${s0.data} → pausa ${sp.data} (congelado ${fz}) → retomar ${sr.data}, scrollY ${y}→${yr} → aba oculta data ${sh.data}, running ${sh2.running}, relógio ${sh.t}→${sh2.t} → visível ${sv.data} (relógio ${sv.t})`);
    assert(s0.data !== "off" && sp.data === "off" && fz && sr.data !== "off" && yr === y, "pausa/retomada");
    // aba oculta: vale o relógio do módulo (parado) e running; data-ambient só é regravado quando o
    // módulo desenha (0.7.0 grava só mudanças) — fica com o último valor enquanto nada é desenhado.
    assert(sh.t === sh2.t && sh2.running === false && sv.data !== "off" && sv.t > sh2.t, "aba oculta");
    assert(!errors.length, errors[0]);
    await ctx.close();
  });
  await test(`${tag} resize no meio da passagem (pose 3): segue vivo, p preservado, sem rolagem lateral`, async () => {
    const { ctx, page, errors, go, yFor, st } = await open(vp);
    await go(await yFor(POSE3)); await page.waitForTimeout(600);
    const a = await st();
    const alt = vp[0] > 800 ? [1280, 720] : [320, 568];
    await page.setViewportSize({ width: alt[0], height: alt[1] }); await page.waitForTimeout(900);
    const b1 = await st();
    await page.setViewportSize({ width: vp[0], height: vp[1] }); await page.waitForTimeout(900);
    const c = await st();
    notes.push(`    · ${tag} p ${a.p} ${a.data} → ${alt.join("×")} p ${b1.p} ${b1.data} (sw ${b1.sw}/${b1.vw}) → volta p ${c.p} ${c.data}`);
    assert(b1.sw <= b1.vw && c.sw <= c.vw, "rolagem lateral");
    assert(c.data !== "off" && Math.abs(c.p - a.p) < 0.03, "ambiente/progresso após resize");
    assert(!errors.length, errors[0]);
    await ctx.close();
  });
  await test(`${tag} cena fora da tela (além da jornada) para o ambiente; volta ao mapa retoma`, async () => {
    const { ctx, page, errors, go, yFor, st } = await open(vp);
    const y3 = await yFor(POSE3);
    await go(document_far()); await page.waitForTimeout(600);
    const far = await st();
    await go(y3); await page.waitForTimeout(600);
    const back = await st();
    notes.push(`    · longe (p ${far.p}): ${far.data}, running ${far.running} · de volta à pose 3: ${back.data}`);
    assert(far.data === "off" && !far.running && back.data !== "off", "fora da tela/retomada");
    assert(!errors.length, errors[0]);
    await ctx.close();
  });
  await test(`${tag} movimento reduzido: sem canvas (poster estático), passagem sem erro`, async () => {
    const { ctx, page, errors, go, st } = await open(vp, { reduced: true });
    await go(300); await page.waitForTimeout(500);
    const s = await st();
    notes.push(`    · reduzido: ${s.data}`);
    assert(s.data === "sem canvas" || s.data === "off", `reduzido: ${s.data}`);
    assert(!errors.length, errors[0]);
    await ctx.close();
  });
  await test(`${tag} desmontagem por navegação de cliente: destroy uma vez, sem erro`, async () => {
    const { ctx, page, errors, go, yFor } = await open(vp);
    await go(await yFor(POSE3)); await page.waitForTimeout(500);
    const href = await page.evaluate(() => { const a = [...document.querySelectorAll("a[href^='/']")].find((x) => { const h = x.getAttribute("href"); return !h.startsWith("/previa/refinada") && !h.includes("#") && !/\.[a-z0-9]+$/i.test(h) && !x.target; }); return a?.getAttribute("href") ?? null; });
    if (!href) { notes.push("    · sem link interno para fora da rota na página: desmontagem não exercitada por navegação"); await ctx.close(); return "skip"; }
    await page.evaluate((h) => { window.__mark = 1; const a = [...document.querySelectorAll(`a[href='${h}']`)][0]; a.click(); }, href);
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({ same: window.__mark === 1, destroyed: window.__destroyed, path: location.pathname }));
    notes.push(`    · link ${href} → ${r.path} (${r.same ? "navegação de cliente" : "recarga"}), destroy chamado ${r.destroyed ?? "?"}×`);
    if (r.same) assert(r.destroyed === 1, `destroy ${r.destroyed}`);
    assert(!errors.length, errors[0]);
    await ctx.close();
  });
}
function document_far() { return 6000; }
await b.close();
console.log(`\n${pass}/${pass + fail} aprovados${skip ? ` · ${skip} não exercitado(s)` : ""}`);
process.exit(fail ? 1 : 0);
