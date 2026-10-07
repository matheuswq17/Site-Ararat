// Evidência do CTA "Entre na imagem" por teclado na /previa (1280×720 e outras medidas).
// Reproduz a condição da falha (outra rolagem suave ainda em curso quando o Enter chega) e
// registra a chegada: rolagem, estado de cobertura e o Tab seguinte.
//   BASE=http://localhost:3000 LABEL=depois node tests/capture-cta.mjs <pasta>
import { chromium } from "playwright";
import { mkdirSync, appendFileSync } from "node:fs";
const out = process.argv[2] ?? "screenshots/previa-cta";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3000";
const LABEL = process.env.LABEL ?? "depois";
const b = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
for (const [w, h] of (process.env.VPS ?? "1280x720,1440x900,390x844").split(",").map((v) => v.split("x").map(Number))) {
  for (const lag of [null, 16]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.addInitScript(() => sessionStorage.setItem("ararat:intro", "1"));
    await p.goto(BASE + "/previa", { waitUntil: "networkidle" });
    await p.waitForTimeout(1200);
    await p.evaluate(() => [...document.querySelectorAll("#inicio a")].find((a) => a.textContent.trim() === "Entre na imagem").focus());
    if (lag != null) {
      await p.evaluate(() => { scrollTo({ top: 9, behavior: "instant" }); scrollTo({ top: 0, behavior: "smooth" }); });
      await p.waitForTimeout(lag);
    }
    await p.keyboard.press("Enter");
    await p.waitForTimeout(2200);
    const name = `${LABEL}-${w}x${h}-${lag == null ? "enter" : "enter-com-rolagem-em-curso"}`;
    const st = await p.evaluate(() => ({ y: Math.round(scrollY), hash: location.hash, cover: document.querySelector("[data-opening=root]").dataset.cover }));
    await p.screenshot({ path: `${out}/${name}-1-chegada.png` });
    await p.keyboard.press("Tab");
    await p.waitForTimeout(700);
    const t = await p.evaluate(() => ({ tab: document.activeElement.textContent.trim().slice(0, 24), y: Math.round(scrollY) }));
    await p.screenshot({ path: `${out}/${name}-2-tab.png` });
    const line = `${name}: chegada y=${st.y} ${st.hash} data-cover=${st.cover} · Tab → "${t.tab}" (y=${t.y})`;
    console.log(line);
    appendFileSync(`${out}/registro.txt`, line + "\n");
    await p.close();
  }
}
await b.close();
