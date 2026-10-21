/**
 * Validação do institucional (institucional-site-v1). Chromium headless (Playwright), servidor de produção local.
 *   node tests/institucional.mjs [baseURL=http://localhost:3000] [saída.json]
 * Não é aprovação estética nem teste em navegador visível: registra o que é verificável por script.
 */
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:3000";
const SAIDA = process.argv[3] || null;
const res = [];
const ok = (nome, cond, info = "") => { res.push({ nome, ok: !!cond, info }); console.log(`${cond ? "ok  " : "FALHA"} ${nome}${info ? " — " + info : ""}`); };
const PAGINAS = [
  ["/", "en", "home"], ["/pt", "pt-BR", "home"], ["/platform", "en", "plataforma"], ["/pt/plataforma", "pt-BR", "plataforma"],
  ["/research", "en", "pesquisa"], ["/pt/pesquisa", "pt-BR", "pesquisa"], ["/company", "en", "empresa"], ["/pt/empresa", "pt-BR", "empresa"],
];
const EQUIV = { "/": "/pt", "/pt": "/", "/platform": "/pt/plataforma", "/pt/plataforma": "/platform", "/research": "/pt/pesquisa", "/pt/pesquisa": "/research", "/company": "/pt/empresa", "/pt/empresa": "/company" };
const TELAS = [[1920, 1080, 1], [1440, 900, 2], [1280, 600, 2], [768, 1024, 2], [390, 844, 3], [390, 640, 3], [320, 568, 2]];
const medidas = { slots: {}, palco: {}, teto: [], posters: {} };

const b = await chromium.launch();
async function pagina(opts = {}) {
  const c = await b.newContext({ viewport: { width: opts.w || 1440, height: opts.h || 900 }, deviceScaleFactor: opts.dpr || 1, javaScriptEnabled: opts.js !== false, reducedMotion: opts.reduzido ? "reduce" : "no-preference" });
  const p = await c.newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  return { c, p, erros };
}

/* 1 · rotas, idioma, título e navegação */
for (const [rota, lang, chave] of PAGINAS) {
  const { c, p, erros } = await pagina();
  const r = await p.goto(BASE + rota, { waitUntil: "networkidle" });
  const info = await p.evaluate(() => ({
    lang: document.querySelector("[data-inst]")?.getAttribute("lang"), htmlLang: document.documentElement.lang,
    h1: document.querySelectorAll("h1").length, title: document.title,
    nav: [...document.querySelectorAll("header nav a")].map((a) => [a.getAttribute("href"), a.getAttribute("aria-current")]),
    idioma: document.querySelector("header a[hreflang]")?.getAttribute("href"),
    pagina: document.querySelector("[data-inst]")?.getAttribute("data-pagina"),
    comparacao: [...document.querySelectorAll("footer a")].map((a) => a.getAttribute("href")).filter((h) => h?.startsWith("/previa")),
  }));
  ok(`rota ${rota}`, r.status() === 200 && info.lang === lang && info.h1 === 1 && info.pagina === chave && !erros.length, `${r.status()} lang=${info.lang}/${info.htmlLang} h1=${info.h1} erros=${erros.length}`);
  const atual = info.nav.filter(([, a]) => a === "page").map(([h]) => h);
  ok(`navegação ${rota}`, info.nav.length === 4 && atual.length === 1 && atual[0] === rota, JSON.stringify(info.nav));
  ok(`idioma equivalente ${rota}`, info.idioma === EQUIV[rota], `${info.idioma}`);
  ok(`link de comparação ${rota}`, info.comparacao.length === 1 && info.comparacao[0] === (lang === "en" ? "/previa/refinada/en" : "/previa/refinada"), info.comparacao.join());
  await c.close();
}

