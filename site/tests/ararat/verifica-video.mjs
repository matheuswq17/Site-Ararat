#!/usr/bin/env node
/**
 * Vídeo "Hub e Viewer em ação" (Plataforma #video, chamada da Home e atalho do menu).
 *   node tests/ararat/verifica-video.mjs http://127.0.0.1:PORTA [--publico] [--canal=msedge|chrome] [--webm]
 * Revisão privada: posição da seção, área reservada, capa do formato da tela, nada de vídeo antes do clique, só o
 * formato escolhido, sem autoplay/loop, controles, teclado, pausa global (pausa; retomar não reproduz), saída da página,
 * falha de mídia, âncora, chamada da Home, atalho do menu e os três idiomas.
 * Pública (--publico): vídeo aprovado disponível; demais arquivos privados continuam bloqueados.
 * --canal=msedge|chrome: exercita os MP4 H.264/AAC reais no navegador instalado, sem substituir a mídia.
 * --webm: o Chromium do Playwright não decodifica H.264/AAC; para exercitar a reprodução, as requisições dos .mp4
 * são redirecionadas para /privado/video-teste/16x9.webm|9x16.webm (copiar para public/privado/video-teste/ só no teste;
 * pasta ignorada pelo Git e bloqueada na pública). A reprodução real dos MP4 fica para o navegador real.
 */
import { chromium } from "playwright";

const BASE = (process.argv[2] || "http://127.0.0.1:3190").replace(/\/$/, "");
const PUBLICO = process.argv.includes("--publico");
const WEBM = process.argv.includes("--webm");
const CANAL = process.argv.find((x) => x.startsWith("--canal="))?.split("=")[1];
if (CANAL && !["msedge", "chrome"].includes(CANAL)) throw new Error("Canal não reconhecido");
const res = [];
const ok = (g, n, p, d = {}) => { res.push({ g, n, ok: !!p }); console.log(`${p ? "ok  " : "FALHA"} [${g}] ${n}${Object.keys(d).length ? " " + JSON.stringify(d).slice(0, 300) : ""}`); };
const b = await chromium.launch(CANAL ? { channel: CANAL } : {});
const PAGS = { pt: ["/pt", "/pt/plataforma"], en: ["/", "/platform"], es: ["/es", "/es/plataforma"] };
const TITULO = { pt: "Hub e Viewer em ação", en: "Hub and Viewer in action", es: "Hub y Viewer en acción" };

