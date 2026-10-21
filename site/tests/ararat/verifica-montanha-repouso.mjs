#!/usr/bin/env node
/**
 * Repouso entre passagens de luz — comparação privada 1.3.1 (candidata, repouso de 5 s) × 1.3.0 (anterior), 20/10/2026.
 *   node tests/ararat/verifica-montanha-repouso.mjs http://127.0.0.1:PORTA [saida.json] [--publico]
 * Acordo: docs/coordination/MONTANHA-1.3.1-REPOUSO-5S-MOTION-2026-10-20.md. Só a agenda da luz muda entre as duas.
 * Mede, por quadro (rAF), o atributo do próprio módulo `data-ambient-frame` ('light' quando o quadro desenhado tem
 * luz) e o relógio da luz do módulo (`_debug().ambient.t`, exposto só na revisão). Repouso = do último quadro com luz
 * ao primeiro quadro com luz da passagem seguinte (o Motion mediu ~5,12–5,13 s assim; o relógio dá 5 000 ms exatos).
 * Também: duração de cada passagem e 1ª passagem iguais nas duas; pausa, reduzido, aba oculta e fora da tela no meio
 * de um repouso param o relógio, não acendem luz e não acumulam passagens; pública: nenhum dos dois candidatos.
 * Chromium headless sem GPU: tempo de quadro, não aparelho.
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://127.0.0.1:3364").replace(/\/$/, "");
const SAIDA = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : null;
const PUBLICO = process.argv.includes("--publico");
const res = [];
const ok = (grupo, nome, passou, det = {}) => { res.push({ grupo, nome, ok: !!passou, ...det }); console.log(`${passou ? "ok  " : "FALHA"} [${grupo}] ${nome}${Object.keys(det).length ? " " + JSON.stringify(det).slice(0, 460) : ""}`); };
const b = await chromium.launch();

const SONDA = () => {
  window.__l = [];
  const f = () => {
    const cv = document.querySelector("[data-hero] canvas");
    if (cv) { let t = null; try { t = window.__montanha?._debug?.().ambient?.t ?? null; } catch {} window.__l.push([Math.round(performance.now()), cv.dataset.ambientFrame === "light" ? 1 : 0, t == null ? null : Math.round(t)]); }
    if (window.__l.length < 20000) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
};
const passagens = (q) => { // runs de quadros com luz
  const out = []; let ini = null, ult = null, tIni = null, tUlt = null;
  for (const [t, luz, clk] of q) { if (luz) { if (ini === null) { ini = t; tIni = clk; } ult = t; tUlt = clk; } else if (ini !== null) { out.push({ ini, fim: ult, d: ult - ini, cIni: tIni, cFim: tUlt }); ini = null; } }
  if (ini !== null) out.push({ ini, fim: ult, d: ult - ini, cIni: tIni, cFim: tUlt, aberta: true });
  return out;
};
const rodar = async (versao, w, h, ms) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(SONDA);
  const p = await ctx.newPage(); const erros = []; p.on("pageerror", (e) => erros.push(e.message));
  await p.goto(`${BASE}/pt?montanha=${versao}&texto=atual&transicao=candidata`, { waitUntil: "load" });
  await p.waitForTimeout(ms);
  const info = await p.evaluate(() => ({ versao: document.querySelector("[data-hero]").dataset.montanhaVersao, config: document.querySelector("[data-hero] canvas")?.dataset.ambientConfig, criado: window.__l[0]?.[0] ?? null }));
  const q = await p.evaluate(() => window.__l);
  await ctx.close();
  const ps = passagens(q).filter((x) => !x.aberta);
  const repousos = ps.slice(1).map((x, i) => ({ quadros: x.ini - ps[i].fim, relogio: x.cIni != null && ps[i].cFim != null ? x.cIni - ps[i].cFim : null }));
  return { ...info, erros, ps, repousos, primeira: ps[0] ? ps[0].ini - info.criado : null };
};
const fmt = (a) => a.map((x) => Math.round(x)).join(", ");

if (!PUBLICO) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const c = await rodar("candidata", w, h, 31000);
    const a = await rodar("anterior", w, h, 34000);
    const rq = c.repousos.map((x) => x.quadros), rc = c.repousos.map((x) => x.relogio).filter((x) => x != null);
    ok("repouso", `${w}x${h} candidata (${c.versao}): repousos de ~5 s entre passagens`, c.versao === "1.3.1-03d2-candidato" && c.config === "passagem:recomendado" && rq.length >= 3 && rq.every((x) => x >= 4950 && x <= 5400) && !c.erros.length, { quadros: fmt(rq), relogio: fmt(rc), passagens: c.ps.length });
    const ra = a.repousos.map((x) => x.quadros);
    ok("repouso", `${w}x${h} anterior (${a.versao}): repouso de antes (~7,5–9 s), para comparação`, a.versao === "1.3.0-03d2-candidato" && a.config === "passagem:recomendado" && ra.length >= 2 && ra.every((x) => x > 6500) && !a.erros.length, { quadros: fmt(ra), passagens: a.ps.length });
    const n = Math.min(c.ps.length, a.ps.length);
    const dd = Array.from({ length: n }, (_, i) => c.ps[i].d - a.ps[i].d);
    ok("repouso", `${w}x${h} mesma passagem: duração de cada passagem por índice igual (±50 ms) e 1ª passagem no mesmo tempo (±120 ms)`, n >= 2 && dd.every((x) => Math.abs(x) <= 50) && Math.abs(c.primeira - a.primeira) <= 120, { durC: fmt(c.ps.slice(0, n).map((x) => x.d)), durA: fmt(a.ps.slice(0, n).map((x) => x.d)), primeiraC: c.primeira, primeiraA: a.primeira });
  }
  // estados no meio de um repouso (candidata): pausa, reduzido, aba oculta, fora da tela
  for (const estado of ["pausa", "reduzido", "oculta", "fora"]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(SONDA);
    const p = await ctx.newPage();
    await p.goto(`${BASE}/pt?montanha=candidata&texto=atual`, { waitUntil: "load" });
    // espera o fim da 1ª passagem + 2 s de repouso
    await p.waitForFunction(() => { const l = window.__l; let viu = false; for (let i = l.length - 1; i >= 0; i--) if (l[i][1]) { viu = true; return performance.now() - l[i][0] > 2000; } return false; }, null, { timeout: 15000, polling: 100 }).catch(() => {});
    // o relógio da luz só é atualizado quando o módulo desenha; por isso o repouso é medido pelos quadros: tempo sem
    // luz antes de parar + tempo até a próxima luz depois de retomar = o repouso inteiro (~5,13 s), sem o tempo parado
    const antes = await p.evaluate(() => { const l = window.__l; let fim = null; for (let i = l.length - 1; i >= 0; i--) if (l[i][1]) { fim = l[i][0]; break; } return { t: performance.now(), fimLuz: fim }; });
    if (estado === "pausa") await p.evaluate(() => window.ARARAT_MOVIMENTO.definir(true));
    if (estado === "reduzido") await p.emulateMedia({ reducedMotion: "reduce" });
    if (estado === "oculta") await p.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
    if (estado === "fora") await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(8000); // mais que o repouso inteiro
    const durante = await p.evaluate((t0) => ({ luz: window.__l.filter((x) => x[0] > t0 + 100 && x[1]).length }), antes.t);
    if (estado === "pausa") await p.evaluate(() => window.ARARAT_MOVIMENTO.definir(false));
    if (estado === "reduzido") await p.emulateMedia({ reducedMotion: "no-preference" });
    if (estado === "oculta") await p.evaluate(() => { delete document.visibilityState; delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
    if (estado === "fora") await p.evaluate(() => scrollTo(0, 0));
    const tVolta = await p.evaluate(() => performance.now());
    await p.waitForTimeout(9000);
    const depois = await p.evaluate((tv) => { const l = window.__l.filter((x) => x[0] >= tv); let runs = 0, prev = 0, primeira = null; for (const x of l) { if (x[1] && !prev) { runs++; if (primeira === null) primeira = x[0] - tv; } prev = x[1]; } return { runs, primeira }; }, tVolta);
    const repouso = depois.primeira !== null && antes.fimLuz !== null ? Math.round(antes.t - antes.fimLuz + depois.primeira) : null;
    ok("estados", `candidata, ${estado} no meio do repouso: sem luz enquanto parado; ao retomar, só o repouso que faltava (total ~5,1 s sem contar o tempo parado), uma passagem por vez`, durante.luz === 0 && repouso !== null && repouso > 4900 && repouso < 5450 && depois.runs <= 2, { antesDeParar: Math.round(antes.t - antes.fimLuz), depoisDeRetomar: Math.round(depois.primeira), repouso, durante, passagensDepois: depois.runs });
    await ctx.close();
  }
} else {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  const ped = []; p.on("request", (q) => { if (/home-montanha-1\.3/.test(q.url())) ped.push(q.url()); });
  for (const v of ["candidata", "anterior"]) {
    await p.goto(`${BASE}/pt?montanha=${v}`, { waitUntil: "load" }); await p.waitForTimeout(2500);
    const r = await p.evaluate(() => ({ versao: document.querySelector("[data-hero]").dataset.montanhaVersao, attrs: ["montanhaCandidata", "montanhaCandidataAnterior"].filter((k) => k in document.querySelector("[data-hero]").dataset), html13: /home-montanha-1\.3/.test(document.documentElement.outerHTML) }));
    ok("publica", `?montanha=${v} ignorado: estável, sem atributos nem caminhos dos candidatos, nenhum pedido`, r.versao === "1.2.1-03d2" && !r.attrs.length && !r.html13 && !ped.length, r);
  }
  for (const pasta of ["1.3.1-03d2-candidato", "1.3.0-03d2-candidato"]) {
    const st = (await p.request.get(`${BASE}/previa/home-montanha-${pasta}/web/home-sculpture.js`)).status();
    ok("publica", `/previa/home-montanha-${pasta}/ bloqueada na pública`, st >= 400, { status: st });
  }
  await ctx.close();
}

await b.close();
const falhas = res.filter((r) => !r.ok).length;
console.log(`\n${res.length - falhas} ok, ${falhas} falha(s)`);
if (SAIDA) writeFileSync(SAIDA, JSON.stringify({ base: BASE, publico: PUBLICO, data: new Date().toISOString(), resultados: res }, null, 1));
process.exit(falhas ? 1 : 0);