/* 2 · todos os links internos e âncoras */
{
  const { c, p } = await pagina();
  const vistos = new Set();
  const falhas = [];
  for (const [rota] of PAGINAS) {
    await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
    const hrefs = await p.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")));
    for (const h of hrefs) {
      if (h.startsWith("#")) { const existe = await p.evaluate((id) => !!document.getElementById(id), h.slice(1)); if (!existe) falhas.push(`${rota} ${h}`); continue; }
      if (!h.startsWith("/")) continue;
      const [cam, ancora] = h.split("#");
      if (!vistos.has(cam)) { vistos.add(cam); const r = await p.request.get(BASE + cam); if (r.status() !== 200) falhas.push(`${rota} → ${cam} ${r.status()}`); }
      if (ancora) { const html = await (await p.request.get(BASE + cam)).text(); if (!html.includes(`id="${ancora}"`)) falhas.push(`${rota} → ${h} (âncora)`); }
    }
  }
  ok("links internos e âncoras", !falhas.length, `${vistos.size} destinos; ${falhas.join(" | ")}`);
  for (const id of ["matheus", "miguel", "rodrigo", "hartmann", "victor"]) {
    const e = await p.request.get(`${BASE}/company/team/${id}`), q = await p.request.get(`${BASE}/pt/empresa/equipe/${id}`);
    if (e.status() !== 200 || q.status() !== 200) falhas.push(id);
  }
  ok("páginas individuais da equipe (EN e PT)", !falhas.length);
  const inexistente = await p.request.get(`${BASE}/company/team/inexistente`);
  ok("pessoa inexistente → 404", inexistente.status() === 404);
  for (const [r, padrao] of [["/previa/refinada", "home-montanha-1.2.0-03d2"], ["/previa/refinada/en", "home-montanha-1.2.0-03d2"]]) {
    const pg = await (await pagina()).p;
    const pedidos = [];
    pg.on("request", (q) => pedidos.push(q.url()));
    const rr = await pg.goto(BASE + r, { waitUntil: "networkidle" });
    const j = await pg.evaluate(() => ({ jornada: !!document.getElementById("jornada"), expl: !!document.getElementById("explicabilidade"), lang: document.documentElement.lang }));
    ok(`comparação ${r} preservada`, rr.status() === 200 && j.jornada && j.expl && pedidos.some((u) => u.includes(padrao)) && !pedidos.some((u) => u.includes("1.2.1-03d2")), `lang=${j.lang} montanha 1.2.0=${pedidos.some((u) => u.includes(padrao))}`);
  }
  await c.close();
}

/* 3 · sem rolagem lateral, nas telas e páginas */
{
  const falhas = [];
  for (const [w, h] of [[320, 568], [390, 844], [768, 1024], [1280, 720], [1440, 900], [1920, 1080]]) {
    const { c, p } = await pagina({ w, h });
    for (const [rota] of [...PAGINAS, ["/company/team/miguel"], ["/pt/empresa/equipe/victor"]]) {
      await p.goto(BASE + rota, { waitUntil: "load" });
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      if (sw > w) falhas.push(`${rota}@${w}:${sw}`);
    }
    await c.close();
  }
  ok("sem rolagem lateral (6 larguras × 10 páginas)", !falhas.length, falhas.join(" "));
}

/* 4 · menu móvel: teclado, foco, Esc, idioma */
{
  const { c, p } = await pagina({ w: 390, h: 844, dpr: 2 });
  await p.goto(BASE + "/platform", { waitUntil: "networkidle" });
  await p.click("[data-menu-abrir]");
  const aberto = await p.evaluate(() => ({ open: document.getElementById("menu-movel").open, foco: document.activeElement?.getAttribute("href"), idioma: document.querySelector("#menu-movel a[hreflang]")?.getAttribute("href") }));
  ok("menu abre com foco na página atual", aberto.open && aberto.foco === "/platform", JSON.stringify(aberto));
  ok("menu: idioma leva à página equivalente", aberto.idioma === "/pt/plataforma");
  let dentro = true;
  for (let k = 0; k < 10; k++) { await p.keyboard.press("Tab"); dentro &&= await p.evaluate(() => !!document.activeElement?.closest("#menu-movel")); }
  ok("menu: foco preso no diálogo (10 × Tab)", dentro);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(100);
  const fechado = await p.evaluate(() => ({ open: document.getElementById("menu-movel").open, foco: document.activeElement?.hasAttribute("data-menu-abrir") }));
  ok("menu: Esc fecha e devolve o foco ao botão", !fechado.open && fechado.foco);
  await p.click("[data-menu-abrir]");
  await p.click("#menu-movel a[href='/research']");
  await p.waitForURL("**/research");
  ok("menu: navega para outra página", p.url().endsWith("/research"));
  await c.close();
}

