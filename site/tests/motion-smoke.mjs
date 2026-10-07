// Smoke test do pacote real de motion integrado (status no console; capturas em screenshots/rodada-02-motion-smoke). Requer build com ARARAT_HARNESS=1.
import { chromium } from 'playwright';
const b = await chromium.launch();
const out = [];
for (const [w,h] of [[1440,900],[390,844]]) {
  const ctx = await b.newContext({viewport:{width:w,height:h}});
  const p = await ctx.newPage(); const errs=[];
  p.on('pageerror', e=>errs.push(String(e))); p.on('console', m=>m.type()==='error'&&errs.push(m.text()));
  await p.goto('http://localhost:3000/', {waitUntil:'networkidle'});
  await p.evaluate(()=>{const t=document.querySelector("#jornada [class*='track']"); scrollTo({top:t.getBoundingClientRect().top+scrollY,behavior:'instant'})});
  await p.waitForFunction(()=>['ready','failed'].includes(document.querySelector('#jornada [data-motion-status]')?.dataset.motionStatus),null,{timeout:8000}).catch(()=>{});
  const st = await p.locator('#jornada [data-motion-status]').getAttribute('data-motion-status');
  out.push(`${w}: status=${st}`);
  for (let i=0;i<4;i++){ const btn=p.locator('#jornada [role=group] button').nth(i); await btn.click(); await p.waitForTimeout(1300); if(w===390) await p.locator('#jornada [class*="frame"]').scrollIntoViewIfNeeded(); await p.screenshot({path:`screenshots/rodada-02-motion-smoke/motion-smoke-${w}-${i}.png`}); }
  for (let i=3;i>=0;i--){ await p.locator('#jornada [role=group] button').nth(i).click(); await p.waitForTimeout(1300);} 
  await p.emulateMedia({reducedMotion:'reduce'}); await p.waitForTimeout(300);
  await p.locator('#jornada').getByRole('button',{name:/Movimento reduzido/}).count().then(c=>out.push(`${w}: reduced toggle ok=${c===1}`));
  const nodes = await p.locator('#jornada [class*="motionLayer"] *').count();
  out.push(`${w}: nodes in motion layer=${nodes}; errors=${JSON.stringify(errs)}`);
  await ctx.close();
}
const ctx = await b.newContext({viewport:{width:1440,height:900}}); const p = await ctx.newPage(); const errs=[];
p.on('pageerror', e=>errs.push(String(e)));
await p.goto('http://localhost:3000/teste/ponte',{waitUntil:'networkidle'});
await p.waitForFunction(()=>document.querySelector('[data-motion-status]')?.dataset.motionStatus==='ready',null,{timeout:8000}).catch(()=>{});
const before = await p.evaluate(()=>document.querySelectorAll('[class*="motionLayer"] *').length);
const rafBefore = await p.evaluate(()=>new Promise(r=>{let n=0;const o=window.requestAnimationFrame;window.__raf=0;window.requestAnimationFrame=(cb)=>{window.__raf++;return o(cb)};setTimeout(()=>r(window.__raf),1000)}));
await p.click('#toggle-journey'); await p.waitForTimeout(300);
const rafAfter = await p.evaluate(()=>new Promise(r=>{window.__raf=0;setTimeout(()=>r(window.__raf),1000)}));
const links = await p.locator('link[data-ararat-motion]').count();
out.push(`harness: nodes before=${before}; raf/s mounted=${rafBefore}; raf/s after unmount=${rafAfter}; stylesheet after=${links}; errors=${JSON.stringify(errs)}`);
await p.click('#toggle-journey'); await p.waitForTimeout(1500);
out.push(`harness remount status=${await p.locator('[data-motion-status]').getAttribute('data-motion-status')}`);
await b.close(); console.log(out.join('\n'));
