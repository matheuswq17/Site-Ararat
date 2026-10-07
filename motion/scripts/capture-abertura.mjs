// Captura a referência da abertura (storyboard de 3 poses × 3 viewports + tira temporal + vídeos curtos).
// Uso: node scripts/capture-abertura.mjs   (requer Playwright; PLAYWRIGHT_MODULE opcional)
import { mkdir, readFile, rename, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startServer } from './serve.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pwPath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = pwPath ? await import(pathToFileURL(join(pwPath, 'index.mjs')).href) : await import('playwright');
const out = join(root, 'review/rodada-05');
await mkdir(out, { recursive: true });
const { server, port } = await startServer(Number(process.env.PORT) || 3001);
const base = `http://127.0.0.1:${port}/harness/abertura.html`;
const browser = await chromium.launch();
const VIEWS = [[1440, 900, 'desktop'], [768, 900, 'tablet'], [390, 844, 'movel']];
const POSES = [[120, 'inicio'], [600, 'transicao'], [1200, 'assentado']];
const shots = {};
for (const [w, h, name] of VIEWS) {
  const pg = await browser.newPage({ viewport: { width: w, height: h } });
  for (const [t, label] of POSES) {
    await pg.goto(`${base}?chrome=0&t=${t}`);
    await pg.waitForTimeout(500);
    const f = join(out, `abertura-${name}-${label}.png`);
    await pg.screenshot({ path: f });
    shots[`${name}-${label}`] = 'data:image/png;base64,' + (await readFile(f)).toString('base64');
  }
  await pg.close();
}
// tira temporal desktop (recorte da área de arte)
const strip = [];
{
  const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const t of [0, 120, 250, 400, 600, 800, 950, 1100, 1300]) {
    await pg.goto(`${base}?chrome=0&t=${t}`);
    await pg.waitForTimeout(350);
    const box = await pg.locator('#art').boundingBox();
    const buf = await pg.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
    strip.push({ t, src: 'data:image/png;base64,' + buf.toString('base64') });
  }
  await pg.close();
}
const sheet = await browser.newPage({ viewport: { width: 1800, height: 900 } });
const fig = (k, cap) => `<figure style="margin:0"><img src="${shots[k]}" style="width:100%;display:block;border:1px solid rgba(176,184,193,.2)"><figcaption style="padding:6px 0;color:#B0B8C1">${cap}</figcaption></figure>`;
await sheet.setContent(`<html><body style="margin:0;background:#080f18;font:14px system-ui;color:#F5F7FA;padding:20px">
  <h2 style="font:600 18px system-ui;margin:0 0 4px">Abertura — o arco encontra a imagem (referência de gesto e ritmo)</h2>
  <p style="color:#B0B8C1;margin:0 0 14px">Arco compacto nasce no centro da área de arte (120 ms), desenha-se enquanto cresce e se desloca (250–950 ms) até a geometria exata do arco de foco do HeroMri (foco da glândula, r = 0,215·W, 196°→344°); marcações assentam até 1200 ms. Sem porcentagem, sem bloqueio. O Site implementa a abertura definitiva.</p>
  <div style="display:grid;grid-template-columns:1.6fr 1fr 0.62fr;gap:16px;align-items:start">
    <div style="display:grid;gap:10px">${POSES.map(([t, l]) => fig(`desktop-${l}`, `Desktop 1440×900 · ${t} ms · ${l}`)).join('')}</div>
    <div style="display:grid;gap:10px">${POSES.map(([t, l]) => fig(`tablet-${l}`, `Tablet 768×900 · ${t} ms · ${l}`)).join('')}</div>
    <div style="display:grid;gap:10px">${POSES.map(([t, l]) => fig(`movel-${l}`, `Móvel 390×844 · ${t} ms · ${l}`)).join('')}</div>
  </div>
  <h3 style="font:600 15px system-ui;margin:22px 0 8px">Tira temporal (área de arte, desktop)</h3>
  <div style="display:grid;grid-template-columns:repeat(9,1fr);gap:8px">${strip.map((s) => `<figure style="margin:0"><img src="${s.src}" style="width:100%;display:block"><figcaption style="color:#B0B8C1;font-size:12px">${s.t} ms</figcaption></figure>`).join('')}</div>
  <p style="color:#B0B8C1;font-size:12px;margin-top:14px">Capturas do harness motion/harness/abertura.html (Chromium headless, quadros determinísticos por t). Não é medição de FPS. RM demonstrativa; títulos simulados apenas para avaliar o ritmo.</p>
</body></html>`);
await sheet.waitForTimeout(400);
await sheet.screenshot({ path: join(out, 'storyboard-abertura.png'), fullPage: true });
await sheet.close();
// vídeos curtos (gravação do harness em tempo real; 1× e 0,5×)
for (const [w, h, name] of [[1440, 900, 'desktop'], [390, 844, 'movel']]) {
  for (const sp of ['1', '0.5']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: out, size: { width: w, height: h } } });
    const pg = await ctx.newPage();
    await pg.goto(`${base}?chrome=0&autoplay=1&speed=${sp}`);
    await pg.waitForTimeout(sp === '1' ? 2200 : 3600);
    const v = pg.video();
    await ctx.close();
    await rename(await v.path(), join(out, `abertura-${name}-${sp === '1' ? '1x' : '0.5x'}.webm`));
  }
}
await browser.close();
server.close();
console.log('ok', (await readdir(out)).join(', '));