/* 5 · biografias: abrir, anterior/próxima, Esc, ×, foco de volta, celular */
for (const [w, h, dpr] of [[1440, 900, 1], [390, 844, 3], [390, 640, 3]]) {
  const { c, p } = await pagina({ w, h, dpr });
  await p.goto(BASE + "/company", { waitUntil: "networkidle" });
  await p.click("[data-pessoa=miguel]");
  let s = await p.evaluate(() => ({ open: document.querySelector("dialog[data-bio]").open, nome: document.querySelector("#bio-t")?.textContent, url: location.pathname }));
  ok(`bio @${w}×${h}: abre no diálogo sem sair da página`, s.open && s.nome === "Miguel" && s.url === "/company", JSON.stringify(s));
  const x = await p.evaluate(() => { const r = document.querySelector("[data-bio-fechar-x]").getBoundingClientRect(); return { top: r.top, bottom: r.bottom, right: r.right, w: r.width, h: r.height }; });
  ok(`bio @${w}×${h}: × visível na tela, alvo ≥ 44 px`, x.top >= 0 && x.bottom <= h && x.right <= w && x.w >= 44 && x.h >= 44, JSON.stringify(x));
  await p.evaluate(() => { const d = document.querySelector("dialog[data-bio]"); d.scrollTop = d.scrollHeight; });
  await p.waitForTimeout(150);
  const fim = await p.evaluate((H) => { const r = document.querySelector("[data-bio-fechar-x]").getBoundingClientRect(); const f = document.querySelector("[data-bio-fechar]").getBoundingClientRect(); return { x: r.top >= 0 && r.bottom <= H, fechar: f.top < H && f.bottom > 0 }; }, h);
  ok(`bio @${w}×${h}: fim do texto com × e "Fechar" alcançáveis`, fim.x && fim.fechar, JSON.stringify(fim));
  const cor = await p.evaluate(() => { const e = document.querySelector("dialog[data-bio] p[class*=bioTexto]"); const cs = getComputedStyle(e); return [cs.color, cs.fontSize]; });
  ok(`bio @${w}×${h}: texto #1A1A1A sobre branco, 17 px`, cor[0] === "rgb(26, 26, 26)" && cor[1] === "17px", cor.join(" "));
  await p.click("[data-bio-proxima]");
  s = await p.evaluate(() => document.querySelector("#bio-t")?.textContent);
  ok(`bio @${w}×${h}: próxima pessoa`, s === "Rodrigo Gobbo", s);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(100);
  const f = await p.evaluate(() => ({ open: document.querySelector("dialog[data-bio]").open, foco: document.activeElement?.id }));
  ok(`bio @${w}×${h}: Esc fecha e o foco volta ao cartão da pessoa`, !f.open && f.foco === "p-rodrigo", JSON.stringify(f));
  await p.click("[data-pessoa=victor]");
  await p.click("[data-bio-fechar-x]");
  await p.waitForTimeout(100);
  const f2 = await p.evaluate(() => ({ open: document.querySelector("dialog[data-bio]").open, foco: document.activeElement?.id }));
  ok(`bio @${w}×${h}: × fecha e devolve o foco`, !f2.open && f2.foco === "p-victor", JSON.stringify(f2));
  await c.close();
}
{ // teclado puro
  const { c, p } = await pagina();
  await p.goto(BASE + "/pt/empresa", { waitUntil: "networkidle" });
  await p.focus("[data-pessoa=hartmann]");
  await p.keyboard.press("Enter");
  const s = await p.evaluate(() => ({ open: document.querySelector("dialog[data-bio]").open, nome: document.querySelector("#bio-t")?.textContent, foco: !!document.activeElement?.closest("dialog") }));
  ok("bio pelo teclado (Enter), foco dentro do diálogo", s.open && s.nome === "Luiz G. Hartmann" && s.foco, JSON.stringify(s));
  await c.close();
}

