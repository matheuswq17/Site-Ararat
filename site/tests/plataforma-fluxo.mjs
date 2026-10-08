// Demonstração "do Hub ao Viewer" na /previa/refinada (seção Plataforma). Testes da página real:
// apresentação estática (sem JS, reduzido, falha de recurso), progresso pela posição real (ida, volta, paradas,
// resize, teclado), enquadramento nas 6 larguras, ausência de rolagem lateral e de CLS, avisos e atribuição.
// Quando o módulo do Motion estiver registrado, os testes do palco animado deixam de ficar "pendentes".
//   node tests/plataforma-fluxo.mjs      (servidor em :3000)
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ROUTE = "/previa/refinada";
const results = [];
const notes = [];
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
async function test(name, fn) {
  if (process.env.ONLY && !new RegExp(process.env.ONLY).test(name)) return;
  try { await fn(); results.push(`✔ ${name}`); } catch (e) { results.push(`${e.message.startsWith("PENDENTE") ? "⏸" : "✘"} ${name}\n    ${e.message.split("\n")[0]}`); }
}
const browser = await chromium.launch();
async function open(vp, o = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, reducedMotion: o.reduced ? "reduce" : "no-preference", javaScriptEnabled: !o.noJs });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  await page.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  if (o.init) await page.addInitScript(o.init);
  if (o.route) await ctx.route(o.route.pattern, o.route.handler);
  await page.goto(BASE + ROUTE, { waitUntil: "networkidle" });
  return { ctx, page, errors };
}
const TELAS = [[1920, 1080], [1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]];
const estado = (page) => page.evaluate(() => { const f = document.querySelector("[data-fluxo]"); return { p: +f.dataset.progresso, etapa: +f.dataset.etapa, local: +f.dataset.local, motor: f.dataset.motor ?? null }; });
const posEtapas = (page) => page.evaluate(() => { const f = document.querySelector("[data-fluxo]"); const cab = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72; const linha = cab + 0.5 * (innerHeight - cab); return { linha, tops: [...f.querySelectorAll("[data-fluxo=roteiro] > li")].map((li) => li.getBoundingClientRect().top + scrollY), fim: f.querySelector("[data-fluxo=roteiro]").getBoundingClientRect().bottom + scrollY }; });
async function carregarTudo(page, h) {
  const { tops, fim } = await posEtapas(page);
  for (let y = tops[0] - h; y <= fim; y += h / 2) { await page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), y); await page.waitForTimeout(90); }
  await page.waitForLoadState("networkidle");
}

await test("conteúdo: 7 etapas na ordem aprovada, avisos visíveis, atribuição com DOI, licença, tratamentos e sem endosso; nada fora do escopo", async () => {
  const { ctx, page } = await open([1440, 900], { noJs: true });
  const t = await page.evaluate(() => { const f = document.querySelector("[data-fluxo]"); return { titulos: [...f.querySelectorAll("[data-fluxo=roteiro] > li h3")].map((h) => h.textContent), texto: f.innerText, aviso: f.querySelector("[role=note]").innerText, links: [...f.querySelectorAll("a")].map((a) => [a.textContent, a.href, a.rel]), secao: document.querySelector("#plataforma").innerText }; });
  assert(JSON.stringify(t.titulos) === JSON.stringify(["A fila do Hub", "O mesmo caso no Viewer", "Cortes e planos sincronizados", "T2 e ADC lado a lado", "Uma medida com a régua", "Imagens-chave e prévia do relatório", "De volta ao Hub"]), "etapas: " + t.titulos);
  assert(/Demonstração do fluxo da interface/.test(t.aviso) && /em validação/.test(t.aviso) && /não constitui interpretação clínica/.test(t.aviso) && /reais, públicas e desidentificadas/.test(t.aviso) && /ProstateX-0067/.test(t.aviso), "aviso: " + t.aviso);
  assert(/Revisão pendente/.test(t.texto) && /M1 55,1 mm é demonstrativa/.test(t.texto) && /nada é emitido nem assinado/.test(t.texto), "textos-chave");
  assert(t.links.some(([, h]) => h === "https://doi.org/10.7937/K9TCIA.2017.MURS5CL") && t.links.some(([, h, r]) => h === "https://creativecommons.org/licenses/by/3.0/" && /license/.test(r)), "links: " + JSON.stringify(t.links));
  assert(/sem endosso do TCIA/.test(t.texto) && /recortadas/.test(t.texto) && /janela\/nível/.test(t.texto), "tratamentos/endosso");
  // fora do escopo: nenhum score/probabilidade/ISUP/XAI/GGG/segmentação/detecção mostrado como resultado na demonstração
  const proibidos = [/score/i, /probabilidade/i, /ISUP/, /\bXAI\b/, /GGG/, /segmenta/i, /detec/i, /\bDWI\b/, /finalizad/i, /assinad[oa] /i];
  const demo = t.texto.replace(/Finalizar é uma decisão do radiologista e não é simulado aqui\./, "").replace(/nada é emitido nem assinado aqui/, "");
  const achados = proibidos.filter((r) => r.test(demo)).map(String);
  assert(!achados.length, "fora do escopo na demonstração: " + achados);
  await ctx.close();
});

