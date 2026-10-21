#!/usr/bin/env node
/**
 * Home: restauração da leitura num DOCUMENTO NOVO e na navegação no app (fechamento da restauração, 15/10/2026).
 *   node tests/ararat/verifica-home-documento-novo.mjs http://127.0.0.1:PORTA [saida.json] [--rep=N] [--publico]
 *
 * Caminhos, separados: recarga durante a leitura (recargas seguidas, para ver acúmulo); volta entre documentos SEM
 * bfcache (Chromium com BackForwardCache desligado; conferido: navegação back_forward e pageshow não persistido);
 * navegação no app (voltar, avançar, voltar); fontes e módulos atrasados; resize antes da recarga; movimento reduzido +
 * pausa. Telas 1280×600, 1280×720, 1366×768 e 1536×864.
 *
 * O que se mede, por repetição:
 *   - saída: rolagem (y) e o elemento de referência — o 1º texto estável (h2, h3, p, li, dt, dd fora das mídias que
 *     o palco move) com o topo abaixo do cabeçalho — e a posição dele na janela;
 *   - 1º quadro (1º requestAnimationFrame com <main>) e posição estabilizada (2,5 s depois): y e a posição VISUAL da
 *     mesma referência. A posição visual é o que o visitante vê; o y sozinho engana quando o conteúdo acima muda de
 *     altura e a ancoragem compensa.
 *   Controle: uma cópia ESTÁTICA do DOM final da Home (mesma janela, sem nenhum script) que faz a MESMA sequência de
 *   recargas/voltas a partir da mesma 1ª saída (recargas seguidas acumulam o desvio do Chromium). A geometria dela nunca muda, então o desvio dela é o do próprio Chromium (âncora de restauração
 *   serializada; medido também com JS desligado e com as fontes bloqueadas). Veredito por repetição: "exata",
 *   "igual à cópia estática (Chromium)" — registrado à parte, com o valor —, "difere da cópia estática" (erro da
 *   página) ou "salto visível depois do 1º quadro" (a referência muda de lugar entre quadros). Passa: igual à cópia
 *   estática e sem salto visível. Navegação no app (sem restauração do navegador) e abertura: exata.
 *   Opções: --rep=N (repetições; padrão 6), --telas=1280x600,…, --grupos=recarga,documento,app,atrasos,resize,
 *   estados,abertura; --editorial=candidato (entradas editoriais candidatas ligadas, revisão privada);
 *   --texto=gsap (títulos por linhas candidatos ligados, revisão privada, 19/10).
 * Chromium headless (sem GPU); não equivale a navegador renderizado no Windows.
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://127.0.0.1:3101").replace(/\/$/, "");
const SAIDA = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : null;
const REP = Number((process.argv.find((a) => a.startsWith("--rep=")) || "").slice(6)) || 6;
const PUBLICO = process.argv.includes("--publico");
// --editorial=candidato: a mesma matriz com as entradas editoriais candidatas ligadas (revisão privada)
const EDITORIAL = (process.argv.find((x) => x.startsWith("--editorial=")) || "").slice(12) || null;
const TEXTO = (process.argv.find((x) => x.startsWith("--texto=")) || "").slice(8) || null;
const TELAS = ((process.argv.find((a) => a.startsWith("--telas=")) || "").slice(8) || "1280x600,1280x720,1366x768,1536x864").split(",").map((t) => t.split("x").map(Number));
const GRUPOS = ((process.argv.find((a) => a.startsWith("--grupos=")) || "").slice(9) || "recarga,documento,app,atrasos,resize,estados,abertura").split(",");
const roda = (g) => GRUPOS.includes(g);
const res = [];
const ok = (grupo, nome, passou, det = {}, todas = null) => { res.push({ grupo, nome, ok: !!passou, ...det, ...(todas ? { todas } : {}) }); console.log(`${passou ? "ok  " : "FALHA"} [${grupo}] ${nome}${Object.keys(det).length ? " " + JSON.stringify(det).slice(0, 400) : ""}`); };

const b = await chromium.launch({ args: ["--disable-features=BackForwardCache"] });
const REF_SEL = "main :is(h2,h3,p,li,dt,dd):not(.cap-midia *):not(.palco-col *):not(template *)";
const SONDA = (sel) => {
  const t0 = performance.now(); window.__q = []; let n = 0;
  let ref = null; try { ref = JSON.parse(sessionStorage.getItem("__ref") || "null"); } catch { /* sem armazenamento */ }
  const f = () => {
    const m = document.querySelector("main");
    if (m) {
      const el = ref ? document.querySelectorAll(sel)[ref.i] : null;
      const h = document.querySelector("[data-hero]");
      window.__q.push({ t: Math.round(performance.now() - t0), y: Math.round(scrollY), topo: el ? Math.round(el.getBoundingClientRect().top) : null, heroH: h ? Math.round(h.getBoundingClientRect().height) : null });
    }
    if (performance.now() - t0 < 2500 && n++ < 400) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
  addEventListener("pageshow", (e) => { window.__pageshow = e.persisted; });
};
const nova = async (w, h, o = {}) => { const { rotas, ...rest } = o; const ctx = await b.newContext({ viewport: { width: w, height: h }, ...rest }); await ctx.addInitScript(SONDA, REF_SEL); if (EDITORIAL) await ctx.addInitScript((v) => { try { sessionStorage.setItem("ararat:editorial-versao", v); } catch {} }, EDITORIAL); if (TEXTO) await ctx.addInitScript((v) => { try { sessionStorage.setItem("ararat:texto-versao", v); } catch {} }, TEXTO); if (rotas) await rotas(ctx); const p = await ctx.newPage(); p.__erros = []; p.on("pageerror", (e) => p.__erros.push(e.message)); return { ctx, p }; };
const atrasar = (re, ms) => (ctx) => ctx.route(re, async (r) => { await new Promise((s) => setTimeout(s, ms)); await r.continue(); });
const FONTES = /\.(woff2?|ttf)(\?|$)/, MODULOS = /\/(ararat\/pacotes|previa)\/.*\.m?js(\?|$)/;

