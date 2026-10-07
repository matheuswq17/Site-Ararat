// Grava a abertura e um trecho de scroll (vídeo .webm do Playwright) para revisar ritmo.
//   node tests/record-intro.mjs <pasta>   (servidor em :3000)
// Observação: vídeo headless indica ritmo/sequência; não mede FPS de aparelho real.
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/rodada-04-video";
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
for (const [w, h] of (process.env.VIEWPORTS ?? "1440x900,768x900,390x844").split(",").map((v) => v.split("x").map(Number))) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: out, size: { width: w, height: h } } });
  const p = await ctx.newPage();
  // SLOW=1: carga fria em rede lenta (≈1,6 Mbps, 150 ms) via CDP — mostra a RM chegando depois da abertura.
  if (process.env.SLOW) {
    const cdp = await ctx.newCDPSession(p);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 });
  }
  await p.goto("http://localhost:3000" + (process.env.PATHNAME ?? "/"), { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(process.env.SLOW ? 4200 : 2200);
  for (let i = 0; i < 26; i++) {
    await p.mouse.wheel(0, w > 900 ? 160 : 120);
    await p.waitForTimeout(110);
  }
  await p.waitForTimeout(1200);
  const v = p.video();
  await ctx.close();
  renameSync(await v.path(), `${out}/entrada-e-scroll-${w}${process.env.SLOW ? "-rede-lenta" : ""}.webm`);
}
await b.close();