await test("roteiro estático · imagens: derivados da pasta versionada, dimensões reservadas (width/height + aspect-ratio), alt descritivo, nada da entrega bruta", async () => {
  const { ctx, page } = await open([1440, 900], { reduced: true });
  await carregarTudo(page, 900);
  const imgs = await page.evaluate(() => [...document.querySelectorAll("[data-fluxo] img")].map((i) => ({ src: i.currentSrc, w: i.getAttribute("width"), h: i.getAttribute("height"), nw: i.naturalWidth, alt: i.alt, ar: getComputedStyle(i.parentElement).aspectRatio, vis: i.getBoundingClientRect().width })));
  assert(imgs.length >= 15, "nº de imagens " + imgs.length);
  for (const i of imgs) {
    assert(/\/refinada\/plataforma-fluxo-estatico-v1\/[a-z0-9-]+-\d+\.webp$/.test(new URL(i.src || "http://x/").pathname) || i.vis === 0, "fonte fora da pasta: " + i.src);
    assert(+i.w > 0 && +i.h > 0 && i.alt.length > 30 && i.ar !== "auto", "reserva/alt: " + JSON.stringify(i));
  }
  const carregadas = imgs.filter((i) => i.vis > 0);
  assert(carregadas.every((i) => i.nw > 0), "imagem visível não carregada");
  await ctx.close();
});

await test("roteiro estático · enquadramento nas 6 larguras: sem rolagem lateral, capturas dentro da coluna, texto legível (≥ 13 px), CLS ao carregar as imagens = 0", async () => {
  const linhas = [];
  for (const [w, h] of TELAS) {
    const { ctx, page } = await open([w, h], { reduced: true, init: () => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); } });
    await page.evaluate(() => document.querySelector("#plataforma").scrollIntoView({ behavior: "instant" }));
    const c0 = await page.evaluate(() => window.__cls);
    await carregarTudo(page, h);
    const m = await page.evaluate(() => {
      const f = document.querySelector("[data-fluxo]");
      const fr = f.getBoundingClientRect();
      const fora = [...f.querySelectorAll("figure")].filter((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && (r.left < fr.left - 1 || r.right > fr.right + 1); }).length;
      const fonte = Math.min(...[...f.querySelectorAll("[data-fluxo=roteiro] > li p")].map((p) => parseFloat(getComputedStyle(p).fontSize)));
      return { sw: document.documentElement.scrollWidth, fora, fonte, alt: document.querySelector("#plataforma").offsetHeight };
    });
    const cls = (await page.evaluate(() => window.__cls)) - c0;
    assert(m.sw <= w, `${w}: scrollWidth ${m.sw}`);
    assert(m.fora === 0, `${w}: ${m.fora} capturas fora da coluna`);
    assert(m.fonte >= 13, `${w}: fonte mínima ${m.fonte}`);
    assert(cls < 0.001, `${w}: CLS ${cls}`);
    linhas.push(`${w}×${h} seção ${m.alt} px, CLS ${cls.toFixed(4)}`);
    await ctx.close();
  }
  notes.push("    · " + linhas.join(" · "));
});

