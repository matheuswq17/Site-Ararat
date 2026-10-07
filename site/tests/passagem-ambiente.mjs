/**
 * Plano 006 — ambiente durante a PASSAGEM da /previa/refinada (página real, Chromium headless).
 *   node tests/passagem-ambiente.mjs       (servidor em :3000)   POSE2=0.17 POSE3=0.41 MEIO=0.49
 * (poses dos prints reais, reproduzidas pelo Motion em 1920×990: 2º ≈ 0,17, 3º ≈ 0,41; MEIO = ponto da saída)
 *
 * Instrumentação só no teste: web/home-sculpture.js é reescrito em memória para expor a instância
 * (window.__sc) e registrar as chamadas do Site (setPaused/setReducedMotion/destroy). O pacote não muda.
 *
 * A. Lado do Site (vale já na 0.6.0): rolar até as poses não pausa, não liga "reduzido" nem desmonta
 *    o módulo; o palco (canvas) segue na tela durante a passagem.
 * B. Pedido do plano 005/006 (depende do pacote novo): parado na pose 2 e na pose 3, o ambiente segue
 *    rodando (relógio avança e a tela muda); depois da pose 3 sai por p, terminando antes da RM cheia.
 * C. Custo: intervalos de quadro e tempo de desenho (drawMs do módulo) parados nas poses e na entrada
 *    de 1000 ms pelo CTA — para comparar pacotes na MESMA máquina (headless; não é aparelho real).
 */
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3000";
const POSE2 = Number(process.env.POSE2 ?? 0.17), POSE3 = Number(process.env.POSE3 ?? 0.41), MEIO = Number(process.env.MEIO ?? 0.49);
let pass = 0, fail = 0;
const notes = [];
async function test(name, fn) {
  try { await fn(); pass++; console.log("✔ " + name); } catch (e) { fail++; console.log("✘ " + name + "\n    " + e.message); }
  while (notes.length) console.log(notes.shift());
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const b = await chromium.launch();

async function open([w, h]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await page.route(/home-sculpture\.js$/, async (route) => {
    const r = await route.fetch();
    let s = await r.text();
    s = s.replace("export function createHomeSculpture(", "function __createHomeSculpture(");
    s = s.replace("const wr = open * Rcover;", "const wr = open * Rcover; globalThis.__win = { x: gcx, y: gcy, r: wr };");
    s += `
export function createHomeSculpture(c, o) {
  const s = __createHomeSculpture(c, o); window.__sc = s; window.__calls = [];
  for (const k of ["setPaused", "setReducedMotion", "destroy"]) { const f = s[k].bind(s); s[k] = (...a) => { window.__calls.push([k, ...a, +(document.querySelector("[data-opening=root]")?.style.getPropertyValue("--opening-p") || 0)]); return f(...a); }; }
  return s;
}
`;
    await route.fulfill({ response: r, body: s, headers: { ...r.headers(), "content-type": "text/javascript" } });
  });
  await page.goto(BASE + "/previa/refinada", { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__sc && document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 15000 });
  await page.waitForTimeout(1200);
  const readP = () => page.evaluate(() => parseFloat(document.querySelector("[data-opening=root]").style.getPropertyValue("--opening-p")) || 0);
  const go = async (y) => { await page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), y); await page.waitForTimeout(120); return readP(); };
  const yFor = async (t) => { let a = 0, z = 1600; for (let i = 0; i < 18; i++) { const m = (a + z) / 2; if ((await go(m)) < t) a = m; else z = m; } return Math.round(z); };
  const dbg = () => page.evaluate(() => { const d = window.__sc._debug(); return { t: d.ambient.t, running: d.ambient.running, gain: d.ambient.gain ?? 0, data: document.querySelector("[data-opening=sticky] canvas").dataset.ambient, p: d.passage, drawMs: d.drawMs, frames: d.frames }; });
  return { ctx, page, errors, go, yFor, dbg, readP };
}

// mudança na tela parado (capturas 0,5 s, abaixo do cabeçalho)
async function still(page, w, h, n = 6) {
  const shots = [];
  for (let i = 0; i < n; i++) { shots.push(await page.screenshot({ clip: { x: 0, y: 80, width: w, height: h - 80 } })); await page.waitForTimeout(500); }
  let changed = 0;
  for (let i = 1; i < shots.length; i++) if (!shots[i].equals(shots[i - 1])) changed++;
  return `${changed}/${n - 1}`;
}

