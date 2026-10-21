#!/usr/bin/env node
/**
 * Entradas editoriais do candidato (rodada 10: fechamento — CSS, conectores estáticos, prazo do observador).
 *   node tests/ararat/verifica-entradas-editoriais.mjs http://127.0.0.1:PORTA [saida.json] [--publico] [--grupos=a,b]
 * Revisão privada: compara ?editorial=atual (padrão) e ?editorial=candidato. Pública: o parâmetro não existe; nada
 * arma. Alvos: fio do rótulo e título do caso e da evidência. Os conectores do esquema não se movem mais (ficam na
 * lista de alvos só para provar isso). Chromium headless (sem GPU): não equivale a navegador renderizado; ritmo e
 * aparência ficam com o Motion e a aprovação estética.
 * Grupos: atual, candidato, parametros, sem-resposta, espera, restauracao, ancora, uma-vez, pausa, reduzido,
 * desmontagem, teclado, custo (privada); publica (pública).
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://127.0.0.1:3330").replace(/\/$/, "");
const SAIDA = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : null;
const PUBLICO = process.argv.includes("--publico");
const GRUPOS = ((process.argv.find((a) => a.startsWith("--grupos=")) || "").slice(9) || "").split(",").filter(Boolean);
const roda = (g) => !GRUPOS.length || GRUPOS.includes(g);
const res = [];
const ok = (grupo, nome, passou, det = {}) => { res.push({ grupo, nome, ok: !!passou, ...det }); console.log(`${passou ? "ok  " : "FALHA"} [${grupo}] ${nome}${Object.keys(det).length ? " " + JSON.stringify(det).slice(0, 360) : ""}`); };
const b = await chromium.launch({ args: ["--disable-features=BackForwardCache"] });
const TITULOS = ["#caso-t", "#ev-t"], FIOS = ["#caso .rotulo-sec", "#evidencia .rotulo-sec"];
const CONECTORES = ["#evidencia .esquema .inst", "#evidencia .esquema .nos .no:nth-child(2)", "#evidencia .esquema .nos .no:nth-child(3)", "#evidencia .esquema .nos .no:nth-child(4)"];
const ALVOS = [...TITULOS, ...FIOS, ...CONECTORES];
// estado visual de um alvo: título (opacidade/transform do elemento) ou traço (transform do ::before)
const SONDA = (cfg) => {
  const { titulos, fios, conectores } = cfg;
  window.__estado = () => {
    const out = {};
    const inc = (op, tr) => parseFloat(op) < 0.999 || (tr !== "none" && tr !== "matrix(1, 0, 0, 1, 0, 0)");
    for (const s of titulos) { const e = document.querySelector(s); if (!e) continue; const cs = getComputedStyle(e), r = e.getBoundingClientRect(); out[s] = { inc: inc(cs.opacity, cs.transform), vis: r.bottom > 0 && r.top < innerHeight, op: +(+cs.opacity).toFixed(3), tr: cs.transform }; }
    for (const s of [...fios, ...conectores]) { const e = document.querySelector(s); if (!e) continue; const cs = getComputedStyle(e, "::before"), r = e.getBoundingClientRect(); const varv = ["--fio", "--con"].map((v) => getComputedStyle(e).getPropertyValue(v).trim()).find((x) => x !== ""); out[s] = { inc: inc(cs.opacity, cs.transform) || (varv !== undefined && parseFloat(varv) < 0.999), vis: r.bottom > 0 && r.top < innerHeight, tr: cs.transform }; }
    return out;
  };
  window.__f = [];
  const f = () => {
    const st = window.__estado(), m = document.querySelector("main");
    window.__f.push({ t: Math.round(performance.now()), y: Math.round(scrollY), vis: Object.keys(st).filter((k) => st[k].inc && st[k].vis), inc: Object.keys(st).filter((k) => st[k].inc), H: document.documentElement.scrollHeight, caso: Math.round(document.querySelector("#caso")?.getBoundingClientRect().height || 0), ev: Math.round(document.querySelector("#evidencia")?.getBoundingClientRect().height || 0), ent: document.documentElement.dataset.entradas || null, m: !!m });
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
};
// IntersectionObserver presente que aceita observe() e nunca chama o callback (o caso do Motion)
const IO_MUDO = () => {
  window.IntersectionObserver = class { constructor() {} observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
};
const nova = async (w, h, o = {}) => {
  const { rotas, editorial, ioMudo, ...rest } = o;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, ...rest });
  if (ioMudo) await ctx.addInitScript(IO_MUDO);
  await ctx.addInitScript(SONDA, { titulos: TITULOS, fios: FIOS, conectores: CONECTORES });
  if (editorial) await ctx.addInitScript((v) => { try { sessionStorage.setItem("ararat:editorial-versao", v); } catch {} }, editorial);
  if (rotas) await rotas(ctx);
  const p = await ctx.newPage(); p.__erros = []; p.__js = [];
  p.on("pageerror", (e) => p.__erros.push(e.message));
  p.on("request", (r) => { if (/\.js(\?|$)/.test(r.url())) p.__js.push(r.url().split("?")[0]); });
  return { ctx, p };
};
const q = (p) => p.evaluate(() => window.__f);
const ent = (p) => p.evaluate(() => document.documentElement.dataset.entradas || null);
const estado = (p) => p.evaluate(() => window.__estado());
const incompletos = async (p) => Object.entries(await estado(p)).filter(([, v]) => v.inc).map(([k]) => k);
const marcas = (p) => p.evaluate(() => [...document.querySelectorAll("[data-entrada]")].map((e) => e.dataset.entrada));
const ler = async (p, ate) => {
  const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await p.mouse.move(200, 200);
  for (let y = await p.evaluate(() => scrollY); y < Math.min(H, ate ?? H) - 5; y = await p.evaluate(() => scrollY)) { await p.mouse.wheel(0, 240); await p.waitForTimeout(70); }
  await p.waitForTimeout(1200);
};
const maiorIncompleto = (fs) => {
  const ini = {}; let pior = 0, quem = null;
  for (const x of fs) {
    for (const s of Object.keys(ini)) if (!x.vis.includes(s)) delete ini[s];
    for (const s of x.vis) { ini[s] ??= x.t; const d = x.t - ini[s]; if (d > pior) { pior = d; quem = s; } }
  }
  return { pior, quem };
};
const tocou = (fs) => [...new Set(fs.flatMap((x) => x.vis))];
const TELAS = [[320, 568], [390, 640], [390, 844], [1280, 720], [1366, 768], [1440, 900]];
const IDIOMAS = [["/pt", "pt"], ["/", "en"], ["/es", "es"]];

if (PUBLICO) {
  if (roda("publica")) for (const [w, h] of [[390, 844], [1366, 768]]) {
    const { ctx, p } = await nova(w, h, { editorial: "candidato" });
    await p.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(800); await ler(p);
    const fs = await q(p);
    ok("publica", `${w}×${h}: ?editorial=candidato ignorado; nenhum alvo incompleto em quadro algum; nenhuma marca de entrada; sem GSAP; sem erro`, (await ent(p)) === null && fs.every((x) => x.inc.length === 0) && (await marcas(p)).length === 0 && !p.__js.some((u) => /gsap/i.test(u)) && p.__erros.length === 0, { ent: await ent(p) });
    await ctx.close();
  }
} else {
  if (roda("atual")) {
    const { ctx, p } = await nova(1366, 768);
    await p.goto(`${BASE}/pt?editorial=atual`, { waitUntil: "load" }); await p.waitForTimeout(800); await ler(p);
    const fs = await q(p);
    ok("atual", "1366×768, atual: nenhum alvo incompleto em quadro algum; nenhuma marca de entrada; data-entradas ausente", fs.every((x) => x.inc.length === 0) && (await marcas(p)).length === 0 && (await ent(p)) === null && p.__erros.length === 0, { quadros: fs.length });
    await ctx.close();
  }
  if (roda("candidato")) for (const [w, h] of TELAS) for (const [rota, l] of IDIOMAS) {
    const { ctx, p } = await nova(w, h);
    await p.goto(`${BASE}${rota}?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(900);
    const armado = await ent(p);
    const ini = await p.evaluate(() => ({ H: document.documentElement.scrollHeight }));
    await ler(p);
    const fs = (await q(p)).filter((x) => x.m);
    const alturas = { H: [...new Set(fs.map((x) => x.H))], caso: [...new Set(fs.map((x) => x.caso))], ev: [...new Set(fs.map((x) => x.ev))] };
    const inc = maiorIncompleto(fs), viu = tocou(fs), fim = await ent(p);
    const conectoresMexeram = fs.some((x) => x.inc.some((s) => CONECTORES.includes(s)));
    const passou = armado === "armado" && fim === "concluido" && alturas.H.length === 1 && alturas.caso.length === 1 && alturas.ev.length === 1 && alturas.H[0] === ini.H && inc.pior <= 900 && !conectoresMexeram && viu.some((s) => TITULOS.includes(s)) && (await marcas(p)).length === 0 && (await incompletos(p)).length === 0 && p.__erros.length === 0;
    ok("candidato", `${w}×${h} ${l}: arma fora da janela, toca uma vez ao entrar, termina estático; alturas iguais em todos os quadros; conectores parados; nenhum alvo incompleto na janela por mais de 900 ms`, passou, { armado, fim, alturas, maiorIncompleto: inc, tocou: viu, conectoresMexeram, erros: p.__erros });
    await ctx.close();
  }
  if (roda("parametros")) for (const [w, h, desloc] of [[1366, 768, 8], [390, 844, 4]]) {
    const { ctx, p } = await nova(w, h);
    await p.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(900);
    const y0 = await p.evaluate(() => { const m = getComputedStyle(document.querySelector("#caso-t")).transform; return m === "none" ? 0 : parseFloat(m.split(",")[5]); });
    const ev0 = await p.evaluate(() => getComputedStyle(document.querySelector("#ev-t")).transform);
    await p.evaluate(() => { window.__tl = []; const t0 = performance.now(); const f = () => { const st = window.__estado(); window.__tl.push({ t: Math.round(performance.now() - t0), caso: st["#caso-t"].op, fio: st["#caso .rotulo-sec"].tr }); if (performance.now() - t0 < 1500) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await p.evaluate(() => scrollTo(0, document.querySelector("#caso .cabeca-sec").getBoundingClientRect().top + scrollY - innerHeight * 0.5));
    await p.waitForTimeout(1600);
    const tl = await p.evaluate(() => window.__tl);
    const iniFio = tl.find((x) => x.fio !== "none")?.t, fimFio = [...tl].reverse().find((x) => x.fio !== "none" && x.fio !== "matrix(1, 0, 0, 1, 0, 0)")?.t;
    const iniT = tl.find((x) => x.caso > 0 && x.caso < 1)?.t, fimT = [...tl].reverse().find((x) => x.caso < 1)?.t;
    const durT = iniT != null && fimT != null ? fimT - iniT : null;
    ok("parametros", `${w}×${h}: título do caso parte de ${desloc} px; título da evidência sem deslocamento; fio e título duram ~340/380 ms`, Math.round(y0) === desloc && (ev0 === "none" || ev0 === "matrix(1, 0, 0, 1, 0, 0)") && durT !== null && durT >= 250 && durT <= 480, { y0, ev0, fioMs: iniFio != null && fimFio != null ? fimFio - iniFio : null, tituloMs: durT });
    await ctx.close();
  }
  if (roda("sem-resposta")) for (const [w, h] of [[1366, 768], [390, 844]]) {
    // observador existente que nunca chama o callback: em 1,5 s tudo volta ao estado estático completo
    const { ctx, p } = await nova(w, h, { ioMudo: true });
    await p.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(3000);
    const inc0 = await incompletos(p), e0 = await ent(p);
    await ler(p); const inc1 = await incompletos(p);
    const fs = (await q(p)).filter((x) => x.t > 3000);
    ok("sem-resposta", `${w}×${h}: observador que nunca responde — passado o prazo, nenhum alvo incompleto (no topo e lendo até o fim)`, inc0.length === 0 && inc1.length === 0 && fs.every((x) => x.inc.length === 0) && (await marcas(p)).length === 0, { e0, inc0, inc1 });
    await ctx.close();
  }
  if (roda("espera")) for (const [w, h] of [[1440, 900], [390, 844]]) {
    // 10 s parado no topo: as entradas continuam acontecendo na 1ª leitura
    const { ctx, p } = await nova(w, h);
    await p.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(10000);
    const e0 = await ent(p); await ler(p); const fs = await q(p); const viu = tocou(fs);
    ok("espera", `${w}×${h}: 10 s no topo e depois a leitura — os dois títulos entram; termina estático`, e0 === "armado" && TITULOS.every((s) => viu.includes(s)) && (await ent(p)) === "concluido" && (await incompletos(p)).length === 0, { e0, tocou: viu });
    await ctx.close();
  }
  if (roda("restauracao")) {
    const { ctx, p } = await nova(1366, 768);
    await p.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(900);
    await p.evaluate(() => scrollTo(0, 1500)); await p.waitForTimeout(300);
    await p.reload({ waitUntil: "load" }); await p.waitForTimeout(800);
    const e1 = await ent(p); await ler(p); const f1 = await q(p);
    ok("restauracao", "recarga no meio da Home: estático e nenhum alvo incompleto em quadro algum", e1 === "estatico" && f1.every((x) => x.inc.length === 0), { e1 });
    await p.evaluate(() => scrollTo(0, 2600)); await p.waitForTimeout(300);
    await p.goto(`${BASE}/pt/plataforma`, { waitUntil: "load" }); await p.goBack({ waitUntil: "load" }); await p.waitForTimeout(800);
    const e2 = await ent(p); await ler(p); const f2 = await q(p);
    ok("restauracao", "volta entre documentos: estático e nenhum alvo incompleto", e2 === "estatico" && f2.every((x) => x.inc.length === 0), { e2 });
    await ctx.close();
  }
  if (roda("restauracao")) {
    const { ctx, p } = await nova(1366, 768);
    await p.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(900);
    const c = await p.evaluate(() => { const r = document.querySelector('header .nav a[href="/pt/plataforma"]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    await p.mouse.click(c[0], c[1]); await p.waitForURL("**/pt/plataforma"); await p.waitForTimeout(600);
    const est = []; let t0 = 0;
    for (const d of [-1, 1, -1]) { t0 = await p.evaluate(() => performance.now()); await p.evaluate((d) => (d < 0 ? history.back() : history.forward()), d); await p.waitForTimeout(900); if (d < 0) est.push(await ent(p)); }
    await ler(p); const fs = (await q(p)).filter((x) => x.t > t0 + 300); // quadros da Home de volta (o documento é o mesmo)
    ok("restauracao", "voltar, avançar e voltar dentro do app: estático; nenhum alvo incompleto ao rolar", est.every((x) => x === "estatico") && fs.length > 10 && fs.filter((x) => x.inc.length).length === 0, { est, quadros: fs.length });
    await ctx.close();
  }
  if (roda("ancora")) {
    for (const [rota, nome] of [["/pt?editorial=candidato#evidencia", "carga com #evidencia"], ["/pt?editorial=candidato#cap-hub", "carga com #cap-hub"]]) {
      const { ctx, p } = await nova(1366, 768);
      await p.goto(`${BASE}${rota}`, { waitUntil: "load" }); await p.waitForTimeout(800);
      const e = await ent(p); await ler(p); const fs = await q(p);
      ok("ancora", `${nome}: estático; nenhum alvo incompleto`, e === "estatico" && fs.every((x) => x.inc.length === 0), { e });
      await ctx.close();
    }
    const { ctx, p } = await nova(1440, 900);
    await p.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(900);
    const antes = await ent(p);
    await p.evaluate(() => document.querySelector(".cap-nav").scrollIntoView({ block: "center" })); await p.waitForTimeout(150);
    const alvo = await p.evaluate(() => { const a = document.querySelector(".cap-nav a[data-cap=viewer]"); const r = a.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    await p.mouse.click(alvo[0], alvo[1]); await p.waitForTimeout(60);
    ok("ancora", "link de seção clicado com entradas armadas: concluídas na hora, estado estático completo", antes === "armado" && (await ent(p)) === "concluido" && (await marcas(p)).length === 0 && (await incompletos(p)).length === 0, { antes, depois: await ent(p) });
    await ctx.close();
  }
  if (roda("uma-vez")) {
    const { ctx, p } = await nova(1366, 768);
    await p.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(900); await ler(p);
    await p.goto(`${BASE}/pt/plataforma`, { waitUntil: "load" }); await p.waitForTimeout(300);
    await p.goto(`${BASE}/pt`, { waitUntil: "load" }); await p.waitForTimeout(900);
    const e = await ent(p); await ler(p); const fs = await q(p);
    ok("uma-vez", "nova carga da Home na mesma aba depois de ler tudo: nada arma de novo", e === "estatico" && fs.every((x) => x.inc.length === 0), { e });
    await ctx.close();
  }
  if (roda("pausa")) {
    // pausa no meio da entrada do caso
    const { ctx, p } = await nova(1366, 768);
    await p.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(900);
    await p.evaluate(() => scrollTo(0, document.querySelector("#caso .cabeca-sec").getBoundingClientRect().top + scrollY - innerHeight * 0.5));
    await p.waitForTimeout(150);
    const meio = await incompletos(p);
    await p.evaluate(() => window.ARARAT_MOVIMENTO.definir(true)); await p.waitForTimeout(40);
    const depois = await incompletos(p), e = await ent(p);
    await ler(p); const fs = (await q(p)).slice(-80);
    ok("pausa", "pausa no meio da entrada do caso: no quadro seguinte tudo completo; nada arma depois", meio.length > 0 && depois.length === 0 && e === "concluido" && fs.every((x) => x.inc.length === 0) && (await marcas(p)).length === 0, { meio, depois, e });
    await ctx.close();
    const { ctx: c2, p: p2 } = await nova(1366, 768);
    await c2.addInitScript(() => { try { sessionStorage.setItem("ararat:paused", "1"); } catch {} });
    await p2.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p2.waitForTimeout(900);
    const e2 = await ent(p2); await ler(p2); const f2 = await q(p2);
    ok("pausa", "carga já pausada: estático; nenhum alvo incompleto", e2 === "estatico" && f2.every((x) => x.inc.length === 0), { e2 });
    await c2.close();
  }
  if (roda("reduzido")) {
    const { ctx, p } = await nova(1366, 768, { reducedMotion: "reduce" });
    await p.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(900);
    const e = await ent(p); await ler(p); const fs = await q(p);
    ok("reduzido", "movimento reduzido na carga: estático; nenhum alvo incompleto", e === "estatico" && fs.every((x) => x.inc.length === 0), { e });
    await ctx.close();
    const { ctx: c2, p: p2 } = await nova(1366, 768);
    await p2.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p2.waitForTimeout(900);
    await p2.evaluate(() => scrollTo(0, document.querySelector("#caso .cabeca-sec").getBoundingClientRect().top + scrollY - innerHeight * 0.5));
    await p2.waitForTimeout(150);
    const meio = await incompletos(p2);
    await p2.emulateMedia({ reducedMotion: "reduce" }); await p2.waitForTimeout(60);
    ok("reduzido", "movimento reduzido ligado no meio da entrada: tudo completo na hora", meio.length > 0 && (await incompletos(p2)).length === 0 && (await ent(p2)) === "concluido" && (await marcas(p2)).length === 0, { meio, depois: await ent(p2) });
    await c2.close();
  }
  if (roda("desmontagem")) {
    // troca de rota no meio da entrada; volta: nada órfão, nada escondido
    const { ctx, p } = await nova(1366, 768);
    await p.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(900);
    await p.evaluate(() => scrollTo(0, document.querySelector("#caso .cabeca-sec").getBoundingClientRect().top + scrollY - innerHeight * 0.5));
    await p.waitForTimeout(120);
    const c = await p.evaluate(() => { const r = document.querySelector('header .nav a[href="/pt/plataforma"]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    await p.mouse.click(c[0], c[1]); await p.waitForURL("**/pt/plataforma"); await p.waitForTimeout(2000);
    const fora = await p.evaluate(() => ({ ent: document.documentElement.dataset.entradas || null, marcas: document.querySelectorAll("[data-entrada]").length }));
    await p.evaluate(() => history.back()); await p.waitForTimeout(1200);
    const volta = await ent(p); await ler(p); const fs = (await q(p)).slice(-120);
    ok("desmontagem", "troca de rota no meio da entrada: nada fica na Plataforma (sem marca, sem estado, sem prazo disparando); na volta, estático", fora.ent === null && fora.marcas === 0 && volta === "estatico" && fs.every((x) => x.inc.length === 0) && p.__erros.length === 0, { fora, volta });
    await ctx.close();
  }
  if (roda("teclado")) {
    const { ctx, p } = await nova(1366, 768);
    await p.goto(`${BASE}/pt?editorial=candidato`, { waitUntil: "load" }); await p.waitForTimeout(900);
    const ruins = [];
    for (let i = 0; i < 45; i++) {
      await p.keyboard.press("Tab"); await p.waitForTimeout(40);
      const r = await p.evaluate((alvos) => { const els = alvos.map((x) => document.querySelector(x)).filter(Boolean); for (let n = document.activeElement; n && n !== document.body; n = n.parentElement) if (els.includes(n) && parseFloat(getComputedStyle(n).opacity) < 0.999) return n.id || n.className; return null; }, TITULOS);
      if (r) ruins.push(r);
    }
    await p.evaluate(() => { document.activeElement?.blur?.(); scrollTo(0, 0); }); await p.waitForTimeout(200);
    for (let i = 0; i < 14; i++) { await p.keyboard.press("PageDown"); await p.waitForTimeout(160); }
    await p.waitForTimeout(1200);
    ok("teclado", "Tab: nenhum foco dentro de alvo incompleto; PageDown leva a página e as entradas terminam", ruins.length === 0 && (await incompletos(p)).length === 0 && p.__erros.length === 0, { ruins: ruins.slice(0, 4), ent: await ent(p) });
    await ctx.close();
  }
  if (roda("custo")) {
    const jsDe = async (ed) => { const { ctx, p } = await nova(1366, 768); await p.goto(`${BASE}/pt?editorial=${ed}`, { waitUntil: "load" }); await p.waitForTimeout(1200); await ler(p); const l = new Set(p.__js); await ctx.close(); return l; };
    const jA = await jsDe("atual"), jC = await jsDe("candidato");
    const extra = [...jC].filter((u) => !jA.has(u));
    const custo = {};
    for (const ed of ["atual", "candidato"]) {
      const amostras = [];
      for (let k = 0; k < 5; k++) {
        const { ctx, p } = await nova(1366, 768);
        const s = await ctx.newCDPSession(p); await s.send("Performance.enable");
        await p.goto(`${BASE}/pt?editorial=${ed}`, { waitUntil: "load" }); await p.waitForTimeout(1200); await ler(p);
        const m = Object.fromEntries((await s.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
        amostras.push({ script: Math.round(m.ScriptDuration * 1000), estilo: Math.round(m.RecalcStyleDuration * 1000), tarefas: Math.round(m.TaskDuration * 1000) });
        await ctx.close();
      }
      const med = (k) => amostras.map((a) => a[k]).sort((a, b) => a - b)[2];
      custo[ed] = { scriptMs: med("script"), estiloMs: med("estilo"), tarefasMs: med("tarefas"), amostras };
    }
    ok("custo", `JS a mais no candidato: ${extra.length} arquivo(s) ${extra.map((u) => u.split("/").pop()).join(", ")}; GSAP requisitado: ${[...jC].some((u) => /gsap/i.test(u))}; script ${custo.atual.scriptMs} → ${custo.candidato.scriptMs} ms; estilo ${custo.atual.estiloMs} → ${custo.candidato.estiloMs} ms (mediana de 5)`, extra.length === 0, { custo, extra });
  }
}

await b.close();
const falhas = res.filter((r) => !r.ok).length;
console.log(`\n${res.length} verificações, ${falhas} falhas${PUBLICO ? " (variante pública)" : ""}`);
if (SAIDA) writeFileSync(SAIDA, JSON.stringify({ base: BASE, data: new Date().toISOString(), total: res.length, falhas, res }, null, 1));
process.exit(falhas ? 1 : 0);