await test("roteiro estático · etapa em leitura pela posição real: ida e volta reversíveis, paradas estáveis, resize no meio recalcula, teclado", async () => {
  const { ctx, page } = await open([1440, 900], { reduced: true });
  const { linha, tops, fim } = await posEtapas(page);
  const amostras = [];
  for (let y = tops[0] - linha - 100; y <= fim - linha + 100; y += 60) {
    await page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), y); await page.waitForTimeout(60);
    amostras.push({ y, ...(await estado(page)) });
  }
  const ida = amostras.map((a) => a.p);
  assert(ida[0] === 0 && ida.at(-1) === 1 && ida.every((v, i) => !i || v >= ida[i - 1]), "ida: " + ida);
  assert(JSON.stringify([...new Set(amostras.map((a) => a.etapa))]) === "[0,1,2,3,4,5,6]", "etapas: " + [...new Set(amostras.map((a) => a.etapa))]);
  for (const a of [...amostras].reverse().filter((_, i) => i % 3 === 0)) {
    await page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), a.y); await page.waitForTimeout(60);
    const e = await estado(page); assert(e.p === a.p && e.etapa === a.etapa, `volta ≠ ida em y ${a.y}: ${e.p} vs ${a.p}`);
  }
  // parada: o estado não muda sozinho
  const meio = amostras[Math.floor(amostras.length / 2)];
  await page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), meio.y); await page.waitForTimeout(100);
  const e0 = await estado(page); await page.waitForTimeout(1500); const e1 = await estado(page);
  assert(JSON.stringify(e0) === JSON.stringify(e1), "estado mudou parado");
  // resize no meio: recalcula pela nova posição (sem guardar valor antigo)
  await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(300);
  const er = await estado(page);
  const esperado = await page.evaluate(() => { const f = document.querySelector("[data-fluxo]"); const cab = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72; const y = cab + 0.5 * (innerHeight - cab); const lis = [...f.querySelectorAll("[data-fluxo=roteiro] > li")].map((l) => l.getBoundingClientRect()); for (let i = 0; i < lis.length; i++) { const fim = i + 1 < lis.length ? lis[i + 1].top : lis[i].bottom; if (y < lis[0].top) return 0; if (y < fim) return (i + Math.min(1, Math.max(0, (y - lis[i].top) / (fim - lis[i].top)))) / lis.length; } return 1; });
  assert(Math.abs(er.p - esperado) < 0.002, `resize: ${er.p} vs ${esperado}`);
  // teclado: PageDown/PageUp avançam e voltam (rolagem nativa, sem captura)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), tops[0] - linha + 10); await page.waitForTimeout(200);
  await page.mouse.click(5, 450).catch(() => {});
  const k = [await estado(page)];
  for (const key of ["PageDown", "PageDown", "PageDown", "PageUp", "PageUp", "PageUp"]) { await page.keyboard.press(key); await page.waitForTimeout(500); k.push(await estado(page)); }
  assert(k[3].p > k[0].p && Math.abs(k[6].p - k[0].p) < 0.02, "teclado: " + k.map((x) => x.p.toFixed(3)).join(" "));
  notes.push(`    · 1440: p ${ida.filter((_, i) => i % 6 === 0).map((v) => v.toFixed(2)).join(" ")} … (${amostras.length} amostras, etapas 0–6); volta = ida; parado estável; resize 1440→1280 p ${er.p.toFixed(3)}≈${esperado.toFixed(3)}; teclado ${k.map((x) => x.p.toFixed(2)).join(" ")}`);
  await ctx.close();
});