// referência de leitura: 1º texto estável com o topo abaixo do cabeçalho; fica no sessionStorage para o documento novo
const marcarSaida = (p) => p.evaluate((sel) => {
  const head = document.querySelector(".cab")?.getBoundingClientRect().bottom ?? 0;
  const els = [...document.querySelectorAll(sel)];
  const i = els.findIndex((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.top >= head; });
  const ref = { i, topo: Math.round(els[i].getBoundingClientRect().top), y: Math.round(scrollY), txt: els[i].textContent.trim().slice(0, 40) };
  sessionStorage.setItem("__ref", JSON.stringify(ref)); return ref;
}, REF_SEL);
const ler = async (p) => { await p.waitForTimeout(2700); return { q: await p.evaluate(() => window.__q), pageshow: await p.evaluate(() => window.__pageshow), nav: await p.evaluate(() => performance.getEntriesByType("navigation")[0]?.type) }; };
const classe = (d) => (d === 0 ? "exata" : Math.abs(d) <= 4 ? "pequena" : "salto");
const avaliar = (ref, q) => {
  const v = q.filter((x) => x.topo !== null);
  const primeiro = v[0], fim = v.at(-1);
  const dPrim = primeiro.topo - ref.topo, dFim = fim.topo - ref.topo;
  const topos = [...new Set(v.map((x) => x.topo))];
  return { saida: { y: ref.y, topo: ref.topo }, primeiro: { y: primeiro.y, topo: primeiro.topo, heroH: primeiro.heroH }, estabilizado: { y: fim.y, topo: fim.topo, heroH: fim.heroH }, dPrimeiro: dPrim, dFinal: dFim, classe: classe(dFim), corrigeDepois: topos.length > 1, topos: topos.slice(0, 6) };
};
const resumir = (lista) => ({ n: lista.length, exata: lista.filter((r) => r.classe === "exata" && !r.corrigeDepois).length, pequena: lista.filter((r) => r.classe === "pequena").length, salto: lista.filter((r) => r.classe === "salto").length, corrigeDepois: lista.filter((r) => r.corrigeDepois).length });
const rolar = async (p, alvo) => { await p.evaluate((v) => scrollTo(0, Math.min(v, document.documentElement.scrollHeight - innerHeight - 10)), alvo); await p.waitForTimeout(400); };
const ALVOS = [4062, 1500, 2600];
const curto = (x) => ({ alvo: x.alvo, r: x.r, saida: x.saida, primeiro: x.primeiro, estabilizado: x.estabilizado, estatico: x.estatico, dFinal: x.dFinal, dEstatico: x.dEstatico, veredito: x.veredito, topos: x.topos });


