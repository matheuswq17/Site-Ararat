/**
 * /previa — home com a escultura do Motion (home-v2 0.2.1-draft) e passagem até a MESMA cena da
 * jornada (0.4.1-exp, pacote versionado em public/previa/home-v2-0.2.1/).
 *   node tests/previa.mjs        (build de produção, servidor em :3000)
 * Também confere que a home aprovada "/" continua a mesma.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
// ROUTE=/previa/a ou /previa/b roda a mesma suíte nas propostas (padrão: /previa, a base).
const ROUTE = process.env.ROUTE ?? "/previa";
const results = [];
const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};
async function test(name, fn) {
  if (process.env.ONLY && !new RegExp(process.env.ONLY).test(name)) return; // ONLY=regex roda só parte
  try {
    await fn();
    results.push(`✔ ${name}`);
  } catch (e) {
    results.push(`✘ ${name}\n    ${e.message.split("\n")[0]}`);
  }
}
const browser = await chromium.launch();
async function open(path = ROUTE, viewport = { width: 1440, height: 900 }, o = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: o.reduced ? "reduce" : "no-preference", javaScriptEnabled: !o.noJs });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  if (o.before) await o.before(page);
  if (o.seen !== false) await page.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  if (o.paused) await page.addInitScript(() => sessionStorage.setItem("ararat:paused", "1"));
  await page.goto(BASE + path, { waitUntil: o.wait ?? "networkidle" });
  if (o.canvas !== false && !o.noJs && !o.reduced && !o.paused)
    await page.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture, null, { timeout: 8000 }).catch(() => {});
  return { page, context, errors };
}
const st = (page) =>
  page.evaluate(() => {
    const root = document.querySelector("[data-opening=root]");
    return {
      p: parseFloat(root.style.getPropertyValue("--opening-p") || "0"),
      prog: parseFloat(document.getElementById("jornada").dataset.progress),
      sculpture: root.dataset.sculpture,
      scene: root.dataset.scene,
      cover: root.dataset.cover,
      reveal: document.querySelector("[data-opening=sticky] canvas")?.dataset.reveal,
      inert: document.querySelector("[data-opening=stage-col]").inert && document.querySelector("[data-opening=steps-col]").inert,
      ambient: document.querySelector("#jornada [data-ambient]")?.dataset.ambient,
      y: scrollY,
    };
  });
const go = (page, y) => page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y).then(() => page.waitForTimeout(220));
// Pacote lido pela rota: refinada = montanha B (REFINADA_PACKAGE, hoje 0.7.0-draft); as demais = home-v2 0.2.1-draft.
const REF = ROUTE === "/previa/refinada";
const PKG = REF ? "/previa/home-montanha-0.7.0/" : "/previa/home-v2-0.2.1/";
const PKG_VERSION = REF ? "0.7.0-draft" : "0.2.1-draft";
const runway = (page) =>
  page.evaluate(() => document.querySelector("[data-opening=runway-desktop]").offsetHeight || document.querySelector("[data-opening=runway-mobile]").offsetHeight);

await test("home aprovada em / intacta (título, RM do hero, sem layout de abertura)", async () => {
  const { page, context, errors } = await open("/");
  assert((await page.locator("#hero-title").innerText()).trim() === "Entre na imagem.", "título de / mudou");
  assert((await page.locator("#inicio svg[data-mri-state]").count()) === 1, "RM do hero de / ausente");
  assert((await page.locator("[data-opening], #ararat-opening").count()) === 0, "abertura vazou para /");
  assert((await page.locator("#jornada").getAttribute("data-progress")) !== null, "jornada de / sem progress");
  assert(errors.length === 0, errors.join(" | "));
  await context.close();
});

await test("/previa: texto aprovado, ações, escultura do Motion (canvas único), sem etiqueta de reserva nem arco do Site", async () => {
  const { page, context, errors } = await open();
  const h1 = await page.locator("#hero-title").evaluate((el) => el.textContent.replace(/\s+/g, " ").trim());
  assert(h1 === "Da imagem ao conhecimento.", h1);
  const w = await page.locator("#hero-title").evaluate((el) => getComputedStyle(el).fontWeight);
  // peso do título: base 700 (Montserrat); propostas 600 (Space Grotesk / Sora)
  assert(w === (ROUTE === "/previa" ? "700" : "600"), `peso ${w}`);
  const links = await page.$$eval("#inicio [data-opening=content] a", (as) => as.map((a) => [a.textContent.trim(), a.getAttribute("href")]));
  assert(JSON.stringify(links) === JSON.stringify([["Entre na imagem", "#jornada"], ["Conhecer a plataforma", "#plataforma"]]), JSON.stringify(links));
  assert(!(await page.getByText(/reservado/i).count()), "etiqueta de espaço reservado");
  assert((await page.locator("[class*='orbit']").count()) === 0, "arco provisório do Site presente");
  assert((await page.locator("[data-opening=sticky] canvas").count()) === 1, "canvas da escultura ≠ 1");
  assert((await st(page)).sculpture === "canvas", "módulo não ativo");
  assert(errors.length === 0, errors.join(" | "));
  await context.close();
});

if (ROUTE === "/previa/refinada") {
  await test("refinada: hero só com o estado científico (sem 'Escultura conceitual'), legível; Contato sem caractere de seta; avisos da demonstração e próstata", async () => {
    const { page, context, errors } = await open();
    const hero = await page.locator("#inicio").evaluate((el) => el.textContent);
    assert(!/Escultura conceitual|não anatomia/i.test(hero), "explicação técnica da escultura no hero");
    const note = await page.locator("[data-opening=note]").evaluate((el) => {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      return { t: el.textContent.trim(), color: cs.color, fs: parseFloat(cs.fontSize), visible: r.height > 0 && cs.visibility !== "hidden" };
    });
    assert(note.t === "Plataforma em validação científica" && note.visible && note.fs >= 14, JSON.stringify(note));
    const [r, g, b] = note.color.match(/\d+/g).map(Number);
    const L = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const lum = 0.2126 * L(r) + 0.7152 * L(g) + 0.0722 * L(b);
    const navy = 0.2126 * L(13) + 0.7152 * L(27) + 0.0722 * L(42);
    const ratio = (lum + 0.05) / (navy + 0.05);
    assert(ratio >= 7, `contraste do estado ${ratio.toFixed(1)}`);
    const arrows = await page.$$eval("#contato a", (as) => as.map((a) => [a.textContent.includes("→"), !!a.querySelector("svg")]));
    // Rodada integral: sem canal real, o Contato da refinada não tem links (antes: setas SVG).
    assert(arrows.every(([txt]) => !txt) && (arrows.length === 0 || arrows.some(([, svg]) => svg)), "seta do Contato: " + JSON.stringify(arrows));
    const all = await page.locator("main").evaluate((el) => el.textContent);
    assert(!/tireoide|tireóide|pulm/i.test(all), "tireoide/pulmão anunciados");
    assert(/próstata/i.test(await page.locator("#jornada").evaluate((el) => el.textContent)), "jornada sem a aplicação de próstata");
    assert(/demonstra|ilustrativ/i.test(await page.locator("#explicabilidade").evaluate((el) => el.textContent)), "aviso da demonstração ausente na Explicabilidade");
    console.log(`    · estado científico: ${note.fs}px, contraste ${ratio.toFixed(1)}:1`);
    assert(errors.length === 0, errors.join(" | "));
    await context.close();
  });
}

await test(`versão e origem: escultura ${PKG_VERSION} e jornada 0.4.1-exp do pacote versionado; nada de /motion na /previa; / segue em /motion 0.4.0`, async () => {
  const urls = [];
  const { page, context } = await open(ROUTE, undefined, { before: (p) => p.on("request", (r) => urls.push(new URL(r.url()).pathname)) });
  await page.waitForFunction(() => document.querySelector("#jornada .ararat-journey")?.dataset.loaded === "true", null, { timeout: 8000 });
  const v = await page.evaluate(() => ({
    sculpt: document.querySelector("[data-opening=sticky] canvas").dataset.version,
    root: document.querySelector("[data-opening=root]").dataset.previewVersion,
    arc: !!document.querySelector("#jornada .ararat-journey").dataset.startArc,
  }));
  assert(v.sculpt === PKG_VERSION && v.root === PKG_VERSION, JSON.stringify(v));
  assert(v.arc, "cena sem data-start-arc (0.4.1-exp)");
  for (const f of ["web/home-sculpture.js", "web/journey.js", "web/journey.css", "assets/mri-base.webp"]) assert(urls.includes(PKG + f), `não carregou ${PKG + f}`);
  assert(!urls.some((u) => u.startsWith("/motion/")), `a /previa carregou /motion: ${urls.filter((u) => u.startsWith("/motion/"))}`);
  assert(!urls.some((u) => /previa-driver/.test(u)), "driver do Motion carregado (o Site usa o próprio controlador)");
  await context.close();
  const urls2 = [];
  const h = await open("/", undefined, { before: (p) => p.on("request", (r) => urls2.push(new URL(r.url()).pathname)) });
  await h.page.waitForTimeout(800);
  await h.page.evaluate(() => document.getElementById("jornada").scrollIntoView());
  await h.page.waitForTimeout(1500);
  assert(urls2.includes("/motion/web/journey.js") && !urls2.some((u) => u.startsWith("/previa/")), "home / fora do pacote ready");
  const ratio = await h.page.evaluate(() => document.querySelector("#jornada [data-layout]").getBoundingClientRect().width);
  assert(ratio > 0, "quadro de / ausente");
  await h.context.close();
});

await test("home / em 390×844: quadro da jornada 4:5 (regressão)", async () => {
  const { page, context } = await open("/", { width: 390, height: 844 });
  const r = await page.evaluate(() => { const b = document.querySelector("#jornada [data-layout]").getBoundingClientRect(); return b.width / b.height; });
  assert(Math.abs(r - 0.8) < 0.01, `proporção ${r.toFixed(3)}`);
  await context.close();
});

for (const [w, h, minArt] of [[1440, 900, 250], [1280, 720, 150], [768, 1024, 150], [390, 844, 150], [320, 568, 60]]) {
  await test(`${w}×${h}: composição sem colisão, ação na 1ª tela, arte presente, poster = canvas, sem rolagem horizontal`, async () => {
    // Pausa global ANTES do módulo chegar: a escultura nasce assentada e sem ambiente (fase 0),
    // a mesma pose do poster oficial — comparação determinística poster × canvas.
    const { page, context } = await open(ROUTE, { width: w, height: h }, {
      wait: "domcontentloaded",
      canvas: false,
      before: (p) => p.route(/home-sculpture\.js/, async (r) => { await new Promise((x) => setTimeout(x, 1500)); await r.continue(); }),
    });
    await page.waitForFunction(() => { const i = document.querySelector("[data-opening=poster]"); return i && i.complete && i.naturalWidth > 0; });
    await page.evaluate(() => document.querySelector("header button[aria-pressed]").click());
    await page.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 8000 });
    await page.waitForTimeout(150);
    const r = await page.evaluate(async (PKG) => {
      const m = await import(PKG + "web/home-sculpture.js");
      const host = document.querySelector("[data-opening=sticky] > div:last-child").getBoundingClientRect();
      const slot = document.querySelector("[data-opening=slot]").getBoundingClientRect();
      const art = { x: slot.left - host.left, y: slot.top - host.top, w: slot.width, h: slot.height };
      const comp = m.homeComposition(art);
      const canvas = document.querySelector("[data-opening=sticky] canvas");
      const box = (s) => document.querySelector(s).getBoundingClientRect();
      const title = box("#hero-title"), btn = box("[data-opening=content] a.btn-gold");
      const content = box("[data-opening=content]");
      const img = document.querySelector("[data-opening=poster]");
      return {
        artTop: slot.top,
        arcTop: comp.cy - comp.arcR + host.top,
        textBottom: Math.max(title.bottom, content.bottom),
        btnBottom: btn.bottom,
        layout: comp.layout,
        canvasLayout: canvas.dataset.layout,
        posterSrc: img.currentSrc,
        slotRatio: slot.width / slot.height,
        sw: document.documentElement.scrollWidth,
      };
    }, PKG);
    assert(r.sw <= w, `scrollWidth ${r.sw}`);
    assert(r.textBottom + 12 <= r.artTop, `texto (${r.textBottom.toFixed(0)}) cruza a arte (${r.artTop.toFixed(0)})`);
    assert(r.btnBottom <= h - 8, `botão fora da 1ª tela (${r.btnBottom.toFixed(0)})`);
    assert(h - r.arcTop >= minArt, `arte visível ${Math.round(h - r.arcTop)} px (< ${minArt})`);
    assert(r.canvasLayout.startsWith(r.layout), `composição do canvas ${r.canvasLayout} ≠ ${r.layout}`);
    const narrow = w < 600;
    assert(r.posterSrc.includes(narrow ? "arte-escultura-movel-w" : "arte-escultura-desktop-w"), `poster ${r.posterSrc}`);
    assert(Math.abs(r.slotRatio - (narrow ? 390 / 312 : 1100 / 660)) < 0.01, `proporção do slot ${r.slotRatio.toFixed(3)} ≠ poster`);
    // Poster → canvas: mesma pose, escala e enquadramento (pixels da área da arte) e sem corte lateral.
    const cmp = await page.evaluate(async () => {
      const host = document.querySelector("[data-opening=sticky] > div:last-child");
      const canvas = host.querySelector("canvas");
      const img = document.querySelector("[data-opening=poster]");
      const slot = document.querySelector("[data-opening=slot]").getBoundingClientRect();
      const hr = host.getBoundingClientRect();
      const k = canvas.width / hr.width;
      const vis = { x: 0, y: Math.max(0, slot.top - hr.top), w: hr.width, h: Math.min(hr.height, slot.bottom - hr.top) - Math.max(0, slot.top - hr.top) };
      const W = Math.round(vis.w), H = Math.round(vis.h);
      // Os dois compostos sobre o fundo real do hero (navy-900), como o visitante os vê.
      const a = new OffscreenCanvas(W, H).getContext("2d");
      a.fillStyle = "#0D1B2A";
      a.fillRect(0, 0, W, H);
      a.drawImage(canvas, vis.x * k, vis.y * k, vis.w * k, vis.h * k, 0, 0, W, H);
      const bctx = new OffscreenCanvas(W, H).getContext("2d");
      bctx.fillStyle = "#0D1B2A";
      bctx.fillRect(0, 0, W, H);
      bctx.drawImage(img, slot.left - hr.left - vis.x, slot.top - hr.top - vis.y, slot.width, slot.height);
      const A = a.getImageData(0, 0, W, H).data, B = bctx.getImageData(0, 0, W, H).data;
      let sum = 0, n = 0, minA = 1e9, maxA = -1, minB = 1e9, maxB = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const la = (A[i] + A[i + 1] + A[i + 2]) / 3, lb = (B[i] + B[i + 1] + B[i + 2]) / 3;
        sum += Math.abs(la - lb); n++;
        if (la > 90) { minA = Math.min(minA, x); maxA = Math.max(maxA, x); }
        if (lb > 90) { minB = Math.min(minB, x); maxB = Math.max(maxB, x); }
      }
      return { mean: sum / n, minA, maxA, minB, maxB, W };
    });
    results.push(`    · ${w}×${h}: poster→canvas Δ médio ${cmp.mean.toFixed(2)}/255; desenho x ${cmp.minA}–${cmp.maxA} (poster ${cmp.minB}–${cmp.maxB}) de ${cmp.W}`);
    // Mesma pose/escala/enquadramento. Resta a espessura do traço: o canvas desenha linhas de
    // largura fixa em px; o poster (gerado para 1100/390 px de área) é reduzido em telas menores —
    // em 320 px (0,82×) o traço do poster fica mais fino (Δ ≈ 6). Limite registrado na entrega.
    assert(cmp.mean < 4, `poster × canvas diferem (Δ ${cmp.mean.toFixed(2)})`);
    assert(Math.abs(cmp.minA - cmp.minB) <= 3 && Math.abs(cmp.maxA - cmp.maxB) <= 3, "enquadramento difere");
    assert(cmp.minA > 0 && cmp.maxA < cmp.W - 1, "objeto cortado lateralmente");
    await context.close();
  });
}

await test("passagem ida e volta: p 0→1 só na pista, depois progress das etapas; mesmos nós (sem remontagem); quadro parado", async () => {
  const { page, context, errors } = await open();
  await page.waitForFunction(() => document.querySelector("#jornada [data-loaded]")?.dataset.loaded === "true", null, { timeout: 8000 });
  await page.evaluate(() => {
    window.__nodes = {
      scene: document.querySelector("#jornada [data-loaded]"),
      frame: document.querySelector("#jornada [data-layout]"),
      canvas: document.querySelector("[data-opening=sticky] canvas"),
    };
  });
  const R = await runway(page);
  const frameAt = () => page.locator("#jornada [data-layout]").first().evaluate((el) => { const b = el.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map((v) => Math.round(v)).join(","); });
  const seq = [];
  const frames = new Set();
  for (const f of [0, 0.25, 0.5, 0.75, 1, 1.15]) {
    await go(page, Math.round(R * f));
    const s = await st(page);
    seq.push(s);
    if (f <= 1) frames.add(await frameAt());
  }
  for (let i = 1; i < 5; i++) assert(seq[i].p > seq[i - 1].p, `p não cresce: ${seq.map((s) => s.p).join(",")}`);
  assert(seq[4].p === 1 && seq.slice(0, 5).every((s) => s.prog === 0), `progress mudou durante a pista: ${seq.map((s) => s.prog).join(",")}`);
  assert(seq[5].prog > 0, "progress das etapas não começou depois da pista");
  assert(frames.size === 1, `quadro mudou de lugar durante a passagem: ${[...frames].join(" | ")}`);
  // volta
  const back = [];
  for (const f of [0.75, 0.5, 0.25, 0]) {
    await go(page, Math.round(R * f));
    back.push((await st(page)).p);
  }
  assert(Math.abs(back[0] - seq[3].p) < 0.002 && Math.abs(back[3]) < 0.002, `volta difere: ${back}`);
  const same = await page.evaluate(() => ({
    scene: window.__nodes.scene === document.querySelector("#jornada [data-loaded]"),
    frame: window.__nodes.frame === document.querySelector("#jornada [data-layout]"),
    canvas: window.__nodes.canvas === document.querySelector("[data-opening=sticky] canvas"),
    mriOutsideJourney: [...document.querySelectorAll("svg[data-mri-state]")].filter((s) => !s.closest("#jornada") && !s.closest("#explicabilidade")).length,
  }));
  assert(same.scene && same.frame && same.canvas, `nó trocado: ${JSON.stringify(same)}`);
  assert(same.mriOutsideJourney === 0, `RM fora da jornada: ${same.mriOutsideJourney}`);
  assert(errors.length === 0, errors.join(" | "));
  await context.close();
});

await test("resize durante a passagem (1440 → 390 → 1440): sem erro, p na nova pista, alvo remedido, sem rolagem horizontal", async () => {
  const { page, context, errors } = await open();
  const R = await runway(page);
  await go(page, Math.round(R * 0.5));
  const g0 = await page.locator("[data-opening=root]").getAttribute("data-geometry");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  const s1 = await st(page);
  const g1 = await page.locator("[data-opening=root]").getAttribute("data-geometry");
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  assert(g1 !== g0 && g1.startsWith("390x"), `geometria não remedida: ${g0} → ${g1}`);
  assert(s1.p >= 0 && s1.p <= 1 && sw <= 390, `p ${s1.p}, sw ${sw}`);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(600);
  assert((await page.locator("[data-opening=root]").getAttribute("data-geometry")).startsWith("1440x"), "não voltou ao desktop");
  assert(errors.length === 0, errors.join(" | "));
  await context.close();
});

await test("pausa durante a visita: rolagem continua mandando na passagem; pausa salva → layout estático", async () => {
  const { page, context } = await open();
  await page.locator("header").getByRole("button", { name: /Pausar animações/ }).first().click();
  assert((await page.evaluate(() => document.documentElement.dataset.motion)) === "paused", "pausa não aplicada");
  const R = await runway(page);
  await go(page, Math.round(R * 0.6));
  assert(Math.abs((await st(page)).p - 0.6) < 0.02, "passagem não respondeu pausada");
  await context.close();
  const s = await open(ROUTE, undefined, { paused: true });
  const lay = await s.page.evaluate(() => ({
    opening: !!document.getElementById("ararat-opening"),
    runway: document.querySelector("[data-opening=runway-desktop]").offsetHeight,
    poster: getComputedStyle(document.querySelector("[data-opening=poster]")).opacity,
    canvas: document.querySelectorAll("[data-opening=sticky] canvas").length,
  }));
  assert(!lay.opening && lay.runway === 0 && lay.poster === "1" && lay.canvas === 0, JSON.stringify(lay));
  await s.context.close();
});

for (const mode of ["reduzido", "sem JS"]) {
  await test(`${mode}: hero com poster e jornada em fluxo normal (sem pista, sem canvas), controles utilizáveis`, async () => {
    const { page, context } = await open(ROUTE, undefined, mode === "reduzido" ? { reduced: true } : { noJs: true });
    const lay = await page.evaluate(() => ({
      opening: !!document.getElementById("ararat-opening"),
      intro: !!document.getElementById("ararat-intro"),
      runway: document.querySelector("[data-opening=runway-desktop]").offsetHeight,
      poster: getComputedStyle(document.querySelector("[data-opening=poster]")).opacity,
      posterH: document.querySelector("[data-opening=poster]").getBoundingClientRect().height,
      canvas: document.querySelectorAll("[data-opening=sticky] canvas").length,
      journeyTop: document.getElementById("jornada").getBoundingClientRect().top,
      heroBottom: document.getElementById("inicio").getBoundingClientRect().bottom,
      steps: document.querySelectorAll("#jornada ol li").length,
    }));
    assert(!lay.opening && !lay.intro && lay.runway === 0 && lay.canvas === 0, JSON.stringify(lay));
    assert(lay.poster === "1" && lay.posterH > 100, `poster ${lay.poster} ${lay.posterH}`);
    assert(Math.abs(lay.journeyTop - lay.heroBottom) < 1, "jornada não segue o hero em fluxo");
    assert(lay.steps >= 4, "etapas ausentes");
    const inert = await page.evaluate(() => [...document.querySelectorAll("#jornada [inert]")].length);
    assert(inert === 0, `layout estático com ${inert} grupo(s) inert`);
    if (mode === "reduzido") {
      await page.locator("#jornada").getByRole("button", { name: /Dados/ }).first().click();
      await page.waitForTimeout(400);
      assert((await page.locator("#jornada").getAttribute("data-active-step")) === "2", "controle não respondeu");
    }
    await context.close();
  });
}

const focusInfo = (page) =>
  page.evaluate(() => {
    const a = document.activeElement;
    const r = a.getBoundingClientRect();
    let o = 1;
    for (let e = a; e; e = e.parentElement) o *= +getComputedStyle(e).opacity;
    const cx = Math.min(innerWidth - 1, Math.max(0, r.x + r.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, r.y + r.height / 2));
    const hit = document.elementFromPoint(cx, cy);
    return {
      text: (a.textContent || a.getAttribute("aria-label") || a.tagName).replace(/\s+/g, " ").trim().slice(0, 40),
      inJourney: !!a.closest("#jornada [data-opening=stage-col], #jornada [data-opening=steps-col]"),
      inView: r.bottom > 0 && r.top < innerHeight,
      opacity: o,
      onTop: a === hit || a.contains(hit),
      body: a === document.body,
      p: parseFloat(document.querySelector("[data-opening=root]").style.getPropertyValue("--opening-p") || "0"),
    };
  });
// Foco válido = elemento realmente visível (na tela, opaco, por cima). Espera a rolagem suave assentar.
async function visibleFocus(page) {
  let f;
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(150);
    f = await focusInfo(page);
    if (f.body || (f.inView && f.opacity > 0.9 && f.onTop)) break;
  }
  return f;
}

for (const [w, h] of [[1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]]) {
  await test(`${w}×${h} teclado antes da revelação: Tab/Shift+Tab nunca focam controles cobertos; clique não os alcança`, async () => {
    const { page, context } = await open(ROUTE, { width: w, height: h });
    const s0 = await st(page);
    assert(s0.inert && s0.cover === "covered", `grupos não protegidos em p=0: ${JSON.stringify(s0)}`);
    // clique no centro do botão "Imagem" (coberto) não chega a ele
    const hit = await page.evaluate(() => {
      const b = [...document.querySelectorAll("#jornada button")].find((x) => /Imagem/.test(x.textContent));
      const r = b.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return "fora da tela";
      const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return b.contains(e) ? "botão" : "outro";
    });
    assert(hit !== "botão", "clique alcança o botão coberto");
    await page.locator("a", { hasText: "Entre na imagem" }).focus();
    const seq = [];
    for (const key of ["Tab", "Tab", "Shift+Tab", "Shift+Tab"]) {
      await page.keyboard.press(key);
      const f = await visibleFocus(page);
      seq.push(`${key}:${f.text}`);
      assert(!f.inJourney || f.p >= 0.95, `foco num grupo coberto (${f.text}, p ${f.p})`);
      assert(f.body || (f.inView && f.opacity > 0.9 && f.onTop), `foco invisível: ${JSON.stringify(f)}`);
    }
    results.push(`    · ${w}: ${seq.join(" → ")}`);
    await context.close();
  });
}

await test("teclado durante a passagem (p≈0,5): foco no hero volta a página ao início (visível); controles da jornada inertes", async () => {
  const { page, context } = await open();
  const R = await runway(page);
  await go(page, Math.round(R * 0.5));
  assert((await st(page)).inert, "grupos sem inert no meio da passagem");
  await page.locator("a", { hasText: "Conhecer a plataforma" }).focus();
  const f = await visibleFocus(page);
  assert(f.inView && f.opacity > 0.9 && f.onTop, `CTA focado invisível: ${JSON.stringify(f)}`);
  await context.close();
});

await test("teclado: Enter em 'Entre na imagem' leva à jornada utilizável (p = 1, progress 0); Tab segue nos controles revelados", async () => {
  const { page, context } = await open();
  let hit = null;
  for (let i = 0; i < 20 && !hit; i++) {
    await page.keyboard.press("Tab");
    hit = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a?.closest("#inicio")) return null;
      const cs = getComputedStyle(a);
      return { text: a.textContent.trim(), outline: cs.outlineStyle, shadow: cs.boxShadow };
    });
  }
  assert(hit?.text === "Entre na imagem", `foco: ${hit?.text}`);
  assert(hit.outline !== "none" || hit.shadow !== "none", "foco invisível");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500);
  const s = await st(page);
  const R = await runway(page);
  assert(s.p === 1 && s.prog < 0.02 && Math.abs(s.y - R) < 40, `após Enter: ${JSON.stringify(s)} pista ${R}`);
  assert(!s.inert && s.cover === "revealed", `jornada não liberada: ${JSON.stringify(s)}`);
  await page.keyboard.press("Tab");
  const f = await visibleFocus(page);
  assert(f.inJourney && f.inView && f.onTop, `Tab após Enter: ${JSON.stringify(f)}`);
  results.push(`    · Enter → p 1; Tab → "${f.text}"`);
  // controle revelado responde ao clique
  await page.locator("#jornada").getByRole("button", { name: /Dados/ }).first().click();
  await page.waitForFunction(() => document.getElementById("jornada").dataset.activeStep === "2", null, { timeout: 2500 });
  // volta: o foco dentro do grupo vai para um destino visível ANTES do inert
  await go(page, 0);
  await page.locator("#jornada").getByRole("button", { name: /Imagem/ }).first().focus().catch(() => {});
  await go(page, R);
  await page.locator("#jornada").getByRole("button", { name: /Imagem/ }).first().focus();
  await go(page, Math.round(R * 0.4));
  await page.waitForTimeout(200);
  const back = await focusInfo(page);
  assert(!back.inJourney && back.inView && back.onTop, `foco ficou atrás da escultura: ${JSON.stringify(back)}`);
  results.push(`    · volta com foco em "Imagem" → foco em "${back.text}"`);
  await context.close();
});

await test("rolagem comum não desloca o foco: foco no hero permanece ao rolar a passagem", async () => {
  const { page, context } = await open();
  await page.locator("a", { hasText: "Entre na imagem" }).focus();
  const R = await runway(page);
  for (const f of [0.3, 0.6, 1, 0.5, 0]) await go(page, Math.round(R * f));
  const t = await page.evaluate(() => document.activeElement.textContent.trim());
  assert(t === "Entre na imagem", `foco mudou para ${t}`);
  await context.close();
});

await test("ambiente da jornada pausa enquanto a escultura cobre o quadro; cena montada e recebendo progress", async () => {
  const { page, context } = await open();
  await page.waitForFunction(() => document.querySelector("#jornada .ararat-journey")?.dataset.loaded === "true", null, { timeout: 8000 });
  const R = await runway(page);
  const a0 = (await st(page)).ambient;
  await go(page, Math.round(R * 0.2));
  const a1 = (await st(page)).ambient;
  await go(page, Math.round(R * 0.6));
  const a2 = (await st(page)).ambient;
  await go(page, Math.round(R * 1.3));
  const s3 = await st(page);
  assert(a0 === "off" && a1 === "off" && a2 === "on" && s3.ambient === "on", `ambiente ${a0},${a1},${a2},${s3.ambient}`);
  assert(s3.prog > 0, "cena não recebeu progress");
  await context.close();
});

// ───── Links para #jornada: destino exato da rolagem (fim da passagem = etapa Imagem) ─────
// Destino calculado à parte (mesma regra do layout): topo da trilha + pista (celular: − topo preso).
const journeyDest = (page) =>
  page.evaluate(() => {
    const s = document.getElementById("jornada");
    const track = s.querySelector("[data-journey-variant]");
    const desk = s.querySelector("[data-opening=runway-desktop]").offsetHeight;
    const col = s.querySelector("[data-opening=stage-col]");
    const end = desk || s.querySelector("[data-opening=runway-mobile]").offsetHeight - (parseFloat(getComputedStyle(col).top) || 0);
    return Math.round(scrollY + track.getBoundingClientRect().top + end);
  });
const arrival = (page) =>
  page.evaluate(() => {
    const f = document.querySelector("#jornada [data-layout]").getBoundingClientRect();
    return {
      y: Math.round(scrollY),
      p: parseFloat(document.querySelector("[data-opening=root]").style.getPropertyValue("--opening-p")),
      step: document.getElementById("jornada").dataset.activeStep,
      cover: document.querySelector("[data-opening=root]").dataset.cover,
      frameTop: Math.round(f.top),
      header: Math.round(document.querySelector("header").getBoundingClientRect().bottom),
      hash: location.hash,
    };
  });
async function settleScroll(page) {
  let last = -1, same = 0;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(120);
    const y = await page.evaluate(() => Math.round(scrollY));
    same = y === last ? same + 1 : 0;
    if (same >= 3) return; // estável por ~360 ms (cobre a rolagem de 1000 ms das propostas)
    last = y;
  }
}
async function expectArrived(page, dest, label) {
  await settleScroll(page);
  await page.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.cover === "revealed", null, { timeout: 4000 }).catch(() => {});
  const a = await arrival(page);
  assert(Math.abs(a.y - dest) <= 2, `${label}: rolagem em ${a.y}, destino ${dest}`);
  assert(a.p === 1 && a.step === "0" && a.cover === "revealed", `${label}: ${JSON.stringify(a)}`);
  assert(a.frameTop >= a.header, `${label}: quadro sob o cabeçalho (${a.frameTop} < ${a.header})`);
  assert(a.hash === "#jornada", `${label}: hash ${a.hash}`);
  return a;
}
async function tabIntoControls(page, label) {
  await page.keyboard.press("Tab");
  const f = await visibleFocus(page);
  assert(f.inJourney && f.inView && f.onTop && /Imagem/.test(f.text), `${label}: Tab → ${JSON.stringify(f)}`);
}

for (const [w, h] of [[1280, 720], [1440, 900], [390, 844]]) {
  await test(`${w}×${h} links para #jornada: Enter no CTA, clique, cabeçalho, volta ao hero e 2ª ativação, com rolagem em curso — destino exato e Tab nos controles`, async () => {
    const { page, context, errors } = await open(ROUTE, { width: w, height: h });
    await page.waitForFunction(() => document.querySelector("#jornada .ararat-journey")?.dataset.loaded === "true", null, { timeout: 8000 });
    const dest = await journeyDest(page);
    const cta = page.locator("#inicio a", { hasText: "Entre na imagem" });
    const log = [];
    // 1) Enter no CTA (teclado)
    await cta.focus();
    await page.keyboard.press("Enter");
    log.push(`Enter → ${(await expectArrived(page, dest, "Enter no CTA")).y}`);
    await tabIntoControls(page, "Enter no CTA");
    // 2) volta ao hero pela roda (o foco sai do grupo coberto para o cabeçalho) e 2ª ativação
    //    do CTA por teclado: Tab a partir do cabeçalho até "Entre na imagem"
    await page.mouse.move(w / 2, h / 2);
    for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, -90); await page.waitForTimeout(30); }
    await settleScroll(page);
    let reached = false;
    for (let i = 0; i < 25 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(() => document.activeElement?.textContent?.trim() === "Entre na imagem");
    }
    assert(reached, "Tab não chegou ao CTA a partir do cabeçalho");
    await settleScroll(page);
    await page.keyboard.press("Enter");
    log.push(`2ª ativação → ${(await expectArrived(page, dest, "2ª ativação")).y}`);
    await tabIntoControls(page, "2ª ativação");
    // 3) clique no CTA
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await settleScroll(page);
    await cta.click();
    log.push(`clique → ${(await expectArrived(page, dest, "clique")).y}`);
    await tabIntoControls(page, "clique");
    // 4) cabeçalho por teclado (no celular, dentro do menu)
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await settleScroll(page);
    const menu = page.locator("header button[aria-expanded]");
    if (await menu.isVisible()) await menu.click();
    const head = page.locator("header a", { hasText: "Explorar a jornada" });
    await head.focus();
    await page.keyboard.press("Enter");
    log.push(`cabeçalho → ${(await expectArrived(page, dest, "cabeçalho")).y}`);
    await tabIntoControls(page, "cabeçalho");
    // 5) reprodução da falha: Enter com outra rolagem suave ainda em curso (ex.: a do foco por Tab)
    for (const lag of [16, 40, 120]) {
      await page.evaluate(() => { scrollTo({ top: 9, behavior: "instant" }); scrollTo({ top: 0, behavior: "smooth" }); });
      await page.waitForTimeout(lag);
      await cta.focus({ timeout: 1000 }).catch(() => {});
      await page.evaluate(() => [...document.querySelectorAll("#inicio a")].find((a) => a.textContent.trim() === "Entre na imagem").focus({ preventScroll: true }));
      await page.keyboard.press("Enter");
      await expectArrived(page, dest, `Enter com rolagem em curso (${lag} ms)`);
      await tabIntoControls(page, `rolagem em curso ${lag} ms`);
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await settleScroll(page);
    }
    results.push(`    · ${w}: destino ${dest} — ${log.join(" · ")} · com rolagem em curso ok`);
    assert(errors.length === 0, errors.join(" | "));
    await context.close();
  });
}

await test("CTA durante a espera da RM: chega ao destino, foco na seção (Tab não entra nos controles); na revelação o foco não é movido", async () => {
  let release;
  const gate = new Promise((r) => (release = r));
  const { page, context } = await open(ROUTE, { width: 1280, height: 720 }, {
    wait: "domcontentloaded",
    before: (p) => p.route(/mri-base\.webp/, async (r) => { await gate; await r.continue(); }),
  });
  await page.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 8000 });
  const dest = await journeyDest(page);
  await page.locator("#inicio a", { hasText: "Entre na imagem" }).focus();
  await page.keyboard.press("Enter");
  await settleScroll(page);
  const a = await arrival(page);
  assert(Math.abs(a.y - dest) <= 2 && a.cover === "loading", `espera: ${JSON.stringify(a)} destino ${dest}`);
  assert(await page.evaluate(() => document.activeElement === document.getElementById("jornada")), "foco de chegada não está na seção");
  // a pessoa segue adiante pelo teclado: o foco sai da jornada (bloqueada) e não volta na revelação
  await page.keyboard.press("Tab");
  const f0 = await visibleFocus(page);
  assert(!f0.inJourney, `Tab entrou em controle oculto: ${JSON.stringify(f0)}`);
  release();
  await page.waitForTimeout(1500);
  const f1 = await focusInfo(page);
  assert(f1.text === f0.text && !f1.inJourney, `foco movido na revelação: ${f0.text} → ${f1.text}`);
  await context.close();
});

await test("link direto /previa#jornada: sem abertura, chega em p = 1", async () => {
  const { page, context } = await open(ROUTE + "#jornada", undefined, { seen: false });
  assert(!(await page.evaluate(() => !!document.getElementById("ararat-intro"))), "abertura tocou com hash");
  await page.waitForTimeout(300);
  const s = await st(page);
  assert(s.p === 1, `p ${s.p} (y ${s.y})`);
  await context.close();
});

await test("abertura na 1ª visita: escultura toca a entrada, poster oculto; interação assenta; não repete", async () => {
  const { page, context } = await open(ROUTE, undefined, { seen: false, wait: "domcontentloaded", canvas: false });
  assert(await page.evaluate(() => !!document.getElementById("ararat-intro")), "abertura não começou");
  await page.waitForFunction(() => document.querySelector("[data-opening=sticky] canvas"), null, { timeout: 5000 });
  const intro = await page.locator("[data-opening=sticky] canvas").getAttribute("data-intro");
  assert(intro === "playing" || intro === "done", `estado ${intro}`);
  assert((await page.locator("[data-opening=poster]").evaluate((el) => getComputedStyle(el).opacity)) === "0", "poster visível junto do canvas");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(150);
  assert((await page.locator("[data-opening=sticky] canvas").getAttribute("data-intro")) === "done", "interação não assentou a escultura");
  await page.reload({ waitUntil: "domcontentloaded" });
  assert(!(await page.evaluate(() => !!document.getElementById("ararat-intro"))), "abertura repetiu");
  await context.close();
});

await test("falha do módulo da escultura: poster fica, passagem por CSS revela o quadro, página íntegra", async () => {
  const { page, context, errors } = await open(ROUTE, undefined, {
    before: (p) => p.route(/home-sculpture\.js/, (r) => r.fulfill({ status: 404, body: "" })),
  });
  await page.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "falhou", null, { timeout: 6000 });
  assert((await page.locator("[data-opening=poster]").evaluate((el) => getComputedStyle(el).opacity)) === "1", "poster sumiu");
  await go(page, await runway(page));
  const bd = await page.locator("[data-opening=backdrop]").evaluate((el) => getComputedStyle(el).opacity);
  assert(bd === "0", `fundo ainda cobre o quadro (${bd})`);
  const real = errors.filter((e) => !/404|Failed to (load|fetch)|dynamically imported/i.test(e));
  assert(real.length === 0, real.join(" | "));
  await context.close();
});

await test("falha da RM: a passagem conclui sobre o aviso local, sem erro de página", async () => {
  const { page, context, errors } = await open(ROUTE, undefined, {
    before: (p) => p.route(/mri-(base|axial-demo)\.webp/, (r) => r.fulfill({ status: 404, body: "" })),
  });
  await page.waitForTimeout(800);
  await go(page, await runway(page));
  const s = await st(page);
  assert(s.p === 1, `p ${s.p} (cena ${s.scene})`);
  const real = errors.filter((e) => !/404|Failed to load resource/i.test(e));
  assert(real.length === 0, real.join(" | "));
  await context.close();
});

await test("RM atrasada: quadro segue coberto (sem quadro vazio), grupos inert; ao chegar, revelação curta do módulo, sem salto", async () => {
  let release;
  const gate = new Promise((r) => (release = r));
  const { page, context } = await open(ROUTE, undefined, {
    wait: "domcontentloaded",
    before: (p) => p.route(/mri-base\.webp/, async (r) => { await gate; await r.continue(); }),
  });
  await page.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 8000 });
  await go(page, await runway(page));
  await page.waitForTimeout(300);
  const s0 = await st(page);
  assert(s0.p === 1, `p ${s0.p} (o clamp de 0,29 não existe mais)`);
  assert(s0.scene === "waiting" && s0.reveal === "covered" && s0.inert && s0.cover === "loading", `revelou antes da RM: ${JSON.stringify(s0)}`);
  // quadro coberto pela cor da seção (pixel do centro do quadro no canvas = navy opaco)
  const px = await page.evaluate(() => {
    const host = document.querySelector("[data-opening=sticky] > div:last-child"), c = host.querySelector("canvas");
    const f = document.querySelector("#jornada [data-layout]").getBoundingClientRect(), hr = host.getBoundingClientRect(), k = c.width / hr.width;
    const d = c.getContext("2d").getImageData(Math.round((f.left - hr.left + f.width * 0.3) * k), Math.round((f.top - hr.top + f.height * 0.3) * k), 1, 1).data;
    return [...d];
  });
  assert(px[3] > 240 && px[0] < 30 && px[2] < 60, `quadro não coberto: ${px}`);
  const t0 = Date.now();
  release();
  await page.waitForFunction(() => document.querySelector("[data-opening=sticky] canvas").dataset.reveal !== "covered", null, { timeout: 8000 });
  const mid = await page.locator("[data-opening=sticky] canvas").getAttribute("data-reveal");
  await page.waitForFunction(() => document.querySelector("[data-opening=sticky] canvas").dataset.reveal === "ready", null, { timeout: 4000 });
  await page.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.cover === "revealed", null, { timeout: 2000 });
  results.push(`    · RM tardia: revelação "${mid}" → "ready" em ${Date.now() - t0} ms (READY_MS do módulo)`);
  assert(mid === "opening", `sem transição de revelação (${mid})`);
  assert(!(await st(page)).inert, "grupos continuam inert depois da revelação");
  await context.close();
});

// ───── Carregamento tardio: controles ocultos + aviso real, liberados quando o Motion revela ─────
const waitState = (page) =>
  page.evaluate(() => {
    const c = document.querySelector("#jornada [data-journey-controls]");
    const btns = [...c.querySelectorAll("button")];
    const note = document.querySelector("[data-opening=wait]");
    const nr = note.getBoundingClientRect();
    const rail = c.querySelector("[role=group]").getBoundingClientRect();
    return {
      cover: document.querySelector("[data-opening=root]").dataset.cover,
      reveal: document.querySelector("[data-opening=sticky] canvas")?.dataset.reveal ?? null,
      controlsHidden: btns.every((b) => getComputedStyle(b).visibility === "hidden"),
      controlsSpace: rail.height > 20 && rail.width > 100, // espaço preservado
      inert: !!c.closest("[inert]"),
      msg: note.textContent,
      role: note.getAttribute("role"),
      noteInert: !!note.closest("[inert],[aria-hidden=true]"),
      noteOverRail: nr.top >= rail.top - 1 && nr.bottom <= rail.bottom + 1 && nr.left >= rail.left - 1,
      scene: !!document.querySelector("#jornada [data-layout]"),
    };
  });

for (const [w, h] of [[1440, 900], [390, 844]]) {
  await test(`${w}×${h} RM tardia por teclado: Enter → espera com controles ocultos e aviso acessível; revelação libera tudo no mesmo estado; Tab chega aos controles`, async () => {
    let release;
    const gate = new Promise((r) => (release = r));
    const { page, context, errors } = await open(ROUTE, { width: w, height: h }, {
      wait: "domcontentloaded",
      before: (p) => p.route(/mri-base\.webp/, async (r) => { await gate; await r.continue(); }),
    });
    await page.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 8000 });
    // registra todo texto que o aviso exibir (para provar que some só com a revelação)
    await page.evaluate(() => {
      window.__waitLog = [];
      const n = document.querySelector("[data-opening=wait]");
      new MutationObserver(() => window.__waitLog.push([n.textContent, document.querySelector("[data-opening=sticky] canvas").dataset.reveal])).observe(n, { childList: true, characterData: true, subtree: true });
    });
    await page.locator("a", { hasText: "Entre na imagem" }).focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.cover === "loading", null, { timeout: 5000 });
    await page.waitForTimeout(400);
    const s0 = await waitState(page);
    assert(s0.reveal === "covered" && s0.inert && s0.controlsHidden && s0.controlsSpace, `espera: ${JSON.stringify(s0)}`);
    assert(s0.msg === "Carregando imagem de RM…" && s0.role === "status" && !s0.noteInert && s0.noteOverRail, `aviso: ${JSON.stringify(s0)}`);
    release();
    await page.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.cover === "revealed", null, { timeout: 8000 });
    const s1 = await waitState(page);
    assert(s1.reveal === "ready" && !s1.inert && !s1.controlsHidden && s1.msg === "", `após revelação: ${JSON.stringify(s1)}`);
    const log = await page.evaluate(() => window.__waitLog);
    const cleared = log.find(([t]) => t === "");
    assert(log.length === 2 && cleared && cleared[1] === "ready", `aviso saiu antes da revelação concluída: ${JSON.stringify(log)}`);
    await page.keyboard.press("Tab");
    const f1 = await visibleFocus(page);
    assert(f1.inJourney && f1.inView && f1.onTop && /Imagem/.test(f1.text), `Tab após revelar: ${JSON.stringify(f1)}`);
    results.push(`    · ${w}: espera → "${s0.msg}" (role=status) · revelada → Tab em "${f1.text}"`);
    assert(errors.length === 0, errors.join(" | "));
    await context.close();
  });
}

for (const [w, h] of [[1440, 900], [390, 844]]) {
  await test(`${w}×${h} RM tardia: Tab durante a espera não cai em controle oculto (foco visível)`, async () => {
    const { page, context } = await open(ROUTE, { width: w, height: h }, {
      wait: "domcontentloaded",
      before: (p) => p.route(/mri-base\.webp/, () => {}), // nunca responde: espera real
    });
    await page.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 8000 });
    await page.locator("a", { hasText: "Entre na imagem" }).focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.cover === "loading", null, { timeout: 5000 });
    for (const key of ["Tab", "Shift+Tab"]) {
      await page.keyboard.press(key);
      const f = await visibleFocus(page);
      assert(!f.inJourney, `${key} focou controle oculto: ${JSON.stringify(f)}`);
      assert(f.body || (f.inView && f.onTop), `${key}: foco invisível ${JSON.stringify(f)}`);
    }
    await context.close();
  });
}

for (const [w, h] of [[1440, 900], [390, 844]]) {
  await test(`${w}×${h} carga normal: chega revelada, sem aviso de carregamento em nenhum momento`, async () => {
    const { page, context } = await open(ROUTE, { width: w, height: h });
    await page.waitForFunction(() => document.querySelector("#jornada .ararat-journey")?.dataset.loaded === "true", null, { timeout: 8000 });
    await page.evaluate(() => {
      window.__waitLog = [];
      const n = document.querySelector("[data-opening=wait]");
      new MutationObserver(() => window.__waitLog.push(n.textContent)).observe(n, { childList: true, characterData: true, subtree: true });
    });
    await page.locator("a", { hasText: "Entre na imagem" }).focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1200);
    const s = await waitState(page);
    const log = await page.evaluate(() => window.__waitLog);
    assert(s.cover === "revealed" && !s.controlsHidden && !s.inert && s.msg === "", JSON.stringify(s));
    assert(!log.some((t) => t), `aviso apareceu: ${JSON.stringify(log)}`);
    await context.close();
  });
}

const failCases = [
  ["RM com falha definitiva (404)", (p) => p.route(/mri-base\.webp/, (r) => r.fulfill({ status: 404, body: "" }))],
  ["módulo da jornada com falha (404)", (p) => p.route(/home-v2-0\.2\.0\/web\/journey\.js/, (r) => r.fulfill({ status: 404, body: "" }))],
  ["módulo da escultura com falha + RM tardia", (p) => Promise.all([
    p.route(/home-sculpture\.js/, (r) => r.fulfill({ status: 404, body: "" })),
    p.route(/mri-base\.webp/, async (r) => { await new Promise((x) => setTimeout(x, 2500)); await r.continue(); }),
  ])],
];
for (const [w, h] of [[1440, 900], [390, 844]]) {
  for (const [label, block] of failCases) {
    await test(`${w}×${h} ${label}: nunca espera indefinidamente — aviso some, controles liberados`, async () => {
      const { page, context } = await open(ROUTE, { width: w, height: h }, { wait: "domcontentloaded", canvas: false, before: block });
      await page.waitForTimeout(600);
      await page.locator("a", { hasText: "Entre na imagem" }).focus();
      await page.keyboard.press("Enter");
      if (/tardia/.test(label)) {
        // sem canvas, a espera usa o estado da cena estática: aviso e controles ocultos até a RM
        await page.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.cover === "loading", null, { timeout: 4000 });
        const w0 = await waitState(page);
        assert(w0.controlsHidden && w0.msg === "Carregando imagem de RM…", `espera sem canvas: ${JSON.stringify(w0)}`);
      }
      await page.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.cover === "revealed", null, { timeout: 12000 });
      const s = await waitState(page);
      assert(!s.controlsHidden && !s.inert && s.msg === "" && s.scene, JSON.stringify(s));
      if (/RM com falha/.test(label)) {
        // nunca um quadro vazio: aviso local no próprio quadro, visível depois da revelação
        const note = await page.evaluate(() => {
          const n = document.querySelector("#jornada [data-layout] [role=status]");
          if (!n) return null;
          const r = n.getBoundingClientRect();
          const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return { text: n.textContent, visible: n === hit || n.contains(hit) };
        });
        assert(note?.text === "Imagem de RM indisponível no momento" && note.visible, `aviso de falha: ${JSON.stringify(note)}`);
      }
      await page.keyboard.press("Tab");
      const f = await visibleFocus(page);
      assert(f.inJourney && f.onTop, `Tab: ${JSON.stringify(f)}`);
      await context.close();
    });
  }
}

await test("módulo da escultura atrasado: poster e passagem em CSS até ele chegar; troca sem salto no meio da passagem", async () => {
  const { page, context, errors } = await open(ROUTE, undefined, {
    wait: "domcontentloaded",
    canvas: false,
    before: (p) => p.route(/home-sculpture\.js/, async (r) => { await new Promise((x) => setTimeout(x, 2500)); await r.continue(); }),
  });
  await page.waitForTimeout(800);
  const R = await runway(page);
  await go(page, Math.round(R * 0.4));
  const before = await st(page);
  assert(before.sculpture !== "canvas" && before.inert, `estado antes do módulo: ${JSON.stringify(before)}`);
  await page.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.sculpture === "canvas", null, { timeout: 8000 });
  const after = await st(page);
  assert(Math.abs(after.p - before.p) < 0.002, `p saltou: ${before.p} → ${after.p}`);
  assert(errors.length === 0, errors.join(" | "));
  await context.close();
});

await test("rede lenta: texto e ação visíveis antes do poster e do módulo", async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 90000 });
  await page.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  const t0 = Date.now();
  page.goto(BASE + ROUTE).catch(() => {});
  await page.waitForSelector("[data-opening=content] a.btn-gold", { state: "visible", timeout: 10000 });
  const tCta = Date.now() - t0;
  await page.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 20000 });
  const tCanvas = Date.now() - t0;
  assert(tCta < tCanvas, "ação depois do módulo");
  results.push(`    · rede lenta (1,6 Mbps/150 ms): ação em ${tCta} ms, escultura em ${tCanvas} ms`);
  await context.close();
});

await test("CLS na carga com abertura < 0,02 (1440 e 390)", async () => {
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport: vp });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__cls = 0;
      window.__clsSrc = [];
      // fontes do deslocamento (para diagnóstico quando falhar): elemento, retângulo antes → depois
      const d = (n) => (n && n.nodeType === 1 ? `${n.tagName.toLowerCase()}${n.id ? "#" + n.id : ""}${n.getAttribute("data-opening") ? "[" + n.getAttribute("data-opening") + "]" : ""}.${(n.getAttribute("class") || "").split(" ")[0].replace(/^.*__/, "")}` : n?.nodeName ?? "?");
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__clsSrc.push(`${e.value.toFixed(4)}@${Math.round(e.startTime)}ms fontes=${document.fonts.status} intro=${!!document.getElementById("ararat-intro")} scrollY=${scrollY} sb=${innerWidth - document.documentElement.clientWidth}: ` + e.sources.map((x) => `${d(x.node)} ${Math.round(x.previousRect.x)},${Math.round(x.previousRect.y)},${Math.round(x.previousRect.width)}x${Math.round(x.previousRect.height)}→${Math.round(x.currentRect.x)},${Math.round(x.currentRect.y)},${Math.round(x.currentRect.width)}x${Math.round(x.currentRect.height)}`).join(" | ")); } }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(BASE + ROUTE, { waitUntil: "networkidle" });
    await page.waitForTimeout(1600);
    const cls = await page.evaluate(() => window.__cls);
    const src = await page.evaluate(() => window.__clsSrc);
    if (src.length) results.push(`    · ${vp.width}: CLS ${cls.toFixed(4)} — ${src.join(" ;; ")}`);
    assert(cls < 0.02, `${vp.width}: CLS ${cls.toFixed(4)} — ${src.join(" ;; ")}`);
    await context.close();
  }
});

await test("jornada na /previa: quatro etapas selecionáveis depois da passagem; seções seguintes presentes", async () => {
  const { page, context, errors } = await open();
  await go(page, await runway(page));
  await page.waitForTimeout(300);
  for (const [name, idx] of [["Segmentação", 1], ["Dados", 2], ["Explicação", 3], ["Imagem", 0]]) {
    const btn = page.locator("#jornada").getByRole("button", { name: new RegExp(name) }).first();
    await btn.click();
    const ok = await page.waitForFunction((i) => document.getElementById("jornada").dataset.activeStep === String(i), idx, { timeout: 2500 }).then(() => true).catch(() => false);
    assert(ok, `${name} não selecionou`);
  }
  assert((await st(page)).p === 1, "voltar à etapa 1 reabriu a escultura");
  for (const id of ["passagem", "plataforma", "explicabilidade", "ciencia", "contato"]) assert(await page.locator(`#${id}`).count(), `#${id} ausente`);
  assert(errors.length === 0, errors.join(" | "));
  await context.close();
});

await browser.close();
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("✘")).length;
const total = results.filter((r) => /^[✔✘]/.test(r)).length;
console.log(`\n${total - fails}/${total} aprovados`);
process.exit(fails ? 1 : 0);
