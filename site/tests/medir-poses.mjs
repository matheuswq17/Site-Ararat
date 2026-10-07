/**
 * Poses da passagem da /previa/refinada (plano 006) — para o Motion calibrar pHold/pEnd.
 * Para cada tela: relação scrollY ↔ p (progresso que o Site entrega por setPassage), e numa grade
 * de p: fases da cena (sólido→linhas `fillK`, câmera `up`, janela `open`), arco (raio, abertura,
 * opacidade), janela da RM (raio wr e fração do quadro), quadro da jornada e área da arte, além de
 * capturas por p. As fases são lidas do próprio módulo via `_debug()` (arco) e recalculadas com as
 * fórmulas da 0.6.0 (fillK/up/open, sem efeito no desenho).
 *
 * INSTRUMENTAÇÃO SÓ NO TESTE: a resposta de web/home-sculpture.js é reescrita em memória
 * (page.route) para expor a instância em window.__sc; o arquivo do pacote não muda.
 *
 *   node tests/medir-poses.mjs <pasta>      (servidor em :3000)   VPS=1920x990,1440x900,…  PS=0,0.05,…
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/poses";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const VPS = (process.env.VPS ?? "1920x990,1440x900,1280x720,390x844,320x568").split(",").map((v) => v.split("x").map(Number));
const PS = (process.env.PS ?? "0,0.05,0.1,0.15,0.2,0.25,0.3,0.35,0.4,0.45,0.48,0.52,0.56,0.6,0.7,0.82").split(",").map(Number);
const b = await chromium.launch();
const all = {};
for (const [w, h] of VPS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await page.route(/home-sculpture\.js$/, async (route) => {
    const r = await route.fetch();
    let s = await r.text();
    s = s.replace("export function createHomeSculpture(", "function __createHomeSculpture(");
    s += "\nexport function createHomeSculpture(c, o) { const s = __createHomeSculpture(c, o); window.__sc = s; return s; }\n";
    await route.fulfill({ response: r, body: s, headers: { ...r.headers(), "content-type": "text/javascript" } });
  });
  await page.goto(BASE + "/previa/refinada", { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__sc && document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  const readP = () => page.evaluate(() => parseFloat(document.querySelector("[data-opening=root]").style.getPropertyValue("--opening-p")) || 0);
  const go = async (y) => { await page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), y); await page.waitForTimeout(140); return readP(); };
  // pista: menor scrollY com p ≥ 1
  let lo = 0, hi = 200;
  while ((await go(hi)) < 1 && hi < 20000) hi *= 2;
  const yFor = async (target) => {
    let a = 0, z = hi;
    for (let i = 0; i < 18; i++) { const m = (a + z) / 2; if ((await go(m)) < target) a = m; else z = m; }
    return Math.round(z);
  };
  const rows = [];
  for (const p0 of PS) {
    const y = p0 === 0 ? 0 : await yFor(p0);
    await go(y);
    await page.waitForTimeout(500); // revelação/ready assentam
    const m = await page.evaluate(() => {
      const seg = (v, a, b) => Math.min(1, Math.max(0, (v - a) / (b - a)));
      const smooth = (a, b, v) => { const t = seg(v, a, b); return t * t * (3 - 2 * t); };
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const root = document.querySelector("[data-opening=root]");
      const p = parseFloat(root.style.getPropertyValue("--opening-p")) || 0;
      const d = window.__sc._debug();
      const host = document.querySelector("[data-opening=sticky]").getBoundingClientRect();
      const fr = document.querySelector("#jornada [data-layout]").getBoundingClientRect();
      const slot = document.querySelector("[data-opening=slot]").getBoundingClientRect();
      const T = { x: fr.left - host.left, y: fr.top - host.top, w: fr.width, h: fr.height };
      const arc = d.arc;
      const gcx = T.x + T.w / 2, gcy = T.y + T.h / 2; // centro (sem arcT; aproximação para o raio de cobertura)
      const Rcover = Math.max(...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v]) => Math.hypot(T.x + u * T.w - gcx, T.y + v * T.h - gcy)));
      const open = ease(seg(p, 0.3, 0.82)) * d.readyK;
      const R = (n) => Math.round(n);
      return {
        p: +p.toFixed(4), scrollY: R(scrollY),
        fases: { fillK: +(1 - smooth(0.03, 0.15, p)).toFixed(3), up: +ease(seg(p, 0.15, 0.48)).toFixed(3), open: +open.toFixed(3), a: +ease(seg(p, 0, 0.5)).toFixed(3) },
        janela: { wr: R(open * Rcover), fracDoQuadro: +(open).toFixed(3), areaFrac: +Math.min(1, (Math.PI * (open * Rcover) ** 2) / (T.w * T.h)).toFixed(3) },
        arco: arc && { cx: R(arc.cx), cy: R(arc.cy), r: R(arc.r), span: +arc.span.toFixed(1), opacity: +arc.opacity.toFixed(3), comprimentoPx: R((arc.r * arc.span * Math.PI) / 180) },
        quadro: { x: R(T.x), y: R(T.y), w: R(T.w), h: R(T.h) },
        arte: { x: R(slot.left), y: R(slot.top), w: R(slot.width), h: R(slot.height) },
        hostTop: R(host.top), hostH: R(host.height),
        cover: root.dataset.cover, reveal: document.querySelector("[data-opening=sticky] canvas")?.dataset.reveal,
        ambiente: { data: document.querySelector("[data-opening=sticky] canvas")?.dataset.ambient, running: d.ambient.running, gain: d.ambient.gain ?? 0 },
        camera: d.camera,
      };
    });
    const name = `pose-${w}x${h}-p${p0.toFixed(2)}.png`;
    await page.screenshot({ path: `${out}/${name}` });
    rows.push({ alvo: p0, ...m, captura: name });
    console.log(`${w}x${h} p ${m.p} y ${m.scrollY} · fillK ${m.fases.fillK} up ${m.fases.up} open ${m.fases.open} · arco r ${m.arco?.r} span ${m.arco?.span}° op ${m.arco?.opacity} · janela ${m.janela.wr}px (${(m.janela.areaFrac * 100).toFixed(1)} % do quadro) · amb ${m.ambiente.data}`);
  }
  all[`${w}x${h}`] = { pistaPx: hi, rows };
  await ctx.close();
}
await b.close();
writeFileSync(`${out}/poses.json`, JSON.stringify(all, null, 1));
