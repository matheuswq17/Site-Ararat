#!/usr/bin/env node
/**
 * Palco do caso (Model · Hub · Viewer) na volta pelo histórico — rodada de fechamento do movimento, 14/10/2026.
 *   node tests/ararat/verifica-palco-retorno.mjs http://127.0.0.1:PORTA [saida.json]
 * Revisão privada (o palco precisa da mídia). Critério: capítulo, mídia, indicador e legenda certos desde o primeiro
 * quadro visível da Home, sem passagem por Model; preservados a espera de 120 ms da rolagem normal, a seleção manual,
 * as âncoras, a pausa e o movimento reduzido; montagem lenta/falha do módulo, navegação rápida, resize e desmonte.
 * Saída da Home por CLIQUE REAL DE MOUSE no cabeçalho: o clique do Playwright por seletor move a página antes de clicar
 * (ver tests/ararat/LEIAME-PALCO-RETORNO.md), o que não representa o visitante.
 * Chromium headless, sem GPU: quadros = callbacks de requestAnimationFrame (estado antes da pintura).
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://127.0.0.1:3101").replace(/\/$/, "");
const SAIDA = process.argv[3] || null;
const res = [];
const ok = (grupo, nome, passou, det = {}) => { res.push({ grupo, nome, ok: !!passou, ...det }); console.log(`${passou ? "ok  " : "FALHA"} [${grupo}] ${nome}${Object.keys(det).length ? " " + JSON.stringify(det).slice(0, 300) : ""}`); };
const b = await chromium.launch();
const MODULO = "**/ararat/pacotes/motion-portfolio-07d5483/saidas-caso.js";

