#!/usr/bin/env node
/**
 * Transição entre páginas — candidato privado, coreografia "A" do Motion (rodada de movimento, 14/10/2026).
 *   node tests/ararat/verifica-transicoes.mjs http://127.0.0.1:PORTA [saida.json] [--publico] [--quadros=pasta]
 * Revisão privada: compara navegação ATUAL (?transicao=atual) e CANDIDATA. Pública: confere o movimento aprovado.
 * Critérios: MONTANHA-LUZ-E-TRANSICOES-MOTION-2026-10-14.md §4.2. Chromium headless (sem GPU): tempos servem para
 * comparar os dois modos no mesmo ambiente, não como medida de campo.
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = (process.argv[2] || "http://127.0.0.1:3101").replace(/\/$/, "");
const SAIDA = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : null;
const PUBLICO = process.argv.includes("--publico");
const QUADROS = (process.argv.find((a) => a.startsWith("--quadros=")) || "").slice(10);
const res = [];
const ok = (grupo, nome, passou, det = {}) => { res.push({ grupo, nome, ok: !!passou, ...det }); console.log(`${passou ? "ok  " : "FALHA"} [${grupo}] ${nome}${Object.keys(det).length ? " " + JSON.stringify(det).slice(0, 320) : ""}`); };
const b = await chromium.launch();
// opacidade do conteúdo que o visitante vê: a MENOR entre os filhos diretos das <section> do <main> que estão na tela
// (desde o fechamento 14/10 a entrada anima o conteúdo das seções; o <main> e os fundos ficam opacos). Injetado na página.
const AJUDA = () => {
  window.__opv = () => { const m = document.getElementById("conteudo"); if (!m) return null; const v = [...m.querySelectorAll(":scope > section > *")].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight; }); return v.length ? Math.min(...v.map((e) => +getComputedStyle(e).opacity)) : +getComputedStyle(m).opacity; };
  window.__anims = () => { const m = document.getElementById("conteudo"); return m ? m.getAnimations({ subtree: true }).filter((a) => String(a.animationName || "").startsWith("ararat-pagina-entra")).length : 0; };
};
const nova = async (o = {}) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...o });
  if (o.javaScriptEnabled !== false) await ctx.addInitScript(AJUDA);
  const p = await ctx.newPage(); p.__erros = [];
  p.on("pageerror", (e) => p.__erros.push(e.message));
  return { ctx, p };
};
const ir = async (p, url, espera = 400) => { const r = await p.goto(BASE + url, { waitUntil: "networkidle" }); await p.waitForTimeout(espera); return r; };

// clique e acompanha QUADRO A QUADRO (rAF): quantos <main>, h1, opacidade do main, foco, animações do cabeçalho
const navegar = (p, sel, { real = false } = {}) => p.evaluate(async ({ sel, real }) => {
  const h0 = document.querySelector("#conteudo h1")?.textContent;
  const cab0 = document.querySelector(".cab").getBoundingClientRect();
  const quadros = []; const t0 = performance.now();
  if (!real) document.querySelector(sel).click();
  let tDom = null, tLegivel = null, focoNoCommit = null, cabAnim = 0, cabMoveu = false, mains = 1;
  while (performance.now() - t0 < 4000) {
    await new Promise((r) => requestAnimationFrame(r));
    const t = Math.round(performance.now() - t0);
    const m = document.querySelectorAll("main"); mains = Math.max(mains, m.length);
    const main = document.getElementById("conteudo"), h = main?.querySelector("h1")?.textContent;
    const op = window.__opv();
    const cab = document.querySelector(".cab"); cabAnim += cab.getAnimations({ subtree: true }).filter((a) => a.playState === "running" && !/sublinhado|nav/.test(String(a.animationName || ""))).length;
    const r = cab.getBoundingClientRect(); if (Math.abs(r.top - cab0.top) > 0.5 || Math.abs(r.height - cab0.height) > 0.5) cabMoveu = true;
    if (tDom === null && h && h !== h0) { tDom = t; const a = document.activeElement; focoNoCommit = a && a !== document.body ? a.tagName.toLowerCase() : "body"; }
    if (tDom !== null && tLegivel === null && op >= 0.9) tLegivel = t;
    quadros.push({ t, op, h1: h?.slice(0, 20) });
    if (tLegivel !== null && t > tLegivel + 100 && !main.classList.contains("pagina-entra")) break;
  }
  const main = document.getElementById("conteudo");
  const a = document.activeElement, ar = a?.getBoundingClientRect();
  return {
    tDom, tLegivel, focoNoCommit, cabAnim, cabMoveu, mains, url: location.pathname + location.hash,
    final: { op: window.__opv(), classe: main.classList.contains("pagina-entra"), anims: window.__anims() },
    foco: a && a !== document.body ? { tag: a.tagName.toLowerCase(), id: a.id, naTela: ar.top >= document.querySelector(".cab").getBoundingClientRect().bottom - 1 && ar.bottom <= innerHeight } : "body",
    opQuadros: quadros.filter((q) => q.h1 && q.h1 !== h0?.slice(0, 20)).slice(0, 14).map((q) => [q.t, +q.op.toFixed(2)]),
    scrollY: Math.round(scrollY),
  };
}, { sel, real });

if (PUBLICO) {
  const { ctx, p } = await nova();
  await ir(p, "/pt");
  const html = await (await p.request.get(BASE + "/pt")).text();
  const attr = await p.evaluate(() => document.documentElement.hasAttribute("data-transicao"));
  ok("publica", "transição aprovada ativa sem preferências privadas", attr && !/ararat:transicao/.test(html), { attr });
  const n = await navegar(p, 'header .nav a[href="/pt/plataforma"]');
  ok("publica", "navegação com entrada aprovada, um conteúdo e cabeçalho estável", n.url === "/pt/plataforma" && n.opQuadros.some(([, o]) => o < 0.99) && n.mains === 1 && !n.cabMoveu, { tDom: n.tDom, op: n.opQuadros.slice(0, 3) });
  await ctx.close();
} else {
  // ---- 1. navegação normal: atual × candidata (critérios 1, 2, 3, 4, 9)
  const medidas = { atual: [], candidata: [] };
  for (const modo of ["atual", "candidata"]) {
    const { ctx, p } = await nova();
    await ir(p, `/pt?transicao=${modo}`, 600);
    const seq = [["/pt/plataforma", 'header .nav a[href="/pt/plataforma"]'], ["/pt/solucoes", 'header .nav a[href="/pt/solucoes"]'], ["/pt/pesquisa", 'header .nav a[href="/pt/pesquisa"]'], ["/pt", "header a.marca"], ["/pt/empresa", 'header .nav a[href="/pt/empresa"]'], ["/pt/plataforma", 'header .nav a[href="/pt/plataforma"]']];
    for (const [dest, sel] of seq) {
      await p.evaluate(() => scrollTo(0, 500));
      const n = await navegar(p, sel);
      medidas[modo].push({ dest, tDom: n.tDom, tLegivel: n.tLegivel });
      const animou = n.opQuadros.some(([, o]) => o < 0.9);
      const base = n.url === dest && n.mains === 1 && n.final.op === 1 && !n.final.classe && n.final.anims === 0 && n.scrollY === 0 && n.cabAnim === 0 && !n.cabMoveu;
      if (modo === "atual") ok("navegacao", `atual: ${dest} — troca seca (referência)`, base && !animou, { tDom: n.tDom, foco: n.foco });
      else ok("navegacao", `candidata: ${dest} — um só <main>, cabeçalho parado, entrada animada, legível ≤ 300 ms do clique, foco no h1 no commit, nada pendente`, base && animou && n.tLegivel !== null && n.tLegivel <= 300 && n.focoNoCommit === "h1" && n.foco?.tag === "h1" && n.foco.naTela, { tDom: n.tDom, tLegivel: n.tLegivel, focoNoCommit: n.focoNoCommit, op: n.opQuadros.slice(0, 6) });
    }
    ok("navegacao", `${modo}: sem erros de página`, p.__erros.length === 0, { erros: p.__erros });
    await ctx.close();
  }
  const mediana = (v) => { const s = v.filter((x) => x != null).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
  ok("navegacao", "resumo (headless): clique → página nova no DOM e → legível (opacidade ≥ 0,9)", true, {
    atual: { dom: mediana(medidas.atual.map((m) => m.tDom)), legivel: mediana(medidas.atual.map((m) => m.tLegivel)) },
    candidata: { dom: mediana(medidas.candidata.map((m) => m.tDom)), legivel: mediana(medidas.candidata.map((m) => m.tLegivel)) },
  });
  // duração declarada da entrada
  {
    const { ctx, p } = await nova();
    await ir(p, "/pt/solucoes?transicao=candidata", 300);
    const d = await p.evaluate(async () => {
      document.querySelector('header .nav a[href="/pt/pesquisa"]').click();
      for (let i = 0; i < 200; i++) { await new Promise((r) => requestAnimationFrame(r)); const m = document.getElementById("conteudo"); const a = m?.getAnimations({ subtree: true }).find((x) => x.animationName === "ararat-pagina-entra"); if (a && m.querySelector("h1")?.textContent?.startsWith("Uma pergunta")) { const t = a.effect.getComputedTiming(); const s = getComputedStyle(a.effect.target); return { nome: a.animationName, dur: t.duration, atraso: t.delay, ease: s.animationTimingFunction }; } }
      return null;
    });
    ok("navegacao", "entrada: 180 ms, sem atraso, cubic-bezier(.23,1,.32,1) (tokens do Motion)", d && d.dur === 180 && d.atraso === 0 && /0\.23, 1, 0\.32, 1/.test(d.ease), d || {});
    await ctx.close();
  }

  // ---- 2. carga direta: sem entrada
  {
    const { ctx, p } = await nova();
    for (const url of ["/pt/plataforma?transicao=candidata", "/pt/solucoes/prostata", "/es/empresa", "/"]) {
      await p.goto(BASE + url, { waitUntil: "commit" });
      const amostras = [];
      for (let i = 0; i < 12; i++) { await p.waitForTimeout(60); amostras.push(await p.evaluate(() => { const m = document.getElementById("conteudo"); return m ? { op: window.__opv(), classe: m.classList.contains("pagina-entra") } : null; })); }
      ok("direta", `${url}: conteúdo sem coreografia de entrada na carga`, amostras.filter(Boolean).every((a) => a.op === 1 && !a.classe), { amostras: amostras.filter(Boolean).length });
    }
    await ctx.close();
  }

  // ---- 3. âncoras
  {
    const { ctx, p } = await nova();
    await ir(p, "/pt?transicao=candidata", 600);
    const antes = await p.evaluate(() => scrollY);
    await p.evaluate(() => document.querySelector('a[href="#cap-hub"]')?.click());
    await p.waitForTimeout(600);
    const e = await p.evaluate(() => ({ url: location.pathname + location.hash, scroll: Math.round(scrollY), classe: document.getElementById("conteudo").classList.contains("pagina-entra") }));
    ok("ancora", "seção na mesma página: rola até ela, sem entrada de página", e.url === "/pt#cap-hub" && e.scroll > antes && !e.classe, e);
    await ir(p, "/pt", 400);
    const n = await navegar(p, 'a[href="/pt/plataforma#adocao"]');
    const vis = await p.evaluate(() => { const r = document.getElementById("adocao").getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
    ok("ancora", "seção de outra página: chega na seção, com a mesma entrada, foco no título da seção", n.url === "/pt/plataforma#adocao" && vis && n.opQuadros.some(([, o]) => o < 0.9) && n.foco?.tag === "h2" && n.foco.naTela, { foco: n.foco, op: n.opQuadros.slice(0, 3) });
    await ctx.close();
  }

  // ---- 4. idioma: recarga, página e seção equivalentes, sem transição
  {
    const { ctx, p } = await nova();
    await ir(p, "/pt/plataforma?transicao=candidata", 300);
    await ir(p, "/pt/plataforma#adocao", 300);
    await p.click('.cab .idiomas a[data-idioma="en"]');
    await p.waitForURL("**/platform#adocao"); await p.waitForTimeout(200);
    const e = await p.evaluate(() => { const r = document.getElementById("adocao").getBoundingClientRect(); const m = document.getElementById("conteudo"); return { url: location.pathname + location.hash, vis: r.top < innerHeight && r.bottom > 0, op: window.__opv(), classe: m.classList.contains("pagina-entra") }; });
    ok("idioma", "PT → EN: mesma página e seção (/platform#adocao), sem transição", e.url === "/platform#adocao" && e.vis && e.op === 1 && !e.classe, e);
    await ctx.close();
  }

  // ---- 5. voltar / avançar: mesma rolagem que a navegação atual
  const hist = {};
  for (const modo of ["atual", "candidata"]) {
    const { ctx, p } = await nova();
    await ir(p, `/pt?transicao=${modo}`, 400);
    await navegar(p, 'header .nav a[href="/pt/solucoes"]');
    await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(200);
    await navegar(p, 'header .nav a[href="/pt/pesquisa"]');
    await p.goBack(); await p.waitForTimeout(900);
    const v = await p.evaluate(() => { const a = document.activeElement, r = a?.getBoundingClientRect(), m = document.getElementById("conteudo"); return { url: location.pathname, scrollY: Math.round(scrollY), op: window.__opv(), pendente: window.__anims(), foco: a && a !== document.body ? { tag: a.tagName.toLowerCase(), naTela: r.top >= document.querySelector(".cab").getBoundingClientRect().bottom - 1 && r.bottom <= innerHeight } : "body" }; });
    await p.goForward(); await p.waitForTimeout(900);
    const f = await p.evaluate(() => ({ url: location.pathname, scrollY: Math.round(scrollY), op: window.__opv() }));
    hist[modo] = { voltar: v, avancar: f };
    ok("historico", `${modo}: voltar → /pt/solucoes, avançar → /pt/pesquisa, conteúdo visível, nada pendente`, v.url === "/pt/solucoes" && f.url === "/pt/pesquisa" && v.op === 1 && f.op === 1 && v.pendente === 0, hist[modo]);
  }
  ok("historico", "rolagem ao voltar/avançar igual à navegação atual; foco nunca num título fora da tela", hist.atual.voltar.scrollY === hist.candidata.voltar.scrollY && hist.atual.avancar.scrollY === hist.candidata.avancar.scrollY && (hist.candidata.voltar.foco === "body" || hist.candidata.voltar.foco.naTela), hist);

  // ---- 6. cliques rápidos
  for (const intervalo of [0, 40, 80, 120, 200]) {
    const { ctx, p } = await nova();
    await ir(p, "/pt?transicao=candidata", 400);
    const docs = []; p.on("request", (r) => { if (r.resourceType() === "document") docs.push(r.url()); });
    await p.evaluate(async (ms) => {
      for (const h of ["/pt/plataforma", "/pt/solucoes", "/pt/pesquisa", "/pt/empresa", "/pt/solucoes"]) {
        document.querySelector(`header .nav a[href="${h}"]`).click(); if (ms) await new Promise((r) => setTimeout(r, ms));
      }
    }, intervalo);
    await p.waitForTimeout(1200);
    const e = await p.evaluate(() => { const m = document.getElementById("conteudo"); return { url: location.pathname, mains: document.querySelectorAll("main").length, op: window.__opv(), pendente: window.__anims(), classe: m.classList.contains("pagina-entra") }; });
    ok("rapidos", `5 cliques a cada ${intervalo} ms: último destino, um <main>, visível, sem animação pendente, sem recarga, sem erro`, e.url === "/pt/solucoes" && e.mains === 1 && e.op === 1 && e.pendente === 0 && !e.classe && docs.length === 0 && p.__erros.length === 0, { ...e, recargas: docs.length, erros: p.__erros });
    await ctx.close();
  }

  // ---- 7. teclado
  for (const modo of ["atual", "candidata"]) {
    const { ctx, p } = await nova();
    await ir(p, `/pt/solucoes?transicao=${modo}`, 400);
    await p.focus('header .nav a[href="/pt/pesquisa"]'); await p.keyboard.press("Enter");
    await p.waitForURL("**/pt/pesquisa"); await p.waitForTimeout(400);
    const e = await p.evaluate(() => { const a = document.activeElement; const r = a?.getBoundingClientRect(); return a && a !== document.body ? { tag: a.tagName.toLowerCase(), naTela: r.bottom > 0 && r.top < innerHeight, fv: a.matches(":focus-visible") } : "body"; });
    await p.keyboard.press("Tab");
    const prox = await p.evaluate(() => { const a = document.activeElement; return { tag: a.tagName.toLowerCase(), texto: (a.textContent || "").trim().slice(0, 30) }; });
    if (modo === "candidata") ok("teclado", "candidata: Enter num link → foco no h1 da página nova, na tela, com anel de foco; o Tab seguinte segue no conteúdo", e?.tag === "h1" && e.naTela && e.fv && prox.tag === "a", { foco: e, proximo: prox });
    else ok("teclado", "atual (referência): onde o foco fica hoje", true, { foco: e, proximo: prox });
    await ctx.close();
  }
  // clique de mouse: foco no h1 sem anel visível
  {
    const { ctx, p } = await nova();
    await ir(p, "/pt/solucoes?transicao=candidata", 400);
    await p.click('header .nav a[href="/pt/pesquisa"]'); await p.waitForURL("**/pt/pesquisa"); await p.waitForTimeout(400);
    const e = await p.evaluate(() => { const a = document.activeElement; return { tag: a.tagName.toLowerCase(), fv: a.matches(":focus-visible") }; });
    ok("teclado", "clique de mouse: foco no h1 sem anel de foco visível", e.tag === "h1" && !e.fv, e);
    await ctx.close();
  }

  // ---- 8. movimento reduzido e site pausado: troca imediata (critério 5)
  for (const [nome, opc, pausar] of [["movimento reduzido", { reducedMotion: "reduce" }, false], ["site pausado", {}, true]]) {
    const { ctx, p } = await nova(opc);
    await ir(p, "/pt/solucoes?transicao=candidata", 400);
    if (pausar) await p.evaluate(() => window.ARARAT_MOVIMENTO?.definir?.(true));
    const n = await navegar(p, 'header .nav a[href="/pt/plataforma"]');
    ok("reduzido", `${nome}: troca imediata, 0 animação, foco no h1`, n.url === "/pt/plataforma" && !n.opQuadros.some(([, o]) => o < 0.99) && n.foco?.tag === "h1", { op: n.opQuadros.slice(0, 3), foco: n.foco });
    await ctx.close();
  }

  // ---- 9. sem JavaScript
  {
    const { ctx, p } = await nova({ javaScriptEnabled: false });
    await ir(p, "/pt", 100);
    await p.click('header .nav a[href="/pt/plataforma"]'); await p.waitForLoadState("load");
    const t = await p.evaluate(() => ({ url: location.pathname, h1: !!document.querySelector("main h1"), op: +getComputedStyle(document.getElementById("conteudo")).opacity }));
    ok("sem-js", "sem JS: o link carrega a página nova, visível", t.url === "/pt/plataforma" && t.h1 && t.op === 1, t);
    await ctx.close();
  }

  // ---- 10. rota lenta e falha (critério 6)
  {
    const { ctx, p } = await nova();
    await p.route("**/*", async (r) => { if (r.request().headers()["rsc"] === "1") await new Promise((x) => setTimeout(x, 1800)); r.fallback(); });
    await p.goto(BASE + "/pt?transicao=candidata", { waitUntil: "load" }); await p.waitForTimeout(300);
    const a = await p.evaluate(async () => {
      const out = []; const t0 = performance.now();
      document.querySelector('header .nav a[href="/pt/pesquisa"]').click();
      let clicouMenu = null;
      while (performance.now() - t0 < 3300) {
        await new Promise((r) => setTimeout(r, 100));
        const m = document.getElementById("conteudo");
        if (clicouMenu === null && performance.now() - t0 > 500) { const s = document.querySelector('[data-pausa]'); clicouMenu = !!s; }
        out.push({ t: Math.round(performance.now() - t0), url: location.pathname, h1: m?.querySelector("h1")?.textContent?.slice(0, 20), op: window.__opv(), indicador: !!document.querySelector('[aria-busy="true"], .carregando, [role="progressbar"]') });
      }
      return out;
    });
    const espera = a.filter((x) => x.t < 1500);
    ok("lento", "rota lenta (1,8 s): a página atual fica inteira e legível, sem indicador; depois o destino entra", espera.every((x) => x.url === "/pt" && x.op === 1 && x.h1 && !x.indicador) && a.at(-1).url === "/pt/pesquisa" && a.at(-1).op === 1, { primeiras: a.slice(0, 2), ultima: a.at(-1) });
    await p.unrouteAll({ behavior: "ignoreErrors" });
    await ir(p, "/pt/solucoes", 300);
    await p.route("**/*", (r) => (r.request().headers()["rsc"] === "1" ? r.abort() : r.fallback()));
    await p.click('header .nav a[href="/pt/empresa"]'); await p.waitForTimeout(2500);
    const e = await p.evaluate(() => ({ url: location.pathname, h1: !!document.querySelector("main h1"), op: window.__opv() }));
    ok("lento", "falha do pedido no app: o destino carrega (recarga do Next), visível", e.url === "/pt/empresa" && e.h1 && e.op === 1, e);
    await ctx.close();
  }

  // ---- 11. montanha (critério 8)
  {
    const { ctx, p } = await nova();
    await ir(p, "/pt?transicao=candidata", 1500);
    const a = await p.evaluate(() => ({ versao: document.querySelector("[data-hero]")?.dataset.montanhaVersao, canvas: document.querySelectorAll("[data-hero] canvas").length, intro: sessionStorage.getItem("ararat:montanha-institucional") }));
    await navegar(p, 'header .nav a[href="/pt/plataforma"]');
    const fora = await p.evaluate(() => document.querySelectorAll("canvas").length);
    await navegar(p, "header a.marca"); await p.waitForTimeout(1200);
    const d = await p.evaluate(() => ({ versao: document.querySelector("[data-hero]")?.dataset.montanhaVersao, canvas: document.querySelectorAll("[data-hero] canvas").length, modo: document.querySelector("[data-hero]")?.dataset.montanha }));
    ok("montanha", "Home → Plataforma → Home: 0 canvas fora da Home, um na volta, estável 1.2.1-03d2, introdução só na 1ª visita da sessão", a.canvas === 1 && fora === 0 && d.canvas === 1 && d.versao === "1.2.1-03d2" && a.intro === "1", { antes: a, fora, depois: d });
    await ctx.close();
  }

  // ---- 12. CLS na troca
  {
    const { ctx, p } = await nova();
    await ir(p, "/pt/solucoes?transicao=candidata", 400);
    await p.evaluate(() => { window.__cls = 0; new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: "layout-shift", buffered: false }); });
    await navegar(p, 'header .nav a[href="/pt/pesquisa"]'); await navegar(p, 'header .nav a[href="/pt/empresa"]');
    const cls = await p.evaluate(() => window.__cls);
    ok("cls", "CLS nas trocas (soft navigation)", cls < 0.01, { cls });
    await ctx.close();
  }


  // ---- 13. fundo durante a entrada: seções opacas desde o commit (sem clarão nem pulso), nos quatro casos
  {
    const casos = [
      ["normal", "/pt/solucoes", async (p) => navegar(p, 'header .nav a[href="/pt/pesquisa"]')],
      ["ancora-clara", "/pt", async (p) => navegar(p, 'a[href="/pt/plataforma#adocao"]')],
      ["voltar-rolado", "/pt/solucoes", async (p) => { await navegar(p, 'header .nav a[href="/pt/pesquisa"]'); await p.evaluate(() => scrollTo(0, 1400)); await p.waitForTimeout(150); await navegar(p, 'header .nav a[href="/pt/empresa"]'); await p.evaluate(() => { window.__amostrar(); history.back(); }); await p.waitForTimeout(700); }],
      ["avancar", "/pt/solucoes", async (p) => { await navegar(p, 'header .nav a[href="/pt/pesquisa"]'); await p.evaluate(() => history.back()); await p.waitForTimeout(500); await p.evaluate(() => { window.__amostrar(); history.forward(); }); await p.waitForTimeout(700); }],
    ];
    for (const [w, h] of [[1440, 900], [390, 844]]) for (const [nome, de, acao] of casos) {
      const { ctx, p } = await nova({ viewport: { width: w, height: h } });
      await ir(p, de + "?transicao=candidata", 500);
      await p.evaluate(() => {
        window.__fundo = []; const t0 = performance.now();
        const passo = () => { const m = document.getElementById("conteudo"); if (m) { const secs = [...m.children].filter((e) => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }); window.__fundo.push({ t: Math.round(performance.now() - t0), url: location.pathname, secOp: Math.min(...secs.map((e) => +getComputedStyle(e).opacity)), transparente: secs.filter((e) => getComputedStyle(e).backgroundColor === "rgba(0, 0, 0, 0)").length, html: getComputedStyle(document.documentElement).backgroundColor, body: getComputedStyle(document.body).backgroundColor, opv: window.__opv() }); } if (performance.now() - t0 < 900) requestAnimationFrame(passo); };
        window.__amostrar = () => requestAnimationFrame(passo); window.__amostrar();
      });
      await acao(p);
      const f = await p.evaluate(() => window.__fundo);
      const durante = f.filter((x) => x.opv !== null && x.opv < 0.99);
      ok("fundo", `${w}: ${nome} — seções opacas e com fundo próprio em todos os quadros da entrada; html/body sem troca de cor`, durante.length > 0 && f.every((x) => x.secOp === 1 && x.transparente === 0) && new Set(f.map((x) => x.body)).size === 1 && new Set(f.map((x) => x.html)).size === 1, { quadrosEntrada: durante.length, html: [...new Set(f.map((x) => x.html))], body: [...new Set(f.map((x) => x.body))], urls: [...new Set(f.map((x) => x.url))] });
      await ctx.close();
    }
  }

  // ---- 14. voltar ao Atlas com o palco fixo visível: atual × candidata, quadro a quadro
  {
    const r = {};
    for (const modo of ["atual", "candidata"]) {
      const { ctx, p } = await nova({ viewport: { width: 1440, height: 900 } });
      await ir(p, `/pt?transicao=${modo}`, 900);
      await p.evaluate(() => document.getElementById("cap-hub").scrollIntoView({ block: "start" })); await p.waitForTimeout(900);
      const antes = await p.evaluate(() => { const g = document.querySelector("[data-atlas]"); return { y: Math.round(scrollY), palco: g.dataset.palco, cap: g.dataset.capAtivo, palcoTop: Math.round(document.querySelector(".palco-atlas").getBoundingClientRect().top) }; });
      // clique REAL de mouse: o clique do Playwright por seletor foca o link do cabeçalho fixo e move a página antes
      // de sair (ver tests/ararat/LEIAME-PALCO-RETORNO.md) — era a origem da diferença 2327 → 1869 registrada antes
      const cl = await p.evaluate(() => { const r = document.querySelector('header .nav a[href="/pt/plataforma"]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
      await p.mouse.click(cl[0], cl[1]); await p.waitForURL("**/pt/plataforma"); await p.waitForTimeout(500);
      await p.evaluate(() => { window.__q = []; const t0 = performance.now(); const f = () => { const g = document.querySelector("[data-atlas]"), pa = document.querySelector(".palco-atlas"), leg = document.querySelector(".palco-atlas .legenda-palco, .palco-atlas figcaption"); const a = document.activeElement, ar = a?.getBoundingClientRect(); window.__q.push({ t: Math.round(performance.now() - t0), y: Math.round(scrollY), palco: g?.dataset.palco || null, cap: g?.dataset.capAtivo || null, palcoTop: pa ? Math.round(pa.getBoundingClientRect().top) : null, legTop: leg ? Math.round(leg.getBoundingClientRect().top) : null, opv: window.__opv(), foco: a && a !== document.body ? { tag: a.tagName.toLowerCase(), naTela: ar.top >= document.querySelector(".cab").getBoundingClientRect().bottom - 1 && ar.bottom <= innerHeight } : "body" }); if (performance.now() - t0 < 1500) requestAnimationFrame(f); }; window.__ini = () => requestAnimationFrame(f); });
      await p.evaluate(() => { history.back(); window.__ini(); });
      await p.waitForTimeout(1700);
      const q = await p.evaluate(() => window.__q);
      const ativos = q.filter((x) => x.palco === "ativo");
      r[modo] = { antes, final: q.at(-1), palcoTops: [...new Set(ativos.map((x) => x.palcoTop))], ys: [...new Set(q.map((x) => x.y))], caps: [...new Set(q.map((x) => x.cap))], minOpv: Math.min(...q.map((x) => x.opv ?? 1)) };
      await ctx.close();
    }
    const soCap = (m) => r[m].caps.filter(Boolean);
    ok("atlas", "voltar à Home com o palco fixo: durante a entrada o palco não se desloca (mesma posição que a navegação atual), rolagem igual à de saída, capítulo da saída em todos os quadros (sem passar por Model) nos dois modos, foco na tela", JSON.stringify(r.candidata.palcoTops) === JSON.stringify(r.atual.palcoTops) && ["atual", "candidata"].every((m) => r[m].final.y === r[m].antes.y && soCap(m).length === 1 && soCap(m)[0] === r[m].antes.cap) && (r.candidata.final.foco === "body" || r.candidata.final.foco.naTela) && r.candidata.minOpv < 0.99, r);
  }

  // ---- 15. montanha candidata × estável (só revisão privada)
  {
    const { ctx, p } = await nova();
    const pedidos = []; p.on("request", (q) => { const u = q.url(); if (/home-montanha/.test(u)) pedidos.push(u.replace(BASE, "")); });
    await ir(p, "/pt?montanha=candidata&transicao=candidata", 2500);
    const c = await p.evaluate(() => { const cv = document.querySelector("[data-hero] canvas"); return { versao: document.querySelector("[data-hero]").dataset.montanhaVersao, ambient: cv?.dataset.ambientConfig ?? null, canvas: document.querySelectorAll("[data-hero] canvas").length, poster: document.querySelector("[data-hero] img")?.currentSrc?.replace(location.origin, "") }; });
    const modulo = await (await p.request.get(BASE + "/previa/home-montanha-1.3.1-03d2-candidato/web/home-sculpture.js")).body();
    const { createHash } = await import("node:crypto");
    const sha = createHash("sha256").update(modulo).digest("hex");
    ok("montanha", "candidata: 1.3.1-03d2-candidato (repouso de 5 s), luz 'passagem:recomendado', módulo servido = 014e0257…0a25, posters da estável", c.versao === "1.3.1-03d2-candidato" && c.ambient === "passagem:recomendado" && sha === "014e0257dc8df118ec57f3da419d3d243b66d73e71560284917fce24386c0a25" && /home-montanha-1\.2\.1-03d2\/assets\//.test(c.poster || "") && pedidos.filter((u) => /1\.3\.[01]/.test(u)).every((u) => /1\.3\.1-03d2-candidato\/web\/home-sculpture\.js/.test(u)), { ...c, sha: sha.slice(0, 16), pedidos13: pedidos.filter((u) => /1\.3\.[01]/.test(u)) });
    // candidata anterior (1.3.0) para a comparação do repouso: mesma luz, mesmo enquadramento, só o módulo muda
    {
      const ped = []; const on = (q) => { const u = q.url(); if (/home-montanha-1\.3/.test(u)) ped.push(u.replace(BASE, "")); }; p.on("request", on);
      await ir(p, "/pt?montanha=anterior&transicao=candidata", 2500);
      const a = await p.evaluate(() => { const cv = document.querySelector("[data-hero] canvas"); return { versao: document.querySelector("[data-hero]").dataset.montanhaVersao, ambient: cv?.dataset.ambientConfig ?? null, poster: document.querySelector("[data-hero] img")?.currentSrc?.replace(location.origin, "") }; });
      const shaA = createHash("sha256").update(await (await p.request.get(BASE + "/previa/home-montanha-1.3.0-03d2-candidato/web/home-sculpture.js")).body()).digest("hex");
      p.off("request", on);
      ok("montanha", "anterior: 1.3.0-03d2-candidato (comparação), mesma luz e posters, módulo servido = 1ef10fb2…447ff6", a.versao === "1.3.0-03d2-candidato" && a.ambient === "passagem:recomendado" && shaA === "1ef10fb2659ff48196e2d39341568fa379b8bfdc5028dca9eb2e03d961447ff6" && /home-montanha-1\.2\.1-03d2\/assets\//.test(a.poster || "") && ped.every((u) => /1\.3\.0-03d2-candidato\/web\/home-sculpture\.js/.test(u)), { ...a, sha: shaA.slice(0, 16), ped });
      await ir(p, "/pt?montanha=candidata&transicao=candidata", 1500);
    }
    // escolha guardada: volta à Home pela navegação continua na candidata; abertura não se repete
    await navegar(p, 'header .nav a[href="/pt/plataforma"]');
    const t0 = Date.now(); await navegar(p, "header a.marca");
    const ret = await p.evaluate(async () => {
      const t0 = performance.now(); let primeira = null, intro = null;
      while (performance.now() - t0 < 4000) {
        await new Promise((r) => setTimeout(r, 50));
        const d = window.__montanha?._debug?.(); const a = d?.ambient;
        if (intro === null && d) intro = d.intro ?? d.introducao ?? null;
        if (primeira === null && a?.passagem && a.passagem.u > 0) primeira = Math.round(performance.now() - t0);
      }
      return { versao: document.querySelector("[data-hero]").dataset.montanhaVersao, primeira, intro: typeof intro === "object" ? JSON.stringify(intro).slice(0, 80) : intro, chave: sessionStorage.getItem("ararat:montanha-institucional") };
    });
    ok("montanha", "volta à Home (candidata guardada): mesma versão, 1ª passagem de luz bem depois dos 180 ms da entrada", ret.versao === "1.3.1-03d2-candidato" && ret.primeira !== null && ret.primeira > 400, ret);
    // estável no mesmo enquadramento
    await ir(p, "/pt?montanha=estavel", 1500);
    const e = await p.evaluate(() => { const cv = document.querySelector("[data-hero] canvas"); return { versao: document.querySelector("[data-hero]").dataset.montanhaVersao, ambient: cv?.dataset.ambientConfig ?? null, rect: (() => { const r = document.querySelector("[data-hero] [data-arte]").getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })() }; });
    await ir(p, "/pt?montanha=candidata", 1500);
    const c2 = await p.evaluate(() => { const r = document.querySelector("[data-hero] [data-arte]").getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; });
    ok("montanha", "estável × candidata no mesmo enquadramento (mesma caixa da arte); estável continua 'enabled'", e.versao === "1.2.1-03d2" && JSON.stringify(e.rect) === JSON.stringify(c2), { estavel: e, candidataRect: c2 });
    await ctx.close();
  }
  // estados da candidata: pausa, reduzido, aba oculta, saída da Home
  {
    const contar = (p, ms) => p.evaluate(async (ms) => { let n = 0; const o = window.requestAnimationFrame; window.requestAnimationFrame = (f) => { n++; return o(f); }; await new Promise((r) => setTimeout(r, ms)); window.requestAnimationFrame = o; return n; }, ms);
    const { ctx, p } = await nova();
    await ir(p, "/pt?montanha=candidata", 2600);
    await p.evaluate(() => window.ARARAT_MOVIMENTO?.definir?.(true)); await p.waitForTimeout(200);
    const pausa = await contar(p, 1500);
    await p.evaluate(() => window.ARARAT_MOVIMENTO?.definir?.(false));
    await p.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
    await p.waitForTimeout(200); const oculta = await contar(p, 1500);
    await p.evaluate(() => { delete document.visibilityState; delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
    await ctx.close();
    const r2 = await nova({ reducedMotion: "reduce" });
    await ir(r2.p, "/pt?montanha=candidata", 2600);
    const red = await contar(r2.p, 2500);
    const cfg = await r2.p.evaluate(() => document.querySelector("[data-hero]").dataset.montanha);
    await r2.ctx.close();
    ok("montanha", "candidata: pausa, aba oculta (simulada) e movimento reduzido sem quadros da montanha", pausa <= 2 && oculta <= 2 && red <= 2, { rafPausa: pausa, rafOculta: oculta, rafReduzido: red, modoReduzido: cfg });
  }
  // ---- quadros para o relatório (animações a 1/10 da velocidade)
  if (QUADROS) {
    mkdirSync(QUADROS, { recursive: true });
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const { ctx, p } = await nova({ viewport: { width: w, height: h } });
      await ir(p, "/pt/solucoes?transicao=candidata", 500);
      const cdp = await ctx.newCDPSession(p); await cdp.send("Animation.enable"); await cdp.send("Animation.setPlaybackRate", { playbackRate: 0.1 });
      await p.click('header .nav a[href="/pt/pesquisa"], .menu-d a[href="/pt/pesquisa"]', { force: true }).catch(async () => { await p.evaluate(() => document.querySelector('a[href="/pt/pesquisa"]').click()); });
      const t0 = Date.now();
      for (let i = 0; i < 6; i++) { await p.waitForTimeout(300); await p.screenshot({ path: `${QUADROS}/entrada-${w}-q${i}-${Math.round((Date.now() - t0) / 10)}ms.png` }); }
      await ctx.close();
    }
  }
}

await b.close();
const falhas = res.filter((r) => !r.ok).length;
if (SAIDA) writeFileSync(SAIDA, JSON.stringify({ base: BASE, publico: PUBLICO, data: new Date().toISOString(), total: res.length, falhas, res }, null, 2));
console.log(`\n${res.length} verificações, ${falhas} falhas`);
process.exit(falhas ? 1 : 0);
