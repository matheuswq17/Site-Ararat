// Referência da passagem "Da explicação à revisão." — storyboard, quadros e gravações.
// Uso: node scripts/capture-passagem.mjs   (requer Playwright; PLAYWRIGHT_MODULE opcional)
// Saída: review/rodada-06/. Não altera deliverables/ nem site/.
import { startServer } from './serve.mjs';
import { mkdirSync, readFileSync, rmSync, readdirSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'review', 'rodada-06');
const pwPath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = pwPath ? await import(pathToFileURL(join(pwPath, 'index.mjs')).href) : await import('playwright');
mkdirSync(OUT, { recursive: true });

const VIEWS = [['desktop', 1440, 900], ['tablet', 768, 900], ['movel', 390, 844]];
const POSES = ['explicacao', 'passagem', 'plataforma'];
const { server, port } = await startServer(3001);
const base = `http://127.0.0.1:${port}/harness/passagem.html`;
const browser = await chromium.launch();
const errors = [];

async function open(w, h, query, video) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...(video ? { recordVideo: { dir: video, size: { width: w, height: h } } } : {}) });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => errors.push(`${w}x${h} ${query}: ${e.message}`));
  await pg.goto(`${base}?${query}`);
  await pg.waitForSelector('.ararat-journey[data-loaded="true"]');
  await pg.waitForTimeout(500);
  return { ctx, pg };
}
const stops = (pg) => pg.evaluate(() => {
  const top = (id) => document.getElementById(id).getBoundingClientRect().top + scrollY;
  return [top('frame') - 90, top('passagem') - innerHeight * 0.45, top('hubWin') - innerHeight * 0.55];
});

const shots = [];
for (const [name, w, h] of VIEWS) {
  // poses no modo ligado à rolagem (o traço é função da posição)
  const { ctx, pg } = await open(w, h, 'mode=scroll');
  const ys = await stops(pg);
  for (const [i, y] of ys.entries()) {
    await pg.evaluate((y) => scrollTo(0, y), y); await pg.waitForTimeout(450);
    const file = `passagem-${name}-${i + 1}-${POSES[i]}.png`;
    await pg.screenshot({ path: join(OUT, file) }); shots.push({ name, i, file });
  }
  await ctx.close();
  // alternativa estática (traço completo, sem animação) na pose 2
  const s = await open(w, h, 'mode=static');
  const ys2 = await stops(s.pg);
  await s.pg.evaluate((y) => scrollTo(0, y), ys2[1]); await s.pg.waitForTimeout(300);
  await s.pg.screenshot({ path: join(OUT, `passagem-${name}-estatico.png`) });
  await s.ctx.close();
}

// gravações: rolagem contínua (scroll) e revelação única (time) — gesto e ordem, não FPS
const VID = join(OUT, '_vid'); rmSync(VID, { recursive: true, force: true });
for (const [name, w, h, mode] of [['desktop', 1440, 900, 'scroll'], ['desktop', 1440, 900, 'time'], ['movel', 390, 844, 'scroll']]) {
  const dir = join(VID, `${name}-${mode}`);
  const { ctx, pg } = await open(w, h, `mode=${mode}`, dir);
  const [a, , c] = await stops(pg);
  await pg.evaluate((y) => scrollTo(0, y), a); await pg.waitForTimeout(700);
  const steps = 60;
  for (let k = 1; k <= steps; k++) { await pg.evaluate((y) => scrollTo(0, y), a + (c - a) * (k / steps)); await pg.waitForTimeout(40); }
  await pg.waitForTimeout(1200);
  await ctx.close();
  const f = readdirSync(dir).find((x) => x.endsWith('.webm'));
  renameSync(join(dir, f), join(OUT, `passagem-${name}-${mode}.webm`));
}
rmSync(VID, { recursive: true, force: true });

// folha de contato
const b64 = (f) => `data:image/png;base64,${readFileSync(join(OUT, f)).toString('base64')}`;
const col = (name) => [1, 2, 3].map((i) => shots.find((s) => s.name === name && s.i === i - 1).file).concat(`passagem-${name}-estatico.png`);
const labels = ['1 · Jornada em Explicação', '2 · Acento conecta os capítulos', '3 · Plataforma (Hub real, identificado)', 'Alternativa estática (traço completo)'];
const rows = VIEWS.map(([name, w, h]) => `<div class="row"><div class="rl">${name} · ${w}×${h}</div>${col(name).map((f, i) => `<figure style="width:${name === 'desktop' ? 330 : name === 'tablet' ? 220 : 150}px"><img src="${b64(f)}"><figcaption>${labels[i]}</figcaption></figure>`).join('')}</div>`).join('');
const sheet = await browser.newPage({ viewport: { width: 1520, height: 900 } });
await sheet.setContent(`<style>body{margin:0;padding:24px;background:#0a121c;color:#c9d1da;font:13px system-ui}h1{font-size:18px;margin:0 0 4px;color:#e9edf1}p{margin:0 0 18px;color:#8b96a3}.row{display:flex;gap:14px;align-items:flex-start;margin-bottom:18px}.rl{width:110px;flex:none;padding-top:6px;color:#d9b45a}figure{margin:0}img{width:100%;display:block;border:1px solid #233142}figcaption{margin-top:5px;font-size:11.5px;color:#9aa5b1}</style>
<h1>Passagem “Da explicação à revisão.” · referência conceitual (rodada 06)</h1>
<p>Harness motion/harness/passagem.html. Textos do Site são placeholders. Captura do Hub real e identificada. Jornada v0.4.0 inalterada (p = 1, pausada). Não é a implementação do Site.</p>${rows}`);
await sheet.waitForTimeout(300);
await sheet.screenshot({ path: join(OUT, 'storyboard-passagem.png'), fullPage: true });
await browser.close(); server.close();
console.log(JSON.stringify({ shots: shots.length, errors }, null, 1));
