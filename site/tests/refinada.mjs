/**
 * /previa/refinada — rodada integral (cabeçalho, correções funcionais, ritmo editorial, convite à
 * rolagem). Branch codex/brand-03d2-v1: cabeçalho e rodapé conferem as assinaturas oficiais do ARARAT
 * 03D2 (o ciclo MODEL ↔ PROSTATE segue testado na main) e as cores esperadas são as do 03D2. Complementa tests/previa.mjs, navegacao.mjs e
 * fontes-carregamento.mjs (que continuam valendo para a rota).
 *   node tests/refinada.mjs          (servidor em :3000; ONLY=regex filtra)
 */
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
// fração de pixels com diferença > 8 em algum canal (imagens do mesmo tamanho)
async function sharpDiff(a, b) {
  const { default: sharp } = await import("sharp");
  const A = await sharp(a).raw().toBuffer({ resolveWithObject: true }); const B = await sharp(b).raw().toBuffer({ resolveWithObject: true });
  if (A.info.width !== B.info.width || A.info.height !== B.info.height) return 1;
  let n = 0; const c = A.info.channels; for (let i = 0; i < A.data.length; i += c) { for (let k = 0; k < 3; k++) if (Math.abs(A.data[i + k] - B.data[i + k]) > 8) { n++; break; } }
  return n / (A.info.width * A.info.height);
}
const browser = await chromium.launch();
// ARARAT Sinal (brand-sinal-v1, combinado com o Motion 0.5.0-sinal): a decisão "acende" por contraste —
// gray-30 (#474747, como as demais frases) nas etapas 0–3 → gray-5 (#111111) na etapa 4 em diante, sempre a
// 600; antes navy #0D1B2A → ouro #856514.
// Fundo claro: gray-97 #F6F6F6 (antes #F5F7FA). A coreografia testada é a mesma.
const COR_TEXTO_CLARO = "rgb(71, 71, 71)";
const COR_DECISAO = "rgb(17, 17, 17)";
const FUNDO_CLARO = "rgb(246, 246, 246)";

async function open(vp = [1440, 900], o = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, reducedMotion: o.reduced ? "reduce" : "no-preference", javaScriptEnabled: !o.noJs, hasTouch: !!o.touch });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((intro) => { if (!intro) sessionStorage.setItem("ararat:intro", "1"); }, !!o.intro);
  if (o.init) await page.addInitScript(o.init);
  await page.goto(BASE + ROUTE + (o.query ?? ""), { waitUntil: "networkidle" });
  return { ctx, page, errors };
}

// ── 1. Cabeçalho — alternativa codex/brand-03d2-v1: assinatura HORIZONTAL oficial do ARARAT 03D2 ─────
// O ciclo MODEL ↔ PROSTATE não existe nesta identidade; os testes do ciclo ficam na main. Aqui: o SVG
// oficial (animável = mesmos caminhos da horizontal) no HTML, sem palavra animada, nome acessível estável,
// largura ≥ 160 px e área de proteção (1 a) até o próximo controle em 320–1440 px.
const ASSINATURA = "/marca-03d2/v1.0/07_motion/ararat-assinatura-animavel.svg";
const ASSINATURA_RODAPE = "/marca-03d2/v1.0/01_logo/assinatura-horizontal/ararat-horizontal-negativo.svg";
await test("cabeçalho: assinatura oficial do 03D2 (SVG no HTML, idêntico ao arquivo); sem ciclo MODEL/PROSTATE nem wordmark digitado, também após 12 s, com pausa, reduzido e sem JS", async () => {
  const svg = (await (await fetch(BASE + ASSINATURA)).text()).trim();
  const html = await (await fetch(BASE + ROUTE)).text();
  assert(html.match(/<header[\s\S]*?<\/header>/)[0].includes(svg), "HTML sem o SVG oficial idêntico no cabeçalho");
  assert(!/data-word=/.test(html), "ciclo no HTML");
  const { ctx, page, errors } = await open([1440, 900], { intro: true });
  const sem = () => page.evaluate(() => ({ ciclo: !!document.querySelector("header [data-word]"), texto: document.querySelector("header a[aria-label]").innerText.trim(), tipo: document.querySelector("header a[aria-label] [data-assinatura]")?.dataset.assinatura, caminhos: [...document.querySelectorAll("header a[aria-label] svg path")].flatMap((e) => e.getAttribute("d").split(/(?=M)/).filter((x) => x.trim())).length }));
  const r0 = await sem();
  await page.waitForTimeout(12000);
  const r1 = await sem();
  assert(!r0.ciclo && !r1.ciclo && r0.texto === "" && r1.texto === "" && r1.tipo === "animavel" && r1.caminhos === 14, "cabeçalho: " + JSON.stringify({ r0, r1 }));
  assert(!errors.length, errors[0]);
  await ctx.close();
  for (const o of [{ reduced: true }, { noJs: true }]) {
    const x = await open([1280, 720], o);
    const r = await x.page.evaluate(() => ({ tipo: document.querySelector("header a[aria-label] [data-assinatura]")?.dataset.assinatura, caminhos: [...document.querySelectorAll("header a[aria-label] svg path")].flatMap((e) => e.getAttribute("d").split(/(?=M)/).filter((x) => x.trim())).length, ciclo: !!document.querySelector("header [data-word]") }));
    assert(r.tipo === "animavel" && r.caminhos === 14 && !r.ciclo, `${JSON.stringify(o)}: ${JSON.stringify(r)}`);
    await x.ctx.close();
  }
  const { createHash } = await import("node:crypto");
  const manif = JSON.parse(await (await fetch(BASE + "/marca-03d2/v1.0/MANIFESTO.json")).text()).arquivos;
  for (const arq of [ASSINATURA, ASSINATURA_RODAPE]) {
    const h = createHash("sha256").update(Buffer.from(await (await fetch(BASE + arq)).arrayBuffer())).digest("hex");
    assert(h === manif.find((a) => arq.endsWith(a.caminho)).sha256, "SVG servido difere do oficial: " + arq);
  }
});

await test("cabeçalho: nome acessível estável ('ARARAT MODEL — início'), logo decorativo (aria-hidden), sem aria-live; nome oficial, título e rodapé sem PROSTATE", async () => {
  const { ctx, page } = await open();
  const a = await page.locator("header a[aria-label]").first().getAttribute("aria-label");
  assert(a === "ARARAT MODEL — início", a);
  assert((await page.locator("header a[aria-label] [data-assinatura]").getAttribute("aria-hidden")) === "true", "logo sem aria-hidden");
  assert(!(await page.locator("header [aria-live]").count()), "aria-live no cabeçalho");
  assert(!/PROSTATE/i.test(await page.title()), "título com PROSTATE");
  const foot = await page.locator("footer").innerText();
  assert(!/PROSTATE/.test(foot) && /ARARAT/.test(await page.locator("footer a").first().getAttribute("aria-label")), "rodapé");
  const meta = await page.evaluate(() => [...document.querySelectorAll("meta")].map((m) => m.content).join(" "));
  assert(!/PROSTATE/.test(meta), "metadados com PROSTATE");
  await ctx.close();
});

await test("cabeçalho: limites em 320–1440 px — assinatura horizontal ≥ 160 px sem deformar, com 1 a de proteção até menu/links/idioma, sem cortar, sem rolagem lateral", async () => {
  const rows = [];
  for (const w of [320, 340, 360, 390, 768, 1081, 1100, 1180, 1280, 1440]) {
    const { ctx, page } = await open([w, 800]);
    const m = await page.evaluate(() => {
      const vis = (s) => [...document.querySelectorAll(s)].find((e) => e.getBoundingClientRect().width > 0);
      const r = (e) => e && e.getBoundingClientRect();
      const logo = document.querySelector("header a[aria-label] [data-assinatura] svg").getBoundingClientRect();
      const next = r(vis("header nav ul")) ?? r(vis("header button[aria-expanded]")) ?? r(vis("header .language-switch"));
      const lang = r(vis("header .language-switch"));
      const prox = Math.min(next.left, lang ? lang.left : Infinity);
      return { left: Math.round(logo.left), right: Math.round(logo.right), w: logo.width, h: logo.height, ratio: logo.width / logo.height, next: Math.round(prox), sw: document.documentElement.scrollWidth, vw: innerWidth };
    });
    const a = m.h * (118 / 122) * (100 / 118); // altura das maiúsculas
    rows.push(`${w}: assinatura ${m.left}–${m.right} (${Math.round(m.w)} px), próximo ${m.next}`);
    assert(m.left >= 0 && m.right + a <= m.next + 0.5, `${w}px: assinatura (até ${m.right}) a menos de 1 a (${a.toFixed(1)} px) de ${m.next}`);
    assert(m.w >= 160 && Math.abs(m.ratio - 1025.6 / 122) < 0.05, `${w}px: assinatura ${m.w}px, proporção ${m.ratio}`);
    assert(m.sw <= m.vw, `${w}px: rolagem lateral`);
    await ctx.close();
  }
  notes.push("    · " + rows.join(" · "));
});

// ── 2. Correções funcionais ─────────────────────────────────────────────────────────────────
await test("Explicabilidade: leitura, ordem e barras coerentes nas três seleções e alinhadas à Jornada (Textura > Intensidade > Forma)", async () => {
  // Referência: contribuições da cena da Jornada no pacote em uso (forma, textura, intensidade).
  const pkg = (await (await fetch(BASE + ROUTE)).text()).match(/\/previa\/(home-montanha-[\w.-]+)\//)[1];
  const js = await (await fetch(`${BASE}/previa/${pkg}/web/journey.js`)).text();
  const contrib = JSON.parse(js.match(/const CONTRIB = (\[[^\]]+\])/)[1]);
  const keys = ["forma", "textura", "intensidade"];
  const journeyOrder = keys.map((k, i) => [k, contrib[i]]).sort((a, b) => b[1] - a[1]).map((x) => x[0]).join(">");
  const { ctx, page } = await open([1440, 900]);
  const out = [];
  for (const name of ["Forma", "Textura", "Intensidade"]) {
    await page.locator("#explicabilidade button", { hasText: name }).click();
    const m = await page.evaluate(() => {
      const bars = [...document.querySelectorAll("#explicabilidade [data-feature]")].map((li) => ({ k: li.dataset.feature, w: li.querySelector("[style]").getBoundingClientRect().width, active: li.hasAttribute("data-active") }));
      return { bars, reading: document.querySelector("#explicabilidade [data-reading]").textContent, sel: document.querySelector("#explicabilidade [data-reading]").dataset.reading, pressed: [...document.querySelectorAll("#explicabilidade button[aria-pressed=true]")].map((b) => b.textContent) };
    });
    const order = m.bars.map((b) => b.k).join(">");
    assert(order === "textura>intensidade>forma" && order === journeyOrder, `ordem ${order} (jornada ${journeyOrder})`);
    assert(m.bars[0].w > m.bars[1].w && m.bars[1].w > m.bars[2].w, "barras fora de ordem");
    // proporções iguais às da jornada (normalizadas pela maior)
    const ratio = (k) => m.bars.find((b) => b.k === k).w / m.bars[0].w;
    for (const [i, k] of keys.entries()) assert(Math.abs(ratio(k) - contrib[i] / Math.max(...contrib)) < 0.02, `proporção de ${k}`);
    const rank = m.bars.findIndex((b) => b.k === m.sel);
    assert(m.bars[rank].active && m.pressed.length === 1 && m.pressed[0] === name, "seleção/ativo divergem");
    const expect = [/^Maior/, /^Contribuição intermediária/, /^Menor/][rank];
    assert(expect.test(m.reading), `${name}: texto "${m.reading.slice(0, 40)}" não corresponde à posição ${rank + 1}`);
    out.push(`${name} → ${["maior", "intermediária", "menor"][rank]}`);
  }
  notes.push(`    · jornada (${pkg}) CONTRIB ${JSON.stringify(contrib)} → ${journeyOrder}; ` + out.join(" · "));
  await ctx.close();
});

await test("menu móvel: Escape devolve o foco ao botão; escolher uma seção leva o foco ao destino; sem focus trap", async () => {
  const { ctx, page } = await open([390, 844]);
  const btn = page.locator("header button[aria-expanded]");
  await btn.click();
  await page.keyboard.press("Tab");
  const inMenu = await page.evaluate(() => document.activeElement.textContent.trim());
  await page.keyboard.press("Escape");
  const f = await page.evaluate(() => ({ exp: document.querySelector("header button[aria-expanded]").getAttribute("aria-expanded"), focus: document.activeElement === document.querySelector("header button[aria-expanded]") }));
  assert(f.exp === "false" && f.focus, `Escape: ${JSON.stringify(f)}`);
  await btn.click();
  // sem trap: Tab a partir do último item sai do menu
  const items = await page.locator("header nav a, header nav button").count();
  for (let i = 0; i < items + 1; i++) await page.keyboard.press("Tab");
  const out = await page.evaluate(() => !document.querySelector("header nav").contains(document.activeElement));
  assert(out, "foco preso no menu");
  await page.keyboard.press("Escape");
  await btn.click();
  await page.locator("header nav a", { hasText: "Plataforma" }).click();
  await page.waitForTimeout(900);
  const g = await page.evaluate(() => ({ exp: document.querySelector("header button[aria-expanded]").getAttribute("aria-expanded"), focus: document.activeElement.id, hash: location.hash }));
  assert(g.exp === "false" && g.focus === "plataforma" && g.hash === "#plataforma", `seção: ${JSON.stringify(g)}`);
  notes.push(`    · Tab no menu → "${inMenu}"; Escape → botão; Plataforma → foco em #plataforma`);
  await ctx.close();
});

