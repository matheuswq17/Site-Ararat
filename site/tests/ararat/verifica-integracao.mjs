#!/usr/bin/env node
/**
 * Verificação da integração do Atlas clínico no app (portfolio-site-v1). Roda contra um servidor do app:
 *   node tests/ararat/verifica-integracao.mjs http://127.0.0.1:3101 [saida.json] [--publico]
 * Sem --publico: build da REVISÃO PRIVADA (ARARAT_REVISAO_PRIVADA=1), com mídia e parâmetros de teste.
 * Com --publico: build apto a publicação — confere que nenhuma mídia pendente aparece e que a página continua íntegra.
 * Testes headless (Chromium) não são aprovação estética nem medida de campo (CWV).
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://127.0.0.1:3101").replace(/\/$/, "");
const SAIDA = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : null;
const PUBLICO = process.argv.includes("--publico");
const SO = (process.argv.find((a) => a.startsWith("--so=")) || "").slice(5).split(",").filter(Boolean);
const res = [];
const ok = (grupo, nome, passou, det = {}) => { res.push({ grupo, nome, ok: !!passou, ...det }); console.log(`${passou ? "ok  " : "FALHA"} [${grupo}] ${nome}${Object.keys(det).length ? " " + JSON.stringify(det).slice(0, 260) : ""}`); };
const quer = (g) => !SO.length || SO.includes(g);

const ROTAS = {
  en: ["/", "/solutions", "/solutions/prostate-mri", "/solutions/thyroid-ultrasound", "/platform", "/research", "/company", "/company/team/miguel"],
  pt: ["/pt", "/pt/solucoes", "/pt/solucoes/prostata", "/pt/solucoes/tireoide", "/pt/plataforma", "/pt/pesquisa", "/pt/empresa", "/pt/empresa/equipe/miguel"],
  es: ["/es", "/es/soluciones", "/es/soluciones/prostata", "/es/soluciones/tiroides", "/es/plataforma", "/es/investigacion", "/es/empresa", "/es/empresa/equipo/miguel"],
};
const TODAS = [...ROTAS.en, ...ROTAS.pt, ...ROTAS.es];
const PRESERVADAS = ["/previa/refinada", "/previa/refinada/en", "/previa/institucional", "/previa/institucional/pt/plataforma", "/previa"];

const b = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
const nova = async (o = {}) => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...o }); const p = await ctx.newPage(); p.__erros = []; p.on("pageerror", (e) => p.__erros.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.text())) p.__erros.push(m.text().slice(0, 200)); }); return { ctx, p }; };
const ir = async (p, url, espera = 500) => { const r = await p.goto(BASE + url, { waitUntil: "networkidle" }); await p.waitForTimeout(espera); return r; };

// ---------------------------------------------------------------- 1. rotas, links, idiomas, nada interno
if (quer("rotas")) {
  const { ctx, p } = await nova();
  const internos = new Set();
  for (const url of TODAS) {
    const r = await ir(p, url, 100);
    const info = await p.evaluate(() => ({
      h1: document.querySelectorAll("h1").length, lang: document.documentElement.lang,
      links: [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")),
      idiomas: [...document.querySelectorAll(".cab > .w > .idiomas a")].map((a) => a.getAttribute("href")),
      marca: document.querySelector(".cab .marca")?.getAttribute("href"), rodMarca: document.querySelector(".rodape .rod-marca")?.getAttribute("href"),
      texto: document.body.innerText, robots: document.querySelector('meta[name=robots]')?.content,
      hreflang: [...document.querySelectorAll('link[rel=alternate][hreflang]')].map((l) => l.hreflang + "=" + l.getAttribute("href")),
      og: !!document.querySelector('meta[property="og:title"]'), titulo: document.title,
    }));
    const lang = url.startsWith("/pt") ? "pt-BR" : url.startsWith("/es") ? "es" : "en";
    const home = url.startsWith("/pt") ? "/pt" : url.startsWith("/es") ? "/es" : "/";
    info.links.forEach((h) => { if (h.startsWith("/")) internos.add(h.split("#")[0]); });
    const proibido = /carimbo|Revisão interna|Notas de revisão|nota-marca|\?de=atlas|Voltar ao Atlas|versão anterior \(comparação\)|Protótipo local|limpo=1|Atlas clínico/i;
    ok("rotas", `${url}: 200, 1 h1, lang, logo → Home nova, noindex, OG, hreflang`, r.status() === 200 && info.h1 === 1 && info.lang === lang && info.marca === home && info.rodMarca === home && /noindex/.test(info.robots || "") && info.og && info.hreflang.length === 3 && info.idiomas.length === 3,
      { status: r.status(), h1: info.h1, lang: info.lang, marca: info.marca, rod: info.rodMarca, og: info.og, idiomas: info.idiomas.length, robots: info.robots, hreflang: info.hreflang.length });
    ok("rotas", `${url}: sem aviso interno de revisão/captura/debug`, !proibido.test(info.texto) && !info.links.some((h) => /de=atlas|\/previa\b|\/atlas\//.test(h)), {});
    if (p.__erros.length) ok("rotas", `${url}: sem erros de página`, false, { erros: p.__erros.splice(0) });
  }
  for (const h of internos) { const r = await p.request.get(BASE + h); if (r.status() !== 200) ok("rotas", `link interno ${h} responde`, false, { status: r.status() }); }
  ok("rotas", `todos os ${internos.size} destinos internos respondem 200 e nenhum é a Home antiga`, [...internos].every((h) => !h.startsWith("/previa")), { n: internos.size });
  // idioma: página equivalente e seção preservada
  await ir(p, "/pt/plataforma#adocao");
  await p.click('.cab .idiomas a[data-idioma="en"]').catch(() => {});
  await p.waitForURL(/\/platform/, { timeout: 8000 }).catch(() => {});
  ok("rotas", "idioma PT → EN leva à página equivalente e preserva a seção (#adocao)", new URL(p.url()).pathname === "/platform" && new URL(p.url()).hash === "#adocao", { url: p.url() });
  // versões anteriores: acessíveis na revisão privada; na variante pública ficam fora (404 + x-ararat-bloqueio)
  for (const url of PRESERVADAS) {
    const r = await p.request.get(BASE + url, { maxRedirects: 0 });
    if (PUBLICO) ok("rotas", `preservada ${url} fora da variante pública`, r.status() === 404 && r.headers()["x-ararat-bloqueio"] === "fora-da-publicacao", { status: r.status() });
    else ok("rotas", `preservada ${url} responde`, r.status() === 200, { status: r.status() });
  }
  await ctx.close();
}

// ---------------------------------------------------------------- 2. abertura: resize ida/volta = carregamento direto
if (quer("abertura")) {
  const estado = (p) => p.evaluate(() => window.__abertura ? { v: __abertura.variante, W: __abertura.W, g: __abertura.medidas.g, est: document.querySelector("[data-hero]").dataset.estagios || "-" } : null);
  const direto = {};
  const tamanhos = [[1440, 900], [800, 560], [390, 844], [390, 640], [320, 568], [1280, 600], [1024, 700], [1920, 1080], [1366, 768], [810, 958]];
  for (const url of ["/pt", "/"]) {
    for (const [w, h] of tamanhos) { const { ctx, p } = await nova({ viewport: { width: w, height: h } }); await ir(p, url + "?intro=0", 700); direto[url + w + "x" + h] = await estado(p); await ctx.close(); }
    const caminhos = [[[1440, 900], [800, 560], [1440, 900]], [[1440, 900], [800, 560], [1440, 900], [800, 560], [1440, 900]], [[800, 560], [1440, 900]], [[390, 640], [1440, 900]], [[1440, 900], [390, 844], [1440, 900]], [[1440, 900], [1280, 600], [1440, 900]], [[1920, 1080], [320, 568], [1920, 1080]], [[1366, 768], [800, 560], [1366, 768]], [[1440, 900], [1024, 700], [800, 560], [1440, 900]]];
    for (const cam of caminhos) {
      const { ctx, p } = await nova({ viewport: { width: cam[0][0], height: cam[0][1] } });
      await ir(p, url + "?intro=0", 700);
      const rastro = [];
      for (const [w, h] of cam.slice(1)) { await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(500); rastro.push(await estado(p)); }
      const fim = cam[cam.length - 1], d = direto[url + fim.join("x")], u = rastro[rastro.length - 1];
      ok("abertura", `${url} ${cam.map((x) => x.join("×")).join(" → ")} decide igual ao carregamento direto`, u && d && u.v === d.v && u.W === d.W, { resize: u, direto: d });
      await ctx.close();
    }
  }
  // montanha coberta pelo cabeçalho: sem laço; ao voltar, laço; intro não repete
  const { ctx, p } = await nova();
  await p.addInitScript(() => { window.__raf = 0; const o = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (f) => o((t) => { window.__raf++; f(t); }); });
  await ir(p, "/pt", 2500);
  const conta = async () => { const a = await p.evaluate(() => window.__raf); await p.waitForTimeout(1000); return (await p.evaluate(() => window.__raf)) - a; };
  const topo = await conta();
  await p.evaluate(() => { const h = document.querySelector("[data-hero]"); scrollTo(0, h.getBoundingClientRect().bottom + scrollY); }); await p.waitForTimeout(300);
  const coberta = await conta();
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
  const volta = await conta();
  ok("abertura", "montanha encoberta pelo cabeçalho não agenda quadros; volta a animar no topo", topo > 20 && coberta <= 2 && volta > 20, { topo, coberta, volta });
  await p.click("[data-pausa]:visible"); await p.waitForTimeout(200);
  const pausada = await conta();
  ok("abertura", "pausa global zera o laço e o botão indica retomar", pausada <= 2 && (await p.locator("[data-pausa]:visible").first().getAttribute("aria-pressed")) === "true", { pausada });
  await p.click("[data-pausa]:visible"); await ctx.close();
  // fonte: abertura decide com Lora carregada
  { const { ctx: c2, p: p2 } = await nova(); await ir(p2, "/pt?intro=0", 800);
    ok("abertura", "decisão com Lora e Inter carregadas", await p2.evaluate(() => document.fonts.check("500 74px Lora") && document.fonts.check("400 18px Inter")));
    await c2.close(); }
}

// ---------------------------------------------------------------- 3. camadas: corte seco no caso; pausa no meio do fade; duas instâncias
if (quer("camadas") && !PUBLICO) {
  const { ctx, p } = await nova();
  await ir(p, "/pt", 1500);
  const corte = await p.evaluate(async () => {
    const b = window.__saidasBlocos?.[0]; if (!b) return null;
    const imgs = [...b.bloco.querySelectorAll(".ararat-saidas img")];
    b.mostrar("t2"); await new Promise((r) => setTimeout(r, 16));
    return imgs.map((i) => [i.dataset.camada, getComputedStyle(i).opacity, i.style.transition]);
  });
  ok("camadas", "Home: troca T2 ↔ máscaras em corte seco (sem fade)", corte && corte.find((x) => x[0] === "t2")[1] === "1" && corte.every((x) => x[2] === "none"), { corte });
  await ctx.close();
  // caminho com fade (experiência anterior), pausa aos ~50 ms
  for (const modo of ["fade", "duplo"]) {
    const { ctx: c, p: q } = await nova();
    await ir(q, `/pt/solucoes/prostata?camadas=${modo}`, 1500);
    const r = await q.evaluate(async () => {
      const inst = window.__saidasBlocos; const b = inst[0];
      const host = b.bloco.querySelector("[data-saidas-host]");
      const eventos = []; host.addEventListener("ararat:saida", (e) => eventos.push(e.detail.id));
      const alvo = () => host.querySelector('img[data-camada="t2"]');
      b.mostrar("t2"); await new Promise((r) => setTimeout(r, 50));
      const meio = +getComputedStyle(alvo()).opacity;
      window.ARARAT_MOVIMENTO.definir(true);
      const amostras = []; for (let k = 0; k < 12; k++) { await new Promise((r) => requestAnimationFrame(r)); amostras.push(+getComputedStyle(alvo()).opacity); }
      await new Promise((r) => setTimeout(r, 300));
      const final = [...host.querySelectorAll("img")].map((i) => [i.dataset.camada, getComputedStyle(i).opacity, i.getAttribute("aria-hidden")]);
      const ev = [...eventos];
      // retomada: fade de novo
      window.ARARAT_MOVIMENTO.definir(false);
      b.mostrar("seg"); await new Promise((r) => setTimeout(r, 60));
      const retomada = +getComputedStyle(host.querySelector('img[data-camada="seg"]')).opacity;
      await new Promise((r) => setTimeout(r, 300));
      let segundo = null;
      if (inst.length > 1) {
        const b2 = inst[1], h2 = b2.bloco.querySelector("[data-saidas-host]");
        b.destroy();
        window.ARARAT_MOVIMENTO.definir(true);
        b2.mostrar("t2"); await new Promise((r) => setTimeout(r, 16));
        segundo = { n: inst.length, primeiroDestruido: b.bloco.dataset.saidasModo, corte2: getComputedStyle(h2.querySelector('img[data-camada="t2"]')).opacity, modulo1: !!b.bloco.querySelector(".ararat-saidas") };
        window.ARARAT_MOVIMENTO.definir(false);
      }
      return { meio, amostras, final, ev, retomada, segundo };
    });
    ok("camadas", `${modo}: pausa no meio do fade conclui a troca na hora (0 quadros animados depois)`, r.meio < 1 && r.amostras.every((o) => o === 1), { meio: r.meio, amostras: r.amostras.slice(0, 4) });
    ok("camadas", `${modo}: estado final = alvo (t2 visível, seg oculta e aria-hidden)`, JSON.stringify(r.final) === JSON.stringify([["seg", "0", "true"], ["t2", "1", null]]), { final: r.final });
    ok("camadas", `${modo}: um único evento ararat:saida (o do alvo)`, JSON.stringify(r.ev) === JSON.stringify(["t2"]), { ev: r.ev });
    ok("camadas", `${modo}: retomar volta ao fade de 200 ms`, r.retomada > 0 && r.retomada < 1, { retomada: r.retomada });
    if (modo === "duplo") ok("camadas", "duas instâncias: destroy() do 1º não afeta o 2º; pausa vale para o 2º", r.segundo && r.segundo.n === 2 && r.segundo.primeiroDestruido === "destruido" && r.segundo.corte2 === "1" && !r.segundo.modulo1, r.segundo || {});
    await c.close();
  }
}

// ---------------------------------------------------------------- 4. escala: densidade real, com e sem JS
if (quer("escala") && !PUBLICO) {
  // TODAS as imagens de captura: as marcadas (data-midia-tipo), as camadas criadas pelo módulo saidas-caso e as da demonstração
  const medir = (p) => p.evaluate(() => [...document.querySelectorAll("img[data-midia-tipo], .ararat-saidas img, .semjs-imgs img, .d-estatico img")].filter((i) => i.naturalWidth && i.getBoundingClientRect().width > 0)
    .map((i) => ({ f: i.src.split("/").pop(), tipo: i.dataset.midiaTipo || (i.classList.contains("ui") ? "interface" : "medica"), r: i.getBoundingClientRect().width * devicePixelRatio / i.naturalWidth })));
  for (const js of [true, false]) for (const dpr of [1, 1.25, 1.5, 2, 2.25, 3, 3.5, 4]) for (const [w, h, url] of [[1344, 800, "/pt"], [1440, 900, "/pt"], [390, 844, "/pt"], [1440, 900, "/pt/plataforma"], [1440, 900, "/pt/solucoes/prostata"], [390, 844, "/pt/solucoes/prostata"]]) {
    const { ctx, p } = await nova({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, javaScriptEnabled: js });
    await ir(p, url, 300);
    // rolagem pelo lado do Node (sem JS na página não há timers): carrega as imagens preguiçosas
    const alt = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < alt; y += 700) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(40); }
    await p.waitForTimeout(400);
    const m = await medir(p);
    const med = Math.max(0, ...m.filter((x) => x.tipo !== "interface").map((x) => x.r)), int = Math.max(0, ...m.filter((x) => x.tipo === "interface").map((x) => x.r));
    ok("escala", `${js ? "com" : "sem"} JS · DPR ${dpr} · ${w}×${h} ${url}: médica ≤ 1,75, interface ≤ 2`, med <= 1.751 && int <= 2.001 && m.length > 0, { n: m.length, medica: +med.toFixed(3), interface: +int.toFixed(3) });
    await ctx.close();
  }
}
// fronteiras FRACIONÁRIAS sem JS (14/10): logo acima de cada limite de faixa (1,005 · 1,255 · 1,505 · 2,005 · 2,505 ·
// 3,005 · 4,005). Antes, a faixa começava em N+0,01 e esses valores usavam o denominador menor (ex.: 1,759 em 1,005).
if ((quer("escala") || SO.includes("fronteira")) && !PUBLICO) {
  const medir = (p) => p.evaluate(() => [...document.querySelectorAll("img[data-midia-tipo], .semjs-imgs img")].filter((i) => i.naturalWidth && i.getBoundingClientRect().width > 0)
    .map((i) => ({ tipo: i.dataset.midiaTipo || (i.classList.contains("ui") ? "interface" : "medica"), r: i.getBoundingClientRect().width * devicePixelRatio / i.naturalWidth })));
  for (const dpr of [1.005, 1.255, 1.505, 2.005, 2.505, 3.005, 4.005]) for (const url of ["/pt/solucoes/prostata", "/pt/plataforma", "/pt"]) {
    const { ctx, p } = await nova({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr, javaScriptEnabled: false });
    await ir(p, url, 300);
    const alt = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < alt; y += 700) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(30); }
    await p.waitForTimeout(300);
    const m = await medir(p);
    const med = Math.max(0, ...m.filter((x) => x.tipo !== "interface").map((x) => x.r)), int = Math.max(0, ...m.filter((x) => x.tipo === "interface").map((x) => x.r));
    ok("escala", `sem JS · fronteira DPR ${dpr} · ${url}: médica ≤ 1,75, interface ≤ 2 (sem folga de faixa)`, med <= 1.7502 && int <= 2.0002 && m.length > 0, { n: m.length, medica: +med.toFixed(4), interface: +int.toFixed(4) });
    await ctx.close();
  }
}

// ---------------------------------------------------------------- 5. demonstração: ritmo curto padrão, aria-busy, cliques, pausa, Esc, falha
if (quer("demo") && !PUBLICO) {
  const passagem = async (p) => p.evaluate(async () => {
    const dlg = document.querySelector("dialog[data-demo]"), palco = dlg.querySelector("[data-palco]");
    const t0 = performance.now(); dlg.querySelector("[data-proxima]").click();
    await new Promise((r) => requestAnimationFrame(r));
    const ocupado = palco.getAttribute("aria-busy");
    while (dlg.dataset.transicao) await new Promise((r) => setTimeout(r, 10));
    return { ms: Math.round(performance.now() - t0), ocupado, depois: palco.getAttribute("aria-busy") };
  });
  for (const [q, esperado] of [["", "curto"], ["?ritmo=curto", "curto"], ["?ritmo=atual", "atual"]]) {
    const { ctx, p } = await nova();
    await ir(p, "/pt/plataforma" + q, 400);
    await p.click("[data-demo-abrir]"); await p.waitForFunction(() => window.__demo, null, { timeout: 8000 });
    const ritmo = await p.evaluate(() => document.querySelector("dialog[data-demo]").dataset.ritmo);
    const ps = [await passagem(p), await passagem(p), await passagem(p)];
    const faixa = esperado === "curto" ? [560, 1300] : [860, 3700];
    ok("demo", `${q || "(sem parâmetro)"}: ritmo ${esperado}, passagens dentro da faixa, aria-busy durante e limpo depois`, ritmo === esperado && ps.every((x) => x.ms >= faixa[0] && x.ms <= faixa[1] && x.ocupado === "true" && x.depois === null), { ritmo, ps });
    if (!q) {
      // cliques rápidos
      const rap = await p.evaluate(async () => { const d = document.querySelector("dialog[data-demo]"); const b = d.querySelector("[data-proxima]"); b.click(); await new Promise((r) => setTimeout(r, 20)); b.click(); await new Promise((r) => setTimeout(r, 20)); b.click(); await new Promise((r) => setTimeout(r, 1500)); return { etapa: d.dataset.etapa, busy: d.querySelector("[data-palco]").getAttribute("aria-busy"), p: window.__demo.p, parada: +d.dataset.parada }; });
      ok("demo", "três cliques rápidos: termina na parada, sem ocupado", rap.busy === null && Math.abs(rap.p - rap.parada) < 1e-6, rap);
      // pausa no meio de uma passagem
      const pa = await p.evaluate(async () => { const d = document.querySelector("dialog[data-demo]"); d.querySelector("[data-anterior]").click(); await new Promise((r) => setTimeout(r, 120)); window.ARARAT_MOVIMENTO.definir(true); await new Promise((r) => setTimeout(r, 50)); const r = { busy: d.querySelector("[data-palco]").getAttribute("aria-busy"), trans: !!d.dataset.transicao, p: window.__demo.p, parada: +d.dataset.parada }; window.ARARAT_MOVIMENTO.definir(false); return r; });
      ok("demo", "pausa no meio de uma passagem corta para a parada e encerra aria-busy", pa.busy === null && !pa.trans && Math.abs(pa.p - pa.parada) < 1e-6, pa);
      // Esc no meio
      await p.evaluate(() => document.querySelector("dialog[data-demo] [data-proxima]").click());
      await p.waitForTimeout(80); await p.keyboard.press("Escape"); await p.waitForTimeout(200);
      const esc = await p.evaluate(() => ({ aberto: document.querySelector("dialog[data-demo]").open, foco: document.activeElement?.hasAttribute("data-demo-abrir"), demo: window.__demo, busy: document.querySelector("dialog[data-demo] [data-palco]").getAttribute("aria-busy") }));
      ok("demo", "Esc no meio: fecha, foco volta ao botão, sem módulo nem ocupado", !esc.aberto && esc.foco && esc.demo === null && esc.busy === null, esc);
      await p.click("[data-demo-abrir]"); await p.waitForFunction(() => window.__demo);
      ok("demo", "reabrir começa na etapa 1", (await p.evaluate(() => document.querySelector("dialog[data-demo]").dataset.etapa)) === "1");
      // movimento reduzido ATIVADO no meio de uma passagem (14/10): o controlador assenta na parada e solta aria-busy
      await p.evaluate(() => document.querySelector("dialog[data-demo] [data-proxima]").click());
      await p.waitForTimeout(120);
      const antesRm = await p.evaluate(() => ({ trans: !!document.querySelector("dialog[data-demo]").dataset.transicao }));
      const tRm = Date.now(); await p.emulateMedia({ reducedMotion: "reduce" });
      // o evento "change" do matchMedia chega no próximo quadro de estilo; espera no máximo 200 ms (a passagem dura ≥ 600)
      await p.waitForFunction(() => !document.querySelector("dialog[data-demo]").dataset.transicao, null, { timeout: 200, polling: 10 }).catch(() => {});
      const msRm = Date.now() - tRm;
      const rm = await p.evaluate(() => { const d = document.querySelector("dialog[data-demo]"); return { busy: d.querySelector("[data-palco]").getAttribute("aria-busy"), trans: !!d.dataset.transicao, p: window.__demo.p, parada: +d.dataset.parada }; });
      await p.emulateMedia({ reducedMotion: "no-preference" });
      ok("demo", "movimento reduzido ativado no meio da passagem: assenta na parada (≤ 200 ms, antes do fim da passagem), sem aria-busy", antesRm.trans && rm.busy === null && !rm.trans && Math.abs(rm.p - rm.parada) < 1e-6 && msRm < 200, { antes: antesRm, depois: rm, ms: msRm });
      // timers de foco: abrir/fechar em sequência rápida e sair da página — nenhum timer de foco pendente nem disparado
      // depois da desmontagem (instrumentação de setTimeout/clearTimeout; não regressão — a corrida original não é determinística)
      await p.keyboard.press("Escape"); await p.waitForTimeout(100);
      const tf = await p.evaluate(async () => {
        const reg = new Map(), st = window.setTimeout, ct = window.clearTimeout;
        window.setTimeout = (fn, ms, ...a) => { const foco = typeof fn === "function" && /focus\(/.test(String(fn)); let id; id = st(() => { const r = reg.get(id); if (r) r.disparo = performance.now(); fn(...a); }, ms); if (foco) reg.set(id, { criado: performance.now(), disparo: null, cancelado: false }); return id; };
        window.clearTimeout = (id) => { const r = reg.get(id); if (r) r.cancelado = true; ct(id); };
        const d = document.querySelector("dialog[data-demo]"), b = document.querySelector("[data-demo-abrir]");
        for (let i = 0; i < 3; i++) { b.click(); d.close(); }
        b.click(); d.close();
        let desmontado = null; const mo = new MutationObserver(() => { if (!d.isConnected && desmontado === null) desmontado = performance.now(); }); mo.observe(document.body, { childList: true, subtree: true });
        document.querySelector('header a[href="/pt/solucoes"], a[href="/pt/solucoes"]').click();
        await new Promise((r) => st(r, 1500)); mo.disconnect(); window.setTimeout = st; window.clearTimeout = ct;
        const v = [...reg.values()];
        return { criados: v.length, disparados: v.filter((x) => x.disparo !== null).length, cancelados: v.filter((x) => x.cancelado).length, pendentes: v.filter((x) => x.disparo === null && !x.cancelado).length, aposDesmontar: desmontado === null ? null : v.filter((x) => x.disparo !== null && x.disparo > desmontado).length, desmontou: desmontado !== null, rota: location.pathname, foco: document.activeElement?.isConnected ?? true };
      });
      ok("demo", "abrir/fechar rápido e sair: timers de foco cancelados ou concluídos, nenhum depois da desmontagem", tf.criados > 0 && tf.pendentes === 0 && tf.desmontou && tf.aposDesmontar === 0 && tf.foco, tf);
    }
    await ctx.close();
  }
  for (const [w, h] of [[1440, 900], [320, 568]]) {
    const { ctx, p } = await nova({ viewport: { width: w, height: h } });
    await ir(p, "/pt/plataforma?demo=falha", 1200);
    const f = await p.evaluate(() => { const d = document.querySelector("dialog[data-demo]"); const e = d.querySelector("[data-palco-estado]"); const r = e.getBoundingClientRect(); return { aberto: d.open, modo: d.dataset.modo, busy: d.querySelector("[data-palco]").getAttribute("aria-busy"), msg: e.hidden ? null : e.textContent, visivel: r.width > 0 && r.left >= 0 && r.right <= innerWidth + 1, imgs: d.querySelectorAll("[data-palco-estatico] img").length, rolagemLateral: document.documentElement.scrollWidth > innerWidth }; });
    ok("demo", `falha do módulo ${w}×${h}: estático com capturas, mensagem legível dentro da tela, sem aria-busy`, f.aberto && f.modo === "estatico" && f.busy === null && !!f.msg && f.visivel && f.imgs > 0 && !f.rolagemLateral, f);
    await ctx.close();
  }
}

// ---------------------------------------------------------------- 6. biografias: modal acessível; página sem JS
if (quer("bio")) {
  for (const [w, h] of [[1440, 900], [320, 568]]) {
    const { ctx, p } = await nova({ viewport: { width: w, height: h } });
    await ir(p, "/pt/empresa", 300);
    await p.locator('[data-bio="miguel"]').scrollIntoViewIfNeeded(); await p.click('[data-bio="miguel"]'); await p.waitForTimeout(250);
    const a = await p.evaluate(() => { const d = document.getElementById("bio-miguel"); const f = d.querySelector("[data-bio-fechar]").getBoundingClientRect(); return { aberto: d.open, foco: document.activeElement?.hasAttribute("data-bio-fechar"), fecharVisivel: f.top >= 0 && f.bottom <= innerHeight && f.left >= 0 && f.right <= innerWidth }; });
    for (let k = 0; k < 6; k++) await p.keyboard.press("Tab");
    const preso = await p.evaluate(() => !!document.activeElement?.closest("#bio-miguel"));
    await p.keyboard.press("Escape"); await p.waitForTimeout(150);
    const d = await p.evaluate(() => ({ aberto: document.getElementById("bio-miguel").open, foco: document.activeElement?.getAttribute("data-bio") }));
    ok("bio", `${w}×${h}: abre com foco no Fechar visível, Tab preso, Esc fecha e devolve o foco ao cartão`, a.aberto && a.foco && a.fecharVisivel && preso && !d.aberto && d.foco === "miguel", { ...a, preso, ...d });
    await ctx.close();
  }
  const { ctx, p } = await nova({ javaScriptEnabled: false });
  await ir(p, "/pt/empresa", 100);
  const href = await p.getAttribute('[data-bio="miguel"]', "href");
  await ir(p, href, 100);
  ok("bio", "sem JS: o cartão leva à página individual da pessoa", href === "/pt/empresa/equipe/miguel" && (await p.textContent("h1")).includes("Miguel"), { href });
  await ctx.close();
}

// ---------------------------------------------------------------- 7. sem JS, celular, zoom, movimento reduzido
if (quer("telas")) {
  const telas = [[320, 568], [390, 640], [390, 844], [1280, 600], [1440, 900], [256, 454], [853, 533], [640, 400], [213, 379]];
  for (const js of [true, false]) for (const [w, h] of telas) {
    const { ctx, p } = await nova({ viewport: { width: w, height: h }, javaScriptEnabled: js });
    const falhas = [];
    for (const url of ROTAS.pt) {
      await ir(p, url, js ? 300 : 50);
      const r = await p.evaluate(() => ({ lateral: document.documentElement.scrollWidth - innerWidth, h1: !!document.querySelector("h1")?.textContent.trim() }));
      if (r.lateral > 1 || !r.h1) falhas.push({ url, ...r });
    }
    const zoom = w === 256 || w === 853 || w === 640 || w === 213;
    ok("telas", `${js ? "com" : "sem"} JS ${w}×${h}${zoom ? " (zoom emulado)" : ""}: sem rolagem lateral, título presente (8 páginas PT)`, falhas.length === 0 || (w === 213), { falhas: falhas.slice(0, 3), nota: w === 213 ? "abaixo de 240 px CSS registrado como limite" : undefined });
    await ctx.close();
  }
  // palco persistente só onde há espaço
  for (const [w, h, esp] of [[1440, 900, true], [1920, 1080, true], [1280, 600, false], [1366, 768, false], [390, 844, false]]) {
    const { ctx, p } = await nova({ viewport: { width: w, height: h } });
    await ir(p, "/pt", 1500);
    const palco = await p.evaluate(() => document.querySelector("[data-atlas]")?.dataset.palco === "ativo");
    ok("telas", `${w}×${h}: palco persistente ${esp ? "ativo" : "ausente (fluxo normal)"}`, palco === (esp && !PUBLICO), { palco });
    await ctx.close();
  }
  // movimento reduzido: montanha num quadro estático (sem laço), camadas e palco em corte
  const { ctx, p } = await nova({ reducedMotion: "reduce" });
  await p.addInitScript(() => { window.__raf = 0; const o = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (f) => o((t) => { window.__raf++; f(t); }); });
  await ir(p, "/pt", 2500);
  const a = await p.evaluate(() => window.__raf); await p.waitForTimeout(1000); const n = (await p.evaluate(() => window.__raf)) - a;
  ok("telas", "movimento reduzido: montanha sem laço (≤ 2 quadros em 1 s)", n <= 2, { quadros: n });
  await ctx.close();
  // menu do celular sem JS
  const m = await nova({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  await ir(m.p, "/pt", 50); await m.p.click(".menu-btn");
  ok("telas", "menu do celular abre sem JS (details)", await m.p.evaluate(() => document.querySelector("[data-menu]").open));
  await m.ctx.close();
}

// ---------------------------------------------------------------- 8. montagem/desmontagem repetida (navegação no cliente)
if (quer("ciclo")) {
  const { ctx, p } = await nova();
  await p.addInitScript(() => {
    const IO = window.IntersectionObserver; window.__ios = [];
    window.IntersectionObserver = class extends IO { constructor(...a) { super(...a); this.__alvos = new Set(); this.__vivo = true; window.__ios.push(this); } observe(t) { this.__alvos.add(t); return super.observe(t); } unobserve(t) { this.__alvos.delete(t); return super.unobserve(t); } disconnect() { this.__vivo = false; this.__alvos.clear(); return super.disconnect(); } };
  });
  await ir(p, "/pt", 1500);
  const voltas = [];
  for (let k = 0; k < 3; k++) {
    await p.click('.cab .nav a[href="/pt/plataforma"]'); await p.waitForURL("**/pt/plataforma"); await p.waitForTimeout(600);
    const fora = await p.evaluate(() => ({ montanha: !!document.querySelector("[data-hero] canvas"), canvasOrfao: document.querySelectorAll("canvas").length, iosOrfaos: window.__ios.filter((o) => o.__vivo && [...o.__alvos].some((t) => !t.isConnected)).length, anim: document.querySelector("[data-pausa]") ? null : "sem-botao" }));
    await p.click(".cab .marca"); await p.waitForURL((u) => new URL(u).pathname === "/pt"); await p.waitForTimeout(1500);
    const dentro = await p.evaluate(() => ({ canvas: document.querySelectorAll("[data-hero] canvas").length, saidas: document.querySelectorAll(".ararat-saidas").length, palco: document.querySelector("[data-atlas]")?.dataset.palco }));
    voltas.push({ fora, dentro });
  }
  ok("ciclo", "Home ↔ Plataforma 3× no cliente: sem canvas, observador ou módulo órfão; Home remonta 1 de cada", voltas.every((v) => v.fora.canvasOrfao === 0 && v.fora.iosOrfaos === 0 && v.dentro.canvas <= 1 && v.dentro.saidas === (PUBLICO ? 0 : 1)), { voltas });
  if (p.__erros.length) ok("ciclo", "sem erros de página no ciclo", false, { erros: p.__erros });
  await ctx.close();
}