await test("apresentação estática: sem JS, movimento reduzido e pausa mostram o roteiro com as 7 etapas e capturas; roda do mouse rola a página", async () => {
  for (const o of [{ noJs: true }, { reduced: true }]) {
    const { ctx, page } = await open([1440, 900], o);
    await carregarTudo(page, 900);
    const m = await page.evaluate(() => { const f = document.querySelector("[data-fluxo]"); return { visiveis: [...f.querySelectorAll("figure")].filter((x) => x.getBoundingClientRect().width > 0 && getComputedStyle(x).visibility === "visible").length, etapas: f.querySelectorAll("[data-fluxo=roteiro] > li").length }; });
    assert(m.etapas === 7 && m.visiveis >= 13, JSON.stringify({ o, m }));
    await ctx.close();
  }
  const { ctx, page } = await open([1440, 900]);
  await page.evaluate(() => document.querySelector("header button[aria-pressed]")?.click());
  await page.waitForTimeout(300);
  const pz = await page.evaluate(() => ({ roteiro: document.querySelector("[data-fluxo=roteiro]").getBoundingClientRect().height > 0, trilho: document.querySelector("[data-fluxo=trilho]").getBoundingClientRect().height }));
  assert(pz.roteiro && pz.trilho === 0, "pausa: " + JSON.stringify(pz));
  // a roda do mouse rola a página normalmente na seção (nada de preventDefault)
  await page.evaluate(() => document.querySelector("[data-fluxo=roteiro]").scrollIntoView({ behavior: "instant" }));
  const y0 = await page.evaluate(() => scrollY); await page.mouse.move(700, 500); await page.mouse.wheel(0, 400); await page.waitForTimeout(400);
  const y1 = await page.evaluate(() => scrollY);
  assert(y1 - y0 > 300, `roda não rolou a página: ${y0} → ${y1}`);
  await ctx.close();
});

await test("roteiro estático · recursos com erro ou atrasados: quadro identificado no lugar da imagem, sem quebrar o layout", async () => {
  const { ctx, page, errors } = await open([390, 844], { reduced: true, route: { pattern: /plataforma-fluxo-estatico-v1\/viewer-regua/, handler: (r) => r.fulfill({ status: 404, body: "" }) } });
  await carregarTudo(page, 844);
  const m = await page.evaluate(() => [...document.querySelectorAll("[data-fluxo] figure[data-falhou]")].map((f) => ({ txt: f.innerText.slice(0, 40), h: f.getBoundingClientRect().height })));
  assert(m.length >= 1 && m.every((x) => /Captura indisponível/.test(x.txt) && x.h > 50), "falha: " + JSON.stringify(m));
  assert(!errors.length, errors.join(" | "));
  await ctx.close();
  // atrasado: a reserva de espaço impede deslocamento quando a imagem chega
  const lento = await open([1440, 900], { reduced: true, init: () => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); }, route: { pattern: /plataforma-fluxo-estatico-v1\//, handler: async (r) => { await new Promise((ok) => setTimeout(ok, 1200)); await r.continue(); } } });
  await lento.page.evaluate(() => document.querySelector("[data-fluxo=roteiro]").scrollIntoView({ behavior: "instant" }));
  const c0 = await lento.page.evaluate(() => window.__cls);
  await lento.page.waitForTimeout(2500);
  const c1 = await lento.page.evaluate(() => window.__cls);
  assert(c1 - c0 < 0.001, `CLS com imagens atrasadas: ${c1 - c0}`);
  await lento.ctx.close();
  notes.push(`    · 404 na régua → "${m[0].txt}…" (${Math.round(m[0].h)} px); imagens com 1,2 s de atraso → CLS ${(c1 - c0).toFixed(4)}`);
});

// ── Percurso animado (módulo do Motion 0.1.0, palco sticky no trilho) ────────────────────────────────
const posTrilho = (page) => page.evaluate(() => { const t = document.querySelector("[data-fluxo=trilho]"); const r = t.getBoundingClientRect(); const cab = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72; return { top: r.top + scrollY, h: r.height, curso: r.height - (innerHeight - cab), cab }; });
const irP = async (page, t, p, espera = 1300) => { await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), Math.round(t.top - t.cab + p * t.curso)); await page.waitForTimeout(espera); };
const estAnim = (page) => page.evaluate(() => { const r = document.querySelector("[data-fluxo=root]"); const pal = r.querySelector("[data-fluxo-palco]"); return { p: +r.dataset.progresso, modo: r.dataset.fluxoModo ?? null, etapa: +(r.dataset.fluxoEtapa ?? -1), layout: r.dataset.fluxoLayout ?? null, falha: r.dataset.fluxoFalha ?? null, palco: [...pal.querySelectorAll("*")].filter((e) => e.checkVisibility({ opacityProperty: true, visibilityProperty: true })).map((e) => (e.getAttribute("style") || "") + (e.getAttribute("src") || "")).join("|"), roteiro: r.querySelector("[data-fluxo=roteiro]").getBoundingClientRect().height > 0 }; });

