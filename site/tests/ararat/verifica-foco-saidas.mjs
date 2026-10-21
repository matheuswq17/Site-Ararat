#!/usr/bin/env node
/**
 * Foco no cabeçalho e geometria do bloco de saídas — fechamento da navegação, 15/10/2026.
 *   node tests/ararat/verifica-foco-saidas.mjs http://127.0.0.1:PORTA [saida.json] [--publico]
 * 1. Foco num controle do cabeçalho (Tab/Shift+Tab, menu do celular, Esc) não move a página; foco visível; âncoras
 *    pousam abaixo do cabeçalho; pular para o conteúdo; PT, ES e EN.
 * 2. Bloco de saídas: com JS, a geometria antes de o módulo montar é a do módulo montado (celular, desktop baixo e
 *    palco); sem JS, com falha e passado o prazo, as duas figuras ficam em sequência; a volta pelo histórico fora do
 *    palco termina na posição de saída (antes do foco/clique, antes da troca de rota, 1ª apresentação, depois de montar).
 * Na variante pública (--publico) não há mídia: o grupo 2 confere só que o bloco textual não muda.
 * Chromium headless, sem GPU.
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://127.0.0.1:3101").replace(/\/$/, "");
const SAIDA = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : null;
const PUBLICO = process.argv.includes("--publico");
const res = [];
const ok = (grupo, nome, passou, det = {}) => { res.push({ grupo, nome, ok: !!passou, ...det }); console.log(`${passou ? "ok  " : "FALHA"} [${grupo}] ${nome}${Object.keys(det).length ? " " + JSON.stringify(det).slice(0, 300) : ""}`); };
const b = await chromium.launch();
const nova = async (w, h, o = {}) => {
  const { movel, rotas, ...ctxo } = o;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, ...(movel ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}), ...ctxo });
  if (rotas) await rotas(ctx);
  const p = await ctx.newPage(); p.__erros = []; p.on("pageerror", (e) => p.__erros.push(e.message));
  return { ctx, p };
};
const y = (p) => p.evaluate(() => Math.round(scrollY));
const ir = async (p, u, t = 700) => { await p.goto(BASE + u, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(t); };
const PLAT = { pt: "/pt/plataforma", es: "/es/plataforma", en: "/platform" };
const HOME = { pt: "/pt", es: "/es", en: "/" };

// ---- 1a. o caso reproduzido no Windows: Plataforma 1440×900, foco no H1, roda até 3427, Shift+Tab (PT, ES, EN)
for (const l of ["pt", "es", "en"]) {
  const { ctx, p } = await nova(1440, 900);
  await ir(p, PLAT[l]);
  await p.evaluate(() => { const h = document.querySelector("#conteudo h1"); h.tabIndex = -1; h.focus(); });
  const alvo = await p.evaluate(() => Math.min(3427, document.documentElement.scrollHeight - innerHeight - 10)); // a pública é mais curta
  await p.mouse.move(700, 450); for (let i = 0; i < 80 && (await y(p)) < alvo; i++) { await p.mouse.wheel(0, 200); await p.waitForTimeout(40); }
  await p.evaluate((v) => scrollTo(0, v), alvo); await p.waitForTimeout(200);
  const y0 = await y(p);
  await p.keyboard.press("Shift+Tab"); await p.waitForTimeout(300);
  const r = await p.evaluate(() => { const a = document.activeElement; const c = getComputedStyle(a); return { y: Math.round(scrollY), foco: a.textContent.trim().slice(0, 10), noCab: !!a.closest(".cab"), contorno: c.outlineStyle !== "none" && parseFloat(c.outlineWidth) > 0, focoVisivel: a.matches(":focus-visible") }; });
  ok("cabecalho", `${l.toUpperCase()}: Plataforma 1440×900, rolada (roda) até ${y0}, Shift+Tab até o cabeçalho — a página não se move; foco visível`, r.y === y0 && r.noCab && r.focoVisivel && r.contorno, { y0, ...r });
  // Tab por todos os controles do cabeçalho com a página no meio
  await p.evaluate(() => scrollTo(0, 2500)); await p.waitForTimeout(150);
  await p.evaluate(() => document.querySelector(".cab a").focus({ preventScroll: true }));
  const ys = [];
  for (let i = 0; i < 12; i++) { const noCab = await p.evaluate(() => !!document.activeElement.closest(".cab")); if (!noCab) break; ys.push(await y(p)); await p.keyboard.press("Tab"); await p.waitForTimeout(60); }
  const fora = await p.evaluate(() => { const a = document.activeElement, r = a.getBoundingClientRect(), cab = document.querySelector(".cab").getBoundingClientRect(); return { tag: a.tagName, topo: Math.round(r.top), abaixoDoCab: r.top >= cab.bottom - 1 && r.bottom <= innerHeight }; });
  ok("cabecalho", `${l.toUpperCase()}: Tab por todos os controles do cabeçalho com a página em 2500 — nenhum move a página; o 1º controle do conteúdo aparece abaixo do cabeçalho`, ys.length >= 5 && ys.every((v) => v === 2500) && fora.abaixoDoCab, { ys, fora });
  await ctx.close();
}

// ---- 1b. menu do celular/tablet: teclado (Enter, Tab, Esc devolve o foco), toque, clique de mouse; foco não move
for (const [w, h, movel] of [[390, 844, true], [820, 1180, true]]) for (const l of ["pt", "es", "en"]) {
  const { ctx, p } = await nova(w, h, { movel });
  await ir(p, HOME[l]);
  await p.evaluate(() => scrollTo(0, 3376)); await p.waitForTimeout(200);
  const ae = () => p.evaluate(() => { const a = document.activeElement; return { cls: a.className, href: a.getAttribute("href"), noPainel: !!a.closest(".painel-menu"), naNav: !!a.closest(".painel-menu nav") }; });
  const r = { ini: await y(p) };
  await p.focus(".menu-btn"); r.foco = await y(p);
  await p.keyboard.press("Enter"); await p.waitForTimeout(250); r.aberto = await y(p); r.focoAoAbrir = await ae();
  await p.keyboard.press("Tab"); await p.waitForTimeout(80); r.tab = await y(p);
  await p.keyboard.press("Escape"); await p.waitForTimeout(250); r.esc = await y(p); r.focoAposEsc = (await ae()).cls; r.fechou = !(await p.evaluate(() => document.querySelector("[data-menu]").open));
  await p.tap(".menu-btn"); await p.waitForTimeout(250); r.toque = await y(p);
  await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  const k = await p.evaluate(() => { const r = document.querySelector(".menu-btn").getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await p.mouse.click(k[0], k[1]); await p.waitForTimeout(250); r.mouse = await y(p);
  // Tab depois do último item fecha o menu (o painel cobre a página)
  const n = await p.evaluate(() => document.querySelectorAll(".painel-menu a").length);
  await p.evaluate(() => { const a = [...document.querySelectorAll(".painel-menu a")].at(-1); a.focus({ preventScroll: true }); });
  await p.keyboard.press("Tab"); await p.waitForTimeout(200);
  r.tabSaiFecha = !(await p.evaluate(() => document.querySelector("[data-menu]").open));
  const naNav = r.focoAoAbrir.naNav;
  ok("menu", `${w}×${h} ${l.toUpperCase()}: abrir pelo teclado, Tab, Esc (foco volta ao botão), toque e clique de mouse — a página fica em ${r.ini}; ao abrir, foco na navegação; Tab depois do último item fecha o menu`,
    [r.foco, r.aberto, r.tab, r.esc, r.toque, r.mouse].every((v) => v === r.ini) && r.focoAposEsc.includes("menu-btn") && r.fechou && naNav && r.tabSaiFecha && n > 0, r);
  await ctx.close();
}

// ---- 1c. âncoras pousam abaixo do cabeçalho; pular para o conteúdo
{
  const { ctx, p } = await nova(1440, 900);
  const r = [];
  // 3 cargas de cada (a Home tem o palco, que monta depois de o navegador posicionar a âncora: corrida de tempo)
  for (const u of ["/pt/plataforma#adocao", "/es/plataforma#adocao", "/platform#adocao", "/pt/pesquisa#fichas", ...["/pt#evidencia", "/es#evidencia", "/#evidencia", "/pt#cap-hub"].flatMap((x) => [x, x, x])]) {
    await ir(p, u, 900);
    r.push(await p.evaluate((u) => { const t = document.getElementById(location.hash.slice(1)); const cab = document.querySelector(".cab").getBoundingClientRect().bottom; if (!t) return { u, sem: true }; const top = Math.round(t.getBoundingClientRect().top); return { u, top, cab: Math.round(cab), ok: top >= cab - 1 && top <= cab + 100 }; }, u));
  }
  ok("ancoras", "âncoras (PT, ES, EN; Home 3× cada) pousam logo abaixo do cabeçalho (até 100 px, que inclui a margem dos capítulos)", r.every((x) => x.sem || x.ok) && r.filter((x) => !x.sem).length >= 12, { r: r.map((x) => x.u + "=" + x.top) });
  await ir(p, "/pt/plataforma", 400);
  await p.keyboard.press("Tab"); const pul = await p.evaluate(() => [document.activeElement.className, Math.round(document.activeElement.getBoundingClientRect().top)]);
  await p.keyboard.press("Enter"); await p.waitForTimeout(300); await p.keyboard.press("Tab"); await p.waitForTimeout(100);
  const depois = await p.evaluate(() => { const a = document.activeElement; return { hash: location.hash, noConteudo: !!a.closest("#conteudo"), noCab: !!a.closest(".cab") }; });
  ok("ancoras", "pular para o conteúdo: 1º Tab mostra o link; Enter leva a #conteudo e o Tab seguinte já está no conteúdo, não no cabeçalho", pul[0].includes("pular") && pul[1] >= 0 && depois.hash === "#conteudo" && depois.noConteudo && !depois.noCab, { pul, depois });
  await ctx.close();
}

// ---- 2. bloco de saídas
const medir = (p) => p.evaluate(() => { const m = document.querySelector("main [data-saidas], main .midia-texto"); if (!m) return null; const r = (s) => [...m.querySelectorAll(s)].filter((e) => e.getBoundingClientRect().height > 0).length; return { modo: m.dataset.saidasModo || (m.matches(".midia-texto") ? "texto" : "pendente"), h: Math.round(m.getBoundingClientRect().height), figurasVisiveis: r(".camada"), abasVisiveis: m.querySelector(".abas") ? getComputedStyle(m.querySelector(".abas")).visibility : null }; });
if (PUBLICO) {
  const { ctx, p } = await nova(390, 844, { movel: true });
  const pedidos = []; p.on("request", (r) => { if (/saidas-caso/.test(r.url())) pedidos.push(r.url()); });
  await ir(p, "/pt", 1200);
  const a = await p.evaluate(() => ({ saidas: document.querySelectorAll("[data-saidas], [data-saidas-host], .camada").length, caso: !!document.querySelector("main") }));
  ok("saidas", "pública: composição sem capturas — sem bloco de saídas, sem módulo pedido", a.saidas === 0 && a.caso && pedidos.length === 0, { ...a, pedidos });
  await ctx.close();
} else {
  for (const [w, h, movel] of [[390, 844, true], [1280, 700, false], [1440, 900, false]]) {
    const est = {};
    for (const modo of ["pendente", "montado", "falha", "semjs", "prazo"]) {
      const { ctx, p } = await nova(w, h, { movel, javaScriptEnabled: modo !== "semjs", rotas: (c) => modo === "pendente" || modo === "prazo" ? c.route("**/saidas-caso.js", () => {}) : modo === "falha" ? c.route("**/saidas-caso.js", (r) => r.abort()) : null });
      await ir(p, "/pt", modo === "prazo" ? 4800 : 1500);
      est[modo] = await medir(p);
      await ctx.close();
    }
    ok("saidas", `${w}×${h}: módulo pendente com a MESMA altura do montado (1 figura, abas reservadas); sem JS, falha e prazo de 4 s com as duas figuras`,
      est.pendente.h === est.montado.h && est.pendente.figurasVisiveis === 1 && est.pendente.abasVisiveis === "hidden" && est.montado.modo === "modulo"
      && [est.falha, est.semjs, est.prazo].every((x) => x.figurasVisiveis === 2) && est.falha.modo === "estatico" && est.prazo.modo === "estatico", est);
  }
  // módulo que chega DEPOIS do prazo é ignorado (a geometria muda no máximo uma vez)
  {
    const { ctx, p } = await nova(390, 844, { movel: true, rotas: (c) => c.route("**/saidas-caso.js", async (r) => { await new Promise((s) => setTimeout(s, 5500)); await r.continue(); }) });
    await ir(p, "/pt", 6500); const a = await medir(p);
    ok("saidas", "módulo que responde depois do prazo (5,5 s): fica no modo estático, sem trocar a geometria de novo", a.modo === "estatico" && a.figurasVisiveis === 2 && p.__erros.length === 0, { ...a, erros: p.__erros });
    await ctx.close();
  }
  // volta pelo histórico fora do palco: 4 momentos
  const casos = [
    ["390×844 menu por toque", 390, 844, true, 3376, "toque"], ["390×844 menu por clique de mouse", 390, 844, false, 3376, "mouse-menu"],
    ["390×844 menu pelo teclado", 390, 844, true, 3376, "teclado-menu"], ["1280×700 cabeçalho por clique de mouse", 1280, 700, false, 2368, "mouse-cab"],
    ["1280×700 cabeçalho pelo teclado", 1280, 700, false, 2368, "teclado-cab"],
  ];
  for (const [nome, w, h, movel, y0alvo, sair] of casos) {
    const { ctx, p } = await nova(w, h, { movel });
    await ctx.addInitScript(() => { window.__m = {}; const ps = history.pushState.bind(history); history.pushState = (...a) => { if (!("push" in window.__m)) window.__m.push = Math.round(scrollY); return ps(...a); }; });
    await ir(p, "/pt", 1200);
    await p.evaluate((v) => scrollTo(0, v), y0alvo); await p.waitForTimeout(300);
    const y0 = await y(p);
    const xy = (s) => p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, s);
    let yFoco = y0;
    if (sair === "toque") { await p.tap(".menu-btn"); await p.waitForTimeout(250); yFoco = await y(p); await p.tap('.painel-menu a[href="/pt/plataforma"]'); }
    if (sair === "mouse-menu") { const k = await xy(".menu-btn"); await p.mouse.click(k[0], k[1]); await p.waitForTimeout(250); yFoco = await y(p); const l = await xy('.painel-menu a[href="/pt/plataforma"]'); await p.mouse.click(l[0], l[1]); }
    if (sair === "teclado-menu") {
      await p.focus(".menu-btn"); await p.keyboard.press("Enter"); await p.waitForTimeout(250); yFoco = await y(p);
      for (let i = 0; i < 8 && !(await p.evaluate(() => document.activeElement?.getAttribute("href") === "/pt/plataforma")); i++) await p.keyboard.press("Tab");
      if (!(await p.evaluate(() => document.activeElement?.getAttribute("href") === "/pt/plataforma"))) { ok("volta", `${nome}: Plataforma não alcançada pelo Tab dentro do menu`, false, { y0_antes: y0, y_focoOuMenu: yFoco, foco: await p.evaluate(() => document.activeElement?.textContent.trim().slice(0, 30)) }); await ctx.close(); continue; }
      await p.keyboard.press("Enter");
    }
    if (sair === "mouse-cab") { const k = await xy('header .nav a[href="/pt/plataforma"]'); await p.mouse.click(k[0], k[1]); }
    if (sair === "teclado-cab") { await p.focus('header .nav a[href="/pt/plataforma"]'); yFoco = await y(p); await p.keyboard.press("Enter"); }
    await p.waitForURL("**/pt/plataforma"); await p.waitForTimeout(700);
    const push = await p.evaluate(() => window.__m.push);
    await p.evaluate(() => { window.__q = []; const t0 = performance.now(); const f = () => { const s = document.querySelector("main [data-saidas]"); window.__q.push({ t: Math.round(performance.now() - t0), home: location.pathname === "/pt", y: Math.round(scrollY), modo: s ? s.dataset.saidasModo || "pendente" : null }); if (performance.now() - t0 < 2500) requestAnimationFrame(f); }; history.back(); requestAnimationFrame(f); });
    await p.waitForTimeout(2700);
    const q = (await p.evaluate(() => window.__q)).filter((x) => x.home);
    const r = { y0_antes: y0, y_focoOuMenu: yFoco, y1_trocaDeRota: push, y2_primeiraApresentacao: q[0]?.y, modo2: q[0]?.modo, y3_depoisDeMontar: q.find((x) => x.modo === "modulo") ? q.at(-1).y : null, ysPorQuadro: [...new Set(q.map((x) => x.y))] };
    ok("volta", `${nome}: posição igual nos 4 momentos (antes do foco/clique, troca de rota, 1ª apresentação da volta, depois de montar)`, [r.y_focoOuMenu, r.y1_trocaDeRota, r.y2_primeiraApresentacao, r.y3_depoisDeMontar].every((v) => v === y0) && r.ysPorQuadro.length === 1, r);
    await ctx.close();
  }
}

await b.close();
const falhas = res.filter((r) => !r.ok).length;
console.log(`\n${res.length} verificações, ${falhas} falhas`);
if (SAIDA) writeFileSync(SAIDA, JSON.stringify({ base: BASE, publico: PUBLICO, data: new Date().toISOString(), total: res.length, falhas, res }, null, 1));
process.exit(falhas ? 1 : 0);