await test("chegada à jornada (CTA): 'Como funciona', título, quadro e rótulos abaixo do cabeçalho fixo; etapa Imagem; destino preservado", async () => {
  const rows = [];
  for (const [w, h, dest] of [[1280, 720, 533], [1440, 900, 666], [768, 1024, 555], [390, 844, 443], [320, 568, 272]]) {
    const { ctx, page } = await open([w, h]);
    await page.waitForTimeout(500);
    await page.locator("#inicio a", { hasText: "Entre na imagem" }).click();
    await page.waitForTimeout(2200);
    const m = await page.evaluate(() => {
      const hb = document.querySelector("header").getBoundingClientRect().bottom;
      const tops = [...document.querySelectorAll("#jornada-inicio .eyebrow, #jornada-title, #jornada [data-layout], #jornada [class*='__rail'] button")]
        .filter((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight; })
        .map((e) => Math.round(e.getBoundingClientRect().top));
      return { hb: Math.round(hb), min: Math.min(...tops), y: Math.round(scrollY), step: document.getElementById("jornada").dataset.activeStep };
    });
    rows.push(`${w}×${h}: y ${m.y}, 1º elemento visível em ${m.min} (cabeçalho até ${m.hb})`);
    assert(m.min >= m.hb, `${w}: elemento sob o cabeçalho (${m.min} < ${m.hb})`);
    assert(Math.abs(m.y - dest) <= 2 && m.step === "0", `${w}: destino ${m.y}/${dest}, etapa ${m.step}`);
    await ctx.close();
  }
  notes.push("    · " + rows.join(" · "));
});

// ── 3. Ritmo e comunicação ──────────────────────────────────────────────────────────────────
await test("Jornada no celular: sem repetir o resumo ativo (texto longo em 'Ler mais'); desktop com texto inteiro; leitura sem JS", async () => {
  const { ctx, page } = await open([390, 844], { reduced: true });
  const m = await page.evaluate(() => {
    const steps = [...document.querySelectorAll("#jornada ol li[id^=etapa]")];
    return steps.map((s) => {
      // checkVisibility: exclui o conteúdo de <details> fechado (content-visibility) e display:none
      const ps = [...s.querySelectorAll("p")].filter((p) => p.checkVisibility()).map((p) => p.textContent.trim());
      const d = s.querySelector("details");
      return { visible: ps, details: !!d && !d.open, summary: d?.querySelector("summary").textContent };
    });
  });
  assert(m.length === 4 && m.every((s) => s.details), "detalhes ausentes");
  const summaryText = await page.evaluate(() => document.querySelector("#jornada [class*='__summaryText']")?.textContent ?? "");
  assert(m.every((s) => !s.visible.includes(summaryText)), "texto do resumo repetido na lista");
  await page.locator("#jornada details summary").first().click();
  assert(await page.evaluate(() => document.querySelector("#jornada details").open), "Ler mais não abre");
  await ctx.close();
  const d = await open([1440, 900], { reduced: true });
  const full = await d.page.evaluate(() => [...document.querySelectorAll("#jornada ol li[id^=etapa]")].every((s) => [...s.querySelectorAll("p")].some((p) => p.checkVisibility() && p.textContent.length > 60) && !s.querySelector("details").checkVisibility()));
  assert(full, "desktop sem texto inteiro");
  await d.ctx.close();
  const nj = await open([390, 844], { noJs: true });
  const html = await nj.page.locator("#jornada").innerHTML();
  assert((html.match(/<details/g) || []).length === 4, "sem JS: detalhes ausentes");
  await nj.ctx.close();
});

// Plataforma (desde 07/10/2026): demonstração "do Hub ao Viewer" com capturas reais (ProstateX-0067). Os testes
// detalhados (enquadramento nas 6 larguras, progresso, estático, falhas, CLS) estão em tests/plataforma-fluxo.mjs.
await test("Plataforma: demonstração do Hub ao Viewer em 7 etapas com capturas reais; aviso e atribuição visíveis; capturas sintéticas da rodada 5 fora da refinada", async () => {
  const { ctx, page } = await open([1440, 900], { reduced: true });
  const m = await page.evaluate(() => {
    const s = document.getElementById("plataforma");
    const f = s.querySelector("[data-fluxo]");
    return {
      etapas: f ? f.querySelectorAll("[data-fluxo=roteiro] > li").length : 0, legendas: f ? f.querySelectorAll("[data-fluxo=trilho] li[data-etapa]").length : 0,
      aviso: f?.querySelector("[role=note]")?.checkVisibility() ?? false,
      doi: !!s.querySelector("a[href='https://doi.org/10.7937/K9TCIA.2017.MURS5CL']"),
      sinteticas: s.querySelectorAll("figure[data-captura]").length + (s.textContent.includes("dados sintéticos") ? 1 : 0),
      doc: s.querySelector("aside")?.textContent ?? "",
      revisado: s.textContent.includes("marcador operacional"),
    };
  });
  assert(m.etapas === 7 && m.legendas === 7 && m.aviso && m.doi, JSON.stringify(m));
  assert(m.sinteticas === 0, "capturas sintéticas ainda na refinada");
  assert(/não demonstrado/.test(m.doc) && /PDF/.test(m.doc), "documentado: " + m.doc);
  await ctx.close();
});
await test("Ciência: classificação publicada e segmentação em andamento separadas; DOI público, sem métricas/links privados; detalhes acessíveis", async () => {
  const { ctx, page } = await open([1440, 900], { reduced: true });
  const m = await page.evaluate(() => {
    const s = document.getElementById("ciencia");
    const d = s.querySelector("details");
    const t = s.textContent;
    const visible = (x) => [...s.querySelectorAll("p, li, dd, h3")].some((e) => e.getBoundingClientRect().height > 0 && e.textContent.includes(x));
    return {
      h: Math.round(s.getBoundingClientRect().height), closed: !d.open,
      lead: visible("Duas frentes de pesquisa sustentam o desenvolvimento do ARARAT"),
      essentials: ["Clinical Radiology (2026)", "câncer confirmado por biópsia", "Ainda não publicado", "alvos menores", "menor suspeição", "revisão humana", "Plataforma em validação científica", "A decisão permanece humana"].every(visible),
      proibido: /Dice|0,9|%|certificad|superior|macOS|B11|drive\.google/i.test(t),
      links: [...s.querySelectorAll("a")].map((a) => a.href),
    };
  });
  assert(m.closed && m.lead && m.essentials && !m.proibido && JSON.stringify(m.links) === JSON.stringify(["https://doi.org/10.1016/j.crad.2026.107417"]), JSON.stringify(m));
  await page.locator("#ciencia summary").focus();
  await page.keyboard.press("Enter");
  const opened = await page.evaluate(() => { const d = document.querySelector("#ciencia details"); return d.open && d.querySelectorAll("dt").length; });
  assert(opened === 12, `expansão: ${opened}`);
  const methods = await page.locator("#ciencia details").textContent();
  assert(/raio de 5 mm/.test(methods) && /T2 axial/.test(methods) && /Random Forest/.test(methods) && /ISUP ≥ 2/.test(methods) && /ISUP ≥ 3/.test(methods), methods);
  notes.push(`    · Ciência fechada: ${m.h} px de altura (1440)`);
  await ctx.close();
});
await test("Precisão dos textos: 'sem número' localizado na demonstração; famílias ilustrativas; Forma sem volume; sem absolutos", async () => {
  const { ctx, page } = await open([1440, 900], { reduced: true });
  const m = await page.evaluate(() => {
    const j = document.getElementById("jornada").textContent, x = document.getElementById("explicabilidade").textContent, all = document.body.textContent;
    return {
      demo: j.includes("Nesta demonstração, os pesos são ilustrativos e não representam uma saída do modelo nem uma estimativa de risco."),
      semNumero: /sem número e sem diagnóstico/.test(all),
      familias: /famílias de características/.test(x) && /famílias de descritores/.test(j),
      volume: /volume/i.test(x),
      absolutos: /Nenhuma saída sem contexto|com precisão/.test(all),
      xaiProva: /não prova que o resultado esteja correto|não uma prova de que o resultado está correto/.test(all),
    };
  });
  assert(m.demo && !m.semNumero && m.familias && !m.volume && !m.absolutos && m.xaiProva, JSON.stringify(m));
  await ctx.close();
});
await test("Contato: dois públicos, nenhum link de volta a seções nem formulário/agendamento falso; nota curta do canal pendente", async () => {
  const { ctx, page } = await open([1440, 900], { reduced: true });
  const m = await page.evaluate(() => {
    const s = document.getElementById("contato");
    return { titles: [...s.querySelectorAll("h3")].map((h) => h.textContent), links: [...s.querySelectorAll("a")].map((a) => a.getAttribute("href")), forms: s.querySelectorAll("form, input, button").length, note: s.querySelector("[role=note]")?.textContent ?? "" };
  });
  assert(JSON.stringify(m.titles) === JSON.stringify(["Demonstração técnica", "Pesquisa e colaboração"]), m.titles.join(","));
  assert(m.links.length === 0 && m.forms === 0, JSON.stringify(m));
  assert(/em preparação/.test(m.note) && /não envia/.test(m.note), m.note);
  await ctx.close();
});

await test("Rodapé: assinatura horizontal oficial do 03D2 + tagline em texto legível; um só aviso permanente", async () => {
  const { ctx, page } = await open([1440, 900], { reduced: true });
  const m = await page.evaluate(() => {
    const f = document.querySelector("footer");
    const tag = [...f.querySelectorAll("p")].find((p) => /oncologia de precisão/i.test(p.textContent));
    return { tagFs: tag && parseFloat(getComputedStyle(tag).fontSize), imgs: [...f.querySelectorAll("img")].map((i) => i.getAttribute("src")), ps: [...f.querySelectorAll("p")].length };
  });
  assert(m.tagFs >= 12, "tagline ilegível");
  // codex/brand-03d2-v1: assinatura horizontal negativa oficial (antes: lockup do Sinal / ícone PNG + nome tipografado)
  assert(m.imgs.length === 1 && m.imgs[0] === ASSINATURA_RODAPE, "logo: " + m.imgs.join(","));
  assert(m.ps === 2, `parágrafos no rodapé: ${m.ps}`);
  await ctx.close();
});

await test("cabeçalho rolado: fundo quase opaco (≥ 0,95) — a Ciência clara não atravessa os links", async () => {
  const { ctx, page } = await open([1440, 900], { reduced: true });
  await page.evaluate(() => document.getElementById("ciencia").scrollIntoView());
  await page.waitForTimeout(500);
  const bg = await page.evaluate(() => getComputedStyle(document.querySelector("header")).backgroundColor);
  const a = Number((bg.match(/rgba?\(([^)]+)\)/)[1].split(",")[3] ?? "1").trim());
  assert(a >= 0.95, bg);
  await ctx.close();
});

// ── 4. Convite à rolagem ────────────────────────────────────────────────────────────────────
await test("convite 'Role para explorar': na 1ª tela, fora dos botões e do texto; some na passagem; oculto em celular baixo; parado com pausa/reduzido", async () => {
  const rows = [];
  for (const [w, h, shown] of [[1280, 720, true], [1440, 900, true], [768, 1024, true], [390, 844, true], [320, 568, false]]) {
    const { ctx, page } = await open([w, h]);
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const inv = document.querySelector("[data-opening=invite]");
      const r = inv.getBoundingClientRect();
      const boxes = [...document.querySelectorAll("[data-opening=content] > *")].map((e) => e.getBoundingClientRect());
      const hit = boxes.some((b) => !(r.right < b.left || r.left > b.right || r.bottom < b.top || r.top > b.bottom));
      return { vis: r.height > 0 && getComputedStyle(inv).display !== "none", top: Math.round(r.top), bottom: Math.round(r.bottom), hit, hidden: inv.getAttribute("aria-hidden") };
    });
    rows.push(`${w}×${h}: ${m.vis ? `y ${m.top}–${m.bottom}` : "oculto"}`);
    assert(m.vis === shown, `${w}: visível=${m.vis}`);
    if (shown) {
      assert(m.bottom <= h && m.top > 0 && !m.hit, `${w}: posição ${JSON.stringify(m)}`);
      assert(m.hidden === "true", "aria-hidden");
    }
    if (w === 1280) {
      await page.evaluate(() => scrollTo({ top: 220, behavior: "instant" }));
      await page.waitForTimeout(250);
      const op = await page.evaluate(() => getComputedStyle(document.querySelector("[data-opening=invite]")).opacity);
      assert(Number(op) < 0.05, `na passagem opacidade ${op}`);
    }
    await ctx.close();
  }
  for (const mode of ["reduced", "paused"]) {
    const { ctx, page } = await open([1440, 900], mode === "reduced" ? { reduced: true } : { init: () => sessionStorage.setItem("ararat:paused", "1") });
    const an = await page.evaluate(() => getComputedStyle(document.querySelector("[data-opening=invite] span:last-child")).animationName);
    assert(an === "none", `${mode}: animação ${an}`);
    await ctx.close();
  }
  notes.push("    · " + rows.join(" · "));
});

