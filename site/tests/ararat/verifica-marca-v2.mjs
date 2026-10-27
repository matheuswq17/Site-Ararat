#!/usr/bin/env node
/** Integração da marca v2: identidade, proporções, acessibilidade, fontes, fronteira e layout. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
const base=(process.argv[2]||'http://127.0.0.1:3318').replace(/\/$/,'');
const arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.split('=').slice(1).join('=');
const coletar=arg('coletar'),referencia=arg('referencia');
const dados=referencia?JSON.parse(readFileSync(referencia,'utf8')):{};
const rotas=['/pt','/pt/solucoes','/pt/solucoes/prostata','/pt/solucoes/tireoide','/pt/plataforma','/pt/pesquisa','/pt/empresa','/','/solutions','/solutions/prostate-mri','/solutions/thyroid-ultrasound','/platform','/research','/company','/es','/es/soluciones','/es/soluciones/prostata','/es/soluciones/tiroides','/es/plataforma','/es/investigacion','/es/empresa'];
const telas=[[1920,1080],[1440,900],[1366,768],[1280,720],[390,844],[320,568]];
const proporcoes=new Map();
const b=await chromium.launch({channel:'msedge'});let total=0;
const ok=n=>{total++;console.log('ok: '+n)};
try {
 for(const [width,height] of telas){
  const ctx=await b.newContext({viewport:{width,height},reducedMotion:'reduce'}),p=await ctx.newPage();
  for(const rota of rotas){
   await p.goto(base+rota,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
   await p.waitForFunction(()=>[...document.querySelectorAll('.cab img,.rodape img,.cap-logo,.plat-produtos img')].every(i=>i.complete&&i.naturalWidth>0));
   if(['/pt','/','/es'].includes(rota))await p.waitForFunction(()=>document.querySelector('[data-hero]')?.hasAttribute('data-composta'));
   const x=await p.evaluate(()=>{
    const r=e=>{const b=e.getBoundingClientRect();return [b.x,b.y+scrollY,b.width,b.height]};
    const imgs=[...document.querySelectorAll('.cab img,.rodape img,.cap-logo,.plat-produtos img')];
    return {h1:document.querySelector('main h1').textContent,h1box:r(document.querySelector('main h1')),cab:r(document.querySelector('.cab')),hero:document.querySelector('[data-hero]')?.dataset.variante,
     fonte:getComputedStyle(document.querySelector('main h1')).fontFamily,peso:getComputedStyle(document.querySelector('main h1')).fontWeight,
     overflow:document.documentElement.scrollWidth-innerWidth,imgs:imgs.map(i=>({src:i.getAttribute('src'),box:r(i),ratio:i.naturalWidth/i.naturalHeight})),
     textos:[...document.querySelectorAll('main h1,main h2,main p')].map(e=>e.textContent),
     icon:document.querySelector('link[rel="icon"][type="image/svg+xml"]')?.getAttribute('href'),apple:document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
     cores:['--min-0','--clin-0','--cobre','--cobre-claro'].map(k=>getComputedStyle(document.body).getPropertyValue(k).trim()),
     antigos:[...document.querySelectorAll('img')].filter(i=>i.getAttribute('src')?.startsWith('/ararat/marca/')).length,
     terreno:document.querySelector('.estrato')?getComputedStyle(document.querySelector('.estrato')).backgroundImage:null};
   });
   const key=width+'x'+height+rota;
   if(coletar){dados[key]=x;continue;}
   assert.equal(x.overflow,0,key+': rolagem horizontal');assert.equal(x.cab[3],width<900?56:64);
   assert(x.fonte.includes('Source Sans 3'));assert.equal(x.peso,'300');
   assert.equal(x.icon,'/ararat/marca-v2/favicon.svg');assert.equal(x.apple,'/ararat/marca-v2/apple-touch-icon-180.png');assert.equal(x.antigos,0);
   assert(x.imgs.every(i=>i.src.startsWith('/ararat/marca-v2/')));
   const cab=x.imgs[0];assert.equal(cab.box[3],width<900?32:40);assert(Math.abs(cab.box[2]/cab.box[3]-3.3004)<.001);
   assert.equal(x.imgs[1].box[3],32);
   for(const i of x.imgs){
    // naturalWidth/naturalHeight arredondam o viewport implícito de SVG; medir pela proporção exata do viewBox.
    if(!proporcoes.has(i.src)){const r=await ctx.request.get(base+i.src);const svg=await r.text();const vb=svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);proporcoes.set(i.src,vb[2]/vb[3]);}
    assert(Math.abs(i.box[2]/i.box[3]-proporcoes.get(i.src))<.001,i.src+": proporção alterada");
    assert(i.box[2]>0&&i.box[0]>=-.5&&i.box[0]+i.box[2]<=width+.5);
   }
   for(const i of x.imgs.slice(2))assert(i.box[3]>=32,'símbolo compacto abaixo de 32 px');
   if(x.terreno)assert(x.terreno.includes('/ararat/marca-v2/linha-de-terreno.svg'));
   if(dados[key]){
    const old=dados[key];assert.deepEqual(x.textos,old.textos,key+': texto mudou');assert.deepEqual(x.cores,old.cores,key+': paleta do contexto mudou');
    assert.equal(x.hero,old.hero,key+': composição da Home mudou');
    for(let i=0;i<4;i++)assert(Math.abs(x.h1box[i]-old.h1box[i])<=.5,key+': título deslocado '+i);
   }
   ok(key+': marca, leitura, proporções, cabeçalho e título preservados');
  }
  await ctx.close();
 }
 if(coletar){writeFileSync(coletar,JSON.stringify(dados,null,2));console.log('Base salva:',Object.keys(dados).length);}
 else{
  const ctx=await b.newContext(),p=await ctx.newPage();
  for(const rota of ['/pt/empresa/equipe/matheus','/company/team/matheus','/es/empresa/equipo/matheus']){
   await p.goto(base+rota);assert((await p.locator('.cab img').getAttribute('src')).startsWith('/ararat/marca-v2/'));ok(rota+': identidade herdada na biografia');
  }
  const manifesto=await (await ctx.request.get(base+'/ararat/marca-v2/integracao.json')).json();
  for(const f of manifesto.arquivos){const r=await ctx.request.get(base+'/ararat/marca-v2/'+f.arquivo);assert.equal(r.status(),200);const bytes=await r.body();assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);if(f.arquivo.endsWith('.svg'))assert(!/<(?:script|image|foreignObject)\b|<filter\b|<linearGradient\b|<radialGradient\b|onload\s*=/i.test(bytes.toString()));ok(f.arquivo+': integridade do asset aprovado');}
  const fonts=[['SourceSans3-latin-wght.woff2','19143dca075972bc84e3fd9eab7416dd40cc565dccb2435a044bdfabe060c7d5'],['SourceSans3-latin-ext-wght.woff2','a85a7459bdb3cdc1136751e151a506bae653fc29ada3ca86237477df6f1b59e6']];
  for(const [f,hash]of fonts){const r=await ctx.request.get(base+'/ararat/fontes/'+f);assert.equal(createHash('sha256').update(await r.body()).digest('hex'),hash);ok(f+': fonte aprovada preservada');}
  await p.goto(base+'/pt');await p.keyboard.press('Tab');assert(await p.locator('.pular').evaluate(e=>e===document.activeElement));await p.keyboard.press('Tab');assert(await p.locator('.marca').evaluate(e=>e===document.activeElement));ok('teclado: pular e marca continuam focáveis');
  await ctx.close();console.log(total+' verificações aprovadas; 0 falhas');
 }
}finally{await b.close();}
