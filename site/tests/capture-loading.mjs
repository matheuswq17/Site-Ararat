// Capturas do carregamento tardio na /previa real: "esperando" (passagem concluída, RM ainda
// chegando: controles ocultos + aviso) e "disponível" (revelação concluída: controles liberados).
//   node tests/capture-loading.mjs <pasta>   (servidor em :3000)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/previa-carregamento";
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const VPS = [[1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568]];
for (const [w, h] of VPS) {
  let release;
  const gate = new Promise((r) => (release = r));
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.route(/mri-base\.webp/, async (r) => { await gate; await r.continue(); });
  await p.goto("http://localhost:3000/previa", { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => document.querySelector("[data-opening=root]")?.dataset.sculpture === "canvas", null, { timeout: 10000 });
  await p.locator("a", { hasText: "Entre na imagem" }).focus();
  await p.keyboard.press("Enter"); // entrada por teclado
  await p.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.cover === "loading", null, { timeout: 8000 });
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/${w}x${h}-1-esperando.png` });
  release();
  await p.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.cover === "revealed", null, { timeout: 10000 });
  await p.keyboard.press("Tab"); // primeiro controle, com foco visível
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/${w}x${h}-2-disponivel.png` });
  await p.close();
}
// Falha definitiva da RM: não fica esperando — aviso local da cena e controles liberados.
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
  await p.route(/mri-base\.webp/, (r) => r.fulfill({ status: 404, body: "" }));
  await p.goto("http://localhost:3000/previa", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(800);
  await p.locator("a", { hasText: "Entre na imagem" }).focus();
  await p.keyboard.press("Enter");
  await p.waitForFunction(() => document.querySelector("[data-opening=root]").dataset.cover === "revealed", null, { timeout: 12000 });
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}/${w}x${h}-3-falha-da-rm.png` });
  await p.close();
}
await b.close();
console.log("ok");
