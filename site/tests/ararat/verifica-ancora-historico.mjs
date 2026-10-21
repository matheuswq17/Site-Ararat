#!/usr/bin/env node
/**
 * Histórico com âncora antiga, em qualquer página — fechamento da navegação, 15/10/2026 (3ª rodada).
 *   node tests/ararat/verifica-ancora-historico.mjs http://127.0.0.1:PORTA [saida.json] [--publico]
 * Caso da auditoria (Windows, build MZ_s1zeqOftjoxGEjKUeI): /pt/pesquisa#fichas, rolar até 2171, Empresa no cabeçalho,
 * voltar → voltava a 457 (a âncora). Critérios: a volta e o avanço respeitam a posição de leitura; carga direta por
 * âncora, link para seção, idioma, path, query e history.state preservados. Atual e candidata.
 * Saída por CLIQUE REAL DE MOUSE nas coordenadas do link (ver LEIAME-PALCO-RETORNO.md). Chromium headless, sem GPU.
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://127.0.0.1:3101").replace(/\/$/, "");
const SAIDA = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : null;
const PUBLICO = process.argv.includes("--publico");
const res = [];
const ok = (grupo, nome, passou, det = {}) => { res.push({ grupo, nome, ok: !!passou, ...det }); console.log(`${passou ? "ok  " : "FALHA"} [${grupo}] ${nome}${Object.keys(det).length ? " " + JSON.stringify(det).slice(0, 320) : ""}`); };
const b = await chromium.launch();
const nova = async (w = 1440, h = 900) => { const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); p.__erros = []; p.on("pageerror", (e) => p.__erros.push(e.message)); return { ctx, p }; };
const y = (p) => p.evaluate(() => Math.round(scrollY));
const url = (p) => p.evaluate(() => location.pathname + location.search + location.hash);
const assentar = async (p) => { let a = -1; for (let i = 0; i < 30; i++) { const v = await y(p); if (v === a) return v; a = v; await p.waitForTimeout(120); } return a; };
const rodaAte = async (p, alvo) => { await p.mouse.move(720, 450); for (let i = 0; i < 120; i++) { const v = await y(p); if (Math.abs(v - alvo) < 60) break; await p.mouse.wheel(0, v < alvo ? Math.min(240, alvo - v) : -Math.min(240, v - alvo)); await p.waitForTimeout(60); } await p.waitForTimeout(300); return assentar(p); };
const clicarCab = async (p, href) => { const c = await p.evaluate((h) => { const r = document.querySelector(`header .nav a[href="${h}"]`).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, href); await p.mouse.click(c[0], c[1]); await p.waitForURL("**" + href); await p.waitForTimeout(600); };
const voltar = async (p) => { await p.evaluate(() => history.back()); await p.waitForTimeout(400); return assentar(p); };
const avancar = async (p) => { await p.evaluate(() => history.forward()); await p.waitForTimeout(400); return assentar(p); };
const estado = (p) => p.evaluate(() => JSON.stringify(Object.keys(history.state || {}).sort()));

// ---- 1. página com âncora + leitura + saída + voltar/avançar (atual e candidata)
const CASOS = [
  ["Evidências #fichas → Empresa (caso da auditoria)", "/pt/pesquisa", "#fichas", 2171, "/pt/empresa"],
  ["Plataforma #adocao → Evidências", "/pt/plataforma", "#adocao", null, "/pt/pesquisa"],
  ["ES Evidencias #fichas → Empresa", "/es/investigacion", "#fichas", null, "/es/empresa"],
  ...(PUBLICO ? [] : [["Atlas #cap-hub → Plataforma", "/pt", "#cap-hub", null, "/pt/plataforma"]]),
];
for (const modo of ["atual", "candidata"]) {
  for (const [nome, rota, hash, alvoFixo, saida] of CASOS) {
    const { ctx, p } = await nova();
    await p.goto(`${BASE}${rota}?transicao=${modo}${hash}`, { waitUntil: "load" }).catch(() => {});
    if (!(await p.evaluate((h) => !!document.getElementById(h.slice(1)), hash))) { ok("historico", `${modo}: ${nome} — página ou âncora inexistente nesta variante`, rota.startsWith("/es"), { rota }); await ctx.close(); continue; }
    await p.waitForTimeout(800);
    const pouso = await assentar(p);
    const estado0 = await estado(p);
    const alvo = alvoFixo ?? pouso + 1700;
    const leitura = await rodaAte(p, alvo);
    const enderecoLendo = await url(p);
    if (!(await p.evaluate((h) => !!document.querySelector(`header .nav a[href="${h}"]`), saida))) { ok("historico", `${modo}: ${nome} — link de saída inexistente`, false, { saida }); await ctx.close(); continue; }
    await clicarCab(p, saida);
    const yVolta = await voltar(p); const urlVolta = await url(p);
    await clicarCab(p, saida); // de novo à frente, para avançar depois
    const yVolta2 = await voltar(p);
    const yAvanco = await avancar(p); const yVolta3 = await voltar(p);
    const r = { pouso, leitura, enderecoLendo, yVolta, urlVolta, yVolta2, yAvanco, yVolta3, estadoPreservado: estado0 === (await estado(p)), erros: p.__erros };
    ok("historico", `${modo}: ${nome} — pousa na âncora; lida até ${leitura}; volta, avança e volta de novo na posição de leitura; path e query preservados`,
      Math.abs(r.yVolta - leitura) <= 2 && Math.abs(r.yVolta2 - leitura) <= 2 && Math.abs(r.yVolta3 - leitura) <= 2 && r.yAvanco === 0
      && r.urlVolta === `${rota}?transicao=${modo}` && r.estadoPreservado && p.__erros.length === 0, r);
    await ctx.close();
  }
}

// ---- 2. o que precisa continuar igual
{ // carga direta por âncora: o endereço guarda a âncora enquanto o visitante não lê; recarga e volta vão à âncora
  const { ctx, p } = await nova();
  await p.goto(`${BASE}/pt/pesquisa#fichas`, { waitUntil: "load" }); await p.waitForTimeout(800);
  const pouso = await assentar(p); const u0 = await url(p);
  await p.mouse.move(720, 450); await p.mouse.wheel(0, 30); await p.waitForTimeout(400); // rolagem pequena (< 48 px)
  const u1 = await url(p);
  await clicarCab(p, "/pt/empresa"); const yv = await voltar(p);
  ok("preserva", "carga direta em #fichas sem leitura (rolagem de 30 px): âncora mantida no endereço; a volta vai à âncora", u0 === "/pt/pesquisa#fichas" && u1 === u0 && Math.abs(yv - pouso) <= 32, { pouso, u0, u1, yv });
  await ctx.close();
}
{ // link para seção em outra página (Home → Plataforma#adocao), voltar, avançar (sem leitura no destino)
  const { ctx, p } = await nova();
  await p.goto(`${BASE}/pt`, { waitUntil: "load" }); await p.waitForTimeout(900);
  const temLink = await p.evaluate(() => !!document.querySelector('main a[href="/pt/plataforma#adocao"]'));
  if (temLink) {
    await p.evaluate(() => document.querySelector('main a[href="/pt/plataforma#adocao"]').scrollIntoView({ block: "center" })); await p.waitForTimeout(400);
    const yHome = await assentar(p);
    const c = await p.evaluate(() => { const r = document.querySelector('main a[href="/pt/plataforma#adocao"]').getBoundingClientRect(); return [r.x + 8, r.y + r.height / 2]; });
    await p.mouse.click(c[0], c[1]); await p.waitForURL("**/pt/plataforma#adocao"); await p.waitForTimeout(900);
    const topoAdocao = await p.evaluate(() => Math.round(document.getElementById("adocao").getBoundingClientRect().top));
    const yv = await voltar(p); const ya = await avancar(p);
    const topoAvanco = await p.evaluate(() => Math.round(document.getElementById("adocao")?.getBoundingClientRect().top ?? -9999)); const ua = await url(p);
    ok("preserva", "link para seção (Home → /pt/plataforma#adocao): pousa na seção; voltar devolve a Home na posição; avançar volta à seção com a âncora", topoAdocao >= 60 && topoAdocao <= 100 && Math.abs(yv - yHome) <= 2 && topoAvanco >= 60 && topoAvanco <= 100 && ua === "/pt/plataforma#adocao", { yHome, topoAdocao, yv, ya, topoAvanco, ua });
  } else ok("preserva", "link para seção na Home: inexistente nesta variante", PUBLICO, {});
  await ctx.close();
}
{ // idioma com âncora (sem leitura): leva a seção
  const { ctx, p } = await nova();
  await p.goto(`${BASE}/pt/plataforma#adocao`, { waitUntil: "load" }); await p.waitForTimeout(800);
  const c = await p.evaluate(() => { const r = document.querySelector('header .idiomas a[data-idioma="es"]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await p.mouse.click(c[0], c[1]); await p.waitForURL("**/es/**"); await p.waitForTimeout(900);
  const r = await p.evaluate(() => ({ u: location.pathname + location.hash, top: document.getElementById("adocao") ? Math.round(document.getElementById("adocao").getBoundingClientRect().top) : null }));
  ok("preserva", "troca de idioma com a âncora no endereço (sem leitura): leva à mesma seção em ES", r.u.endsWith("#adocao") && r.top >= 60 && r.top <= 100, r);
  await ctx.close();
}
{ // leitura pelo teclado (PageDown) e no celular (390×844, roda), Evidências #fichas
  for (const [w, h, como] of [[1440, 900, "teclado"], [390, 844, "roda"]]) {
    const { ctx, p } = await nova(w, h);
    await p.goto(`${BASE}/pt/pesquisa#fichas`, { waitUntil: "load" }); await p.waitForTimeout(800); await assentar(p);
    if (como === "teclado") { await p.evaluate(() => document.activeElement?.blur()); for (let i = 0; i < 3; i++) { await p.keyboard.press("PageDown"); await p.waitForTimeout(250); } }
    else { await p.mouse.move(195, 400); for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 200); await p.waitForTimeout(60); } }
    const leitura = await assentar(p); const u = await url(p);
    const sair = await p.evaluate(() => { const a = document.querySelector('header .nav a[href="/pt/empresa"]'); return a && a.getBoundingClientRect().width > 0; });
    if (sair) await clicarCab(p, "/pt/empresa"); else { await p.evaluate(() => document.querySelector('a[href="/pt/empresa"]').click()); await p.waitForURL("**/pt/empresa"); await p.waitForTimeout(600); }
    const yv = await voltar(p);
    ok("historico", `${w}×${h}, leitura por ${como} em #fichas: a âncora sai do endereço e a volta fica na posição de leitura`, u === "/pt/pesquisa" && Math.abs(yv - leitura) <= 2, { leitura, u, yv });
    await ctx.close();
  }
}
{ // âncora sem alvo na página e hash que não é âncora: intocados
  const { ctx, p } = await nova();
  await p.goto(`${BASE}/pt/pesquisa#nao-existe`, { waitUntil: "load" }); await p.waitForTimeout(600);
  await rodaAte(p, 1500); const u = await url(p);
  ok("preserva", "hash sem alvo na página (#nao-existe): não é tocado pela leitura", u === "/pt/pesquisa#nao-existe", { u });
  await ctx.close();
}

// ---- 3. cada forma de ler, separadamente: teclado, roda, toque e barra de rolagem (arraste do polegar)
// A barra precisa de um Chromium com barras visíveis (o headless as esconde por padrão).
const bBarra = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
const PAGINAS = [["Evidências #fichas", "/pt/pesquisa", "#fichas", "/pt/empresa"], ["Plataforma #adocao", "/pt/plataforma", "#adocao", "/pt/pesquisa"], ...(PUBLICO ? [] : [["Atlas #cap-hub", "/pt", "#cap-hub", "/pt/plataforma"]])];
async function ler(p, como, movel) {
  if (como === "teclado") { await p.evaluate(() => document.activeElement?.blur()); for (let i = 0; i < 3; i++) { await p.keyboard.press("PageDown"); await p.waitForTimeout(250); } }
  else if (como === "roda") { await p.mouse.move(movel ? 195 : 720, 450); for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 200); await p.waitForTimeout(60); } }
  else if (como === "toque") {
    const cdp = await p.context().newCDPSession(p);
    for (let k = 0; k < 3; k++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 200, y: 700 }] });
      for (let i = 1; i <= 10; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 200, y: 700 - i * 50 }] }); await p.waitForTimeout(16); }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(250);
    }
  } else { // barra: arraste do polegar da barra de rolagem da página
    const g = await p.evaluate(() => { const H = document.documentElement.scrollHeight, h = innerHeight; return { x: innerWidth - 7, y: Math.round(scrollY / H * h + (h * h / H) / 2), cw: document.documentElement.clientWidth, iw: innerWidth }; });
    if (g.cw >= g.iw) return "sem barra visível";
    await p.mouse.move(g.x, g.y); await p.mouse.down();
    for (let i = 1; i <= 8; i++) { await p.mouse.move(g.x, g.y + i * 20); await p.waitForTimeout(40); }
    await p.mouse.up();
  }
  await p.waitForTimeout(400); return null;
}
for (const [nome, rota, hash, saida] of PAGINAS) for (const como of ["teclado", "roda", "toque", "barra"]) {
  const movel = como === "toque";
  const ctx = await (como === "barra" ? bBarra : b).newContext({ viewport: movel ? { width: 390, height: 844 } : { width: 1440, height: 900 }, ...(movel ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}) });
  const p = await ctx.newPage(); p.__erros = []; p.on("pageerror", (e) => p.__erros.push(e.message));
  await p.goto(`${BASE}${rota}?transicao=candidata${hash}`, { waitUntil: "load" }); await p.waitForTimeout(900);
  const pouso = await assentar(p);
  const impedido = await ler(p, como, movel);
  if (impedido) { ok("metodos", `${nome} — ${como}: ${impedido}`, false, {}); await ctx.close(); continue; }
  const leitura = await assentar(p); const u = await url(p);
  await p.evaluate((h) => document.querySelector(`a[href="${h}"]`).click(), saida); await p.waitForURL("**" + saida); await p.waitForTimeout(600);
  const yv = await voltar(p); const uv = await url(p);
  ok("metodos", `${nome} — leitura por ${como}${movel ? " (390×844)" : ""}: a âncora sai do endereço (query mantida); a volta fica na posição de leitura`, leitura - pouso > 48 && u === `${rota}?transicao=candidata` && Math.abs(yv - leitura) <= 2 && uv === u && p.__erros.length === 0, { pouso, leitura, u, yv, uv });
  await ctx.close();
}
await bBarra.close();

