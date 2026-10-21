#!/usr/bin/env node
/**
 * Títulos revelados por linhas (candidato privado ?texto=gsap, 19/10/2026) e exclusividade poster/canvas da montanha.
 *   node tests/ararat/verifica-textos-linhas.mjs http://127.0.0.1:PORTA [saida.json] [--publico] [--grupos=a,b]
 * Revisão privada: compara ?texto=atual (padrão) e ?texto=gsap. Pública: GSAP aprovado, sem modos de comparação.
 * Chromium headless (sem GPU): mede estado, geometria, tempo e pixels do próprio Chromium; não substitui a observação
 * em navegador renderizado nem a aprovação estética.
 * Grupos (privada): atual, rotas, corte, inicio, invisibilidade, titulos, sem-resposta, espera, fontes, falha, resize, pausa, reduzido,
 * teclado, ancora, historico, app, rever, acessibilidade, montanha, custo. Pública: publica, montanha-publica.
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BASE = (process.argv[2] || "http://127.0.0.1:3360").replace(/\/$/, "");
const SAIDA = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : null;
const PUBLICO = process.argv.includes("--publico");
const GRUPOS = ((process.argv.find((a) => a.startsWith("--grupos=")) || "").slice(9) || "").split(",").filter(Boolean);
const roda = (g) => !GRUPOS.length || GRUPOS.includes(g);
const res = [];
const ok = (grupo, nome, passou, det = {}) => { res.push({ grupo, nome, ok: !!passou, ...det }); console.log(`${passou ? "ok  " : "FALHA"} [${grupo}] ${nome}${Object.keys(det).length ? " " + JSON.stringify(det).slice(0, 420) : ""}`); };
const b = await chromium.launch({ args: ["--disable-features=BackForwardCache"] });

const ROTAS = {
  pt: ["/pt", "/pt/plataforma", "/pt/solucoes", "/pt/solucoes/prostata", "/pt/solucoes/tireoide", "/pt/pesquisa", "/pt/empresa"],
  en: ["/", "/platform", "/solutions", "/solutions/prostate-mri", "/solutions/thyroid-ultrasound", "/research", "/company"],
  es: ["/es", "/es/plataforma", "/es/soluciones", "/es/soluciones/prostata", "/es/soluciones/tiroides", "/es/investigacion", "/es/empresa"],
};
const HOMES = [["/pt", "pt"], ["/", "en"], ["/es", "es"]];
const TELAS = [[1440, 900], [1366, 768], [1280, 600], [390, 844]];

// sonda por quadro: h1 e títulos marcados; altura do documento; montanha; atributos de estado
const SONDA = () => {
  // visibilidade efetiva, LINHA A LINHA (20/10): uma linha conta como exposta se a caixa do texto dela (retângulos do
  // Range, já com o transform) cruza a área visível da sua máscara (caixa da máscara + overflow-clip-margin) e a
  // opacidade efetiva (produto da linha até o <html>) passa de 0,02 com visibility visível. Opacidade baixa (0,15, 0,3)
  // NÃO é invisibilidade. Sem divisão, o título inteiro conta como uma "linha".
  const opCadeia = (el) => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity; return o; };
  const caixaTexto = (el) => { const rg = document.createRange(); rg.selectNodeContents(el); const rs = [...rg.getClientRects()].filter((q) => q.width > 0.5 && q.height > 0.5); if (!rs.length) return null; return { top: Math.min(...rs.map((q) => q.top)), bottom: Math.max(...rs.map((q) => q.bottom)), left: Math.min(...rs.map((q) => q.left)), right: Math.max(...rs.map((q) => q.right)) }; };
  const exposicao = (linha, mascara) => {
    const t = caixaTexto(linha); if (!t) return 0;
    const op = opCadeia(linha); if (op <= 0.02 || getComputedStyle(linha).visibility !== "visible") return 0;
    let reg = { top: -1e9, bottom: 1e9, left: -1e9, right: 1e9 };
    if (mascara) { const mr = mascara.getBoundingClientRect(), mc = getComputedStyle(mascara); const clip = /clip|hidden/.test(mc.overflowY) || /clip|hidden/.test(mc.overflow); const mg = clip ? (parseFloat((mc.overflowClipMargin || "0").split(" ").pop()) || 0) : 1e9; reg = { top: mr.top - mg, bottom: mr.bottom + mg, left: mr.left - mg, right: mr.right + mg }; }
    const h = Math.min(t.bottom, reg.bottom) - Math.max(t.top, reg.top), w = Math.min(t.right, reg.right) - Math.max(t.left, reg.left);
    return h > 0.5 && w > 0.5 ? +h.toFixed(1) : 0;
  };
  const alvo = (e) => {
    const cs = getComputedStyle(e), ls = e.querySelectorAll(".texto-linha"), r = e.getBoundingClientRect();
    let desloc = 0, opL = 1, exp = 0, expPx = 0;
    for (const l of ls) { const lc = getComputedStyle(l); const m = new DOMMatrixReadOnly(lc.transform === "none" ? undefined : lc.transform); desloc = Math.max(desloc, Math.abs(m.m42)); opL = Math.min(opL, +lc.opacity); const x = exposicao(l, l.closest(".texto-linha-mask")); if (x) { exp++; expPx += x; } }
    if (!ls.length) { const x = exposicao(e, null); if (x) { exp = 1; expPx = x; } }
    return { op: +(+cs.opacity).toFixed(3), opEf: +opCadeia(e).toFixed(3), n: ls.length, d: +desloc.toFixed(2), opL: +opL.toFixed(3), exp, expPx: +expPx.toFixed(1), H: +r.height.toFixed(1), W: +r.width.toFixed(1), vis: r.bottom > 0 && r.top < innerHeight, top: Math.round(r.top) };
  };
  window.__alvo = alvo;
  window.__f = [];
  const f = () => {
    const html = document.documentElement, h1 = document.querySelector("main [data-texto=h1]");
    const ts = {}; for (const e of document.querySelectorAll("main [data-texto=titulo]")) ts[e.id] = alvo(e);
    const hero = document.querySelector("[data-hero]"), pic = hero?.querySelector(".hero-arte picture"), host = hero?.querySelector(".hero-host");
    const fr = { t: Math.round(performance.now()), p: location.pathname, y: Math.round(scrollY), h1: h1 ? alvo(h1) : null, h1id: h1?.id || null, ts, Hd: html.scrollHeight, ent: html.dataset.textoEntrada || "", st: html.dataset.textos || "", comp: hero ? hero.hasAttribute("data-composta") : null };
    if (hero) fr.m = { at: hero.dataset.montanha, pic: pic ? getComputedStyle(pic).visibility : null, host: host ? getComputedStyle(host).visibility : null, cv: hero.querySelectorAll("canvas").length };
    if (window.__f.length < 9000) window.__f.push(fr);
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
};
const IO_MUDO = () => { window.IntersectionObserver = class { constructor() {} observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }; };
// pedaços da biblioteca: núcleo (licença "GreenSock") e SplitText (símbolo "_split"); o módulo textos.ts só os importa
const ehGsap = (txt) => /GreenSock|"_split"/.test(txt);

const nova = async (w, h, o = {}) => {
  const { texto = "gsap", ioMudo, pausado, congelar, rotas, ...rest } = o;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, ...rest });
  if (ioMudo) await ctx.addInitScript(IO_MUDO);
  await ctx.addInitScript(SONDA);
  await ctx.addInitScript(({ texto, pausado, congelar }) => {
    try {
      if (texto && !sessionStorage.getItem("ararat:texto-versao")) sessionStorage.setItem("ararat:texto-versao", texto);
      if (pausado && !sessionStorage.getItem("ararat:paused")) sessionStorage.setItem("ararat:paused", "1");
      if (congelar) sessionStorage.setItem("ararat:texto-teste", "congelar");
    } catch {}
  }, { texto, pausado: !!pausado, congelar: !!congelar });
  if (rotas) await rotas(ctx);
  const p = await ctx.newPage(); p.__erros = []; p.__js = []; p.__gsap = [];
  p.on("pageerror", (e) => p.__erros.push(e.message));
  p.on("response", async (r) => {
    const u = r.url().split("?")[0]; if (!/\.js$/.test(u)) return;
    p.__js.push(u);
    try { const body = await r.body(); p.__jsBytes = (p.__jsBytes || 0) + body.length; if (ehGsap(body.toString("latin1"))) p.__gsap.push({ u, bytes: body.length, gz: gzipSync(body).length }); } catch { /* abortado */ }
  });
  return { ctx, p };
};
const fr = (p) => p.evaluate(() => window.__f);
const zera = (p) => p.evaluate(() => { window.__f = []; });
const ir = async (p, rota, espera = 3200) => { await p.goto(BASE + rota, { waitUntil: "load" }); await p.waitForTimeout(espera); };
const ler = async (p) => {
  const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await p.mouse.move(200, 200);
  for (let y = await p.evaluate(() => scrollY); y < H - 5; y = await p.evaluate(() => scrollY)) { await p.mouse.wheel(0, 240); await p.waitForTimeout(70); }
  await p.waitForTimeout(1300);
};
const completo = (a) => !!a && a.op >= 0.999 && (a.n === 0 || (a.d < 0.5 && a.opL >= 0.999));
const mostrado = (a) => !!a && a.op > 0.9 && (a.n === 0 || (a.d < 2 && a.opL > 0.9));
// escondido = nenhuma linha exposta (verificação linha a linha na sonda; ver exposicao()). A versão agregada anterior
// (maior deslocamento e menor opacidade entre as linhas, opacidade < 0,5) deixava uma linha escondida mascarar outra já
// exposta — ficou só como referência no controle do grupo "invisibilidade".
const escondido = (a) => !!a && a.exp === 0;
const escondidoAgregadoAntigo = (a) => !!a && (a.op < 0.5 || (a.n > 0 && (a.d > 4 || a.opL < 0.5)));
// um alvo que já esteve inteiro NA JANELA nunca volta a ficar escondido (por rota: a sonda segue entre páginas no app);
// título armado abaixo da janela é o comportamento previsto (ninguém o viu)
const someuDepois = (fs, pega) => {
  const visto = new Set(); const err = [];
  for (const x of fs) { const a = pega(x); if (!a || !a.vis) continue; const k = x.p; if (mostrado(a)) visto.add(k); else if (visto.has(k) && escondido(a)) err.push({ t: x.t, p: k, a }); }
  return err;
};
const tocouH1 = (fs) => { let max = 0, mexeu = null, fim = null, ini = null; for (const x of fs) { const a = x.h1; if (!a || !a.n) continue; ini ??= x.t; if (a.d > max) max = a.d; if (mexeu === null && max > 4 && a.d < max - 1) mexeu = x.t; fim = x.t; } return { ini, mexeu, fim, max }; };
const primeiro = (fs) => fs.find((x) => x.h1)?.t ?? null;
const final = async (p) => p.evaluate(() => { const h = document.querySelector("main [data-texto=h1]"); return { h1: h ? window.__alvo(h) : null, html: h ? h.innerHTML.includes("texto-linha") : null, aria: h?.getAttribute("aria-label") ?? null, st: document.documentElement.dataset.textos || "", ent: document.documentElement.dataset.textoEntrada || "", ts: Object.fromEntries([...document.querySelectorAll("main [data-texto=titulo]")].map((e) => [e.id, window.__alvo(e)])), linhas: document.querySelectorAll(".texto-linha").length, ctl: !!document.querySelector(".texto-revisao") }; });
const tudoCompleto = (f) => completo(f.h1) && Object.values(f.ts).every(completo) && f.linhas === 0;
// fim de uma carga sem leitura: h1 inteiro e sem divisão; título ou inteiro, ou ainda armado FORA da janela (não lido)
const semResto = (f) => completo(f.h1) && !f.html && Object.values(f.ts).every((a) => completo(a) || (a.n > 0 && !a.vis));
// altura do alvo e do documento iguais enquanto dividido e no fim (depois da composição da abertura)
const geometria = (fs, fim) => {
  const err = [];
  for (const x of fs) {
    if (x.comp === false) continue;
    if (x.h1?.n && Math.abs(x.h1.H - fim.h1.H) > 0.6) err.push({ t: x.t, alvo: "h1", H: x.h1.H, fim: fim.h1.H });
    for (const [id, a] of Object.entries(x.ts)) if (a.n && fim.ts[id] && Math.abs(a.H - fim.ts[id].H) > 0.6) err.push({ t: x.t, alvo: id, H: a.H, fim: fim.ts[id].H });
  }
  return err;
};
const docEstavel = (fs) => { const hs = fs.filter((x) => x.comp !== false && (x.h1?.n || Object.values(x.ts).some((a) => a.n))).map((x) => x.Hd); return { var: hs.length ? Math.max(...hs) - Math.min(...hs) : 0, n: hs.length }; };