// estado do palco por quadro (rAF), injetado em todas as páginas
const SONDA = () => {
  const capDe = (m) => (m.querySelector("#v-fila") ? "hub" : m.querySelector("#v-planos") ? "viewer" : "model");
  window.__estado = () => {
    const g = document.querySelector("[data-atlas]");
    if (!g) return { home: false, path: location.pathname, y: Math.round(scrollY) };
    const ms = [...document.querySelectorAll(".palco-midia > .cap-midia")];
    const vis = ms.filter((m) => { const c = getComputedStyle(m); return c.visibility === "visible" && +c.opacity > 0; });
    return {
      home: true, path: location.pathname, y: Math.round(scrollY), palco: g.dataset.palco || null, cap: g.dataset.capAtivo || null,
      indicador: document.querySelector(".cap-nav a[aria-current]")?.dataset.cap || null,
      midias: vis.map((m) => capDe(m) + ":" + (+getComputedStyle(m).opacity).toFixed(2)),
      legenda: vis.map((m) => capDe(m) + ":" + ((m.querySelector(".legenda-palco") ? "sim" : "nao"))),
      transicao: vis.map((m) => m.style.transition || ""),
      // o indicador PINTADO (não só aria-current): fundo, borda e cor calculados de cada link da navegação do caso
      pintado: [...document.querySelectorAll(".cap-nav a[data-cap]")].map((a) => { const c = getComputedStyle(a); return a.dataset.cap + ":" + c.backgroundColor + "/" + c.borderTopColor + "/" + c.color; }),
    };
  };
  window.__gravar = (ms = 1400) => { window.__q = []; const t0 = performance.now(); const f = () => { window.__q.push({ t: Math.round(performance.now() - t0), ...window.__estado() }); if (performance.now() - t0 < ms) requestAnimationFrame(f); }; requestAnimationFrame(f); };
};
const nova = async (o = {}) => {
  const { rotas, ...ctxo } = o;
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...ctxo });
  await ctx.addInitScript(SONDA);
  if (rotas) await rotas(ctx);
  const p = await ctx.newPage(); p.__erros = [];
  p.on("pageerror", (e) => p.__erros.push(e.message));
  return { ctx, p };
};
const ir = async (p, url, espera = 900) => { await p.goto(BASE + url, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(espera); };
const estado = (p) => p.evaluate(() => window.__estado());
const rodaAte = async (p, cap, vp) => {
  await p.mouse.move(vp[0] / 2, vp[1] / 2);
  for (let i = 0; i < 90; i++) { if ((await estado(p)).cap === cap) break; await p.mouse.wheel(0, 120); await p.waitForTimeout(140); }
  await p.waitForTimeout(700);
};
const sairPeloCabecalho = async (p, href = "/pt/plataforma") => {
  const c = await p.evaluate((h) => { const r = document.querySelector(`header .nav a[href="${h}"]`).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, href);
  await p.mouse.click(c[0], c[1]); await p.waitForURL("**" + href); await p.waitForTimeout(600);
};
const voltar = async (p, ms = 1400) => { await p.evaluate((ms) => { history.back(); window.__gravar(ms); }, ms); await p.waitForTimeout(ms + 200); return p.evaluate(() => window.__q); };
const avancar = async (p, ms = 1400) => { await p.evaluate((ms) => { history.forward(); window.__gravar(ms); }, ms); await p.waitForTimeout(ms + 200); return p.evaluate(() => window.__q); };
// quadros da Home com o palco ativo: tudo coerente com o capítulo esperado desde o primeiro
const coerente = (q, cap) => {
  const h = q.filter((x) => x.home && x.palco === "ativo");
  const errados = h.filter((x) => x.cap !== cap || x.indicador !== cap || x.midias.length !== 1 || x.midias[0] !== cap + ":1.00" || x.legenda[0] !== cap + ":sim");
  // indicador pintado: em todo quadro, igual ao estado assentado (último quadro) — sem os 120 ms de transição dos links
  const fimPint = JSON.stringify(h.at(-1)?.pintado);
  const pintadoErrado = h.filter((x) => JSON.stringify(x.pintado) !== fimPint).length;
  if (pintadoErrado) errados.push(...Array(pintadoErrado).fill(0));
  return { quadros: h.length, errados: errados.length, pintadoErrado, primeiro: h[0], caps: [...new Set(h.map((x) => x.cap))], midias: [...new Set(h.map((x) => x.midias.join("+")))], passouPorModel: h.some((x) => x.cap === "model" || x.midias.some((m) => m.startsWith("model"))) };
};

// ---- 1. voltar a Hub e Viewer: transição atual e candidata, 1440×900 e 1280×900, roda do mouse e rolagem direta
for (const [w, h] of [[1440, 900], [1280, 900]]) {
  for (const modo of ["atual", "candidata"]) {
    for (const cap of ["hub", "viewer"]) {
      const { ctx, p } = await nova({ viewport: { width: w, height: h } });
      await ir(p, `/pt?transicao=${modo}`);
      await rodaAte(p, cap, [w, h]);
      const saida = await estado(p);
      await sairPeloCabecalho(p);
      const q = await voltar(p);
      const c = coerente(q, cap);
      ok("historico", `${w}×${h} ${modo}: voltar a ${cap} — capítulo, mídia, indicador e legenda certos desde o 1º quadro, sem passar por Model; rolagem igual à de saída`, saida.cap === cap && c.quadros > 10 && c.errados === 0 && !c.passouPorModel && q.at(-1).y === saida.y && p.__erros.length === 0, { saidaY: saida.y, voltaY: q.at(-1).y, ...c, erros: p.__erros });
      await ctx.close();
    }
  }
}
{ // rolagem direta (scrollTo) e saída por outra página, 1440
  const { ctx, p } = await nova();
  await ir(p, "/pt");
  await p.evaluate(() => document.getElementById("cap-viewer").scrollIntoView({ block: "start" })); await p.waitForTimeout(800);
  const saida = await estado(p);
  await sairPeloCabecalho(p, "/pt/pesquisa");
  const q = await voltar(p); const c = coerente(q, saida.cap);
  ok("historico", "rolagem direta até Viewer, saída para Pesquisa e volta: capítulo certo desde o 1º quadro", saida.cap === "viewer" && c.errados === 0 && !c.passouPorModel && q.at(-1).y === saida.y, { saidaY: saida.y, ...c });
  await ctx.close();
}

// ---- 2. avançar até a Home (Plataforma → Home rolada no Viewer → voltar → avançar)
{
  const { ctx, p } = await nova();
  await ir(p, "/pt/plataforma");
  await p.evaluate(() => document.querySelector('header a[href="/pt"]').click()); await p.waitForURL(/\/pt$/); await p.waitForTimeout(900);
  await rodaAte(p, "viewer", [1440, 900]);
  const saida = await estado(p);
  await p.evaluate(() => history.back()); await p.waitForURL("**/pt/plataforma"); await p.waitForTimeout(700);
  const q = await avancar(p); const c = coerente(q, "viewer");
  ok("historico", "avançar até a Home rolada no Viewer: capítulo certo desde o 1º quadro", saida.cap === "viewer" && c.errados === 0 && !c.passouPorModel && q.at(-1).y === saida.y, { saidaY: saida.y, voltaY: q.at(-1).y, ...c });
  await ctx.close();
}

// ---- 3. rolagem normal mantém a espera de ~120 ms e a troca cruzada (carga direta e depois de uma volta)
const esperaNormal = async (p) => {
  // posiciona logo antes da faixa do Hub e mede quanto tempo o capítulo leva para trocar depois que entra na faixa
  return p.evaluate(async () => {
    const hub = document.getElementById("cap-hub"); const alvo = scrollY + hub.getBoundingClientRect().top - innerHeight * 0.5 + 10;
    const dentro = () => { const r = hub.getBoundingClientRect(); return r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4; };
    const g = document.querySelector("[data-atlas]");
    scrollTo(0, alvo - 200); await new Promise((r) => setTimeout(r, 500));
    const c0 = g.dataset.capAtivo; scrollTo(0, alvo); const t0 = performance.now();
    while (!dentro() && performance.now() - t0 < 500) await new Promise((r) => requestAnimationFrame(r));
    const tFaixa = performance.now();
    let tTroca = null, transicao = null;
    while (performance.now() - tFaixa < 800) { await new Promise((r) => requestAnimationFrame(r)); if (g.dataset.capAtivo !== c0) { tTroca = performance.now(); const m = document.querySelector(".palco-midia > .cap-midia[data-ativo]"); transicao = getComputedStyle(m).transitionDuration; break; } }
    return { de: c0, para: g.dataset.capAtivo, esperaMs: tTroca ? Math.round(tTroca - tFaixa) : null, transicao };
  });
};
{
  const { ctx, p } = await nova();
  await ir(p, "/pt");
  await p.mouse.move(700, 450); await p.mouse.wheel(0, 120); await p.waitForTimeout(300); // gesto do visitante
  const r = await esperaNormal(p);
  ok("normal", "carga direta: rolagem normal troca o capítulo só depois de ~120 ms na faixa, com a troca cruzada", r.para === "hub" && r.esperaMs >= 110 && r.transicao !== "0s", r);
  await ctx.close();
}
{
  const { ctx, p } = await nova();
  await ir(p, "/pt"); await rodaAte(p, "model", [1440, 900]);
  await p.evaluate(() => scrollTo(0, scrollY + 120)); await p.waitForTimeout(600);
  await sairPeloCabecalho(p); await voltar(p, 600);
  await p.mouse.move(700, 450); await p.mouse.wheel(0, 40); await p.waitForTimeout(400); // gesto encerra a restauração
  const r = await esperaNormal(p);
  ok("normal", "depois de voltar pelo histórico, o 1º gesto encerra a restauração: a rolagem normal volta a esperar ~120 ms, com troca cruzada", r.para === "hub" && r.esperaMs >= 110 && r.transicao !== "0s", r);
  await ctx.close();
}
{ // sem gesto: a janela de restauração termina sozinha (1,5 s) e a rolagem seguinte é normal
  const { ctx, p } = await nova();
  await ir(p, "/pt"); await rodaAte(p, "model", [1440, 900]);
  await sairPeloCabecalho(p); await voltar(p, 400);
  await p.waitForTimeout(1700);
  const r = await esperaNormal(p);
  ok("normal", "sem gesto, a restauração termina sozinha: rolagem posterior com espera de ~120 ms e troca cruzada", r.para === "hub" && r.esperaMs >= 110 && r.transicao !== "0s", r);
  await ctx.close();
}

// ---- 4. seleção manual e âncoras
{
  const { ctx, p } = await nova();
  await ir(p, "/pt"); await rodaAte(p, "hub", [1440, 900]);
  await sairPeloCabecalho(p); await voltar(p, 300);
  await p.click('.cap-nav a[data-cap="viewer"]');
  await p.evaluate(() => window.__gravar(1500)); await p.waitForTimeout(1700);
  const q = await p.evaluate(() => window.__q);
  const caps = [...new Set(q.map((x) => x.cap))];
  ok("manual", "logo depois da volta, seleção manual de Viewer na navegação do caso: troca na hora e não é desfeita pela restauração", caps.length === 1 && caps[0] === "viewer" && q.at(-1).indicador === "viewer", { caps, y: q.at(-1).y, url: await p.evaluate(() => location.hash) });
  await ctx.close();
}
// carga direta com âncora: o palco nasce no capítulo pedido, já visível (sem quadro vazio), e FICA nele (antes,
// /pt#cap-hub era reconciliado para Viewer porque a montagem do palco mudava a altura dos capítulos).
for (const cap of ["viewer", "hub"]) {
  const { ctx, p } = await nova();
  await p.addInitScript(() => addEventListener("DOMContentLoaded", () => window.__gravar(1500)));
  await ir(p, `/pt#cap-${cap}`, 1600);
  const q = await p.evaluate(() => window.__q).then((q) => q.filter((x) => x.palco === "ativo"));
  const p0 = q[0];
  const c = coerente(q, cap);
  ok("ancora", `carga direta em /pt#cap-${cap}: o palco nasce em ${cap}, já visível, com indicador (pintado) e legenda, e continua em ${cap}`, p0 && c.errados === 0 && c.caps.length === 1 && q.at(-1).cap === cap, { primeiro: p0, final: q.at(-1)?.cap, y: q.at(-1)?.y, caps: c.caps, pintadoErrado: c.pintadoErrado });
  await ctx.close();
}
{ // âncora antiga no endereço: seleção manual de Hub (#cap-hub), depois rolar até Viewer, sair e voltar
  const { ctx, p } = await nova();
  await ir(p, "/pt"); await rodaAte(p, "model", [1440, 900]);
  await p.click('.cap-nav a[data-cap="hub"]'); await p.waitForTimeout(1300);
  await rodaAte(p, "viewer", [1440, 900]);
  const saida = await estado(p); const hash = await p.evaluate(() => location.hash);
  await sairPeloCabecalho(p); const q = await voltar(p); const c = coerente(q, "viewer");
  // a rolagem do visitante para outro capítulo tira a âncora antiga do endereço; a volta respeita o contexto restaurado
  // (posição e capítulo de saída), não a âncora
  const fim = q.at(-1);
  ok("ancora", "seleção manual de Hub (#cap-hub) e depois rolagem até Viewer: a âncora antiga sai do endereço; a volta restaura a posição e o Viewer desde o 1º quadro", hash === "" && c.errados === 0 && !c.passouPorModel && fim.y === saida.y, { hash, saidaY: saida.y, voltaY: fim.y, ...c });
  await ctx.close();
}

// ---- 5. pausa e movimento reduzido
{
  const { ctx, p } = await nova({ reducedMotion: "reduce" });
  await ir(p, "/pt"); await rodaAte(p, "viewer", [1440, 900]);
  const saida = await estado(p);
  await sairPeloCabecalho(p); const q = await voltar(p); const c = coerente(q, "viewer");
  ok("estados", "movimento reduzido: volta ao Viewer com o capítulo certo desde o 1º quadro", c.errados === 0 && !c.passouPorModel && q.at(-1).y === saida.y, c);
  await ctx.close();
}
{
  const { ctx, p } = await nova();
  await ir(p, "/pt"); await p.evaluate(() => window.ARARAT_MOVIMENTO.definir(true)); await rodaAte(p, "hub", [1440, 900]);
  await sairPeloCabecalho(p); const q = await voltar(p); const c = coerente(q, "hub");
  const pausado = await p.evaluate(() => document.documentElement.dataset.movimento);
  ok("estados", "site pausado: volta ao Hub com o capítulo certo desde o 1º quadro; pausa mantida", pausado === "pausado" && c.errados === 0 && !c.passouPorModel, { pausado, ...c });
  await ctx.close();
}

// ---- 6. módulo de saídas lento e com falha
{
  const { ctx, p } = await nova({ rotas: (c) => c.route(MODULO, async (r) => { await new Promise((s) => setTimeout(s, 2500)); await r.continue(); }) });
  await ir(p, "/pt", 3200); await rodaAte(p, "hub", [1440, 900]);
  await sairPeloCabecalho(p); const q = await voltar(p, 1800); const c = coerente(q, "hub");
  ok("modulo", "módulo de saídas lento (2,5 s por pedido): volta ao Hub com o capítulo certo desde o 1º quadro, sem erros", c.errados === 0 && !c.passouPorModel && p.__erros.length === 0, { ...c, erros: p.__erros });
  await ctx.close();
}
{
  const { ctx, p } = await nova({ rotas: (c) => c.route(MODULO, (r) => r.abort()) });
  await ir(p, "/pt", 1500);
  await p.evaluate(() => document.getElementById("cap-viewer").scrollIntoView({ block: "start" })); await p.waitForTimeout(600);
  const y = await p.evaluate(() => Math.round(scrollY));
  await sairPeloCabecalho(p); const q = await voltar(p);
  const e = q.at(-1);
  // o palco monta e desmonta no 1º quadro em que a falha chega (comportamento anterior, igual no código de antes)
  const ativos = q.filter((x) => x.palco === "ativo").length;
  ok("modulo", "falha do módulo de saídas: termina sem palco (fluxo normal), volta na mesma rolagem, sem erros", e.palco === null && ativos <= 2 && e.y === y && p.__erros.length === 0, { y, final: e, quadrosComPalco: ativos, erros: p.__erros });
  await ctx.close();
}

// ---- 7. navegação rápida, desmonte e recarga
{
  const { ctx, p } = await nova();
  await ir(p, "/pt"); await rodaAte(p, "hub", [1440, 900]);
  await sairPeloCabecalho(p);
  for (let i = 0; i < 3; i++) { await p.evaluate(() => history.back()); await p.waitForTimeout(30 + i * 20); await p.evaluate(() => history.forward()); await p.waitForTimeout(30); }
  await p.evaluate(() => history.back()); await p.waitForTimeout(25);
  await p.evaluate(() => document.querySelector('header .nav a[href="/pt/pesquisa"]').click()); await p.waitForURL("**/pt/pesquisa"); await p.waitForTimeout(800);
  const fora = await estado(p);
  const q = await voltar(p); const c = coerente(q, "hub");
  ok("rapido", "voltar/avançar em sequência e sair da Home dentro da janela de restauração: nenhum erro, nada do palco fora da Home; a volta seguinte ainda mostra Hub desde o 1º quadro", !fora.home && p.__erros.length === 0 && c.errados === 0 && !c.passouPorModel, { fora, ...c, erros: p.__erros });
  await ctx.close();
}
{
  const { ctx, p } = await nova();
  await ir(p, "/pt"); await rodaAte(p, "viewer", [1440, 900]);
  const y = await p.evaluate(() => Math.round(scrollY));
  await p.evaluate(() => sessionStorage.setItem("__gravarNaCarga", "1"));
  await ctx.addInitScript(() => { if (sessionStorage.getItem("__gravarNaCarga") === "1") { sessionStorage.removeItem("__gravarNaCarga"); addEventListener("DOMContentLoaded", () => window.__gravar(1600)); } });
  await p.reload({ waitUntil: "load" }); await p.waitForTimeout(1800);
  const q = await p.evaluate(() => window.__q);
  const c = coerente(q, "viewer");
  ok("recarga", "recarga com a página no Viewer: o palco aparece em Viewer, sem passar por Model", c.quadros > 5 && c.errados === 0 && !c.passouPorModel && q.at(-1).y === y, { y, yFinal: q.at(-1).y, ...c });
  await ctx.close();
}

// ---- 8. resize: abaixo do limite do palco → acima (página no Hub) e de volta
{
  const { ctx, p } = await nova({ viewport: { width: 1000, height: 900 } });
  await ir(p, "/pt");
  await p.evaluate(() => document.getElementById("cap-hub").scrollIntoView({ block: "start" })); await p.waitForTimeout(500);
  const antes = await estado(p);
  await p.evaluate(() => window.__gravar(800)); await p.setViewportSize({ width: 1440, height: 900 }); await p.waitForTimeout(1000);
  const q = await p.evaluate(() => window.__q);
  const ativos = q.filter((x) => x.palco === "ativo");
  const caps = [...new Set(ativos.map((x) => x.cap))];
  await p.setViewportSize({ width: 1000, height: 900 }); await p.waitForTimeout(400);
  const depois = await estado(p);
  ok("resize", "janela cresce até o limite do palco com a página no Hub: o palco já monta no capítulo da faixa (sem Model); ao encolher, desmonta", antes.palco === null && ativos.length > 0 && caps.length === 1 && caps[0] === ativos.at(-1).cap && caps[0] !== "model" && depois.palco === null && p.__erros.length === 0, { antes: antes.palco, caps, depois: depois.palco, erros: p.__erros });
  await ctx.close();
}

// ---- 9. sem palco (desktop baixo e celular): a volta restaura a rolagem e não há palco
for (const [w, h] of [[1280, 700], [390, 844]]) {
  const { ctx, p } = await nova({ viewport: { width: w, height: h }, ...(w < 500 ? { deviceScaleFactor: 3, isMobile: true, hasTouch: true } : {}) });
  await ir(p, "/pt");
  await p.evaluate(() => document.getElementById("cap-hub").scrollIntoView({ block: "start" })); await p.waitForTimeout(600);
  const y = await p.evaluate(() => Math.round(scrollY));
  const clicou = await p.evaluate(() => {
    let a = document.querySelector('header .nav a[href="/pt/plataforma"]');
    if (!a || !a.getBoundingClientRect().width) { document.querySelector(".menu-btn")?.click(); a = document.querySelector('.painel-menu a[href="/pt/plataforma"]'); } // celular: pelo menu
    if (a) { a.click(); return true; } return false;
  });
  if (clicou) {
    await p.waitForURL("**/pt/plataforma");
    await p.waitForTimeout(600); const q = await voltar(p, 900);
    // registro: em 1280×700 a volta termina ~52 px abaixo da saída — no 1º quadro o bloco de saídas ainda está no modo
    // estático (mais alto) e encolhe quando o módulo monta. Anterior a esta rodada, igual no código de antes; fica
    // como pendência no relatório, não como aprovação.
    const ys = [...new Set(q.filter((x) => x.home).map((x) => x.y))];
    ok("sem-palco", `${w}×${h}: sem palco e sem erros na volta (diferença de rolagem registrada à parte)`, !q.some((x) => x.palco === "ativo") && p.__erros.length === 0, { ySaida: y, yFinal: q.at(-1).y, diferenca: q.at(-1).y - y, ysPorQuadro: ys });
  } else ok("sem-palco", `${w}×${h}: link para Plataforma não encontrado`, false, {});
  await ctx.close();
}

await b.close();
const falhas = res.filter((r) => !r.ok).length;
console.log(`\n${res.length} verificações, ${falhas} falhas`);
if (SAIDA) writeFileSync(SAIDA, JSON.stringify({ base: BASE, data: new Date().toISOString(), total: res.length, falhas, res }, null, 1));
process.exit(falhas ? 1 : 0);