await test("percurso animado: 1→7 em ordem nas 6 larguras, legenda ativa, enquadramento desktop/celular, só assets do pacote, sem rolagem lateral e CLS 0", async () => {
  const linhas = [];
  for (const [w, h] of TELAS) {
    const pedidos = [];
    const { ctx, page, errors } = await open([w, h], { init: () => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); } });
    page.on("request", (r) => pedidos.push(r.url()));
    const t = await posTrilho(page);
    const etapas = [];
    for (let p = 0; p <= 1.0001; p += 0.05) { await irP(page, t, p, 700); const e = await estAnim(page); etapas.push(e.etapa); assert(e.modo === "animado" && !e.roteiro, `${w}: modo ${e.modo}`); }
    const seq = etapas.filter((v, i) => !i || v !== etapas[i - 1]);
    assert(JSON.stringify(seq) === "[1,2,3,4,5,6,7]", `${w}: etapas ${seq}`);
    const e = await estAnim(page);
    assert(e.layout === (w >= 768 ? "desktop" : "celular") || (w === 768 && e.layout === "celular"), `${w}: layout ${e.layout}`);
    const leg = await page.evaluate(() => { const ativa = [...document.querySelectorAll("[data-fluxo=trilho] li[data-etapa]")].filter((l) => l.getBoundingClientRect().height > 0 && getComputedStyle(l).borderLeftColor !== "rgba(0, 0, 0, 0)"); return ativa.map((l) => l.dataset.etapa); });
    assert(leg.includes("7"), `${w}: legenda ativa ${leg}`);
    const assets = pedidos.filter((u) => /plataforma-fluxo/.test(u));
    assert(assets.every((u) => /\/refinada\/plataforma-fluxo-0\.1\.0\/(plataforma-fluxo\.js|assets\/[a-z0-9-]+@[12]x\.webp)$/.test(new URL(u).pathname)), `${w}: pedido fora do pacote: ${assets.find((u) => !/plataforma-fluxo-0\.1\.0/.test(u))}`);
    assert(!pedidos.some((u) => /dwi|segment|gravacao|\.mp4|dicom|\.dcm/i.test(u)), `${w}: pedido proibido`);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    assert(sw <= w, `${w}: scrollWidth ${sw}`);
    const cls = await page.evaluate(() => window.__cls);
    assert(cls < 0.001, `${w}: CLS ${cls}`);
    assert(!errors.length, `${w}: ${errors.join(" | ")}`);
    linhas.push(`${w}×${h} ${e.layout}, trilho ${Math.round(t.h)} px, ${assets.length} arquivos, CLS ${cls.toFixed(4)}`);
    await ctx.close();
  }
  notes.push("    · percurso: " + linhas.join(" · "));
});

