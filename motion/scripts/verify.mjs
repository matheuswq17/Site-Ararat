// Verificação automatizada do contrato + capturas (opcional).
// Requer Playwright: `npm i -D playwright` em motion/ (ou PLAYWRIGHT_MODULE apontando para o pacote).
// Uso: npm run verify            → testes
//      npm run capture           → testes + screenshots, storyboard e posters webp
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startServer } from './serve.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const CAPTURE = process.argv.includes('--capture');
const pwPath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = pwPath ? await import(pathToFileURL(join(pwPath, 'index.mjs')).href) : await import('playwright');

const { server, port } = await startServer(Number(process.env.PORT) || 3001);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch();
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

// Página de teste vazia que importa o módulo do pacote entregue.
const TEST_HTML = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/deliverables/web/journey.css">
<style>html,body{margin:0;background:#080f18}#c{width:100vw;height:100vh}</style></head>
<body><div id="c"></div><script>
  window.__raf = 0; const _r = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => { window.__raf++; return _r(cb); };
  window.__listeners = 0;
  for (const t of [window, document, document.body || document.documentElement]) {
    const a = t.addEventListener.bind(t);
    t.addEventListener = (...x) => { if (window.__counting) window.__listeners++; return a(...x); };
  }
</script></body></html>`;

async function testPage(w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  const external = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url()); });
  await page.route(base + '/__test', (route) => route.fulfill({ contentType: 'text/html', body: TEST_HTML }));
  await page.goto(base + '/__test');
  await page.evaluate(async () => {
    window.__mod = await import('/deliverables/web/journey.js');
    window.__snap = () => {
      const r = document.querySelector('#c .ararat-journey');
      if (!r) return null;
      const svgs = [...r.querySelectorAll('svg')].map((s) => s.outerHTML.replace(/aj[a-z0-9]{6}/g, 'ID')).join('');
      const bm = [...r.querySelectorAll('.ararat-journey__bitmap')].map((c) => c.style.transform + c.style.opacity).join('|');
      return svgs + bm;
    };
    // equivalência visual: tamanho efetivo do bitmap na tela (independe da resolução interna regenerada)
    window.__snapVisual = () => {
      const r = document.querySelector('#c .ararat-journey');
      const svgs = [...r.querySelectorAll('svg')].map((s) => s.outerHTML.replace(/aj[a-z0-9]{6}/g, 'ID')).join('');
      const bm = [...r.querySelectorAll('.ararat-journey__bitmap')].map((c) => { const m = new DOMMatrix(c.style.transform); return [m.a * (c.width || c.naturalWidth), m.e, m.f]; });
      return JSON.stringify({ svgs, bm });
    };
    window.__loaded = (timeout = 8000) => new Promise((ok, bad) => {
      const t0 = performance.now();
      (function poll() {
        const r = document.querySelector('#c .ararat-journey');
        if (r && r.dataset.loaded === 'true') return ok(true);
        if (performance.now() - t0 > timeout) return bad(new Error('imagem não carregou'));
        setTimeout(poll, 30);
      })();
    });
    // alinhamento: contorno da glândula (SVG) vs. imagem (<img>) vs. plano elevado (canvas), em px de tela
    window.__align = () => {
      const r = document.querySelector('#c .ararat-journey');
      const img = r.querySelector('img');
      const m = new DOMMatrix(img.style.transform);
      const M = window.__map;
      const gb = M.gland.bbox;
      const lift = r.querySelector('canvas');
      const lm = new DOMMatrix(lift.style.transform);
      const liftG = r.querySelectorAll('svg')[2].querySelector('g');
      const gm = new DOMMatrix(liftG.getAttribute('transform'));
      const ldy = (gm.f - m.f); // deslocamento do plano elevado (mesmo para svg e canvas)
      const pad = 4;
      const expCanvas = [m.e + (gb[0] - pad) * m.a, m.f + (gb[1] - pad) * m.a + ldy];
      const fill = liftG.querySelector('path').getBoundingClientRect();
      const host = r.getBoundingClientRect();
      // bbox real do path vs. bbox do mapa transformado pela MESMA matriz da imagem (+ elevação)
      const exp = { x: m.e + gb[0] * m.a, y: m.f + gb[1] * m.a + ldy, w: gb[2] * m.a, h: gb[3] * m.a };
      const got = { x: fill.left - host.left, y: fill.top - host.top, w: fill.width, h: fill.height };
      const scaleSame = Math.abs(m.a - gm.a) < 1e-3 && Math.abs(m.a - lm.a) < 1e-3 && Math.abs(m.e - gm.e) < 0.02;
      const dCanvas = Math.max(Math.abs(lm.e - expCanvas[0]), Math.abs(lm.f - expCanvas[1]));
      const dPath = Math.max(Math.abs(exp.x - got.x), Math.abs(exp.y - got.y), Math.abs(exp.w - got.w), Math.abs(exp.h - got.h));
      return { scaleSame, dCanvas: +dCanvas.toFixed(3), dPath: +dPath.toFixed(3), s: +m.a.toFixed(3) };
    };
    window.__map = await (await fetch('/deliverables/assets/mri-map.json')).json();
  });
  return { page, errors, external };
}
const settle = (page, ms = 1400) => page.waitForTimeout(ms);
// SVG idêntico; bitmap com tolerância de 1,5 px (arredondamento da resolução interna regenerada)
const sameVisual = (a, b) => {
  const A = JSON.parse(a), B = JSON.parse(b);
  return A.svgs === B.svgs && A.bm.length === B.bm.length && A.bm.every((v, i) => v.every((x, j) => Math.abs(x - B.bm[i][j]) <= 1.5));
};

for (const [w, h] of [[1440, 810], [390, 700], [766, 638], [350, 438]]) {
  const tag = `${w}x${h}`;
  const { page, errors, external } = await testPage(w, h);

  const api = await page.evaluate(() => {
    const keys = Object.keys(window.__mod);
    window.__counting = true;
    const s = (window.__s = window.__mod.createJourneyScene(document.getElementById('c'), { baseUrl: '/deliverables/', reducedMotion: false, paused: true }));
    window.__counting = false;
    return { keys, methods: Object.keys(s).sort(), listeners: window.__listeners, nodes: document.getElementById('c').childElementCount };
  });
  await page.evaluate(() => window.__loaded());
  check(`[${tag}] exporta somente createJourneyScene`, api.keys.length === 1 && api.keys[0] === 'createJourneyScene', api.keys.join(','));
  check(`[${tag}] retorno com 4 métodos do contrato`, api.methods.join(',') === 'destroy,setPaused,setProgress,setReducedMotion', api.methods.join(','));
  check(`[${tag}] nenhum listener global (window/document/body)`, api.listeners === 0, `listeners=${api.listeners}`);

  // ida
  const fwd = {}, back = {};
  const P = [0, 1 / 3, 2 / 3, 1];
  for (const p of P) {
    await page.evaluate((p) => window.__s.setProgress(p), p);
    await settle(page);
    fwd[p] = await page.evaluate(() => window.__snap());
  }
  for (const p of [...P].reverse()) {
    await page.evaluate((p) => window.__s.setProgress(p), p);
    await settle(page);
    back[p] = await page.evaluate(() => window.__snap());
  }
  // alinhamento em poses e intermediárias
  {
    const worst = { dPath: 0, dCanvas: 0, scaleSame: true };
    for (const p of [0, 1 / 6, 1 / 3, 0.5, 2 / 3, 5 / 6, 1]) {
      await page.evaluate((p) => window.__s.setProgress(p), p);
      await settle(page, 1300);
      const a = await page.evaluate(() => window.__align());
      worst.dPath = Math.max(worst.dPath, a.dPath); worst.dCanvas = Math.max(worst.dCanvas, a.dCanvas); worst.scaleSame = worst.scaleSame && a.scaleSame;
    }
    check(`[${tag}] máscaras alinhadas à imagem em 7 valores de progress (≤0,75 px)`, worst.scaleSame && worst.dPath <= 0.75 && worst.dCanvas <= 0.05, JSON.stringify(worst));
  }
  check(`[${tag}] ida e volta produzem as mesmas poses (0, 1/3, 2/3, 1)`, P.every((p) => fwd[p] === back[p]));
  check(`[${tag}] as quatro poses são distintas`, new Set(P.map((p) => fwd[p])).size === 4);

  // salto direto (independência de caminho)
  await page.evaluate(() => window.__s.setProgress(0));
  await settle(page);
  await page.evaluate(() => window.__s.setProgress(2 / 3));
  await settle(page, 1600);
  check(`[${tag}] salto 0→2/3 converge para a mesma pose`, (await page.evaluate(() => window.__snap())) === fwd[2 / 3]);

  // clamp e valores inválidos
  await page.evaluate(() => window.__s.setProgress(5));
  await settle(page);
  check(`[${tag}] clamp: 5 → pose 1`, (await page.evaluate(() => window.__snap())) === fwd[1]);
  await page.evaluate(() => { window.__s.setProgress(NaN); window.__s.setProgress(Infinity); window.__s.setProgress('0.2'); window.__s.setProgress(undefined); });
  await settle(page, 600);
  check(`[${tag}] valores não finitos mantêm estado anterior`, (await page.evaluate(() => window.__snap())) === fwd[1]);
  await page.evaluate(() => window.__s.setProgress(-3));
  await settle(page);
  check(`[${tag}] clamp: -3 → pose 0`, (await page.evaluate(() => window.__snap())) === fwd[0]);

  // pausa: sem rAF quando assentado; setProgress responde mesmo pausado
  await settle(page, 300);
  let raf = await page.evaluate(async () => { const a = window.__raf; await new Promise((r) => setTimeout(r, 800)); return window.__raf - a; });
  check(`[${tag}] pausado e assentado: nenhum requestAnimationFrame`, raf === 0, `rAF em 800ms=${raf}`);
  await page.evaluate(() => window.__s.setProgress(1 / 3));
  await settle(page);
  check(`[${tag}] pausado: setProgress ainda responde`, (await page.evaluate(() => window.__snap())) === fwd[1 / 3]);
  // ambiente ativo
  await page.evaluate(() => window.__s.setPaused(false));
  const a1 = await page.evaluate(() => window.__snap());
  raf = await page.evaluate(async () => { const a = window.__raf; await new Promise((r) => setTimeout(r, 800)); return window.__raf - a; });
  const a2 = await page.evaluate(() => window.__snap());
  check(`[${tag}] não pausado: movimento ambiente roda`, raf > 10 && a1 !== a2, `rAF em 800ms=${raf}`);
  await page.evaluate(() => window.__s.setPaused(true));
  await settle(page, 200);
  const b1 = await page.evaluate(() => window.__snap());
  await settle(page, 600);
  check(`[${tag}] setPaused(true) congela o ambiente`, b1 === (await page.evaluate(() => window.__snap())));

  // movimento reduzido
  const red = await page.evaluate(async () => {
    window.__s.setPaused(false);
    window.__s.setReducedMotion(true);
    window.__s.setProgress(0.4);
    const immediate = document.querySelector('.ararat-journey').dataset.state;
    const s1 = window.__snap();
    const a = window.__raf;
    await new Promise((r) => setTimeout(r, 800));
    const rafs = window.__raf - a;
    window.__s.setProgress(1 / 3);
    const s2 = window.__snap();
    window.__s.setProgress(0.9);
    const s3state = document.querySelector('.ararat-journey').dataset.state;
    return { immediate, same: s1 === s2, rafs, s3state };
  });
  check(`[${tag}] reducedMotion: pose estática imediata (0.4 → estado 1)`, red.immediate === '1' && red.same, JSON.stringify(red));
  check(`[${tag}] reducedMotion: sem rAF mesmo com paused=false`, red.rafs === 0, `rAF=${red.rafs}`);
  check(`[${tag}] reducedMotion: 0.9 → estado 3`, red.s3state === '3');
  await page.evaluate(() => { window.__s.setReducedMotion(false); window.__s.setPaused(true); window.__s.setProgress(1 / 3); });
  await settle(page);

  // resize (compara com a pose imediatamente anterior: a fase ambiente avançou nos testes acima)
  const before = await page.evaluate(() => window.__snapVisual());
  await page.evaluate(() => { const c = document.getElementById('c'); c.style.width = '600px'; c.style.height = '900px'; });
  await settle(page, 700);
  const mid = await page.evaluate(() => window.__snapVisual());
  await page.evaluate(() => { const c = document.getElementById('c'); c.style.width = ''; c.style.height = ''; });
  await settle(page, 700);
  const after = await page.evaluate(() => window.__snapVisual());
  check(`[${tag}] resize: adapta e volta à mesma pose`, mid !== after && sameVisual(after, before), sameVisual(after, before) ? '' : (() => { let i = 0; while (i < after.length && after[i] === before[i]) i++; return before.slice(i - 60, i + 40) + ' ≠ ' + after.slice(i - 60, i + 40); })());

  // destroy e remontagem
  const d = await page.evaluate(async () => {
    const c = document.getElementById('c');
    const marker = document.createElement('span');
    marker.id = 'site-own';
    c.appendChild(marker);
    window.__s.setPaused(false);
    window.__s.setProgress(1);
    window.__s.destroy();
    window.__s.destroy();
    window.__s.setProgress(0.5); window.__s.setPaused(false); window.__s.setReducedMotion(true);
    const a = window.__raf;
    await new Promise((r) => setTimeout(r, 600));
    const rafs = window.__raf - a;
    const left = c.querySelectorAll('.ararat-journey').length;
    const keepsSite = !!document.getElementById('site-own');
    marker.remove();
    for (let i = 0; i < 15; i++) {
      const s = window.__mod.createJourneyScene(c, { baseUrl: '/deliverables/', reducedMotion: i % 2 === 0, paused: false });
      s.setProgress(i / 14);
      s.destroy();
    }
    const b = window.__raf;
    await new Promise((r) => setTimeout(r, 500));
    return { rafs, left, keepsSite, after: c.childElementCount, rafs2: window.__raf - b };
  });
  check(`[${tag}] destroy: remove apenas seus nós, idempotente, sem rAF`, d.left === 0 && d.keepsSite && d.rafs === 0, JSON.stringify(d));
  check(`[${tag}] 15 ciclos montar/desmontar sem resíduos`, d.after === 0 && d.rafs2 === 0);

  check(`[${tag}] sem erros de console/página`, errors.length === 0, errors.join(' | '));
  check(`[${tag}] sem requisições externas`, external.length === 0, external.join(' | '));
  await page.close();
}


// Textura v0.4: recorte de exibição parte alinhado à origem e não é ampliado além do teto da imagem
for (const [w, h] of [[766, 638], [350, 438], [1440, 810]]) {
  const tag = `${w}x${h}`;
  const { page, errors } = await testPage(w, h);
  const r = await page.evaluate(async () => {
    const c = document.getElementById('c');
    const s = window.__mod.createJourneyScene(c, { baseUrl: '/deliverables/', reducedMotion: false, paused: true });
    await window.__loaded();
    const wait = (ms) => new Promise((x) => setTimeout(x, ms));
    const M = window.__map;
    const TC = M.textureCrop;
    const svgs = c.querySelectorAll('.ararat-journey svg');
    const ov = svgs[svgs.length - 1];
    const img = c.querySelector('.ararat-journey img');
    const imgScale = new DOMMatrix(img.style.transform).a;
    // origem: tData = 0.1 → recorte ainda no lugar (tt = 0)
    s.setProgress(1 / 3 + 0.1 / 3);
    await wait(1400);
    const src = ov.querySelector('rect[stroke]'); // quadrado de origem no plano da glândula
    const border = [...ov.querySelectorAll('rect')].find((r) => r !== src && r.getAttribute('fill') === 'none' && r.hasAttribute('width') && !r.hasAttribute('rx'));
    const sb = src.getBoundingClientRect(), bb = border.getBoundingClientRect();
    const dOrigin = Math.max(Math.abs(sb.left - bb.left), Math.abs(sb.top - bb.top), Math.abs(sb.width - bb.width));
    // painel: escala interna ≤ teto
    s.setProgress(2 / 3);
    await wait(1400);
    const g = border.getBoundingClientRect();
    const internal = g.width / TC.size;
    s.destroy();
    return { hasTC: !!TC && TC.size === 96, dOrigin: +dOrigin.toFixed(2), internal: +internal.toFixed(3), cap: M.resolution.maxRecommendedCssScale, imgScale: +imgScale.toFixed(3) };
  });
  check(`[${tag}] textura: mapa traz textureCrop 96 px (sampleCrop preservado)`, r.hasTC);
  check(`[${tag}] textura: recorte parte exatamente do quadrado de origem (≤1 px)`, r.dOrigin <= 1, JSON.stringify(r));
  check(`[${tag}] textura: ampliação interna ≤ teto de 1,3 px CSS por px da base`, r.internal <= r.cap + 0.005, `${r.internal}`);
  check(`[${tag}] textura: sem erros de página`, errors.length === 0, errors.join(' | '));
  await page.close();
}

// Evento ararat:journey-layout (adendo v1.1)
for (const [w, h] of [[766, 638], [350, 438], [1440, 810], [390, 700]]) {
  const tag = `${w}x${h}`;
  const { page, errors } = await testPage(w, h);
  const r = await page.evaluate(async () => {
    const c = document.getElementById('c');
    const ev = [];
    let onWindow = 0;
    window.addEventListener('ararat:journey-layout', () => onWindow++);
    c.addEventListener('ararat:journey-layout', (e) => ev.push({ d: e.detail, bubbles: e.bubbles, t: e.target === c }));
    const s = window.__mod.createJourneyScene(c, { baseUrl: '/deliverables/', reducedMotion: false, paused: true });
    const initialSync = ev.length; // emissão inicial (layout) mesmo antes da imagem
    await window.__loaded();
    const wait = (ms) => new Promise((x) => setTimeout(x, ms));
    const at = async (p) => { s.setProgress(p); await wait(1300); return ev[ev.length - 1].d; };
    const p0 = await at(0);
    const p2 = await at(2 / 3);
    const p76 = await at(0.76), p84 = await at(0.84), p90 = await at(0.9);
    const p1 = await at(1);
    // ida e volta: mesmo payload para a mesma pose
    await at(2 / 3);
    const p1b = await at(1);
    // sem emissões redundantes: ambiente rodando, geometria parada
    s.setPaused(false);
    await wait(300);
    const n0 = ev.length;
    await wait(900);
    const redundant = ev.length - n0;
    s.setPaused(true);
    // resize emite
    const n1 = ev.length;
    c.style.width = Math.round(c.clientWidth * 0.8) + 'px';
    await wait(500);
    const afterResize = ev.length - n1;
    c.style.width = '';
    await wait(500);
    // reducedMotion: pose estática imediata, progress coerente
    s.setReducedMotion(true);
    s.setProgress(0.4);
    const red = ev[ev.length - 1].d;
    s.setProgress(0.9);
    const red2 = ev[ev.length - 1].d;
    s.setReducedMotion(false);
    // destroy: nenhuma emissão depois
    s.destroy();
    const n2 = ev.length;
    await wait(500);
    return { initialSync, p0, p2, p76, p84, p90, p1, p1b, redundant, afterResize, red, red2, after: ev.length - n2, onWindow, bubbles: ev.some((e) => e.bubbles), target: ev.every((e) => e.t), total: n2 };
  });
  const ids = (d) => d.labels.map((l) => l.id).join(',');
  const okShape = [r.p0, r.p2, r.p1].every((d) => d.schemaVersion === 1 && ids(d) === 'shape,texture,intensity' && d.labels.every((l) => l.x >= 0 && l.x <= 1 && l.y >= 0 && l.y <= 1 && typeof l.visible === 'boolean'));
  check(`[${tag}] evento: payload schemaVersion 1, ids fixos, coordenadas normalizadas`, okShape);
  check(`[${tag}] evento: emitido no container, bubbles false, nunca em window`, !r.bubbles && r.target && r.onWindow === 0 && r.initialSync >= 1, `inicial=${r.initialSync}`);
  check(`[${tag}] evento: rótulos ocultos em Imagem, visíveis em Dados/Explicação`, r.p0.labels.every((l) => !l.visible) && r.p2.labels.every((l) => l.visible) && r.p1.labels.every((l) => l.visible));
  check(`[${tag}] evento: emphasis null até Dados, "texture" no foco e no final`, r.p2.emphasis === null && r.p76.emphasis === null && r.p84.emphasis === 'texture' && r.p90.emphasis === 'texture' && r.p1.emphasis === 'texture', [r.p76.emphasis, r.p84.emphasis, r.p1.emphasis].join(','));
  // reordenação: ids acompanham seus elementos (textura vai para a 1ª posição)
  const pos = (d, id) => d.labels.find((l) => l.id === id);
  const land = w >= h;
  const key = (d, id) => (land ? pos(d, id).y : pos(d, id).x);
  const reord = key(r.p2, 'shape') < key(r.p2, 'texture') && key(r.p2, 'texture') < key(r.p2, 'intensity') && key(r.p1, 'texture') < key(r.p1, 'intensity') && key(r.p1, 'intensity') < key(r.p1, 'shape');
  check(`[${tag}] evento: ordem Dados forma→textura→intensidade; Explicação textura→intensidade→forma`, reord);
  check(`[${tag}] evento: determinístico na ida e volta (mesmo payload em 1)`, JSON.stringify(r.p1) === JSON.stringify(r.p1b));
  check(`[${tag}] evento: sem emissão redundante com ambiente ativo e geometria parada`, r.redundant === 0, `extras=${r.redundant}`);
  check(`[${tag}] evento: resize emite novo layout`, r.afterResize >= 1);
  check(`[${tag}] evento: reducedMotion emite pose estática (0.4→1/3, 0.9→1)`, Math.abs(r.red.progress - 0.3333) < 1e-3 && r.red2.progress === 1, `${r.red.progress},${r.red2.progress}`);
  check(`[${tag}] evento: nada após destroy`, r.after === 0);
  // espaço reservado: rótulo 90×24 cabe no container e não colide entre si nem com os painéis
  const fits = [r.p2, r.p1].every((d) => {
    const boxes = d.labels.map((l) => ({ x0: l.x * w - 45, x1: l.x * w + 45, y0: l.y * h - 24, y1: l.y * h }));
    const inside = boxes.every((b) => b.x0 >= -1 && b.x1 <= w + 1 && b.y0 >= -1 && b.y1 <= h + 1);
    let overlap = false;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) overlap = true;
    }
    return inside && !overlap;
  });
  check(`[${tag}] evento: rótulos de 90×24 px cabem no quadro sem colidir (Dados e Explicação)`, fits);
  check(`[${tag}] evento: sem erros de página`, errors.length === 0, errors.join(' | '));
  await page.close();
}

// Atmosfera do hero
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const tag = `hero ${w}x${h}`;
  const { page, errors, external } = await testPage(w, h);
  const r = await page.evaluate(async () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/deliverables/web/hero-atmosphere.css';
    document.head.appendChild(link);
    await new Promise((x) => (link.onload = x));
    const mod = await import('/deliverables/web/hero-atmosphere.js');
    const c = document.getElementById('c');
    c.style.position = 'relative';
    window.__counting = true;
    const a = mod.createHeroAtmosphere(c, { baseUrl: '/deliverables/', paused: false, reducedMotion: false });
    window.__counting = false;
    const keys = Object.keys(a).sort().join(',');
    const root = c.querySelector('.ararat-hero-atm');
    const wait = (ms) => new Promise((x) => setTimeout(x, ms));
    await wait(200);
    const r0 = window.__raf;
    await wait(1000);
    const rafs = window.__raf - r0;
    const anims = () => root.getAnimations({ subtree: true });
    const running = anims().length > 0 && anims().every((x) => x.playState === 'running');
    a.setPaused(true);
    await wait(50);
    const pausedOk = anims().every((x) => x.playState === 'paused');
    a.setPaused(false);
    a.setReducedMotion(true);
    await wait(50);
    const reducedOk = anims().length === 0;
    a.setReducedMotion(false);
    const vb1 = root.querySelector('svg').getAttribute('viewBox');
    c.style.width = '60%';
    await wait(300);
    const vb2 = root.querySelector('svg').getAttribute('viewBox');
    c.style.width = '';
    a.destroy();
    a.destroy();
    a.setPaused(true);
    return { mod: Object.keys(mod).join(','), keys, rafs, running, pausedOk, reducedOk, resized: vb1 !== vb2, left: c.childElementCount, listeners: window.__listeners, text: root.textContent.trim().length };
  });
  check(`[${tag}] exporta createHeroAtmosphere com setPaused/setReducedMotion/destroy`, r.mod === 'createHeroAtmosphere' && r.keys === 'destroy,setPaused,setReducedMotion', r.keys);
  check(`[${tag}] nenhum requestAnimationFrame, nenhum listener global, nenhum texto`, r.rafs === 0 && r.listeners === 0 && r.text === 0, JSON.stringify({ rafs: r.rafs, l: r.listeners }));
  check(`[${tag}] ambiente: animações CSS rodando; pausa congela; reducedMotion remove`, r.running && r.pausedOk && r.reducedOk);
  check(`[${tag}] resize recalcula enquadramento; destroy idempotente remove os nós`, r.resized && r.left === 0);
  check(`[${tag}] sem erros e sem requisições externas`, errors.length === 0 && external.length === 0, errors.concat(external).join(' | '));
  await page.close();
}

// Sem ResizeObserver/IntersectionObserver (navegadores antigos): ainda renderiza
{
  const { page, errors } = await testPage(800, 600);
  const ok = await page.evaluate(async () => {
    const RO = window.ResizeObserver, IO = window.IntersectionObserver;
    window.ResizeObserver = undefined; window.IntersectionObserver = undefined;
    const s = window.__mod.createJourneyScene(document.getElementById('c'), { baseUrl: '/deliverables/', reducedMotion: true, paused: true });
    s.setProgress(2 / 3);
    await window.__loaded();
    const st = document.querySelector('.ararat-journey').dataset.state;
    s.destroy();
    window.ResizeObserver = RO; window.IntersectionObserver = IO;
    return st;
  });
  check('fallback sem ResizeObserver/IntersectionObserver', ok === '2' && errors.length === 0, `state=${ok}`);
  await page.close();
}

// Carregamento tardio: estado recebido antes do load é respeitado; destroy durante o load não ressuscita
{
  const { page, errors } = await testPage(1440, 810);
  let delayMs = 1500;
  await page.route('**/assets/mri-base.webp', async (route) => { await new Promise((r) => setTimeout(r, delayMs)); route.continue(); });
  const late = await page.evaluate(async () => {
    const c = document.getElementById('c');
    const s = window.__mod.createJourneyScene(c, { baseUrl: '/deliverables/', reducedMotion: false, paused: true });
    s.setProgress(0.9); s.setPaused(true); s.setReducedMotion(true);
    const r = c.querySelector('.ararat-journey');
    const before = { loaded: r.dataset.loaded, stageOpacity: getComputedStyle(r.querySelector('.ararat-journey__stage')).opacity };
    const a = window.__raf;
    await window.__loaded();
    await new Promise((x) => setTimeout(x, 300));
    const out = { before, state: r.dataset.state, reduced: r.dataset.reducedMotion, rafs: window.__raf - a };
    s.destroy();
    return out;
  });
  check('load tardio: cena oculta antes da imagem e entra na pose pedida (0.9 → estado 3, reduzido, sem rAF)', late.before.loaded === 'false' && late.before.stageOpacity === '0' && late.state === '3' && late.reduced === 'true' && late.rafs === 0, JSON.stringify(late));
  const dd = await page.evaluate(async () => {
    const c = document.getElementById('c');
    const s = window.__mod.createJourneyScene(c, { baseUrl: '/deliverables/', reducedMotion: false, paused: false });
    s.setProgress(0.5);
    await new Promise((x) => setTimeout(x, 200));
    s.destroy();
    const a = window.__raf;
    await new Promise((x) => setTimeout(x, 2200));
    return { nodes: c.childElementCount, rafs: window.__raf - a };
  });
  check('destroy durante o carregamento: nada é recriado e nenhum rAF após o load', dd.nodes === 0 && dd.rafs === 0, JSON.stringify(dd));
  await page.unroute('**/assets/mri-base.webp');
  const err = await page.evaluate(async () => {
    const c = document.getElementById('c');
    const s = window.__mod.createJourneyScene(c, { baseUrl: '/nao-existe/', reducedMotion: false, paused: false });
    s.setProgress(1 / 3);
    await new Promise((x) => setTimeout(x, 800));
    const r = c.querySelector('.ararat-journey');
    const out = { loaded: r.dataset.loaded, error: r.dataset.error };
    s.destroy();
    return { ...out, nodes: c.childElementCount };
  });
  check('imagem ausente: falha silenciosa marcada em data-loaded="error", sem exceção', err.loaded === 'error' && err.nodes === 0, JSON.stringify(err));
  check('testes de carregamento sem erros de página', errors.filter((e) => !/404/.test(e)).length === 0, errors.join(' | '));
  await page.close();
}

// Medição de quadros (headless/software — indicativo, não garantia)
const perf = {};
for (const [w, h] of [[1440, 810], [390, 700]]) {
  const { page } = await testPage(w, h);
  const m = await page.evaluate(async () => {
    const t0 = performance.now();
    const s = window.__mod.createJourneyScene(document.getElementById('c'), { baseUrl: '/deliverables/', reducedMotion: false, paused: false });
    const mountMs = performance.now() - t0;
    await window.__loaded();
    const readyMs = performance.now() - t0;
    const times = [];
    let last = performance.now();
    await new Promise((done) => {
      const start = performance.now();
      function f(now) {
        times.push(now - last); last = now;
        const t = (now - start) / 3000;
        s.setProgress(t < 0.5 ? t * 2 : 2 - t * 2);
        if (t < 1) requestAnimationFrame(f); else done();
      }
      requestAnimationFrame(f);
    });
    s.destroy();
    times.shift();
    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return { mountMs: Math.round(mountMs), readyMs: Math.round(readyMs), frames: times.length, avgMs: +avg.toFixed(1), p95Ms: +times[Math.floor(times.length * 0.95)].toFixed(1), over33: times.filter((x) => x > 33.4).length };
  });
  perf[`${w}x${h}`] = m;
  console.log(`PERF  ${w}x${h}`, JSON.stringify(m));
  await page.close();
}

// tamanhos do pacote
const sizes = {};
for (const f of ['web/journey.js', 'web/journey.css', 'web/hero-atmosphere.js', 'web/hero-atmosphere.css', 'assets/mri-base.webp', 'assets/mri-map.json']) sizes[f] = (await stat(join(root, 'deliverables', f))).size;
console.log('SIZE ', JSON.stringify(sizes));

/* ---------- capturas ---------- */
if (CAPTURE) {
  const shots = join(root, 'review/screenshots');
  const sb = join(root, 'storyboard');
  const assets = join(root, 'deliverables/assets');
  const cmp = join(root, 'review/comparacao-v0.3-v0.4');
  for (const d of [shots, sb, assets, cmp]) await mkdir(d, { recursive: true });
  const shoot = async (w, h, p, file, extra = '') => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`${base}/harness/?chrome=0&size=${w}x${h}&paused=1&reduced=0&p=${p}${extra}`);
    await page.waitForSelector('.ararat-journey[data-loaded="true"]', { timeout: 10000 });
    await page.waitForTimeout(1500);
    const buf = await page.screenshot({ path: file });
    await page.close();
    return buf;
  };
  const toWebp = async (png, file, w, h, q = 0.84) => {
    const page = await browser.newPage();
    const b64 = await page.evaluate(async ({ src, w, h, q }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      return c.toDataURL('image/webp', q).split(',')[1];
    }, { src: 'data:image/png;base64,' + png.toString('base64'), w, h, q });
    await writeFile(file, Buffer.from(b64, 'base64'));
    await page.close();
  };
  const b64 = async (f) => 'data:image/png;base64,' + (await readFile(f)).toString('base64');
  const P = [['0', 0], ['1', 1 / 3], ['2', 2 / 3], ['3', 1]];
  const SIZES = [[1440, 810], [390, 700], [766, 638], [676, 564], [550, 458], [350, 438]];
  // estados (com rótulos de teste do evento) em todos os quadros
  for (const [n, p] of P) for (const [w, h] of SIZES) await shoot(w, h, p, join(shots, `estado-${n}-${w}x${h}.png`));
  // poses estáticas e poster da jornada (sem rótulos: o Site escreve os seus)
  for (const [n, p] of P) {
    const png = await shoot(1440, 810, p, join(shots, `_still.png`), '&labels=0');
    await toWebp(png, join(assets, `journey-pose-${n}.webp`), 1440, 810);
  }
  await shoot(766, 638, 1 / 3, join(shots, `reduced-1-766x638.png`), '&reduced=1');
  const poster = await shoot(1600, 900, 0, join(shots, '_poster.png'), '&labels=0');
  await toWebp(poster, join(assets, 'journey-poster.webp'), 1600, 900);
  // harness completo
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    await page.goto(`${base}/harness/?paused=1&reduced=0&p=0.9&size=766x638`);
    await page.waitForSelector('.ararat-journey[data-loaded="true"]');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(shots, 'harness-766x638.png') });
    await page.close();
  }
  // atmosfera do hero: poster (estático, sem RM/texto) + composições simuladas
  {
    const hs = async (w, h, q, file) => {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      await page.goto(`${base}/harness/hero.html?chrome=0${q}`);
      await page.waitForTimeout(700);
      const buf = await page.screenshot({ path: file });
      await page.close();
      return buf;
    };
    const hp = await hs(1600, 900, '&reduced=1&bare=1', join(shots, '_hero-poster.png'));
    await toWebp(hp, join(assets, 'hero-atmosphere-poster.webp'), 1600, 900, 0.86);
    await hs(1440, 900, '&reduced=1', join(shots, 'hero-1440x900.png'));
    await hs(1440, 900, '&reduced=1&bare=1', join(shots, 'hero-atmosfera-1440x900.png'));
    await hs(768, 900, '&reduced=1', join(shots, 'hero-768x900.png'));
    await hs(390, 844, '&reduced=1', join(shots, 'hero-390x844.png'));
  }
  // storyboard: oito poses, com a sequência própria da Explicação
  const poses = [
    ['1', 0, 'Imagem'], ['2', 1 / 6, 'Contorno em formação'], ['3', 1 / 3, 'Segmentação'], ['4', 2 / 3, 'Dados'],
    ['5', 0.76, 'Explicação · ordenação'], ['6', 0.84, 'Explicação · foco'], ['7', 0.9, 'Explicação · retorno à região'], ['8', 1, 'Explicação · conjunto assentado'],
  ];
  const imgs = [];
  for (const [n, p, label] of poses) {
    const buf = await shoot(766, 638, p, join(sb, `pose-${n}.png`));
    imgs.push({ n, p, label, src: 'data:image/png;base64,' + buf.toString('base64') });
  }
  {
    const page = await browser.newPage({ viewport: { width: 1800, height: 800 } });
    await page.setContent(`<html><body style="margin:0;background:#080f18;font:14px system-ui;color:#F5F7FA">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:20px">
      ${imgs.map((i) => `<figure style="margin:0"><img src="${i.src}" style="width:100%;display:block;border:1px solid rgba(176,184,193,.2)"><figcaption style="padding:8px 0;color:#B0B8C1"><b style="color:#D4AF37">${i.n}</b> · progress ${i.p.toFixed(3)} · ${i.label}</figcaption></figure>`).join('')}
      </div><p style="padding:0 20px 16px;margin:0;color:#B0B8C1">Quadro 766×638 (frame real do Site em 1440×900). Rótulos FORMA/TEXTURA/INTENSIDADE desenhados pelo harness a partir do evento ararat:journey-layout. RM demonstrativa; máscaras, dados e contribuições ilustrativos — não são resultado do ARARAT nem validação clínica.</p></body></html>`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(sb, 'storyboard.png'), fullPage: true });
    await page.close();
  }
  // comparação v0.3.0 × v0.4.0 nos quadros reais do Site
  const old = '&pkg=../review/v0.3.0/deliverables/';
  const names = ['Imagem', 'Segmentação', 'Dados', 'Explicação'];
  for (const [w, h] of [[766, 638], [350, 438]]) {
    const rows = [];
    for (const [n, p] of P) {
      const fa = join(cmp, `v0.3.0-${n}-${w}x${h}.png`);
      await shoot(w, h, p, fa, old);
      rows.push({ n, a: await b64(fa), b: await b64(join(shots, `estado-${n}-${w}x${h}.png`)) });
    }
    const land = w > h;
    const pg = await browser.newPage({ viewport: { width: land ? 1700 : 1600, height: 800 } });
    const cell = (src) => `<img src="${src}" style="width:100%;display:block;border:1px solid rgba(176,184,193,.2)">`;
    const body = land
      ? `<div style="display:grid;grid-template-columns:120px 1fr 1fr;gap:12px 16px;padding:20px;align-items:center">
          <div></div><h3 style="margin:0;color:#B0B8C1">Antes · v0.3.0</h3><h3 style="margin:0;color:#D4AF37">Depois · v0.4.0 (textura contida)</h3>
          ${rows.map((r) => `<div style="color:#F5F7FA">${String(+r.n + 1).padStart(2, '0')} ${names[r.n]}</div>${cell(r.a)}${cell(r.b)}`).join('')}</div>`
      : `<div style="display:grid;grid-template-columns:110px repeat(4,1fr);gap:12px 16px;padding:20px;align-items:center">
          <div></div>${names.map((x, i) => `<div style="color:#F5F7FA">${String(i + 1).padStart(2, '0')} ${x}</div>`).join('')}
          <div style="color:#B0B8C1">Antes<br>v0.3.0</div>${rows.map((r) => cell(r.a)).join('')}
          <div style="color:#D4AF37">Depois<br>v0.4.0</div>${rows.map((r) => cell(r.b)).join('')}</div>`;
    await pg.setContent(`<html><body style="margin:0;background:#080f18;font:15px system-ui">${body}<p style="padding:0 20px 16px;margin:0;color:#B0B8C1;font-size:13px">Container ${w}×${h} = quadro da cena medido no Site (localhost:3000) em ${w === 766 ? '1440×900' : '390×844'}. Harness, Chromium headless; não equivale a aparelho físico.</p></body></html>`);
    await pg.waitForTimeout(400);
    await pg.screenshot({ path: join(root, `review/comparacao-v0.3-v0.4-${w}x${h}.png`), fullPage: true });
    await pg.close();
  }
  // sequência da Explicação (antes: v0.2.0 só reordenava)
  {
    const seq = [[2 / 3, 'Dados'], [0.76, 'ordenação'], [0.84, 'foco'], [0.9, 'retorno à região'], [1, 'assentado']];
    const cells = [];
    for (const [p, l] of seq) cells.push({ l, p, src: await b64(join(sb, `pose-${{ [2 / 3]: 4, 0.76: 5, 0.84: 6, 0.9: 7, 1: 8 }[p]}.png`)) });
    const pg = await browser.newPage({ viewport: { width: 1800, height: 500 } });
    await pg.setContent(`<html><body style="margin:0;background:#080f18;font:14px system-ui;color:#B0B8C1"><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:16px">${cells.map((c) => `<figure style="margin:0"><img src="${c.src}" style="width:100%"><figcaption>${c.p.toFixed(3)} · ${c.l}</figcaption></figure>`).join('')}</div></body></html>`);
    await pg.waitForTimeout(300);
    await pg.screenshot({ path: join(root, 'review/explicacao-sequencia-766x638.png'), fullPage: true });
    await pg.close();
  }
  console.log('capturas geradas');
}

await writeFile(join(root, 'review/verify-report.json'), JSON.stringify({ when: new Date().toISOString(), results, perf, sizes }, null, 2) + '\n');
await browser.close();
server.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} verificações passaram`);
process.exit(failed ? 1 : 0);