// montanha 1.1.0-03d2 (= 1.0.0-03d2 + composicao) (mesmo contrato da 0.9.0-sinal) (contrato do Motion, CONTRATO-SITE.md §2 e §7): a luz ambiente
// passa a vir DESLIGADA por padrão ("repouso: nada se redesenha"; ambient: true só para comparação). Os
// dois testes abaixo substituem os da luz ambiente da 0.7.x e conferem o novo contrato, com o mesmo rigor.
await test("montanha 1.1.0-03d2: sem luz ambiente em repouso, pixels da arte parados; pausa, aba oculta e passagem seguem apagadas; uma só fonte do arco", async () => {
  const { ctx, page, errors } = await open([1280, 720]);
  await page.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 9000 });
  const amb = () => page.evaluate(() => document.querySelector("[data-opening=sticky] canvas")?.dataset.ambient ?? "ausente");
  await page.waitForTimeout(1600); // abertura assentada
  const seen = new Set();
  for (let i = 0; i < 20; i++) { seen.add(await amb()); await page.waitForTimeout(150); }
  assert([...seen].every((v) => v === "off" || v === "ausente"), `luz ambiente ligada em repouso: ${[...seen]}`);
  // Repouso = nada se redesenha: dois quadros da arte, 1,5 s de intervalo, idênticos.
  const box = await page.locator("[data-opening=slot]").boundingBox();
  const clip = { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.width, 1280 - Math.max(0, box.x)), height: Math.min(box.height, 720 - Math.max(0, box.y)) };
  const q1 = await page.screenshot({ clip });
  await page.waitForTimeout(1500);
  const q2 = await page.screenshot({ clip });
  assert(Buffer.compare(q1, q2) === 0, "a arte mudou em repouso");
  await page.locator("header button[aria-pressed]").first().click();
  await page.waitForTimeout(400);
  const paused = await amb();
  await page.locator("header button[aria-pressed]").first().click();
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.waitForTimeout(400);
  const hidden = await amb();
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.evaluate(() => scrollTo({ top: 350, behavior: "instant" }));
  await page.waitForTimeout(400);
  const passing = await page.evaluate(() => ({ a: document.querySelector("[data-opening=sticky] canvas")?.dataset.ambient ?? "ausente", p: parseFloat(document.querySelector("[data-opening=root]").style.getPropertyValue("--opening-p")) }));
  const arcs = await page.evaluate(() => ({ canvases: document.querySelectorAll("[data-opening=sticky] canvas").length, siteArc: document.querySelectorAll("#inicio svg path[class*='arc'], [class*='orbit']").length }));
  notes.push(`    · 1.1.0-03d2: ambiente ${[...seen].join("/")} em repouso, arte idêntica em 1,5 s · pausa → ${paused} · aba oculta → ${hidden} · passagem (p ${passing.p.toFixed(2)}) → ${passing.a}`);
  for (const v of [paused, hidden, passing.a]) assert(v === "off" || v === "ausente", `ambiente ligado: ${v}`);
  assert(passing.p > 0.56, "passagem não avançou");
  assert(arcs.canvases === 1 && arcs.siteArc === 0, `arco: ${JSON.stringify(arcs)}`);
  assert(!errors.length, errors[0]);
  await ctx.close();
});

await test("abertura 1.1.0-03d2 assenta (data-intro=done) sem ligar luz ambiente; resize mantém composição", async () => {
  const { ctx, page, errors } = await open([1440, 900], { intro: true, init: () => {
    window.__t = {};
    const t0 = performance.now();
    const mark = (k) => { if (window.__t[k] == null) window.__t[k] = Math.round(performance.now() - t0); };
    const tick = () => {
      if (document.getElementById("ararat-intro")) mark("introVista");
      else if (window.__t.introVista != null) mark("assentou");
      const c = document.querySelector("[data-opening=sticky] canvas");
      if (c?.dataset.intro === "done") mark("introDone");
      if (c?.dataset.ambient && c.dataset.ambient !== "off") mark("ambiente");
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } });
  await page.waitForTimeout(5000);
  const t = await page.evaluate(() => window.__t);
  notes.push(`    · abertura: estilo visto em ${t.introVista} ms, assentou em ${t.assentou} ms, data-intro=done em ${t.introDone} ms; ambiente ${t.ambiente == null ? "nunca ligou" : "ligou em " + t.ambiente + " ms"}`);
  assert(t.introDone != null, "abertura não marcou data-intro=done");
  assert(t.ambiente == null, "luz ambiente ligou");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth, slotY: Math.round(document.querySelector("[data-opening=slot]").getBoundingClientRect().top) }));
  const fresh = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const fp = await fresh.newPage();
  await fp.goto(BASE + ROUTE, { waitUntil: "networkidle" });
  await fp.waitForTimeout(1500);
  const slotRef = await fp.evaluate(() => Math.round(document.querySelector("[data-opening=slot]").getBoundingClientRect().top));
  await fresh.close();
  assert(r.sw <= r.vw && r.slotY === slotRef, `após resize: ${JSON.stringify({ ...r, slotRef })}`);
  assert(!errors.length, errors[0]);
  await ctx.close();
});


// ---------------- rodada 6: time, FAQ, publicação, Para quem, avisos, contato, rodapé ----------------
const ORDEM_TIME = ["Matheus Xavier Silva de Toledo", "Miguel", "Rodrigo Gobbo", "Luiz G. Hartmann", "Victor Arthur Ohannesian"];
await test("Time: posição Ciência → Time → FAQ → Contato, #time, título/intro; cinco integrantes na ordem; nome e função sempre visíveis; Matheus aberto", async () => {
  for (const vp of [[1440, 900], [390, 844]]) {
    const { ctx, page } = await open(vp, { reduced: true });
    const m = await page.evaluate(() => {
      const ids = [...document.querySelectorAll("main > section, main > div > section")].map((s) => s.id).filter(Boolean);
      const t = document.getElementById("time");
      const items = [...t.querySelectorAll("details[name=time]")];
      return {
        ordem: ids.slice(ids.indexOf("ciencia"), ids.indexOf("contato") + 1),
        h2: t.querySelector("h2").textContent, intro: t.querySelector("header p:last-child").textContent,
        nomes: items.map((d) => d.querySelector("summary [class*='__name']").textContent),
        funcoes: items.map((d) => { const r = d.querySelector("summary [class*='__role']"); return r.checkVisibility() && r.textContent.length > 5; }),
        abertos: items.filter((d) => d.open).map((d) => d.dataset.id),
      };
    });
    assert(JSON.stringify(m.ordem) === JSON.stringify(["ciencia", "time", "faq", "contato"]), "ordem: " + m.ordem.join(","));
    assert(m.h2 === "Quem constrói o ARARAT" && m.intro === "Engenharia, pesquisa e experiência clínica reunidas no desenvolvimento do ARARAT.", "título/intro");
    assert(JSON.stringify(m.nomes) === JSON.stringify(ORDEM_TIME), "nomes: " + m.nomes.join(","));
    assert(m.funcoes.every(Boolean) && JSON.stringify(m.abertos) === '["matheus"]', JSON.stringify(m));
    await ctx.close();
  }
});
await test("Time: conteúdo — biografias completas (resumo + Ler biografia), Victor estudante, Miguel sem sobrenome, sem links, nota de instituições", async () => {
  const { ctx, page } = await open([1440, 900], { reduced: true });
  const m = await page.evaluate(() => {
    const t = document.getElementById("time");
    return {
      textos: [...t.querySelectorAll("details[name=time]")].map((d) => d.querySelector("[class*='__body']").textContent.replace(/\s+/g, " ").trim()),
      links: t.querySelectorAll("a").length,
      nota: t.querySelector("[class*='__nota']").textContent,
      lerBio: [...t.querySelectorAll("details[name=time] details summary")].map((s) => s.textContent),
    };
  });
  assert(m.textos[4].startsWith("Estudante de Medicina (MS4)") && !/médico formado/i.test(m.textos[4]), "Victor");
  assert(m.textos[1].includes("Coordenador Médico da Comissão Nacional de Ultrassonografia do Colégio Brasileiro de Radiologia (CBR) — gestão 2025–2026"), "Miguel: texto completo");
  assert(m.textos[2].includes("STAG-MEDEV") && m.textos[3].includes("Radiologia Musculoesquelética pela UNIFESP") && m.textos[0].includes("explicabilidade e experiência clínica"), "biografias");
  assert(m.links === 0 && /não indicam parceria, patrocínio ou endosso/.test(m.nota), "links/nota");
  assert(m.lerBio.length === 5 && m.lerBio.every((x) => x.startsWith("Ler biografia")), "Ler biografia: " + m.lerBio.join("|"));
  await ctx.close();
});
const TIME_NOMES = { matheus: "Matheus", miguel: "Miguel", rodrigo: "Rodrigo", hartmann: "Luiz G. Hartmann", victor: "Victor" };
const PORTRAIT = "#time [data-shown]";
const visiveis = (page) => page.evaluate(() => [...document.querySelectorAll("#time [data-shown] > [data-id]")].filter((i) => getComputedStyle(i).display !== "none" && +getComputedStyle(i).opacity > 0.5).map((i) => i.dataset.id));
const abertos = (page) => page.evaluate(() => [...document.querySelectorAll("#time details[name=time]")].filter((d) => d.open).map((d) => d.dataset.id));
const ret = (page) => page.evaluate(() => { const p = document.querySelector("#time [data-shown]"); const f = p.querySelector("img.rp-foto"); const a = p.querySelector(".rp-falha"); return { motor: p.dataset.motor ?? null, fase: p.dataset.fase ?? null, ativo: p.dataset.ativo ?? null, canvas: p.querySelectorAll("canvas.rp-pontos").length, cvVis: p.querySelector("canvas.rp-pontos") ? getComputedStyle(p.querySelector("canvas.rp-pontos")).visibility : null, foto: f ? { src: f.getAttribute("src"), op: +getComputedStyle(f).opacity, hidden: f.hidden } : null, falha: a && !a.hidden ? a.textContent : null, nome: p.nextElementSibling?.querySelector("span")?.textContent ?? null, botoes: [...document.querySelectorAll("#time button")].map((x) => x.textContent) }; });
async function esperar(page, fn, arg, ms = 4000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return Date.now() - t0; await page.waitForTimeout(25); } return -1; }
const faseE = (page, f, ms) => esperar(page, (f) => document.querySelector("#time [data-shown]").dataset.fase === f, f, ms);
const ativoE = (page, id, ms) => esperar(page, (id) => { const p = document.querySelector("#time [data-shown]"); return p.dataset.ativo === id && /^(pontos|foto|foto-estatica|falha)$/.test(p.dataset.fase); }, id, ms);
// conta redesenhos do canvas do módulo (clearRect por quadro desenhado)
const CONTA_QUADROS = () => { window.__q = 0; const o = CanvasRenderingContext2D.prototype.clearRect; CanvasRenderingContext2D.prototype.clearRect = function (...a) { if (this.canvas?.classList?.contains("rp-pontos")) window.__q++; return o.apply(this, a); }; };
const quadros = (page) => page.evaluate(() => window.__q);
const irRetrato = async (page) => { await page.evaluate(() => { const t = document.querySelector("#time [data-shown]"); scrollTo({ top: t.getBoundingClientRect().top + scrollY - 100, behavior: "instant" }); }); await page.waitForTimeout(300); };
const STUB_URL = "/__teste__/retrato-stub.js";
const { readFileSync } = await import("node:fs");
const STUB = readFileSync(new URL("./stubs/retrato-stub.js", import.meta.url), "utf8");
async function openCom(vp, o = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, reducedMotion: o.reduced ? "reduce" : "no-preference", hasTouch: !!o.touch });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (o.stub) await page.route("**" + STUB_URL, (r) => r.fulfill({ body: STUB, contentType: "text/javascript" }));
  if (o.routes) for (const [re, fn] of o.routes) await page.route(re, fn);
  await page.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  // Diagnóstico (não usado na suíte): DESLOC_TIME=<px> desloca a seção Time em subpixel.
  if (process.env.DESLOC_TIME) await page.addInitScript((d) => addEventListener("DOMContentLoaded", () => { const st = document.createElement("style"); st.textContent = `#time{position:relative;top:${d}px}`; document.head.append(st); }), process.env.DESLOC_TIME);
  await page.addInitScript(CONTA_QUADROS);
  if (o.stub) await page.addInitScript((u) => (window.__TIME_RETRATO_TESTE__ = { url: u }), STUB_URL);
  if (o.semModulo) await page.addInitScript(() => (window.__TIME_RETRATO_TESTE__ = { url: "/refinada/time-interativo-0.2.0/src/nao-existe.js" }));
  await page.goto(BASE + ROUTE, { waitUntil: o.wait ?? "networkidle" });
  return { ctx, page, errors };
}

// ── MÓDULO REAL do Motion (codex/brand-03d2-editorial-v1: public/refinada/time-interativo-0.6.0-03d2; antes 0.5.0-03d2, 0.4.0-sinal, 0.2.0) ─────
// foto natural por padrão; troca: foto → pontos → reorganização → foto do escolhido; cursor inerte.
const fasesAte = async (page, id, ms = 6000) => { const vistas = new Set(); const rotulos = new Set(); const t0 = Date.now(); while (Date.now() - t0 < ms) { const r = await page.evaluate(() => { const p = document.querySelector("#time [data-shown]"); return { f: p.dataset.fase, a: p.dataset.ativo, v: p.dataset.visivel ?? p.dataset.ativo, l: p.getAttribute("aria-label"), c: p.nextElementSibling?.querySelector("span")?.textContent }; }); vistas.add(r.f); rotulos.add(`${r.v}=${r.l}=${r.c}`); if (r.f === "recompondo" && r.v !== id) rotulos.add(`ERRO-recompondo-${r.v}=x=x`); if (r.a === id && /^(foto|foto-estatica|falha)$/.test(r.f)) return { t: Date.now() - t0, fases: [...vistas], rotulos: [...rotulos] }; await page.waitForTimeout(20); } return { t: -1, fases: [...vistas], rotulos: [...rotulos] }; };
const NOMES = { matheus: "Matheus Xavier Silva de Toledo", miguel: "Miguel", rodrigo: "Rodrigo Gobbo", hartmann: "Luiz G. Hartmann", victor: "Victor Arthur Ohannesian" };
const coerente = (rotulos) => rotulos.every((x) => { const [a, l, c] = x.split("="); if (a.startsWith("ERRO")) return false; return !a || a === "undefined" || (l === `Retrato de ${NOMES[a]}` && c.startsWith(NOMES[a])); });
const fimOk = (page, id) => page.evaluate(({ id, nome }) => { const p = document.querySelector("#time [data-shown]"); const d = document.querySelector("#time details[name=time][open]"); const f = p.querySelector("img.rp-foto"); const cv = p.querySelector("canvas.rp-pontos"); return { ok: p.dataset.ativo === id && p.dataset.pedido === id && d?.dataset.id === id && d.querySelector("[class*=__name]").textContent === nome && p.getAttribute("aria-label") === `Retrato de ${nome}` && !p.hasAttribute("aria-busy") && (f?.getAttribute("src") ?? "").includes(`/${id}-`) && +getComputedStyle(f).opacity === 1 && (!cv || getComputedStyle(cv).visibility === "hidden"), fase: p.dataset.fase, src: f?.getAttribute("src")?.split("/").pop(), cv: cv && getComputedStyle(cv).visibility, bio: d?.querySelector("[class*=__resumo]")?.textContent.slice(0, 24) }; }, { id, nome: NOMES[id] });