// ------------------------------------------------------------------------------------------------ privada
if (!PUBLICO && roda("atual")) {
  for (const [rota] of [...HOMES, ["/pt/plataforma"]]) {
    const { ctx, p } = await nova(1366, 768, { texto: "atual" });
    await ir(p, rota + "?texto=atual"); await ler(p);
    const fs = await fr(p), fim = await final(p);
    const nuncaLinhas = fs.every((x) => !x.h1?.n && Object.values(x.ts).every((a) => !a.n));
    const h1Sempre = fs.filter((x) => x.h1).every((x) => x.h1.op >= 0.999);
    ok("atual", `${rota}: nada dividido nem seguro; sem GSAP`, nuncaLinhas && h1Sempre && !p.__gsap.length && !fim.ctl && !fs.some((x) => x.ent), { gsap: p.__gsap.length, erros: p.__erros });
    await ctx.close();
  }
}

if (!PUBLICO && roda("rotas")) {
  const esperas = [];
  for (const [w, h] of TELAS) for (const lang of ["pt", "en", "es"]) for (const rota of ROTAS[lang]) {
    const { ctx, p } = await nova(w, h);
    await ir(p, rota + (rota.includes("?") ? "&" : "?") + "texto=gsap", 3300);
    const fs = await fr(p), fim = await final(p);
    const t0 = primeiro(fs), toc = tocouH1(fs);
    const seguroDesde1 = fs.find((x) => x.h1)?.h1.op === 0;
    const sumiu = someuDepois(fs, (x) => x.h1);
    const geo = geometria(fs, fim), doc = docEstavel(fs);
    const home = ["/pt", "/", "/es"].includes(rota);
    const montanhaOk = !home || fs.filter((x) => x.m).every((x) => (x.m.pic === "visible") !== (x.m.host === "visible") && x.m.cv <= 1);
    const passou = seguroDesde1 && toc.mexeu !== null && !sumiu.length && semResto(fim) && fim.aria === null && !geo.length && doc.var <= 1 && montanhaOk && !p.__erros.length;
    if (toc.mexeu !== null) esperas.push({ tela: `${w}x${h}`, rota, espera: toc.mexeu - t0, dur: toc.fim - toc.mexeu });
    ok("rotas", `${w}x${h} ${rota}`, passou, { espera: toc.mexeu !== null ? toc.mexeu - t0 : null, entrada: toc.fim !== null && toc.mexeu !== null ? toc.fim - toc.mexeu : null, linhasMax: Math.max(0, ...fs.map((x) => x.h1?.n || 0)), sumiu: sumiu.slice(0, 2), geo: geo.slice(0, 2), doc, montanhaOk, erros: p.__erros });
    await ctx.close();
  }
  const ord = esperas.map((e) => e.espera).sort((a, c) => a - c);
  ok("rotas", "espera do h1 (do 1º quadro ao 1º movimento), resumo", true, { n: ord.length, mediana: ord[ord.length >> 1], p90: ord[Math.floor(ord.length * 0.9)], max: ord[ord.length - 1] });
}

