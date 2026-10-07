/**
 * Entrada na jornada com rolagem explícita (propostas /previa/a e /previa/b): 1000 ms, 3t²−2t³,
 * posição real da página escrita por quadro (scrollTo instantâneo) — sem smooth nativo.
 *   ROUTE=/previa/a node tests/navegacao.mjs        (servidor em :3000)
 * Mede no navegador: instante do clique/Enter → primeiro quadro na posição de destino.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ROUTE = process.env.ROUTE ?? "/previa/a";
const VPS = (process.env.VPS ?? "1280x720,1440x900,768x1024,390x844").split(",").map((v) => v.split("x").map(Number));
const results = [];
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
async function test(name, fn) {
  if (process.env.ONLY && !new RegExp(process.env.ONLY).test(name)) return;
  try { await fn(); results.push(`✔ ${name}`); } catch (e) { results.push(`✘ ${name}\n    ${e.message.split("\n")[0]}`); }
}
const browser = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });

// Instrumentação: amostra (t, scrollY, p) a cada quadro, instantes de clique/Enter e todas as
// chamadas de rolagem programática com o behavior pedido.
const INSTR = () => {
  sessionStorage.setItem("ararat:intro", "1");
  window.__nav = { frames: [], calls: [], clicks: [] };
  const t0 = performance.now();
  window.__t0 = t0;
  const so = window.scrollTo.bind(window);
  window.scrollTo = (...a) => { window.__nav.calls.push(typeof a[0] === "object" ? a[0].behavior ?? "auto" : "auto"); return so(...a); };
  addEventListener("click", (e) => { if (e.target.closest?.('a[href="#jornada"]')) window.__nav.clicks.push(performance.now()); }, true);
  const tick = (t) => {
    const root = document.querySelector("[data-opening=root]");
    window.__nav.frames.push([t, scrollY, root ? parseFloat(root.style.getPropertyValue("--opening-p") || "0") : 0]);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
async function open(vp, o = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, reducedMotion: o.reduced ? "reduce" : "no-preference", hasTouch: !!o.touch });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (o.before) await o.before(page);
  await page.addInitScript(INSTR);
  await page.goto(BASE + ROUTE, { waitUntil: o.wait ?? "networkidle" });
  if (!o.reduced) await page.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture, null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  return { ctx, page, errors };
}
const dest = (page) => page.evaluate(() => {
  const s = document.getElementById("jornada");
  const track = s.querySelector("[data-journey-variant]");
  const desk = s.querySelector("[data-opening=runway-desktop]").offsetHeight;
  const col = s.querySelector("[data-opening=stage-col]");
  const end = desk || s.querySelector("[data-opening=runway-mobile]").offsetHeight - (parseFloat(getComputedStyle(col).top) || 0);
  return Math.round(scrollY + track.getBoundingClientRect().top + end);
});
const reset = (page) => page.evaluate(() => { scrollTo({ top: 0, behavior: "instant" }); history.replaceState(null, "", location.pathname); window.__nav.frames.length = 0; window.__nav.calls.length = 0; window.__nav.clicks.length = 0; });
const state = (page) => page.evaluate(() => {
  const r = document.querySelector("[data-opening=root]");
  return { y: Math.round(scrollY), nav: r.dataset.nav, navMs: r.dataset.navMs, cover: r.dataset.cover, step: document.getElementById("jornada").dataset.activeStep, focus: document.activeElement.id || document.activeElement.textContent.trim().slice(0, 20) };
});
// Análise da trajetória a partir de um clique: duração até o destino, monotonia, desvio da curva.
const analyse = (page, D) => page.evaluate((D) => {
  const { frames, calls, clicks } = window.__nav;
  const tc = clicks[clicks.length - 1];
  const fs = frames.filter((f) => f[0] >= tc);
  const y0 = fs[0][1];
  const arrive = fs.find((f) => Math.abs(f[1] - D) <= 1);
  let mono = true, maxErr = 0, mid = 0;
  for (let i = 1; i < fs.length; i++) if ((fs[i][1] - fs[i - 1][1]) * Math.sign(D - y0) < -1) mono = false;
  // O amostrador lê scrollY no mesmo quadro, antes ou depois da escrita da navegação: compara com
  // a curva no instante do quadro e no do quadro anterior (atraso de 1 quadro não é erro de curva).
  const ideal = (t) => { const u = Math.min(1, Math.max(0, (t - tc) / 1000)); return y0 + (D - y0) * u * u * (3 - 2 * u); };
  for (let i = 0; i < fs.length; i++) {
    const [t, y, p] = fs[i];
    const u = (t - tc) / 1000;
    const prev = i ? fs[i - 1][0] : t;
    const err = Math.min(Math.abs(y - ideal(t)), Math.abs(y - ideal(prev))) / Math.max(1, Math.abs(D - y0));
    if (u > 0.04 && u < 0.96) maxErr = Math.max(maxErr, err);
    if (p > 0.1 && p < 0.9) mid++;
  }
  const frameGaps = fs.slice(1).map((f, i) => f[0] - fs[i][0]).filter((g) => g > 0);
  return {
    ms: arrive ? Math.round(arrive[0] - tc) : null, y0, mono, maxErr: +maxErr.toFixed(3), passFrames: mid,
    behaviors: [...new Set(calls)], maxGap: Math.round(Math.max(...frameGaps)), frames: fs.filter((f) => f[0] - tc <= 1100).length,
  };
}, D);

for (const vp of VPS) {
  const tag = `${vp[0]}×${vp[1]}`;
  await test(`${tag} clique e Enter: 1000 ms até a etapa Imagem, curva 3t²−2t³, passagem inteira visível, sem smooth nativo`, async () => {
    const { ctx, page, errors } = await open(vp);
    const D = await dest(page);
    const out = [];
    for (const how of ["clique", "Enter"]) {
      await reset(page);
      await page.waitForTimeout(200);
      const cta = page.locator("#inicio a", { hasText: "Entre na imagem" });
      if (how === "clique") await cta.click(); else { await cta.focus(); await page.keyboard.press("Enter"); }
      await page.waitForTimeout(1500);
      const a = await analyse(page, D);
      const s = await state(page);
      assert(s.y === D && s.nav === "concluida" && s.step === "0", `${how}: ${JSON.stringify(s)} destino ${D}`);
      assert(a.ms >= 950 && a.ms <= 1000 + a.maxGap + 20, `${how}: duração ${a.ms} ms (maior intervalo entre quadros ${a.maxGap} ms)`);
      assert(a.mono && a.maxErr < 0.06, `${how}: trajetória ${JSON.stringify(a)}`);
      assert(a.passFrames >= 10, `${how}: só ${a.passFrames} quadros com 0,1 < p < 0,9`);
      assert(a.behaviors.every((x) => x === "instant"), `${how}: behaviors ${a.behaviors}`);
      assert(s.focus === "jornada", `${how}: foco ${s.focus}`);
      out.push(`${how} ${a.ms} ms (${a.frames} quadros, maior intervalo ${a.maxGap} ms, desvio máx. ${(a.maxErr * 100).toFixed(1)}%)`);
    }
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    const t = await page.evaluate(() => document.activeElement.textContent.trim());
    assert(/Imagem/.test(t), `Tab depois da chegada → ${t}`);
    results.push(`    · ${tag}: destino ${D} px — ${out.join(" · ")}`);
    assert(errors.length === 0, errors.join(" | "));
    await ctx.close();
  });

  await test(`${tag} clique repetido: cancela a execução anterior e parte da posição corrente (sem salto)`, async () => {
    const { ctx, page } = await open(vp);
    const D = await dest(page);
    const cta = page.locator("#inicio a", { hasText: "Entre na imagem" });
    await cta.click();
    await page.waitForTimeout(450);
    const yMid = (await state(page)).y;
    // 2º clique na mesma posição (o CTA já esmaeceu, mas continua no lugar)
    await page.evaluate(() => [...document.querySelectorAll("#inicio a")].find((a) => a.textContent.trim() === "Entre na imagem").click());
    await page.waitForTimeout(1300);
    const a = await analyse(page, D);
    const s = await state(page);
    assert(s.y === D && s.nav === "concluida", JSON.stringify(s));
    assert(Math.abs(a.y0 - yMid) < D * 0.15 && a.y0 > 0, `2ª execução não partiu da posição corrente: ${a.y0} (meio ${yMid})`);
    assert(a.mono, "voltou para trás");
    assert(a.ms >= 950 && a.ms <= 1000 + a.maxGap + 20, `duração da 2ª execução ${a.ms}`);
    results.push(`    · ${tag}: 2º clique em y=${yMid} → partiu de ${a.y0}, chegou em ${a.ms} ms`);
    await ctx.close();
  });

  const interrupts = [
    ["roda", async (page) => { await page.mouse.move(vp[0] / 2, vp[1] / 2); await page.mouse.wheel(0, 120); }],
    ["teclado (PageDown)", async (page) => page.keyboard.press("PageDown")],
    ["teclado (Tab)", async (page) => page.keyboard.press("Tab")],
    // Como o arraste da barra: a posição muda fora da navegação, sem animação.
    ["arraste da barra (rolagem externa)", async (page) => page.evaluate(() => window.scrollBy({ top: 40, behavior: "instant" }))],
    ["pressionar a barra (pointerdown)", async (page) => { await page.mouse.move(vp[0] - 4, vp[1] / 2); await page.mouse.down(); await page.mouse.up(); }],
    ["resize", async (page) => page.setViewportSize({ width: vp[0] - 40, height: vp[1] })],
  ];
  // Toque = início de um gesto de arrasto (touchStart → touchMove → touchEnd, CDP). Um tap
  // simples (ou um arrasto curto, abaixo da tolerância de toque) vira clique no que estiver sob o
  // dedo — em 320×568, o próprio CTA, que reiniciava a entrada. Arrasto de 60 px = gesto de rolagem.
  if (vp[0] < 600) interrupts.push(["toque", async (page) => {
    const cdp = await page.context().newCDPSession(page);
    const x = Math.round(vp[0] * 0.9), y = Math.round(vp[1] / 2);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let d = 15; d <= 60; d += 15) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - d }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }]);
  await test(`${tag} interrupção (${interrupts.map((i) => i[0]).join(", ")}): para na hora e nada puxa de volta`, async () => {
    const out = [];
    for (const [label, act] of interrupts) {
      const { ctx, page } = await open(vp, { touch: label === "toque" });
      const cta = page.locator("#inicio a", { hasText: "Entre na imagem" });
      await cta.click();
      await page.waitForTimeout(350);
      await act(page);
      await page.waitForTimeout(250);
      const s1 = await state(page);
      await page.waitForTimeout(1800);
      const s2 = await state(page);
      assert(s1.nav === "interrompida", `${label}: estado ${s1.nav}`);
      if (label.includes("Tab")) {
        // O Tab move o foco (a seção ainda coberta → próximo controle visível) e o navegador rola
        // até ele: é a navegação da pessoa. Confere que nada a devolve ao destino da jornada.
        const D2 = await dest(page);
        const vis = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
        assert(vis && Math.abs(s2.y - D2) > 2, `${label}: foco fora de vista ou puxado ao destino (y ${s2.y})`);
      } else {
        assert(Math.abs(s2.y - s1.y) <= 2, `${label}: posição mudou depois da interrupção (${s1.y} → ${s2.y})`);
      }
      out.push(`${label} → parou em ${s2.y}`);
      await ctx.close();
    }
    results.push(`    · ${tag}: ${out.join(" · ")}`);
  });
}

await test("movimento reduzido: vai direto ao destino (sem trajetória)", async () => {
  const { ctx, page } = await open([1280, 720], { reduced: true });
  // layout estático (sem abertura): a âncora é nativa e não há escultura; destino = seção
  await page.locator("#inicio a", { hasText: "Entre na imagem" }).click();
  await page.waitForTimeout(400);
  const y = await page.evaluate(() => Math.round(scrollY));
  const top = await page.evaluate(() => Math.round(document.getElementById("jornada").getBoundingClientRect().top));
  const frames = await page.evaluate(() => window.__nav.frames.filter((f) => f[1] > 0 && f[1] < scrollY - 1).length);
  assert(y > 0 && Math.abs(top - 72) <= 2 && frames <= 1, `y ${y}, topo da jornada ${top}, quadros intermediários ${frames}`);
  results.push(`    · reduzido: y ${y}, jornada no topo (sob o cabeçalho), ${frames} quadro intermediário`);
  await ctx.close();
});

await test("pausa geral: vai direto ao destino (sem trajetória)", async () => {
  const { ctx, page } = await open([1280, 720]);
  const D = await dest(page);
  await page.locator("header button[aria-pressed]").first().click();
  await reset(page);
  await page.locator("#inicio a", { hasText: "Entre na imagem" }).click();
  await page.waitForTimeout(300);
  const s = await state(page);
  const frames = await page.evaluate((D) => window.__nav.frames.filter((f) => f[1] > 0 && f[1] < D - 1).length, D);
  assert(s.y === D && s.nav === "direta" && frames === 0, `${JSON.stringify(s)} quadros intermediários ${frames}`);
  await ctx.close();
});

await test("RM lenta: chega em 1000 ms com controles ocultos e aviso; revelação não move o foco; Tab entra nos controles", async () => {
  let release;
  const gate = new Promise((r) => (release = r));
  const { ctx, page } = await open([1280, 720], { wait: "domcontentloaded", before: (p) => p.route(/mri-base\.webp/, async (r) => { await gate; await r.continue(); }) });
  await page.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 10000 });
  const D = await dest(page);
  await page.locator("#inicio a", { hasText: "Entre na imagem" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1400);
  const s0 = await state(page);
  const a = await analyse(page, D);
  assert(s0.y === D && s0.cover === "loading" && s0.focus === "jornada", JSON.stringify(s0));
  assert(a.ms >= 950 && a.ms <= 1000 + a.maxGap + 20, `duração ${a.ms} (maior intervalo ${a.maxGap} ms)`);
  release();
  await page.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.cover === "revealed", null, { timeout: 10000 });
  const s1 = await state(page);
  assert(s1.focus === "jornada" && s1.y === D, `revelação mexeu em foco/posição: ${JSON.stringify(s1)}`);
  await page.keyboard.press("Tab");
  const t = await page.evaluate(() => document.activeElement.textContent.trim());
  assert(/Imagem/.test(t), `Tab → ${t}`);
  await ctx.close();
});

for (const [label, re] of [["RM com falha (404)", /mri-base\.webp/], ["escultura com falha (404)", /home-sculpture\.js/]]) {
  await test(`${label}: a entrada continua em 1000 ms até o destino e libera a jornada`, async () => {
    const { ctx, page } = await open([1440, 900], { before: (p) => p.route(re, (r) => r.fulfill({ status: 404, body: "" })) });
    const D = await dest(page);
    await page.locator("#inicio a", { hasText: "Entre na imagem" }).click();
    await page.waitForTimeout(1500);
    const s = await state(page);
    const a = await analyse(page, D);
    assert(s.y === D && s.nav === "concluida" && a.ms >= 950 && a.ms <= 1000 + a.maxGap + 20, `${JSON.stringify(s)} ${a.ms} ms`);
    await page.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.cover === "revealed", null, { timeout: 8000 });
    await ctx.close();
  });
}

await browser.close();
console.log(`ROUTE=${ROUTE}\n` + results.join("\n"));
const fails = results.filter((r) => r.startsWith("✘")).length, total = results.filter((r) => /^[✔✘]/.test(r)).length;
console.log(`\n${total - fails}/${total} aprovados`);
process.exit(fails ? 1 : 0);