await test("percurso animado: ida e volta pelos mesmos estados, paradas sem redesenho, resize no meio, teclado e roda nativos", async () => {
  const { ctx, page } = await open([1440, 900]);
  let t = await posTrilho(page);
  const pts = [0.08, 0.24, 0.38, 0.52, 0.66, 0.8, 0.94];
  const ida = [];
  for (const p of pts) { await irP(page, t, p); ida.push(await estAnim(page)); }
  for (let i = pts.length - 1; i >= 0; i--) { await irP(page, t, pts[i]); const v = await estAnim(page); assert(v.palco === ida[i].palco && v.etapa === ida[i].etapa, `volta ≠ ida em p ${pts[i]}`); }
  // parada no meio: nenhuma mutação no palco
  await irP(page, t, 0.45);
  const mut = await page.evaluate(() => new Promise((ok) => { let n = 0; const o = new MutationObserver((l) => (n += l.length)); o.observe(document.querySelector("[data-fluxo-palco]"), { subtree: true, attributes: true, childList: true }); setTimeout(() => { o.disconnect(); ok(n); }, 1500); }));
  assert(mut === 0, `mutações parado: ${mut}`);
  // resize no meio: o trilho muda de altura (svh); a rolagem é reposta no MESMO progresso → mesma cena
  const antes = await estAnim(page);
  await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(1500);
  const depois = await estAnim(page);
  t = await posTrilho(page);
  const yAgora = await page.evaluate(() => scrollY);
  const pPos = Math.min(1, Math.max(0, (yAgora - (t.top - t.cab)) / t.curso));
  assert(Math.abs(depois.p - antes.p) < 0.01 && depois.etapa === antes.etapa && Math.abs(depois.p - pPos) < 0.003 && depois.modo === "animado", `resize: p ${antes.p}→${depois.p} (posição ${pPos.toFixed(4)}), etapa ${antes.etapa}→${depois.etapa}`);
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(1500);
  const cel = await estAnim(page);
  assert(cel.layout === "celular" && cel.etapa === antes.etapa && Math.abs(cel.p - antes.p) < 0.01, `resize 390: ${JSON.stringify({ layout: cel.layout, etapa: cel.etapa, p: cel.p })}`);
  // roda e teclado: rolagem nativa (a página anda)
  await page.setViewportSize({ width: 1440, height: 900 }); t = await posTrilho(page); await irP(page, t, 0.3);
  const y0 = await page.evaluate(() => scrollY); await page.mouse.move(900, 500); await page.mouse.wheel(0, 300); await page.waitForTimeout(400);
  const y1 = await page.evaluate(() => scrollY);
  assert(y1 - y0 > 250, `roda: ${y0} → ${y1}`);
  const k0 = (await estAnim(page)).p; await page.keyboard.press("PageDown"); await page.waitForTimeout(1300); const k1 = (await estAnim(page)).p;
  await page.keyboard.press("PageUp"); await page.waitForTimeout(1300); const k2 = (await estAnim(page)).p;
  assert(k1 > k0 && Math.abs(k2 - k0) < 0.01, `teclado: ${k0} → ${k1} → ${k2}`);
  notes.push(`    · ida/volta em 7 pontos: palco idêntico; parado 0 mutações em 1,5 s; resize 1440→1280→390: etapa ${antes.etapa}→${depois.etapa}→${cel.etapa}, p ${antes.p}→${depois.p}→${cel.p} (${cel.layout}); roda +${y1 - y0} px; PageDown/PageUp ${k0}→${k1}→${k2}`);
  await ctx.close();
});

await test("pausa no meio do percurso → roteiro na MESMA etapa; retomar → percurso na mesma etapa; movimento reduzido e sem JS → roteiro desde a 1ª pintura", async () => {
  const { ctx, page } = await open([1440, 900]);
  const t = await posTrilho(page);
  await irP(page, t, 0.52);
  const a = await estAnim(page);
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click()); await page.waitForTimeout(700);
  const b = await page.evaluate(() => { const lis = [...document.querySelectorAll("[data-fluxo=roteiro] > li")]; const cab = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72; const vis = lis.findIndex((l) => { const r = l.getBoundingClientRect(); return r.top >= cab - 2 && r.top < innerHeight / 2; }); return { vis: vis + 1, modo: document.querySelector("[data-fluxo=root]").dataset.fluxoModo, trilho: document.querySelector("[data-fluxo=trilho]").getBoundingClientRect().height }; });
  assert(b.modo === "estatico" && b.trilho === 0 && b.vis === a.etapa, `pausa: etapa ${a.etapa} → roteiro ${JSON.stringify(b)}`);
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click()); await page.waitForTimeout(1500);
  const c = await estAnim(page);
  assert(c.modo === "animado" && c.etapa === a.etapa, `retomar: ${a.etapa} → ${c.etapa} (${c.modo})`);
  await ctx.close();
  for (const o of [{ reduced: true }, { noJs: true }]) {
    const x = await open([1440, 900], { ...o, init: o.noJs ? undefined : () => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); } });
    const m = await x.page.evaluate(() => ({ trilho: document.querySelector("[data-fluxo=trilho]").getBoundingClientRect().height, roteiro: document.querySelector("[data-fluxo=roteiro]").getBoundingClientRect().height, modo: document.querySelector("[data-fluxo=root]").dataset.fluxoModo ?? null }));
    assert(m.trilho === 0 && m.roteiro > 1000, `${JSON.stringify(o)}: ${JSON.stringify(m)}`);
    await x.ctx.close();
  }
  notes.push(`    · pausa em p 0,52 (etapa ${a.etapa}) → roteiro na etapa ${b.vis}; retomada → etapa ${c.etapa}`);
});