// letras: a máscara (overflow:clip + margem .18em) não pode cortar nada no estado final da entrada
const compararPixels = async (p, a, c, lim = 48) => p.evaluate(async ([a, c, lim]) => {
  const im = async (b64) => { const bm = await createImageBitmap(await (await fetch("data:image/png;base64," + b64)).blob()); const cv = new OffscreenCanvas(bm.width, bm.height); const x = cv.getContext("2d"); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
  const A = await im(a), C = await im(c); if (A.width !== C.width || A.height !== C.height) return { tam: [A.width, A.height, C.width, C.height] };
  let dif = 0; for (let i = 0; i < A.data.length; i += 4) { const d = Math.max(Math.abs(A.data[i] - C.data[i]), Math.abs(A.data[i + 1] - C.data[i + 1]), Math.abs(A.data[i + 2] - C.data[i + 2])); if (d > lim) dif++; }
  return { dif, px: A.width * A.height };
}, [a.toString("base64"), c.toString("base64"), lim]);
// Letras e quebras: no estado final da entrada (linhas paradas, ainda com máscara; modo "congelar" da revisão) o
// recorte de cada alvo tem de ser IDÊNTICO, pixel a pixel, ao do texto normal depois de desfeita a divisão. Isso pega
// letra cortada pela máscara (acento, descendente) e linha quebrada em outro lugar. Controle de sensibilidade: um
// recorte de .12em em cima e embaixo da máscara tem de aparecer na comparação.
const recorte = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); const r = e.getBoundingClientRect(); const fs = parseFloat(getComputedStyle(e).fontSize); return { clip: { x: Math.max(0, r.left - fs * 0.4), y: Math.max(0, r.top - fs * 0.4), width: Math.min(innerWidth - Math.max(0, r.left - fs * 0.4), r.width + fs * 0.8), height: Math.min(innerHeight - Math.max(0, r.top - fs * 0.4), r.height + fs * 0.8) }, n: e.querySelectorAll(".texto-linha").length, d: window.__alvo(e).d }; }, sel);
const fotoAlvo = async (p, sel) => { const c = await recorte(p, sel); return { ...c, png: await p.screenshot({ clip: c.clip }) }; };
const desfazerTudo = async (p) => { await p.evaluate(() => dispatchEvent(new Event("pagehide"))); await p.waitForTimeout(150); }; // termina e desfaz (sem rolar, sem trocar largura)
if (!PUBLICO && roda("corte")) {
  const casos = [];
  for (const lang of ["pt", "en", "es"]) for (const rota of ROTAS[lang]) for (const [w, h] of [[1440, 900], [390, 844]]) casos.push([rota, w, h]);
  casos.push(["/", 1366, 768], ["/", 1280, 600], ["/pt", 1280, 600], ["/es/empresa", 1366, 768]);
  for (const [rota, w, h] of casos) {
    const { ctx, p } = await nova(w, h, { congelar: true });
    await ir(p, rota + "?texto=gsap&montanha=falha", 3600);
    const rec = await p.evaluate(() => document.documentElement.dataset.textosRecusados || "");
    const a = await fotoAlvo(p, "main [data-texto=h1]");
    await desfazerTudo(p);
    const nDepois = await p.evaluate(() => document.querySelectorAll(".texto-linha").length);
    const cmp = await compararPixels(p, a.png, await p.screenshot({ clip: a.clip }));
    ok("corte", `${w}x${h} ${rota}: h1 no fim da entrada idêntico ao texto normal (letras e quebras)`, a.n > 0 && a.d < 0.5 && nDepois === 0 && cmp.dif === 0 && !rec, { linhas: a.n, recusados: rec || undefined, ...cmp });
    await ctx.close();
  }
  // títulos do caso e da evidência (Home): cada um entra ao chegar e fica congelado no fim
  for (const [rota] of HOMES) for (const [w, h] of [[1440, 900], [390, 844]]) for (const id of ["caso-t", "ev-t"]) {
    const { ctx, p } = await nova(w, h, { congelar: true });
    await ir(p, rota + "?texto=gsap&montanha=falha", 2600);
    await p.evaluate((id) => { const e = document.getElementById(id); scrollTo({ top: scrollY + e.getBoundingClientRect().top - innerHeight * 0.35, behavior: "instant" }); }, id);
    await p.waitForTimeout(1600);
    const a = await fotoAlvo(p, "#" + id);
    await desfazerTudo(p);
    const cmp = await compararPixels(p, a.png, await p.screenshot({ clip: a.clip }));
    ok("corte", `${w}x${h} ${rota} #${id}: título no fim da entrada idêntico ao texto normal`, a.n > 0 && a.d < 0.5 && cmp.dif === 0, { linhas: a.n, ...cmp });
    await ctx.close();
  }
  // controles de sensibilidade (estilo aplicado depois da carga, com as linhas já congeladas no fim): um recorte de
  // .12em e a máscara sem margem (overflow-clip-margin: 0px) têm de aparecer na comparação
  for (const [rota, w, h] of [["/pt/solucoes/prostata", 1440, 900], ["/es", 390, 844], ["/pt", 1440, 900]]) for (const [nome, css] of [["recorte de .12em", ".texto-linha-mask{clip-path:inset(.12em 0 .12em 0)}"], ["máscara sem margem", ".texto-linha-mask{overflow-clip-margin:0px!important}"]]) {
    const { ctx, p } = await nova(w, h, { congelar: true });
    await ir(p, rota + "?texto=gsap&montanha=falha", 3600);
    await p.addStyleTag({ content: css }); await p.waitForTimeout(80);
    const a = await fotoAlvo(p, "main [data-texto=h1]"); await desfazerTudo(p);
    const cmp = await compararPixels(p, a.png, await p.screenshot({ clip: a.clip }));
    ok("corte", `controle de sensibilidade ${w}x${h} ${rota}: ${nome} aparece na comparação`, cmp.dif > 0, cmp);
    await ctx.close();
  }
}