/* 6 · sem JavaScript */
{
  const { c, p } = await pagina({ js: false, w: 390, h: 844, dpr: 2 });
  await p.goto(BASE + "/company", { waitUntil: "load" });
  const href = await p.getAttribute("[data-pessoa=miguel]", "href");
  await p.click("[data-pessoa=miguel]");
  await p.waitForLoadState("load");
  const pg = await p.evaluate(() => ({ url: location.pathname, h1: document.querySelector("h1")?.textContent, bio: document.querySelectorAll("p[class*=bioTexto]").length }));
  ok("sem JS: cartão leva à página individual", href === "/company/team/miguel" && pg.url === "/company/team/miguel" && pg.h1 === "Miguel" && pg.bio === 3, JSON.stringify(pg));
  await p.goto(BASE + "/", { waitUntil: "load" });
  const menu = await p.getAttribute("[data-menu-abrir]", "href");
  const poster = await p.evaluate(() => { const i = document.querySelector("[data-poster-montanha]"); return { src: i.currentSrc, ok: i.complete && i.naturalWidth > 0, canvas: !!document.querySelector("[data-slot-arte] canvas"), pausa: !!document.querySelector("[data-pausa]") }; });
  ok("sem JS: menu cai para a navegação do rodapé", menu === "#rodape-nav");
  ok("sem JS: montanha = poster carregado, sem canvas", poster.ok && !poster.canvas && /movel-w\d+@2x/.test(poster.src), poster.src.split("/").pop());
  ok("sem JS: botão de pausa não aparece", !poster.pausa);
  await p.goto(BASE + "/platform", { waitUntil: "load" });
  const est = await p.evaluate(() => ({ det: !!document.querySelector("details"), imgs: document.querySelectorAll("details img").length, nos: document.querySelector("noscript") != null }));
  ok("sem JS: demonstração = 7 etapas estáticas", est.det && est.imgs >= 10, JSON.stringify(est));
  await c.close();
}

/* 7 · montanha: canvas, movimento reduzido, pausa, falha, resize */
{
  const { c, p, erros } = await pagina({ w: 1440, h: 900, dpr: 2 });
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);
  let m = await p.evaluate(() => { const cv = document.querySelector("[data-slot-arte] canvas"); const s = document.querySelector("[data-slot-arte]").getBoundingClientRect(); return { modo: document.querySelector("[data-slot-arte]").dataset.montanha, intro: cv?.dataset.intro, amb: cv?.dataset.ambient, comp: cv?.dataset.composicao, slot: [Math.round(s.width), Math.round(s.height)] }; });
  ok("montanha: canvas, abertura concluída, luz ambiente ativa, composição centro", m.modo === "canvas" && m.intro === "done" && (m.amb === "light" || m.amb === "on") && m.comp?.startsWith("centro") && !erros.length, JSON.stringify(m));
  await p.click("[data-pausa]");
  await p.waitForTimeout(300);
  m = await p.evaluate(() => ({ html: document.documentElement.dataset.motion, amb: document.querySelector("[data-slot-arte] canvas")?.dataset.ambient }));
  ok("pausa: html[data-motion=paused] e luz desligada", m.html === "paused" && m.amb === "off", JSON.stringify(m));
  await p.goto(BASE + "/platform", { waitUntil: "networkidle" });
  const persist = await p.evaluate(() => document.documentElement.dataset.motion);
  ok("pausa: vale para a próxima página da aba", persist === "paused");
  await p.click("[data-pausa]");
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  for (const [w, h] of [[390, 844], [1440, 900], [1280, 600]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const s = document.querySelector("[data-slot-arte]"); const cv = s.querySelector("canvas"); const a = s.getBoundingClientRect(), b = cv.getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, igual: Math.abs(a.width - b.width) < 1.5 && Math.abs(a.height - b.height) < 1.5, comp: cv.dataset.composicao }; });
    ok(`resize → ${w}×${h}: canvas acompanha o slot, sem rolagem lateral`, r.igual && r.sw <= w, JSON.stringify(r));
  }
  await c.close();
  const r2 = await pagina({ reduzido: true });
  await r2.p.goto(BASE + "/", { waitUntil: "networkidle" });
  await r2.p.waitForTimeout(1500);
  m = await r2.p.evaluate(() => { const cv = document.querySelector("[data-slot-arte] canvas"); return { intro: cv?.dataset.intro, amb: cv?.dataset.ambient }; });
  ok("movimento reduzido: sem abertura nem luz", m.intro === "done" && m.amb === "off", JSON.stringify(m));
  await r2.c.close();
  const r3 = await pagina();
  await r3.p.route("**/home-montanha-1.2.1-03d2/web/home-sculpture.js", (rt) => rt.abort());
  await r3.p.goto(BASE + "/", { waitUntil: "load" });
  await r3.p.waitForTimeout(1200);
  m = await r3.p.evaluate(() => { const i = document.querySelector("[data-poster-montanha]"); return { modo: document.querySelector("[data-slot-arte]").dataset.montanha, poster: i.complete && i.naturalWidth > 0 }; });
  ok("falha do módulo da montanha: o poster fica", m.modo === "poster" && m.poster, JSON.stringify(m));
  await r3.c.close();
}

