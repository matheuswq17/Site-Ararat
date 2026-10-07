/**
 * Plano 006 — gravação de aceitação do ambiente na PASSAGEM, página real, velocidade normal, sem cortes:
 *   repouso 5 s → rolagem (roda) até a pose 2 (linhas) → PARA 5 s → rolagem até a pose 3 (mapa + janela
 *   pequena) → PARA 5 s → segue até a jornada → volta pelas mesmas poses (para 3 s em cada) → topo.
 * As poses são definidas por p (progresso que o Site entrega), não por contagem de gestos: o scrollY de
 * cada pose vem de tests/medir-poses.mjs (poses.json) por interpolação — POSE2/POSE3 = 0,17 / 0,41 (prints
 * reais reproduzidos pelo Motion) e MEIO = 0,49 (saída em curso, efeitos reduzidos).
 *   node tests/record-passagem-ambiente.mjs <pasta> <rótulo>      (servidor em :3000)
 *   VPS=1920x990,390x844 · SPEED=lenta|normal|rapida · POSES=<poses.json>[,<poses.json>…]
 * Saída: passagem-<rótulo>-<vp>-<speed>.webm + marcas-<…>.json (tempos de cada parada no vídeo e
 * data-ambient amostrado a 100 ms). A análise das paradas: tests/analisar-passagem.py.
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/passagem";
const label = process.argv[3] ?? "atual";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const VPS = (process.env.VPS ?? "1920x990,390x844").split(",").map((v) => v.split("x").map(Number));
const SPEED = process.env.SPEED ?? "normal";
const POSE2 = Number(process.env.POSE2 ?? 0.17), POSE3 = Number(process.env.POSE3 ?? 0.41), MEIO = Number(process.env.MEIO ?? 0.49);
const poses = Object.assign({}, ...(process.env.POSES ?? "screenshots/previa-refinada-r4/poses/poses.json,screenshots/previa-refinada-r4/poses-outras/poses.json").split(",").map((f) => JSON.parse(readFileSync(f, "utf8"))));
const step = { lenta: [20, 40], normal: [60, 30], rapida: [160, 16] }[SPEED]; // px por evento de roda, ms entre eventos
const yAt = (vp, p) => {
  const rows = poses[vp].rows;
  for (let i = 1; i < rows.length; i++) if (rows[i].p >= p) { const a = rows[i - 1], b = rows[i]; return Math.round(a.scrollY + ((p - a.p) / (b.p - a.p)) * (b.scrollY - a.scrollY)); }
  return rows.at(-1).scrollY;
};
const b = await chromium.launch();
for (const [w, h] of VPS) {
  const vp = `${w}x${h}`;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: out, size: { width: w > 1440 ? 1440 : w, height: w > 1440 ? Math.round((h * 1440) / w) : h } } });
  const t0 = Date.now();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__amb = [];
    const s = performance.now();
    setInterval(() => window.__amb.push([Math.round(performance.now() - s), document.querySelector("[data-opening=sticky] canvas")?.dataset.ambient ?? null, +(parseFloat(document.querySelector("[data-opening=root]")?.style.getPropertyValue("--opening-p")) || 0).toFixed(3)]), 100);
  });
  const marks = [];
  const base0 = `${out}/passagem-${label}-${vp}-${SPEED}`;
  mkdirSync(`${base0}-paradas`, { recursive: true });
  // parada: capturas da própria página a cada 0,5 s (abaixo do cabeçalho) — medida independente do
  // relógio do vídeo (o vídeo é para ver).
  const hold = async (k, ms) => {
    const n = Math.floor(ms / 500);
    for (let i = 0; i < n; i++) {
      const t = Date.now();
      await page.screenshot({ path: `${base0}-paradas/${k}-${String(i).padStart(2, "0")}.png`, clip: { x: 0, y: 80, width: w, height: h - 80 } });
      await page.waitForTimeout(Math.max(0, 500 - (Date.now() - t)));
    }
  };
  const mark = async (k) => marks.push({ k, t: +((Date.now() - t0) / 1000).toFixed(2), scrollY: await page.evaluate(() => scrollY), p: await page.evaluate(() => +(parseFloat(document.querySelector("[data-opening=root]").style.getPropertyValue("--opening-p")) || 0).toFixed(3)) });
  await page.mouse.move(w - 2, Math.round(h * 0.6)); // ponteiro na borda, fora da arte (roda precisa do ponteiro na página)
  await page.goto(BASE + "/previa/refinada", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500); // abertura
  await mark("repouso"); await hold("repouso", 5000);
  const settle = async () => {
    let last = -1, same = 0;
    for (let i = 0; i < 60 && same < 4; i++) { const c = await page.evaluate(() => scrollY); same = c === last ? same + 1 : 0; last = c; await page.waitForTimeout(80); }
  };
  const roll = async (y) => {
    // gesto contínuo: eventos de roda de tamanho fixo pelo total da distância, depois correção fina
    const d0 = y - (await page.evaluate(() => scrollY));
    let sent = 0;
    while (Math.abs(d0 - sent) >= step[0]) { const dy = Math.sign(d0) * step[0]; await page.mouse.wheel(0, dy); sent += dy; await page.waitForTimeout(step[1]); }
    await settle();
    const rest = y - (await page.evaluate(() => scrollY));
    if (Math.abs(rest) > 2) { await page.mouse.wheel(0, rest); }
    // espera a rolagem assentar (roda suave do Chromium continua após o último evento)
    let last = -1, same = 0;
    for (let i = 0; i < 60 && same < 4; i++) { const c = await page.evaluate(() => scrollY); same = c === last ? same + 1 : 0; last = c; await page.waitForTimeout(80); }
  };
  const rollToP = async (pT) => {
    for (let i = 0; i < 400; i++) {
      const pc = await page.evaluate(() => parseFloat(document.querySelector("[data-opening=root]").style.getPropertyValue("--opening-p")) || 0);
      if (pc >= pT) break;
      await page.mouse.wheel(0, step[0]); await page.waitForTimeout(step[1]);
    }
    await roll(await page.evaluate(() => scrollY));
  };
  await roll(yAt(vp, POSE2)); await mark("pose2"); await hold("pose2", 5000);
  await roll(yAt(vp, POSE3)); await mark("pose3"); await hold("pose3", 5000);
  await roll(yAt(vp, MEIO)); await mark("meio"); await hold("meio", 3000);
  await rollToP(1); await mark("jornada"); await hold("jornada", 2000);
  await roll(yAt(vp, POSE3)); await mark("volta-pose3"); await hold("volta-pose3", 3000);
  await roll(yAt(vp, POSE2)); await mark("volta-pose2"); await hold("volta-pose2", 3000);
  await roll(0); await mark("volta-topo"); await hold("volta-topo", 3000);
  const amb = await page.evaluate(() => window.__amb);
  const ver = await page.evaluate(() => document.querySelector("[data-opening=root]").dataset.previewVersion);
  const v = page.video();
  await ctx.close();
  const base = `${out}/passagem-${label}-${vp}-${SPEED}`;
  renameSync(await v.path(), `${base}.webm`);
  writeFileSync(`${base}.json`, JSON.stringify({ vp, speed: SPEED, version: ver, poses: { POSE2, POSE3 }, marks, amb, scale: w > 1440 ? 1440 / w : 1 }, null, 1));
  console.log(`${vp} ${SPEED} ${ver}: ` + marks.map((m) => `${m.k} t${m.t}s p${m.p}`).join(" · "));
}
await b.close();
