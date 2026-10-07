// Gera screenshots em screenshots/atual/ a partir do servidor em localhost:3000 (node tests/screenshots.mjs [largura]).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
mkdirSync('screenshots/atual', { recursive: true });
const b = await chromium.launch();
const only = process.argv[2];
for (const [w,h] of [[1440,900],[768,1024],[390,844]]) {
  if (only && String(w)!==only) continue;
  const p = await b.newPage({ viewport:{width:w,height:h} });
  const errs=[]; p.on('console', m=>{ if(m.type()==='error'||m.type()==='warning') errs.push(m.text())}); p.on('pageerror', e=>errs.push(String(e)));
  await p.goto('http://localhost:3000/', {waitUntil:'networkidle'});
  await p.screenshot({path:`screenshots/atual/home-${w}-fold.png`});
  const H = await p.evaluate(()=>document.documentElement.scrollHeight);
  for (let y=0;y<H;y+=h/2){ await p.evaluate(y=>window.scrollTo(0,y),y); await p.waitForTimeout(120);}
  await p.waitForLoadState('networkidle');
  await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(400);
  await p.screenshot({path:`screenshots/atual/home-${w}-full.png`, fullPage:true});
  // journey states
  await p.evaluate(()=>{ const t=document.querySelector('#jornada'); window.scrollTo({top: t.getBoundingClientRect().top+scrollY+ (innerWidth>=960? t.querySelector('header').offsetHeight+60:0), behavior:'instant'}); });
  await p.waitForTimeout(300);
  for (let i=0;i<4;i++){
    const btn = p.locator('#jornada [role=group] button').nth(i);
    await btn.click({timeout:5000}); await p.waitForTimeout(1200);
    const jt = await p.locator('#jornada').evaluate(e=>({p:e.dataset.progress,a:e.dataset.activeStep}));
    if (w===390) await btn.scrollIntoViewIfNeeded();
    await p.screenshot({path:`screenshots/atual/jornada-${w}-etapa${i+1}.png`});
    console.log(w,'step',i,jt);
  }
  const ov = await p.evaluate(()=>document.documentElement.scrollWidth - window.innerWidth);
  console.log(w, 'height', H, 'overflowX', ov, 'errors', errs);
  await p.close();
}
await b.close();