/* 8 · posters: só UM arquivo da montanha por tela (com e sem JS), variante certa no celular baixo */
for (const js of [true, false]) {
  for (const [w, h, dpr] of TELAS) {
    const { c, p } = await pagina({ w, h, dpr, js });
    const pedidos = [];
    p.on("request", (q) => { if (/arte-escultura-/.test(q.url())) pedidos.push(q.url().split("/").pop()); });
    await p.goto(BASE + "/", { waitUntil: "networkidle" });
    const info = await p.evaluate(() => { const s = document.querySelector("[data-slot-arte]"); const r = s.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height), util: s.dataset.alturaUtil || null, poster: document.querySelector("[data-poster-montanha]").currentSrc.split("/").pop(), canvas: !!s.querySelector("canvas"), sopeNaTela: r.top + r.height * 0.75 <= innerHeight }; });
    if (js) medidas.slots[`${w}x${h}@${dpr}`] = info;
    medidas.posters[`${w}x${h}@${dpr}${js ? "" : " sem JS"}`] = pedidos;
    ok(`poster único ${w}×${h}@${dpr}${js ? "" : " sem JS"}`, pedidos.length === 1, pedidos.join(", ") + ` · slot ${info.w}×${info.h} em y ${info.y}${info.util ? ` · alturaUtil ${info.util}` : ""}`);
    await c.close();
  }
}

/* 9 · teto de ampliação das capturas (por densidade real) + estimativa de legibilidade */
for (const [w, h, dpr] of TELAS) {
  const { c, p } = await pagina({ w, h, dpr });
  await p.goto(BASE + "/platform", { waitUntil: "networkidle" });
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
  await p.waitForLoadState("networkidle");
  const lista = await p.evaluate((d) => [...document.querySelectorAll("img[data-medica]")].map((i) => {
    const r = i.getBoundingClientRect();
    const nat = Number(getComputedStyle(i).getPropertyValue("--nat")) || i.naturalWidth;
    const k = (r.width * d) / nat; // px do dispositivo por px da captura
    return { id: i.closest("[data-captura]")?.dataset.captura, medica: i.dataset.medica === "1", k: +k.toFixed(3), cssLargura: Math.round(r.width), textoEstimadoPx: +((11 * 2 * k) / d).toFixed(1) };
  }), dpr);
  const acima = lista.filter((x) => x.k > (x.medica ? 1.75 : 2) + 0.01);
  medidas.teto.push({ tela: `${w}x${h}@${dpr}`, capturas: lista });
  ok(`teto de ampliação ${w}×${h}@${dpr} (interface ≤ 2,0; RM ≤ 1,75)`, !acima.length, acima.map((x) => `${x.id} ${x.k}`).join(" "));
  await c.close();
}

