import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://127.0.0.1:3302';
const results = [];
const check = (name, value) => { results.push({ name, ok: !!value }); assert.ok(value, name); console.log('ok: '+name); };
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(base+'/pt');
  const groups = p.locator('header .nav .nav-grupo');
  check('Quatro categorias com expansão própria', await groups.count() === 4);
  await groups.nth(0).locator('.nav-principal').hover();
  await p.waitForFunction(() => document.querySelector('.nav [data-nav-grupo] details')?.open);
  check('Hover abre Soluções', await groups.nth(0).locator('details').getAttribute('open') !== null);
  await groups.nth(0).locator('.nav-painel a').first().hover();
  check('Painel continua aberto ao mover para o submenu', await groups.nth(0).locator('details').getAttribute('open') !== null);
  await p.keyboard.press('Escape');
  check('Esc fecha mesmo com o ponteiro no submenu', await p.locator('.nav details[open]').count() === 0);
  await groups.nth(1).locator('summary').focus();
  await p.keyboard.press('Enter');
  check('Enter abre o controle separado do link', await groups.nth(1).locator('details').getAttribute('open') !== null);
  await p.keyboard.press('ArrowDown');
  check('Seta entra no primeiro atalho', await groups.nth(1).locator('.nav-painel a').first().evaluate(e => e === document.activeElement));
  await p.keyboard.press('Escape');
  check('Esc devolve foco ao expansor', await groups.nth(1).locator('summary').evaluate(e => e === document.activeElement));
  const before = await p.evaluate(() => scrollY);
  await groups.nth(2).locator('.nav-principal').hover();
  await p.waitForFunction(() => document.querySelectorAll('.nav details[open]').length === 1);
  check('Um único painel aberto e rolagem preservada', await p.locator('.nav details[open]').count() === 1 && await p.evaluate(() => scrollY) === before);
  await p.locator('main h1').click();
  check('Clique fora fecha', await p.locator('.nav details[open]').count() === 0);
  const footer = p.locator('footer .rod-link').first();
  await footer.scrollIntoViewIfNeeded();
  await p.mouse.move(5,5);
  const initial = await footer.evaluate(e => getComputedStyle(e,'::after').transform);
  await footer.hover(); await p.waitForTimeout(220);
  const final = await footer.evaluate(e => getComputedStyle(e,'::after').transform);
  check('Sublinhado do rodapé cresce com origem à esquerda', initial.includes('matrix(0,') && final.includes('matrix(1,') && (await footer.evaluate(e => getComputedStyle(e,'::after').transformOrigin)).startsWith('0px'));
  for (const path of ['/pt','/','/es']) {
    await p.goto(base+path);
    const links = await p.locator('header .nav .nav-painel a').evaluateAll(es => es.map(e => e.getAttribute('href')));
    check(path+': atalhos localizados', links.length === 13 && links.every(x => path === '/pt' ? x.startsWith('/pt/') : path === '/es' ? x.startsWith('/es/') : !/^\/(pt|es)(\/|$)/.test(x)));
    for (const href of links) {
      const [route,anchor] = href.split('#'); const r=await p.request.get(base+route); const html=await r.text();
      check('Destino existente '+href, r.status() === 200 && (!anchor || html.includes('id="'+anchor+'"')));
    }
  }
  await ctx.close();
  const mobile = await browser.newContext({ viewport:{width:390,height:844},isMobile:true,hasTouch:true });
  const m = await mobile.newPage(); await m.goto(base+'/pt');
  await m.locator('[data-menu] > summary').click();
  const mg=m.locator('.painel-menu [data-nav-grupo]').first(); await mg.locator('summary').click();
  check('Celular abre os mesmos atalhos por toque', await mg.locator('.nav-painel a').first().isVisible());
  check('Celular sem rolagem horizontal', await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await m.keyboard.press('Escape'); await m.keyboard.press('Escape');
  check('Esc fecha o menu móvel sem salto', await m.locator('[data-menu]').getAttribute('open') === null && await m.evaluate(()=>scrollY)===0);
  await mobile.close();
  for (const mode of ['nojs','reduced','paused']) {
    const c=await browser.newContext({viewport:{width:1440,height:900},javaScriptEnabled:mode!=='nojs',reducedMotion:mode==='reduced'?'reduce':'no-preference'});
    if(mode==='paused')await c.addInitScript(()=>sessionStorage.setItem('ararat:paused','1'));
    const page=await c.newPage(); await page.goto(base+'/pt'); await page.locator('.nav summary').first().click();
    check(mode+': expansão continua utilizável',await page.locator('.nav .nav-painel a').first().isVisible());
    if(mode!=='nojs')check(mode+': efeitos imediatos',await page.locator('footer .rod-link').first().evaluate(e=>getComputedStyle(e,'::after').transitionDuration)==='0s');
    await c.close();
  }
} finally {
  await browser.close();
  if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify(results,null,2));
}
console.log(results.length+' verificações aprovadas.');