// CONTROLE: cópia estática do DOM FINAL da Home (mesma janela, depois de montar), sem nenhum script. A geometria dela
// nunca muda; o que a recarga ou a volta fizerem nela é o comportamento do próprio Chromium (âncora de restauração
// serializada). A página viva é aprovada quando termina EXATAMENTE onde a cópia estática termina, a partir da mesma
// saída, e sem salto visível depois do 1º quadro. O desvio da cópia estática é registrado à parte ("nativo").
const estaticos = new Map();
const controle = async (w, h) => {
  const k = `${w}x${h}`; if (estaticos.has(k)) return estaticos.get(k);
  const c0 = await b.newContext({ viewport: { width: w, height: h } }); const p0 = await c0.newPage();
  await p0.goto(`${BASE}/pt`, { waitUntil: "load" }); await p0.waitForTimeout(2500);
  // --texto=gsap: títulos ainda não lidos ficam divididos (armados) na 1ª visita; o DOM FINAL é o texto normal, como
  // a página viva fica na restauração (nunca divide). pagehide termina as entradas e desfaz a divisão.
  if (TEXTO) { await p0.evaluate(() => dispatchEvent(new Event("pagehide"))); await p0.waitForTimeout(150); }
  const html = (await p0.content()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ""); await c0.close();
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.route(`${BASE}/__estatico`, (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html }));
  const p = await ctx.newPage(); const cache = new Map();
  // a MESMA sequência de passos da página viva (recargas seguidas acumulam o desvio do Chromium: o estado de
  // restauração de uma entrada já restaurada não é o mesmo de uma rolagem nova), a partir da mesma 1ª saída
  const cadeia = async (y0, passos) => {
    const ck = y0 + ":" + passos.join(","); if (cache.has(ck)) return cache.get(ck);
    await p.goto(`${BASE}/__estatico`, { waitUntil: "load" }); await p.waitForTimeout(300);
    await p.evaluate((v) => scrollTo(0, v), y0); await p.waitForTimeout(200);
    const ys = [Math.round(await p.evaluate(() => scrollY))];
    for (const passo of passos) {
      if (passo === "recarga") await p.reload({ waitUntil: "load" });
      else { await p.goto(`${BASE}/pt/plataforma`, { waitUntil: "load" }); await p.waitForTimeout(300); await p.goBack({ waitUntil: "load" }); }
      await p.waitForTimeout(500); ys.push(Math.round(await p.evaluate(() => scrollY)));
    }
    cache.set(ck, ys); return ys;
  };
  const o = { cadeia, fechar: () => ctx.close() }; estaticos.set(k, o); return o;
};
// julga uma sequência de registros da página viva contra a mesma sequência na cópia estática
const julgarCadeia = async (regs, w, h, passos) => {
  if (!regs.length) return regs;
  const ys = await (await controle(w, h)).cadeia(regs[0].saida.y, passos);
  regs.forEach((reg, i) => {
    reg.estatico = { de: ys[i], para: ys[i + 1] };
    reg.dEstatico = ys[i] - ys[i + 1]; // em posição visual: + = conteúdo mais abaixo
    const mesmaSaida = ys[i] === reg.saida.y;
    reg.veredito = reg.corrigeDepois ? "salto visível depois do 1º quadro" : !mesmaSaida ? `saída diferente da cópia estática (${reg.saida.y} × ${ys[i]})` : reg.dFinal === reg.dEstatico ? (reg.dFinal === 0 ? "exata" : "igual à cópia estática (Chromium)") : `difere da cópia estática (${reg.dFinal - reg.dEstatico} px)`;
    reg.passa = !reg.corrigeDepois && mesmaSaida && reg.dFinal === reg.dEstatico;
  });
  return regs;
};
const contar = (lista) => ({ n: lista.length, passa: lista.filter((r) => r.passa).length, exata: lista.filter((r) => r.veredito === "exata").length, nativa: lista.filter((r) => r.veredito.startsWith("igual")).length, nativaPx: [...new Set(lista.filter((r) => r.veredito.startsWith("igual")).map((r) => r.dEstatico))], difere: lista.filter((r) => /^(difere|saída)/.test(r.veredito)).length, saltoVisivel: lista.filter((r) => r.corrigeDepois).length });