await test("falhas: módulo indisponível, asset com erro e asset atrasado → roteiro estático ou espera sem quebrar a página", async () => {
  const sem = await open([1440, 900], { init: () => (window.__PLATAFORMA_FLUXO_TESTE__ = { url: "/refinada/plataforma-fluxo-0.1.0/nao-existe.js" }) });
  await sem.page.waitForTimeout(800);
  const s = await sem.page.evaluate(() => { const r = document.querySelector("[data-fluxo=root]"); return { modo: r.dataset.fluxoModo, falha: r.dataset.fluxoFalha, roteiro: r.querySelector("[data-fluxo=roteiro]").getBoundingClientRect().height > 0, trilho: r.querySelector("[data-fluxo=trilho]").getBoundingClientRect().height }; });
  assert(s.modo === "estatico" && s.falha === "modulo" && s.roteiro && s.trilho === 0 && !sem.errors.length, "módulo ausente: " + JSON.stringify(s) + sem.errors.join("|"));
  await sem.ctx.close();
  const err = await open([1440, 900], { route: { pattern: /plataforma-fluxo-0\.1\.0\/assets\/viewer-/, handler: (r) => r.fulfill({ status: 404, body: "" }) } });
  const t = await posTrilho(err.page);
  for (const p of [0.1, 0.3, 0.45]) await irP(err.page, t, p, 900);
  const e = await err.page.evaluate(() => { const r = document.querySelector("[data-fluxo=root]"); return { modo: r.dataset.fluxoModo, falha: r.dataset.fluxoFalha ?? null, roteiro: r.querySelector("[data-fluxo=roteiro]").getBoundingClientRect().height > 0 }; });
  assert(e.modo === "estatico" && e.falha && e.roteiro && !err.errors.length, "asset 404: " + JSON.stringify(e) + err.errors.join("|"));
  await err.ctx.close();
  const lento = await open([1440, 900], { route: { pattern: /plataforma-fluxo-0\.1\.0\/assets\//, handler: async (r) => { await new Promise((ok) => setTimeout(ok, 900)); await r.continue(); } } });
  const tl = await posTrilho(lento.page);
  await irP(lento.page, tl, 0.35, 2500);
  const l = await estAnim(lento.page);
  assert(l.modo === "animado" && l.etapa === 3 && !lento.errors.length, "asset atrasado: " + JSON.stringify({ modo: l.modo, etapa: l.etapa }));
  await lento.ctx.close();
  notes.push(`    · módulo 404 → ${s.modo}/${s.falha}; asset do Viewer 404 → ${e.modo}/${e.falha}; assets com 0,9 s de atraso → ${l.modo}, etapa ${l.etapa}`);
});

await browser.close();
console.log(results.join("\n") + "\n" + notes.join("\n"));
const ok = results.filter((r) => r.startsWith("✔")).length;
const pend = results.filter((r) => r.startsWith("⏸")).length;
console.log(`\n${ok}/${results.length - pend} aprovados${pend ? ` · ${pend} pendente(s)` : ""}`);
if (ok !== results.length - pend) process.exitCode = 1;