// 1º quadro da entrada (Motion, COORDENACAO-LINHAS-MONTANHA §2A): com as linhas no estado inicial (yPercent 108,
// opacidade .15; gancho privado "t:0"), nenhuma tinta do título pode estar visível. Compara o recorte da área do alvo
// com o mesmo recorte com o alvo em visibility:hidden (só o fundo).
const fotoSemAlvo = async (p, sel, clip) => { await p.evaluate((sel) => { document.querySelector(sel).style.visibility = "hidden"; }, sel); await p.waitForTimeout(80); const png = await p.screenshot({ clip }); await p.evaluate((sel) => { document.querySelector(sel).style.visibility = ""; }, sel); return png; };
if (!PUBLICO && roda("inicio")) {
  const casos = [];
  for (const lang of ["pt", "en", "es"]) for (const rota of ROTAS[lang]) for (const [w, h] of [[1440, 900], [390, 844]]) casos.push([rota, w, h]);
  casos.push(["/pt", 1366, 768], ["/", 1280, 720], ["/es/empresa", 1280, 720]);
  for (const [rota, w, h] of casos) {
    const { ctx, p } = await nova(w, h);
    await ctx.addInitScript(() => { try { sessionStorage.setItem("ararat:texto-teste", "t:0"); } catch {} });
    await ir(p, rota + "?texto=gsap&montanha=falha", 3200);
    const a = await fotoAlvo(p, "main [data-texto=h1]");
    const fundo = await fotoSemAlvo(p, "main [data-texto=h1]", a.clip);
    const cmp = await compararPixels(p, a.png, fundo, 8);
    ok("inicio", `${w}x${h} ${rota}: h1 no estado inicial sem tinta visível`, a.n > 0 && a.d > 4 && cmp.dif === 0, { linhas: a.n, d: a.d, ...cmp });
    await ctx.close();
  }
  for (const [rota] of HOMES) for (const [w, h] of [[1440, 900], [390, 844]]) for (const id of ["caso-t", "ev-t"]) {
    const { ctx, p } = await nova(w, h);
    await ctx.addInitScript(() => { try { sessionStorage.setItem("ararat:texto-teste", "t:0"); } catch {} });
    await ir(p, rota + "?texto=gsap&montanha=falha", 2600);
    await p.evaluate((id) => { const e = document.getElementById(id); scrollTo({ top: scrollY + e.getBoundingClientRect().top - innerHeight * 0.35, behavior: "instant" }); }, id);
    await p.waitForTimeout(900);
    const a = await fotoAlvo(p, "#" + id);
    const fundo = await fotoSemAlvo(p, "#" + id, a.clip);
    const cmp = await compararPixels(p, a.png, fundo, 8);
    ok("inicio", `${w}x${h} ${rota} #${id}: título no estado inicial sem tinta visível`, a.n > 0 && a.d > 4 && cmp.dif === 0, { linhas: a.n, d: a.d, ...cmp });
    await ctx.close();
  }
}

// Controle do critério de invisibilidade (20/10). Linhas paradas no estado inicial (gancho privado "t:0"; todas sob
// a máscara) e depois expostas DE PROPÓSITO, só na página do teste: o critério novo tem de acusar cada exposição, os
// pixels confirmam que há tinta, e o critério agregado antigo mostra a falha que motivou a troca.
if (!PUBLICO && roda("invisibilidade")) {
  const casos = [
    ["todas sob a máscara (estado inicial real)", () => {}, false],
    ["1ª linha inteira à vista, as outras escondidas", (ls) => { ls[0].style.transform = "translate(0px, 0px)"; ls[0].style.opacity = "1"; }, true],
    ["1ª linha meio exposta (60 %), as outras escondidas", (ls) => { ls[0].style.transform = "translate(0px, 60%)"; ls[0].style.opacity = "1"; }, true],
    ["última linha exposta, as outras escondidas", (ls) => { const l = ls[ls.length - 1]; l.style.transform = "translate(0px, 0px)"; l.style.opacity = "1"; }, true],
    ["todas no lugar com opacidade 0,3 (abaixo de 0,5, mas visíveis)", (ls) => ls.forEach((l) => { l.style.transform = "translate(0px, 0px)"; l.style.opacity = "0.3"; }), true],
  ];
  for (const [rota, w, h] of [["/pt", 1440, 900], ["/pt/plataforma", 390, 844], ["/es/empresa", 1366, 768]]) {
    for (const [nome, mexer, deveExpor] of casos) {
      const { ctx, p } = await nova(w, h);
      await ctx.addInitScript(() => { try { sessionStorage.setItem("ararat:texto-teste", "t:0"); } catch {} });
      await ir(p, rota + "?texto=gsap&montanha=falha", 3200);
      const linhas = await p.evaluate(() => document.querySelectorAll("main [data-texto=h1] .texto-linha").length);
      await p.evaluate(`(${mexer.toString()})([...document.querySelectorAll("main [data-texto=h1] .texto-linha")])`);
      await p.waitForTimeout(80);
      const a = await p.evaluate(() => window.__alvo(document.querySelector("main [data-texto=h1]")));
      const foto = await fotoAlvo(p, "main [data-texto=h1]");
      const fundo = await fotoSemAlvo(p, "main [data-texto=h1]", foto.clip);
      const px = (await compararPixels(p, foto.png, fundo, 8)).dif;
      const novo = !escondido(a), antigo = !escondidoAgregadoAntigo(a);
      // o critério novo concorda com os pixels; o antigo fica registrado (e erra nos casos de linha escondida + exposta)
      ok("invisibilidade", `${w}x${h} ${rota}: ${nome} → critério novo ${novo ? "acusa exposição" : "escondido"}${deveExpor ? " (controle: tem de reprovar)" : ""}`, linhas > 1 && novo === deveExpor && (px > 0) === deveExpor, { linhas, expostas: a.exp, expPx: a.expPx, pixels: px, agregadoAntigo: antigo ? "exposto" : "escondido" });
      await ctx.close();
    }
    // a própria entrada, parada em instantes reais do começo (sem mexer em nada): o critério novo concorda com os pixels
    for (const t of ["0.04", "0.08", "0.12", "0.2"]) {
      const { ctx, p } = await nova(w, h);
      await ctx.addInitScript((t) => { try { sessionStorage.setItem("ararat:texto-teste", "t:" + t); } catch {} }, t);
      await ir(p, rota + "?texto=gsap&montanha=falha", 3200);
      const a = await p.evaluate(() => window.__alvo(document.querySelector("main [data-texto=h1]")));
      const foto = await fotoAlvo(p, "main [data-texto=h1]");
      const px = (await compararPixels(p, foto.png, await fotoSemAlvo(p, "main [data-texto=h1]", foto.clip), 8)).dif;
      // nunca "escondido" com tinta na tela; o inverso (exposto sem tinta) é o lado conservador: a caixa do texto
      // (ascendente da fonte) entra na área visível um pouco antes da tinta das letras
      ok("invisibilidade", `${w}x${h} ${rota}: entrada parada em ${t} s → critério novo ${escondido(a) ? "escondido" : "exposto"} com ${px} pixels de tinta (nunca escondido com tinta)`, !(escondido(a) && px > 0), { conservador: !escondido(a) && px === 0, expostas: a.exp, expPx: a.expPx, pixels: px, agregadoAntigo: escondidoAgregadoAntigo(a) ? "escondido" : "exposto" });
      await ctx.close();
    }
  }
}

if (!PUBLICO && roda("titulos")) {
  for (const [w, h] of [[1366, 768], [390, 844]]) for (const [rota] of HOMES) {
    const { ctx, p } = await nova(w, h);
    await ir(p, rota + "?texto=gsap", 2600);
    const armados = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll("main [data-texto=titulo]")].map((e) => [e.id, window.__alvo(e)])));
    await ler(p);
    const fs = await fr(p), fim = await final(p);
    const toc = {}; for (const id of Object.keys(armados)) { let max = 0; for (const x of fs) { const a = x.ts[id]; if (!a?.n) continue; max = Math.max(max, a.d); if (a.vis && max > 4 && a.d < max - 1) { toc[id] = true; break; } } }
    const visEscondido = fs.filter((x) => Object.values(x.ts).some((a) => a.vis && a.n && a.top < x.h1?.top)).length; // nunca deve haver título escondido acima de onde já se leu
    const sumiu = Object.keys(armados).flatMap((id) => someuDepois(fs, (x) => x.ts[id]));
    const geo = geometria(fs, fim), doc = docEstavel(fs);
    const passou = Object.values(armados).every((a) => a.n > 0 && escondido(a)) && Object.keys(armados).every((id) => toc[id]) && !sumiu.length && tudoCompleto(fim) && !geo.length && doc.var <= 1 && !p.__erros.length;
    ok("titulos", `${w}x${h} ${rota}: armam abaixo, entram ao chegar, terminam inteiros`, passou, { armados: Object.fromEntries(Object.entries(armados).map(([k, a]) => [k, a.n])), tocou: toc, geo: geo.slice(0, 2), doc, visEscondido, erros: p.__erros });
    await ctx.close();
  }
}

