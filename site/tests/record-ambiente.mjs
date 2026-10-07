/**
 * Ambiente em repouso da /previa/refinada — gravação da PÁGINA REAL, velocidade normal, sem rolagem,
 * clique nem mouse sobre a arte (o ponteiro fica fora da janela). 1ª visita: a abertura toca.
 *   node tests/record-ambiente.mjs <pasta> [rótulo]      (servidor em :3000)
 *   VPS=1440x900,1280x720,390x844,320x568 · SECONDS=22
 * Saída: ambiente-<rótulo>-<vp>.webm e, para a análise, area-<vp>.json (retângulo da área vista
 * dentro do vídeo) + estado do módulo ao longo do tempo (data-ambient, versão).
 * A análise de movimento visível é feita por tests/analisar-ambiente.py (diferença entre quadros).
 */
import { chromium } from "playwright";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/ambiente";
const label = process.argv[3] ?? "atual";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const VPS = (process.env.VPS ?? "1440x900,1280x720,390x844,320x568").split(",").map((v) => v.split("x").map(Number));
const SECONDS = Number(process.env.SECONDS ?? 22);
const b = await chromium.launch();
for (const [w, h] of VPS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: out, size: { width: w, height: h } } });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__amb = [];
    const t0 = performance.now();
    setInterval(() => {
      const c = document.querySelector("[data-opening=sticky] canvas");
      const r = document.querySelector("[data-opening=root]");
      window.__amb.push([Math.round(performance.now() - t0), c?.dataset.ambient ?? null, r?.dataset.sculpture ?? null]);
    }, 100);
  });
  const t0 = Date.now();
  await p.goto(BASE + "/previa/refinada", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(SECONDS * 1000 - (Date.now() - t0));
  const info = await p.evaluate(() => {
    const s = document.querySelector("[data-opening=slot]").getBoundingClientRect();
    const y1 = Math.min(s.bottom, innerHeight);
    return {
      area: { x: Math.round(Math.max(0, s.left)), y: Math.round(s.top), w: Math.round(Math.min(s.right, innerWidth) - Math.max(0, s.left)), h: Math.round(y1 - s.top) },
      version: document.querySelector("[data-opening=root]").dataset.previewVersion,
      sculptureVersion: document.querySelector("[data-opening=root]").dataset.sculptureVersion,
      amb: window.__amb,
      scrollY,
    };
  });
  const v = p.video();
  await ctx.close();
  renameSync(await v.path(), `${out}/ambiente-${label}-${w}x${h}.webm`);
  writeFileSync(`${out}/area-${label}-${w}x${h}.json`, JSON.stringify(info));
  const first = (st) => info.amb.find((x) => x[1] === st)?.[0];
  console.log(`${w}x${h} ${label}: pacote ${info.version}, canvas em ${info.amb.find((x) => x[2] === "canvas")?.[0]} ms, ambiente on ${first("on")} ms / light ${first("light")} ms, scrollY ${info.scrollY}`);
}
await b.close();
