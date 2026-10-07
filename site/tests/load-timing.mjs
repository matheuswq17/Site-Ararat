// Carga fria em build de produção com rede limitada (CDP): quando chegam título, logo e RM do hero.
//   node tests/load-timing.mjs [perfil=slow|fast]   (servidor next start em :3000)
// Mede tempos de rede/decodificação no Chromium headless; não é medição em aparelho real.
import { chromium } from "playwright";
const profile = process.argv[2] ?? "slow";
const NET = {
  slow: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 }, // ~"Fast 3G"
  fast: { latency: 40, downloadThroughput: (10 * 1024 * 1024) / 8, uploadThroughput: (5 * 1024 * 1024) / 8 },
}[profile];
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.enable");
  // contexto novo = cache frio (sem desabilitar o cache, para não impedir o reuso do preload)
  await cdp.send("Network.emulateNetworkConditions", { offline: false, ...NET });
  const reqs = [];
  p.on("requestfinished", async (r) => {
    const t = r.timing();
    reqs.push({ url: r.url().replace("http://localhost:3000", ""), start: Math.round(t.startTime), end: Math.round(t.responseEnd) });
  });
  await p.addInitScript(() => {
    window.__marks = {};
    const t0 = performance.timeOrigin;
    new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__marks[e.name] ??= Math.round(e.startTime)))).observe({ type: "paint", buffered: true });
    new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__marks.lcp = Math.round(e.startTime)))).observe({ type: "largest-contentful-paint", buffered: true });
  });
  const t0 = Date.now();
  await p.goto("http://localhost:3000/", { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(1500);
  const marks = await p.evaluate(() => {
    const img = document.querySelector("#inicio image");
    const st = document.querySelector("#inicio [data-mri-state]")?.getAttribute("data-mri-state");
    const res = performance.getEntriesByType("resource").filter((r) => /mri|ararat_icone|_next\/image/.test(r.name)).map((r) => ({ n: r.name.replace(location.origin, "").slice(0, 80), start: Math.round(r.startTime), end: Math.round(r.responseEnd), init: r.initiatorType }));
    return { ...window.__marks, dom: Math.round(performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd), heroImg: img?.getAttribute("href"), mriState: st ?? null, res };
  });
  console.log(`\n== ${profile} ${w}x${h} (carga total ${Date.now() - t0} ms)`);
  console.log(JSON.stringify({ fcp: marks["first-contentful-paint"], lcp: marks.lcp, dcl: marks.dom, heroImg: marks.heroImg, mriState: marks.mriState }));
  for (const r of marks.res) console.log("  ", r.init.padEnd(8), String(r.start).padStart(6), "→", String(r.end).padStart(6), r.n);
  await ctx.close();
}
await b.close();