// ---- 1. recarga durante a leitura: recargas SEGUIDAS a partir da mesma página (acúmulo), por tela e posição
if (roda("recarga")) for (const [w, h] of TELAS) {
  const todas = [];
  for (const alvo of ALVOS) {
    const { ctx, p } = await nova(w, h);
    await p.goto(`${BASE}/pt`, { waitUntil: "load" }); await p.waitForTimeout(1500); await rolar(p, alvo);
    const regs = [];
    for (let r = 0; r < (alvo === 4062 ? REP : Math.ceil(REP / 2)); r++) {
      const ref = await marcarSaida(p);
      await p.reload({ waitUntil: "load" }); const { q } = await ler(p);
      regs.push({ alvo, r, ...avaliar(ref, q) });
    }
    todas.push(...await julgarCadeia(regs, w, h, regs.map(() => "recarga")));
    if (p.__erros.length) todas.push({ erro: p.__erros });
    await ctx.close();
  }
  const s = contar(todas.filter((x) => !x.erro));
  ok("recarga", `${w}×${h}: ${s.n} recargas seguidas (saídas em ${ALVOS.join(", ")}): cada uma termina onde termina a cópia estática, sem salto visível depois do 1º quadro`, s.passa === s.n && !todas.some((x) => x.erro), { ...s, piores: todas.filter((x) => !x.passa).slice(0, 4).map(curto) }, todas);
}

// ---- 2. volta entre documentos SEM bfcache: Home → Plataforma por carga de documento → voltar
if (roda("documento")) for (const [w, h] of TELAS) {
  const todas = []; const { ctx, p } = await nova(w, h);
  await p.goto(`${BASE}/pt`, { waitUntil: "load" }); await p.waitForTimeout(1500); await rolar(p, 4062);
  for (let r = 0; r < REP; r++) {
    const ref = await marcarSaida(p);
    await p.goto(`${BASE}/pt/plataforma`, { waitUntil: "load" }); await p.waitForTimeout(400);
    await p.goBack({ waitUntil: "load" }); const { q, pageshow, nav } = await ler(p);
    todas.push({ r, nav, persistido: pageshow, ...avaliar(ref, q) });
  }
  await julgarCadeia(todas, w, h, todas.map(() => "documento"));
  const s = contar(todas);
  const semCache = todas.every((x) => x.nav === "back_forward" && x.persistido === false);
  ok("documento", `${w}×${h}: ${s.n} voltas entre documentos (sem bfcache: ${semCache}): cada uma termina onde termina a cópia estática, sem salto visível`, semCache && s.passa === s.n && p.__erros.length === 0, { ...s, piores: todas.filter((x) => !x.passa).slice(0, 4).map(curto) }, todas);
  await ctx.close();
}