for (const vp of (process.env.VPS ?? "1440x900,390x844").split(",").map((v) => v.split("x").map(Number))) {
  const tag = `${vp[0]}×${vp[1]}`;
  await test(`${tag} A. Site: rolar até as poses não pausa, não liga reduzido nem desmonta; palco na tela`, async () => {
    const { ctx, page, errors, go, yFor } = await open(vp);
    const y2 = await yFor(POSE2), y3 = await yFor(POSE3);
    await page.evaluate(() => { window.__calls = []; });
    for (const y of [0, y2, y3, Math.round((y3 * 1.4)), y3, y2, 0]) { await go(y); await page.waitForTimeout(300); }
    const r = await page.evaluate(() => {
      const c = document.querySelector("[data-opening=sticky]").getBoundingClientRect();
      return { calls: window.__calls, stage: { top: Math.round(c.top), bottom: Math.round(c.bottom) } };
    });
    // e numa pose: palco cobre a viewport
    await go(y3);
    const st = await page.evaluate(() => { const c = document.querySelector("[data-opening=sticky]").getBoundingClientRect(); return { top: Math.round(c.top), bottom: Math.round(c.bottom), h: innerHeight }; });
    notes.push(`    · pose 2 em y ${y2}, pose 3 em y ${y3}; chamadas do Site ao módulo durante a rolagem: ${r.calls.length ? JSON.stringify(r.calls) : "nenhuma"} · palco na pose 3: ${st.top}–${st.bottom} de ${st.h}`);
    assert(!r.calls.length, `o Site chamou ${JSON.stringify(r.calls)}`);
    assert(st.top <= 0 && st.bottom >= st.h, "palco fora da tela na pose 3");
    assert(!errors.length, errors[0]);
    await ctx.close();
  });

  await test(`${tag} B. ambiente segue vivo parado na pose 2 (linhas) e na pose 3 (mapa + janela pequena)`, async () => {
    const { ctx, page, errors, go, yFor, dbg } = await open(vp);
    const rows = [];
    for (const [k, pT] of [["repouso", 0], ["pose2", POSE2], ["pose3", POSE3]]) {
      await go(pT ? await yFor(pT) : 0);
      await page.waitForTimeout(700);
      const a = await dbg();
      const mud = await still(page, vp[0], vp[1]);
      const z = await dbg();
      rows.push({ k, p: +a.p.toFixed(3), data: z.data, running: z.running, gain: +(+z.gain).toFixed(2), relogio_ms: Math.round(z.t - a.t), mud });
    }
    notes.push("    · " + rows.map((r) => `${r.k} p ${r.p}: data-ambient ${r.data}, ganho ${r.gain}, relógio +${r.relogio_ms} ms em ~3 s, quadros que mudam ${r.mud}`).join("\n    · "));
    const bad = rows.filter((r) => !(r.data !== "off" && r.relogio_ms > 2000 && !r.mud.startsWith("0/")));
    assert(!errors.length, errors[0]);
    await ctx.close();
    assert(!bad.length, `ambiente parado em: ${bad.map((r) => r.k).join(", ")}`);
  });

  await test(`${tag} B. saída depois da pose 3: ganho cai por p e zera antes da RM cheia; volta retoma`, async () => {
    const { ctx, page, errors, go, yFor, dbg } = await open(vp);
    const out = [];
    for (const pT of [POSE3, 0.42, MEIO, 0.53, 0.56, 0.62, 0.86]) { await go(await yFor(pT)); await page.waitForTimeout(450); const d = await dbg(); out.push([+d.p.toFixed(2), +(+d.gain).toFixed(2), d.data]); }
    await go(await yFor(POSE2)); await page.waitForTimeout(700);
    const back = await dbg();
    notes.push(`    · p → ganho/data-ambient: ${out.map(([p, g, s]) => `${p}: ${g} ${s}`).join(" · ")} · volta à pose 2: ${back.data}, ganho ${(+back.gain).toFixed(2)}`);
    const g = out.map((r) => r[1]);
    assert(!errors.length, errors[0]);
    await ctx.close();
    assert(g[0] > 0.95 && g[1] > 0.95, `ganho na pose 3 / 0,42 = ${g[0]} / ${g[1]}`);
    assert(g[2] > 0.05 && g[2] < 0.95 && out[2][2] !== "off", `ponto intermediário ${MEIO}: ganho ${g[2]} (${out[2][2]})`);
    assert(g[4] === 0 && out[4][2] === "off", `em 0,56 ganho ${g[4]} (${out[4][2]})`);
    assert(g.every((v, i) => i === 0 || v <= g[i - 1] + 0.01), "ganho não é monótono depois da pose 3");
    assert(g.at(-1) === 0, `ganho com a RM cheia = ${g.at(-1)}`);
    assert(back.data !== "off", "não retomou na volta");
  });

  await test(`${tag} D. RM limpa: com o ambiente ativo, o canvas fica transparente dentro da janela (p ${MEIO} e 0,45)`, async () => {
    const { ctx, page, errors, go, yFor, dbg } = await open(vp);
    const rows = [];
    for (const pT of [0.45, MEIO]) {
      await go(await yFor(pT)); await page.waitForTimeout(600);
      const r = await page.evaluate(async () => {
        const c = document.querySelector("[data-opening=sticky] canvas");
        const k = c.width / c.getBoundingClientRect().width;
        const ctx2 = c.getContext("2d");
        let maxA = 0, samples = 0, outside = 0;
        for (let f = 0; f < 8; f++) {
          await new Promise((res) => setTimeout(res, 250));
          const w = globalThis.__win; if (!w || w.r < 6) continue;
          const R = (w.r - 2) * k, cx = w.x * k, cy = w.y * k;
          const d = ctx2.getImageData(Math.round(cx - R), Math.round(cy - R), Math.round(2 * R), Math.round(2 * R)).data;
          const n = Math.round(2 * R);
          for (let y = 0; y < n; y += 2) for (let x = 0; x < n; x += 2) {
            if ((x - R) ** 2 + (y - R) ** 2 > R * R) continue;
            samples++; maxA = Math.max(maxA, d[(y * n + x) * 4 + 3]);
          }
        }
        const dd = window.__sc._debug();
        return { win: globalThis.__win && { r: Math.round(globalThis.__win.r) }, samples, maxA, gain: +(+(dd.ambient.gain ?? 0)).toFixed(2), data: c.dataset.ambient, band: !!dd.ambient.band, waves: (dd.ambient.waves || []).length };
      });
      rows.push({ p: pT, ...r });
    }
    notes.push("    · " + rows.map((r) => `p ${r.p}: janela r ${r.win?.r} px, ${r.samples} amostras de alfa dentro dela em 8 quadros → alfa máx ${r.maxA}; ambiente ${r.data} ganho ${r.gain}, faixa ${r.band ? "sim" : "não"}, ondas ${r.waves}`).join("\n    · "));
    assert(!errors.length, errors[0]);
    await ctx.close();
    for (const r of rows) assert(r.samples > 50 && r.maxA === 0, `p ${r.p}: alfa ${r.maxA} dentro da janela (${r.samples} amostras)`);
    assert(rows.some((r) => r.gain > 0 && r.data !== "off"), "ambiente não estava ativo durante o teste");
  });

  await test(`${tag} C. custo: quadros e desenho parado nas poses e na entrada de 1000 ms (comparativo)`, async () => {
    const { ctx, page, go, yFor } = await open(vp);
    const measure = (ms) => page.evaluate((ms) => new Promise((res) => {
      const iv = []; let last = performance.now(); const d0 = window.__sc._debug(); const end = last + ms;
      const f = (t) => { iv.push(t - last); last = t; if (t < end) requestAnimationFrame(f); else { const d1 = window.__sc._debug(); iv.sort((a, b) => a - b); res({ n: iv.length, p95: +iv[Math.floor(iv.length * 0.95)].toFixed(1), max: +iv.at(-1).toFixed(1), drawFrames: d1.frames - d0.frames, drawMs: +d1.drawMs.toFixed(2) }); } };
      requestAnimationFrame(f);
    }), ms);
    const r = {};
    for (const [k, pT] of [["repouso", 0], ["pose2", POSE2], ["pose3", POSE3]]) { await go(pT ? await yFor(pT) : 0); await page.waitForTimeout(500); r[k] = await measure(2000); }
    await go(0); await page.waitForTimeout(600);
    const pr = measure(1300);
    await page.locator('[data-opening="content"] a[href="#jornada"]').first().click();
    r.entrada = await pr;
    notes.push("    · " + Object.entries(r).map(([k, v]) => `${k}: ${v.n} rAF (p95 ${v.p95} ms, máx ${v.max}), módulo desenhou ${v.drawFrames} quadros, último drawMs ${v.drawMs}`).join("\n    · "));
    await ctx.close();
  });
}
await b.close();
console.log(`\n${pass}/${pass + fail} aprovados`);
process.exit(fail ? 1 : 0);
