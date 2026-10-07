/* Porte literal de site/components/art/topo.ts (ridgeLines) para a prévia do Motion.
 * Mesmo algoritmo e mesma formatação: a saída é idêntica caractere a caractere (conferido em scripts/verificar.mjs). */
const f = (v) => v.toFixed(1);
export function ridgeLines(count, width, height) {
  const lines = [];
  for (let i = 0; i < count; i++) {
    const k = i / count;
    const base = height * (0.5 + k * 0.48);
    const amp = height * (0.5 - k * 0.38);
    let d = '';
    for (let x = 0; x <= width; x += 12) {
      const u = x / width;
      const peaks = [[0.64, 0.085, 1], [0.38, 0.07, 0.62], [0.86, 0.06, 0.48], [0.14, 0.09, 0.4]];
      let peak = 0;
      for (const [c, w, h] of peaks) peak = Math.max(peak, h * Math.exp(-Math.abs(u - c - k * 0.02) / w));
      const ripple = Math.sin(u * 23 + i * 0.7) * 0.025 + Math.sin(u * 9.3 + i * 1.3) * 0.04;
      const y = base - amp * (peak + ripple);
      d += `${x === 0 ? 'M' : 'L'}${f(x)} ${f(y)}`;
    }
    lines.push(d);
  }
  return lines;
}