if (!PUBLICO && roda("sem-resposta")) {
  for (const [w, h] of [[1366, 768], [390, 844]]) {
    const { ctx, p } = await nova(w, h, { ioMudo: true });
    await ir(p, "/pt?texto=gsap", 3200);
    const a = await final(p); const fs = await fr(p); const toc = tocouH1(fs);
    const h1Natural = fs.some((x) => x.h1?.n && x.h1.d < 0.5); // o h1 terminou a própria entrada (não foi cortado)
    await ler(p); const b2 = await final(p);
    ok("sem-resposta", `${w}x${h}: observador mudo → títulos inteiros em 1,5 s; h1 completa a entrada`, tudoCompleto(a) && tudoCompleto(b2) && toc.mexeu !== null && h1Natural && !p.__erros.length, { st: a.st, h1Natural, erros: p.__erros });
    await ctx.close();
  }
}

if (!PUBLICO && roda("espera")) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { ctx, p } = await nova(w, h);
    await ir(p, "/pt?texto=gsap", 10000);
    const antes = await final(p);
    await zera(p); await ler(p);
    const fs = await fr(p), fim = await final(p);
    const tocaram = Object.keys(antes.ts).filter((id) => { let max = 0; return fs.some((x) => { const a = x.ts[id]; if (!a?.n) return false; max = Math.max(max, a.d); return a.vis && max > 4 && a.d < max - 1; }); });
    ok("espera", `${w}x${h}: 10 s no topo e depois a leitura → os títulos entram`, Object.values(antes.ts).every((a) => a.n > 0) && tocaram.length === Object.keys(antes.ts).length && tudoCompleto(fim), { tocaram });
    await ctx.close();
  }
}

if (!PUBLICO && roda("fontes")) {
  for (const atraso of [1200, 3500, 6000]) for (const [w, h] of [[1366, 768], [390, 844]]) for (const rota of ["/pt", "/pt/plataforma"]) {
    const { ctx, p } = await nova(w, h, { rotas: (c) => c.route(/\.(woff2?|ttf)(\?|$)/, async (r) => { await new Promise((ok) => setTimeout(ok, atraso)); try { await r.continue(); } catch {} }) });
    await ir(p, rota + "?texto=gsap", atraso + 3000);
    const fs = await fr(p), fim = await final(p);
    const sumiu = someuDepois(fs, (x) => x.h1);
    ok("fontes", `fontes +${atraso} ms, ${w}x${h} ${rota}: nunca some, termina inteiro, sem linhas antigas`, !sumiu.length && semResto(fim) && !p.__erros.length, { st: fim.st, tocou: tocouH1(fs).mexeu !== null, sumiu: sumiu.slice(0, 2), erros: p.__erros });
    await ctx.close();
  }
}

const rotaGsap = (modo, atraso = 0) => (c) => c.route(/\/_next\/static\/.*\.js(\?|$)/, async (r) => {
  let resp; try { resp = await r.fetch(); } catch { return r.abort(); }
  const body = await resp.body();
  if (!ehGsap(body.toString("latin1"))) return r.fulfill({ response: resp, body });
  if (modo === "falha") return r.abort("failed");
  await new Promise((ok) => setTimeout(ok, atraso)); return r.fulfill({ response: resp, body });
});
if (!PUBLICO && roda("falha")) {
  for (const [w, h] of [[1366, 768], [390, 844]]) for (const rota of ["/pt", "/pt/empresa"]) {
    {
      const { ctx, p } = await nova(w, h, { rotas: rotaGsap("falha") });
      await ir(p, rota + "?texto=gsap", 3000);
      const fs = await fr(p), fim = await final(p);
      const visivelEm = fs.find((x) => x.h1 && x.h1.op >= 0.999)?.t, t0 = primeiro(fs);
      ok("falha", `biblioteca falha, ${w}x${h} ${rota}: texto inteiro, estado "falha"`, tudoCompleto(fim) && fim.st === "falha" && !someuDepois(fs, (x) => x.h1).length, { st: fim.st, h1VisivelApos: visivelEm - t0 });
      await ctx.close();
    }
    {
      const { ctx, p } = await nova(w, h, { rotas: rotaGsap("tarde", 4000) });
      await ir(p, rota + "?texto=gsap", 6500);
      const fs = await fr(p), fim = await final(p);
      const visivelEm = fs.find((x) => x.h1 && x.h1.op >= 0.999)?.t, t0 = primeiro(fs);
      const sumiu = someuDepois(fs, (x) => x.h1);
      ok("falha", `biblioteca 4 s atrasada, ${w}x${h} ${rota}: h1 aparece pelo prazo de CSS e não some de novo`, !sumiu.length && visivelEm - t0 < 2800 && tudoCompleto(await (async () => { await ler(p); return final(p); })()), { h1VisivelApos: visivelEm - t0, sumiu: sumiu.slice(0, 2) });
      await ctx.close();
    }
  }
}

// espera o 1º movimento do h1 e devolve o tempo (performance.now) em que aconteceu
const aguardaMovimento = async (p) => p.waitForFunction(() => { const e = document.querySelector("main [data-texto=h1]"); if (!e) return false; const l = e.querySelector(".texto-linha"); if (!l) return false; const m = new DOMMatrixReadOnly(getComputedStyle(l).transform === "none" ? undefined : getComputedStyle(l).transform); return m.m42 > 2 && m.m42 < 40; }, null, { polling: "raf", timeout: 6000 }).then(() => true, () => false);
const depoisDe = async (p, acao, quadros = 3) => { await acao(); await p.evaluate((n) => new Promise((ok) => { let i = 0; const f = () => (++i >= n ? ok() : requestAnimationFrame(f)); requestAnimationFrame(f); }), quadros); return final(p); };