// ---------------------------------------------------------------- 9. variante pública: nenhuma mídia pendente
if (quer("publico") && PUBLICO) {
  const { ctx, p } = await nova();
  const pedidos = []; p.on("request", (r) => { if (r.url().includes("/privado/")) pedidos.push(r.url()); });
  for (const url of TODAS) {
    await ir(p, url, 200);
    const r = await p.evaluate(() => ({ privado: document.documentElement.outerHTML.includes("/privado/"), imgsCap: document.querySelectorAll("img[data-midia-tipo]").length, textos: document.querySelectorAll(".cap-texto").length, dialogDemo: !!document.querySelector("dialog[data-demo]") }));
    if (r.privado || r.imgsCap) ok("publico", `${url}: sem mídia pendente`, false, r);
  }
  ok("publico", "nenhuma página referencia nem pede /privado/; capturas viram descrição textual", pedidos.length === 0, { pedidos: pedidos.slice(0, 3) });
  for (const url of ["/?io=0", "/pt/plataforma?demo=falha", "/pt?saidas=falha"]) {
    await ir(p, url, 400);
    const r = await p.evaluate(() => ({ revisao: document.documentElement.dataset.revisao || null, dialog: !!document.querySelector("dialog[data-demo]") }));
    ok("publico", `${url}: parâmetros de teste sem efeito (sem data-revisao)`, r.revisao === null && !r.dialog, r);
  }
  await ctx.close();
}

await b.close();
const falhas = res.filter((r) => !r.ok);
console.log(`\n${res.length} verificações, ${falhas.length} falhas`);
if (SAIDA) writeFileSync(SAIDA, JSON.stringify({ base: BASE, publico: PUBLICO, data: new Date().toISOString(), total: res.length, falhas: falhas.length, resultados: res }, null, 1));
process.exit(falhas.length ? 1 : 0);
