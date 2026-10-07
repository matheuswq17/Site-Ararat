/*
 * ARARAT MODEL — montanha da marca no hero (“Da imagem ao conhecimento”)
 * PACOTE EXPERIMENTAL 0.4.0-draft — montanha B (escolhida pelo usuário), refinada. Só /previa.
 * Não substitui home-v2 0.2.1-draft nem o pacote journey 0.4.0 ready. A proposta original
 * (estudos A/B, 0.3.0-exp) fica intacta em proposta/home-montanha/ para comparação.
 *
 * A montanha é uma INTERPRETAÇÃO TOPOGRÁFICA da marca: não é geografia exata do monte real e não
 * é anatomia. A RM é a aplicação atual: na passagem a montanha vira mapa e o mapa abre uma janela
 * circular sobre a RM real da jornada — sem morph entre montanha e órgão.
 *
 * Integração “B” da home-v2 (API preservada):
 *   setLayout({art, target, ready, arc}) — px do container;
 *   setPassage(p) — progresso 0..1 derivado da rolagem pelo Site (único “relógio” da passagem);
 *   setPaused / setReducedMotion / playIntro / setIntroTime / getComposition / destroy.
 * Cobertura, revelação (ready + readyK) e entrega do arco à jornada (start-arc-v1) são as da 0.2.1;
 * a passagem (tempos, câmera, mapa, janela) é a do estudo B da 0.3.0-exp, sem mudança.
 *
 * Desenho: campo de alturas de cristas (faces com inclinações diferentes de cada lado, máximo
 * exato + suavização gaussiana, deformação de baixa frequência — sem ruído de rugosidade),
 * amostrado numa grade no espaço da câmera; faixas pintadas de trás para frente (ocultação);
 * luz lateral suave com oclusão dos vales e gradação de profundidade; curvas de nível por
 * marching squares, mestras e secundárias com pesos distintos.
 * Custo: a vista do herói é desenhada uma vez e reaproveitada (em repouso não há laço de quadros);
 * na rolagem o relevo sólido só translada/escala até a câmera subir, e o mapa usa poucos traços.
 * ESM sem dependências; Canvas 2D; sem rede; sem listeners globais.
 */

export const VERSION = '0.6.0-draft';
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const INTRO_MS = 1200;
const READY_MS = 450;
/* ambiente do herói (0.6.0) — a forma não se move; a vida vem da luz:
   (1) ARCO: o traço dourado de base fica sempre visível; uma faixa luminosa (núcleo #EAD28A, ~15 % do arco
       visível na tela) vai e volta sobre ele — 8 s por ciclo, 4 s por sentido, cubic-bezier(0.77,0,0.175,1);
   (2) RELEVO: uma onda de realce sobe pelas curvas de nível já desenhadas (2–3 curvas vizinhas, #F5F7FA,
       opacidade máx. 0,45), do trecho baixo VISÍVEL na tela até os cumes — 6 s por travessia, linear, nova
       onda a cada 5 s (no máximo duas ao mesmo tempo).
   Entra em 300 ms (cubic-bezier(0.23,1,0.32,1)) depois de a abertura assentar; a passagem a apaga pelo
   progresso: ganho 1 − (3t² − 2t³), t = p / 0,04. */
