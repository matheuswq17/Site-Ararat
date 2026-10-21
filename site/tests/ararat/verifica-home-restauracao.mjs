#!/usr/bin/env node
/**
 * Volta à Home pelo histórico em notebooks (fechamento técnico, 15/10/2026).
 *   node tests/ararat/verifica-home-restauracao.mjs http://127.0.0.1:PORTA [saida.json] [--publico]
 * Caso do Codex (Windows, 1280×600): Home em 4062, clique real em Plataforma no cabeçalho, voltar → 3963 (−99 px). A
 * abertura nascia com a geometria do servidor e só recebia a composição depois de a rolagem ter sido devolvida.
 * Critérios: no 1º quadro da volta a abertura já tem a altura final e a rolagem é a de saída; nenhum quadro depois
 * corrige a posição. Atual e candidata; voltar e avançar; fontes atrasadas (1ª carga); resize entre idas e voltas;
 * idiomas. Saída por CLIQUE REAL DE MOUSE (ver LEIAME-PALCO-RETORNO.md). Chromium headless, sem GPU.
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://127.0.0.1:3101").replace(/\/$/, "");
const SAIDA = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : null;
const PUBLICO = process.argv.includes("--publico");
const res = [];
const ok = (grupo, nome, passou, det = {}) => { res.push({ grupo, nome, ok: !!passou, ...det }); console.log(`${passou ? "ok  " : "FALHA"} [${grupo}] ${nome}${Object.keys(det).length ? " " + JSON.stringify(det).slice(0, 300) : ""}`); };
const b = await chromium.launch();
const SONDA = () => {
  window.__gravar = (ms = 1500) => { window.__q = []; const t0 = performance.now(); const f = () => { const h = document.querySelector("[data-hero]"); window.__q.push({ t: Math.round(performance.now() - t0), path: location.pathname, y: Math.round(scrollY), heroH: h ? Math.round(h.getBoundingClientRect().height) : null, variante: h?.dataset.variante || null }); if (performance.now() - t0 < ms) requestAnimationFrame(f); }; requestAnimationFrame(f); };
};
const nova = async (w, h, o = {}) => { const { rotas, ...rest } = o; const ctx = await b.newContext({ viewport: { width: w, height: h }, ...rest }); await ctx.addInitScript(SONDA); if (rotas) await rotas(ctx); const p = await ctx.newPage(); p.__erros = []; p.on("pageerror", (e) => p.__erros.push(e.message)); return { ctx, p }; };
const y = (p) => p.evaluate(() => Math.round(scrollY));
const heroH = (p) => p.evaluate(() => Math.round(document.querySelector("[data-hero]").getBoundingClientRect().height));
const clicar = async (p, sel) => { const c = await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel); await p.mouse.click(c[0], c[1]); };
const LINK = { "/pt": ['header .nav a[href="/pt/plataforma"]', "/pt/plataforma"], "/es": ['header .nav a[href="/es/plataforma"]', "/es/plataforma"], "/": ['header .nav a[href="/platform"]', "/platform"] };
const traversar = async (p, dir, ms = 1500) => { await p.evaluate(({ dir, ms }) => { dir < 0 ? history.back() : history.forward(); window.__gravar(ms); }, { dir, ms }); await p.waitForTimeout(ms + 200); return (await p.evaluate(() => window.__q)).filter((x) => x.heroH !== null); };
const resumo = (q) => ({ primeiro: q[0], ys: [...new Set(q.map((x) => x.y))], alturas: [...new Set(q.map((x) => x.heroH))], final: q.at(-1) });

// ---- 1. notebooks: Home rolada, Plataforma pelo cabeçalho, voltar, avançar, voltar (atual e candidata)
const TELAS = [[1280, 600], [1280, 720], [1366, 768], [1536, 864]];
for (const [w, h] of TELAS) for (const modo of ["atual", "candidata"]) {
  const { ctx, p } = await nova(w, h);
  await p.goto(`${BASE}/pt?transicao=${modo}`, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
  const alvo = Math.min(4062, await p.evaluate(() => document.documentElement.scrollHeight - innerHeight - 50));
  await p.evaluate((v) => scrollTo(0, v), alvo); await p.waitForTimeout(500);
  const ySaida = await y(p), hSaida = await heroH(p);
  await clicar(p, LINK["/pt"][0]); await p.waitForURL("**" + LINK["/pt"][1]); await p.waitForTimeout(700);
  const v1 = await traversar(p, -1);
  await clicar(p, LINK["/pt"][0]); await p.waitForURL("**" + LINK["/pt"][1]); await p.waitForTimeout(700);
  const v2 = await traversar(p, -1);
  await p.evaluate(() => history.forward()); await p.waitForURL("**" + LINK["/pt"][1]); await p.waitForTimeout(700);
  const v3 = await traversar(p, -1);
  const r = { ySaida, hSaida, volta1: resumo(v1), volta2: resumo(v2), volta3: resumo(v3), erros: p.__erros };
  const certo = (q) => q.length > 5 && q.every((x) => x.y === ySaida && x.heroH === hSaida);
  ok("notebook", `${w}×${h} ${modo}: Home em ${ySaida}, Plataforma, voltar (3 vezes, com avançar no meio) — 1º quadro já com a abertura em ${hSaida} px e a rolagem de saída; nenhum quadro depois muda`, certo(v1) && certo(v2) && certo(v3) && p.__erros.length === 0, r);
  await ctx.close();
}

// ---- 2. resize entre a saída e a volta: a abertura volta com a composição da janela NOVA (sem medida guardada)
{
  const { ctx, p } = await nova(1440, 900);
  await p.goto(`${BASE}/pt`, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
  const v0 = await p.evaluate(() => window.__abertura?.variante);
  await p.evaluate(() => scrollTo(0, 3000)); await p.waitForTimeout(300);
  await clicar(p, LINK["/pt"][0]); await p.waitForURL("**/pt/plataforma"); await p.waitForTimeout(500);
  await p.setViewportSize({ width: 1280, height: 600 }); await p.waitForTimeout(400);
  const v = await traversar(p, -1);
  // referência: carga direta nessa janela
  const { ctx: c2, p: p2 } = await nova(1280, 600);
  await p2.goto(`${BASE}/pt`, { waitUntil: "load" }); await p2.evaluate(() => document.fonts.ready); await p2.waitForTimeout(1200);
  const ref = await p2.evaluate(() => ({ h: Math.round(document.querySelector("[data-hero]").getBoundingClientRect().height), v: window.__abertura?.variante, W: window.__abertura?.W }));
  const ab = await p.evaluate(() => ({ v: window.__abertura?.variante, W: window.__abertura?.W }));
  ok("resize", "1440×900 → Plataforma → janela 1280×600 → voltar: a abertura nasce com a composição da janela nova, igual à carga direta (o decisor guardado não guarda medidas)", v[0]?.heroH === ref.h && ab.v === ref.v && ab.W === ref.W && new Set(v.map((x) => x.heroH)).size === 1, { antes: v0, depois: ab, ref, alturas: [...new Set(v.map((x) => x.heroH))] });
  await ctx.close(); await c2.close();
}

