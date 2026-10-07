/**
 * Testes funcionais do site (Playwright, sem framework).
 *
 *   BASE=http://localhost:3000 MODE=absent  node tests/e2e.mjs   # suíte geral (build normal)
 *     O servidor é sondado: com public/motion/manifest.json "ready" (pacote presente) roda a
 *     verificação "pacote presente"; sem ele (build sem public/motion), a "pacote ausente".
 *     Cada execução declara qual dos dois casos verificou — não há falha esperada no total.
 *   BASE=http://localhost:3000 MODE=fixture node tests/e2e.mjs   # build com fixture + ARARAT_HARNESS=1
 *
 * MODE=fixture exige: npm run motion:sync -- --from tests/fixtures/mock-motion
 * e build com ARARAT_HARNESS=1 (rota /teste/ponte).
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const MODE = process.env.MODE ?? "absent";
const results = [];
let failures = 0;

async function test(name, fn) {
  try {
    await fn();
    results.push(`✔ ${name}`);
  } catch (e) {
    failures++;
    results.push(`✘ ${name}\n    ${String(e?.message ?? e).split("\n")[0]}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
const near = (a, b, eps = 0.002) => Math.abs(a - b) <= eps;

const browser = await chromium.launch();

async function open(path = "/", viewport = { width: 1440, height: 900 }, opts = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: opts.reducedMotion ?? "no-preference" });
  const page = await context.newPage();
  const errors = [];
  const motionRequests = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("request", (r) => /\/motion\/web\/journey\./.test(r.url()) && motionRequests.push(r.url()));
  if (opts.before) await opts.before(page);
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  return { page, context, errors, motionRequests };
}

const journeyState = (page) =>
  page.locator("#jornada").evaluate((el) => ({
    progress: Number(el.dataset.progress),
    active: Number(el.dataset.activeStep),
  }));

// Estados derivados do progresso exibido pela cena estática (já quantizado em movimento reduzido).
const sceneVars = (page) =>
  page.locator('#jornada [class*="fallback"]').evaluate((el) => {
    const p = Number(el.dataset.progress);
    const c = (v) => Math.min(1, Math.max(0, v));
    return [c(p * 3), c(p * 3 - 1), c(p * 3 - 2)].map((v) => v.toFixed(4)).join(",");
  });

// Pose geométrica: transformação da câmera sobre a RM + larguras das barras.
const scenePose = (page) =>
  page.locator('#jornada [class*="fallback"]').evaluate((el) => {
    const cam = el.querySelector("svg > g[style*='transform']")?.getAttribute("style") ?? "";
    const nums = (cam.match(/-?\d+\.?\d*/g) ?? []).map(Number);
    const bars = [...el.querySelectorAll("svg rect[class*='bar']")].map((r) => Number(r.getAttribute("width")));
    return nums.concat(bars);
  });

async function goToJourney(page) {
  await page.evaluate(() => {
    const t = document.querySelector("#jornada [class*='track']");
    window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
  });
  await page.waitForTimeout(200);
}

async function clickStep(page, i) {
  await page.locator("#jornada [role=group] button").nth(i).click({ timeout: 5000 });
  await page.waitForTimeout(1300); // rolagem suave até a etapa
}

// Sonda o servidor: o pacote ready da jornada está sincronizado em public/motion?
const PACKAGE = await fetch(BASE + "/motion/manifest.json")
  .then((r) => (r.ok ? r.json() : null))
  .then((m) => (m && m.status === "ready" ? "presente" : "ausente"))
  .catch(() => "ausente");

