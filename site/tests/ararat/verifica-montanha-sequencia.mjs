#!/usr/bin/env node
/**
 * Sequência visual da montanha na Home (20/10/2026; critérios do Motion, COORDENACAO-LINHAS-MONTANHA §3/§5.4).
 *   node tests/ararat/verifica-montanha-sequencia.mjs http://127.0.0.1:PORTA [saida.json] [--publico] [--grupos=a,b]
 *        [--montanha=candidata|anterior]  (revisão privada: a mesma verificação com a montanha candidata)
 * A exclusividade poster/canvas não prova continuidade. Duas medidas por quadro:
 *   - rAF (estado do DOM e pixels do próprio canvas 2D, legível): qual fonte está visível; tinta do canvas numa redução
 *     96×48 comparada com o canvas em repouso. Pega: as duas fontes juntas, nenhuma fonte visível, canvas visível e
 *     vazio, canvas visível incompleto (< 90 %: abertura recomeçando, canvas limpo).
 *   - quadros PINTADOS (CDP screencast): tinta na área de .hero-arte na tela, comparada com o quadro final. Pega
 *     quadro vazio (< 15 % do final) depois de a arte já ter aparecido — inclusive o do poster, que o estado do <img>
 *     (complete) não revela com segurança.
 *   - geometria: o retângulo de .hero-arte muda depois da composição.
 * Também: falha do módulo, pausa e reduzido (na carga e no meio), sem JS, resize, volta no app e desmontagem, e os
 * sha256 dos pacotes servidos. Chromium headless sem GPU; não substitui a observação no navegador do proprietário.
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const BASE = (process.argv[2] || "http://127.0.0.1:3360").replace(/\/$/, "");
const SAIDA = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : null;
const PUBLICO = process.argv.includes("--publico");
const GRUPOS = ((process.argv.find((a) => a.startsWith("--grupos=")) || "").slice(9) || "").split(",").filter(Boolean);
const roda = (g) => !GRUPOS.length || GRUPOS.includes(g);
// --montanha=candidata|anterior: a mesma verificação com a montanha candidata da revisão privada (guardada na aba)
const MONTANHA = (process.argv.find((a) => a.startsWith("--montanha=")) || "").slice(11) || null;
const res = [];
const ok = (grupo, nome, passou, det = {}) => { res.push({ grupo, nome, ok: !!passou, ...det }); console.log(`${passou ? "ok  " : "FALHA"} [${grupo}] ${nome}${Object.keys(det).length ? " " + JSON.stringify(det).slice(0, 420) : ""}`); };
const b = await chromium.launch({ args: ["--disable-features=BackForwardCache"] });

const SONDA = () => {
  window.__q = [];
  const mini = new OffscreenCanvas(96, 48); const mx = mini.getContext("2d", { willReadFrequently: true });
  const tinta = (src) => { try { mx.clearRect(0, 0, 96, 48); mx.drawImage(src, 0, 0, 96, 48); const d = mx.getImageData(0, 0, 96, 48).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 40 && (d[i] + d[i + 1] + d[i + 2]) / 3 > 45) n++; return n; } catch { return -1; } };
  window.__tinta = tinta;
  const f = () => {
    const hero = document.querySelector("[data-hero]");
    if (hero) {
      const pic = hero.querySelector(".hero-arte picture"), img = pic?.querySelector("img"), host = hero.querySelector(".hero-host"), cv = host?.querySelector("canvas");
      const arte = hero.querySelector(".hero-arte")?.getBoundingClientRect();
      const picV = !!pic && getComputedStyle(pic).visibility === "visible", hostV = !!host && getComputedStyle(host).visibility === "visible";
      const pT = picV && img?.complete && img.naturalWidth ? tinta(img) : 0;
      const cT = hostV && cv && cv.width ? tinta(cv) : 0;
      window.__q.push({ t: Math.round(performance.now()), p: location.pathname, m: hero.dataset.montanha, picV, hostV, pT, cT, intro: cv?.dataset.intro || "", comp: hero.hasAttribute("data-composta"), r: arte ? [arte.x, arte.y, arte.width, arte.height].map(Math.round).join(",") : "" });
    } else window.__q.push({ t: Math.round(performance.now()), p: location.pathname, semHero: true });
    if (window.__q.length < 6000) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
};
const dec = await (await b.newContext()).newPage(); // decodifica os quadros do screencast
const tintaTela = (quadros, r) => dec.evaluate(async ({ qs, r }) => {
  const out = [];
  for (const q of qs) {
    const bm = await createImageBitmap(await (await fetch("data:image/jpeg;base64," + q.data)).blob());
    const c = new OffscreenCanvas(Math.max(1, Math.round(r.w)), Math.max(1, Math.round(r.h))); const x = c.getContext("2d");
    x.drawImage(bm, r.x, r.y, r.w, r.h, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0;
    for (let i = 0; i < d.length; i += 16) if ((d[i] + d[i + 1] + d[i + 2]) / 3 > 60) n++;
    out.push({ t: q.t, n });
  }
  return out;
}, { qs: quadros, r });
const filmar = async (ctx, p) => {
  const c = await ctx.newCDPSession(p); const quadros = [];
  c.on("Page.screencastFrame", async (f) => { quadros.push({ t: f.metadata.timestamp * 1000, data: f.data }); try { await c.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch {} });
  return { iniciar: async () => { quadros.length = 0; await c.send("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1 }); }, parar: async () => { await c.send("Page.stopScreencast"); return quadros.slice(); } };
};
// quadros pintados: depois de a arte aparecer (≥ 15 % do quadro final), nenhum abaixo de 15 %
const julgarTela = async (p, quadros, desde = null) => {
  const r = await p.evaluate(() => { const q = document.querySelector("[data-hero] .hero-arte").getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height }; });
  const t0 = await p.evaluate(() => performance.timeOrigin);
  const fs = (await tintaTela(quadros, r)).filter((x) => x.t >= t0).sort((a, c) => a.t - c.t);
  const ref = fs.length ? fs[fs.length - 1].n : 0;
  // começa no 1º quadro em que o poster já estava decodificado e visível (rAF), não na página ainda sem arte
  const i0 = fs.findIndex((x) => x.n >= ref * 0.15 && (desde == null || x.t - t0 >= desde));
  const vazios = i0 < 0 ? [] : fs.slice(i0).filter((x) => x.n < ref * 0.15).map((x) => Math.round(x.t - t0));
  return { pintados: fs.length, telaVazia: vazios.length, telaVaziaEm: vazios.slice(0, 4) };
};
const nova = async (w, h, o = {}) => {
  const { pausado, cpu, rotas, ...rest } = o;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, ...rest });
  await ctx.addInitScript(SONDA);
  if (MONTANHA) await ctx.addInitScript((v) => { try { sessionStorage.setItem("ararat:montanha-versao", v); } catch {} }, MONTANHA);
  if (pausado) await ctx.addInitScript(() => { try { if (!sessionStorage.getItem("ararat:paused")) sessionStorage.setItem("ararat:paused", "1"); } catch {} });
  if (rotas) await rotas(ctx);
  const p = await ctx.newPage(); p.__erros = [];
  p.on("pageerror", (e) => p.__erros.push(e.message));
  if (cpu) { const c = await ctx.newCDPSession(p); await c.send("Emulation.setCPUThrottlingRate", { rate: cpu }); }
  return { ctx, p };
};
const qs = (p) => p.evaluate(() => window.__q);
const zera = (p) => p.evaluate(() => { window.__q = []; });
// referência de cada fonte: poster carregado; canvas em repouso (medidos na própria página no fim)
const refs = (p) => p.evaluate(() => {
  const hero = document.querySelector("[data-hero]"); const img = hero.querySelector(".hero-arte picture img"); const cv = hero.querySelector(".hero-host canvas");
  return { poster: img?.complete && img.naturalWidth ? window.__tinta(img) : 0, canvas: cv && cv.width ? window.__tinta(cv) : 0 };
});
// julga a sequência: a partir do 1º quadro com poster pintado
const julgar = (q, ref, { exigeCanvas = true } = {}) => {
  const fs = q.filter((x) => !x.semHero);
  const i0 = fs.findIndex((x) => x.pT > 0);
  const s = i0 < 0 ? [] : fs.slice(i0);
  const vazio = [], parcial = [], duplo = [];
  for (const x of s) {
    if (x.picV && x.hostV) duplo.push(x.t);
    if (!x.picV && !x.hostV) { vazio.push(x.t); continue; } // nenhuma fonte visível
    if (x.hostV) { // canvas à vista: os pixels dele são legíveis
      const vC = ref.canvas ? x.cT / ref.canvas : 0;
      if (x.cT <= 0) vazio.push(x.t); else if (vC < 0.9) parcial.push({ t: x.t, v: +vC.toFixed(2), intro: x.intro });
    } // poster à vista: julgado pelos quadros pintados (julgarTela)
  }
  const retangulos = [...new Set(s.filter((x) => x.comp).map((x) => x.r))];
  const fonte = s.length ? (s[s.length - 1].hostV ? "canvas" : s[s.length - 1].picV ? "poster" : "nenhuma") : "nenhuma";
  const trocaEm = s.find((x) => x.m === "canvas")?.t ?? null;
  return { quadros: s.length, posterDesde: s[0]?.t ?? null, trocaEm, vazio: vazio.length, vazioEm: vazio.slice(0, 4), parcial: parcial.length, parcialEm: parcial.slice(0, 4), duplo: duplo.length, retangulos: retangulos.length, fonteFinal: fonte, passa: i0 >= 0 && !vazio.length && !parcial.length && !duplo.length && retangulos.length <= 1 && (!exigeCanvas || fonte === "canvas") };
};

const TELAS = [[1440, 900], [1366, 768], [1280, 720], [390, 844]];
const HOMES = PUBLICO ? ["/pt"] : ["/pt", "/", "/es"];

if (roda("sequencia")) {
  for (const [w, h] of TELAS) for (const rota of HOMES) for (const cpu of [1, 4]) {
    if (cpu === 4 && rota !== "/pt") continue;
    const { ctx, p } = await nova(w, h, { cpu });
    const filme = await filmar(ctx, p);
    for (const visita of [1, 2]) {
      await filme.iniciar();
      await p.goto(BASE + rota, { waitUntil: "load" }); await p.waitForTimeout(cpu > 1 ? 6000 : 3500);
      const film = await filme.parar(); const q = await qs(p), ref = await refs(p);
      const tela = await julgarTela(p, film, q.find((x) => x.pT > 0 || x.cT > 0)?.t ?? null);
      const j = julgar(q, ref);
      ok("sequencia", `${w}x${h} ${rota} ${visita}ª visita${cpu > 1 ? `, CPU ${cpu}×` : ""}: poster → canvas sem quadro vazio, sem montanha incompleta`, j.passa && !tela.telaVazia && !p.__erros.length, { ...j, ...tela, ref, erros: p.__erros });
    }
    await ctx.close();
  }
}

if (roda("estados")) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    { // falha do módulo
      const { ctx, p } = await nova(w, h, { rotas: (c) => c.route(/home-sculpture\.js/, (r) => r.abort("failed")) });
      const filme = await filmar(ctx, p); await filme.iniciar();
      await p.goto(BASE + "/pt", { waitUntil: "load" }); await p.waitForTimeout(3000);
      const film = await filme.parar(); const q = await qs(p), ref = await refs(p);
      const tela = await julgarTela(p, film, q.find((x) => x.pT > 0 || x.cT > 0)?.t ?? null); const j = julgar(q, ref, { exigeCanvas: false });
      ok("estados", `${w}x${h} falha do módulo: só o poster, completo, em todos os quadros`, j.passa && !tela.telaVazia && j.fonteFinal === "poster" && j.trocaEm === null, { ...j, ...tela });
      await ctx.close();
    }
    if (!PUBLICO) { // ?montanha=falha (parâmetro da revisão)
      const { ctx, p } = await nova(w, h);
      const filme = await filmar(ctx, p); await filme.iniciar();
      await p.goto(BASE + "/pt?montanha=falha", { waitUntil: "load" }); await p.waitForTimeout(3000);
      const film = await filme.parar(); const q = await qs(p), ref = await refs(p);
      const tela = await julgarTela(p, film, q.find((x) => x.pT > 0 || x.cT > 0)?.t ?? null); const j = julgar(q, ref, { exigeCanvas: false });
      ok("estados", `${w}x${h} ?montanha=falha: só o poster, completo`, j.passa && !tela.telaVazia && j.fonteFinal === "poster", { ...j, ...tela });
      await ctx.close();
    }
    for (const modo of ["pausa", "reduzido"]) { // na carga
      const { ctx, p } = await nova(w, h, modo === "pausa" ? { pausado: true } : { reducedMotion: "reduce" });
      const filme = await filmar(ctx, p); await filme.iniciar();
      await p.goto(BASE + "/pt", { waitUntil: "load" }); await p.waitForTimeout(3000);
      const film = await filme.parar(); const q = await qs(p), ref = await refs(p);
      const tela = await julgarTela(p, film, q.find((x) => x.pT > 0 || x.cT > 0)?.t ?? null); const j = julgar(q, ref);
      ok("estados", `${w}x${h} ${modo} na carga: poster → canvas completo, sem vazio`, j.passa && !tela.telaVazia, { ...j, ...tela });
      await ctx.close();
    }
    { // pausa, reduzido e resize com a montanha já no canvas
      const { ctx, p } = await nova(w, h);
      await p.goto(BASE + "/pt", { waitUntil: "load" }); await p.waitForTimeout(2500); await zera(p);
      await p.evaluate(() => window.ARARAT_MOVIMENTO?.definir(true)); await p.waitForTimeout(500);
      await p.emulateMedia({ reducedMotion: "reduce" }); await p.waitForTimeout(500);
      await p.evaluate(() => window.ARARAT_MOVIMENTO?.definir(false)); await p.emulateMedia({ reducedMotion: "no-preference" }); await p.waitForTimeout(500);
      const ref = await refs(p);
      const q = (await qs(p)).filter((x) => !x.semHero);
      const ruins = q.filter((x) => !(x.hostV && !x.picV && x.cT >= ref.canvas * 0.9)).length;
      ok("estados", `${w}x${h} pausa e reduzido ligados e desligados com o canvas à vista: canvas completo em todos os quadros`, ruins === 0 && q.length > 20, { quadros: q.length, ruins });
      await zera(p);
      const w2 = w > 900 ? 1100 : 844, h2 = w > 900 ? h : 390;
      const filme = await filmar(ctx, p);
      // ida: a tela muda de tamanho; compara cada quadro pintado com o último da mesma largura
      await filme.iniciar(); await p.setViewportSize({ width: w2, height: h2 }); await p.waitForTimeout(900);
      const ida = await julgarTela(p, await filme.parar());
      await filme.iniciar(); await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(900);
      const volta = await julgarTela(p, await filme.parar());
      const q2 = (await qs(p)).filter((x) => !x.semHero);
      const duplos = q2.filter((x) => x.picV && x.hostV).length, nenhuma = q2.filter((x) => !x.picV && !x.hostV).length;
      ok("estados", `${w}x${h} resize (${w2}x${h2} e volta): nenhum quadro pintado vazio, nunca as duas fontes`, !ida.telaVazia && !volta.telaVazia && !duplos && !nenhuma, { ida, volta, duplos, nenhuma });
      await ctx.close();
    }
    if (!PUBLICO) { // controle do resize: só o poster (?montanha=falha). Se aqui também houver quadro vazio, é a
      // própria troca de tamanho do Chromium headless, não a montanha
      const { ctx, p } = await nova(w, h);
      await p.goto(BASE + "/pt?montanha=falha", { waitUntil: "load" }); await p.waitForTimeout(2500);
      const filme = await filmar(ctx, p); const w2 = w > 900 ? 1100 : 844, h2 = w > 900 ? h : 390;
      await filme.iniciar(); await p.setViewportSize({ width: w2, height: h2 }); await p.waitForTimeout(900);
      const ida = await julgarTela(p, await filme.parar());
      await filme.iniciar(); await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(900);
      const volta = await julgarTela(p, await filme.parar());
      ok("estados", `${w}x${h} controle: resize só com o poster (informativo)`, true, { ida, volta });
      await ctx.close();
    }
    { // sem JS
      const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false });
      const p = await ctx.newPage(); await p.goto(BASE + "/pt", { waitUntil: "load" }); await p.waitForTimeout(800);
      const r = await p.evaluate(() => { const hero = document.querySelector("[data-hero]"); const pic = hero.querySelector(".hero-arte picture"); const img = pic.querySelector("img"); const host = hero.querySelector(".hero-host"); return { at: hero.dataset.montanha, pic: getComputedStyle(pic).visibility, img: img.complete && img.naturalWidth > 0, host: host ? getComputedStyle(host).visibility : null }; });
      ok("estados", `${w}x${h} sem JS: poster completo, área do canvas oculta`, r.at === "poster" && r.pic === "visible" && r.img && r.host !== "visible", r);
      await ctx.close();
    }
  }
}

if (roda("app")) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { ctx, p } = await nova(w, h);
    await p.goto(BASE + "/pt", { waitUntil: "load" }); await p.waitForTimeout(2500);
    const ref = await refs(p);
    await zera(p);
    // sair no app (desmontagem: a página antiga pode continuar à vista na saída) e voltar no app
    await p.evaluate(() => document.querySelector("a[href='/pt/empresa']")?.click()); await p.waitForURL(/empresa/); await p.waitForTimeout(1200);
    const saida = (await qs(p)).filter((x) => !x.semHero && x.p === "/pt");
    const saidaRuim = saida.filter((x) => (x.pT <= 0 && x.cT <= 0) || (x.picV && x.hostV)).length;
    await zera(p); await p.goBack(); await p.waitForURL(/\/pt$/); await p.waitForTimeout(2500);
    const q = await qs(p); const j = julgar(q, ref);
    ok("app", `${w}x${h} sair da Home no app e voltar: saída sem quadro vazio; volta poster → canvas sem vazio`, j.passa && !saidaRuim, { saida: saida.length, saidaRuim, ...j });
    await ctx.close();
  }
}

if (roda("pacotes")) {
  const arqs = ["/previa/home-montanha-1.2.1-03d2/web/home-sculpture.js", "/previa/home-montanha-1.2.1-03d2/manifest.json"];
  if (!PUBLICO) arqs.push("/previa/home-montanha-1.3.1-03d2-candidato/web/home-sculpture.js", "/previa/home-montanha-1.3.1-03d2-candidato/manifest.json", "/previa/home-montanha-1.3.0-03d2-candidato/web/home-sculpture.js", "/previa/home-montanha-1.3.0-03d2-candidato/manifest.json");
  const esperado = { "1.2.1-03d2/web/home-sculpture.js": "f919d61d", "1.3.1-03d2-candidato/web/home-sculpture.js": "014e0257", "1.3.1-03d2-candidato/manifest.json": "798b37d0", "1.3.0-03d2-candidato/web/home-sculpture.js": "1ef10fb2", "1.2.1-03d2/manifest.json": "9b03f904", "1.3.0-03d2-candidato/manifest.json": "d628b463" };
  for (const a of arqs) {
    const r = await fetch(BASE + a); const h = createHash("sha256").update(Buffer.from(await r.arrayBuffer())).digest("hex");
    const k = Object.keys(esperado).find((x) => a.endsWith(x));
    ok("pacotes", `${a} servido intacto`, r.ok && h.startsWith(esperado[k]), { sha256: h.slice(0, 16) });
  }
}

await b.close();
const falhas = res.filter((r) => !r.ok).length;
console.log(`\n${res.length - falhas} ok, ${falhas} falha(s)`);
if (SAIDA) writeFileSync(SAIDA, JSON.stringify({ base: BASE, publico: PUBLICO, data: new Date().toISOString(), resultados: res }, null, 1));
process.exit(falhas ? 1 : 0);