// ---- 4. posicionamento programático NÃO apaga a âncora (com e sem clique antes no conteúdo)
{
  const { ctx, p } = await nova();
  await p.goto(`${BASE}/pt/pesquisa#fichas`, { waitUntil: "load" }); await p.waitForTimeout(800); await assentar(p);
  await p.evaluate(() => scrollTo(0, scrollY + 900)); await p.waitForTimeout(300); const u1 = await url(p);
  const c = await p.evaluate(() => { const r = document.querySelector("#conteudo p").getBoundingClientRect(); return [r.x + 5, Math.max(120, r.y + 5)]; });
  await p.mouse.click(c[0], c[1]); await p.evaluate(() => document.getElementById("fichas").scrollIntoView()); await p.waitForTimeout(300);
  await p.evaluate(() => scrollTo({ top: scrollY + 700, behavior: "smooth" })); await p.waitForTimeout(900); const u2 = await url(p);
  ok("preserva", "rolagem programática (scrollTo, scrollIntoView, rolagem suave), inclusive logo depois de um clique no texto: a âncora fica", u1 === "/pt/pesquisa#fichas" && u2 === u1, { u1, u2 });
  await ctx.close();
}

await b.close();
const falhas = res.filter((r) => !r.ok).length;
console.log(`\n${res.length} verificações, ${falhas} falhas`);
if (SAIDA) writeFileSync(SAIDA, JSON.stringify({ base: BASE, publico: PUBLICO, data: new Date().toISOString(), total: res.length, falhas, res }, null, 1));
process.exit(falhas ? 1 : 0);