// ---- 3. navegação no app: clique real no cabeçalho, voltar, avançar, voltar
const clicar = async (p, sel) => { const c = await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel); await p.mouse.click(c[0], c[1]); };
if (roda("app")) for (const [w, h] of TELAS) {
  const todas = []; const { ctx, p } = await nova(w, h);
  await p.goto(`${BASE}/pt`, { waitUntil: "load" }); await p.waitForTimeout(1500); await rolar(p, 4062);
  for (let r = 0; r < Math.ceil(REP / 2); r++) {
    const ref = await marcarSaida(p);
    await clicar(p, 'header .nav a[href="/pt/plataforma"]'); await p.waitForURL("**/pt/plataforma"); await p.waitForTimeout(600);
    for (const dir of [-1, 1, -1]) {
      await p.evaluate((d) => { window.__q = []; const t0 = performance.now(); const sel = "main :is(h2,h3,p,li,dt,dd):not(.cap-midia *):not(.palco-col *):not(template *)"; const ref = JSON.parse(sessionStorage.getItem("__ref")); const f = () => { if (location.pathname === "/pt") { const el = document.querySelectorAll(sel)[ref.i]; const hh = document.querySelector("[data-hero]"); if (el && hh) window.__q.push({ t: Math.round(performance.now() - t0), y: Math.round(scrollY), topo: Math.round(el.getBoundingClientRect().top), heroH: Math.round(hh.getBoundingClientRect().height) }); } if (performance.now() - t0 < 1500) requestAnimationFrame(f); }; requestAnimationFrame(f); d < 0 ? history.back() : history.forward(); }, dir);
      await p.waitForTimeout(1700);
      if (dir < 0) todas.push({ r, dir, ...avaliar(ref, await p.evaluate(() => window.__q)) });
    }
  }
  const s = resumir(todas);
  ok("app", `${w}×${h}: ${s.n} voltas pela navegação no app (voltar, avançar, voltar): sem salto e sem correção depois do 1º quadro`, s.salto === 0 && s.corrigeDepois === 0 && p.__erros.length === 0, { ...s, piores: todas.filter((x) => x.classe !== "exata" || x.corrigeDepois).slice(0, 4) }, todas);
  await ctx.close();
}

// ---- 4. fontes e módulos atrasados (1,5 s) na recarga e na volta entre documentos (1280×720 e 1366×768)
if (roda("atrasos")) for (const [nomeA, rotas] of [["fontes", atrasar(FONTES, 1500)], ["módulos", atrasar(MODULOS, 1500)]]) for (const [w, h] of [[1280, 720], [1366, 768]]) {
  const todas = []; const { ctx, p } = await nova(w, h, { rotas });
  await p.goto(`${BASE}/pt`, { waitUntil: "load" }); await p.waitForTimeout(3000); await rolar(p, 4062);
  for (let r = 0; r < Math.ceil(REP / 2); r++) {
    let ref = await marcarSaida(p);
    await p.reload({ waitUntil: "load" }); let x = await ler(p); todas.push({ caminho: "recarga", r, ...avaliar(ref, x.q) });
    ref = await marcarSaida(p);
    await p.goto(`${BASE}/pt/plataforma`, { waitUntil: "load" }); await p.waitForTimeout(300);
    await p.goBack({ waitUntil: "load" }); x = await ler(p); todas.push({ caminho: "documento", r, ...avaliar(ref, x.q) });
  }
  await julgarCadeia(todas, w, h, todas.map((x) => x.caminho));
  const s = contar(todas);
  ok("atrasos", `${nomeA} atrasados 1,5 s, ${w}×${h}: ${s.n} recargas e voltas entre documentos terminam onde termina a cópia estática, sem salto visível`, s.passa === s.n, { ...s, piores: todas.filter((x) => !x.passa).slice(0, 4).map(curto) }, todas);
  await ctx.close();
}