if (!PUBLICO && roda("resize")) {
  for (const [rota, w, h, w2, h2, nome] of [["/pt/plataforma", 1366, 768, 1100, 768, "largura"], ["/pt", 1440, 900, 1180, 900, "largura (Home, recompõe)"], ["/es/empresa", 390, 844, 844, 390, "giro do celular"], ["/pt/pesquisa", 1440, 900, 1152, 720, "zoom 125% (mesma janela, CSS px menores)"]]) {
    const { ctx, p } = await nova(w, h);
    await p.goto(BASE + rota + "?texto=gsap", { waitUntil: "commit" });
    const mexeu = await aguardaMovimento(p);
    const f = await depoisDe(p, () => p.setViewportSize({ width: w2, height: h2 }));
    await p.waitForTimeout(1500); const fim = await final(p);
    ok("resize", `${rota} ${w}x${h} → ${w2}x${h2} (${nome}) no meio da entrada: completo em 3 quadros, sem linhas antigas`, mexeu && tudoCompleto(f) && tudoCompleto(fim) && !p.__erros.length, { mexeu, st: f.st, linhas: f.linhas, erros: p.__erros });
    await ctx.close();
  }
  // troca de idioma no meio da entrada (seletor de idioma)
  {
    const { ctx, p } = await nova(1366, 768);
    await p.goto(BASE + "/pt/plataforma?texto=gsap", { waitUntil: "commit" });
    await aguardaMovimento(p);
    await p.click(".idiomas a[data-idioma=es]"); await p.waitForURL(/\/es\//); await p.waitForTimeout(3000);
    const fs = await fr(p), fim = await final(p);
    ok("resize", "troca de idioma no meio da entrada: o novo h1 entra uma vez e termina inteiro", tudoCompleto(fim) && !someuDepois(fs, (x) => x.h1).length && !p.__erros.length, { url: p.url().replace(BASE, ""), erros: p.__erros });
    await ctx.close();
  }
}

if (!PUBLICO && roda("pausa")) {
  for (const [w, h] of [[1366, 768], [390, 844]]) {
    {
      const { ctx, p } = await nova(w, h, { pausado: true });
      await ir(p, "/pt?texto=gsap", 2500); await ler(p);
      const fs = await fr(p), fim = await final(p);
      ok("pausa", `${w}x${h}: carga já pausada → nada seguro, nada dividido, sem GSAP`, fs.filter((x) => x.h1).every((x) => x.h1.op >= 0.999 && !x.h1.n) && !fs.some((x) => x.ent) && tudoCompleto(fim) && !p.__gsap.length, { st: fim.st, gsap: p.__gsap.length, h1Op: [...new Set(fs.filter((x) => x.h1).map((x) => x.h1.op))].slice(0, 4), ent: fs.some((x) => x.ent), fim: { h1: fim.h1, ts: fim.ts, linhas: fim.linhas } });
      await ctx.close();
    }
    {
      const { ctx, p } = await nova(w, h);
      await p.goto(BASE + "/pt/solucoes?texto=gsap", { waitUntil: "commit" });
      const mexeu = await aguardaMovimento(p);
      const f = await depoisDe(p, () => p.evaluate(() => window.ARARAT_MOVIMENTO.definir(true)), 2);
      ok("pausa", `${w}x${h}: pausa no meio da entrada → tudo inteiro em 2 quadros`, mexeu && tudoCompleto(f), { st: f.st });
      await ctx.close();
    }
  }
}

if (!PUBLICO && roda("reduzido")) {
  for (const [w, h] of [[1366, 768], [390, 844]]) {
    {
      const { ctx, p } = await nova(w, h, { reducedMotion: "reduce" });
      await ir(p, "/pt?texto=gsap", 2500); await ler(p);
      const fs = await fr(p), fim = await final(p);
      ok("reduzido", `${w}x${h}: movimento reduzido na carga → nada seguro, sem GSAP`, fs.filter((x) => x.h1).every((x) => x.h1.op >= 0.999 && !x.h1.n) && tudoCompleto(fim) && !p.__gsap.length, { st: fim.st });
      await ctx.close();
    }
    {
      const { ctx, p } = await nova(w, h);
      await p.goto(BASE + "/pt/solucoes/tireoide?texto=gsap", { waitUntil: "commit" });
      const mexeu = await aguardaMovimento(p);
      const f = await depoisDe(p, () => p.emulateMedia({ reducedMotion: "reduce" }), 2);
      ok("reduzido", `${w}x${h}: reduzido ligado no meio da entrada → tudo inteiro em 2 quadros`, mexeu && tudoCompleto(f), { st: f.st });
      await ctx.close();
    }
  }
}

if (!PUBLICO && roda("teclado")) {
  for (const [w, h] of [[1366, 768], [390, 844]]) {
    const { ctx, p } = await nova(w, h);
    await p.goto(BASE + "/pt?texto=gsap", { waitUntil: "commit" });
    const ruins = [];
    for (let i = 0; i < 40; i++) {
      await p.keyboard.press("Tab");
      const r = await p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const alvo = a.closest("[data-texto]"); const s = alvo ? window.__alvo(alvo) : null; const r = a.getBoundingClientRect(); return { tag: a.tagName, txt: (a.textContent || "").trim().slice(0, 30), dentroOculto: !!s && s.exp === 0, vis: r.width > 0 && r.height > 0 }; });
      if (r?.dentroOculto) ruins.push(r);
    }
    await p.waitForTimeout(1200);
    await p.evaluate(() => document.activeElement?.blur?.());
    const y0 = await p.evaluate(() => scrollY);
    for (let i = 0; i < 14; i++) { await p.keyboard.press("PageDown"); await p.waitForTimeout(120); }
    await p.waitForTimeout(1500);
    const y1 = await p.evaluate(() => scrollY);
    const fim = await final(p);
    ok("teclado", `${w}x${h}: Tab e PageDown durante a entrada → nenhum foco em alvo escondido; termina inteiro`, !ruins.length && y1 > y0 + 2000 && tudoCompleto(fim), { ruins: ruins.slice(0, 3), y0, y1, fim: { st: fim.st, h1: fim.h1, ts: fim.ts, linhas: fim.linhas } });
    await ctx.close();
  }
  // controle de revisão alcançável por teclado
  {
    const { ctx, p } = await nova(1366, 768);
    await ir(p, "/pt/plataforma?texto=gsap", 2500);
    let achou = false; for (let i = 0; i < 80 && !achou; i++) { await p.keyboard.press("Tab"); achou = await p.evaluate(() => document.activeElement?.textContent === "Rever entrada"); }
    await zera(p); if (achou) await p.keyboard.press("Enter"); await p.waitForTimeout(2200);
    const fs = await fr(p), fim = await final(p);
    ok("teclado", "controle \"Rever entrada\" alcançável por Tab e acionável por Enter", achou && tocouH1(fs).mexeu !== null && tudoCompleto(fim), { achou });
    await ctx.close();
  }
}

if (!PUBLICO && roda("ancora")) {
  for (const rota of ["/pt#evidencia", "/pt/plataforma#conteudo", "/es#caso"]) {
    const { ctx, p } = await nova(1366, 768);
    await ir(p, rota.replace("#", "?texto=gsap#"), 2500);
    const fs = await fr(p), fim = await final(p);
    ok("ancora", `carga com âncora ${rota} → estático, sem GSAP`, fs.filter((x) => x.h1).every((x) => !x.h1.n && x.h1.op >= 0.999) && tudoCompleto(fim) && !p.__gsap.length && fim.st === "estatico", { st: fim.st });
    await ctx.close();
  }
  {
    const { ctx, p } = await nova(1366, 768);
    await ir(p, "/pt?texto=gsap", 2600);
    const armado = (await final(p)).st;
    const link = await p.$("main a[href*='#']");
    const f = link ? await depoisDe(p, () => link.click(), 2) : null;
    await p.waitForTimeout(800); const fim = await final(p);
    ok("ancora", "link de seção clicado com títulos armados → tudo inteiro na hora", armado === "armado" && !!link && tudoCompleto(f) && tudoCompleto(fim), { armado, st: f?.st });
    await ctx.close();
  }
}

