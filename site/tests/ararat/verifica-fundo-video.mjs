#!/usr/bin/env node
/** Fundo público aprovado: MP4 reais, 9 rotas, 2 telas, navegação, pausa, fallback e fronteira. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const BASE = (process.argv[2] || 'http://127.0.0.1:3316').replace(/\/$/, '');
const canal = process.argv.find(a => a.startsWith('--canal='))?.split('=')[1] || 'msedge';
const rotas = ['/pt/solucoes','/pt/plataforma','/pt/empresa','/solutions','/platform','/company','/es/soluciones','/es/plataforma','/es/empresa'];
const browser = await chromium.launch({ channel: canal });
let total = 0;
const ok = s => { ++total; console.log('ok: '+s); };
const tocando = p => p.waitForFunction(() => {
 const v = document.querySelector('[data-video-fundo] video');
 return v && !v.paused && v.currentTime > .3 && !v.error;
}, null, {timeout:20000});
const geo = p => p.locator('main .topo-pag').first().evaluate(e => {
 const r = n => {const b=n.getBoundingClientRect();return [b.x,b.y+scrollY,b.width,b.height];};
 return [r(e),r(e.querySelector('h1')),r(e.querySelector('.lead'))];
});
try {
 for(const [width,height,formato,opacity] of [[1440,900,'desktop',.26],[390,844,'movel',.18]]) {
  const ctx = await browser.newContext({viewport:{width,height}}); const p = await ctx.newPage();
  // Desabilita cache na comparação de rede entre páginas que usam a mesma mídia.
  await p.route("**/ararat/fundos/**", r => r.continue());
  for(const rota of rotas) {
   const pedidos=[]; const listener = r=>{if(r.url().includes('/ararat/fundos/') && r.url().endsWith('.mp4'))pedidos.push(r.url());};
   p.on('request',listener);
   await p.goto(BASE+rota); await tocando(p); await p.waitForTimeout(900);
   assert.equal(await p.locator('[data-video-fundo]').count(),1);
   const e = await p.locator('[data-video-fundo] video').evaluate(v=>({muted:v.muted,volume:v.volume,loop:v.loop,controls:v.controls,inline:v.playsInline,tab:v.tabIndex,src:v.currentSrc,hidden:!!v.closest('[aria-hidden="true"]'),pointer:getComputedStyle(v).pointerEvents,opacity:+getComputedStyle(v.parentElement).opacity}));
   assert(e.muted && e.volume===0 && e.loop && !e.controls && e.inline && e.tab===-1 && e.hidden && e.pointer==='none');
   assert.equal(e.opacity,opacity); assert(e.src.includes('/ararat/fundos/mineral-v1/fundo-'+formato+'.mp4'));
   assert(pedidos.length>0 && pedidos.every(u=>u.includes('fundo-'+formato+'.mp4')));
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
   const pausa = p.locator('[data-fundo-pausa] [data-pausa]'); assert(await pausa.isVisible()); assert(await pausa.getAttribute('aria-label'));
   const antes = await geo(p); await pausa.click(); const t = await p.locator('[data-video-fundo] video').evaluate(v=>v.currentTime);
   await p.waitForTimeout(350); assert(await p.locator('[data-video-fundo] video').evaluate(v=>v.paused));
   assert(Math.abs(await p.locator('[data-video-fundo] video').evaluate(v=>v.currentTime)-t)<.07);
   assert.deepEqual(await geo(p),antes); await pausa.click(); await tocando(p);
   p.off('request',listener); ok(rota+' '+width+': formato único, silencioso, composição, pausa e retomada');
  }
  await ctx.close();
 }
 const ctx = await browser.newContext(); const p = await ctx.newPage();
 await p.goto(BASE+'/pt/plataforma'); await tocando(p);
 for(const rota of ['/pt/solucoes','/pt/empresa','/pt/plataforma']) {
  const antigo=await p.locator('[data-video-fundo] video').elementHandle();
  await p.locator('.cab .nav .nav-principal[href="'+rota+'"]').click(); await p.waitForURL(u=>u.pathname===rota);
  await p.waitForFunction(v=>!v.isConnected && v.paused && !v.getAttribute('src'),antigo);
  await tocando(p); ok('menu '+rota+': ativa o fundo sem parâmetro e limpa anterior');
 }
 await p.locator('#adocao').scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
 assert(await p.locator('[data-video-fundo] video').evaluate(v=>v.paused)); ok('fora da tela: reprodução interrompida');
 await p.evaluate(()=>scrollTo(0,0)); await tocando(p);
 await p.locator('[data-fundo-pausa] [data-pausa]').click();
 let pedidos=[]; p.on('request',r=>{if(r.url().includes('/ararat/fundos/') && r.url().endsWith('.mp4'))pedidos.push(r.url());});
 await p.reload(); await p.waitForTimeout(1000);
 assert.equal(pedidos.length,0); assert.equal(await p.locator('[data-video-fundo] video').getAttribute('src'),null); ok('pausa salva: poster sem baixar MP4');
 await ctx.close();
 for(const rota of ['/pt','/pt/pesquisa','/pt/solucoes/prostata','/pt/solucoes/tireoide']) {
  const c=await browser.newContext(); const p=await c.newPage(); await p.goto(BASE+rota); assert.equal(await p.locator('[data-video-fundo]').count(),0); await c.close(); ok(rota+': preservada sem fundo novo');
 }
 for(const rota of rotas) {
  const c=await browser.newContext({reducedMotion:'reduce'}); const p=await c.newPage(); const pedidos=[];
  p.on('request',r=>{if(r.url().endsWith('.mp4'))pedidos.push(r.url());}); await p.goto(BASE+rota); await p.waitForTimeout(400);
  assert.equal(pedidos.length,0); assert(await p.locator('[data-video-fundo] img').evaluate(i=>i.complete && i.naturalWidth>0));
  await c.close(); ok(rota+': movimento reduzido, poster sem download de vídeo');
 }
 const red=await browser.newContext(); const r=await red.newPage(); await r.goto(BASE+'/pt/empresa'); await tocando(r);
 await r.emulateMedia({reducedMotion:'reduce'}); await r.waitForTimeout(150); assert(await r.locator('[data-video-fundo] video').evaluate(v=>v.paused));
 await red.close(); ok('movimento reduzido ligado durante reprodução interrompe');
 const fail=await browser.newContext(); const f=await fail.newPage(); await f.route('**/ararat/fundos/**/*.mp4',r=>r.abort()); await f.goto(BASE+'/pt/plataforma');
 await f.waitForFunction(()=>document.querySelector('[data-video-fundo]').dataset.fundoEstado==='falha');
 assert(await f.locator('#pl-h1').isVisible()); assert(await f.locator('[data-video-fundo] img').evaluate(i=>i.complete && i.naturalWidth>0)); await fail.close(); ok('falha: poster e texto íntegros');
 const nojs=await browser.newContext({javaScriptEnabled:false}); const n=await nojs.newPage(); const np=[];
 n.on('request',r=>{if(r.url().endsWith('.mp4'))np.push(r.url());}); await n.goto(BASE+'/pt/plataforma');
 assert(await n.locator('#pl-h1').isVisible()); assert.equal(np.length,0); await nojs.close(); ok('sem JS: conteúdo e poster, sem MP4');
 const api=await browser.newContext();
 for(const f of ['fundo-desktop.mp4','fundo-movel.mp4']) {
  const q=await api.request.get(BASE+'/ararat/fundos/mineral-v1/'+f,{headers:{Range:'bytes=0-1023'}});
  assert.equal(q.status(),206); assert.equal((await q.body()).length,1024); ok(f+': Range público');
 }
 for(const f of ['/privado/visual/fundo-mineral-v1/fundo-desktop.mp4','/privado/cap/seg-t2-com-mascaras-748.webp']) {
  const q=await api.request.get(BASE+f); assert.equal(q.status(),404); ok(f+': permanece privado');
 }
 await api.close(); console.log(total+' verificações aprovadas; 0 falhas');
} finally {await browser.close();}