// enquadramento: celular (arco relativo à largura, escala da montanha relativa ao arco) e dissolução lateral
const NARROW = { arc: 0.37, k: 0.95 };
const EDGE_FADE = { margin: 14, band: (w) => Math.max(34, w * 0.1) };
const AMB = {
  arcCycle: 8000, bandFrac: 0.15, bandMin: 14, core: [234, 210, 138], coreW: { wide: 3, narrow: 2.5 },
  waveDur: 6000, wavePeriod: 5000, waveSigma: 1.25, waveAlpha: 0.45, waveColor: [245, 247, 250], waveCore: 1.9, waveSoft: 0.42, waveSoftW: 3.6,
  enter: 300, pEnd: 0.04,
};
/* curva de Bézier cúbica (CSS cubic-bezier): x → y por Newton + bisseção */
function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t, dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-6) return Y(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 30; i++) { const v = X(t); if (Math.abs(v - x) < 1e-6) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return Y(t);
  };
}
const EASE_ARC = cubicBezier(0.77, 0, 0.175, 1);
const EASE_ENTER = cubicBezier(0.23, 1, 0.32, 1);
const RGB = {
  navy: [13, 27, 42],
  navyHi: [24, 44, 66],
  navyLo: [8, 15, 24],
  slate: [65, 90, 119],
  gray: [176, 184, 193],
  white: [245, 247, 250],
  gold: [212, 175, 55],
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (v, a, b) => clamp01((v - a) / (b - a));
const smooth = (a, b, v) => { const t = seg(v, a, b); return t * t * (3 - 2 * t); };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp01(a).toFixed(3)})`;
const isRect = (r) => r && [r.x, r.y, r.w, r.h].every(Number.isFinite) && r.w > 0 && r.h > 0;

/* ---------------------------------------------------------------------------------------------
 * MONTANHA B (refinada) — cristas em coordenadas do relevo: [x, z, h, m?]; z > 0 = em direção à
 * câmera; h normalizado (cume = 1); m = inclinação das faces. `side` = fator das faces à direita
 * do sentido da crista (assimetria: uma face mais íngreme que a outra). Mesmo arranjo do estudo B:
 * cume, sela funda, pico secundário à esquerda/frente, crista longa a leste, esporões e vales.
 * ------------------------------------------------------------------------------------------- */
const SPUR = (pts, side = 1, m0 = 1.12, m1 = 0.8) => ({ m: m0, side, pts: pts.map((p, i, a) => (p.length > 3 ? p : [...p, lerp(m0, m1, i / (a.length - 1))])) });
export const MOUNTAIN = {
  id: 'B',
  nome: 'Montanha B refinada',
  elev: 23, // câmera oblíqua (mesma do estudo B)
  yaw: -14, // vista em 3/4
  kappa: 0.98,
  summitDrop: 0.24,
  gamma: 1.22, // encostas côncavas, sopés longos
  warp: { amp: 0.045, freq: 1.05, seed: 23 }, // curvatura suave das cristas (baixa frequência; sem rugosidade)
  blur: 0.02, // suavização gaussiana (unidades do relevo): cristas firmes, sem fio de faca
  light: [-0.8, 0.58, 0.2], // luz lateral da esquerda, um pouco elevada
  levels: 30,
  peaks: { summit: [0.05, -0.14], secondary: [-0.74, 0.1] },
  ridges: [
    // crista principal W→E: alturas descem de forma contínua dos dois picos (sem picos menores competindo);
    // cume com uma crista curta (não termina em ponta de cone). Face da frente mais suave que a de trás.
    { m: 1.12, side: 1.3, pts: [[-1.66, 0.32, 0.0], [-1.14, 0.22, 0.4], [-0.84, 0.125, 0.745], [-0.74, 0.1, 0.8], [-0.67, 0.08, 0.765], [-0.56, 0.05, 0.65], [-0.37, 0.0, 0.54], [-0.17, -0.07, 0.75], [-0.03, -0.125, 0.945], [0.05, -0.14, 1.0], [0.13, -0.137, 0.962], [0.24, -0.13, 0.912], [0.34, -0.12, 0.85], [0.56, -0.09, 0.72], [0.82, -0.03, 0.58], [1.12, 0.06, 0.39], [1.64, 0.18, 0.0]] },
    // esporões frontais planejados (vales contínuos entre eles); a raiz fica um pouco abaixo da crista
    SPUR([[-0.04, -0.11, 0.93], [-0.04, 0.26, 0.6], [-0.1, 0.62, 0.28], [-0.14, 1.0, 0.0]], 0.88),
    SPUR([[0.2, -0.11, 0.915], [0.32, 0.2, 0.63], [0.46, 0.56, 0.31], [0.58, 0.96, 0.0]], 1.12),
    SPUR([[0.56, -0.05, 0.7], [0.66, 0.24, 0.42], [0.75, 0.6, 0.13], [0.8, 0.82, 0.0]], 0.92, 1.18, 0.9),
    SPUR([[0.82, 0.0, 0.565], [0.92, 0.35, 0.29], [1.0, 0.76, 0.0]], 1.1),
    SPUR([[-0.74, 0.14, 0.785], [-0.72, 0.46, 0.42], [-0.7, 0.92, 0.0]], 1.1),
    SPUR([[-0.78, 0.14, 0.77], [-1.0, 0.44, 0.33], [-1.2, 0.8, 0.0]], 0.9),
    SPUR([[-0.37, 0.04, 0.525], [-0.38, 0.38, 0.25], [-0.4, 0.78, 0.0]], 1.0, 1.08, 0.82),
    // vertentes posteriores (aparecem no mapa)
    SPUR([[0.04, -0.18, 0.97], [-0.06, -0.62, 0.46], [-0.16, -1.15, 0.0]], 1.05, 1.05, 0.85),
    SPUR([[0.56, -0.13, 0.7], [0.66, -0.6, 0.32], [0.76, -1.05, 0.0]], 0.95, 1.05, 0.85),
    SPUR([[-0.74, 0.06, 0.785], [-0.86, -0.32, 0.34], [-0.96, -0.76, 0.0]], 1.0, 1.05, 0.85),
    // sopé largo (contrafortes baixos que ligam a base)
    { m: 0.5, side: 1, pts: [[-1.1, 0.3, 0.18], [0.0, 0.16, 0.22], [1.1, 0.26, 0.16]] },
  ],
};

/* ---------- ruído suave determinístico (só para a deformação de baixa frequência) ---------- */
function hash2(i, j, seed) {
  let h = (i * 374761393 + j * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y, seed) {
  const i = Math.floor(x), j = Math.floor(y);
  const fx = x - i, fy = y - j;
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const a = hash2(i, j, seed), b = hash2(i + 1, j, seed), c = hash2(i, j + 1, seed), d = hash2(i + 1, j + 1, seed);
  return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
}

/** Altura do relevo h(x, z) antes da suavização (coordenadas do relevo). Pura e determinística. */
export function makeHeight(S = MOUNTAIN) {
  const segs = [];
  for (const r of S.ridges) {
    for (let i = 0; i < r.pts.length - 1; i++) {
      const [x0, z0, h0, m0 = r.m] = r.pts[i];
      const [x1, z1, h1, m1 = r.m] = r.pts[i + 1];
      const dx = x1 - x0, dz = z1 - z0;
      segs.push({ x0, z0, h0, dx, dz, dh: h1 - h0, l2: dx * dx + dz * dz || 1e-9, m0, dm: m1 - m0, side: r.side ?? 1 });
    }
  }
  const W = S.warp;
  return function h(x0, z0) {
    // deformação suave: as cristas se curvam levemente (não são retas de pirâmide)
    const x = x0 + W.amp * vnoise(x0 * W.freq + 4.1, z0 * W.freq - 2.3, W.seed);
    const z = z0 + W.amp * vnoise(x0 * W.freq - 7.7, z0 * W.freq + 5.9, W.seed + 7);
    let mx = 0;
    for (let q = 0; q < segs.length; q++) {
      const g = segs[q];
      const t = clamp01(((x - g.x0) * g.dx + (z - g.z0) * g.dz) / g.l2);
      const px = x - (g.x0 + t * g.dx), pz = z - (g.z0 + t * g.dz);
      const cross = g.dx * pz - g.dz * px; // lado da crista
      const m = (g.m0 + t * g.dm) * (cross > 0 ? g.side : 1);
      const v = g.h0 + t * g.dh - m * Math.sqrt(px * px + pz * pz);
      if (v > mx) mx = v;
    }
    return mx > 0 ? Math.pow(mx, S.gamma) : 0;
  };
}

function gaussBlur(src, cols, rows, sigmaCells) {
  if (sigmaCells < 0.3) return Float32Array.from(src);
  const r = Math.ceil(sigmaCells * 2.6);
  const k = new Float32Array(2 * r + 1);
  let ks = 0;
  for (let i = -r; i <= r; i++) { k[i + r] = Math.exp(-(i * i) / (2 * sigmaCells * sigmaCells)); ks += k[i + r]; }
  for (let i = 0; i < k.length; i++) k[i] /= ks;
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    let s = 0;
    for (let q = -r; q <= r; q++) s += src[j * cols + clamp(i + q, 0, cols - 1)] * k[q + r];
    tmp[j * cols + i] = s;
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    let s = 0;
    for (let q = -r; q <= r; q++) s += tmp[clamp(j + q, 0, rows - 1) * cols + i] * k[q + r];
    out[j * cols + i] = s;
  }
  return out;
}

/* encadeia segmentos [u1,v1,u2,v2,L] (pontas compartilhadas são idênticas entre células vizinhas)
   em polilinhas e simplifica cada uma (Douglas–Peucker, em unidades de célula) */
function chainSegments(arr, eps) {
  const n = arr.length / 5;
  const key = (u, v, L) => `${u.toFixed(5)}|${v.toFixed(5)}|${L}`;
  const ends = new Map();
  for (let s = 0; s < n; s++) for (const e of [0, 1]) {
    const k = key(arr[s * 5 + e * 2], arr[s * 5 + e * 2 + 1], arr[s * 5 + 4]);
    if (!ends.has(k)) ends.set(k, []);
    ends.get(k).push(s * 2 + e);
  }
  const used = new Uint8Array(n);
  const pts = [], starts = [], levels = [];
  const other = (se, k) => (ends.get(k) || []).find((x) => (x >> 1) !== (se >> 1) && !used[x >> 1]);
  const walk = (s0, e0) => { // segue a partir da ponta e0 do segmento s0
    const out = [];
    let s = s0, e = e0;
    for (;;) {
      const o = 1 - e; // a outra ponta
      out.push(arr[s * 5 + o * 2], arr[s * 5 + o * 2 + 1]);
      const nx = other(s * 2 + o, key(arr[s * 5 + o * 2], arr[s * 5 + o * 2 + 1], arr[s * 5 + 4]));
      if (nx == null) break;
      s = nx >> 1; e = nx & 1; used[s] = 1;
    }
    return out;
  };
  for (let s = 0; s < n; s++) {
    if (used[s]) continue;
    used[s] = 1;
    const fwd = walk(s, 0); // a partir da ponta 0 em direção à ponta 1
    const back = walk(s, 1); // e no sentido contrário
    const line = [];
    for (let i = back.length - 2; i >= 0; i -= 2) line.push(back[i], back[i + 1]);
    line.push(arr[s * 5], arr[s * 5 + 1]);
    for (let i = 0; i < fwd.length; i++) line.push(fwd[i]);
    const simp = dp(line, eps);
    starts.push(pts.length / 2); levels.push(arr[s * 5 + 4]);
    for (const v of simp) pts.push(v);
  }
  starts.push(pts.length / 2);
  return { pts: new Float32Array(pts), starts: new Int32Array(starts), levels: new Float32Array(levels), segs: n };
}
function dp(line, eps) {
  const m = line.length / 2;
  if (m < 3) return line;
  const keep = new Uint8Array(m); keep[0] = keep[m - 1] = 1;
  const stack = [[0, m - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const ax = line[a * 2], ay = line[a * 2 + 1], bx = line[b * 2], by = line[b * 2 + 1];
    const ex = bx - ax, ey = by - ay, L2 = ex * ex + ey * ey;
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) { // distância ao SEGMENTO (vale também para laços fechados, a == b)
      const px = line[i * 2] - ax, py = line[i * 2 + 1] - ay;
      const t = L2 > 1e-12 ? clamp((px * ex + py * ey) / L2, 0, 1) : 0;
      const d = Math.hypot(px - t * ex, py - t * ey);
      if (d > best) { best = d; bi = i; }
    }
    if (best > eps) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  const out = [];
  for (let i = 0; i < m; i++) if (keep[i]) out.push(line[i * 2], line[i * 2 + 1]);
  return out;
}

/* ---------- grade no espaço da câmera, sombreamento e curvas de nível ---------- */
const GRID = { x0: -1.8, x1: 1.8, z0: -1.3, z1: 1.18 };
function buildTerrain(S, lite) {
  const cols = lite ? 150 : 232;
  const rows = lite ? 96 : 150;
  const dx = (GRID.x1 - GRID.x0) / (cols - 1), dz = (GRID.z1 - GRID.z0) / (rows - 1);
  const cy = Math.cos(S.yaw * DEG), sy = Math.sin(S.yaw * DEG);
  const hf = makeHeight(S);
  const H0 = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    const zc = GRID.z0 + j * dz;
    for (let i = 0; i < cols; i++) {
      const xc = GRID.x0 + i * dx;
      H0[j * cols + i] = hf(xc * cy - zc * sy, xc * sy + zc * cy); // câmera → relevo
    }
  }
  // suavização gaussiana com o mesmo raio em unidades do relevo nas duas qualidades: mais macia nas
  // encostas (sem vincos de papel amassado), mais firme perto dos cumes (sem topo liso de cúpula)
  const Hb = gaussBlur(H0, cols, rows, S.blur / dx);
  const Hs = gaussBlur(H0, cols, rows, (S.blur * 0.3) / dx);
  let hb = 0;
  for (let id = 0; id < Hb.length; id++) if (Hb[id] > hb) hb = Hb[id];
  const H = new Float32Array(Hb.length);
  for (let id = 0; id < Hb.length; id++) { const w = smooth(0.55, 0.85, Hb[id] / hb); H[id] = Hb[id] * (1 - w) + Hs[id] * w; }
  // média larga: base da oclusão dos vales (onde o relevo fica abaixo da vizinhança)
  const HB = gaussBlur(H, cols, rows, 0.06 / dx);
  let hMax = 0;
  for (let id = 0; id < H.length; id++) if (H[id] > hMax) hMax = H[id];
  const N = cols * rows;
  const NX = new Float32Array(N), NY = new Float32Array(N), NZ = new Float32Array(N), EDGE = new Float32Array(N), AO = new Float32Array(N), SL = new Float32Array(N);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const id = j * cols + i;
      const hx = (H[j * cols + Math.min(cols - 1, i + 1)] - H[j * cols + Math.max(0, i - 1)]) / (2 * dx);
      const hz = (H[Math.min(rows - 1, j + 1) * cols + i] - H[Math.max(0, j - 1) * cols + i]) / (2 * dz);
      const n = Math.hypot(hx, 1, hz);
      NX[id] = -hx / n; NY[id] = 1 / n; NZ[id] = -hz / n;
      SL[id] = Math.hypot(hx, hz);
      AO[id] = clamp01(1 - 6 * Math.max(0, HB[id] - H[id]));
      const xc = GRID.x0 + i * dx, zc = GRID.z0 + j * dz;
      EDGE[id] = smooth(GRID.x1, GRID.x1 - 0.3, Math.abs(xc)) * smooth(GRID.z0, GRID.z0 + 0.25, zc) * smooth(GRID.z1, GRID.z1 - 0.55, zc) * smooth(0, 0.16, H[id]);
    }
  }
  const iMin = new Int16Array(rows), iMax = new Int16Array(rows);
  for (let j = 0; j < rows; j++) {
    let a = cols, b = -1;
    for (let i = 0; i < cols; i++) {
      const e = Math.max(EDGE[j * cols + i], j + 1 < rows ? EDGE[(j + 1) * cols + i] : 0);
      if (e > 0.002) { if (i < a) a = i; b = i; }
    }
    iMin[j] = Math.max(0, a - 1); iMax[j] = Math.min(cols - 1, b + 1);
  }
  // curvas de nível (marching squares), agrupadas pela fileira de células; mestras a cada 5
  const K = lite ? Math.round(S.levels * 0.7) : S.levels;
  const step = hMax / (K + 0.5);
  const lines = [];
  for (let j = 0; j < rows - 1; j++) {
    const norm = [], idx = [];
    for (let i = 0; i < cols - 1; i++) {
      const a = H[j * cols + i], b = H[j * cols + i + 1], c = H[(j + 1) * cols + i + 1], d = H[(j + 1) * cols + i];
      const lo = Math.min(a, b, c, d), hi = Math.max(a, b, c, d);
      if (hi < step) continue;
      for (let k = Math.max(1, Math.ceil(lo / step)); k * step < hi && k <= K; k++) {
        const L = k * step;
        const cs = (a > L ? 1 : 0) | (b > L ? 2 : 0) | (c > L ? 4 : 0) | (d > L ? 8 : 0);
        if (cs === 0 || cs === 15) continue;
        const e0 = () => [i + (L - a) / (b - a), j];
        const e1 = () => [i + 1, j + (L - b) / (c - b)];
        const e2 = () => [i + (L - d) / (c - d), j + 1];
        const e3 = () => [i, j + (L - a) / (d - a)];
        const out = (k % 5 === 0) ? idx : norm;
        const push = (p, q) => out.push(p[0], p[1], q[0], q[1], L);
        const mid = (a + b + c + d) / 4 > L;
        switch (cs) {
          case 1: case 14: push(e3(), e0()); break;
          case 2: case 13: push(e0(), e1()); break;
          case 3: case 12: push(e3(), e1()); break;
          case 4: case 11: push(e1(), e2()); break;
          case 6: case 9: push(e0(), e2()); break;
          case 7: case 8: push(e2(), e3()); break;
          case 5: if (mid) { push(e0(), e1()); push(e2(), e3()); } else { push(e3(), e0()); push(e1(), e2()); } break;
          case 10: if (mid) { push(e3(), e0()); push(e1(), e2()); } else { push(e0(), e1()); push(e2(), e3()); } break;
        }
      }
    }
    lines.push({ norm: new Float32Array(norm), idx: new Float32Array(idx) });
  }
  // curvas para o modo “mapa/arame” (sem ocultação): 3 faixas de altitude × mestras/secundárias
  const groups = Array.from({ length: 6 }, () => []);
  lines.forEach((Lr) => {
    for (const [arr, isIdx] of [[Lr.norm, 0], [Lr.idx, 1]]) {
      for (let q = 0; q < arr.length; q += 5) {
        const xc = GRID.x0 + arr[q] * dx, zc = GRID.z0 + arr[q + 1] * dz;
        const edge = smooth(GRID.x1, GRID.x1 - 0.3, Math.abs(xc)) * smooth(GRID.z0, GRID.z0 + 0.25, zc) * smooth(GRID.z1, GRID.z1 - 0.55, zc);
        if (edge < 0.25) continue;
        const f = arr[q + 4] / hMax;
        const bin = f < 0.22 ? 0 : f < 0.5 ? 1 : 2;
        groups[bin * 2 + isIdx].push(arr[q], arr[q + 1], arr[q + 2], arr[q + 3], arr[q + 4]);
      }
    }
  });
  // 0.5.0: os segmentos do marching squares são encadeados em polilinhas e simplificados (Douglas–Peucker,
  // tolerância de 0,08 célula): o mapa passa de milhares de subcaminhos (cada um com pontas arredondadas)
  // para poucas centenas de linhas contínuas — mesmo desenho, muito menos rasterização por quadro.
  const wire = groups.map((g, k) => ({ ...chainSegments(g, 0.08), idx: k % 2 === 1, a: [0.32, 0.56, 0.8][k >> 1] * (k % 2 ? 1 : 0.5) }));
  const toCam = ([x, z]) => {
    const xc = x * cy + z * sy, zc = -x * sy + z * cy;
    const i = clamp(Math.round((xc - GRID.x0) / dx), 0, cols - 1), j = clamp(Math.round((zc - GRID.z0) / dz), 0, rows - 1);
    let best = -1, bi = i, bj = j;
    for (let q = -4; q <= 4; q++) for (let r = -4; r <= 4; r++) {
      const ii = clamp(i + r, 0, cols - 1), jj = clamp(j + q, 0, rows - 1);
      if (H[jj * cols + ii] > best) { best = H[jj * cols + ii]; bi = ii; bj = jj; }
    }
    return { x: GRID.x0 + bi * dx, z: GRID.z0 + bj * dz, h: best };
  };
  return { cols, rows, dx, dz, H, NX, NY, NZ, EDGE, AO, SL, iMin, iMax, lines, wire, hMax, step, K, summit: toCam(S.peaks.summit), secondary: toCam(S.peaks.secondary) };
}

/* material: luz lateral suave (envolvente), oclusão nos vales, gradação de altitude e de profundidade.
   Branco suave e azul acinzentado da marca; sem brilho especular. Retorna [cor, luminância 0..1, névoa]. */
function surfaceColor(lam, t, ao, zc) {
  // tom base pela altitude (sopé navy-ardósia → alto cinza claro) e relevo sombreado discreto (±):
  // a forma vem da altitude, da oclusão dos vales e das curvas — não de faces brilhantes
  const tt = Math.pow(t, 1.4);
  let c = mix([22, 36, 54], [164, 175, 190], tt);
  const shade = (lam - 0.7) * lerp(0.12, 1.15, Math.pow(tt, 0.75)); // contraste de luz no alto; sopé quase sem faixas
  c = shade > 0 ? mix(c, [222, 228, 236], shade * 1.3) : mix(c, [14, 26, 41], -shade * 1.8);
  c = mix(c, [232, 236, 241], 0.35 * smooth(0.82, 1, t) * smooth(0.5, 0.8, lam)); // alto iluminado → branco suave
  const occ = lerp(lerp(0.86, 0.66, smooth(0.15, 0.7, t)), 1, ao); // só o fundo dos vales; menos no sopé (sem listras)
  c = mix([12, 22, 36], c, occ);
  const haze = 1 - smooth(-1.05, 0.45, zc);
  c = mix(c, [28, 44, 64], 0.4 * haze);
  const lum = clamp01((c[0] + c[1] + c[2]) / 3 / 220);
  return [c, lum, haze];
}

function homeCompositionFor(art, S) {
  const narrow = art.w < 600;
  // 0.5.0: no celular o conjunto (arco + montanha) é um pouco menor e uniforme (0.4.0: 0,44 · 0,9), para as
  // encostas caberem e se dissolverem antes da borda — mesma forma, sem recorte lateral
  const arcR = narrow ? Math.min(art.w * NARROW.arc, art.h * 0.56) : Math.min(art.w * 0.28, art.h * 0.5, 340);
  const pad = Math.max(6, arcR * 0.03);
  const cx = art.x + art.w / 2;
  const cy = art.y + pad + arcR;
  return { narrow, arcR, pad, cx, cy, sumX: cx, sumY: cy - arcR + S.summitDrop * arcR, S0: arcR * S.kappa * (narrow ? NARROW.k : 1) };
}

/** Composição dentro da área de arte (px do container): arco e posição do cume. */
export function homeComposition(art) {
  const c = homeCompositionFor(art, MOUNTAIN);
  return { layout: c.narrow ? 'narrow' : 'wide', cx: c.cx, cy: c.cy, arcR: c.arcR, summit: { x: c.sumX, y: c.sumY }, scale: c.S0 };
}

const terrainCache = new Map();
function terrainFor(lite) {
  const key = lite ? 'lite' : 'full';
  if (!terrainCache.has(key)) terrainCache.set(key, buildTerrain(MOUNTAIN, lite));
  return terrainCache.get(key);
}

export function createMountainSculpture(container, options = {}) {
  if (!container || typeof container.appendChild !== 'function') throw new TypeError('createHomeSculpture: container inválido');
  const S = MOUNTAIN;
  let reduced = !!options.reducedMotion;
  let paused = !!options.paused;
  const quality = options.quality || 'auto';
  const fixedRatio = Number.isFinite(options.pixelRatio) && options.pixelRatio > 0 ? Math.min(options.pixelRatio, 4) : null;
  const coverStops = Array.isArray(options.coverColor) && typeof options.coverColor[0] === 'string'
    ? options.coverColor.map(parseColor).filter(Boolean)
    : [parseColor(options.coverColor) || RGB.navy];
  const coverBleed = Number.isFinite(options.coverBleed) ? options.coverBleed : 2;
  // só revisão: 'silhueta' pinta o relevo em preto chapado, sem linhas, arco nem luz (teste de leitura)
  const silhouette = options.render === 'silhueta';
  let art = null, target = null, ready = false, arcT = null;
  let passage = 0, readyK = 0;
  let introStart = null, introOverride = null, introDone = true;
  let raf = 0, lastNow = 0, visible = true, destroyed = false, frames = 0, drawMs = 0, lastArc = null;
  let W = 0, H = 0, dpr = 1, C = null, T = null;
  let texKey = '', lastPeaks = null, texL = null, texS = null;
  // ambiente: relógio próprio (só avança com a cena parada no herói, visível e sem pausa)
  const ambientOpt = options.ambient !== false && !silhouette;
  const debugGlint = options._debugGlint === true; // só revisão: pinta em vermelho todos os trechos que a onda pode realçar
  let ambT = 0, ambLin = 0, lastAmb = null; // relógio do ambiente (ms) e entrada linear 0..1 (300 ms)
  const MAP_LINE = mix(RGB.gray, RGB.white, 0.35);

  const canvas = document.createElement('canvas');
  canvas.className = 'ararat-sculpture ararat-mountain';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.dataset.renderer = ctx ? 'canvas2d' : 'none';
  canvas.dataset.version = VERSION;
  canvas.dataset.study = 'B';
  // cache da vista do herói (relevo sombreado com ocultação). Em repouso e no início da passagem
  // (antes de a câmera subir) só é transladado/escalado — o custo do desenho completo é pago uma vez.
  const heroC = document.createElement('canvas');
  const hctx = heroC.getContext('2d');
  let heroKey = '', hero = null, heroBuilds = 0, baseBuilds = 0;
  const baseC = document.createElement('canvas');
  const bctx = baseC.getContext('2d');
  let baseKey = '', baseBox = null;
  const fillTex = document.createElement('canvas');
  const lineTex = document.createElement('canvas'); // curvas mestras
  const secTex = document.createElement('canvas'); // curvas secundárias (mais discretas)
  let fillPat = null, linePat = null, secPat = null;
  // projeções reaproveitadas
  let PX = null, PY = null;

  function measure() {
    const r = container.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    const a = isRect(art) ? art : { x: 0, y: 0, w: W, h: H };
    const comp = homeCompositionFor(a, S);
    const lite = quality === 'lite' || (quality === 'auto' && (comp.narrow || a.h < 300));
    const nextDpr = fixedRatio ?? Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(W * nextDpr) || canvas.height !== Math.round(H * nextDpr)) {
      dpr = nextDpr;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    const nextT = terrainFor(lite);
    if (nextT !== T) { T = nextT; texKey = ''; PX = new Float32Array(T.cols); PY = new Float32Array(T.cols * T.rows); }
    C = {
      ...comp,
      art: a,
      lite,
      line: lite ? 0.95 : 1.05,
      arcW: comp.narrow ? 1.75 : 2, // 0.5.0: arco mais presente (0.4.0: 1,25 / 1,4)
      layout: comp.narrow ? 'narrow' : 'wide',
    };
    canvas.dataset.layout = C.layout + (lite ? '-lite' : '');
  }

  /* texturas de cor (superfície, curvas mestras e secundárias) — uma vez por grade */
  function textures() {
    const key = `${T.cols}x${T.rows}`;
    if (key === texKey && fillPat) return;
    texKey = key;
    const { cols, rows, NX, NY, NZ, H: HH, EDGE, AO, SL, hMax, dz } = T;
    for (const c of [fillTex, lineTex, secTex]) { c.width = cols; c.height = rows; }
    const fx = fillTex.getContext('2d'), lx = lineTex.getContext('2d'), sx = secTex.getContext('2d');
    const fi = fx.createImageData(cols, rows), li = lx.createImageData(cols, rows), si = sx.createImageData(cols, rows);
    const [L0, L1, L2] = S.light;
    const ln = Math.hypot(L0, L1, L2);
    const Lx = L0 / ln, Ly = L1 / ln, Lz = L2 / ln;
    for (let id = 0; id < cols * rows; id++) {
      const e = EDGE[id];
      const o = id * 4;
      if (e <= 0.001) continue;
      if (silhouette) { fi.data[o + 3] = HH[id] > 0.03 && e > 0.02 ? 255 : 0; continue; }
      // luz envolvente (wrap): transição gradual entre face iluminada e face em sombra
      const lam = clamp01((NX[id] * Lx + NY[id] * Ly + NZ[id] * Lz + 0.38) / 1.38);
      const t = clamp01(HH[id] / hMax);
      const zc = GRID.z0 + Math.floor(id / cols) * dz;
      const [c, lum, haze] = surfaceColor(lam, t, AO[id], zc);
      fi.data[o] = c[0]; fi.data[o + 1] = c[1]; fi.data[o + 2] = c[2]; fi.data[o + 3] = 255 * e;
      // curva: um pouco mais escura que a face clara, um pouco mais clara que a face em sombra
      const onLit = smooth(0.42, 0.78, lum);
      const lc = mix(mix([150, 166, 186], [214, 221, 230], t), [52, 74, 100], onLit);
      const base = (0.25 + 0.75 * smooth(0.02, 0.32, t)) * e * (1 - 0.35 * haze);
      li.data[o] = lc[0]; li.data[o + 1] = lc[1]; li.data[o + 2] = lc[2]; li.data[o + 3] = 255 * clamp01(0.95 * base * (0.45 + 0.55 * smooth(0.12, 0.42, t))); // mestras conduzem para os cumes
      // secundárias: discretas; ainda mais leves onde a encosta é íngreme (onde as curvas se adensam)
      const steep = smooth(1.1, 2.6, SL[id]);
      const sc2 = mix(lc, c, 0.25);
      si.data[o] = sc2[0]; si.data[o + 1] = sc2[1]; si.data[o + 2] = sc2[2]; si.data[o + 3] = 255 * clamp01(0.42 * base * (1 - 0.6 * steep) * (0.35 + 0.65 * smooth(0.08, 0.45, t)));
    }
    fx.putImageData(fi, 0, 0); lx.putImageData(li, 0, 0); sx.putImageData(si, 0, 0);
    texL = li.data; texS = si.data; // opacidade de base das curvas (usada pela onda de realce)
    fillPat = hctx.createPattern(fillTex, 'no-repeat');
    linePat = hctx.createPattern(lineTex, 'no-repeat');
    secPat = hctx.createPattern(secTex, 'no-repeat');
  }

  function introT(now) {
    if (introDone) return INTRO_MS;
    if (introOverride != null) return introOverride;
    if (introStart == null) return 0;
    return now - introStart;
  }

  /* ---------- arco: idêntico à 0.2.1 (herói → tampa | entrega à jornada) ---------- */
  function arcHero() {
    return { cx: C.cx, cy: C.cy, r: C.arcR, a0: 172, span: 196, opacity: 1, width: C.arcW };
  }
  function arcDest() {
    const lid = { cx: target.x + target.w / 2, cy: target.y + target.h / 2, r: Math.min(target.w, target.h) * 0.45, a0: 180, span: 180, opacity: 0.85, width: C.arcW };
    if (!arcT) return { arc: lid, handoff: false };
    const hand = { cx: target.x + arcT.cx, cy: target.y + arcT.cy, r: arcT.r, a0: arcT.a0 + 360, span: arcT.span, opacity: arcT.opacity ?? 0.5, width: arcT.width ?? 1.5 };
    if (hand.a0 > 300) hand.a0 -= 360;
    if (Math.abs(hand.a0 - 172) > 180) hand.a0 += hand.a0 < 172 ? 360 : -360;
    const k = readyK;
    return {
      arc: { cx: lerp(lid.cx, hand.cx, k), cy: lerp(lid.cy, hand.cy, k), r: lerp(lid.r, hand.r, k), a0: lerp(lid.a0, hand.a0, k), span: lerp(lid.span, hand.span, k), opacity: lerp(lid.opacity, hand.opacity, k), width: lerp(lid.width, hand.width, k) },
      handoff: k > 0.999,
    };
  }
  // taper: no herói as pontas do arco se dissolvem (≈14°) atrás do sopé translúcido, sem “riscos”
  // dourados na base; vai a 0 ao longo da passagem — na entrega o arco é o da jornada, sem afinamento.
  function strokeArc(A, k, taper = 0, g = ctx) {
    const al = A.opacity * k;
    if (al <= 0.002 || A.span <= 0.2) return;
    g.strokeStyle = rgba(RGB.gold, al);
    g.lineWidth = A.width;
    const T = Math.min(A.span * 0.3, 14 * taper);
    if (T < 0.5) {
      g.beginPath();
      g.arc(A.cx, A.cy, A.r, A.a0 * DEG, (A.a0 + A.span) * DEG);
      g.lineCap = 'round';
      g.stroke();
      return;
    }
    g.lineCap = 'butt';
    g.beginPath();
    g.arc(A.cx, A.cy, A.r, (A.a0 + T) * DEG, (A.a0 + A.span - T) * DEG);
    g.stroke();
    const n = 7;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n; // 0 na ponta → 1 junto ao trecho cheio
      g.strokeStyle = rgba(RGB.gold, al * f * f);
      for (const [s0, s1] of [[A.a0 + (T * i) / n, A.a0 + (T * (i + 1)) / n], [A.a0 + A.span - (T * (i + 1)) / n, A.a0 + A.span - (T * i) / n]]) {
        g.beginPath();
        g.arc(A.cx, A.cy, A.r, s0 * DEG, s1 * DEG);
        g.stroke();
      }
    }
  }

  /* ---------- ambiente (0.6.0): faixa de luz no arco + onda nas curvas ----------
     Dono do arco: este canvas desenha UM arco (strokeArc / camada em cache). A faixa é pintada sobre ele, com
     a MESMA geometria, na mesma camada de trás; o relevo em cache vem depois e a esconde atrás dos cumes.
     Nunca há um segundo arco: fora da faixa, só o traço de base. A onda só repinta, mais clara, trechos de
     curvas que já estão visíveis no cache — a geometria e o material do relevo não mudam. */
  const ambMix = (p) => { const t = clamp01(p / AMB.pEnd); return EASE_ENTER(ambLin) * (1 - t * t * (3 - 2 * t)); };
  let visKey = '', visArc = null;
  // trecho do arco do herói visível NA TELA (dentro do canvas e fora das pontas dissolvidas)
  function arcVisible(A) {
    const key = [W, H, A.cx, A.cy, A.r].join('|');
    if (key === visKey) return visArc;
    visKey = key;
    const T0 = 14, lo = A.a0 + T0, hi = A.a0 + A.span - T0;
    const ok = (t) => { const x = A.cx + A.r * Math.cos(t * DEG), y = A.cy + A.r * Math.sin(t * DEG); return x > 4 && x < W - 4 && y > 4 && y < H - 6; };
    let a = 270, b = 270;
    if (!ok(270)) { visArc = { lo, hi }; return visArc; }
    while (a - 0.5 >= lo && ok(a - 0.5)) a -= 0.5;
    while (b + 0.5 <= hi && ok(b + 0.5)) b += 0.5;
    visArc = { lo: a, hi: b };
    return visArc;
  }
  function bandState(A, g) {
    if (g < 0.004) return null;
    const v = arcVisible(A);
    const span = Math.max(0, v.hi - v.lo);
    const len = Math.max(AMB.bandMin, AMB.bandFrac * span);
    const c = ((ambT % AMB.arcCycle) + AMB.arcCycle) % AMB.arcCycle, half = AMB.arcCycle / 2;
    const e = EASE_ARC((c % half) / half);
    const pos = c < half ? e : 1 - e; // ida (esquerda → direita) e volta
    const a0 = v.lo + len / 2, a1 = Math.max(a0, v.hi - len / 2);
    return { cx: A.cx, cy: A.cy, r: A.r, a: lerp(a0, a1, pos), len, alpha: g, width: C.narrow ? AMB.coreW.narrow : AMB.coreW.wide, pos };
  }
  function strokeBand(h, k) {
    const al = h.alpha * k;
    if (al <= 0.003) return;
    const s0 = (h.a - h.len / 2) * DEG, s1 = (h.a + h.len / 2) * DEG;
    ctx.lineCap = 'butt';
    const prof = (t) => { const e = Math.sin(Math.PI * t); return e * e * (3 - 2 * e); }; // bordas suaves
    // largura: borda suave (1,9× o núcleo, fraca) + núcleo; ao longo do comprimento, opacidade em sino
    for (const [w, m, col] of [[h.width * 2.1, 0.32, AMB.core], [h.width, 1, AMB.core]]) {
      if (typeof ctx.createConicGradient === 'function') {
        const f = (h.len * DEG) / TAU;
        const gr = ctx.createConicGradient(s0, h.cx, h.cy);
        for (let i = 0; i <= 12; i++) { const t = i / 12; gr.addColorStop(t * f, rgba(col, al * m * prof(t))); }
        gr.addColorStop(Math.min(1, f + 1e-4), rgba(col, 0));
        gr.addColorStop(1, rgba(col, 0));
        ctx.strokeStyle = gr;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.arc(h.cx, h.cy, h.r, s0, s1);
        ctx.stroke();
      } else { // sem gradiente cônico: pequenos trechos
        ctx.lineWidth = w;
        const n = 14;
        for (let i = 0; i < n; i++) {
          ctx.strokeStyle = rgba(col, al * m * prof((i + 0.5) / n));
          ctx.beginPath();
          ctx.arc(h.cx, h.cy, h.r, s0 + ((s1 - s0) * i) / n, s0 + ((s1 - s0) * (i + 1)) / n);
          ctx.stroke();
        }
      }
    }
  }
  // ondas: posição (em níveis de curva) e envelope de cada onda ativa; faixa = do nível mais baixo VISÍVEL
  // na tela (abaixo da dobra não conta) até o topo
  function waveState(hv, g, band) {
    if (g < 0.004 || !hv) return null;
    if (!hv.glint) hv.glint = buildGlint(hv);
    const G = hv.glint;
    const limit = H - 6 - (C.sumY - hv.ly); // fundo da tela em coordenadas locais
    let kLo = G.kMax;
    for (let k = G.kMin; k <= G.kMax; k++) {
      const ys = G.ys.get(k);
      if (!ys) continue;
      let lo = 0, hi = ys.length; // quantos trechos visíveis desse nível estão acima da dobra
      while (lo < hi) { const mid = (lo + hi) >> 1; if (ys[mid] < limit) lo = mid + 1; else hi = mid; }
      if (lo >= 10) { kLo = k; break; }
    }
    const kHi = G.kMax;
    const waves = [];
    const n0 = Math.floor((ambT - AMB.waveDur) / AMB.wavePeriod) + 1, n1 = Math.floor(ambT / AMB.wavePeriod);
    for (let n = Math.max(0, n0); n <= n1; n++) {
      const u = (ambT - n * AMB.wavePeriod) / AMB.waveDur;
      if (u < 0 || u > 1) continue;
      const env = smooth(0, 0.16, u) * (1 - smooth(0.82, 1, u));
      waves.push({ k: lerp(kLo - 1.2, kHi + 0.6, u), env });
    }
    if (!waves.length) return null;
    // diálogo com o arco: a onda ganha um pouco quando a faixa de luz passa pelo alto do arco
    const top = band ? 1 - clamp01(Math.abs(band.a - 270) / 80) : 0;
    return { waves, kLo, kHi, alpha: AMB.waveAlpha * g * (0.82 + 0.18 * top) };
  }
  function drawWave(hv, wv) {
    const G = hv.glint;
    if (!G) return;
    const s2 = 2 * AMB.waveSigma * AMB.waveSigma;
    ctx.save();
    ctx.translate(C.sumX - hv.lx, C.sumY - hv.ly);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let k = debugGlint ? G.kMin : Math.max(G.kMin, Math.floor(wv.kLo - 3)); k <= G.kMax; k++) {
      let wgt = 0;
      for (const w of wv.waves) wgt += w.env * Math.exp(-((k - w.k) * (k - w.k)) / s2);
      wgt = debugGlint ? 1 : Math.min(1, wgt);
      if (wgt < 0.02) continue;
      const list = G.levels.get(k);
      if (!list) continue;
      for (const pl of list) {
        const al = wv.alpha * wgt * pl.a;
        if (al < 0.004) continue;
        ctx.beginPath();
        const { pts, starts, lift } = pl;
        for (let l = 0; l < lift.length; l++) {
          let q = starts[l] * 2;
          const qe = starts[l + 1] * 2, dy = lift[l];
          ctx.moveTo(pts[q], pts[q + 1] - dy);
          for (q += 2; q < qe; q += 2) ctx.lineTo(pts[q], pts[q + 1] - dy);
        }
        const lw = (pl.idx ? C.line * 1.35 : C.line * 0.85);
        if (debugGlint) { ctx.strokeStyle = 'rgba(255,0,0,0.9)'; ctx.lineWidth = 1; ctx.stroke(); continue; }
        ctx.strokeStyle = rgba(AMB.waveColor, al * AMB.waveSoft); // borda suave
        ctx.lineWidth = lw * AMB.waveSoftW;
        ctx.stroke();
        ctx.strokeStyle = rgba(AMB.waveColor, al);
        ctx.lineWidth = lw * AMB.waveCore;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // halo elíptico atrás dos cumes, inteiro DENTRO da área da arte (o poster, recortado na área,
  // fica igual ao canvas: sem borda de halo no topo do slot)
  function drawGlow(g, glowA, bx, by, k) {
    const R = C.arcR;
    g.save();
    g.beginPath();
    g.rect(C.art.x, C.art.y, C.art.w, C.art.h);
    g.clip();
    const gr = R * 1.25 * k;
    // a cauda do halo termina antes da borda lateral da área (sem alfa residual na borda do slot)
    const room = Math.min(bx - C.art.x, C.art.x + C.art.w - bx) - EDGE_FADE.margin;
    const sx = room > 0 ? Math.min(1, room / gr) : 1;
    g.translate(bx, by + R * 0.34 * k);
    g.scale(sx, 0.5);
    const gl = g.createRadialGradient(-R * 0.12 * k, 0, 0, 0, 0, gr);
    gl.addColorStop(0, rgba(RGB.slate, glowA));
    gl.addColorStop(0.55, rgba(RGB.slate, glowA * 0.45));
    gl.addColorStop(1, rgba(RGB.slate, 0));
    g.fillStyle = gl;
    g.fillRect(-gr, -gr, gr * 2, gr * 2);
    g.restore();
  }
  /* camada de fundo do herói em cache (halo + arco), alinhada aos pixels do aparelho. Em repouso o quadro
     inteiro e o retângulo da luz ambiente usam a MESMA cópia — o redesenho parcial não deixa resíduo. */
  function renderBase() {
    // 0.6.0: invariante a translação (como o relevo): rolar o herói só copia a camada noutra posição
    const A = arcHero();
    const pad = A.width * 2 + 4;
    const fx = (((A.cx * dpr) % 1) + 1) % 1, fy = (((A.cy * dpr) % 1) + 1) % 1;
    const rx = Math.min(C.art.x - A.cx, -A.r - pad), ry = Math.min(C.art.y - A.cy, -A.r - pad);
    const rx1 = Math.max(C.art.x + C.art.w - A.cx, A.r + pad), ry1 = Math.max(C.art.y + C.art.h - A.cy, A.r * 0.3 + pad);
    const offX = (Math.floor(fx + rx * dpr) - fx) / dpr, offY = (Math.floor(fy + ry * dpr) - fy) / dpr;
    const bw = Math.ceil((rx1 - offX) * dpr) + 1, bh = Math.ceil((ry1 - offY) * dpr) + 1;
    const key = [dpr, fx.toFixed(3), fy.toFixed(3), offX, offY, bw, bh, A.r, A.width, C.art.x - A.cx, C.art.y - A.cy, C.art.w, C.art.h, C.sumY - A.cy].join('|');
    if (key !== baseKey) {
      baseKey = key;
      baseBuilds++;
      if (baseC.width !== bw || baseC.height !== bh) { baseC.width = bw; baseC.height = bh; }
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.clearRect(0, 0, bw, bh);
      bctx.setTransform(dpr, 0, 0, dpr, -(A.cx + offX) * dpr, -(A.cy + offY) * dpr);
      drawGlow(bctx, 0.2, C.sumX, C.sumY, 1);
      strokeArc(A, 1, 1, bctx);
    }
    baseBox = { x: A.cx + offX, y: A.cy + offY, w: bw / dpr, h: bh / dpr };
    return baseBox;
  }

  /* ---------- relevo: faixas de trás para frente + curvas de nível ---------- */
  function drawTerrain(g, cam, ox, oy) {
    const { cols, rows, dx, dz, H: HH, iMin, iMax, lines } = T;
    const { bx, by, sc, sinE, cosE, hk, fillA, lineA, rimA } = cam;
    const sm = T.summit;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    g.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr);
    const X0 = bx + sc * (GRID.x0 - sm.x);
    const ky = sc * sinE, kh = sc * cosE * hk;
    const Yb = by - sc * (sm.z - GRID.z0) * sinE + sm.h * kh; // linha de base da fileira 0
    for (let i = 0; i < cols; i++) PX[i] = X0 + i * dx * sc;
    for (let j = 0; j < rows; j++) {
      const yj = Yb + j * dz * ky;
      const o = j * cols;
      for (let i = 0; i < cols; i++) PY[o + i] = yj - HH[o + i] * kh;
    }
    const BIG = 2048;
    const mF = new DOMMatrix();
    const ext = 0.9; // estende a borda frontal da faixa 0,9 px (sem fresta de antisserrilhado)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    for (let j = 0; j < rows - 1; j++) {
      const a = iMin[j], b = iMax[j];
      if (b <= a) continue;
      const o0 = j * cols, o1 = (j + 1) * cols;
      let yTop = Infinity, yBot = -Infinity;
      g.beginPath();
      g.moveTo(PX[a], PY[o0 + a]);
      for (let i = a + 1; i <= b; i++) { const y = PY[o0 + i]; g.lineTo(PX[i], y); if (y < yTop) yTop = y; }
      for (let i = b; i >= a; i--) { const y = PY[o1 + i] + ext; g.lineTo(PX[i], y); if (y > yBot) yBot = y; }
      g.closePath();
      const yMid = (yTop + yBot) / 2;
      // texel (i, j+1) → vértice (i, j+1); a fileira de texels cobre toda a altura da faixa
      mF.a = dx * sc; mF.b = 0; mF.c = 0; mF.d = BIG; mF.e = X0 - 0.5 * dx * sc; mF.f = yMid - (j + 1.5) * BIG;
      if (fillA > 0.003) {
        fillPat.setTransform(mF);
        g.globalAlpha = fillA;
        g.fillStyle = fillPat;
        g.fill();
      }
      if (PX[a] < minX) minX = PX[a]; if (PX[b] > maxX) maxX = PX[b];
      if (yTop < minY) minY = yTop; if (yBot > maxY) maxY = yBot;
      // curvas desta fileira de células
      const L = lines[j];
      if (lineA > 0.003 && (L.norm.length || L.idx.length)) {
        for (const [arr, w, al, pat] of [[L.norm, C.line * 0.85, 1, secPat], [L.idx, C.line * 1.35, 1, linePat]]) {
          if (!arr.length) continue;
          pat.setTransform(mF);
          g.strokeStyle = pat;
          g.beginPath();
          for (let q = 0; q < arr.length; q += 5) {
            const lev = arr[q + 4] * kh;
            g.moveTo(X0 + arr[q] * dx * sc, Yb + arr[q + 1] * dz * ky - lev);
            g.lineTo(X0 + arr[q + 2] * dx * sc, Yb + arr[q + 3] * dz * ky - lev);
          }
          g.globalAlpha = lineA * al;
          g.lineWidth = w;
          g.stroke();
        }
      }
    }
    // contorno da silhueta (topo de cada coluna), para o perfil ler mesmo sobre faces em sombra
    if (rimA > 0.003) {
      g.globalAlpha = rimA;
      g.strokeStyle = rgba(mix(RGB.gray, RGB.white, 0.55), 1);
      g.lineWidth = C.line * 1.15;
      g.beginPath();
      let pen = false;
      const top = [];
      for (let i = 0; i < cols; i++) {
        let y = Infinity;
        for (let j = 0; j < rows; j++) { const id = j * cols + i; if (T.EDGE[id] > 0.55 && PY[id] < y) y = PY[id]; }
        top.push(y);
      }
      for (let i = 0; i < cols; i++) {
        const y = top[i];
        if (!Number.isFinite(y)) { pen = false; continue; }
        if (!pen) { g.moveTo(PX[i], y); pen = true; } else g.lineTo(PX[i], y);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
    return { minX, maxX, minY, maxY };
  }

  /* vista do herói em cache (área própria, com folga), refeita só quando a composição muda */
  function renderHero(hk) {
    textures();
    const R = C.S0;
    // 0.6.0: cache INVARIANTE A TRANSLAÇÃO — o relevo é desenhado em coordenadas locais (cume em lx, ly) e
    // copiado na posição atual. Rolar o herói (o Site move a área da arte) não redesenha mais o terreno:
    // só a fração de pixel do aparelho entra na chave, e a cópia cai exatamente na grade de pixels.
    const fx = (((C.sumX * dpr) % 1) + 1) % 1, fy = (((C.sumY * dpr) % 1) + 1) % 1;
    const lx = Math.ceil(1.95 * R * dpr) / dpr + fx / dpr, ly = Math.ceil(8 * dpr) / dpr + fy / dpr;
    const w = Math.ceil(lx + 1.95 * R + 1), h = Math.ceil(ly + 1.7 * R);
    const key = [dpr, R, w, h, fx.toFixed(3), fy.toFixed(3), hk.toFixed(4), T.cols, C.art.w].join('|');
    if (key === heroKey) return hero;
    heroKey = key;
    heroBuilds++;
    if (heroC.width !== Math.round(w * dpr) || heroC.height !== Math.round(h * dpr)) { heroC.width = Math.round(w * dpr); heroC.height = Math.round(h * dpr); }
    const cam = { bx: lx, by: ly, sc: R, sinE: Math.sin(S.elev * DEG), cosE: Math.cos(S.elev * DEG), hk, fillA: 1, lineA: silhouette ? 0 : 1, rimA: silhouette ? 0 : 0.26 };
    const bb = drawTerrain(hctx, cam, 0, 0);
    // dissolução lateral controlada (0.5.0): o pé das encostas some antes da borda da área da arte
    // (alfa 0 até `margin` px, rampa suave em `band` px) — no canvas e nos posters, igual
    const ax = lx - C.art.w / 2; // borda esquerda da área, em coordenadas locais (o cume fica no centro da área)
    if (!silhouette) {
      const ar = C.art, m = EDGE_FADE.margin, b = EDGE_FADE.band(ar.w);
      const gr = hctx.createLinearGradient(ax, 0, ax + ar.w, 0);
      const f = (px) => clamp01(px / ar.w);
      const N = 8;
      for (let i = 0; i <= N; i++) { // rampa suave (smoothstep) dos dois lados
        const t = i / N, al = t * t * (3 - 2 * t);
        gr.addColorStop(f(m + b * t), `rgba(0,0,0,${al.toFixed(4)})`);
        gr.addColorStop(f(ar.w - m - b * t), `rgba(0,0,0,${al.toFixed(4)})`);
      }
      hctx.globalCompositeOperation = 'destination-in';
      hctx.fillStyle = gr;
      hctx.fillRect(0, 0, w, h);
      hctx.globalCompositeOperation = 'source-over';
    }
    hero = { lx, ly, w, h, bb, cam, ax, glint: null };
    return hero;
  }

  /* ---------- onda de realce nas curvas (0.6.0) ----------
     Montada UMA vez por composição (montagem/redimensionamento), em coordenadas locais do relevo em cache:
     · um mapa de ocultação (cada faixa do relevo pintada com a cor = índice da fileira, de trás para frente)
       diz que trechos de cada curva ficam VISÍVEIS na vista do herói;
     · os trechos visíveis são encadeados em polilinhas por nível, tipo (mestra/secundária) e opacidade de base
       (a mesma textura das curvas no cache: curvas fracas continuam discretas; lateral dissolvida também).
     Por quadro só se traçam as 2–4 curvas da onda (poucas centenas de pontos) sobre o cache. */
  const idC = document.createElement('canvas');
  function buildGlint(hv) {
    const { cols, rows, dx, dz, H: HH, iMin, iMax, lines, summit: sm } = T;
    const { bx, by, sc, sinE, cosE, hk } = hv.cam;
    const iw = Math.ceil(hv.w), ih = Math.ceil(hv.h);
    idC.width = iw; idC.height = ih;
    const g = idC.getContext('2d', { willReadFrequently: true });
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, iw, ih);
    const X0 = bx + sc * (GRID.x0 - sm.x), ky = sc * sinE, kh = sc * cosE * hk;
    const Yb = by - sc * (sm.z - GRID.z0) * sinE + sm.h * kh;
    const px = (i) => X0 + i * dx * sc, py = (j, i) => Yb + j * dz * ky - HH[j * cols + i] * kh;
    for (let j = 0; j < rows - 1; j++) {
      const i0 = iMin[j], i1 = iMax[j];
      if (i1 <= i0) continue;
      g.beginPath();
      g.moveTo(px(i0), py(j, i0));
      for (let i = i0 + 1; i <= i1; i++) g.lineTo(px(i), py(j, i));
      for (let i = i1; i >= i0; i--) g.lineTo(px(i), py(j + 1, i) + 0.9);
      g.closePath();
      g.fillStyle = `rgb(${(j + 1) & 255},${(j + 1) >> 8},0)`;
      g.fill();
    }
    const id = g.getImageData(0, 0, iw, ih).data;
    const idAt = (x, y) => { const X = x | 0, Y = y | 0; if (X < 0 || Y < 0 || X >= iw || Y >= ih) return -1; const o = (Y * iw + X) * 4; return id[o] + (id[o + 1] << 8) - 1; };
    // opacidade de base de cada curva = alfa da textura das curvas (mesma regra do cache) × dissolução lateral
    const m = EDGE_FADE.margin, bnd = EDGE_FADE.band(C.art.w);
    const lat = (x) => { const d = Math.min(x - hv.ax, hv.ax + C.art.w - x); return smooth(m, m + bnd, d); };
    const groups = new Map(); // chave nível|tipo|faixa de opacidade → segmentos [u1,v1,u2,v2,L] visíveis
    const meta = new Map(); // nível → { ys: [...] } para o trecho visível na tela
    for (let j = 0; j < rows - 1; j++) {
      for (const [arr, isIdx] of [[lines[j].norm, 0], [lines[j].idx, 1]]) {
        const tex = isIdx ? texL : texS;
        for (let q = 0; q < arr.length; q += 5) {
          const um = (arr[q] + arr[q + 2]) / 2, vm = (arr[q + 1] + arr[q + 3]) / 2, L = arr[q + 4];
          const x = X0 + um * dx * sc, y = Yb + vm * dz * ky - L * kh;
          // visível se o meio do trecho (ou as duas pontas) cai na faixa da própria fileira no mapa de ocultação
          if (idAt(x, y) !== j && !(idAt(X0 + arr[q] * dx * sc, Yb + arr[q + 1] * dz * ky - L * kh) === j && idAt(X0 + arr[q + 2] * dx * sc, Yb + arr[q + 3] * dz * ky - L * kh) === j)) continue;
          const ti = clamp(Math.round(um), 0, cols - 1), tj = clamp(j + 1, 0, rows - 1);
          const base = tex ? tex[(tj * cols + ti) * 4 + 3] / 255 : 1;
          const al = clamp01(base * 1.6) * lat(x);
          if (al < 0.05) continue;
          const k = Math.round(L / T.step);
          const bucket = Math.min(3, Math.floor(al * 4));
          const key = k * 8 + isIdx * 4 + bucket;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(arr[q], arr[q + 1], arr[q + 2], arr[q + 3], L);
          if (!meta.has(k)) meta.set(k, []);
          meta.get(k).push(y);
        }
      }
    }
    const levels = new Map(); // nível → [{ pts (locais), starts, idx, a }]
    for (const [key, segs] of groups) {
      const k = key >> 3, isIdx = (key >> 2) & 1, bucket = key & 3;
      const ch = chainSegments(segs, 0.05);
      const pts = new Float32Array(ch.pts.length);
      for (let n = 0; n < ch.pts.length; n += 2) { pts[n] = X0 + ch.pts[n] * dx * sc; pts[n + 1] = Yb + ch.pts[n + 1] * dz * ky; }
      const lev = ch.levels; // altura de cada polilinha (todas iguais ao nível)
      const ys = new Float32Array(lev.length); for (let l = 0; l < lev.length; l++) ys[l] = lev[l] * kh;
      if (!levels.has(k)) levels.set(k, []);
      levels.get(k).push({ pts, starts: ch.starts, lift: ys, idx: !!isIdx, a: (bucket + 0.5) / 4 });
    }
    const ys = new Map();
    for (const [k, arr] of meta) ys.set(k, Float32Array.from(arr).sort());
    const ks = [...levels.keys()].sort((a, b) => a - b);
    return { levels, ys, kMin: ks[0] ?? 0, kMax: ks.at(-1) ?? 0, segs: [...meta.values()].reduce((n, a) => n + a.length, 0) };
  }

  /* curvas sem ocultação (arame/mapa): poucos traços de cor única — barato durante a rolagem */
  function drawWire(cam, alpha) {
    const { dx, dz, wire } = T;
    const { bx, by, sc, sinE, cosE, hk } = cam;
    const sm = T.summit;
    const X0 = bx + sc * (GRID.x0 - sm.x);
    const ky = sc * sinE, kh = sc * cosE * hk;
    const Yb = by - sc * (sm.z - GRID.z0) * sinE + sm.h * kh;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const ax = dx * sc, ay = dz * ky;
    for (const g of wire) {
      const { pts, starts, levels } = g;
      if (!levels.length) continue;
      ctx.beginPath();
      for (let l = 0; l < levels.length; l++) {
        const lev = Yb - levels[l] * kh;
        let q = starts[l] * 2;
        const qe = starts[l + 1] * 2;
        ctx.moveTo(X0 + pts[q] * ax, lev + pts[q + 1] * ay);
        for (q += 2; q < qe; q += 2) ctx.lineTo(X0 + pts[q] * ax, lev + pts[q + 1] * ay);
      }
      ctx.strokeStyle = rgba(MAP_LINE, alpha * g.a);
      ctx.lineWidth = g.idx ? C.line * 1.6 : C.line;
      ctx.stroke();
    }
  }

  function draw(now) {
    if (!ctx || !C || !T) return;
    const t0 = performance.now();
    frames++;
    const passageOn = !reduced && isRect(target);
    const p = passageOn ? passage : 0;
    const tI = clamp(introT(now), 0, INTRO_MS);
    const R = C.arcR;

    const dest = passageOn ? arcDest() : null;
    const gcx = dest ? (arcT ? lerp(target.x + target.w / 2, target.x + arcT.cx, readyK) : target.x + target.w / 2) : C.cx;
    const gcy = dest ? (arcT ? lerp(target.y + target.h / 2, target.y + arcT.cy, readyK) : target.y + target.h / 2) : C.cy;
    // passagem (só pelo progresso p): a montanha desce rumo ao quadro na vista oblíqua e se desfaz em
    // curvas (0–0,15) → a câmera sobe e o relevo vira mapa (0,15–0,48) → o mapa abre a janela
    // circular sobre a RM (0,3–0,82) → o arco é entregue à jornada (como na 0.2.1)
    const a = passageOn ? ease(seg(p, 0, 0.5)) : 0;
    const up = passageOn ? ease(seg(p, 0.15, 0.48)) : 0;
    const open = passageOn ? ease(seg(p, 0.3, 0.82)) * readyK : 0;
    const Rcover = passageOn ? Math.max(...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v]) => Math.hypot(target.x + u * target.w - gcx, target.y + v * target.h - gcy))) : 0;
    const wr = open * Rcover;
    const S1 = passageOn ? 0.62 * Math.hypot(target.w, target.h) : C.S0;
    const sc = Math.exp(lerp(Math.log(C.S0), Math.log(S1), a)) * (1 + 1.25 * open);
    const elev = lerp(S.elev, 90, up) * DEG;
    const ringA = (1 - ease(seg(p, 0.55, 0.95)) * readyK) * (1 - 0.42 * Math.sin(Math.PI * a));
    const coverA = passageOn ? 1 - seg(p, 0.86, 1) * readyK : 0;
    const fillK = passageOn ? 1 - smooth(0.03, 0.15, p) : 1; // sólido só enquanto a câmera não sobe
    const introK = introDone ? 1 : easeOut(seg(tI, 60, 700));
    const hk = introDone ? 1 : 0.78 + 0.22 * easeOut(seg(tI, 100, 1000));
    const bx = lerp(C.sumX, gcx, a), by = lerp(C.sumY, gcy, a);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);

    if (coverA > 0.001) {
      const b = coverBleed;
      roundRect(ctx, target.x - b, target.y - b, target.w + 2 * b, target.h + 2 * b, (target.r ?? 12) + b);
      if (coverStops.length > 1) {
        const cg = ctx.createLinearGradient(0, target.y, 0, target.y + target.h);
        coverStops.forEach((c, i) => cg.addColorStop(i / (coverStops.length - 1), rgba(c, coverA)));
        ctx.fillStyle = cg;
      } else ctx.fillStyle = rgba(coverStops[0], coverA);
      ctx.fill();
    }
    // céu: luz difusa atrás dos cumes (separa as faces em sombra do fundo)
    const glowA = silhouette ? 0 : 0.2 * ringA * introK * fillK;
    // repouso no herói: halo + arco vêm da camada em cache (idênticos ao desenho direto)
    const rest = !silhouette && introDone && p === 0;
    if (!rest && glowA > 0.003) drawGlow(ctx, glowA, bx, by, sc / C.S0);

    // arco
    let A = arcHero();
    if (!introDone) {
      const d01 = easeOut(seg(tI, 0, 700));
      const grow = ease(seg(tI, 250, 1000));
      const r0 = R * 0.15;
      const span = 196 * d01;
      A = { cx: C.cx, cy: lerp(C.cy - R * 0.5, C.cy, grow), r: r0 * Math.pow(R / r0, grow), a0: 270 - span / 2, span, opacity: easeOut(seg(tI, 0, 250)), width: lerp(C.arcW * 1.3, C.arcW, grow) };
    }
    if (dest && p > 0) {
      const s = ease(seg(p, 0.05, 0.42));
      const E = dest.arc;
      const fadeOut = arcT ? seg(p, 0.56, 0.72) * readyK : seg(p, 0.5, 0.72) * readyK;
      A = {
        cx: lerp(A.cx, E.cx, s), cy: lerp(A.cy, E.cy, s),
        r: Math.exp(lerp(Math.log(A.r), Math.log(E.r), s)),
        a0: lerp(A.a0, E.a0, s), span: lerp(A.span, E.span, s),
        opacity: lerp(A.opacity, E.opacity, seg(p, 0.36, 0.56)) * (1 - fadeOut),
        width: lerp(A.width, E.width, s),
      };
    }
    lastArc = A;
    // no herói o arco passa ATRÁS da montanha (como um halo); na passagem vem para a frente
    const front = passageOn ? smooth(0.02, 0.2, p) : 0;
    const taper = 1 - (dest && p > 0 ? ease(seg(p, 0.05, 0.42)) : 0);
    if (rest) { const bb = renderBase(); ctx.drawImage(baseC, bb.x, bb.y, bb.w, bb.h); }
    else if (!silhouette) strokeArc(A, 1 - front, taper);
    // ambiente: faixa de luz no arco (atrás do relevo) e onda nas curvas (sobre o relevo em cache)
    const ambOn = ambientOpt && !reduced && !paused && introDone && p < AMB.pEnd;
    const g = ambOn ? ambMix(p) : 0;
    const band = ambOn ? bandState(A, g) : null;
    if (band) strokeBand(band, 1 - front);
    const wave = ambOn && fillK > 0.002 ? waveState(introDone ? renderHero(1) : null, g, band) : null;
    lastAmb = { gain: g, band: band && { a: +band.a.toFixed(2), len: +band.len.toFixed(2), pos: +band.pos.toFixed(3), width: band.width, cx: band.cx, cy: band.cy, r: band.r }, waves: wave ? wave.waves.map((w) => ({ k: +w.k.toFixed(2), env: +w.env.toFixed(3) })) : [], kLo: wave?.kLo, kHi: wave?.kHi };

    // relevo
    const layerA = ringA * introK;
    const sinE = Math.sin(elev), cosE = Math.cos(elev);
    if (layerA * fillK > 0.002) {
      const hv = renderHero(hk);
      const k = sc / C.S0;
      ctx.save();
      ctx.globalAlpha = layerA * fillK;
      ctx.translate(bx, by); ctx.scale(k, k); ctx.translate(-C.sumX, -C.sumY);
      ctx.drawImage(heroC, C.sumX - hv.lx, C.sumY - hv.ly, hv.w, hv.h);
      if (wave) drawWave(hv, wave);
      ctx.restore();
    }
    if (!silhouette && layerA * (1 - fillK) > 0.002) drawWire({ bx, by, sc, sinE, cosE, hk }, layerA * (1 - fillK));
    const sec = projectPeak(T.secondary, bx, by, sc, elev, hk);
    const hb = hero && hero.bb && { minX: hero.bb.minX + C.sumX - hero.lx, maxX: hero.bb.maxX + C.sumX - hero.lx, minY: hero.bb.minY + C.sumY - hero.ly, maxY: hero.bb.maxY + C.sumY - hero.ly };
    lastPeaks = { summit: { x: bx, y: by }, secondary: sec, bounds: hb && p === 0 ? hb : null };

    // janela: recorta cobertura, mapa e arco de trás sobre o quadro real da jornada
    if (passageOn && open > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      roundRect(ctx, target.x, target.y, target.w, target.h, target.r ?? 12);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(gcx, gcy, wr, 0, TAU);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
    }
    if (!silhouette) strokeArc(A, front, taper);
    canvas.dataset.passage = p.toFixed(3);
    canvas.dataset.reveal = passageOn ? (readyK > 0.999 ? 'ready' : readyK > 0 ? 'opening' : 'covered') : 'off';
    canvas.dataset.camera = (elev / DEG).toFixed(1);
    const ambS = g > 0.01 ? 'light' : ambientRunning() ? 'on' : 'off';
    if (canvas.dataset.ambient !== ambS) canvas.dataset.ambient = ambS;
    drawMs = performance.now() - t0;
  }
  function projectPeak(P, bx, by, sc, elev, hk) {
    const sm = T.summit;
    return { x: bx + sc * (P.x - sm.x), y: by + sc * ((P.z - sm.z) * Math.sin(elev) - (P.h - sm.h) * Math.cos(elev) * hk) };
  }

  function onScreen() {
    if (!C) return false;
    const vis = (r) => r && r.x < W && r.y < H && r.x + r.w > 0 && r.y + r.h > 0;
    const R = C.arcR;
    const hero = { x: C.cx - R * 1.9, y: C.cy - R * 1.05, w: R * 3.8, h: R * 2.2 };
    return vis(hero) || (!reduced && isRect(target) && passage > 0 && (passage < 1 || readyK < 1) && vis(target));
  }
  const docHidden = () => typeof document !== 'undefined' && document.hidden === true;
  function heroOnScreen() {
    if (!C) return false;
    const R = C.arcR;
    return C.cx + R * 1.9 > 0 && C.cx - R * 1.9 < W && C.cy + R * 1.2 > 0 && C.cy - R * 1.05 < H;
  }
  // luz ambiente corre só com a cena parada no herói: sem pausa, sem movimento reduzido, cena na tela,
  // aba visível, abertura concluída e passagem em 0
  function ambientRunning() {
    return ambientOpt && !destroyed && !reduced && !paused && introDone && visible && !docHidden() && passage < AMB.pEnd && heroOnScreen();
  }
  function loopWanted() {
    if (destroyed || !visible || !onScreen()) return false;
    const introRunning = !introDone && introOverride == null && introStart != null;
    const readyAnim = !reduced && !paused && Math.abs(readyK - (ready ? 1 : 0)) > 1e-4;
    // em repouso a montanha fica parada: sem laço de quadros (custo zero); só abertura e revelação animam
    return introRunning || readyAnim;
  }
  function tick(now) {
    raf = 0;
    const dt = lastNow ? Math.min(50, now - lastNow) : 0;
    lastNow = now;
    if (!introDone && introOverride == null && introStart != null && now - introStart >= INTRO_MS) finishIntro();
    const goal = ready ? 1 : 0;
    const k0 = readyK;
    if (reduced || paused) readyK = goal;
    else if (readyK !== goal) readyK = goal > readyK ? Math.min(1, readyK + dt / READY_MS) : Math.max(0, readyK - dt / READY_MS);
    const amb = ambientRunning();
    if (amb) { ambT += dt; ambLin = Math.min(1, ambLin + dt / AMB.enter); }
    else if (reduced || paused || !ambientOpt) ambLin = 0; // pausa/reduzido: some; volta com a entrada de 300 ms
    // fora da tela, aba oculta ou p ≥ 0,04: o relógio só para (sem salto na volta)
    draw(now);
    if (loopWanted() || amb) raf = requestAnimationFrame(tick);
    else lastNow = 0;
  }
  function kick() {
    if (destroyed) return;
    if (raf) return;
    raf = requestAnimationFrame(tick);
  }
  const onVis = () => { if (docHidden()) lastNow = 0; kick(); };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
  function finishIntro() {
    introDone = true; introStart = null; introOverride = null;
    canvas.dataset.intro = 'done';
  }

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { measure(); kick(); }) : null;
  if (ro) ro.observe(container);
  const io = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible) kick(); })
    : null;
  if (io) io.observe(container);

  function applyLayout(l) {
    if (!l) return;
    if ('art' in l) art = isRect(l.art) ? { ...l.art } : null;
    if ('target' in l) target = isRect(l.target) ? { ...l.target } : null;
    if ('ready' in l) ready = !!l.ready;
    if ('arc' in l) arcT = l.arc && [l.arc.cx, l.arc.cy, l.arc.r].every(Number.isFinite) ? { ...l.arc } : null;
    if (reduced || paused) readyK = ready ? 1 : 0;
  }
  applyLayout(options);
  readyK = ready ? 1 : 0;
  canvas.dataset.intro = 'done';
  measure();
  if (options.intro && !reduced && !paused) { introDone = false; introStart = performance.now(); canvas.dataset.intro = 'playing'; }
  draw(performance.now());
  kick();

  return {
    playIntro() {
      if (destroyed) return;
      if (reduced || paused) { finishIntro(); kick(); return; }
      introDone = false; introOverride = null; introStart = performance.now();
      canvas.dataset.intro = 'playing';
      kick();
    },
    setIntroTime(ms) {
      if (destroyed) return;
      if (ms == null || !Number.isFinite(ms) || ms >= INTRO_MS || paused || reduced) { finishIntro(); kick(); return; }
      introDone = false; introStart = null; introOverride = clamp(ms, 0, INTRO_MS);
      canvas.dataset.intro = 'scrub';
      kick();
    },
    /** Passagem 0..1 (o Site deriva da rolagem). Determinística e reversível. Não finito: mantém. */
    setPassage(v) {
      if (destroyed || !Number.isFinite(v)) return;
      passage = clamp01(v);
      if (passage > 0.001 && !introDone && introOverride == null) finishIntro();
      kick();
    },
    /** {art?, target?, ready?, arc?} em px do container; campos ausentes não mudam. */
    setLayout(l) {
      if (destroyed) return;
      const before = !!C && C.art;
      applyLayout(l);
      if (l && 'art' in l && (!before || !isRect(art) || before.w !== art.w || before.h !== art.h || before.x !== art.x || before.y !== art.y)) measure();
      kick();
    },
    setPaused(v) {
      paused = !!v;
      if (paused) { finishIntro(); readyK = ready ? 1 : 0; }
      lastNow = 0;
      kick();
    },
    setReducedMotion(v) {
      reduced = !!v;
      if (reduced) { finishIntro(); readyK = ready ? 1 : 0; }
      kick();
    },
    getComposition() {
      if (!C) return null;
      const R = C.arcR;
      return {
        study: 'B', layout: C.layout, lite: C.lite, art: C.art, cx: C.cx, cy: C.cy, R0: R, arcR: R,
        summit: lastPeaks?.summit, secondary: lastPeaks?.secondary,
        bounds: lastPeaks?.bounds ? { x: lastPeaks.bounds.minX, y: Math.min(C.cy - R - 3, lastPeaks.bounds.minY), w: lastPeaks.bounds.maxX - lastPeaks.bounds.minX, h: lastPeaks.bounds.maxY - Math.min(C.cy - R - 3, lastPeaks.bounds.minY) } : null,
      };
    },
    _debug() { return { drawMs, arc: lastArc, ambient: { enabled: ambientOpt, running: ambientRunning(), t: ambT, enter: ambLin, ...lastAmb, glintSegs: hero?.glint?.segs ?? 0 }, heroBuilds, baseBuilds, frames, passage, readyK, intro: canvas.dataset.intro, raf: !!raf, dpr, study: 'B', grid: T && [T.cols, T.rows], levels: T && T.K, camera: canvas.dataset.camera }; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis);
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      canvas.remove();
    },
  };
}

/** Nome usado pelo Site e pelo driver da home-v2 (previa-driver.js), que ligam este módulo sem mudanças. */
export function createHomeSculpture(container, options = {}) {
  return createMountainSculpture(container, options);
}

function parseColor(c) {
  if (Array.isArray(c) && c.length >= 3) return c;
  if (typeof c === 'string' && /^#?[0-9a-f]{6}$/i.test(c)) { const h = c.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
  return null;
}
function roundRect(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