if (!PUBLICO && roda("historico")) {
  const semEntrada = (fs) => fs.filter((x) => x.h1).every((x) => x.h1.op >= 0.999 && !x.h1.n) && !fs.some((x) => x.ent) && fs.every((x) => Object.values(x.ts).every((a) => !a.n));
  for (const [w, h] of [[1366, 768], [390, 844]]) {
    const { ctx, p } = await nova(w, h);
    await ir(p, "/pt?texto=gsap", 2600); await p.mouse.wheel(0, 900); await p.waitForTimeout(600);
    await p.reload({ waitUntil: "load" }); await p.waitForTimeout(2500);
    let fs = await fr(p);
    ok("historico", `${w}x${h}: recarga na posição de leitura → não repete`, semEntrada(fs) && tudoCompleto(await final(p)));
    await p.goto(BASE + "/pt", { waitUntil: "load" }); await p.waitForTimeout(2500); fs = await fr(p);
    // o h1 já foi visto: não volta; um título que ainda não entrou (o leitor não chegou até ele) pode armar
    ok("historico", `${w}x${h}: nova carga da mesma página na aba → o h1 não repete (uma vez por aba)`, fs.filter((x) => x.h1).every((x) => x.h1.op >= 0.999 && !x.h1.n) && !fs.some((x) => x.ent), { titulosArmados: Object.entries((await final(p)).ts).filter(([, a]) => a.n).map(([k]) => k) });
    await p.goto(BASE + "/pt/empresa", { waitUntil: "load" }); await p.waitForTimeout(2500);
    await p.goBack({ waitUntil: "load" }); await p.waitForTimeout(2500); fs = await fr(p);
    ok("historico", `${w}x${h}: volta entre documentos → não repete`, semEntrada(fs) && tudoCompleto(await final(p)));
    await ctx.close();
  }
  {
    const { ctx, p } = await nova(1366, 768);
    await ir(p, "/pt?texto=gsap", 2600);
    await p.click("header .nav a[href='/pt/plataforma']"); await p.waitForURL(/plataforma/); await p.waitForTimeout(2500);
    await zera(p); await p.goBack(); await p.waitForURL(/\/pt(\?|$)/); await p.waitForTimeout(2500);
    let fs = await fr(p);
    const ok1 = semEntrada(fs.filter((x) => x.p === "/pt"));
    await zera(p); await p.goForward(); await p.waitForURL(/plataforma/); await p.waitForTimeout(2500); fs = await fr(p);
    ok("historico", "voltar/avançar no app → não repete", ok1 && semEntrada(fs.filter((x) => x.p.endsWith("plataforma"))) && tudoCompleto(await final(p)) && !p.__erros.length, { ok1, erros: p.__erros });
    await ctx.close();
  }
}

if (!PUBLICO && roda("app")) {
  for (const [de, para, w, h] of [["/pt", "/pt/plataforma", 1366, 768], ["/pt/plataforma", "/pt/empresa", 1366, 768], ["/es/empresa", "/es/soluciones", 390, 844], ["/pt/empresa", "/pt", 1440, 900]]) {
    const { ctx, p } = await nova(w, h);
    await ir(p, de + "?texto=gsap", 3000);
    const idOrigem = await p.evaluate(() => document.querySelector("main [data-texto=h1]")?.id || null);
    await zera(p);
    const sel = w < 900 ? null : `header .nav a[href='${para}']`;
    if (sel && await p.$(sel)) await p.click(sel);
    else await p.evaluate((u) => { const a = document.querySelector(`a[href='${u}']`); a ? a.click() : (location.href = u); }, para);
    await p.waitForURL((u) => u.pathname === para); await p.waitForTimeout(3000);
    // o endereço muda (pushState) antes de a página nova entrar: quadros com o h1 da página de origem não contam
    const fs = (await fr(p)).filter((x) => x.p === para && x.h1id && x.h1id !== idOrigem);
    const t0 = primeiro(fs), toc = tocouH1(fs), fim = await final(p);
    const seguro = escondido(fs.find((x) => x.h1)?.h1); // seguro pela marca (opacidade 0) ou já dividido com as linhas abaixo da máscara
    ok("app", `${de} → ${para} (${w}x${h}): h1 seguro no 1º quadro, entra uma vez, termina inteiro`, seguro && toc.mexeu !== null && !someuDepois(fs, (x) => x.h1).length && completo(fim.h1) && !fim.html && !p.__erros.length, { espera: toc.mexeu !== null ? toc.mexeu - t0 : null, entrada: toc.fim - toc.mexeu, seguro, primeiros: fs.slice(0, 3).map((x) => ({ t: x.t, id: x.h1id, op: x.h1?.op, n: x.h1?.n, ent: x.ent })), sumiu: someuDepois(fs, (x) => x.h1).slice(0, 2), fim: { st: fim.st, h1: fim.h1, linhas: fim.linhas }, erros: p.__erros });
    await ctx.close();
  }
  // o bloco do h1 não desliza junto (só aparece) quando a transição de página está ligada
  {
    const { ctx, p } = await nova(1366, 768);
    await ctx.addInitScript(() => { try { sessionStorage.setItem("ararat:transicao", "candidata"); } catch {} });
    await ir(p, "/pt/empresa?texto=gsap&transicao=candidata", 2500);
    const nomes = [];
    await p.evaluate(() => { window.__an = []; document.addEventListener("animationstart", (e) => { const t = e.target; if (t.querySelector?.("[data-texto=h1]")) window.__an.push(e.animationName); }, true); });
    await p.click("header .nav a[href='/pt/plataforma']"); await p.waitForURL(/plataforma/); await p.waitForTimeout(2500);
    nomes.push(...await p.evaluate(() => window.__an));
    const fim = await final(p);
    ok("app", "com a transição de página: o bloco do h1 só aparece (sem deslocamento); as linhas sobem", nomes.length > 0 && nomes.every((n) => n === "ararat-pagina-entra-opacidade") && tudoCompleto(fim), { nomes, transicao: await p.evaluate(() => document.documentElement.dataset.transicao) });
    await ctx.close();
  }
}

if (!PUBLICO && roda("rever")) {
  const { ctx, p } = await nova(1366, 768);
  await ir(p, "/pt?texto=gsap", 2600); await p.mouse.wheel(0, 1400); await p.waitForTimeout(700);
  await zera(p); await p.click(".texto-revisao button"); await p.waitForTimeout(2600);
  const fs = await fr(p); const y = await p.evaluate(() => scrollY); await ler(p); const fim = await final(p);
  const link = await p.getAttribute(".texto-revisao a", "href");
  ok("rever", "\"Rever entrada\" volta ao topo e repete o h1; \"Ver atual\" aponta para ?texto=atual", tocouH1(fs).mexeu !== null && y < 5 && tudoCompleto(fim) && link === "/pt?texto=atual", { link });
  await ctx.close();
}

if (!PUBLICO && roda("acessibilidade")) {
  for (const rota of ["/pt", "/es/plataforma", "/research"]) {
    const { ctx, p } = await nova(1366, 768, { congelar: true });
    await ir(p, rota + "?texto=gsap", 1);
    const depois0 = await p.locator("main [data-texto=h1]").ariaSnapshot().catch(() => null);
    await p.waitForTimeout(3200);
    const durante = await p.locator("main [data-texto=h1]").ariaSnapshot();
    const info = await p.evaluate(() => { const e = document.querySelector("main [data-texto=h1]"); return { aria: e.getAttribute("aria-label"), linhasOcultas: [...e.querySelectorAll(".texto-linha")].every((l) => l.closest("[aria-hidden=true]")), n: e.querySelectorAll(".texto-linha").length, tag: e.tagName, id: e.id }; });
    await p.evaluate(() => dispatchEvent(new Event("pagehide"))); await p.waitForTimeout(100);
    const depois = await p.locator("main [data-texto=h1]").ariaSnapshot();
    const h1s = await p.evaluate(() => document.querySelectorAll("h1").length);
    ok("acessibilidade", `${rota}: um só h1, mesmo nome acessível dividido e depois; linhas fora da árvore`, info.n > 0 && info.tag === "H1" && info.linhasOcultas && durante === depois && h1s === 1, { durante, depois, aria: info.aria, inicio: depois0 });
    await ctx.close();
  }
}