// ---- 5. resize antes da recarga (1440×900 → 1280×720): sem salto DEPOIS do 1º quadro. A posição de saída não se
// compara (a página mudou de geometria com a janela, antes da recarga).
if (roda("resize")) {
  const todas = []; const { ctx, p } = await nova(1440, 900);
  await p.goto(`${BASE}/pt`, { waitUntil: "load" }); await p.waitForTimeout(1500); await rolar(p, 4062);
  await p.setViewportSize({ width: 1280, height: 720 }); await p.waitForTimeout(600);
  for (let r = 0; r < Math.ceil(REP / 2); r++) {
    const ref = await marcarSaida(p);
    await p.reload({ waitUntil: "load" }); const { q } = await ler(p); todas.push({ r, ...avaliar(ref, q) });
  }
  await julgarCadeia(todas, 1280, 720, todas.map(() => "recarga"));
  const s = contar(todas);
  ok("resize", `1440×900 → 1280×720 → recargas: ${s.n} terminam onde termina a cópia estática, sem salto visível`, s.passa === s.n, { ...s, piores: todas.filter((x) => !x.passa).slice(0, 3).map(curto) }, todas);
  await ctx.close();
}

// ---- 6. movimento reduzido + pausa: recarga e volta entre documentos; pausa preservada
if (roda("estados")) {
  const todas = []; const { ctx, p } = await nova(1280, 720, { reducedMotion: "reduce" });
  await p.goto(`${BASE}/pt`, { waitUntil: "load" }); await p.waitForTimeout(1500);
  await p.evaluate(() => window.ARARAT_MOVIMENTO?.definir(true)); await rolar(p, 4062);
  for (let r = 0; r < Math.ceil(REP / 2); r++) {
    let ref = await marcarSaida(p);
    await p.reload({ waitUntil: "load" }); let x = await ler(p); todas.push({ caminho: "recarga", ...avaliar(ref, x.q) });
    ref = await marcarSaida(p);
    await p.goto(`${BASE}/pt/plataforma`, { waitUntil: "load" }); await p.waitForTimeout(300);
    await p.goBack({ waitUntil: "load" }); x = await ler(p); todas.push({ caminho: "documento", ...avaliar(ref, x.q) });
  }
  await julgarCadeia(todas, 1280, 720, todas.map((x) => x.caminho));
  const est = await p.evaluate(() => ({ mov: document.documentElement.dataset.movimento }));
  const s = contar(todas);
  ok("estados", `movimento reduzido + pausa, 1280×720: ${s.n} recargas e voltas terminam onde termina a cópia estática, sem salto visível; pausa preservada`, s.passa === s.n && est.mov === "pausado", { ...s, est }, todas);
  await ctx.close();
}

// ---- 7. abertura: no 1º quadro de um documento novo a abertura já tem a altura final (as quatro telas, carga direta)
if (roda("abertura")) for (const [w, h] of TELAS) {
  const { ctx, p } = await nova(w, h);
  await p.goto(`${BASE}/pt`, { waitUntil: "load" }); await p.waitForTimeout(2500);
  const q = (await p.evaluate(() => window.__q)).filter((x) => x.heroH !== null);
  const fim = await p.evaluate(() => ({ h: Math.round(document.querySelector("[data-hero]").getBoundingClientRect().height), v: document.querySelector("[data-hero]").dataset.variante, band: innerHeight - document.querySelector(".cab").offsetHeight }));
  ok("abertura", `${w}×${h}: a abertura nasce na altura final (${fim.h} px = faixa ${fim.band}, ${fim.v}) e não muda`, q.length > 3 && q.every((x) => x.heroH === fim.h) && fim.h === fim.band, { alturas: [...new Set(q.map((x) => x.heroH))], fim });
  await ctx.close();
}

for (const c of estaticos.values()) await c.fechar();
await b.close();
const falhas = res.filter((r) => !r.ok).length;
console.log(`\n${res.length} verificações, ${falhas} falhas${PUBLICO ? " (variante pública)" : ""}`);
if (SAIDA) writeFileSync(SAIDA, JSON.stringify({ base: BASE, data: new Date().toISOString(), rep: REP, total: res.length, falhas, res }, null, 1));
process.exit(falhas ? 1 : 0);
