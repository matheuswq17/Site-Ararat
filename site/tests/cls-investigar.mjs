/**
 * Investigação do CLS intermitente da /previa/refinada (0,21 medido uma vez em 1440 na suíte
 * previa.mjs). Reproduz a medida da suíte (1ª visita, abertura tocando, PerformanceObserver de
 * layout-shift sem entrada recente, 1,6 s após networkidle) sob condições que variam a ordem de
 * chegada: CPU lenta (CDP), fontes atrasadas, poster/módulo atrasados, rede lenta. Para cada
 * deslocamento registra valor, instante e os ELEMENTOS deslocados (seletor curto + retângulos antes
 * e depois) — para identificar a causa em vez de só contar repetições aprovadas.
 *   node tests/cls-investigar.mjs [saida.json]     (servidor em :3000)   N=6 VP=1440x900
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3000";
const N = Number(process.env.N ?? 6);
const [W, H] = (process.env.VP ?? "1440x900").split("x").map(Number);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const COND = {
  normal: {},
  cpu6: { cpu: 6 },
  fontes2s: { fontDelay: 2000 },
  cpu4_fontes1s: { cpu: 4, fontDelay: 1000 },
  modulo3s: { moduleDelay: 3000 },
  poster2s: { posterDelay: 2000 },
  rede_lenta: { net: { latency: 150, down: (1.6 * 1024 * 1024) / 8, up: (750 * 1024) / 8 } },
  js1500: { jsDelay: 1500 },
  js3000: { jsDelay: 3000 },
  css800: { cssDelay: 800 },
  fontes4s: { fontDelay: 4000 },
  cpu6_js1500: { cpu: 6, jsDelay: 1500 },
  cpu6_rede: { cpu: 6, net: { latency: 150, down: (1.6 * 1024 * 1024) / 8, up: (750 * 1024) / 8 } },
};
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const b = await chromium.launch();
const out = {};
for (const [name, c] of Object.entries(COND)) {
  if (only && !only.test(name)) continue;
  const runs = [];
  for (let i = 0; i < N; i++) {
    const ctx = await b.newContext({ viewport: { width: W, height: H } });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    if (c.cpu) await cdp.send("Emulation.setCPUThrottlingRate", { rate: c.cpu });
    if (c.net) { await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: c.net.latency, downloadThroughput: c.net.down, uploadThroughput: c.net.up }); }
    if (c.fontDelay) await page.route(/\.(woff2?|ttf)(\?|$)/, async (r) => { await delay(c.fontDelay); await r.continue(); });
    if (c.jsDelay) await page.route(/\/_next\/static\/chunks\/.*\.js$/, async (r) => { await delay(c.jsDelay); await r.continue(); });
    if (c.cssDelay) await page.route(/\/_next\/static\/.*\.css$/, async (r) => { await delay(c.cssDelay); await r.continue(); });
    if (c.moduleDelay) await page.route(/home-sculpture\.js$/, async (r) => { await delay(c.moduleDelay); await r.continue(); });
    if (c.posterDelay) await page.route(/arte-escultura-.*\.webp$/, async (r) => { await delay(c.posterDelay); await r.continue(); });
    await page.addInitScript(() => {
      window.__ls = [];
      const t0 = performance.now();
      const desc = (n) => {
        if (!n || n.nodeType !== 1) return n ? n.nodeName : "?";
        const op = n.closest?.("[data-opening]")?.getAttribute("data-opening");
        const id = n.id ? `#${n.id}` : "";
        const cls = (n.getAttribute("class") || "").split(/\s+/).filter(Boolean).map((c) => c.replace(/^.*__/, "").replace(/__.*$/, "")).slice(0, 2).join(".");
        const sec = n.closest?.("section[id]")?.id;
        return `${n.tagName.toLowerCase()}${id}${cls ? "." + cls : ""}${op ? ` [opening=${op}]` : ""}${sec ? ` in #${sec}` : ""} «${(n.textContent || "").trim().slice(0, 30)}»`;
      };
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.hadRecentInput) continue;
          window.__ls.push({
            v: +e.value.toFixed(4), t: Math.round(e.startTime),
            fontsReady: document.fonts.status, intro: !!document.getElementById("ararat-intro"),
            sculpture: document.querySelector("[data-opening=root]")?.dataset.sculpture ?? null,
            src: e.sources.map((s) => ({ el: desc(s.node), de: [Math.round(s.previousRect.x), Math.round(s.previousRect.y), Math.round(s.previousRect.width), Math.round(s.previousRect.height)], para: [Math.round(s.currentRect.x), Math.round(s.currentRect.y), Math.round(s.currentRect.width), Math.round(s.currentRect.height)] })),
          });
        }
      }).observe({ type: "layout-shift", buffered: true });
      document.fonts.addEventListener?.("loadingdone", () => window.__ls.push({ evento: "fontes carregadas", t: Math.round(performance.now() - t0) }));
    });
    await page.goto(BASE + "/previa/refinada", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1600);
    const ls = await page.evaluate(() => window.__ls);
    const cls = ls.filter((e) => e.v != null).reduce((a, e) => a + e.v, 0);
    runs.push({ cls: +cls.toFixed(4), shifts: ls });
    await ctx.close();
  }
  const bad = runs.filter((r) => r.cls >= 0.02);
  const amostra = runs.find((r) => r.cls > 0);
  out[name] = { runs: runs.map((r) => r.cls), acima: bad.length, exemplos: bad.slice(0, 2).map((r) => r.shifts), amostraAbaixo: amostra && !bad.length ? amostra.shifts : undefined };
  console.log(`${name}: CLS ${runs.map((r) => r.cls).join(" ")} → ${bad.length}/${N} ≥ 0,02`);
  for (const r of bad.slice(0, 1)) for (const s of r.shifts.filter((x) => x.v)) console.log(`   ${s.v} @${s.t}ms fontes=${s.fontsReady} intro=${s.intro} escultura=${s.sculpture}: ${s.src.map((x) => `${x.el} ${x.de.join(",")}→${x.para.join(",")}`).join(" | ")}`);
}
await b.close();
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