if (!PUBLICO && roda("montanha")) {
  const arte = (p) => p.evaluate(() => { const r = document.querySelector("[data-hero] .hero-arte")?.getBoundingClientRect(); const h = document.querySelector("[data-hero] .hero-host"); return { r: r && [r.x, r.y, r.width, r.height].map((v) => Math.round(v)), hostDisplay: h ? getComputedStyle(h).display : null }; });
  const exclusivo = (fs) => fs.filter((x) => x.m).every((x) => (x.m.pic === "visible") !== (x.m.host === "visible") && x.m.cv <= 1);
  for (const [w, h] of [[1366, 768], [1920, 990], [390, 844]]) for (const texto of ["atual", "gsap"]) {
    const { ctx, p } = await nova(w, h, { texto });
    await ir(p, `/pt?texto=${texto}`, 3000);
    let fs = await fr(p); const a1 = await arte(p); const ult = fs[fs.length - 1].m;
    ok("montanha", `${w}x${h} ${texto}: poster e canvas nunca juntos; no fim só o canvas`, exclusivo(fs) && ult.at === "canvas" && ult.cv === 1 && ult.pic === "hidden" && ult.host === "visible" && a1.hostDisplay !== "none", { ult, a1 });
    await p.click("header .nav a[href='/pt/empresa'], .menu a[href='/pt/empresa']").catch(() => p.goto(BASE + "/pt/empresa"));
    await p.waitForURL(/empresa/); await p.waitForTimeout(1200); await zera(p);
    await p.goBack(); await p.waitForURL(/\/pt(\?|$)/); await p.waitForTimeout(2500); fs = await fr(p); const a2 = await arte(p);
    const ult2 = fs[fs.length - 1].m;
    ok("montanha", `${w}x${h} ${texto}: depois de sair e voltar no app → exclusivos, um canvas, mesmo retângulo`, exclusivo(fs) && ult2.cv === 1 && JSON.stringify(a1.r) === JSON.stringify(a2.r), { ult2, a2 });
    await ctx.close();
    const f2 = await nova(w, h, { texto });
    await ir(f2.p, `/pt?texto=${texto}&montanha=falha`, 2500);
    fs = await fr(f2.p); const a3 = await arte(f2.p); const u3 = fs[fs.length - 1].m;
    ok("montanha", `${w}x${h} ${texto}: ?montanha=falha → só o poster, mesmo retângulo`, exclusivo(fs) && u3.at === "poster" && u3.pic === "visible" && u3.host === "hidden" && u3.cv === 0 && JSON.stringify(a1.r) === JSON.stringify(a3.r), { u3, a3 });
    await f2.ctx.close();
  }
  // pausa, movimento reduzido e resize com a montanha à vista: continua uma só fonte visual
  for (const [w, h, w2, h2] of [[1366, 768, 1100, 768], [390, 844, 844, 390]]) {
    const { ctx, p } = await nova(w, h);
    await ir(p, "/pt?texto=gsap", 2600); await zera(p);
    await p.evaluate(() => window.ARARAT_MOVIMENTO.definir(true)); await p.waitForTimeout(400);
    await p.emulateMedia({ reducedMotion: "reduce" }); await p.waitForTimeout(400);
    await p.setViewportSize({ width: w2, height: h2 }); await p.waitForTimeout(800);
    await p.evaluate(() => window.ARARAT_MOVIMENTO.definir(false)); await p.emulateMedia({ reducedMotion: "no-preference" });
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(800);
    const fs = await fr(p); const u = fs[fs.length - 1].m;
    ok("montanha", `${w}x${h}: pausa, reduzido e resize (${w2}x${h2}) → uma só fonte visual em todos os quadros`, exclusivo(fs) && u.cv === 1 && u.pic === "hidden" && !p.__erros.length, { u, quadros: fs.length });
    await ctx.close();
  }
  for (const [w, h] of [[1366, 768], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false });
    const p = await ctx.newPage(); await p.goto(BASE + "/pt?texto=gsap", { waitUntil: "load" }); await p.waitForTimeout(800);
    const r = await p.evaluate(() => { const hero = document.querySelector("[data-hero]"); const pic = hero.querySelector(".hero-arte picture"), img = pic?.querySelector("img"); const h1 = document.querySelector("main [data-texto=h1]"); return { at: hero.dataset.montanha, pic: getComputedStyle(pic).visibility, img: img ? img.complete && img.naturalWidth > 0 : null, h1: getComputedStyle(h1).opacity, ent: document.documentElement.dataset.textoEntrada || "" }; });
    ok("montanha", `${w}x${h} sem JS: poster inteiro e h1 visível`, r.at === "poster" && r.pic === "visible" && r.img && r.h1 === "1" && !r.ent, r);
    await ctx.close();
  }
}

if (!PUBLICO && roda("custo")) {
  const medir = async (texto) => {
    const out = [];
    for (let i = 0; i < 5; i++) {
      const { ctx, p } = await nova(1366, 768, { texto });
      const cdp = await ctx.newCDPSession(p); await cdp.send("Performance.enable");
      await ir(p, `/pt?texto=${texto}`, 2800); await ler(p);
      const m = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
      out.push({ js: [...new Set(p.__js)].length, jsBytes: p.__jsBytes, gsap: p.__gsap, script: Math.round(m.ScriptDuration * 1000), estilo: Math.round(m.RecalcStyleDuration * 1000), layout: Math.round(m.LayoutDuration * 1000), tarefa: Math.round(m.TaskDuration * 1000) });
      await ctx.close();
    }
    const med = (k) => out.map((x) => x[k]).sort((a, c) => a - c)[2];
    return { arquivos: med("js"), jsBytes: med("jsBytes"), script: med("script"), estilo: med("estilo"), layout: med("layout"), tarefa: med("tarefa"), gsap: out[0].gsap };
  };
  const at = await medir("atual"), ca = await medir("gsap");
  const bytes = ca.gsap.reduce((s, x) => s + x.bytes, 0), gz = ca.gsap.reduce((s, x) => s + x.gz, 0);
  ok("custo", "custo do candidato (1366×768, carga + leitura, mediana de 5)", ca.gsap.length > 0 && !at.gsap.length, { atual: { ...at, gsap: undefined }, candidato: { ...ca, gsap: undefined }, gsapArquivos: ca.gsap.map((x) => ({ arquivo: x.u.split("/").pop(), bytes: x.bytes, gzip: x.gz })), gsapBytes: bytes, gsapGzip: gz });
}

// ------------------------------------------------------------------------------------------------ pública
if (PUBLICO && roda("publica")) {
  for (const [rota] of [...HOMES, ["/pt/plataforma"], ["/es/empresa"]]) {
    const { ctx, p } = await nova(1366, 768, { texto: "gsap" });
    await ir(p, rota + "?texto=gsap", 2600); await ler(p);
    const fs = await fr(p), fim = await final(p);
    const attr = await p.evaluate(() => ({ texto: document.documentElement.dataset.texto ?? null, revisao: document.documentElement.dataset.revisao ?? null }));
    ok("publica", `${rota}: ritmo aprovado por padrão, título completo ao final e sem controles privados`, fs.some((x) => x.h1?.n > 0) && p.__gsap.length > 0 && !fim.ctl && attr.texto === "gsap" && !attr.revisao && tudoCompleto(fim), { attr, gsap: p.__gsap.length });
    await ctx.close();
  }
}
if (PUBLICO && roda("montanha-publica")) {
  for (const [w, h] of [[1366, 768], [390, 844]]) {
    const { ctx, p } = await nova(w, h, { texto: null });
    await ir(p, "/pt", 3000);
    const fs = await fr(p); const u = fs[fs.length - 1].m;
    ok("montanha-publica", `${w}x${h}: poster e canvas nunca juntos; no fim só o canvas`, fs.filter((x) => x.m).every((x) => (x.m.pic === "visible") !== (x.m.host === "visible") && x.m.cv <= 1) && u.at === "canvas" && u.pic === "hidden", { u });
    await ctx.close();
  }
}

await b.close();
const falhas = res.filter((r) => !r.ok).length;
console.log(`\n${res.length - falhas} ok, ${falhas} falha(s)`);
if (SAIDA) writeFileSync(SAIDA, JSON.stringify({ base: BASE, publico: PUBLICO, data: new Date().toISOString(), resultados: res }, null, 1));
process.exit(falhas ? 1 : 0);