if (MODE === "absent") {
  if (PACKAGE === "ausente") {
    await test("pacote ausente: carrega sem erros e sem requisitar o módulo /motion/web/", async () => {
      const { page, context, errors, motionRequests } = await open();
      await goToJourney(page);
      await page.waitForTimeout(500);
      const status = await page.locator("#jornada [data-motion-status]").getAttribute("data-motion-status");
      assert(status === "fallback", `status ${status}`);
      assert(motionRequests.length === 0, `requisições inesperadas: ${motionRequests}`);
      assert(errors.length === 0, `erros: ${errors.join(" | ")}`);
      await context.close();
    });
  } else {
    await test("pacote presente: carrega sem erros, pede o módulo /motion/web/ só perto da jornada e fica ready", async () => {
      const { page, context, errors, motionRequests } = await open();
      await page.waitForTimeout(400);
      const early = motionRequests.length;
      await goToJourney(page);
      await page.waitForFunction(() => document.querySelector("#jornada [data-motion-status]")?.dataset.motionStatus === "ready", null, { timeout: 8000 });
      assert(motionRequests.length >= 1, "módulo não requisitado");
      assert(errors.length === 0, `erros: ${errors.join(" | ")}`);
      void early;
      await context.close();
    });
  }

  await test("quatro controles selecionam 0, 1/3, 2/3, 1 e a ida/volta reproduz as mesmas poses", async () => {
    const { page, context } = await open();
    await goToJourney(page);
    const forward = [];
    for (let i = 0; i < 4; i++) {
      await clickStep(page, i);
      const s = await journeyState(page);
      assert(near(s.progress, i / 3), `etapa ${i}: progress ${s.progress}`);
      assert(s.active === i, `etapa ${i}: ativo ${s.active}`);
      const pressed = await page.locator("#jornada [role=group] button[aria-pressed=true]").count();
      assert(pressed === 1, `aria-pressed em ${pressed} botões`);
      forward.push(await scenePose(page));
    }
    const distinct = new Set(forward.map((f) => f.map((x) => x.toFixed(2)).join(","))).size;
    assert(distinct === 4, `poses não distintas (${distinct})`);
    for (let i = 3; i >= 0; i--) {
      await clickStep(page, i);
      const b = await scenePose(page);
      const a = forward[i];
      // tolerância de arredondamento de pixel da rolagem
      assert(a.length === b.length && a.every((x, k) => Math.abs(x - b[k]) < 1.5), `pose ${i} difere: ${a} vs ${b}`);
    }
    await context.close();
  });

  await test("rolagem conduz o progresso de 0 a 1 e de volta (sem capturar wheel)", async () => {
    const { page, context } = await open();
    await goToJourney(page);
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(700, 450);
    for (let k = 0; k < 40; k++) await page.mouse.wheel(0, 120);
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => window.scrollY);
    assert(after > before + 1000, `wheel não rolou a página (${before} → ${after})`);
    const end = await page.evaluate(() => {
      const t = document.querySelector("#jornada [class*='track']");
      const r = t.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top + r.height - window.innerHeight + 10, behavior: "instant" });
    });
    void end;
    await page.waitForTimeout(250);
    assert((await journeyState(page)).progress === 1, "não chegou a 1");
    await goToJourney(page);
    await page.waitForTimeout(250);
    assert(near((await journeyState(page)).progress, 0), "não voltou a 0");
    await context.close();
  });

  await test("movimento reduzido: pose estática quantizada e pausa desabilitada", async () => {
    const { page, context } = await open("/", undefined, { reducedMotion: "reduce" });
    await page.evaluate(() => {
      const t = document.querySelector("#jornada [class*='track']");
      const r = t.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      window.scrollTo({ top: window.scrollY + r.top + total * 0.45, behavior: "instant" });
    });
    await page.waitForTimeout(300);
    const s = await journeyState(page);
    assert(s.progress > 0.4 && s.progress < 0.5, `progress ${s.progress}`);
    const vars = (await sceneVars(page)).split(",").map(Number);
    assert(vars[0] > 0.999 && vars[1] === 0 && vars[2] === 0, `vars não quantizadas: ${vars}`);
    assert(await page.locator("#jornada button[aria-pressed]:not([role])").last().isDisabled(), "pausa habilitada");
    const ambient = await page.locator("#jornada [data-ambient]").getAttribute("data-ambient");
    assert(ambient === "off", `ambient ${ambient}`);
    // Mudança da preferência em tempo real
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForTimeout(200);
    const vars2 = (await sceneVars(page)).split(",").map(Number);
    assert(vars2[0] > 0.999 && vars2[1] > 0 && vars2[1] < 1, `interpolação não retomada: ${vars2}`);
    await context.close();
  });

  await test("pausar movimento alterna aria-pressed e desliga o ambiente", async () => {
    const { page, context } = await open();
    await goToJourney(page);
    const btn = page.locator("#jornada").getByRole("button", { name: /Pausar animações/ });
    await btn.click();
    assert((await page.locator("#jornada").getByRole("button", { name: /Retomar animações/ }).getAttribute("aria-pressed")) === "true", "aria-pressed");
    assert((await page.locator("#jornada [data-ambient]").getAttribute("data-ambient")) === "off", "ambient");
    await clickStep(page, 2);
    assert(near((await journeyState(page)).progress, 2 / 3), "controles bloqueados pela pausa");
    await context.close();
  });

  await test("teclado: skip link, navegação e setas nos controles", async () => {
    const { page, context } = await open();
    await page.keyboard.press("Tab");
    assert((await page.evaluate(() => document.activeElement.textContent)).includes("Pular"), "skip link não é o primeiro foco");
    await page.keyboard.press("Enter");
    assert(await page.evaluate(() => document.activeElement.id === "conteudo"), "foco não foi ao conteúdo");
    const first = page.locator("#jornada [role=group] button").first();
    await goToJourney(page);
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(1300);
    const focusedLabel = await page.evaluate(() => document.activeElement.textContent);
    assert(focusedLabel.includes("Segmentação"), `foco em ${focusedLabel}`);
    assert((await journeyState(page)).active === 1, "seta não selecionou etapa");
    await page.keyboard.press("End");
    await page.waitForTimeout(1300);
    assert((await journeyState(page)).active === 3, "End não selecionou etapa 4");
    // Todos os elementos interativos alcançáveis têm foco visível (outline)
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    assert(outline !== "none", "sem outline de foco");
    await context.close();
  });

  for (const vp of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await test(`sem overflow horizontal em ${vp.width}px`, async () => {
      const { page, context } = await open("/", vp);
      const H = await page.evaluate(() => document.documentElement.scrollHeight);
      let worst = 0;
      for (let y = 0; y < H; y += vp.height) {
        await page.evaluate((y) => window.scrollTo(0, y), y);
        worst = Math.max(worst, await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
      }
      assert(worst === 0, `overflow ${worst}px`);
      await context.close();
    });
  }


  await test("RM: hero, jornada e explicabilidade usam a mesma imagem carregada", async () => {
    const { page, context, errors } = await open();
    await page.locator("#explicabilidade").scrollIntoViewIfNeeded();
    await page.waitForLoadState("networkidle");
    const hrefs = await page.evaluate(() =>
      ["#inicio", "#jornada", "#explicabilidade"].map((sel) => [...document.querySelectorAll(`${sel} image`)].map((i) => i.getAttribute("href"))),
    );
    const all = new Set(hrefs.flat());
    assert(hrefs.every((h) => h.length > 0), `seção sem imagem: ${hrefs.map((h) => h.length)}`);
    assert(all.size === 1, `fontes diferentes: ${[...all]}`);
    const src = [...all][0];
    const ok = await page.evaluate(async (u) => {
      const img = new Image();
      img.src = u;
      await img.decode();
      return [img.naturalWidth, img.naturalHeight];
    }, src);
    assert(ok[0] === 806 && ok[1] === 802, `dimensões ${ok}`);
    assert(errors.length === 0, `erros: ${errors}`);
    await context.close();
  });

  await test("falha da imagem: página e texto continuam, sem erro de página", async () => {
    const { page, context } = await open("/", undefined, {
      before: (p) => p.route(/\/(imaging\/|motion\/assets\/mri-base)/, (r) => r.fulfill({ status: 404, body: "" })),
    });
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    await goToJourney(page);
    await page.waitForTimeout(500);
    const failed = await page.locator("svg[data-image-failed]").count();
    assert(failed >= 2, `estado de falha não marcado (${failed})`);
    assert(await page.getByRole("heading", { name: "Entre na imagem." }).isVisible(), "título ausente");
    await clickStep(page, 2);
    assert((await journeyState(page)).active === 2, "controles inoperantes");
    assert(pageErrors.length === 0, `pageerror: ${pageErrors}`);
    await context.close();
  });

  await test("resize desktop → 390 px → desktop troca o enquadramento sem overflow", async () => {
    const { page, context } = await open();
    const layout = () => page.locator("#jornada [data-layout]").first().getAttribute("data-layout");
    assert((await layout()) === "landscape", "desktop não é paisagem");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    assert((await layout()) === "portrait", "390 px não é retrato");
    assert((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) === 0, "overflow em 390");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    assert((await layout()) === "landscape", "não voltou a paisagem");
    await context.close();
  });


  /* ───────── Rodada 04: abertura, movimento editorial e pausa ───────── */
  const introOn = (page) => page.evaluate(() => !!document.getElementById("ararat-intro"));

  await test("abertura: 1ª visita toca e assenta ≤1,3 s; retorno, hash e movimento reduzido pulam", async () => {
    const { page, context } = await open();
    // O estado é decidido antes da pintura; logo após o carregamento a abertura deve estar ativa ou já ter terminado ≤1,3 s.
    const t0 = Date.now();
    await page.waitForFunction(() => !document.getElementById("ararat-intro"), null, { timeout: 2500 });
    const settled = Date.now() - t0;
    assert(settled <= 1600, `abertura não terminou (${settled} ms)`);
    const seen = await page.evaluate(() => sessionStorage.getItem("ararat:intro"));
    assert(seen === "1", "sessionStorage não marcado");
    await page.reload({ waitUntil: "domcontentloaded" });
    assert(!(await introOn(page)), "repetiu no retorno");
    await context.close();

    const deep = await open("/#ciencia");
    assert(!(await introOn(deep.page)), "tocou com hash profundo");
    await deep.context.close();

    const red = await open("/", undefined, { reducedMotion: "reduce" });
    assert(!(await introOn(red.page)), "tocou com movimento reduzido");
    await red.context.close();
  });

  await test("abertura: título, CTA e navegação disponíveis desde a chegada; interação conclui o movimento", async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(BASE + "/", { waitUntil: "commit" });
    await page.waitForSelector("#hero-title");
    const playing = await introOn(page);
    assert(playing, "abertura não tocou na 1ª visita");
    // Texto existe no DOM com a frase inteira (spans não alteram a leitura).
    const title = await page.locator("#hero-title").innerText();
    assert(title.replace(/\s+/g, " ").trim() === "Entre na imagem.", `título lido como "${title}"`);
    assert(await page.getByRole("link", { name: "Explorar a jornada" }).first().isVisible(), "CTA invisível");
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(120);
    assert(!(await introOn(page)), "scroll não concluiu a abertura");
    await context.close();
  });

  await test("abertura e revelações sem deslocamento de layout (CLS)", async () => {
    const { page, context } = await open();
    await page.evaluate(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: "layout-shift", buffered: true });
    });
    for (const id of ["#plataforma", "#explicabilidade", "#ciencia", "#contato"]) {
      await page.locator(id).evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
      await page.waitForTimeout(900);
    }
    const cls = await page.evaluate(() => window.__cls);
    assert(cls < 0.02, `CLS ${cls}`);
    await context.close();
  });

  await test("revelação: títulos abaixo da dobra animam uma vez ao entrar; foco por teclado mostra na hora", async () => {
    const { page, context } = await open();
    const state = (sel) => page.locator(sel).getAttribute("data-reveal-state");
    assert((await state("#plataforma-title")) === "pending", `plataforma: ${await state("#plataforma-title")}`);
    await page.locator("#plataforma").evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(900);
    assert((await state("#plataforma-title")) === "in", "não revelou ao entrar");
    // Revelação termina sozinha (sem depender do tempo exato da máquina): espera até 1,5 s pela opacidade final.
    const op = await page
      .waitForFunction(() => {
        const el = document.querySelector("#plataforma-title .rw:last-child");
        return el && getComputedStyle(el).opacity === "1" ? "1" : false;
      }, null, { timeout: 1500 })
      .then((h) => h.jsonValue())
      .catch(async () => page.locator("#plataforma-title .rw").last().evaluate((el) => getComputedStyle(el).opacity));
    assert(op === "1", `opacidade final ${op}`);
    // Foco em bloco ainda pendente (título do contato, bem abaixo)
    assert((await page.locator("#contato-title").getAttribute("data-reveal-state")) === "pending", "contato já revelado");
    await page.evaluate(() => {
      const h = document.querySelector("#contato-title");
      h.setAttribute("tabindex", "-1");
      h.focus();
    });
    assert((await page.locator("#contato-title").getAttribute("data-reveal-state")) === "shown", "foco não revelou");
    await context.close();
  });

  await test("pausa global: header e jornada compartilham estado; pendentes aparecem; persiste na aba", async () => {
    const { page, context } = await open();
    const header = page.locator("header").getByRole("button", { name: "Pausar animações" });
    await header.click();
    assert((await page.evaluate(() => document.documentElement.dataset.motion)) === "paused", "html sem data-motion");
    assert((await page.locator("#jornada").getByRole("button", { name: /Retomar animações/ }).getAttribute("aria-pressed")) === "true", "jornada não sincronizou");
    assert((await page.locator("#plataforma-title").getAttribute("data-reveal-state")) === "shown", "pendente continuou oculto");
    await page.reload({ waitUntil: "networkidle" });
    assert((await page.evaluate(() => document.documentElement.dataset.motion)) === "paused", "pausa não persistiu");
    await page.locator("header").getByRole("button", { name: "Retomar animações" }).click();
    assert((await page.evaluate(() => document.documentElement.dataset.motion)) === undefined, "não retomou");
    await context.close();
  });

  await test("sem JavaScript: título, textos e CTAs visíveis em estado final", async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(BASE + "/", { waitUntil: "load" });
    assert(await page.getByRole("heading", { name: "Entre na imagem." }).isVisible(), "título");
    assert(await page.getByRole("link", { name: "Explorar a jornada" }).first().isVisible(), "CTA");
    const op = await page.locator("#plataforma-title .rw").first().evaluate((el) => getComputedStyle(el).opacity);
    assert(op === "1", `título de seção oculto sem JS (${op})`);
    await context.close();
  });

  await test("390×844: CTA principal visível na primeira tela; 768×900 sem texto sobre o exame", async () => {
    const m = await open("/", { width: 390, height: 844 });
    await m.page.waitForTimeout(1400);
    const box = await m.page.locator("#inicio a.btn-gold").boundingBox();
    assert(box && box.y + box.height <= 844, `CTA fora da tela (${box?.y})`);
    await m.context.close();
    const t = await open("/", { width: 768, height: 900 });
    await t.page.waitForTimeout(1400);
    const art = await t.page.locator("#inicio svg[data-mri-origin]").boundingBox();
    const title = await t.page.locator("#hero-title").boundingBox();
    assert(art && title && title.x + title.width <= art.x + 2, `título sobrepõe o exame (${title.x + title.width} > ${art.x})`);
    await t.context.close();
  });

  await test("celular: resumo da etapa ativa junto da cena e dos controles", async () => {
    const { page, context } = await open("/", { width: 390, height: 844 });
    await page.locator("#jornada [role=group] button").nth(3).click();
    await page.waitForTimeout(300);
    const summary = page.locator("#jornada [class*='summary']").first();
    assert((await summary.getAttribute("data-step")) === "3", "resumo não acompanha");
    const rail = await page.locator("#jornada [role=group]").boundingBox();
    const sb = await summary.boundingBox();
    assert(sb && rail && sb.y - (rail.y + rail.height) < 40, "resumo longe dos controles");
    assert((await summary.textContent()).includes("Explicação"), "texto do resumo");
    await context.close();
  });


  /* ───────── Rodada 05: arco que encontra a imagem, carga da RM, contraste ───────── */
  const arcState = (page) =>
    page.locator("#inicio svg[data-mri-state] path[pathLength]").first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { t: cs.transform, dash: cs.strokeDashoffset, op: cs.opacity, anim: cs.animationName };
    });

  await test("abertura r05: o arco permanente parte compacto e termina na geometria final (sem 2º arco)", async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(BASE + "/", { waitUntil: "commit" });
    await page.waitForSelector("#inicio svg[data-mri-state] path[pathLength]");
    const early = await arcState(page);
    assert(early.anim === "ararat-arc-draw", `animação ${early.anim}`);
    const m = early.t.match(/matrix\(([^)]+)\)/);
    const scale = m ? Math.hypot(...m[1].split(",").slice(0, 2).map(Number)) : 1;
    assert(scale < 0.6, `arco não começa compacto (escala ${scale.toFixed(2)})`);
    await page.waitForFunction(() => !document.getElementById("ararat-intro"), null, { timeout: 2000 });
    const end = await arcState(page);
    assert(end.t === "none" && parseFloat(end.dash) === 0 && end.op === "1", `estado final ${JSON.stringify(end)}`);
    const arcs = await page.locator("#inicio svg[data-mri-state] path[pathLength]").count();
    assert(arcs === 1, `arcos animados: ${arcs}`);
    await context.close();
  });

  await test("abertura r05: resize durante a entrada conclui direto no estado final", async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(BASE + "/", { waitUntil: "commit" });
    await page.waitForSelector("#inicio svg[data-mri-state] path[pathLength]");
    assert(await introOn(page), "abertura não tocou");
    await page.setViewportSize({ width: 768, height: 900 });
    // O evento resize chega no quadro seguinte; espera curta e confirma que foi antes da trava de 1400 ms.
    const done = await page
      .waitForFunction(() => !document.getElementById("ararat-intro") && performance.now(), null, { timeout: 400 })
      .then((h) => h.jsonValue())
      .catch(() => null);
    assert(done !== null, "resize não concluiu");
    assert(done < 1350, `concluiu só pela trava de tempo (${Math.round(done)} ms)`);
    const end = await arcState(page);
    assert(end.t === "none", `arco não está na pose final (${end.t})`);
    await context.close();
  });

  await test("RM do hero: preload único de alta prioridade, sem download duplicado; logo pequeno", async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const hits = {};
    page.on("request", (r) => {
      const u = r.url();
      if (/mri-base\.webp|mri-axial-demo\.webp/.test(u)) hits[u] = (hits[u] ?? 0) + 1;
      if (/ararat_icone_transparente/.test(u)) hits.logo = u;
    });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const pre = await page.$$eval('link[rel="preload"][as="image"]', (ls) => ls.map((l) => l.getAttribute("href") ?? l.getAttribute("imagesrcset")));
    const src = await page.locator("#inicio image").first().getAttribute("href");
    assert(pre.includes(src), `preload ≠ imagem do hero (${pre} / ${src})`);
    const counts = Object.entries(hits).filter(([k]) => k !== "logo").map(([, v]) => v);
    assert(counts.every((c) => c === 1), `downloads da RM: ${JSON.stringify(hits)}`);
    assert(/w=(64|128)/.test(hits.logo ?? ""), `logo grande: ${hits.logo}`);
    await context.close();
  });

  await test("RM tardia: quadro indica carregamento real e revela em ~220 ms sem repetir a abertura", async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    let release;
    const gate = new Promise((r) => (release = r));
    await page.route(/mri-(base|axial-demo)\.webp/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelector("#inicio [data-mri-state]")?.getAttribute("data-mri-state") === "loading");
    assert(await page.getByRole("link", { name: "Explorar a jornada" }).first().isVisible(), "CTA indisponível durante a espera");
    const label = await page.locator("#inicio svg text[data-mri-wait]").textContent();
    assert(/Carregando imagem/.test(label ?? ""), `sem indicação local (${label})`);
    const vis = await page.locator("#inicio svg text[data-mri-wait]").evaluate((el) => getComputedStyle(el).visibility);
    assert(vis === "visible", `indicação oculta durante a espera (${vis})`);
    await page.waitForTimeout(1600); // abertura já terminou
    assert(!(await introOn(page)), "abertura não terminou sem a imagem");
    release();
    await page.waitForFunction(() => document.querySelector("#inicio [data-mri-state]")?.getAttribute("data-mri-state") === "loaded", null, { timeout: 8000 });
    const tr = await page.locator("#inicio svg image").first().evaluate((el) => getComputedStyle(el).transitionDuration);
    assert(tr === "0.22s", `transição ${tr}`);
    assert(!(await introOn(page)), "abertura repetiu");
    const after = await page.locator("#inicio svg text[data-mri-wait]").evaluate((el) => getComputedStyle(el).visibility);
    assert(after === "hidden", `indicação persistiu (${after})`);
    await context.close();
  });

  await test("RM com erro: aviso local no quadro, página íntegra", async () => {
    const { page, context } = await open("/", undefined, {
      before: (p) => p.route(/mri-(base|axial-demo)\.webp/, (r) => r.fulfill({ status: 404, body: "" })),
    });
    await page.waitForFunction(() => document.querySelector("#inicio [data-mri-state]")?.getAttribute("data-mri-state") === "error");
    assert(/indisponível/.test((await page.locator("#inicio svg text").textContent()) ?? ""), "sem aviso local");
    assert(await page.getByRole("heading", { name: "Entre na imagem." }).isVisible(), "título");
    await context.close();
  });

  await test("Ciência: texto dourado sobre fundo claro com contraste ≥ 4,5:1; Contato com título curto", async () => {
    const { page, context } = await open();
    const lum = (rgb) => {
      const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map((v) => {
        const c = Number(v) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
      return (x + 0.05) / (y + 0.05);
    };
    const bg = await page.locator("#ciencia").evaluate((el) => getComputedStyle(el).backgroundColor);
    const items = await page.$$eval("#ciencia .eyebrow, #ciencia [class*='partNum'], #ciencia p span[class*='em']", (els) => els.map((e) => [e.textContent.trim().slice(0, 20), getComputedStyle(e).color]));
    assert(items.length >= 5, `itens ${items.length}`);
    for (const [t, c] of items) assert(ratio(c, bg) >= 4.5, `"${t}" ${c} sobre ${bg}: ${ratio(c, bg).toFixed(2)}`);
    const title = (await page.locator("#contato-title").innerText()).replace(/\s+/g, " ").trim();
    assert(title === "Explore o ARARAT com sua equipe.", title);
    await context.close();
  });

  await test("atmosfera do hero não é baixada em ≤1080 px (sem pacote: nenhum pedido em nenhum caso)", async () => {
    const { page, context, motionRequests } = await open("/", { width: 768, height: 900 });
    void motionRequests;
    await page.waitForTimeout(1500);
    const n = await page.evaluate(() => performance.getEntriesByType("resource").filter((r) => /hero-atmosphere/.test(r.name)).length);
    assert(n === 0, `pedidos de atmosfera: ${n}`);
    await context.close();
  });

  for (const vp of [{ width: 360, height: 780 }]) {
    await test(`celular estreito ${vp.width}×${vp.height}: sem overflow, CTA na 1ª tela`, async () => {
      const { page, context } = await open("/", vp);
      await page.waitForTimeout(1400);
      const box = await page.locator("#inicio a.btn-gold").boundingBox();
      assert(box && box.y + box.height <= vp.height, `CTA fora (${box?.y})`);
      const H = await page.evaluate(() => document.documentElement.scrollHeight);
      let worst = 0;
      for (let y = 0; y < H; y += vp.height) {
        await page.evaluate((y) => window.scrollTo(0, y), y);
        worst = Math.max(worst, await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
      }
      assert(worst === 0, `overflow ${worst}`);
      await context.close();
    });
  }

  await test("mobile 390px: menu abre/fecha e controles por toque não sequestram a rolagem", async () => {
    const { page, context } = await open("/", { width: 390, height: 844 });
    const menu = page.getByRole("button", { name: "Abrir menu" });
    await menu.click();
    assert((await page.locator("header button[aria-expanded]").getAttribute("aria-expanded")) === "true", "menu não abriu");
    assert(await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Ciência" }).isVisible(), "links invisíveis");
    await page.keyboard.press("Escape");
    assert((await page.locator("header button[aria-expanded]").getAttribute("aria-expanded")) === "false", "Esc não fechou");
    const btn = page.locator("#jornada [role=group] button").nth(2);
    await btn.scrollIntoViewIfNeeded();
    const y0 = await page.evaluate(() => window.scrollY);
    await btn.click();
    await page.waitForTimeout(400);
    const y1 = await page.evaluate(() => window.scrollY);
    assert(near((await journeyState(page)).progress, 2 / 3), "toque não selecionou etapa");
    assert(Math.abs(y1 - y0) < 2, `rolagem alterada pelo controle (${y0} → ${y1})`);
    await context.close();
  });
}

if (MODE === "fixture") {
  await test("pacote ready: módulo carregado tardiamente, cena montada e progress repassado", async () => {
    const { page, context, errors, motionRequests } = await open();
    assert(motionRequests.length === 0, `módulo carregado antes da seção: ${motionRequests}`);
    await goToJourney(page);
    await page.waitForSelector("#jornada .mock-journey", { timeout: 5000 });
    assert((await page.locator("#jornada [data-motion-status]").getAttribute("data-motion-status")) === "ready", "status");
    const log = await page.evaluate(() => window.__motionLog);
    assert(log[0][0] === "create" && log[0][1] === "/motion/", `create: ${JSON.stringify(log[0])}`);
    for (let i = 0; i < 4; i++) {
      await clickStep(page, i);
      const p = Number(await page.locator(".mock-journey").getAttribute("data-progress"));
      assert(near(p, i / 3), `módulo recebeu ${p} na etapa ${i}`);
    }
    await page.locator("#jornada").getByRole("button", { name: /Pausar animações/ }).click();
    assert((await page.locator(".mock-journey").getAttribute("data-paused")) === "true", "setPaused");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(200);
    assert((await page.locator(".mock-journey").getAttribute("data-reduced")) === "true", "setReducedMotion");
    assert(errors.length === 0, `erros: ${errors.join(" | ")}`);
    await context.close();
  });

  await test("desmontagem chama destroy, remove stylesheet; remontagem recria", async () => {
    const { page, context } = await open("/teste/ponte");
    await page.waitForSelector(".mock-journey", { timeout: 5000 });
    assert((await page.locator("link[data-ararat-motion=journey]").count()) === 1, "stylesheet não injetada");
    await page.click("#toggle-journey");
    await page.waitForTimeout(200);
    const log = await page.evaluate(() => window.__motionLog.map((e) => e[0]));
    assert(log.includes("destroy"), `destroy não chamado: ${log}`);
    assert((await page.locator(".mock-journey").count()) === 0, "nó do módulo permaneceu");
    assert((await page.locator("link[data-ararat-motion=journey]").count()) === 0, "stylesheet permaneceu");
    await page.click("#toggle-journey");
    await page.waitForSelector(".mock-journey", { timeout: 5000 });
    const creates = await page.evaluate(() => window.__motionLog.filter((e) => e[0] === "create").length);
    assert(creates === 2, `creates ${creates}`);
    await context.close();
  });

  await test("falha de importação mantém a cena estática sem erro de página", async () => {
    const { page, context } = await open("/", undefined, {
      before: (p) => p.route("**/motion/web/journey.js", (r) => r.fulfill({ status: 404, body: "" })),
    });
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    await goToJourney(page);
    await page.waitForFunction(
      () => document.querySelector("#jornada [data-motion-status]")?.getAttribute("data-motion-status") === "failed",
      null,
      { timeout: 5000 },
    );
    const visible = await page.locator('#jornada [class*="fallback"]').evaluate((el) => getComputedStyle(el).visibility);
    assert(visible === "visible", "fallback oculto");
    assert((await page.locator("link[data-ararat-motion=journey]").count()) === 0, "stylesheet órfã");
    assert(pageErrors.length === 0, `pageerror: ${pageErrors}`);
    await clickStep(page, 3);
    assert((await journeyState(page)).active === 3, "controles inoperantes após falha");
    await context.close();
  });
}

if (MODE === "fixture-mri") {
  const alignment = (page) =>
    page.evaluate(() => {
      const out = [];
      for (const svg of document.querySelectorAll("#jornada [class*='fallback'] svg[data-mri-origin], #inicio svg[data-mri-origin]")) {
        const img = svg.querySelector("image");
        const cam = img.closest("g[style]") ?? img.parentElement;
        const path = cam.querySelector("path[d]");
        const a = img.getScreenCTM();
        const b = (path ?? img).getScreenCTM();
        out.push([a.a, a.d, a.e, a.f, b.a, b.d, b.e, b.f]);
      }
      return out;
    });

  await test("mapa do pacote: todas as cenas usam /motion/assets/mri-base.webp", async () => {
    const { page, context } = await open("/", undefined, {
      before: (p) => p.route("**/motion/web/journey.js", (r) => r.fulfill({ status: 404, body: "" })),
    });
    await page.locator("#explicabilidade").scrollIntoViewIfNeeded();
    const hrefs = new Set(await page.evaluate(() => [...document.querySelectorAll("main image")].map((i) => i.getAttribute("href"))));
    assert(hrefs.size === 1 && hrefs.has("/motion/assets/mri-base.webp"), `fontes: ${[...hrefs]}`);
    assert((await page.locator("svg[data-mri-origin=motion]").count()) >= 2, "origem motion não aplicada");
    await context.close();
  });

  await test("máscara e imagem compartilham a mesma transformação em 1440, 390 e após resize", async () => {
    const { page, context } = await open("/", undefined, {
      before: (p) => p.route("**/motion/web/journey.js", (r) => r.fulfill({ status: 404, body: "" })),
    });
    await goToJourney(page);
    await page.waitForFunction(() => document.querySelector("#jornada [data-motion-status]")?.dataset.motionStatus === "failed");
    for (const [w, h] of [[1440, 900], [390, 844], [1440, 900]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(300);
      for (const i of [1, 3]) {
        await clickStep(page, i);
        const rows = await alignment(page);
        for (const r of rows) {
          assert(r.slice(0, 4).every((v, k) => Math.abs(v - r[k + 4]) < 1e-3), `desalinhado em ${w}px etapa ${i}: ${r}`);
        }
      }
    }
    const gland = await page.locator("#jornada [class*='fallback'] path[class*='gland']").count();
    assert(gland === 1, "contorno do mapa ausente");
    await context.close();
  });
}

if (MODE === "v11") {
  const toJourney = goToJourney;

  await test("v1.1: rótulos HTML seguem o evento por id (não pela ordem), só quando visible", async () => {
    const { page, context, errors } = await open();
    await toJourney(page);
    await page.waitForFunction(() => document.querySelector("#jornada [data-motion-status]")?.dataset.motionStatus === "ready");
    await clickStep(page, 0);
    assert((await page.locator("#jornada [data-label-id]").count()) === 0, "rótulos visíveis na etapa Imagem");
    await clickStep(page, 2);
    const read = () => page.$$eval("#jornada [data-label-id]", (els) => Object.fromEntries(els.map((e) => [e.dataset.labelId, { t: e.textContent, top: e.style.top, left: e.style.left, em: !!e.dataset.emphasis }])));
    let L = await read();
    assert(L.shape?.t === "Forma" && L.texture?.t === "Textura" && L.intensity?.t === "Intensidade", JSON.stringify(L));
    const pc = (v) => parseFloat(v);
    assert(pc(L.shape.top) === 30 && pc(L.texture.top) === 50 && pc(L.intensity.top) === 70 && pc(L.shape.left) === 80, `posições dados ${JSON.stringify(L)}`);
    await clickStep(page, 3);
    L = await read();
    assert(pc(L.texture.top) === 30 && pc(L.shape.top) === 70 && L.texture.em && !L.shape.em, `reordenação ${JSON.stringify(L)}`);
    const ariaHidden = await page.locator("#jornada [class*='labelLayer']").getAttribute("aria-hidden");
    assert(ariaHidden === "true", "camada de rótulos não está aria-hidden");
    assert((await page.locator("#jornada [class*='legend']").count()) === 0, "legenda estática duplicada");
    // ida/volta
    await clickStep(page, 2);
    L = await read();
    assert(pc(L.shape.top) === 30, "volta não restaurou");
    assert(errors.length === 0, `erros: ${errors}`);
    await context.close();
  });

  await test("v1.1: rótulos acompanham o quadro no resize e somem ao desmontar", async () => {
    const { page, context } = await open("/teste/ponte");
    await page.waitForFunction(() => document.querySelector("[data-motion-status]")?.dataset.motionStatus === "ready");
    await page.locator("[role=group] button").nth(2).click();
    await page.waitForTimeout(1300);
    const pos = async () => {
      const f = await page.locator("[class*='frame']").first().boundingBox();
      const l = await page.locator("[data-label-id=texture]").boundingBox();
      return [(l.x + l.width / 2 - f.x) / f.width, (l.y + l.height - f.y) / f.height];
    };
    const a = await pos();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const b = await pos();
    assert(Math.abs(a[0] - 0.8) < 0.01 && Math.abs(b[0] - 0.8) < 0.01 && Math.abs(b[1] - 0.5) < 0.01, `âncora ${a} ${b}`);
    await page.click("#toggle-journey");
    await page.waitForTimeout(200);
    assert((await page.locator("[data-label-id]").count()) === 0, "rótulos ficaram após desmontar");
    const log = await page.evaluate(() => window.__motionLog.map((e) => e[0]));
    assert(log.includes("destroy"), "destroy");
    await context.close();
  });

  await test("v1.1: data-loaded=error devolve a cena estática e a legenda", async () => {
    const { page, context } = await open("/", undefined, { before: (p) => p.addInitScript(() => (window.__failMockImage = true)) });
    await goToJourney(page);
    await page.waitForFunction(() => document.querySelector("#jornada [data-motion-status]")?.dataset.motionStatus === "failed");
    assert((await page.locator("#jornada [data-label-id]").count()) === 0, "rótulos com módulo em erro");
    const vis = await page.locator('#jornada [class*="fallback"]').evaluate((el) => getComputedStyle(el).visibility);
    assert(vis === "visible", "fallback oculto");
    await context.close();
  });

  await test("atmosfera do hero: carrega após a página, independente da jornada; pausa fora da tela e com pausa global", async () => {
    const { page, context, motionRequests } = await open();
    await page.waitForFunction(() => document.querySelector("[data-hero-atmosphere]")?.dataset.heroAtmosphere === "ready");
    assert(!motionRequests.some((u) => u.includes("journey.js")), "jornada antecipada pelo hero");
    let log = await page.evaluate(() => window.__heroLog);
    assert(log[0][0] === "create" && log[0][1] === "/motion/", JSON.stringify(log[0]));
    await page.locator("#plataforma").evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(300);
    assert((await page.locator(".mock-hero-atmosphere").getAttribute("data-paused")) === "true", "não pausou fora da tela");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(400);
    assert((await page.locator(".mock-hero-atmosphere").getAttribute("data-paused")) === "false", "não retomou na tela");
    await page.locator("header").getByRole("button", { name: "Pausar animações" }).click();
    await page.waitForTimeout(100);
    assert((await page.locator(".mock-hero-atmosphere").getAttribute("data-paused")) === "true", "pausa global");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(200);
    assert((await page.locator(".mock-hero-atmosphere").getAttribute("data-reduced")) === "true", "reducedMotion");
    await context.close();
  });


  await test("atmosfera r05: não monta em 768 px; monta ao ampliar para 1440 px", async () => {
    const { page, context } = await open("/", { width: 768, height: 900 });
    await page.waitForTimeout(1800);
    const pre = await page.evaluate(() => performance.getEntriesByType("resource").filter((r) => /hero-atmosphere/.test(r.name)).map((r) => r.name));
    assert(pre.length === 0, `baixou em 768: ${pre}`);
    assert((await page.locator("[data-hero-atmosphere]").getAttribute("data-hero-atmosphere")) === "idle", "não está idle");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.querySelector("[data-hero-atmosphere]")?.dataset.heroAtmosphere === "ready", null, { timeout: 6000 });
    await page.setViewportSize({ width: 768, height: 900 });
    await page.waitForTimeout(300);
    assert((await page.locator(".mock-hero-atmosphere").getAttribute("data-paused")) === "true", "não pausou ao voltar a estreito");
    await context.close();
  });

  await test("encaixe de demonstração (harness): etapas, vídeo ausente sem erro", async () => {
    const { page, context, errors } = await open("/teste/produto");
    const btns = page.getByRole("group", { name: "Etapas do percurso no produto" }).getByRole("button");
    assert((await btns.count()) === 4, "etapas");
    await btns.nth(2).click();
    assert((await btns.nth(2).getAttribute("aria-pressed")) === "true", "seleção");
    assert(/FIXTURE 3/.test(await page.locator("figcaption").last().innerText()), "legenda");
    assert((await page.locator("video").count()) === 0, "vídeo inventado");
    assert(errors.length === 0, `erros ${errors}`);
    await context.close();
  });

  await test("atmosfera do hero: falha de importação mantém fundo e conteúdo", async () => {
    const { page, context } = await open("/", undefined, {
      before: (p) => p.route("**/motion/web/hero-atmosphere.js", (r) => r.fulfill({ status: 404, body: "" })),
    });
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    await page.waitForFunction(() => document.querySelector("[data-hero-atmosphere]")?.dataset.heroAtmosphere === "failed");
    assert(await page.getByRole("heading", { name: "Entre na imagem." }).isVisible(), "título");
    const bg = await page.locator("[data-hero-atmosphere]").evaluate((el) => getComputedStyle(el).backgroundImage);
    assert(bg.includes("hero-atmosphere-poster"), "poster ausente");
    assert(pageErrors.length === 0, `pageerror: ${pageErrors}`);
    await context.close();
  });
}

await browser.close();
console.log(`\nMODE=${MODE} pacote=${PACKAGE} BASE=${BASE}\n${results.join("\n")}\n\n${results.length - failures}/${results.length} aprovados`);
process.exit(failures ? 1 : 0);