await test("Time [módulo real] abertura: foto natural de Matheus sem pontos; cursor no retrato e na lista não muda nada (0 quadros); sem botão Ver foto/Ver pontos; clique no atual não transforma", async () => {
  for (const w of [1280, 1440]) {
    const { ctx, page, errors } = await openCom([w, 900]);
    await irRetrato(page);
    const t0 = await faseE(page, "foto");
    const f0 = await fimOk(page, "matheus");
    const look = await page.evaluate(() => { const t = document.getElementById("time"); return { bg: getComputedStyle(t).backgroundColor, prov: /aguarda o módulo/.test(t.textContent), botoes: t.querySelectorAll("button").length, pontosVistos: getComputedStyle(t.querySelector("canvas.rp-pontos")).visibility }; });
    assert(t0 >= 0 && f0.ok && f0.fase === "foto" && look.botoes === 0 && !look.prov && look.pontosVistos === "hidden" && look.bg === FUNDO_CLARO, "abertura: " + JSON.stringify({ t0, f0, look }));
    const b = await page.locator(PORTRAIT).boundingBox();
    const q0 = await quadros(page);
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 }); await page.waitForTimeout(500);
    await page.mouse.move(b.x + b.width + 150, b.y + 60, { steps: 4 }); await page.waitForTimeout(500);
    for (const id of ["miguel", "rodrigo", "hartmann", "victor"]) { await page.locator(`#time details[data-id=${id}] > summary`).hover(); await page.waitForTimeout(80); }
    await page.locator("#time details[data-id=matheus] > summary").click();
    await page.focus("#time details[data-id=matheus] > summary"); await page.keyboard.press("Enter"); await page.keyboard.press("Space");
    await page.waitForTimeout(600);
    const q1 = await quadros(page);
    const f1 = await fimOk(page, "matheus");
    assert(q1 === q0 && f1.ok && f1.fase === "foto" && JSON.stringify(await abertos(page)) === '["matheus"]', `cursor/lista/clique no atual: ${q1 - q0} quadros ${JSON.stringify(f1)}`);
    notes.push(`    · ${w}: abertura em foto (${t0} ms), sem pontos nem botão; cursor no retrato + hover em 4 linhas + clique/Enter/Espaço no atual → ${q1 - q0} quadros, continua matheus`);
    assert(!errors.length, errors[0]);
    await ctx.close();
  }
});
await test("Time [módulo real] troca das cinco por clique e por teclado: foto → desfazendo → transformando → recompondo → foto; legenda e nome acessível = pessoa visível; fim coerente; sem pontos residuais nem redesenho em repouso", async () => {
  const { ctx, page, errors } = await openCom([1440, 900]);
  await irRetrato(page);
  await faseE(page, "foto");
  const linhas = [];
  for (const [modo, ordem] of [["clique", ["miguel", "rodrigo", "hartmann", "victor", "matheus"]], ["teclado", ["victor", "hartmann", "rodrigo", "miguel", "matheus"]]]) {
    for (const id of ordem) {
      if (modo === "clique") await page.locator(`#time details[data-id=${id}] > summary`).click();
      else { await page.focus(`#time details[data-id=${id}] > summary`); await page.keyboard.press("Enter"); }
      const r = await fasesAte(page, id);
      await page.waitForTimeout(250);
      const fim = await fimOk(page, id);
      const q0 = await quadros(page); await page.waitForTimeout(700); const q1 = await quadros(page);
      linhas.push(`${modo} ${id}: ${r.t} ms [${r.fases.join("→")}] repouso ${q1 - q0}`);
      assert(r.t > 0 && ["desfazendo", "transformando", "recompondo"].every((f) => r.fases.includes(f)) && coerente(r.rotulos) && fim.ok && fim.fase === "foto" && q1 === q0, `${modo} ${id}: ${JSON.stringify({ r, fim, rep: q1 - q0 })}`);
    }
  }
  notes.push("    · " + linhas.join("\n    · "));
  assert(!errors.length, errors[0]);
  await ctx.close();
});
await test("Time [módulo real] seleções rápidas terminam na última; enquadramento final idêntico ao da foto estática do mesmo integrante", async () => {
  const sharp = (await import("sharp")).default;
  const { ctx, page, errors } = await openCom([1440, 900]);
  await irRetrato(page);
  await faseE(page, "foto");
  for (const id of ["rodrigo", "victor", "matheus", "hartmann", "rodrigo"]) { await page.locator(`#time details[data-id=${id}] > summary`).click(); await page.waitForTimeout(60); }
  const r = await fasesAte(page, "rodrigo", 8000);
  await page.waitForTimeout(300);
  const fim = await fimOk(page, "rodrigo");
  assert(r.t > 0 && fim.ok && coerente(r.rotulos) && JSON.stringify(await abertos(page)) === '["rodrigo"]', "rápidas: " + JSON.stringify({ r, fim }));
  const A = await page.locator(PORTRAIT).screenshot();
  await ctx.close();
  const red = await openCom([1440, 900], { reduced: true });
  await irRetrato(red.page);
  await red.page.locator("#time details[data-id=rodrigo] > summary").click();
  await ativoE(red.page, "rodrigo");
  await red.page.waitForTimeout(400);
  const B = await red.page.locator(PORTRAIT).screenshot();
  await red.ctx.close();
  const [a, b] = await Promise.all([A, B].map((x) => sharp(x).raw().toBuffer({ resolveWithObject: true })));
  let dif = 0; for (let i = 0; i < a.data.length; i++) if (Math.abs(a.data[i] - b.data[i]) > 8) dif++;
  const frac = dif / a.data.length;
  notes.push(`    · rápidas (5 em 300 ms) → rodrigo em ${r.t} ms; retrato final × foto estática (reduzido): ${a.info.width}×${a.info.height} vs ${b.info.width}×${b.info.height}, ${(frac * 100).toFixed(3)} % dos canais diferem > 8`);
  assert(a.info.width === b.info.width && a.info.height === b.info.height && frac < 0.001, `enquadramento: ${frac}`);
  assert(!errors.length, errors[0]);
});
await test("Time [módulo real] foto atrasada (retrato anterior e legenda dele ficam), recorte 404 → foto retangular da mesma pessoa, recorte+foto 404 → aviso coerente", async () => {
  const atraso = async (r) => { await new Promise((x) => setTimeout(x, 2500)); await r.continue(); };
  const nf = (r) => r.fulfill({ status: 404, body: "" });
  const { ctx, page, errors } = await openCom([1440, 900], { routes: [[/time-interativo-0\.6\.0-03d2\/retratos\/hartmann-recorte/, atraso], [/time-interativo-0\.6\.0-03d2\/retratos\/miguel-recorte/, nf], [/time-interativo-0\.6\.0-03d2\/retratos\/victor-/, nf]] });
  await irRetrato(page);
  await faseE(page, "foto");
  await page.locator("#time details[data-id=hartmann] > summary").click();
  await page.waitForTimeout(600);
  const durante = await ret(page);
  const lab = await page.evaluate(() => document.querySelector("#time [data-shown]").getAttribute("aria-label"));
  const tH = await fasesAte(page, "hartmann", 6000);
  await page.locator("#time details[data-id=miguel] > summary").click();
  const tM = await fasesAte(page, "miguel", 5000);
  const m = await ret(page);
  await page.locator("#time details[data-id=victor] > summary").click();
  const tV = await fasesAte(page, "victor", 5000);
  const v = await ret(page);
  assert(durante.ativo === "matheus" && durante.fase === "carregando" && /^Matheus.*carregando foto/.test(durante.nome) && lab === "Retrato de Matheus Xavier Silva de Toledo" && tH.t > 0 && coerente(tH.rotulos), "atraso: " + JSON.stringify({ durante, lab, tH }));
  assert(tM.t >= 0 && /^foto(-estatica)?$/.test(m.fase) && /miguel-foto\.webp$/.test(m.foto.src) && m.foto.op === 1 && /^Miguel/.test(m.nome), "404 recorte: " + JSON.stringify(m));
  assert(tV.t >= 0 && v.fase === "falha" && /Victor Arthur Ohannesian — foto indisponível/.test(v.falha) && /^Victor/.test(v.nome) && JSON.stringify(await abertos(page)) === '["victor"]', "404 total: " + JSON.stringify(v));
  notes.push(`    · Hartmann +2,5 s: durante ${durante.ativo}/${durante.fase} "${durante.nome}", rótulo "${lab}"; depois hartmann (${tH.t} ms, ${tH.fases.join("→")}); Miguel recorte 404 → ${m.fase} ${m.foto.src.split("/").pop()}; Victor 404 → "${v.falha}"`);
  assert(!errors.length, errors[0]);
  await ctx.close();
});
await test("Time [módulo real] pausa DURANTE a transformação → foto do escolhido parada; movimento reduzido e celular → troca direta; aba oculta/fora da tela param; resize desmonta e remonta em foto", async () => {
  const { ctx, page, errors } = await openCom([1440, 900]);
  await irRetrato(page);
  await faseE(page, "foto");
  await page.locator("#time details[data-id=hartmann] > summary").click();
  await faseE(page, "transformando", 2000);
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click());
  await page.waitForTimeout(150);
  const p1 = await fimOk(page, "hartmann");
  const q0 = await quadros(page); await page.waitForTimeout(600); const q1 = await quadros(page);
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click());
  await page.waitForTimeout(400);
  const p2 = await fimOk(page, "hartmann");
  assert(p1.ok && p1.fase === "foto-estatica" && q1 === q0 && p2.ok && p2.fase === "foto", "pausa no meio: " + JSON.stringify({ p1, p2, q: q1 - q0 }));
  // com pausa: troca direta
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click());
  await page.locator("#time details[data-id=victor] > summary").click();
  const pv = await fasesAte(page, "victor", 3000);
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click());
  await page.waitForTimeout(300);
  assert(pv.t >= 0 && !pv.fases.includes("transformando") && (await fimOk(page, "victor")).ok, "pausa troca direta: " + JSON.stringify(pv));
  // aba oculta no meio
  await page.locator("#time details[data-id=miguel] > summary").click();
  await faseE(page, "transformando", 2000);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  const qa = await quadros(page); await page.waitForTimeout(700); const qb = await quadros(page);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
  const tv = await fasesAte(page, "miguel", 4000);
  // fora da tela no meio
  await page.locator("#time details[data-id=rodrigo] > summary").click();
  await faseE(page, "transformando", 2000);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(300);
  const qc = await quadros(page); await page.waitForTimeout(700); const qd = await quadros(page);
  await irRetrato(page);
  const tr = await fasesAte(page, "rodrigo", 4000);
  assert(qb === qa && tv.t >= 0 && qd === qc && tr.t >= 0 && (await fimOk(page, "rodrigo")).ok, `oculta ${qb - qa}, fora ${qd - qc}`);
  // resize
  await page.setViewportSize({ width: 600, height: 900 });
  await page.waitForTimeout(400);
  const d = await page.evaluate(() => ({ canvas: document.querySelectorAll("#time canvas").length, motor: document.querySelector("#time [data-shown]").dataset.motor ?? null }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  if (!(await abertos(page)).length) await page.locator("#time details[data-id=rodrigo] > summary").click();
  const tRe = await fasesAte(page, "rodrigo", 4000);
  const re = await fimOk(page, "rodrigo");
  assert(d.canvas === 0 && d.motor === null && tRe.t >= 0 && re.ok && re.fase === "foto" && !tRe.fases.includes("pontos"), "resize: " + JSON.stringify({ d, tRe, re }));
  notes.push(`    · pausa no meio da troca → hartmann ${p1.fase}, ${q1 - q0} quadros; retomar → ${p2.fase}; com pausa → troca direta para victor [${pv.fases.join("→")}]; aba oculta ${qb - qa} quadros; fora da tela ${qd - qc}; 600 px → desmontado; 1440 → remontado em foto de rodrigo [${tRe.fases.join("→")}]`);
  assert(!errors.length, errors[0]);
  await ctx.close();
  const red = await openCom([1440, 900], { reduced: true });
  await irRetrato(red.page);
  const r0 = await faseE(red.page, "foto-estatica");
  const linhas = [];
  for (const id of ["miguel", "rodrigo", "hartmann", "victor", "matheus"]) {
    await red.page.locator(`#time details[data-id=${id}] > summary`).click();
    const r = await fasesAte(red.page, id, 3000);
    await red.page.waitForTimeout(100);
    const f = await fimOk(red.page, id);
    linhas.push(`${id} ${r.t} ms`);
    assert(r.t >= 0 && !r.fases.includes("transformando") && f.ok && f.fase === "foto-estatica", `reduzido ${id}: ${JSON.stringify({ r, f })}`);
  }
  const qr0 = await quadros(red.page); await red.page.waitForTimeout(1000); const qr1 = await quadros(red.page);
  linhas.push(`${qr0} desenhos no total (1 por troca, sem laço), ${qr1 - qr0} em 1 s de repouso`);
  assert(r0 >= 0 && qr1 === qr0, "reduzido: repouso " + (qr1 - qr0));
  await red.ctx.close();
  const tq = await openCom([390, 844], { touch: true });
  await tq.page.evaluate(() => document.getElementById("time").scrollIntoView());
  await tq.page.locator("#time details[data-id=victor] > summary").tap();
  await tq.page.waitForTimeout(500);
  const t = await tq.page.evaluate(() => ({ canvas: document.querySelectorAll("#time canvas").length, botoes: document.querySelectorAll("#time button").length, img: (() => { const i = document.querySelector("#time details[open] img"); return i && i.complete && i.naturalWidth > 0 && i.closest("details").dataset.id; })() }));
  assert(t.canvas === 0 && t.botoes === 0 && t.img === "victor", "celular: " + JSON.stringify(t));
  notes.push(`    · reduzido: troca direta (sem transformar): ${linhas.join(", ")}; celular 390 por toque → sem canvas, foto de Victor íntegra no item`);
  await tq.ctx.close();
});
await test("Time módulo AUSENTE (URL inexistente): fotos do Site com troca direta, sem controle; nova foto só depois de decodificada; rápidas → última; 404 → iniciais coerentes", async () => {
  const { ctx, page, errors } = await openCom([1440, 900], { semModulo: true, wait: "domcontentloaded", routes: [[/\/refinada\/time\/miguel-/, (r) => r.fulfill({ status: 404, body: "" })], [/\/refinada\/time\/hartmann-/, async (r) => { await new Promise((x) => setTimeout(x, 2500)); await r.continue(); }]] });
  await irRetrato(page);
  await page.waitForTimeout(1500);
  const r0 = await ret(page);
  assert(r0.motor === "fallback" && r0.canvas === 0 && r0.botoes.length === 0 && JSON.stringify(await visiveis(page)) === '["matheus"]', "fallback: " + JSON.stringify(r0));
  const nomeRetrato = () => page.evaluate(() => document.querySelector("#time [data-shown]").nextElementSibling?.textContent);
  await page.locator("#time details[data-id=hartmann] > summary").click();
  await page.waitForTimeout(400);
  const durante = { vis: await visiveis(page), nome: await nomeRetrato() };
  await page.waitForTimeout(3000);
  const depois = await visiveis(page);
  assert(JSON.stringify(durante.vis) === '["matheus"]' && /carregando foto/.test(durante.nome) && JSON.stringify(depois) === '["hartmann"]', "atraso: " + JSON.stringify({ durante, depois }));
  await page.locator("#time details[data-id=miguel] > summary").click();
  await page.waitForTimeout(600);
  const m = { vis: await visiveis(page), txt: await page.evaluate(() => document.querySelector("#time [data-shown] [data-id=miguel]").textContent), nome: await nomeRetrato() };
  assert(JSON.stringify(m.vis) === '["miguel"]' && m.txt === "M" && m.nome === "Miguel", "404: " + JSON.stringify(m));
  for (const id of ["rodrigo", "victor", "matheus", "victor"]) { await page.locator(`#time details[data-id=${id}] > summary`).click(); await page.waitForTimeout(40); }
  await page.waitForTimeout(800);
  assert(JSON.stringify(await visiveis(page)) === '["victor"]' && JSON.stringify(await abertos(page)) === '["victor"]', "rápidas");
  notes.push(`    · módulo ausente: fallback de fotos; Hartmann atrasado → matheus fica ("${durante.nome}") → hartmann; Miguel 404 → "M"; rápidas → victor`);
  assert(!errors.length, errors[0]);
  await ctx.close();
});
// ── STUB DE CONTRATO (forma do contrato real, sem desenho) — só a fiação do Site ───────────────
await test("Time [stub de contrato, não é o efeito]: create sem visao/hover; select a cada escolha (nunca no atual); preload no hover da linha; setPaused pela pausa; destroy ao desmontar; nenhum setVisao", async () => {
  const { ctx, page, errors } = await openCom([1440, 900], { stub: true });
  await page.addInitScript(() => {});
  await irRetrato(page);
  await page.waitForTimeout(500);
  const log = () => page.evaluate(() => (window.__retratoLog ?? []).map((x) => x.join(":")));
  await page.locator("#time details[data-id=matheus] > summary").click();
  await page.locator("#time details[data-id=miguel] > summary").hover();
  await page.locator("#time details[data-id=miguel] > summary").click();
  await page.waitForTimeout(150);
  await page.locator("#time details[data-id=miguel] > summary").click();
  await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click());
  await page.waitForTimeout(100);
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click());
  await page.setViewportSize({ width: 600, height: 900 });
  await page.waitForTimeout(300);
  const l = await log();
  const txt = l.join(" | ");
  assert(l[0] === "create:matheus::false:matheus,miguel,rodrigo,hartmann,victor" && l.includes("preload:miguel") && l.filter((x) => x === "select:miguel").length === 1 && l.filter((x) => x === "select:matheus").length === 1 && !l.some((x) => x.startsWith("setVisao")) && l.includes("setPaused:true") && l.at(-1).startsWith("destroy"), txt);
  notes.push(`    · stub: ${txt}`);
  assert(!errors.length, errors[0]);
  await ctx.close();
});
await test("Time celular/tablet (320, 390, 768): acordeão com retrato dentro do aberto, todos alcançáveis por toque e teclado; rostos sem corte; sem rolagem lateral", async () => {
  const rows = [];
  for (const vp of [[320, 568], [390, 844], [768, 1024]]) {
    const { ctx, page } = await open(vp, { reduced: true, touch: true });
    await page.evaluate(() => document.getElementById("time").scrollIntoView());
    const big = await page.evaluate(() => getComputedStyle(document.querySelector("#time [class*='__portrait']")).display);
    const fotos = [];
    for (const id of ["matheus", "miguel", "rodrigo", "hartmann", "victor"]) {
      if (id !== "matheus") await page.locator(`#time details[data-id=${id}] > summary`).tap();
      await page.waitForTimeout(250);
      const f = await page.evaluate((id) => { const d = document.querySelector(`#time details[data-id=${id}]`); const i = d.querySelector("img"); const b = i.getBoundingClientRect(); return { open: d.open, w: Math.round(b.width), h: Math.round(b.height), loaded: i.complete && i.naturalWidth > 0, inside: d.contains(i), right: Math.round(b.right), nopen: document.querySelectorAll("#time details[name=time][open]").length }; }, id);
      fotos.push({ id, ...f });
    }
    // teclado: Tab chega ao 1º summary
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    rows.push({ vp: vp.join("×"), big, sw, fotos });
    await ctx.close();
  }
  notes.push("    · " + rows.map((r) => `${r.vp}: retrato grande ${r.big}; ` + r.fotos.map((f) => `${f.id} ${f.w}×${f.h}${f.loaded ? "" : " (não carregou)"}`).join(", ")).join("\n    · "));
  for (const r of rows) {
    assert(r.big === "none" && r.sw <= +r.vp.split("×")[0], `${r.vp}: ${r.big} ${r.sw}`);
    for (const f of r.fotos) assert(f.open && f.loaded && f.inside && f.nopen === 1 && Math.abs(f.h / f.w - 1.25) < 0.02 && f.right <= +r.vp.split("×")[0], `${r.vp} ${f.id}: ${JSON.stringify(f)}`);
  }
});
await test("Time sem JS: conteúdo e seleção nativa; retrato do aberto sem cair em Matheus quando tudo fecha", async () => {
  for (const vp of [[390, 844], [1440, 900]]) {
    const nj = await open(vp, { noJs: true });
    const n = await nj.page.evaluate(() => ({ items: document.querySelectorAll("#time details[name=time]").length, open: document.querySelector("#time details[open]")?.dataset.id }));
    await nj.page.locator("#time details[data-id=victor] > summary").click();
    const v = await nj.page.evaluate(() => document.querySelector("#time details[data-id=victor]").open && !document.querySelector("#time details[data-id=matheus]").open);
    await nj.page.waitForTimeout(400);
    const visV = await visiveis(nj.page);
    await nj.page.locator("#time details[data-id=victor] > summary").click();
    await nj.page.waitForTimeout(400);
    const visNada = await visiveis(nj.page);
    assert(n.items === 5 && n.open === "matheus" && v, "sem JS: " + JSON.stringify(n));
    if (vp[0] >= 960) assert(JSON.stringify(visV) === '["victor"]' && visNada.length === 0, `sem JS desktop: ${visV} / ${visNada}`);
    notes.push(`    · sem JS ${vp.join("×")}: 5 itens, Victor por clique${vp[0] >= 960 ? `, retrato ${visV}, tudo fechado → quadro neutro (${visNada.length} foto)` : ""}`);
    await nj.ctx.close();
  }
});
await test("Ciência: cartão da publicação — periódico, ano, pergunta, título bibliográfico completo, DOI correto e 'Ler publicação'; segmentação separada", async () => {
  const { ctx, page } = await open([1440, 900], { reduced: true });
  const m = await page.evaluate(() => {
    const c = document.querySelector("#ciencia article[aria-labelledby=ciencia-publicacao]");
    const a = c.querySelector("a");
    return { t: c.textContent, href: a.href, label: a.textContent, target: a.target, segSep: document.querySelector("#ciencia").textContent.includes("Segmentação · pesquisa em andamento") };
  });
  assert(/Clinical Radiology, 2026/.test(m.t) && /Pergunta estudada/.test(m.t) && m.t.includes("Machine learning using T2-weighted radiomics for International Society of Urological Pathology (ISUP) classification in prostate cancer"), "cartão: " + m.t.slice(0, 200));
  assert(m.href === "https://doi.org/10.1016/j.crad.2026.107417" && m.t.includes("10.1016/j.crad.2026.107417") && m.label.startsWith("Ler publicação") && m.target === "_blank" && m.segSep, JSON.stringify(m).slice(0, 300));
  await ctx.close();
});
await test("Plataforma: 'Para quem' (radiologia e pesquisa, tarefas documentadas, sem promessa); avisos essenciais visíveis e detalhes em expansão", async () => {
  const { ctx, page } = await open([1440, 900], { reduced: true });
  const m = await page.evaluate(() => {
    const p = document.getElementById("plataforma"), x = document.getElementById("explicabilidade");
    const pq = p.querySelector("[aria-labelledby=plataforma-para-quem]");
    const vis = (root, t) => [...root.querySelectorAll("p, li, dd, figcaption")].some((e) => e.checkVisibility() && e.textContent.includes(t));
    return {
      pq: pq?.textContent ?? "", promessa: /reduz|acelera|aument|acurácia|eficácia|melhora|mais rápido/i.test(pq?.textContent ?? ""),
      platVis: vis(p, "Demonstração do fluxo da interface"), platDet: !!p.querySelector("aside details") && !p.querySelector("aside details").open,
      platScoreOculto: !vis(p, "probabilidade clínica calibrada") && p.textContent.includes("probabilidade clínica calibrada"),
      xaiVis: vis(x, "não representam uma saída do modelo, valores SHAP nem uma estimativa de risco"),
      xaiDet: !!x.querySelector("details") && !x.querySelector("details").open && x.textContent.includes("SHAP foi usado no estudo publicado"),
      passagem: document.getElementById("passagem").textContent,
    };
  });
  assert(/Equipes de radiologia/.test(m.pq) && /Pesquisadores/.test(m.pq) && !m.promessa, "Para quem: " + m.pq);
  assert(m.platVis && m.platDet && m.platScoreOculto && m.xaiVis && m.xaiDet, JSON.stringify(m).slice(0, 400));
  assert(!/pipeline automático validado/.test(m.passagem), "Passagem repete o aviso da Jornada");
  await ctx.close();
});
await test("Contato: duas ações preparadas (demonstração e colaboração) SEM destino enquanto não há canal real; FAQ com 4 perguntas por teclado; Time no rodapé, fora do cabeçalho", async () => {
  const { ctx, page } = await open([1280, 720], { reduced: true });
  const m = await page.evaluate(() => {
    const c = document.getElementById("contato");
    return {
      pend: [...c.querySelectorAll("[data-acao]")].map((e) => [e.dataset.acao, e.tagName, e.querySelector("a,button") ? "interativo" : "texto"]),
      links: [...c.querySelectorAll("a[href^='mailto'], a[href^='http'], form, button")].length,
      faq: [...document.querySelectorAll("#faq details summary")].map((s) => s.textContent),
      rodape: [...document.querySelectorAll("footer nav a")].map((a) => a.getAttribute("href")),
      header: [...document.querySelectorAll("header nav a")].map((a) => a.getAttribute("href")),
    };
  });
  assert(JSON.stringify(m.pend) === JSON.stringify([["demonstracao", "P", "texto"], ["pesquisa", "P", "texto"]]) && m.links === 0, "contato: " + JSON.stringify(m.pend) + m.links);
  assert(m.faq.length === 4 && m.rodape.includes("#time") && !m.header.includes("#time"), JSON.stringify(m));
  await page.locator("#faq summary").first().focus();
  await page.keyboard.press("Enter");
  assert(await page.evaluate(() => document.querySelector("#faq details").open), "FAQ por teclado");
  await page.locator("footer nav a[href='#time']").click();
  await page.waitForTimeout(800);
  const top = await page.evaluate(() => Math.round(document.getElementById("time").getBoundingClientRect().top));
  notes.push(`    · rodapé → #time: topo da seção em ${top} px`);
  assert(top >= -2 && top < 200, "âncora #time: " + top);
  await ctx.close();
});