// ---- 3. idiomas (ES e EN): mesma volta em 1280×600
for (const l of ["/es", "/"]) {
  const { ctx, p } = await nova(1280, 600);
  await p.goto(`${BASE}${l}`, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
  await p.evaluate(() => scrollTo(0, 3500)); await p.waitForTimeout(400);
  const ySaida = await y(p), hSaida = await heroH(p);
  await clicar(p, LINK[l][0]); await p.waitForURL("**" + LINK[l][1]); await p.waitForTimeout(700);
  const v = await traversar(p, -1);
  ok("idioma", `${l === "/" ? "EN" : "ES"} 1280×600: volta à Home com a abertura final no 1º quadro e a rolagem de saída`, v.length > 5 && v.every((x) => x.y === ySaida && x.heroH === hSaida), { ySaida, hSaida, ...resumo(v) });
  await ctx.close();
}

// ---- 4. fontes atrasadas na 1ª carga (2 s): a composição espera as fontes; depois a volta continua certa
{
  const { ctx, p } = await nova(1280, 600, { rotas: (c) => c.route(/\.(woff2?|ttf)(\?|$)/, async (r) => { await new Promise((s) => setTimeout(s, 2000)); await r.continue(); }) });
  await p.goto(`${BASE}/pt`, { waitUntil: "load" }); await p.waitForTimeout(3500);
  const final = await p.evaluate(() => ({ h: Math.round(document.querySelector("[data-hero]").getBoundingClientRect().height), fontes: document.fonts.status }));
  await p.evaluate(() => scrollTo(0, 3500)); await p.waitForTimeout(400);
  const ySaida = await y(p);
  await clicar(p, LINK["/pt"][0]); await p.waitForURL("**/pt/plataforma"); await p.waitForTimeout(700);
  const v = await traversar(p, -1);
  ok("fontes", "fontes atrasadas 2 s na 1ª carga: depois de carregadas, a volta à Home tem a abertura final no 1º quadro", final.fontes === "loaded" && v.every((x) => x.y === ySaida && x.heroH === final.h), { final, ySaida, ...resumo(v) });
  await ctx.close();
}

// ---- 5. remontagem e carga direta: pausa e reduzido mantidos; a carga direta continua decidindo depois das fontes
{
  const { ctx, p } = await nova(1280, 600, { reducedMotion: "reduce" });
  await p.goto(`${BASE}/pt`, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
  await p.evaluate(() => window.ARARAT_MOVIMENTO?.definir(true));
  await p.evaluate(() => scrollTo(0, 3000)); await p.waitForTimeout(300);
  const ySaida = await y(p), hSaida = await heroH(p);
  await clicar(p, LINK["/pt"][0]); await p.waitForURL("**/pt/plataforma"); await p.waitForTimeout(600);
  const v = await traversar(p, -1);
  const est = await p.evaluate(() => ({ mov: document.documentElement.dataset.movimento, montanha: document.querySelector("[data-hero]").dataset.montanha }));
  ok("estados", "movimento reduzido + pausa: a volta mantém abertura e rolagem desde o 1º quadro; pausa preservada", v.every((x) => x.y === ySaida && x.heroH === hSaida) && est.mov === "pausado", { ySaida, hSaida, est, ...resumo(v) });
  await ctx.close();
}

// ---- 6. rodapé: crédito das imagens PROSTATEx só onde a variante exibe imagens (revisão privada); na variante sem
// capturas o rodapé fica só com a frase da revisão pelo radiologista, e nenhuma página mostra imagem PROSTATEx
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage();
  const r = [];
  for (const u of ["/", "/pt", "/es", "/pt/plataforma", "/es/plataforma", "/platform", "/pt/pesquisa", "/pt/empresa", "/pt/solucoes/prostata", "/solutions/prostate-mri"]) {
    const resp = await p.goto(BASE + u, { waitUntil: "load" }).catch(() => null);
    if (!resp || resp.status() !== 200) { r.push({ u, status: resp?.status() ?? null }); continue; }
    r.push(await p.evaluate((u) => ({ u, aviso: document.querySelector(".rodape .aviso")?.textContent || "", imgsCaptura: [...document.querySelectorAll("img")].filter((i) => /\/(privado|ararat\/capturas)\//.test(i.currentSrc || i.src)).length }), u));
  }
  const comCredito = r.filter((x) => /PROSTATEx/.test(x.aviso || ""));
  if (PUBLICO) ok("rodape", "variante sem capturas: nenhum rodapé afirma que imagens PROSTATEx são exibidas; nenhuma página tem captura; frase da revisão presente", r.every((x) => x.status === undefined) && comCredito.length === 0 && r.every((x) => x.imgsCaptura === 0 && x.aviso.length > 20), { r: r.map((x) => `${x.u}: ${(x.aviso || "").slice(0, 60)} (${x.imgsCaptura})`) });
  else ok("rodape", "revisão privada: o crédito PROSTATEx (TCIA, CC BY 3.0) continua no rodapé das páginas, que exibem as capturas", r.every((x) => x.status === undefined) && comCredito.length === r.length && r.some((x) => x.imgsCaptura > 0), { r: r.map((x) => `${x.u}: ${x.imgsCaptura}`) });
  await ctx.close();
}

await b.close();
const falhas = res.filter((r) => !r.ok).length;
console.log(`\n${res.length} verificações, ${falhas} falhas`);
if (SAIDA) writeFileSync(SAIDA, JSON.stringify({ base: BASE, data: new Date().toISOString(), total: res.length, falhas, res }, null, 1));
process.exit(falhas ? 1 : 0);
