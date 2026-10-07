// Verificação do pacote Motion real com adendo v1.1 (rótulos por evento + atmosfera do hero).
//   build com ARARAT_HARNESS=1 após `npm run motion:sync`; servidor em :3000
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/rodada-04-pacote-real";
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const lines = [];
let fail = 0;
const check = (ok, msg) => { lines.push(`${ok ? "✔" : "✘"} ${msg}`); if (!ok) fail++; };
const overlap = (a, c) => !(a.x + a.width <= c.x || c.x + c.width <= a.x || a.y + a.height <= c.y || c.y + c.height <= a.y);

for (const [w, h] of [[1440, 900], [768, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await p.waitForFunction(() => document.querySelector("[data-hero-atmosphere]")?.dataset.heroAtmosphere === "ready", null, { timeout: 8000 }).catch(() => {});
  const atm = await p.locator("[data-hero-atmosphere]").getAttribute("data-hero-atmosphere");
  // Rodada 05: a atmosfera só é baixada/montada no hero amplo (> 1080 px).
  check(w > 1080 ? atm === "ready" : atm === "idle", `${w}: atmosfera ${w > 1080 ? "montada" : "não montada (idle)"} → ${atm}`);
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${out}/hero-${w}.png` });
  await p.evaluate(() => { const t = document.querySelector("#jornada [class*='track']"); scrollTo({ top: t.getBoundingClientRect().top + scrollY, behavior: "instant" }); });
  await p.waitForFunction(() => document.querySelector("#jornada [data-motion-status]")?.dataset.motionStatus === "ready", null, { timeout: 8000 });
  for (const i of [0, 1, 2, 3]) {
    await p.locator("#jornada [role=group] button").nth(i).click();
    await p.waitForTimeout(1700);
    if (w < 960) await p.locator("#jornada [class*='frame']").first().evaluate((el) => { el.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -80); });
    await p.waitForTimeout(300);
    const frame = await p.locator("#jornada [class*='frame']").first().boundingBox();
    const labels = await p.$$eval("#jornada [data-label-id]", (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { id: e.dataset.labelId, em: !!e.dataset.emphasis, x: r.x, y: r.y, width: r.width, height: r.height }; }));
    if (i >= 2) {
      check(labels.length === 3, `${w} etapa ${i + 1}: 3 rótulos (${labels.map((l) => l.id + (l.em ? "*" : "")).join(",")})`);
      const inside = labels.every((l) => l.x >= frame.x - 1 && l.y >= frame.y - 1 && l.x + l.width <= frame.x + frame.width + 1 && l.y + l.height <= frame.y + frame.height + 1);
      check(inside, `${w} etapa ${i + 1}: rótulos dentro do quadro`);
      const coll = labels.some((a, k) => labels.some((c, j) => j > k && overlap(a, c)));
      check(!coll, `${w} etapa ${i + 1}: rótulos sem colisão`);
    } else {
      check(labels.length === 0, `${w} etapa ${i + 1}: sem rótulos antes de Dados (${labels.length})`);
    }
    await p.screenshot({ path: `${out}/jornada-${w}-etapa${i + 1}.png` });
  }
  // pausa global → atmosfera e jornada pausadas; controles seguem
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(300);
  const btn = w <= 1080 ? null : p.locator("header").getByRole("button", { name: "Pausar animações" });
  if (btn) {
    await btn.click();
    await p.waitForTimeout(200);
    check((await p.locator("[data-hero-atmosphere]").getAttribute("data-paused")) === "true", `${w}: pausa global pausa a atmosfera`);
    await p.locator("header").getByRole("button", { name: "Retomar animações" }).click();
  }
  check(errs.length === 0, `${w}: sem erros de console (${errs.slice(0, 2).join(" | ")})`);
  await ctx.close();
}
// resize com rótulos visíveis: âncora acompanha o quadro
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000/teste/ponte", { waitUntil: "networkidle" });
  await p.waitForFunction(() => document.querySelector("[data-motion-status]")?.dataset.motionStatus === "ready");
  await p.locator("[role=group] button").nth(3).click();
  await p.waitForTimeout(1600);
  const a = await p.locator("[data-label-id]").count();
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(1200);
  const frame = await p.locator("[class*='frame']").first().boundingBox();
  const labels = await p.$$eval("[data-label-id]", (els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })));
  check(a === 3 && labels.length === 3 && labels.every((l) => l.x >= frame.x - 1 && l.x + l.width <= frame.x + frame.width + 1), "resize 1440→390: rótulos reposicionados dentro do quadro");
  await p.click("#toggle-journey");
  await p.waitForTimeout(200);
  check((await p.locator("[data-label-id]").count()) === 0, "desmontagem remove rótulos");
  await ctx.close();
}
// reducedMotion: pose estática + rótulos presentes
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await p.evaluate(() => { const t = document.querySelector("#jornada [class*='track']"); scrollTo({ top: t.getBoundingClientRect().top + scrollY, behavior: "instant" }); });
  await p.waitForFunction(() => document.querySelector("#jornada [data-motion-status]")?.dataset.motionStatus === "ready");
  await p.locator("#jornada [role=group] button").nth(3).click();
  await p.waitForTimeout(600);
  check((await p.locator("#jornada [data-label-id]").count()) === 3, "movimento reduzido: rótulos na pose Explicação");
  check(!(await p.evaluate(() => !!document.getElementById("ararat-intro"))), "movimento reduzido: abertura não toca");
  await p.screenshot({ path: `${out}/reduzido-1440-etapa4.png` });
  await ctx.close();
}
await b.close();
console.log(lines.join("\n") + `\n\n${lines.length - fail}/${lines.length} verificações`);
process.exit(fail ? 1 : 0);