/* 10 · demonstração guiada: entrada, etapas, paradas, saída, reduzido, falha; palco medido */
for (const [w, h, dpr] of [[1440, 900, 2], [1280, 600, 2], [390, 844, 3], [390, 640, 3], [320, 568, 2]]) {
  const { c, p, erros } = await pagina({ w, h, dpr });
  await p.goto(BASE + "/platform#demonstracao", { waitUntil: "networkidle" });
  await p.locator("[data-demo-abrir]").scrollIntoViewIfNeeded();
  const yAntes = await p.evaluate(() => scrollY);
  await p.click("[data-demo-abrir]");
  await p.waitForFunction(() => document.querySelector("[data-demo]")?.dataset.demoModo !== "carregando", null, { timeout: 8000 });
  await p.waitForTimeout(600);
  const pc = await p.evaluate(() => { const r = document.querySelector("[data-demo] [class*=palco]").getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), modo: document.querySelector("[data-demo]").dataset.demoModo }; });
  medidas.palco[`${w}x${h}@${dpr}`] = pc;
  ok(`demo @${w}×${h}: abre em palco próprio, modo animado`, pc.modo === "animado" && pc.w > 200 && pc.h > 150 && !erros.length, JSON.stringify(pc));
  for (let k = 0; k < 4; k++) await p.click("[data-demo-proxima]");
  await p.waitForTimeout(4200);
  const e5 = await p.evaluate(() => { const h = document.querySelector("[data-demo] [data-fluxo-modo]"); return { etapa: document.querySelector("[data-demo]").dataset.demoEtapa, fluxo: h?.dataset.fluxoEtapa }; });
  ok(`demo @${w}×${h}: etapa 5 (medida completa)`, e5.etapa === "5" && e5.fluxo === "5", JSON.stringify(e5));
  await p.keyboard.press("Escape");
  await p.waitForTimeout(100);
  const fora = await p.evaluate(() => ({ open: document.querySelector("[data-demo]").open, foco: document.activeElement?.hasAttribute("data-demo-abrir"), y: scrollY }));
  ok(`demo @${w}×${h}: Esc sai, foco no botão de entrada, página no mesmo lugar`, !fora.open && fora.foco && Math.abs(fora.y - yAntes) < 2, JSON.stringify(fora));
  await c.close();
}
{
  const { c, p } = await pagina({ reduzido: true });
  await p.goto(BASE + "/platform", { waitUntil: "networkidle" });
  await p.click("[data-demo-abrir]");
  await p.waitForTimeout(1500);
  const s = await p.evaluate(() => ({ modo: document.querySelector("[data-demo]").dataset.demoModo, imgs: document.querySelectorAll("[data-demo-estatico] img").length }));
  ok("demo com movimento reduzido: capturas estáticas da etapa", s.modo === "estatico" && s.imgs >= 1, JSON.stringify(s));
  await p.click("[data-demo-sair]");
  await c.close();
  const f = await pagina();
  await f.p.addInitScript(() => { window.__PLATAFORMA_FLUXO_TESTE__ = { url: "/nao-existe/plataforma-fluxo.js" }; });
  await f.p.goto(BASE + "/platform", { waitUntil: "networkidle" });
  await f.p.click("[data-demo-abrir]");
  await f.p.waitForTimeout(1200);
  const s2 = await f.p.evaluate(() => ({ modo: document.querySelector("[data-demo]").dataset.demoModo, imgs: document.querySelectorAll("[data-demo-estatico] img").length }));
  ok("demo com falha do módulo: capturas estáticas", s2.modo === "estatico" && s2.imgs >= 1, JSON.stringify(s2));
  await f.c.close();
}

/* 11 · falha de mídia: captura indisponível não quebra a página */
{
  const { c, p, erros } = await pagina({ w: 390, h: 844 });
  await p.route("**/plataforma-fluxo-estatico-v1/viewer-planos-mira-*.webp", (rt) => rt.abort());
  await p.goto(BASE + "/platform", { waitUntil: "load" });
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  ok("captura indisponível: sem erro de página nem rolagem lateral", !erros.length && sw <= 390);
  await c.close();
}

/* 12 · integridade dos pacotes servidos (sha256 contra os manifestos do Motion) */
{
  const { c, p } = await pagina();
  let n = 0, bad = [];
  for (const [man, base] of [["/previa/home-montanha-1.2.1-03d2/manifest.json", "/previa/home-montanha-1.2.1-03d2/"], ["/refinada/plataforma-fluxo-0.6.0-03d2/manifest.json", "/refinada/plataforma-fluxo-0.6.0-03d2/"]]) {
    const m = await (await p.request.get(BASE + man)).json();
    const files = m.files || m.arquivos;
    for (const f of files) {
      const caminho = f.path || f.arquivo;
      const buf = await (await p.request.get(BASE + base + caminho)).body();
      if (createHash("sha256").update(buf).digest("hex") !== f.sha256) bad.push(caminho);
      n++;
    }
  }
  ok(`pacotes servidos conferem com os manifestos (${n} arquivos)`, !bad.length, bad.slice(0, 5).join(" "));
  await c.close();
}

await b.close();
const falhas = res.filter((r) => !r.ok);
console.log(`\n${res.length - falhas.length}/${res.length} ok`);
if (SAIDA) writeFileSync(SAIDA, JSON.stringify({ base: BASE, data: new Date().toISOString(), resultados: res, medidas }, null, 2));
process.exit(falhas.length ? 1 : 0);