async function pagina(w, h, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: opts.reduzido ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  const pedidos = [];
  p.on("request", (r) => { if (/\/video\//.test(r.url())) pedidos.push({ url: r.url().replace(BASE, ""), range: r.headers().range || null }); });
  if (WEBM) await p.route(/\/(?:privado|ararat)\/video\/.*\.mp4(\?|$)/, (r) => {
    if (opts.falha) return r.abort("failed");
    // servida pelo próprio servidor (com Range, para a busca), a partir de public/privado/video-teste/ (só no teste)
    const f = r.request().url().includes("9x16") ? "9x16.webm" : "16x9.webm";
    return r.continue({ url: `${BASE}/privado/video-teste/${f}` });
  });
  else if (opts.falha) await p.route(/\/(?:privado|ararat)\/video\/.*\.mp4/, (r) => r.abort("failed"));
  return { ctx, p, pedidos };
}

if (PUBLICO) {
  for (const path of ["/privado/video/ararat-hub-viewer-demo-03d2-v2-16x9.mp4", "/privado/cap/seg-t2-com-mascaras-748.webp"]) {
    const r = await fetch(BASE + path);
    ok("publica", `${path} continua bloqueado (404)`, r.status === 404, { status: r.status });
  }
  for (const formato of ["16x9", "9x16"]) {
    const r = await fetch(`${BASE}/ararat/video/03d2-v2/ararat-hub-viewer-demo-03d2-v2-${formato}.mp4`, { headers: { Range: "bytes=0-1023" } });
    const bytes = await r.arrayBuffer();
    ok("publica", `${formato}: MP4 público com leitura parcial (Range)`,
      r.status === 206 && /video\/mp4/.test(r.headers.get("content-type") || "") &&
      /^bytes 0-1023\//.test(r.headers.get("content-range") || "") && bytes.byteLength === 1024,
      { status: r.status, range: r.headers.get("content-range"), bytes: bytes.byteLength });
  }
}
{
  // 1) posição, área reservada e capa — desktop e celular, três idiomas
  for (const [l, [home, plat]] of Object.entries(PAGS)) {
    for (const [w, h, fmt] of [[1440, 900, "16x9"], [390, 844, "9x16"]]) {
      const { ctx, p, pedidos } = await pagina(w, h);
      const cls = [];
      await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: "layout-shift", buffered: true }); });
      await p.goto(BASE + plat, { waitUntil: "domcontentloaded" });
      const g0 = await p.evaluate(() => { const q = document.querySelector("[data-video-quadro]"); const r = q?.getBoundingClientRect(); return r ? { w: r.width, h: r.height } : null; });
      await p.waitForLoadState("networkidle");
      await p.evaluate(() => document.getElementById("video")?.scrollIntoView());
      await p.waitForTimeout(600);
      const x = await p.evaluate(() => {
        const s = document.getElementById("video"), prev = s?.previousElementSibling, next = s?.nextElementSibling;
        const q = document.querySelector("[data-video-quadro]"), r = q.getBoundingClientRect();
        const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--head")) || 64;
        return { titulo: s.querySelector("h2").textContent, antes: prev?.className, depois: next?.className, w: r.width, h: r.height,
          cabe: r.height <= innerHeight - head, video: !!document.querySelector("main video"), play: !!document.querySelector("[data-video-play]"),
          dur: document.querySelector(".video-dur")?.textContent, resumo: document.querySelectorAll(".video-resumo li").length, cls: window.__cls, over: document.documentElement.scrollWidth - innerWidth };
      });
      const prop = fmt === "16x9" ? 16 / 9 : 9 / 16;
      ok("layout", `${l} ${w}x${h}: seção logo depois da apresentação e antes das tarefas`, /plat-topo/.test(x.antes) && /plat-hub/.test(x.depois) && x.titulo === TITULO[l], { antes: x.antes, depois: x.depois, titulo: x.titulo });
      ok("layout", `${l} ${w}x${h}: área reservada na proporção ${fmt}, cabe na altura visível, sem deslocamento`, Math.abs(x.w / x.h - prop) < 0.01 && x.cabe && g0 && Math.abs(g0.h - x.h) < 1 && x.cls < 0.01 && x.over <= 0, { g0, w: x.w, h: x.h, cls: x.cls, over: x.over });
      const mp4 = pedidos.filter((q) => q.url.endsWith(".mp4")), capas = pedidos.filter((q) => q.url.endsWith(".webp"));
      ok("rede", `${l} ${w}x${h}: antes do clique nenhum vídeo; só a capa ${fmt}`, !mp4.length && capas.length === 1 && capas[0].url.includes(fmt) && !x.video && x.play, { mp4: mp4.length, capas: capas.map((c) => c.url) });
      ok("conteudo", `${l} ${w}x${h}: duração indicada e resumo textual`, /1\s*min\s*55/.test(x.dur || "") && x.resumo === 10, { dur: x.dur, resumo: x.resumo });
      // chamada da Home leva à seção
      await p.goto(BASE + home, { waitUntil: "networkidle" });
      const ch = p.locator(".video-chamada a");
      const n = await ch.count();
      if (n) { await ch.first().click(); await p.waitForURL(/#video$/); await p.waitForTimeout(900); }
      const y = await p.evaluate(() => { const s = document.getElementById("video"); const r = s?.getBoundingClientRect(); return { url: location.pathname + location.hash, topo: r ? Math.round(r.top) : null, menu: [...document.querySelectorAll('.cab a[href$="#video"], nav a[href$="#video"]')].length }; });
      ok("navegacao", `${l} ${w}x${h}: chamada da Home → #video (seção no alto da tela); atalho no menu`, n === 1 && y.url.endsWith("#video") && y.topo !== null && y.topo >= -2 && y.topo < 140 && y.menu >= 1, { n, ...y });
      await ctx.close();
    }
  }
  // 2) reprodução, controles, teclado, pausa global, saída da página (desktop e celular)
  for (const [w, h, fmt] of [[1440, 900, "16x9"], [390, 844, "9x16"]]) {
    const { ctx, p, pedidos } = await pagina(w, h);
    await p.goto(BASE + "/pt/plataforma#video", { waitUntil: "networkidle" });
    await p.focus("[data-video-play]");
    await p.keyboard.press("Enter");
    await p.waitForTimeout(2500);
    const x = await p.evaluate(() => { const v = document.querySelector("main video"); return v ? { foco: document.activeElement === v, controls: v.controls, autoplay: v.hasAttribute("autoplay"), loop: v.loop, t: v.currentTime, pausado: v.paused, erro: v.error?.code ?? null, botao: !document.querySelector("[data-pausa]")?.hidden } : null; });
    const mp4 = [...new Set(pedidos.filter((q) => q.url.endsWith(".mp4")).map((q) => q.url))];
    ok("player", `${w}x${h}: Enter na capa cria o player com foco, controles nativos, sem autoplay/loop no HTML`, x && x.foco && x.controls && !x.autoplay && !x.loop, x || {});
    ok("rede", `${w}x${h}: só o formato ${fmt} é pedido`, mp4.length === 1 && mp4[0].includes(fmt), { mp4 });
    if (WEBM || CANAL) {
      ok("player", `${w}x${h}: reproduz depois do clique (${WEBM ? "WebM de teste" : "MP4 real"})`, x && x.t > 0.5 && !x.pausado, x || {});
      ok("pausa", `${w}x${h}: botão de pausa global aparece durante a reprodução`, x && x.botao, x || {});
      await p.evaluate(() => window.ARARAT_MOVIMENTO.definir(true));
      await p.waitForTimeout(400);
      const pa = await p.evaluate(() => document.querySelector("main video").paused);
      await p.evaluate(() => window.ARARAT_MOVIMENTO.definir(false));
      await p.waitForTimeout(800);
      const re = await p.evaluate(() => document.querySelector("main video").paused);
      ok("pausa", `${w}x${h}: pausa global interrompe; retomar as animações não reproduz`, pa === true && re === true, { pa, re });
      await p.evaluate(() => document.querySelector("main video").play());
      await p.waitForTimeout(700);
      const sk = await p.evaluate(() => { const v = document.querySelector("main video"); v.currentTime = 60; return new Promise((r) => v.addEventListener("seeked", () => r(Math.round(v.currentTime)), { once: true })); });
      ok("player", `${w}x${h}: busca`, sk === 60, { sk });
      // saída da página: navegação no app para outra página
      const antes = await p.evaluate(() => { window.__v = document.querySelector("main video"); return !window.__v.paused; });
      await p.evaluate(() => document.querySelector('a[href="/pt/pesquisa"]').click()); // navegação no app (Link)
      await p.waitForURL(/\/pt\/pesquisa/); await p.waitForTimeout(800);
      const depois = await p.evaluate(() => ({ pausado: window.__v.paused, src: window.__v.getAttribute("src"), conectado: window.__v.isConnected }));
      ok("saida", `${w}x${h}: ao sair da página o vídeo para e a transferência é interrompida`, antes && depois.pausado && !depois.src && !depois.conectado, { antes, ...depois });
      await p.evaluate(() => window.ARARAT_MOVIMENTO.definir(false));
    }
    await ctx.close();
  }
  // 3) falha de mídia: mensagem útil e o resto da página funcionando
  {
    const { ctx, p } = await pagina(1440, 900, { falha: true });
    await p.goto(BASE + "/pt/plataforma#video", { waitUntil: "networkidle" });
    await p.click("[data-video-play]");
    await p.waitForTimeout(1500);
    const x = await p.evaluate(() => { const m = document.querySelector("[data-video-msg]"); return { estado: document.querySelector("[data-video-demo]").dataset.video, msg: m && !m.hidden ? m.textContent : null, tarefas: !!document.getElementById("receber") }; });
    await p.click(`a[href="/pt/plataforma#receber"]`, { force: true }).catch(() => {});
    ok("falha", "mídia indisponível: mensagem útil, resumo e restante da página", x.estado === "falha" && !!x.msg && x.tarefas, x);
    await ctx.close();
  }
  // 4) sem JS: player nativo com preload="none" e o resumo
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const p = await ctx.newPage(); const pedidos = [];
    p.on("request", (r) => { if (r.url().endsWith(".mp4")) pedidos.push(r.url()); });
    await p.goto(BASE + "/pt/plataforma", { waitUntil: "networkidle" });
    const x = await p.evaluate(() => ({ video: document.querySelector("noscript") ? true : false, preload: document.querySelector(".video-nativo")?.getAttribute("preload") ?? null, resumo: document.querySelectorAll(".video-resumo li").length }));
    ok("semjs", "sem JavaScript: player nativo sem pré-carga e resumo, nenhum vídeo baixado", x.preload === "none" && x.resumo === 10 && !pedidos.length, { ...x, pedidos: pedidos.length });
    await ctx.close();
  }
}
await b.close();
const f = res.filter((r) => !r.ok).length;
console.log(`\n${res.length - f}/${f}`);
process.exit(f ? 1 : 0);
