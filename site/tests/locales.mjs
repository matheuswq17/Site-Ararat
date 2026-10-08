import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const BASE = process.env.BASE ?? "http://localhost:3000";
const dictionary = JSON.parse(await readFile(new URL("../lib/locales/en.json", import.meta.url), "utf8"));
const browser = await chromium.launch();
let count = 0;
try {
  for (const [route, lang, title] of [["/", "en", "From image to understanding."], ["/pt", "pt-BR", "Da imagem ao conhecimento."], ["/previa/refinada", "pt-BR", "Da imagem ao conhecimento."]]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("lang"), lang);
    assert.equal((await page.locator("#hero-title").textContent()).replace(/\s+/g, " ").trim(), title);
    assert.equal(await page.locator("#time-lista > li").count(), 5);
    assert.equal(await page.locator('[data-opening="root"]').getAttribute("data-preview-version"), "0.7.0-draft");
    assert.equal(await page.locator('[data-fluxo="root"]').getAttribute("data-modulo"), "0.1.0-draft");
    if (lang === "en") {
      const untranslated = await page.evaluate((dict) => {
        const keys = new Set(Object.keys(dict).filter((key) => key !== dict[key]));
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const missing = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (node.parentElement.closest("script,style,noscript,nextjs-portal")) continue;
          const text = node.textContent.replace(/\s+/g, " ").trim();
          if (keys.has(text)) missing.push(text);
        }
        return missing;
      }, dictionary);
      assert.deepEqual(untranslated, [], "Portuguese text remains in English HTML");
      assert.match(await page.locator("#ciencia").textContent(), /ISUP < 3.*ISUP ≥ 3/);
      assert.match(await page.locator("#ciencia").textContent(), /not validate a complete automated workflow/);
      assert.match(await page.locator("#plataforma").textContent(), /Review pending/);
      await page.locator('[data-journey-controls] button').filter({ hasText: "Data" }).click();
      assert.match(await page.locator('#jornada [aria-live="polite"]').textContent(), /Step 3 of 4: Data/);
      await page.getByRole("button", { name: "Intensity", exact: true }).click();
      assert.match(await page.locator("#xai-reading").textContent(), /Distribution of signal values/i);
      assert.doesNotMatch(await page.locator("#xai-reading").getAttribute("aria-label"), /Intensidade/);
      await page.locator('#time-lista > li').nth(1).locator('summary').first().click();
      await page.locator('#time-lista > li').nth(1).locator('details details summary').click();
      assert.match(await page.locator('#time-lista > li').nth(1).textContent(), /Medical Coordinator of the Imaging Department/);
    }
    for (const width of [320, 390, 768, 1080, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const section of ["#inicio", "#plataforma", "#explicabilidade", "#ciencia", "#time", "footer"]) {
        await page.locator(section).scrollIntoViewIfNeeded();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, `${route} overflow at ${width}, ${section}`);
      }
      assert.equal(await page.locator(".language-switch").isVisible(), true);
    }
    if (lang === "en") {
      await page.route(/time-interativo-0\.2\.0\/retratos\/victor-.*\.webp/, (route) => route.abort());
      await page.locator('#time-lista > li').nth(4).locator('summary').first().click();
      await page.locator('#time [data-shown]').scrollIntoViewIfNeeded();
      await page.locator('#time [data-portrait-failure]').waitFor({ state: "visible" });
      assert.match(await page.locator('#time [data-portrait-failure]').textContent(), /Portrait of Victor Arthur Ohannesian — photo unavailable/);
      await page.locator('#time-lista > li').nth(0).locator('summary').first().click();
      await page.waitForFunction(() => document.querySelector('#time [data-shown]').dataset.fase === 'foto');
      assert.equal(await page.locator('#time [data-portrait-failure]').count(), 0);
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${route}: language, content, modules, interactions, six widths`);
    count++;
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(BASE + "/?paisagem=0.2.0#ciencia", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Mudar para português", exact: true }).click();
  await page.waitForURL(BASE + "/pt?paisagem=0.2.0#ciencia");
  assert.equal(await page.locator("html").getAttribute("lang"), "pt-BR");
  await page.getByRole("link", { name: "Switch to English", exact: true }).press("Enter");
  await page.waitForURL(BASE + "/?paisagem=0.2.0#ciencia");
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  await context.close();
  console.log("PASS language switch: click, keyboard, query and section preserved");
  count++;

  for (const [route, lang] of [["/", "en"], ["/pt", "pt-BR"]]) {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("lang"), lang);
    assert.equal(await page.locator('[data-fluxo="roteiro"]').isVisible(), true);
    assert.match(await page.locator("#time").textContent(), lang === "en" ? /Software engineer/ : /Engenheiro de software/);
    assert.equal(await page.locator(".language-switch").getAttribute("href"), lang === "en" ? "/pt" : "/");
    await context.close();
    console.log(`PASS ${route}: translated server HTML and static fallback without JavaScript`);
    count++;
  }
  console.log(`${count}/${count} passed`);
} finally {
  await browser.close();
}
