/**
 * Verificações da rodada 06 (Playwright/Chromium, servidor em :3000).
 *   node tests/r06.mjs              → página principal (build normal, sem harness)
 *   HARNESS=1 node tests/r06.mjs    → também /teste/produto (build e start com ARARAT_HARNESS=1)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const results = [];
const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};
async function test(name, fn) {
  try {
    await fn();
    results.push(`✔ ${name}`);
  } catch (e) {
    results.push(`✘ ${name}\n    ${e.message.split("\n")[0]}`);
  }
}
const browser = await chromium.launch();
async function open(path = "/", viewport = { width: 1440, height: 900 }, opts = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("request", (r) => requests.push(r.url()));
  if (opts.seen !== false)
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("ararat:intro", "1");
        if (window.__pause) sessionStorage.setItem("ararat:paused", "1");
      } catch {}
    });
  if (opts.paused) await page.addInitScript(() => sessionStorage.setItem("ararat:paused", "1"));
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  return { page, context, errors, requests };
}

await test("cabeçalho 320/360/390 (fechado e com menu aberto): marca inteira na própria caixa e afastada do menu", async () => {
  for (const w of [320, 360, 390]) {
    const { page, context } = await open("/", { width: w, height: 780 });
    for (const phase of ["fechado", "aberto"]) {
      if (phase === "aberto") {
        await page.locator("header button[aria-expanded]").first().click();
        await page.waitForTimeout(300);
      }
      const r = await page.evaluate(() => {
        const brand = document.querySelector("header a[class*='brand']");
        const b = brand.getBoundingClientRect();
        const kids = [...brand.querySelectorAll("*")].map((e) => e.getBoundingClientRect()).filter((x) => x.width);
        const menu = document.querySelector("header button[aria-expanded]").getBoundingClientRect();
        return {
          right: Math.max(...kids.map((k) => k.right)),
          left: Math.min(...kids.map((k) => k.left)),
          bl: b.left,
          br: b.right,
          menuL: menu.left,
          menuW: menu.width,
          menuH: menu.height,
        };
      });
      assert(r.right <= r.br + 0.5 && r.left >= r.bl - 0.5, `${w} ${phase}: filhos excedem a caixa da marca`);
      assert(r.menuL - r.right >= 8, `${w} ${phase}: folga marca→menu ${(r.menuL - r.right).toFixed(1)} px`);
      assert(r.menuW >= 44 && r.menuH >= 44, `${w}: área de toque do menu ${r.menuW}×${r.menuH}`);
    }
    await context.close();
  }
});

await test("sem rolagem horizontal em 320, 360, 390, 768 e 1440", async () => {
  for (const w of [320, 360, 390, 768, 1440]) {
    const { page, context } = await open("/", { width: w, height: 800 });
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    assert(sw <= w, `${w}: scrollWidth ${sw}`);
    await context.close();
  }
});

await test("passagem entre Jornada e Plataforma: entra uma vez; estática com pausa e movimento reduzido", async () => {
  const { page, context } = await open();
  const order = await page.evaluate(() => [...document.querySelectorAll("main > section")].map((s) => s.id).join(","));
  assert(/jornada,passagem,plataforma/.test(order), order);
  assert((await page.locator("#passagem-title").innerText()).replace(/\s+/g, " ").trim() === "Da explicação à revisão.", "título");
  const trace = page.locator("#passagem [data-reveal='trace']");
  assert((await trace.getAttribute("data-reveal-state")) === "pending", "traço não pendente antes de entrar");
  await page.locator("#passagem").evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(1300);
  assert((await trace.getAttribute("data-reveal-state")) === "in", "traço não entrou");
  const fin = await page.evaluate(() => ({
    line: getComputedStyle(document.querySelector("#passagem [class*='line']")).transform,
    arc: getComputedStyle(document.querySelector("#passagem svg path")).strokeDashoffset,
  }));
  const ident = (t) => t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)";
  assert(ident(fin.line) && parseFloat(fin.arc) === 0, `estado final ${JSON.stringify(fin)}`);
  // sem rolagem presa: a página continua rolando
  const y0 = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(300);
  assert((await page.evaluate(() => scrollY)) > y0 + 300, "rolagem não avançou");
  await context.close();
  for (const mode of ["paused", "reduced"]) {
    const o = await open("/", undefined, { paused: mode === "paused", reduced: mode === "reduced" });
    const st = await o.page.evaluate(() => ({
      anim: getComputedStyle(document.querySelector("#passagem [class*='line']")).animationName,
      line: getComputedStyle(document.querySelector("#passagem [class*='line']")).transform,
      arc: getComputedStyle(document.querySelector("#passagem svg path")).strokeDashoffset,
    }));
    assert(st.anim === "none" && st.line === "none" && parseFloat(st.arc) === 0, `${mode}: ${JSON.stringify(st)}`);
    await o.context.close();
  }
});

await test("Plataforma sem mídia: faixa de 4 etapas, Hub real, aviso do Viewer; nenhum pedido a /product/", async () => {
  const { page, context, requests, errors } = await open();
  await page.locator("#plataforma").evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
  await page.waitForTimeout(600);
  assert((await page.locator("#plataforma ol[aria-label='Percurso de uso'] > li").count()) === 4, "faixa ≠ 4 etapas");
  assert(await page.getByText("Capturas do Viewer em preparação.").isVisible(), "aviso do Viewer");
  assert((await page.locator("[aria-label='Etapas do percurso no produto']").count()) === 0, "ProductDemo montado sem material");
  assert(!requests.some((u) => u.includes("/product/")), "pedido a /product/");
  assert(!(await page.getByText(/Ver demonstração/).count()), "CTA 'Ver demonstração' presente");
  assert((await page.locator("header").getByRole("link", { name: "Explorar a jornada" }).count()) >= 1, "CTA do topo alterado");
  assert(errors.length === 0, errors.join(" | "));
  await context.close();
});

await test("Explicabilidade: cada escolha troca destaque e leitura (origem → aspecto → contribuição); teclado; sem aria-live", async () => {
  const { page, context } = await open();
  await page.locator("#explicabilidade").evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
  assert((await page.locator("#explicabilidade [aria-live]").count()) === 0, "aria-live presente");
  const expected = { Forma: "forma", Textura: "textura", Intensidade: "intensidade" };
  for (const [name, key] of Object.entries(expected)) {
    await page.locator("#explicabilidade").getByRole("button", { name }).click();
    const st = await page.evaluate(() => ({
      sel: document.querySelector("#explicabilidade svg[data-selected]").getAttribute("data-selected"),
      steps: [...document.querySelectorAll("#xai-reading > li > p")].map((p) => p.textContent),
      active: document.querySelector("#xai-reading li[data-active]")?.textContent,
    }));
    assert(st.sel === key, `${name}: destaque ${st.sel}`);
    assert(st.steps.length === 3 && st.steps.every((t) => t.length > 20), `${name}: leitura incompleta`);
    assert(st.steps[1].startsWith(`${name}:`), `${name}: aspecto não corresponde`);
    assert(st.active?.startsWith(name), `${name}: barra ativa ${st.active}`);
  }
  // teclado
  await page.locator("#explicabilidade").getByRole("button", { name: "Forma" }).focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  assert((await page.locator("#explicabilidade svg[data-selected]").getAttribute("data-selected")) === "textura", "Tab+Enter não selecionou");
  const txt = await page.locator("#explicabilidade").innerText();
  assert(!/SHAP|probabilidade|\d+\s?%/.test(txt), "valor/método numérico exibido");
  await context.close();
});

await test("Ciência: escopo, princípios, limites; evidências ocultas; princípios marcados como não-resultado", async () => {
  const { page, context } = await open();
  const heads = await page.$$eval("#ciencia h3", (h) => h.map((x) => x.textContent.trim()));
  assert(["Escopo", "Princípios de avaliação", "Limites de interpretação"].every((t) => heads.includes(t)), heads.join("|"));
  assert(!heads.includes("Publicações e resultados"), "encaixe de evidências visível sem conteúdo");
  assert(/não são, por si, resultados/.test(await page.locator("#ciencia").innerText()), "nota de princípio ausente");
  const reveal = await page.locator("#ciencia [data-reveal]").count();
  assert(reveal === 0, `Ciência com ${reveal} blocos animados`);
  await context.close();
});

await test("Contato: duas intenções com links reais (#plataforma, #ciencia); sem formulário, mailto ou envio", async () => {
  const { page, context } = await open();
  const links = await page.$$eval("#contato a", (as) => as.map((a) => [a.textContent.replace(/\s+/g, "").trim(), a.getAttribute("href")]));
  assert(JSON.stringify(links) === JSON.stringify([["Explorarofluxo→", "#plataforma"], ["Conhecerosprincípios→", "#ciencia"]]), JSON.stringify(links));
  assert((await page.locator("#contato form, #contato input, #contato textarea, a[href^='mailto:']").count()) === 0, "formulário/mailto");
  assert(await page.locator("#contato [role=note]").isVisible(), "nota de canal");
  await page.locator("#contato").getByRole("link", { name: /Conhecer os princípios/ }).click();
  await page.waitForTimeout(900);
  const top = await page.locator("#ciencia").evaluate((el) => el.getBoundingClientRect().top);
  assert(Math.abs(top) < 120, `Ciência não chegou ao topo (${top})`);
  await context.close();
});

await test("hash profundo /#ciencia: sem abertura, seção no topo, sem erros", async () => {
  const { page, context, errors } = await open("/#ciencia", undefined, { seen: false });
  assert((await page.locator("#ararat-intro").count()) === 0, "abertura tocou com hash");
  const top = await page.locator("#ciencia").evaluate((el) => el.getBoundingClientRect().top);
  assert(Math.abs(top) < 120, `topo ${top}`);
  assert(errors.length === 0, errors.join(" | "));
  await context.close();
});

await test("RM: aviso local visível antes da hidratação em rede lenta e oculto após a chegada", async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 90000 });
  page.goto(BASE + "/").catch(() => {});
  const seen = await page
    .waitForFunction(
      () => {
        const s = document.querySelector("#inicio svg[data-mri-state]");
        const t = s?.querySelector("[data-mri-wait]");
        return s?.getAttribute("data-mri-state") === "initial" && t && getComputedStyle(t).visibility === "visible" && Number(getComputedStyle(t).opacity) > 0.9;
      },
      null,
      { timeout: 6000, polling: 50 },
    )
    .then(() => true)
    .catch(() => false);
  assert(seen, "aviso não ficou visível no estado inicial (antes da hidratação)");
  await page.waitForFunction(() => document.querySelector("#inicio svg")?.getAttribute("data-mri-state") === "loaded", null, { timeout: 15000 });
  const vis = await page.locator("#inicio [data-mri-wait]").evaluate((el) => getComputedStyle(el).visibility);
  assert(vis === "hidden", `aviso ainda ${vis}`);
  assert((await page.locator("#ararat-mri-gate").count()) === 0, "portão não liberado");
  await context.close();
});

if (process.env.HARNESS) {
  const act = (p) => p.evaluate(() => [...document.querySelectorAll("button[aria-pressed]")].findIndex((b) => b.getAttribute("aria-pressed") === "true"));
  await test("ProductDemo (TESTE DE LAYOUT): sticky limitado ao capítulo; rolagem seleciona; clique não se desfaz", async () => {
    const { page, context, errors } = await open("/teste/produto");
    assert(await page.getByText(/TESTE DE LAYOUT — placas neutras/).isVisible(), "rótulo de teste");
    assert(!(await page.getByText(/Capturas reais do ARARAT/).count()), "crédito de captura real no teste");
    const tops = [];
    const seq = [];
    // Amostras dentro do trecho em que o quadro deve ficar fixo (limites reais do capítulo).
    const g = await page.evaluate(() => {
      const sec = document.querySelector("#plataforma-teste").getBoundingClientRect();
      const fig = document.querySelector("figure").getBoundingClientRect();
      const stickTop = parseFloat(getComputedStyle(document.querySelector("figure").parentElement).top);
      return { figTop: fig.top + scrollY, stickTop, bottom: sec.bottom + scrollY, h: fig.height };
    });
    const from = g.figTop - g.stickTop + 40; // já colado no topo
    const to = g.bottom - g.h - 260;
    const ys = [0, 1, 2, 3].map((i) => Math.round(from + ((to - from) * i) / 3));
    for (const y of ys) {
      await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
      await page.waitForTimeout(300);
      tops.push(Math.round(await page.locator("figure").first().evaluate((el) => el.getBoundingClientRect().top)));
      seq.push(await act(page));
    }
    assert(new Set(tops).size === 1, `quadro não ficou fixo: ${tops}`);
    assert(seq.join() === [...seq].sort().join() && new Set(seq).size >= 3, `seleção por rolagem: ${seq}`);
    await page.evaluate(() => window.scrollTo({ top: 6000, behavior: "instant" }));
    await page.waitForTimeout(300);
    const after = await page.locator("figure").first().evaluate((el) => el.getBoundingClientRect().bottom);
    assert(after < 0, "quadro continuou fixo depois do capítulo");
    await page.evaluate(() => window.scrollTo({ top: 2500, behavior: "instant" }));
    await page.waitForTimeout(300);
    await page.locator("button[aria-pressed]").nth(0).click();
    const hold = [];
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(80);
      hold.push(await act(page));
    }
    assert(hold.every((v) => v === 0), `seleção clicada se desfez: ${hold}`);
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(700);
    assert((await act(page)) > 0, "rolagem não voltou a selecionar após o clique");
    assert(errors.length === 0, errors.join(" | "));
    await context.close();
  });

  await test("ProductDemo móvel: quadro → controles → resumo; sem comentários longos; clique troca captura; teclado", async () => {
    const { page, context } = await open("/teste/produto", { width: 390, height: 844 });
    const lay = await page.evaluate(() => {
      const f = document.querySelector("figure").getBoundingClientRect();
      const c = document.querySelector("[aria-label='Etapas do percurso no produto']").getBoundingClientRect();
      const s = document.querySelector("[class*='summaryText']").getBoundingClientRect();
      return { f: f.bottom, c0: c.top, c1: c.bottom, s: s.top, ol: getComputedStyle(document.querySelector("ol[aria-label='Comentários das etapas']")).display, sw: document.documentElement.scrollWidth };
    });
    assert(lay.f <= lay.c0 && lay.c1 <= lay.s, `ordem ${JSON.stringify(lay)}`);
    assert(lay.ol === "none" && lay.sw <= 390, JSON.stringify(lay));
    await page.locator("button[aria-pressed]").nth(1).focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    assert((await act(page)) === 2, "teclado não selecionou a 3ª etapa");
    const shown = await page.locator("figure img[data-active]").getAttribute("alt");
    assert(/neutra B/.test(shown ?? ""), `captura ativa ${shown}`);
    assert(/TESTE 3/.test(await page.locator("[class*='summaryText']").innerText()), "resumo não acompanhou");
    // estreitar → alargar → estreitar: rolagem não seleciona no móvel (observador desmontado)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(200);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("button[aria-pressed]").nth(0).click();
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(500);
    assert((await act(page)) === 0, "rolagem mudou a etapa no móvel");
    await context.close();
  });

  await test("ProductDemo: falha de captura mostra aviso local; pausa/reduzido trocam sem transição", async () => {
    const f = await open("/teste/produto?falha=1");
    await f.page.locator("button[aria-pressed]").nth(2).click();
    await f.page.waitForTimeout(400);
    assert(/Captura indisponível/.test((await f.page.locator("figure").innerText()) ?? ""), "sem aviso de falha");
    await f.context.close();
    const r = await open("/teste/produto", undefined, { reduced: true });
    const tr = await r.page.locator("figure img").first().evaluate((el) => getComputedStyle(el).transitionDuration);
    assert(tr === "0s", `transição com movimento reduzido: ${tr}`);
    await r.context.close();
  });
}

await browser.close();
console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("✘")).length;
console.log(`\n${results.length - fails}/${results.length} aprovados`);
process.exit(fails ? 1 : 0);
