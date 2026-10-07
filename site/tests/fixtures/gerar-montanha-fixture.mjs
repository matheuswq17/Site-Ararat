// FIXTURE DE TESTE do Site — NÃO é a montanha do Motion nem proposta estética.
// Só exercita o validador e o caminho de integração (formato de geometria pedido ao Motion).
import { writeFileSync } from "node:fs";
const W = 1440, H = 360;
const g = (x, c, s) => Math.exp(-((x - c) ** 2) / (2 * s * s));
const relevo = (x) => 300 * g(x, 900, 105) + 200 * g(x, 680, 60) + 60 * g(x, 1180, 160);
const linhas = [];
const N = 22;
for (let i = 0; i < N; i++) {
  const k = 1 - i / N; // 1 = crista mais alta
  const base = 352 - i * 1.5;
  let d = "";
  for (let x = 0; x <= W; x += 12) {
    const y = Math.max(8, base - relevo(x) * k);
    d += (x ? " L" : "M") + x + " " + y.toFixed(1);
  }
  linhas.push({ d, stroke: "#415A77", opacity: +(0.2 + (i / N) * 0.35).toFixed(3), width: 1 });
}
const geo = { versao: "fixture", viewBox: [0, 0, W, H], preserveAspectRatio: "xMidYMax slice", linhas, ouro: 0 };
writeFileSync(new URL("./montanha-fixture.json", import.meta.url), JSON.stringify(geo));
console.log("ok", linhas.length);