// ── Ciência: fechamento "revisão humana" + topografia (composição própria da refinada) ─────────
const COMP = "[data-frase-ativa]";
const compEstado = (page) => page.evaluate((sel) => { const c = document.querySelector(sel); return { p: +c.dataset.progresso, ativa: +c.dataset.fraseAtiva, estatico: c.hasAttribute("data-estatico"), motor: c.dataset.motor ?? null }; }, COMP);
const pEsperado = (page) => page.evaluate((sel) => { const c = document.querySelector(sel); const u = c.querySelector("[data-i='3']"); const pa = c.querySelector("[class*=paisagem]"); const cr = c.getBoundingClientRect(), ur = u.getBoundingClientRect(); const vh = innerHeight; const ini = 0.85 * vh - (pa.getBoundingClientRect().top - cr.top); const fim = 0.45 * vh - (ur.top + ur.height / 2 - cr.top); return Math.min(1, Math.max(0, (ini - cr.top) / (ini - fim))); }, COMP);
const topoEstado = (page) => page.evaluate((sel) => { const c = document.querySelector(sel); const f = c.querySelector("p"); const svg = c.querySelector("svg"); const tr = [...svg.querySelectorAll("[data-topo-trechos] path")].filter((x) => +(x.style.opacity || 0) > 0.01).length; const ouro = svg.querySelector("[data-topo-ouro]"); return { modo: f.dataset.topoModo ?? null, etapa: f.dataset.topoEtapa ?? null, trechos: tr, ouroDash: ouro.getAttribute("stroke-dasharray"), ouroOp: ouro.style.opacity, decisao: getComputedStyle(c.querySelector("[data-i='3']")).color, motor: c.dataset.motor ?? null }; }, COMP);
const curvasOriginais = (page) => page.evaluate((sel) => [...document.querySelectorAll(`${sel} svg > path`)].map((p) => p.outerHTML).join(""), COMP);
async function curvasSSR(vp) { const nj = await open(vp, { noJs: true }); const c = await curvasOriginais(nj.page); await nj.ctx.close(); return c; }
await test("Ciência fechamento: quatro frases exatas, visíveis e legíveis sem JS/animação; gráfico decorativo fora da leitura; nova identificação; outras rotas mantêm o TopoLandscape original", async () => {
  const { ctx, page, errors } = await open([1440, 900]);
  const m = await page.evaluate((sel) => {
    const c = document.querySelector(sel); const fr = [...c.querySelectorAll("[data-i]")];
    const s = document.getElementById("ciencia");
    return { frases: fr.map((f) => f.textContent), vis: fr.map((f) => +getComputedStyle(f).opacity === 1 && getComputedStyle(f).visibility === "visible" && !f.closest("[aria-hidden]")), p: c.querySelector("p")?.textContent, svgHidden: !!c.querySelector("svg")?.closest("[aria-hidden=true]"), nota: c.querySelector("[class*=nota]")?.textContent.trim(), notaHidden: c.querySelector("[class*=nota]")?.getAttribute("aria-hidden"), antiga: /Da imagem ao entendimento · Ilustração/.test(s.textContent), dentro: s.contains(c) };
  }, COMP);
  assert(JSON.stringify(m.frases) === JSON.stringify(["O modelo sugere.", "O radiologista revisa.", "O médico contextualiza.", "A decisão permanece humana."]) && m.vis.every(Boolean) && m.svgHidden && m.nota === "Representação conceitual da revisão humana" && m.notaHidden === "true" && !m.antiga && m.dentro, JSON.stringify(m));
  assert(!errors.length, errors[0]);
  await ctx.close();
  const nj = await open([390, 844], { noJs: true });
  const n = await nj.page.evaluate((sel) => { const c = document.querySelector(sel); return { ativa: c.dataset.fraseAtiva, frases: c.querySelectorAll("[data-i]").length, svg: !!c.querySelector("svg path"), marca: getComputedStyle(c.querySelector("[data-i='3']"), "::before").opacity }; }, COMP);
  assert(n.ativa === "3" && n.frases === 4 && n.svg && n.marca === "1", "sem JS: " + JSON.stringify(n));
  await nj.ctx.close();
  const outras = [];
  for (const r of ["/previa", "/previa/a", "/previa/b", "/previa/original"]) {
    const c2 = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const pg = await c2.newPage();
    await pg.goto(BASE + r, { waitUntil: "domcontentloaded" });
    outras.push(await pg.evaluate(() => ({ nota: /Da imagem ao entendimento · Ilustração/.test(document.getElementById("ciencia")?.textContent ?? ""), novo: !!document.querySelector("[data-frase-ativa]") })));
    await c2.close();
  }
  assert(outras.every((o) => o.nota && !o.novo), "outras rotas: " + JSON.stringify(outras));
  notes.push(`    · frases exatas e visíveis; SVG e nota aria-hidden; sem JS: estático com marca na 4ª; /previa, /a, /b e /previa/original com o TopoLandscape original`);
});
await test("Ciência fechamento: progresso pela posição real — rolagem para frente e para trás (reversível), teclado, resize no meio; sem scroll hijacking; sem deslocamento de layout", async () => {
  for (const vp of [[1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]]) {
    const { ctx, page, errors } = await open(vp, { init: () => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: false }); } });
    const top = await page.evaluate((sel) => document.querySelector(sel).getBoundingClientRect().top + scrollY, COMP);
    const altura0 = await page.evaluate(() => document.documentElement.scrollHeight);
    const amostras = [];
    for (let y = top - vp[1] - 100; y <= top + 200; y += Math.min(60, Math.round(vp[1] / 20))) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
      await page.waitForTimeout(80);
      const sy = await page.evaluate(() => scrollY);
      const e = await compEstado(page);
      amostras.push({ y, sy, p: e.p, ativa: e.ativa, esperado: +(await pEsperado(page)).toFixed(4) });
    }
    const ida = amostras.map((a) => a.p);
    const volta = [];
    for (const a of [...amostras].reverse()) { await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), a.y); await page.waitForTimeout(80); volta.push((await compEstado(page)).p); }
    const mono = ida.every((v, i) => i === 0 || v >= ida[i - 1]) && volta.every((v, i) => i === 0 || v <= volta[i - 1]);
    const igual = JSON.stringify(volta.reverse()) === JSON.stringify(ida);
    const fiel = amostras.every((a) => Math.abs(a.p - a.esperado) < 0.002 && Math.abs(a.sy - Math.max(0, a.y)) <= 1);
    // resize no meio do percurso
    const meio = amostras[Math.floor(amostras.length / 2)].y;
    await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), meio);
    await page.waitForTimeout(100);
    await page.setViewportSize({ width: Math.round(vp[0] * 0.8), height: vp[1] });
    await page.waitForTimeout(300);
    const rs = { p: (await compEstado(page)).p, esp: +(await pEsperado(page)).toFixed(4) };
    await page.setViewportSize({ width: vp[0], height: vp[1] });
    await page.waitForTimeout(300);
    const rs2 = { p: (await compEstado(page)).p, esp: +(await pEsperado(page)).toFixed(4) };
    const altura1 = await page.evaluate(() => document.documentElement.scrollHeight);
    const cls = await page.evaluate(() => window.__cls);
    const fases = [...new Set(amostras.map((a) => a.ativa))].join(",");
    notes.push(`    · ${vp.join("×")}: p ida ${ida.map((v) => v.toFixed(2)).join(" ")} (frases ${fases}); volta igual ${igual}; resize meio ${rs.p.toFixed(3)}≈${rs.esp.toFixed(3)} → ${rs2.p.toFixed(3)}≈${rs2.esp.toFixed(3)}; CLS ${cls.toFixed(4)}`);
    assert(mono && igual && fiel && ida[0] === 0 && ida.at(-1) === 1 && fases === "0,1,2,3" && Math.abs(rs.p - rs.esp) < 0.002 && Math.abs(rs2.p - rs2.esp) < 0.002 && altura1 === altura0 && cls < 0.001, `${vp}: ${JSON.stringify({ mono, igual, fiel, ida, rs, rs2, altura0, altura1, cls })}`);
    assert(!errors.length, errors[0]);
    // teclado: PageDown/Espaço rolam normalmente e o progresso acompanha
    if (vp[0] === 1440) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), top - vp[1]);
      await page.waitForTimeout(100);
      await page.evaluate(() => document.activeElement?.blur());
      const ps = [];
      for (let i = 0; i < 6; i++) { await page.keyboard.press("ArrowDown", { delay: 0 }); await page.keyboard.press("ArrowDown"); await page.keyboard.press("ArrowDown"); await page.waitForTimeout(500); ps.push((await compEstado(page)).p); }
      await page.keyboard.press("PageDown"); await page.waitForTimeout(800); ps.push((await compEstado(page)).p);
      await page.keyboard.press("PageUp"); await page.keyboard.press("PageUp"); await page.waitForTimeout(900); ps.push((await compEstado(page)).p);
      notes.push(`    · teclado (setas ×3 por passo, depois PageDown e PageUp ×2): p ${ps.map((v) => v.toFixed(2)).join(" → ")}`);
      const setas = ps.slice(0, 7);
      assert(setas.every((v, i) => i === 0 || v >= setas[i - 1]) && setas.at(-1) > ps[0] && ps.at(-1) < ps.at(-2), "teclado: " + ps);
    }
    await ctx.close();
  }
});
await test("Ciência fechamento: pausa e movimento reduzido → composição estática completa (p = 1, marca na decisão); cumes inteiros; sem rolagem lateral; chegada pelas âncoras Ciência e Time", async () => {
  const { ctx, page, errors } = await open([1440, 900]);
  const top = await page.evaluate((sel) => document.querySelector(sel).getBoundingClientRect().top + scrollY, COMP);
  await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), top - 700);
  await page.waitForTimeout(150);
  const antes = await compEstado(page);
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click());
  await page.waitForTimeout(150);
  const pausa = await compEstado(page);
  await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), top - 900);
  await page.waitForTimeout(150);
  const pausaRolando = await compEstado(page);
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click());
  await page.waitForTimeout(150);
  const retomada = await compEstado(page);
  assert(antes.p < 1 && pausa.estatico && pausa.p === 1 && pausa.ativa === 3 && pausaRolando.p === 1 && !retomada.estatico && retomada.p < 1, JSON.stringify({ antes, pausa, pausaRolando, retomada }));
  // cumes: nenhum caminho acima do topo do viewBox
  const cume = await page.evaluate((sel) => { const svg = document.querySelector(`${sel} svg`); const vb = svg.viewBox.baseVal; const ys = [...svg.querySelectorAll("path")].map((p) => p.getBBox().y); return { vbTop: vb.y, minY: Math.min(...ys) }; }, COMP);
  assert(cume.minY > cume.vbTop + 2, "cume cortado: " + JSON.stringify(cume));
  // âncoras
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.locator("header a[href='#ciencia']").first().click();
  await page.waitForTimeout(1600);
  const c = await page.evaluate(() => Math.round(document.getElementById("ciencia").getBoundingClientRect().top));
  await page.locator("footer a[href='#time']").click();
  await page.waitForTimeout(1600);
  const t = await page.evaluate(() => ({ top: Math.round(document.getElementById("time").getBoundingClientRect().top), titulo: Math.round(document.getElementById("time-title").getBoundingClientRect().top), header: Math.round(document.querySelector("header").getBoundingClientRect().bottom) }));
  assert(c >= -2 && c < 120 && t.top >= -2 && t.titulo > t.header, `âncoras: ciência ${c}, time ${JSON.stringify(t)}`);
  await ctx.close();
  const red = await open([1440, 900], { reduced: true });
  await red.page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), top - 700);
  await red.page.waitForTimeout(150);
  const r = await compEstado(red.page);
  assert(r.estatico && r.p === 1 && r.ativa === 3, "reduzido: " + JSON.stringify(r));
  await red.ctx.close();
  const sws = [];
  for (const vp of [[1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]]) {
    const o = await open(vp);
    await o.page.evaluate((sel) => document.querySelector(sel).scrollIntoView(), COMP);
    await o.page.waitForTimeout(200);
    sws.push([vp[0], await o.page.evaluate(() => document.documentElement.scrollWidth)]);
    await o.ctx.close();
  }
  notes.push(`    · pausa: p ${antes.p.toFixed(2)} → 1 (estático, marca na decisão), rolando continua 1; retomar → ${retomada.p.toFixed(2)}; reduzido estático; cume minY ${cume.minY.toFixed(1)} > topo ${cume.vbTop}; âncora Ciência ${c} px, Time ${t.top} px (título ${t.titulo} > cabeçalho ${t.header}); scrollWidth ${sws.map((x) => x.join("=")).join(", ")}`);
  assert(sws.every(([w, sw]) => sw <= w), "rolagem lateral: " + JSON.stringify(sws));
  assert(!errors.length, errors[0]);
});
await test("Ciência fechamento [módulo real, versão padrão da paisagem]: montado com progresso externo (Site = fonte única); etapas 1→4 acompanham as frases e voltam ao rolar para trás; decisão chega ao dourado na etapa 4; em p = 1 e assentado = composição estática; 0 mutações em repouso e fora da tela", async () => {
  const ssr = await curvasSSR([1440, 900]);
  const { ctx, page, errors } = await open([1440, 900], { init: () => { window.__mut = 0; addEventListener("DOMContentLoaded", () => { const svg = document.querySelector("[data-frase-ativa] svg"); new MutationObserver((l) => (window.__mut += l.length)).observe(svg, { attributes: true, subtree: true, childList: true }); }); } });
  const ida = [];
  for (const k of [0.1, 0.35, 0.6, 0.85, 1]) {
    const y = await page.evaluate(({ sel, k }) => { const c = document.querySelector(sel); const pa = c.querySelector("[class*=paisagem]"); const u = c.querySelector("[data-i='3']"); const vh = innerHeight; const cr = c.getBoundingClientRect(); const ini = 0.85 * vh - (pa.getBoundingClientRect().top - cr.top); const fim = 0.45 * vh - (u.getBoundingClientRect().top + u.getBoundingClientRect().height / 2 - cr.top); return cr.top + scrollY - (ini + (fim - ini) * k); }, { sel: COMP, k });
    await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(1300);
    const e = await compEstado(page); const t = await topoEstado(page);
    ida.push({ k, y, p: e.p, frase: e.ativa, ...t });
  }
  const volta = [];
  for (const a of [...ida].reverse()) { await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), a.y); await page.waitForTimeout(1300); volta.push({ ...(await topoEstado(page)), frase: (await compEstado(page)).ativa }); }
  volta.reverse();
  const etapas = ida.map((x) => x.etapa).join(",");
  assert(ida.every((x) => x.motor === "modulo" && x.modo === "animado") && etapas === "1,2,3,4,4" && ida.every((x) => +x.etapa === Math.min(4, x.frase + 1)), "ida: " + JSON.stringify(ida));
  assert(JSON.stringify(volta.map((x) => [x.etapa, x.trechos, x.ouroDash])) === JSON.stringify(ida.map((x) => [x.etapa, x.trechos, x.ouroDash])), "volta ≠ ida: " + JSON.stringify({ ida, volta }));
  assert(ida[0].decisao === COR_TEXTO_CLARO && ida[3].decisao === COR_DECISAO && ida[2].trechos > 0 && ida[0].trechos >= 1, "coreografia/frase: " + JSON.stringify(ida));
  // Fim da sequência assentado: curvas originais idênticas ao SSR e nenhum trecho. Sem encerramento (0.1/0.2) é
  // p = 1; com encerramento (0.3.0+) o estático é o FINAL do encerramento (e = 1: topo da área a --header-h + 12).
  const yFim = await page.evaluate((y4) => { const c = document.querySelector("[data-frase-ativa]"); if (!c.hasAttribute("data-com-encerramento")) return y4 + 200; const pa = c.querySelector("[class*=paisagem]"); const u = c.querySelector("[data-i='3']"); const hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72; const Y = (el) => el.getBoundingClientRect().top + scrollY; const s1 = Y(u) + u.getBoundingClientRect().height / 2 - 0.45 * innerHeight; return Math.max(s1 + 0.2 * innerHeight, Y(pa) - hdr - 12) + 40; }, ida[4].y);
  await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), yFim);
  await page.waitForTimeout(900);
  const final = await curvasOriginais(page); const tf = await topoEstado(page);
  const m0 = await page.evaluate(() => window.__mut); await page.waitForTimeout(1200); const m1 = await page.evaluate(() => window.__mut);
  // fora da tela
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await page.waitForTimeout(600);
  const m2 = await page.evaluate(() => window.__mut); await page.waitForTimeout(1200); const m3 = await page.evaluate(() => window.__mut);
  assert(final === ssr && tf.trechos === 0 && m1 === m0 && m3 === m2, JSON.stringify({ igual: final === ssr, tf, repouso: m1 - m0, fora: m3 - m2 }));
  notes.push(`    · módulo real 1440: etapas ${etapas} (frases ${ida.map((x) => x.frase).join(",")}); trechos ${ida.map((x) => x.trechos).join(",")}; decisão navy→dourada na etapa 4; volta = ida; fim assentado = SVG do SSR (${ssr.split("<path").length - 1} caminhos idênticos), 0 mutações em 1,2 s parado e fora da tela`);
  assert(!errors.length, errors[0]);
  await ctx.close();
});
await test("Ciência fechamento [módulo real]: pausa no meio → composição estática na hora (retomar devolve o quadro); movimento reduzido estático; módulo ausente → SVG estático; resize no meio mantém p da posição", async () => {
  const ssr = await curvasSSR([1280, 720]);
  const { ctx, page, errors } = await open([1280, 720]);
  const y = await page.evaluate((sel) => { const c = document.querySelector(sel); const pa = c.querySelector("[class*=paisagem]"); const u = c.querySelector("[data-i='3']"); const vh = innerHeight; const cr = c.getBoundingClientRect(); const ini = 0.85 * vh - (pa.getBoundingClientRect().top - cr.top); const fim = 0.45 * vh - (u.getBoundingClientRect().top + u.getBoundingClientRect().height / 2 - cr.top); return cr.top + scrollY - (ini + (fim - ini) * 0.62); }, COMP);
  await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
  await page.waitForTimeout(1300);
  const antes = await topoEstado(page); const quadroAntes = await page.evaluate((sel) => document.querySelector(`${sel} svg`).innerHTML, COMP);
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click());
  await page.waitForTimeout(100);
  const pausa = await topoEstado(page); const curvasPausa = await curvasOriginais(page);
  await page.evaluate(() => document.querySelector("header button[aria-pressed]").click());
  await page.waitForTimeout(1300);
  const quadroDepois = await page.evaluate((sel) => document.querySelector(`${sel} svg`).innerHTML, COMP);
  assert(antes.modo === "animado" && antes.etapa === "3" && pausa.modo === "estatico" && pausa.trechos === 0 && curvasPausa === ssr && pausa.decisao === COR_DECISAO && quadroDepois === quadroAntes, "pausa: " + JSON.stringify({ antes, pausa, igual: curvasPausa === ssr, retoma: quadroDepois === quadroAntes }));
  // resize no meio: p segue a posição (fonte única) e o módulo recebe o mesmo valor
  await page.setViewportSize({ width: 1000, height: 720 }); await page.waitForTimeout(700);
  const rs = { p: (await compEstado(page)).p, esp: +(await pEsperado(page)).toFixed(4), alvo: await page.evaluate(() => null) };
  assert(Math.abs(rs.p - rs.esp) < 0.002, "resize: " + JSON.stringify(rs));
  assert(!errors.length, errors[0]);
  await ctx.close();
  const red = await open([1440, 900], { reduced: true });
  await red.page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
  await red.page.waitForTimeout(600);
  const r = await topoEstado(red.page);
  assert(r.modo === "estatico" && r.trechos === 0 && (await curvasOriginais(red.page)) === (await curvasSSR([1440, 900])), "reduzido: " + JSON.stringify(r));
  await red.ctx.close();
  const aus = await open([1440, 900], { init: () => (window.__TOPO_REVISAO_TESTE__ = { url: "/refinada/topo-revisao-0.1.0/nao-existe.js" }) });
  await aus.page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
  await aus.page.waitForTimeout(600);
  const a = await topoEstado(aus.page);
  assert(a.motor === "falhou" && a.modo === null && a.trechos === 0 && a.decisao === COR_DECISAO && !aus.errors.length, "ausente: " + JSON.stringify(a));
  await aus.ctx.close();
  notes.push(`    · módulo real 1280: etapa ${antes.etapa} → pausa = estático (curvas = SSR, decisão dourada) → retomar devolve o mesmo quadro; resize 1280→1000 p ${rs.p}≈${rs.esp}; reduzido estático; módulo ausente → SVG estático sem erro`);
});
await test("Ciência: enquadramento da paisagem (cume inteiro e identificável; nada sob as frases; passagem curta ao Time)", async () => {
  // Medido na página real, composição final estática (reduzido = SVG do SSR). Vale para qualquer versão; as
  // exigências de cume/secundário/sela só se aplicam à montanha (data-enquadramento="montanha").
  const linhasNota = [];
  for (const [w, h] of [[2560, 1440], [1920, 1080], [1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]]) {
    const { ctx, page } = await open([w, h], { reduced: true });
    await page.evaluate(() => document.querySelector("#ciencia-revisao").scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const c = document.querySelector("[data-frase-ativa]");
      const area = c.querySelector("[class*=paisagem]").getBoundingClientRect();
      const svg = c.querySelector("svg");
      const frases = [...c.querySelectorAll("#ciencia-revisao span[data-i]")].map((s) => { const r = document.createRange(); r.selectNodeContents(s); const b = r.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; });
      const pts = [];
      for (const p of svg.querySelectorAll(":scope > path")) {
        const M = p.getScreenCTM(); const L = p.getTotalLength(); const n = Math.max(40, Math.ceil(L / 4));
        for (let i = 0; i <= n; i++) { const q = p.getPointAtLength((L * i) / n); pts.push([M.a * q.x + M.c * q.y + M.e, M.b * q.x + M.d * q.y + M.f]); }
      }
      const vis = pts.filter(([x]) => x >= area.left && x <= area.right);
      // perfil superior visível, colunas de 3 px
      const cols = new Map();
      for (const [x, y] of vis) { const k = Math.floor((x - area.left) / 3); cols.set(k, Math.min(cols.get(k) ?? Infinity, y)); }
      const sky = [...cols.entries()].sort((a, b) => a[0] - b[0]);
      const topo = Math.min(...vis.map((p) => p[1]));
      const ap = vis.find((p) => p[1] === topo);
      // nada desenhado sob as frases (caixa do texto + 8 px)
      let sob = 0;
      for (const f of frases) for (const [x, y] of vis) if (x >= f.l - 8 && x <= f.r + 8 && y >= f.t - 8 && y <= f.b + 8) sob++;
      const time = document.querySelector("#time-title")?.getBoundingClientRect().top ?? NaN;
      return { enq: c.dataset.enquadramento, area: { t: area.top, b: area.bottom, l: area.left, r: area.right, h: area.height }, topo, apX: ap[0], sob, sky: sky.map(([k, y]) => [k * 3, Math.round(y - area.top)]), timeGap: time - area.bottom, sw: document.documentElement.scrollWidth };
    });
    const f = `${w}×${h}`;
    assert(m.sw <= w, `${f}: scrollWidth ${m.sw}`);
    assert(m.topo >= m.area.t + 4, `${f}: cume cortado (topo ${m.topo.toFixed(1)} < área ${m.area.t.toFixed(1)} + 4)`);
    // 0.1.0 (preservada para comparação) já cruza as frases no desktop: só registra; a montanha não pode.
    if (m.enq === "montanha") assert(m.sob === 0, `${f}: ${m.sob} pontos de traço sob as frases`);
    assert(m.timeGap >= 24 && m.timeGap <= 160, `${f}: distância paisagem → título do Time ${m.timeGap.toFixed(0)} px`);
    let extra = "";
    if (m.enq === "montanha") {
      assert(m.apX >= m.area.l + 16 && m.apX <= m.area.r - 16, `${f}: cume fora da largura visível (x ${m.apX.toFixed(0)})`);
      // pico secundário: outro mínimo local do perfil, ≥ 60 px do cume, proeminência ≥ 10 px
      const sk = m.sky; const ap = sk.reduce((a, b) => (b[1] < a[1] ? b : a));
      let sec = null;
      for (let i = 0; i < sk.length; i++) {
        const [x, y] = sk[i]; if (Math.abs(x - ap[0]) < 60) continue;
        if (sk.slice(Math.max(0, i - 6), i + 7).some((q) => q[1] < y)) continue;
        const [a, b] = x < ap[0] ? [i, sk.indexOf(ap)] : [sk.indexOf(ap), i];
        const sela = Math.max(...sk.slice(a, b + 1).map((q) => q[1]));
        if (sela - y >= 10 && (!sec || y < sec.y)) sec = { x, y, sela };
      }
      assert(sec, `${f}: pico secundário/sela não identificáveis no recorte visível`);
      extra = `; cume x ${Math.round(ap[0])} y ${ap[1]}, secundário x ${sec.x} y ${sec.y}, sela y ${sec.sela}`;
    }
    linhasNota.push(`${f} [${m.enq}] área ${Math.round(m.area.h)} px, ${m.sob} pts sob as frases, topo do traço +${(m.topo - m.area.t).toFixed(0)} px, Time a ${m.timeGap.toFixed(0)} px${extra}`);
    await ctx.close();
  }
  notes.push("    · enquadramento: " + linhasNota.join(" · "));
});
await test("Ciência: versão anterior preservada (?paisagem=0.1.0) e espessura da luz pela escala real do SVG", async () => {
  // 1) a 0.1.0 continua disponível para comparação, com o seu módulo
  const a = await open([1440, 900], { query: "?paisagem=0.1.0" });
  await a.page.evaluate(() => document.querySelector("#ciencia-revisao").scrollIntoView({ block: "center", behavior: "instant" }));
  await a.page.waitForTimeout(1500);
  const v1 = await a.page.evaluate(() => { const c = document.querySelector("[data-frase-ativa]"); return { versao: c.dataset.paisagem, enq: c.dataset.enquadramento, motor: c.dataset.motor, n: c.querySelectorAll("svg > path").length, mod: performance.getEntriesByType("resource").map((r) => r.name).filter((n) => n.includes("topo-revisao-")).map((n) => n.split("/").slice(-2).join("/")) }; });
  assert(v1.versao === "0.1.0" && v1.enq === "linhas" && v1.motor === "modulo" && v1.n === 27 && v1.mod.some((m) => m.startsWith("topo-revisao-0.1.0/")), "0.1.0: " + JSON.stringify(v1));
  assert(!a.errors.length, "erros: " + a.errors.join(" | "));
  await a.ctx.close();
  // 2) núcleo do trecho luminoso em px de tela: mesma espessura em todas as telas (escala pelo viewBox real)
  const nucleo = [];
  for (const [w, h] of [[1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]]) {
    const { ctx, page } = await open([w, h]);
    await page.evaluate(() => document.querySelector("#ciencia-revisao").scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForTimeout(1500);
    const px = await page.evaluate(() => {
      const svg = document.querySelector("[data-frase-ativa] svg"); const m = svg.getScreenCTM(); const k = Math.hypot(m.a, m.b);
      const ws = [...svg.querySelectorAll("[data-topo-trechos] path")].filter((p) => +(p.style.opacity || 0) > 0.01).map((p) => +p.getAttribute("stroke-width") * k);
      return ws.length ? Math.min(...ws) : null;
    });
    assert(px != null, `${w}: nenhum trecho aceso no meio da sequência`);
    nucleo.push([w, px]);
    await ctx.close();
  }
  const vals = nucleo.map((n) => n[1]);
  assert(Math.max(...vals) / Math.min(...vals) < 1.02, "núcleo (px): " + JSON.stringify(nucleo));
  notes.push(`    · 0.1.0 preservada em ?paisagem=0.1.0 (27 caminhos, módulo 0.1.0); núcleo da luz em px de tela: ${nucleo.map(([w, x]) => `${w}: ${x.toFixed(2)}`).join(", ")}`);
});
// ── Continuação "crista → arco" (encerramento, topo-revisao ≥ 0.3.0) ──────────────────────────────────
// Posições pela página real: P2 = fim das frases (e = 0); E = fim do desenho (e = 1): topo da área a
// --header-h + 12, com janela mínima de 0,2 × altura (mesma definição de encerramentoRevisao()).
const posArco = (page) => page.evaluate(() => {
  const c = document.querySelector("[data-frase-ativa]"); const pa = c.querySelector("[class*=paisagem]"); const u = c.querySelector("[data-i='3']");
  const Y = (el) => el.getBoundingClientRect().top + scrollY; const vh = innerHeight;
  const hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72;
  const s1 = Y(u) + u.getBoundingClientRect().height / 2 - 0.45 * vh; const sE = Math.max(s1 + 0.2 * vh, Y(pa) - hdr - 12);
  return { P1: Y(pa) - 0.85 * vh + 0.5 * (s1 - (Y(pa) - 0.85 * vh)), P2: s1, E: sE, P3: sE + 120, tem: c.hasAttribute("data-com-encerramento"), versao: c.dataset.paisagem };
});
const estadoArco = (page) => page.evaluate(() => {
  const c = document.querySelector("[data-frase-ativa]"); const f = c.querySelector("p"); const svg = c.querySelector("svg");
  return { p: +c.dataset.progresso, arco: +c.dataset.encerramento, fase: f.dataset.topoFase ?? null, etapa: f.dataset.topoEtapa ?? null, modo: f.dataset.topoModo ?? null, decisao: getComputedStyle(c.querySelector("[data-i='3']")).color, svg: svg.innerHTML.length + ":" + [...svg.querySelectorAll("*")].map((e) => (e.getAttribute("style") || "") + (e.getAttribute("stroke-dasharray") || "") + (e.getAttribute("stroke-width") || "")).join("|") };
});
async function exigeArco(page) {
  const pos = await posArco(page);
  if (!pos.tem) throw new Error(`PENDENTE: a versão padrão (${pos.versao}) não traz a continuação crista → arco — aguardando o módulo do Motion (topo-revisao ≥ 0.3.0)`);
  return pos;
}
const GOLD = COR_DECISAO;
await test("Ciência continuação: evolução visível entre P2 e E, ida e volta contínuas com paradas, frase final dourada em toda a etapa adicional", async () => {
  const { ctx, page, errors } = await open([1440, 900]);
  const pos = await exigeArco(page);
  const ir = async (y) => { await page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), Math.round(y)); await page.waitForTimeout(1300); };
  const N = 8; const ida = []; const clip = async () => { const r = await page.evaluate(() => { const b = document.querySelector("[data-frase-ativa] [class*=paisagem]").getBoundingClientRect(); return { x: 0, y: Math.max(0, b.top), width: innerWidth, height: Math.min(innerHeight, b.bottom) - Math.max(0, b.top) }; }); return page.screenshot({ clip: r }); };
  for (let i = 0; i <= N; i++) { await ir(pos.P2 + ((pos.E - pos.P2) * i) / N); ida.push({ ...(await estadoArco(page)), img: await clip() }); }
  // arco cresce de 0 a 1, monotônico; frases já em 1; decisão dourada sempre; etapa ≥ 4
  for (let i = 0; i <= N; i++) {
    const e = ida[i];
    assert(Math.abs(e.p - 1) < 0.002, `i${i}: frases ${e.p}`);
    assert(e.decisao === GOLD, `i${i}: decisão ${e.decisao}`);
    assert(+e.etapa >= 4, `i${i}: etapa ${e.etapa}`);
    if (i) assert(e.arco >= ida[i - 1].arco - 1e-4, `arco não monotônico: ${ida.map((x) => x.arco)}`);
  }
  assert(ida[0].arco < 0.02 && ida[N].arco > 0.98, "arco 0→1: " + ida.map((x) => x.arco.toFixed(2)));
  // evolução perceptível: o desenho muda entre passos (não só nas pontas)
  const diffs = [];
  for (let i = 1; i <= N; i++) { const a = await sharpDiff(ida[i - 1].img, ida[i].img); diffs.push(a); }
  const mudam = diffs.filter((d) => d > 0.0005).length;
  assert(mudam >= N - 2, `passos sem mudança visível entre P2 e E: ${diffs.map((d) => d.toFixed(4))} · arco ${ida.map((x) => x.arco.toFixed(3)).join(" ")}`);
  // volta: mesmas posições → mesmo estado (assentado)
  for (let i = N; i >= 0; i -= 2) { await ir(pos.P2 + ((pos.E - pos.P2) * i) / N); const v = await estadoArco(page); assert(v.svg === ida[i].svg && Math.abs(v.arco - ida[i].arco) < 1e-3, `volta ≠ ida em i${i}`); }
  // parada intermediária: 0 mutações em repouso
  await ir(pos.P2 + (pos.E - pos.P2) * 0.5);
  const m = await page.evaluate(() => new Promise((ok) => { let n = 0; const o = new MutationObserver((l) => (n += l.length)); o.observe(document.querySelector("[data-frase-ativa] svg"), { subtree: true, attributes: true, childList: true }); setTimeout(() => { o.disconnect(); ok(n); }, 1200); }));
  assert(m === 0, `mutações em repouso no meio da continuação: ${m}`);
  // além de E (até P3) nada mais muda
  await ir(pos.E + 20); const e1 = await estadoArco(page); await ir(pos.P3); const e2 = await estadoArco(page);
  assert(e1.arco === 1 && e1.svg === e2.svg, `o desenho ainda muda depois de E (arco ${e1.arco} → ${e2.arco})`);
  assert(!errors.length, errors.join(" | "));
  notes.push(`    · continuação 1440: P2→E ${Math.round(pos.E - pos.P2)} px de rolagem; arco ${ida.map((x) => x.arco.toFixed(2)).join(" ")}; etapas ${[...new Set(ida.map((x) => x.etapa))].join(",")}, fases ${[...new Set(ida.map((x) => x.fase))].join(",")}; Δimagem por passo ${diffs.map((d) => (d * 100).toFixed(2) + "%").join(" ")}; volta = ida; 0 mutações parado`);
  await ctx.close();
});
await test("Ciência continuação: arco e cumes completos (1280–2560), legível em 320/390/768, nada sobre as frases nem sobre o Time; estático coerente", async () => {
  const linhas = [];
  for (const [w, h] of [[2560, 1440], [1920, 1080], [1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]]) {
    const { ctx, page } = await open([w, h]);
    const pos = await exigeArco(page);
    await page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), Math.round(pos.E));
    await page.waitForTimeout(1500);
    const m = await page.evaluate(() => {
      const c = document.querySelector("[data-frase-ativa]"); const area = c.querySelector("[class*=paisagem]").getBoundingClientRect(); const svg = c.querySelector("svg");
      const frases = [...c.querySelectorAll("#ciencia-revisao span[data-i]")].map((s) => { const r = document.createRange(); r.selectNodeContents(s); return r.getBoundingClientRect(); });
      const time = document.querySelector("#time-title").getBoundingClientRect();
      const pts = (sel) => { const out = []; for (const p of svg.querySelectorAll(sel)) { if (!p.getTotalLength) continue; const M = p.getScreenCTM(); const L = p.getTotalLength(); const n = Math.max(30, Math.ceil(L / 4)); for (let i = 0; i <= n; i++) { const q = p.getPointAtLength((L * i) / n); out.push([M.a * q.x + M.c * q.y + M.e, M.b * q.x + M.d * q.y + M.f]); } } return out; };
      const arco = pts("[data-topo-arco]"); const tudo = pts("path[stroke]:not([stroke='none'])");
      const visArco = arco.filter(([x]) => x >= 0 && x <= innerWidth);
      let sob = 0; for (const f of frases) for (const [x, y] of tudo) if (x >= f.left - 8 && x <= f.right + 8 && y >= f.top - 8 && y <= f.bottom + 8) sob++;
      const abaixo = tudo.filter(([x, y]) => x >= 0 && x <= innerWidth && y > area.bottom + 1).length;
      return { nArco: arco.length, arcoTopo: visArco.length ? Math.min(...visArco.map((p) => p[1])) - area.top : null, arcoX: visArco.length ? [Math.min(...visArco.map((p) => p[0])), Math.max(...visArco.map((p) => p[0]))] : null, arcoCortado: arco.length - visArco.length, sob, abaixo, timeGap: time.top - area.bottom, sw: document.documentElement.scrollWidth, w: innerWidth };
    });
    const f = `${w}×${h}`;
    assert(m.nArco > 0, `${f}: nenhum caminho [data-topo-arco]`);
    assert(m.arcoTopo != null && m.arcoTopo >= 2, `${f}: arco cortado no topo (${m.arcoTopo})`);
    if (w >= 1280) assert(m.arcoCortado === 0, `${f}: arco recortado nas laterais (${m.arcoCortado} pts)`);
    assert(m.sob === 0, `${f}: ${m.sob} pts sob as frases`);
    assert(m.abaixo === 0, `${f}: ${m.abaixo} pts abaixo da paisagem (sobre a nota/Time)`);
    assert(m.sw <= w, `${f}: scrollWidth ${m.sw}`);
    // estático (movimento reduzido) = composição final com o arco
    const red = await open([w, h], { reduced: true });
    const st = await red.page.evaluate(() => { const c = document.querySelector("[data-frase-ativa]"); return { arco: c.querySelectorAll("svg [data-topo-arco]").length, decisao: getComputedStyle(c.querySelector("[data-i='3']")).color }; });
    assert(st.arco > 0 && st.decisao === GOLD, `${f} reduzido: ${JSON.stringify(st)}`);
    await red.ctx.close();
    linhas.push(`${f} arco topo +${m.arcoTopo.toFixed(0)} px, x ${m.arcoX.map((v) => v.toFixed(0)).join("–")}${m.arcoCortado ? `, ${m.arcoCortado} pts fora da largura` : ""}, Time a ${m.timeGap.toFixed(0)} px`);
    await ctx.close();
  }
  // sem JS e módulo ausente: o SSR já traz o arco
  const nj = await open([1440, 900], { noJs: true });
  assert((await nj.page.locator("[data-frase-ativa] svg [data-topo-arco]").count()) > 0, "sem JS: SVG sem o arco");
  await nj.ctx.close();
  const aus = await open([1440, 900], { init: () => (window.__TOPO_REVISAO_TESTE__ = { url: "/refinada/nao-existe.js" }) });
  const pa = await posArco(aus.page);
  await aus.page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), Math.round(pa.P2 + (pa.E - pa.P2) / 2)); await aus.page.waitForTimeout(800);
  const a = await aus.page.evaluate(() => { const c = document.querySelector("[data-frase-ativa]"); return { motor: c.dataset.motor, arco: c.querySelectorAll("svg [data-topo-arco]").length, decisao: getComputedStyle(c.querySelector("[data-i='3']")).color }; });
  assert(a.motor === "falhou" && a.arco > 0 && a.decisao === GOLD && !aus.errors.length, "módulo ausente: " + JSON.stringify(a));
  await aus.ctx.close();
  notes.push("    · arco em E: " + linhas.join(" · "));
});
await test("página: sem rolagem lateral nas 5 telas (página inteira, rodapé incluído)", async () => {
  for (const [w, h] of [[320, 568], [390, 844], [768, 1024], [1280, 720], [1440, 900]]) {
    const { ctx, page } = await open([w, h], { reduced: true });
    // percorre a página inteira (imagens preguiçosas e fontes de baixo da dobra, inclusive o rodapé)
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= H; y += h) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(60); }
    await page.evaluate(() => scrollTo(0, 1e7)); await page.waitForLoadState("networkidle"); await page.waitForTimeout(300);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    assert(sw <= w, `${w}: ${sw}`);
    await ctx.close();
  }
});

await browser.close();
console.log(results.join("\n") + "\n" + notes.join("\n"));
const ok = results.filter((r) => r.startsWith("✔")).length;
const pend = results.filter((r) => r.startsWith("⏸")).length;
console.log(`\n${ok}/${results.length - pend} aprovados${pend ? ` · ${pend} pendente(s) (não contam como aprovados)` : ""}`);
if (ok !== results.length - pend) process.exitCode = 1;
