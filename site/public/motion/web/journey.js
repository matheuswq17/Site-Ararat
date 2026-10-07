/*!
 * ARARAT MODEL — cena da jornada Imagem → Segmentação → Dados → Explicação · v0.4
 * Módulo ESM autocontido (sem dependências). Contrato: CONTRATO-MOTION v1 + adendo v1.1 (DIRECAO-04)
 *  - data-loaded="false|true|error" no nó .ararat-journey
 *  - CustomEvent "ararat:journey-layout" no container (bubbles: false) com posições dos rótulos
 * Base: RM axial DEMONSTRATIVA (assets/mri-base.webp) + mapa (assets/mri-map.json).
 * Máscaras, dados e contribuições são demonstrativos: não são resultado do ARARAT nem validação clínica.
 */

const NS = 'http://www.w3.org/2000/svg';
const COLORS = {
  navy: '#0D1B2A',
  navy950: '#080f18',
  dim: '#05080c', // escurecimento neutro: não azula o tecido
  gold: '#D4AF37',
  gold400: '#E1C465',
  blue300: '#7A93B3',
  gray: '#B0B8C1',
  gray200: '#C9CFD6',
  white: '#F5F7FA',
};
const LAYOUT_EVENT = 'ararat:journey-layout';
const FEATURE_IDS = ['shape', 'texture', 'intensity'];

// Substituído no build por deliverables/assets/mri-map.json; em desenvolvimento (src/) o mapa é buscado por baseUrl.
const EMBEDDED_MAP = {"schemaVersion":1,"image":"assets/mri-base.webp","width":806,"height":802,"coordinateSystem":"pixels da imagem-base exportada; origem no canto superior esquerdo; x para a direita, y para baixo","orientation":"axial, conforme a fonte (sem espelhamento nem rotação)","glandPath":"M326.5 476.6L314.5 476.9L310.5 475.1L305.5 474.9L292.5 464.9L287.5 459.7L286.6 456.5L276.4 440.5L272.4 429.5L271.9 421.5L270.0 416.5L270.1 380.5L271.9 376.5L272.1 371.5L274.4 364.5L276.6 360.5L280.5 356.7L282.1 352.5L287.5 347.0L297.5 340.7L302.3 336.5L310.5 332.4L315.5 331.6L324.5 328.1L331.5 327.9L336.5 326.0L349.5 326.1L353.5 327.9L356.5 328.0L387.5 328.0L393.5 326.0L442.5 326.1L446.5 327.9L450.5 328.4L466.9 337.5L475.5 349.3L480.6 358.5L482.9 365.5L483.1 376.5L485.0 382.5L485.0 404.5L483.1 409.5L482.9 419.5L481.1 423.5L480.6 427.5L476.4 435.5L475.6 440.5L467.5 453.0L456.5 459.6L444.5 462.0L437.5 461.9L433.5 460.1L426.5 459.9L422.5 458.1L416.5 457.9L412.5 455.4L405.5 454.9L401.5 453.1L378.5 453.1L372.5 455.4L365.5 459.6L360.5 460.4L343.5 468.4L333.5 474.6L329.5 475.1Z","roiPath":"M394.5 433.6L379.5 433.9L368.5 430.0L362.5 431.9L354.5 431.9L338.5 425.6L334.5 423.4L324.1 413.5L316.5 401.3L310.4 393.5L310.0 388.5L310.4 375.5L317.4 362.5L322.5 356.7L324.5 352.1L328.7 350.5L344.5 338.4L349.5 337.6L358.5 334.1L365.5 333.9L369.5 332.1L373.5 331.9L382.5 328.1L388.5 327.9L394.5 326.0L397.5 326.9L398.4 331.5L399.5 332.9L409.5 338.4L417.5 344.1L425.9 352.5L428.1 356.5L437.6 366.5L439.9 373.5L440.0 377.5L439.9 383.5L438.1 387.5L437.9 390.5L432.4 401.5L431.6 406.5L423.9 417.5L414.5 425.6L409.5 426.4Z","gland":{"centroid":[376.3,396.3],"bbox":[270,326,215,151],"areaPx":26863},"roi":{"centroid":[375.6,382.5],"bbox":[310,326,130,108],"areaPx":10363,"label":"subregião central da segmentação demonstrativa de origem (exemplo didático)"},"sampleCrop":{"x":344,"y":350,"size":64,"insideRoi":1},"textureCrop":{"x":328,"y":334,"size":96,"insideRoi":0.935,"note":"recorte de exibição do painel Textura (v0.4): mostrado a ~1:1, sem ampliar a grade de pixels"},"intensityHistogram":{"bins":[0.184,0.197,0.274,0.5,0.514,0.577,1,0.799,0.769,0.948,0.527,0.487,0.472,0.18,0.082,0.17],"binGray":[14,17,20,24,27,30,34,37,40,43,47,50,53,57,60,63],"note":"Ilustrativo: valores 8-bit do PNG renderizado dentro da região. Não é feature radiômica (DICOM), sem unidade física."},"resolution":{"fileWidth":806,"fileHeight":802,"duplicatedRows":425,"duplicatedColumns":427,"effective":"≈379×377 px distintos: a fonte já é uma ampliação ~2× por vizinho mais próximo","maxRecommendedCssScale":1.3},"metadata":{"source":"references/imaging/mri-axial-demo.png (cópia do maestro de C:/Site_ararat/assets/img/, site anterior)","maskSource":"references/imaging/mri-axial-segmentation.png — sobreposição colorida na mesma grade de pixels (deslocamento 0, erro médio 0.000 nos pixels cinza)","crop":{"x":1,"y":1,"width":806,"height":802,"sourceSize":[812,803]},"nature":"Imagem demonstrativa e máscaras demonstrativas. Não processada pelo ARARAT, não validada clinicamente; a região não representa lesão.","glandPathFrom":"união das cores da sobreposição (contorno suavizado σ=1,2 px, tolerância 0,6 px)","roiPathFrom":"componente laranja central da sobreposição","license":"PENDENTE — autoria, licença e desidentificação não confirmadas","deidentification":"PENDENTE","clinicalValidation":false}};

/* ---------- utilidades ---------- */
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const f2 = (n) => Math.round(n * 100) / 100;
const r4 = (n) => Math.round(n * 10000) / 10000;

function svg(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
function setA(node, attrs) {
  for (const k in attrs) node.setAttribute(k, attrs[k]);
}
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round(lerp((pa >> sh) & 255, (pb >> sh) & 255, t));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/* ---------- traços: 0 forma, 1 textura, 2 intensidade ---------- */
// Contribuições ILUSTRATIVAS (nenhum número é exibido): textura > intensidade > forma.
const CONTRIB = [0.36, 0.92, 0.6];
const RANK = [2, 0, 1];
const FOCUS = 1; // característica que recebe foco didático na Explicação (textura, maior contribuição ilustrativa)

/* ---------- linha do tempo da Explicação (2/3 → 1), determinística ---------- */
const T = {
  reorder: [2 / 3, 0.76], // traços se reordenam; barras neutras crescem
  focus: [0.76, 0.84], // uma característica recebe foco; as demais recuam
  link: [0.81, 0.9], // a conexão dela volta à junção…
  trunk: [0.87, 0.94], // …e ao mesmo recorte de origem na região
  settle: [0.93, 1], // o conjunto final assenta: demais conexões finas, contraste relaxa
};

/* ---------- layout responsivo (coordenadas da imagem-base em px) ---------- */
const LBL = 26; // espaço reservado para rótulo do Site (até 90×24 px) acima de cada traço
const BAR = 18; // espaço da barra de contribuição abaixo de cada traço

function computeLayout(W, H, M) {
  const land = W / H >= 1;
  const bw = M.width, bh = M.height;
  const cap = (M.resolution && M.resolution.maxRecommendedCssScale) || 1.3;
  const [gx, gy] = M.gland.centroid;
  const gb = M.gland.bbox;
  const arcR = 0.5 * Math.hypot(gb[2], gb[3]) * 1.16;
  const pad = clamp(Math.min(W, H) * 0.04, 10, 28);
  const sFit = Math.min(W / bw, H / bh);
  const s0 = Math.min(cap, Math.max(sFit, Math.min((W * 1.3) / bw, H / bh)));
  const cams = [];
  cams[0] = { fx: bw / 2, fy: bh / 2, cx: W / 2, cy: H / 2, s: s0 };
  cams[1] = { fx: gx, fy: gy, cx: W / 2, cy: H / 2, s: Math.min(cap, s0 * 1.45) };
  let slots, g, J0, regionCx, regionCy, arcMax;
  if (land) {
    const gapY = clamp(H * 0.025, 6, 16);
    g = clamp((H - 2 * pad - 3 * (LBL + BAR) - 2 * gapY) / 3, 56, Math.min(150, W * 0.2));
    const slotH = LBL + g + BAR;
    const top0 = (H - (3 * slotH + 2 * gapY)) / 2;
    const colX = W - pad - g / 2 - 4;
    slots = [0, 1, 2].map((i) => ({ x: colX, y: top0 + i * (slotH + gapY) + LBL + g / 2, size: g }));
    const areaR = colX - g / 2 - Math.max(36, W * 0.07);
    const s2 = Math.min(cap, (Math.min(areaR, H) * 0.9) / (2 * arcR));
    regionCx = areaR / 2 + pad * 0.3;
    regionCy = H / 2;
    cams[2] = { fx: gx, fy: gy, cx: regionCx, cy: regionCy, s: s2 };
    cams[3] = { fx: gx, fy: gy, cx: regionCx, cy: regionCy, s: s2 };
    arcMax = Math.min(areaR / 2 + pad * 0.3 - 4, H / 2 - 4);
    J0 = { gapRight: colX - g / 2 };
  } else {
    const gapX = clamp(W * 0.04, 8, 18);
    g = clamp(Math.min((W - 2 * pad - 2 * gapX) / 3, H * 0.24), 56, 130);
    const rowY = H - pad - BAR - g / 2;
    slots = [0, 1, 2].map((i) => ({ x: W / 2 + (i - 1) * (g + gapX), y: rowY, size: g }));
    const regionB = rowY - g / 2 - LBL - Math.max(28, H * 0.06);
    const s2 = Math.min(cap, (W * 0.92) / (gb[2] * 1.25), (regionB * 0.88) / (gb[3] * 1.7));
    regionCx = W / 2;
    regionCy = regionB / 2 + pad * 0.4;
    cams[2] = { fx: gx, fy: gy, cx: regionCx, cy: regionCy, s: s2 };
    cams[3] = { fx: gx, fy: gy, cx: regionCx, cy: regionCy, s: s2 };
    arcMax = Math.min(W / 2 - 4, regionB / 2 + pad * 0.4 - 2);
    J0 = { rowTop: rowY - g / 2 - LBL };
  }
  return { W, H, land, cams, slots, g, J0, arcR, arcMax, pad };
}

function camAt(L, p) {
  const p3 = p * 3;
  const i = Math.min(2, Math.floor(p3));
  const t = ease(clamp01(p3 - i));
  const a = L.cams[i], b = L.cams[i + 1];
  return {
    fx: lerp(a.fx, b.fx, t), fy: lerp(a.fy, b.fy, t),
    cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t),
    s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)),
  };
}

function arcPose(L, p) {
  // [ângulo inicial (graus), extensão (graus), opacidade]
  const poses = [
    [-122, 64, 0.5],
    [-90, 360, 0.95],
    L.land ? [30, 300, 0.75] : [122, 296, 0.75],
    [180, 180, 0.9],
  ];
  const p3 = p * 3;
  const i = Math.min(2, Math.floor(p3));
  const t = ease(clamp01(p3 - i));
  return poses[i].map((v, n) => lerp(v, poses[i + 1][n], t));
}

function arcD(cx, cy, r, a0, span) {
  span = Math.max(0.01, Math.min(359.99, span));
  const rad = Math.PI / 180;
  const pt = (a) => f2(cx + r * Math.cos(a * rad)) + ' ' + f2(cy + r * Math.sin(a * rad));
  const mid = a0 + span / 2, a1 = a0 + span;
  return `M${pt(a0)}A${f2(r)} ${f2(r)} 0 0 1 ${pt(mid)}A${f2(r)} ${f2(r)} 0 0 1 ${pt(a1)}`;
}
function cornersD(r) {
  const h = r.size / 2, c = r.size * 0.14;
  const x0 = r.x - h, x1 = r.x + h, y0 = r.y - h, y1 = r.y + h;
  return (
    `M${f2(x0)} ${f2(y0 + c)}V${f2(y0)}H${f2(x0 + c)}` +
    `M${f2(x1 - c)} ${f2(y0)}H${f2(x1)}V${f2(y0 + c)}` +
    `M${f2(x1)} ${f2(y1 - c)}V${f2(y1)}H${f2(x1 - c)}` +
    `M${f2(x0 + c)} ${f2(y1)}H${f2(x0)}V${f2(y1 - c)}`
  );
}
function topoBgD(W, H, i, n) {
  const y0 = (H * (i + 0.5)) / n;
  const ph = i * 1.7, ph2 = i * 0.63;
  const step = Math.max(16, W / 60);
  let d = '';
  for (let x = -40; x <= W + 40; x += step) {
    const y = y0 + 14 * Math.sin(x * 0.006 + ph) + 8 * Math.sin(x * 0.017 + ph2) + 4 * Math.sin(x * 0.041 + i);
    d += (d ? 'L' : 'M') + f2(x) + ' ' + f2(y);
  }
  return d;
}

/* ---------- API pública (contrato v1, inalterada) ---------- */
export function createJourneyScene(container, options = {}) {
  const baseUrl = typeof options.baseUrl === 'string' ? options.baseUrl : '/motion/';
  let reduced = !!options.reducedMotion;
  let paused = !!options.paused;
  let destroyed = false;
  let target = 0; // progress solicitado
  let shown = 0; // progress exibido (suavizado)
  let visible = true;
  let raf = 0;
  let lastT = 0;
  let ambientT = 0;
  let L = null;
  let M = null; // mapa
  let ready = false; // imagem decodificada
  let lift = null; // canvas da glândula
  let lastLayoutKey = '';
  const uid = 'aj' + Math.random().toString(36).slice(2, 8);

  /* --- DOM fixo (não depende da imagem) --- */
  const root = document.createElement('div');
  root.className = 'ararat-journey';
  root.setAttribute('aria-hidden', 'true');
  root.dataset.implementation = 'svg';
  root.dataset.loaded = 'false';
  root.dataset.reducedMotion = String(reduced);
  root.dataset.paused = String(paused);

  const bg = svg('svg', { class: 'ararat-journey__layer ararat-journey__bg', focusable: 'false' });
  const bgDrift = svg('g', {}, bg);
  const bgLines = [];
  for (let i = 0; i < 16; i++) bgLines.push(svg('path', { class: 'ararat-journey__topo' }, bgDrift));

  const stageEl = document.createElement('div');
  stageEl.className = 'ararat-journey__stage';
  const imgHolder = document.createElement('div');
  imgHolder.className = 'ararat-journey__layer ararat-journey__canvas';
  const img = new Image();
  img.className = 'ararat-journey__bitmap';
  img.alt = '';
  img.decoding = 'async';
  img.draggable = false;
  imgHolder.appendChild(img);
  const mid = svg('svg', { class: 'ararat-journey__layer', focusable: 'false' });
  const liftHolder = document.createElement('div');
  liftHolder.className = 'ararat-journey__layer ararat-journey__canvas';
  const ov = svg('svg', { class: 'ararat-journey__layer', focusable: 'false' });
  stageEl.append(imgHolder, mid, liftHolder, ov);
  root.append(bg, stageEl);
  container.appendChild(root);

  /* --- nós dependentes do mapa --- */
  let N = null;
  function buildOverlay() {
    const bw = M.width, bh = M.height;
    const n = {};
    const mdefs = svg('defs', {}, mid);
    const mkLin = (id, x1, y1, x2, y2) => {
      const lg = svg('linearGradient', { id: uid + id, x1, y1, x2, y2 }, mdefs);
      svg('stop', { offset: '0', 'stop-color': COLORS.navy, 'stop-opacity': '1' }, lg);
      svg('stop', { offset: '1', 'stop-color': COLORS.navy, 'stop-opacity': '0' }, lg);
    };
    mkLin('fl', 0, 0, 1, 0); mkLin('fr', 1, 0, 0, 0); mkLin('ft', 0, 0, 0, 1); mkLin('fb', 0, 1, 0, 0);
    const rg = svg('radialGradient', { id: uid + 'sh' }, mdefs);
    svg('stop', { offset: '0.5', 'stop-color': '#03070c', 'stop-opacity': '0.8' }, rg);
    svg('stop', { offset: '1', 'stop-color': '#03070c', 'stop-opacity': '0' }, rg);
    n.midImg = svg('g', {}, mid);
    const fw = bw * 0.1, fh = bh * 0.1;
    svg('rect', { x: -1, y: -1, width: fw, height: bh + 2, fill: `url(#${uid}fl)` }, n.midImg);
    svg('rect', { x: bw - fw + 1, y: -1, width: fw, height: bh + 2, fill: `url(#${uid}fr)` }, n.midImg);
    svg('rect', { x: -1, y: -1, width: bw + 2, height: fh, fill: `url(#${uid}ft)` }, n.midImg);
    svg('rect', { x: -1, y: bh - fh + 1, width: bw + 2, height: fh, fill: `url(#${uid}fb)` }, n.midImg);
    n.dim = svg('path', { 'fill-rule': 'evenodd', fill: COLORS.dim, d: `M-4000 -4000H5000V5000H-4000Z${M.glandPath}` }, n.midImg);
    const [gcx, gcy] = M.gland.centroid;
    const gb = M.gland.bbox;
    n.shadow = svg('ellipse', { cx: gcx, cy: gcy + gb[3] * 0.06, rx: gb[2] * 0.6, ry: gb[3] * 0.62, fill: `url(#${uid}sh)` }, n.midImg);

    const odefs = svg('defs', {}, ov);
    const cp = svg('clipPath', { id: uid + 'crop' }, odefs);
    const c = M.textureCrop || M.sampleCrop; // v0.4: recorte de exibição mais amplo, mostrado perto de 1:1
    svg('rect', { x: c.x, y: c.y, width: c.size, height: c.size }, cp);
    n.liftG = svg('g', {}, ov);
    n.glandFill = svg('path', { d: M.glandPath, fill: COLORS.white, stroke: 'none' }, n.liftG);
    // contraste seletivo do foco: escurece a glândula fora da região (sem pintar a região)
    n.focusDim = svg('path', { 'fill-rule': 'evenodd', fill: COLORS.dim, d: `${M.glandPath}${M.roiPath || ''}` }, n.liftG);
    n.glandLine = svg('path', { d: M.glandPath, fill: 'none', stroke: COLORS.white, 'stroke-width': 1.3, 'vector-effect': 'non-scaling-stroke', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-linejoin': 'round' }, n.liftG);
    n.roiFill = svg('path', { d: M.roiPath || '', fill: COLORS.gold, stroke: 'none' }, n.liftG);
    n.roiLine = svg('path', { d: M.roiPath || '', fill: 'none', stroke: COLORS.gold, 'stroke-width': 1.4, 'vector-effect': 'non-scaling-stroke', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-linejoin': 'round' }, n.liftG);
    n.srcFrame = svg('rect', { x: c.x, y: c.y, width: c.size, height: c.size, fill: 'none', stroke: COLORS.gold400, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }, n.liftG);

    const scr = svg('g', {}, ov);
    n.arc = svg('path', { fill: 'none', stroke: COLORS.gold, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, scr);
    n.ticks = svg('path', { fill: 'none', stroke: COLORS.gold, 'stroke-width': 1.3 }, scr);
    n.arcDot = svg('circle', { r: 2.6, fill: COLORS.gold400 }, scr);
    // painéis de fundo uniforme sob os traços (legibilidade sobre o tecido)
    n.panels = [0, 1, 2].map(() => svg('rect', { rx: 6, fill: COLORS.navy950, stroke: COLORS.gray, 'stroke-width': 1 }, scr));
    // árvore de conexões
    n.trunkData = svg('path', { fill: 'none', stroke: COLORS.blue300, 'stroke-width': 1, pathLength: 1, 'stroke-dasharray': '1 1' }, scr);
    n.connectors = [0, 1, 2].map(() => svg('path', { fill: 'none', stroke: COLORS.blue300, 'stroke-width': 1, pathLength: 1, 'stroke-dasharray': '1 1' }, scr));
    n.returns = [0, 1, 2].map(() => svg('path', { fill: 'none', 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1' }, scr));
    n.trunkGold = svg('path', { fill: 'none', stroke: COLORS.gold, 'stroke-width': 2.2, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1' }, scr);
    n.junction = svg('circle', { r: 3, fill: COLORS.gold }, scr);
    n.roiDot = svg('circle', { r: 3.2, fill: COLORS.gold }, scr);
    n.frames = [0, 1, 2].map(() => svg('path', { fill: 'none', 'stroke-width': 1.2 }, scr));
    n.tracks = [0, 1, 2].map(() => svg('line', { stroke: COLORS.gray, 'stroke-opacity': 0.28, 'stroke-width': 1 }, scr));
    n.bars = [0, 1, 2].map(() => svg('rect', { rx: 2 }, scr));
    // conteúdo dos traços (cada um num grupo para recuar/realçar)
    n.content = [0, 1, 2].map(() => svg('g', {}, scr));
    // forma: o contorno da região viaja até o slot
    n.shapeG = svg('g', {}, n.content[0]);
    svg('path', { d: M.roiPath || M.glandPath, fill: 'none', stroke: COLORS.gold400, 'stroke-width': 1.7, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' }, n.shapeG);
    {
      const rb = (M.roi || M.gland).bbox;
      const [rx, ry] = (M.roi || M.gland).centroid;
      n.axes = svg('path', {
        fill: 'none', stroke: COLORS.white, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke', 'stroke-dasharray': '2 3',
        d: `M${rb[0]} ${ry}H${rb[0] + rb[2]}M${rx} ${rb[1]}V${rb[1] + rb[3]}`,
      }, n.shapeG);
    }
    // textura: recorte REAL da mesma região (mesmos pixels), ampliado
    n.cropG = svg('g', {}, n.content[1]);
    n.cropImg = svg('image', { width: bw, height: bh, preserveAspectRatio: 'none', 'clip-path': `url(#${uid}crop)` }, n.cropG);
    n.grid = svg('path', { fill: 'none', stroke: COLORS.white, 'stroke-opacity': 0.07, 'stroke-width': 0.6 }, n.content[1]);
    n.cropBorder = svg('rect', { fill: 'none', 'stroke-width': 1 }, n.content[1]);
    // intensidade: histograma ilustrativo (valores 8-bit do PNG na região), alto contraste sobre o painel
    n.histG = svg('g', {}, n.content[2]);
    const hist = M.intensityHistogram;
    n.histRects = hist.bins.map(() => svg('rect', { fill: COLORS.gray200, rx: 0.5 }, n.histG));
    n.baseline = svg('line', { stroke: COLORS.gray, 'stroke-opacity': 0.7, 'stroke-width': 1 }, n.histG);
    return n;
  }

  /* --- geometria compartilhada entre render e evento de rótulos --- */
  function glyphRects(p) {
    const eRe = ease(seg(p, T.reorder[0], T.reorder[1]));
    return [0, 1, 2].map((i) => {
      const a = L.slots[i], b = L.slots[RANK[i]];
      const r = { x: lerp(a.x, b.x, eRe), y: lerp(a.y, b.y, eRe), size: a.size };
      // quem atravessa duas posições (forma) desvia para não cruzar os outros
      const off = Math.sin(Math.PI * eRe) * (Math.abs(RANK[i] - i) > 1 ? 0.78 * r.size : 0);
      if (L.land) r.x -= off;
      else r.y -= off;
      return r;
    });
  }
  const dataShow = (p) => ease(seg(seg(p, 1 / 3, 2 / 3), 0.12, 0.45));

  function emitLayout(p) {
    if (destroyed || !L) return;
    const rects = glyphRects(p);
    const show = ready && dataShow(p) > 0.5;
    const focusAmt = ease(seg(p, T.focus[0], T.focus[1]));
    const detail = {
      schemaVersion: 1,
      progress: r4(p),
      labels: FEATURE_IDS.map((id, i) => {
        const r = rects[i];
        return { id, x: r4(clamp01(r.x / L.W)), y: r4(clamp01((r.y - r.size / 2 - 5) / L.H)), visible: show };
      }),
      emphasis: ready && focusAmt >= 0.5 ? FEATURE_IDS[FOCUS] : null,
    };
    // emite só quando a pose exibida, a geometria, a visibilidade ou a ênfase mudam (nunca por quadro ambiente)
    const key = JSON.stringify([detail.progress, detail.labels, detail.emphasis, L.W, L.H]);
    if (key === lastLayoutKey) return;
    lastLayoutKey = key;
    container.dispatchEvent(new CustomEvent(LAYOUT_EVENT, { detail, bubbles: false }));
  }

  /* --- render determinístico: função de p (+ fase ambiente) --- */
  function render(p) {
    if (!L) return;
    if (!N || !ready) { emitLayout(p); return; }
    const { W, H } = L;
    const cam = camAt(L, p);
    const s = cam.s;
    const tx = cam.cx - cam.fx * s, ty = cam.cy - cam.fy * s;
    const toS = (x, y) => ({ x: x * s + tx, y: y * s + ty });
    const amb = reduced ? 0 : ambientT;
    const tData = seg(p, 1 / 3, 2 / 3);
    const tExpl = seg(p, 2 / 3, 1);
    const eExpl = ease(tExpl);
    const fFocus = ease(seg(p, T.focus[0], T.focus[1]));
    const fSettle = ease(seg(p, T.settle[0], T.settle[1]));
    const [gcx, gcy] = M.gland.centroid;
    const gb = M.gland.bbox;

    // fundo topográfico (somente no azul ao redor da imagem)
    bg.style.opacity = String(0.75 + 0.25 * seg(p, 0.75, 1));
    const dx = 10 * Math.sin((amb / 9000) * Math.PI * 2), dy = 6 * Math.sin((amb / 13000) * Math.PI * 2);
    bgDrift.setAttribute('transform', `translate(${f2(dx)} ${f2(dy)})`);

    // imagem-base: transformação única compartilhada por todas as camadas
    const mtx = `matrix(${s},0,0,${s},${f2(tx)},${f2(ty)})`;
    img.style.transform = mtx;
    N.midImg.setAttribute('transform', mtx);

    // plano elevado da glândula: só translação (sem esticar tecido)
    const up = easeOut(seg(p, 0.18, 1 / 3)) * (1 - 0.5 * eExpl);
    const ldy = -6 * up;
    const pad = 4;
    lift.style.transform = `matrix(${s},0,0,${s},${f2(tx + (gb[0] - pad) * s)},${f2(ty + (gb[1] - pad + ldy) * s)})`;
    N.liftG.setAttribute('transform', `matrix(${s},0,0,${s},${f2(tx)},${f2(ty + ldy * s)})`);
    const liftPt = (x, y) => toS(x, y + ldy);
    N.shadow.setAttribute('opacity', f2(up * 0.9));
    lift.style.opacity = up > 0.001 ? '1' : '0';
    // escurecimento neutro fora da glândula; um pouco mais durante o foco
    N.dim.setAttribute('opacity', f2(0.34 * ease(seg(p, 0.1, 1 / 3)) + 0.12 * ease(seg(p, 1 / 3, 0.55)) + 0.12 * fFocus * (1 - 0.5 * fSettle)));
    N.focusDim.setAttribute('opacity', f2(0.32 * fFocus * (1 - 0.45 * fSettle)));

    // segmentação demonstrativa
    const dG = ease(seg(p, 0.02, 0.21));
    N.glandLine.setAttribute('stroke-dashoffset', f2(1 - dG));
    N.glandLine.setAttribute('stroke-dasharray', dG > 0.999 ? 'none' : '1 1');
    N.glandLine.setAttribute('opacity', f2(dG > 0 ? 0.9 * (1 - 0.4 * eExpl) : 0));
    N.glandFill.setAttribute('opacity', f2(0.05 * seg(p, 0.18, 1 / 3) * (1 - fFocus)));
    const dR = ease(seg(p, 0.13, 0.31));
    N.roiLine.setAttribute('stroke-dashoffset', f2(1 - dR));
    N.roiLine.setAttribute('stroke-dasharray', dR > 0.999 ? 'none' : '1 1');
    N.roiLine.setAttribute('opacity', dR > 0 ? '1' : '0');
    const arrive = ease(seg(p, T.trunk[0], T.trunk[1]));
    N.roiLine.setAttribute('stroke-width', f2(1.4 + 0.9 * arrive));
    N.roiFill.setAttribute('opacity', f2(0.15 * seg(p, 0.22, 0.34) * (1 - 0.4 * fFocus) + 0.08 * arrive));
    // quadrado de origem do recorte: marcado em Dados, recua, e acende quando a conexão volta
    N.srcFrame.setAttribute('opacity', f2(Math.max(0.9 * seg(tData, 0.05, 0.25) * (1 - 0.7 * ease(seg(p, T.reorder[0], T.reorder[1]))), arrive)));
    N.srcFrame.setAttribute('stroke', arrive > 0.5 ? COLORS.gold : COLORS.gold400);
    N.srcFrame.setAttribute('stroke-width', f2(1 + 0.6 * arrive));

    // arco dourado ao redor da cena
    const [a0, span, aop] = arcPose(L, p);
    const gc = liftPt(gcx, gcy);
    const ar = Math.min(L.arcR * s, lerp(Math.min(W, H) * 0.47, L.arcMax, ease(tData)));
    N.arc.setAttribute('d', arcD(gc.x, gc.y, ar, a0, span));
    N.arc.setAttribute('opacity', f2(aop));
    const tk = seg(p, 0.12, 1 / 3) * (1 - seg(p, 1 / 3, 0.5));
    const tl = Math.max(5, ar * 0.05);
    N.ticks.setAttribute(
      'd',
      `M${f2(gc.x)} ${f2(gc.y - ar - tl)}V${f2(gc.y - ar + tl)}M${f2(gc.x)} ${f2(gc.y + ar - tl)}V${f2(gc.y + ar + tl)}` +
        `M${f2(gc.x - ar - tl)} ${f2(gc.y)}H${f2(gc.x - ar + tl)}M${f2(gc.x + ar - tl)} ${f2(gc.y)}H${f2(gc.x + ar + tl)}`
    );
    N.ticks.setAttribute('opacity', f2(tk));
    const u = ((amb / 14000) % 1 + 1) % 1;
    const da = ((a0 + span * u) * Math.PI) / 180;
    setA(N.arcDot, { cx: f2(gc.x + ar * Math.cos(da)), cy: f2(gc.y + ar * Math.sin(da)), opacity: reduced || span < 90 ? '0' : '0.85' });

    // região, recorte de origem e junção da árvore (fora da glândula, no lado dos dados)
    const R0 = M.roi || M.gland;
    const rs = liftPt(R0.centroid[0], R0.centroid[1]);
    const TC = M.textureCrop || M.sampleCrop;
    const cc = liftPt(TC.x + TC.size / 2, TC.y + TC.size / 2);
    let J;
    if (L.land) {
      const gr = liftPt(gb[0] + gb[2], rs.y);
      J = { x: lerp(gr.x, L.J0.gapRight, 0.35), y: rs.y };
    } else {
      const gbm = liftPt(rs.x, gb[1] + gb[3]);
      J = { x: rs.x, y: lerp(gbm.y, L.J0.rowTop, 0.45) };
    }
    setA(N.roiDot, { cx: f2(rs.x), cy: f2(rs.y), opacity: f2(seg(p, 0.36, 0.45) * (1 - arrive)) });
    setA(N.junction, { cx: f2(J.x), cy: f2(J.y), opacity: f2(Math.max(seg(tData, 0.05, 0.2) * (1 - eExpl), ease(seg(p, T.link[0] + 0.05, T.link[1])))) });
    const dTD = ease(seg(tData, 0, 0.2));
    N.trunkData.setAttribute('d', `M${f2(rs.x)} ${f2(rs.y)}L${f2(J.x)} ${f2(J.y)}`);
    N.trunkData.setAttribute('stroke-dashoffset', f2(1 - dTD));
    N.trunkData.setAttribute('opacity', f2((dTD > 0 ? 0.8 : 0) * (1 - seg(p, T.reorder[0], T.reorder[1]))));
    const dTG = ease(seg(p, T.trunk[0], T.trunk[1]));
    N.trunkGold.setAttribute('d', `M${f2(J.x)} ${f2(J.y)}L${f2(cc.x)} ${f2(cc.y)}`);
    N.trunkGold.setAttribute('stroke-dashoffset', f2(1 - dTG));
    N.trunkGold.setAttribute('opacity', dTG > 0 ? '1' : '0');

    // traços
    const rect = glyphRects(p);
    const attach = (r) => (L.land ? { x: r.x - r.size / 2 - 6, y: r.y } : { x: r.x, y: r.y - r.size / 2 - LBL });
    const branch = (A) =>
      L.land
        ? `C${f2(lerp(J.x, A.x, 0.5))} ${f2(J.y)} ${f2(lerp(J.x, A.x, 0.5))} ${f2(A.y)} `
        : `C${f2(J.x)} ${f2(lerp(J.y, A.y, 0.55))} ${f2(A.x)} ${f2(lerp(J.y, A.y, 0.45))} `;
    const showG = dataShow(p);
    const eRe = ease(seg(p, T.reorder[0], T.reorder[1]));
    for (let i = 0; i < 3; i++) {
      const r = rect[i];
      const isF = i === FOCUS;
      // recuo/realce do foco: as demais recuam durante o foco e voltam parcialmente ao assentar
      const recede = isF ? 1 : 1 - 0.55 * fFocus * (1 - 0.6 * fSettle);
      const h = r.size / 2 + 6;
      setA(N.panels[i], {
        x: f2(r.x - h), y: f2(r.y - h), width: f2(2 * h), height: f2(2 * h),
        opacity: f2(showG * 0.86 * recede),
        'stroke-opacity': f2(isF ? 0.18 + 0.5 * fFocus : 0.18),
        stroke: isF && fFocus > 0 ? COLORS.gold : COLORS.gray,
      });
      N.frames[i].setAttribute('d', cornersD({ x: r.x, y: r.y, size: r.size + 12 }));
      N.frames[i].setAttribute('stroke', isF ? mixHex(COLORS.gray, COLORS.gold, fFocus) : COLORS.gray);
      N.frames[i].setAttribute('opacity', f2(showG * (isF ? 0.6 + 0.4 * fFocus : 0.6 * recede)));
      N.content[i].setAttribute('opacity', f2(recede));
      // dados: ramo azul da junção ao traço
      const A = attach(r);
      const dC = ease(seg(tData, 0.15 + i * 0.05, 0.45 + i * 0.05));
      N.connectors[i].setAttribute('d', `M${f2(J.x)} ${f2(J.y)}${branch(A)}${f2(A.x)} ${f2(A.y)}`);
      N.connectors[i].setAttribute('stroke-dashoffset', f2(1 - dC));
      N.connectors[i].setAttribute('opacity', f2((dC > 0 ? 0.75 : 0) * (1 - eRe)));
      // explicação: retorno do traço à junção (o foco primeiro, em dourado; os demais ao assentar, finos)
      const back = L.land
        ? `M${f2(A.x)} ${f2(A.y)}C${f2(lerp(J.x, A.x, 0.5))} ${f2(A.y)} ${f2(lerp(J.x, A.x, 0.5))} ${f2(J.y)} ${f2(J.x)} ${f2(J.y)}`
        : `M${f2(A.x)} ${f2(A.y)}C${f2(A.x)} ${f2(lerp(J.y, A.y, 0.45))} ${f2(J.x)} ${f2(lerp(J.y, A.y, 0.55))} ${f2(J.x)} ${f2(J.y)}`;
      N.returns[i].setAttribute('d', back);
      const dRet = isF ? ease(seg(p, T.link[0], T.link[1])) : ease(seg(p, T.settle[0], T.settle[1] - 0.01));
      N.returns[i].setAttribute('stroke-dashoffset', f2(1 - dRet));
      N.returns[i].setAttribute('stroke', isF ? COLORS.gold : COLORS.blue300);
      N.returns[i].setAttribute('stroke-width', isF ? '2.2' : '1');
      N.returns[i].setAttribute('opacity', f2(dRet > 0 ? (isF ? 1 : 0.6) : 0));
      // barras de contribuição ilustrativas (sem números), sob cada traço
      const bt = ease(seg(p, T.reorder[0] + RANK[i] * 0.01, T.reorder[1] + RANK[i] * 0.01));
      const bx = r.x - r.size / 2, by = r.y + r.size / 2 + 6 + 8, bmax = r.size;
      setA(N.tracks[i], { x1: f2(bx), x2: f2(bx + bmax), y1: f2(by), y2: f2(by), opacity: f2(bt * recede) });
      setA(N.bars[i], {
        x: f2(bx), y: f2(by - 2), height: 4,
        width: f2(Math.max(0, bmax * CONTRIB[i] * bt)),
        fill: isF ? mixHex(COLORS.gray, COLORS.gold, fFocus) : mixHex(COLORS.gray, COLORS.blue300, fFocus),
        opacity: f2(bt > 0 ? 0.9 * (isF ? 1 : recede) : 0),
      });
    }

    // forma: contorno da região sai do lugar e vai ao slot
    {
      const r = rect[0];
      const R0b = R0.bbox;
      const tt = ease(seg(tData, 0.05, 0.5));
      const fit = (r.size * 0.72) / Math.max(R0b[2], R0b[3]);
      const sc = lerp(s, fit, tt);
      const cx = lerp(rs.x, r.x, tt), cy = lerp(rs.y, r.y, tt);
      const [rcx, rcy] = R0.centroid;
      N.shapeG.setAttribute('transform', `matrix(${f2(sc * 1000) / 1000},0,0,${f2(sc * 1000) / 1000},${f2(cx - rcx * sc)},${f2(cy - rcy * sc)})`);
      N.shapeG.setAttribute('opacity', f2(seg(tData, 0.02, 0.12)));
      N.axes.setAttribute('opacity', f2(0.8 * ease(seg(tData, 0.45, 0.7))));
    }
    // textura: recorte com os mesmos pixels; parte alinhado à origem e amplia no slot
    {
      const r = rect[1];
      const c = M.textureCrop || M.sampleCrop;
      const tt = ease(seg(tData, 0.1, 0.55));
      const from = liftPt(c.x, c.y);
      // ampliação interna contida: no máximo a mesma escala da imagem (cap), para não exibir a grade de pixels
      const cap = (M.resolution && M.resolution.maxRecommendedCssScale) || 1.3;
      const side = Math.min(r.size * 0.86, c.size * cap);
      const sc = lerp(s, side / c.size, tt);
      const x = lerp(from.x, r.x - side / 2, tt), y = lerp(from.y, r.y - side / 2, tt);
      N.cropG.setAttribute('transform', `matrix(${f2(sc * 1000) / 1000},0,0,${f2(sc * 1000) / 1000},${f2(x - c.x * sc)},${f2(y - c.y * sc)})`);
      const op = seg(tData, 0.08, 0.2);
      N.cropG.setAttribute('opacity', f2(op));
      const wpx = c.size * sc;
      setA(N.cropBorder, { x: f2(x), y: f2(y), width: f2(wpx), height: f2(wpx), opacity: f2(op * (0.55 + 0.45 * fFocus)), stroke: mixHex(COLORS.gray, COLORS.gold400, fFocus) });
      let gd = '';
      for (let k = 1; k < 3; k++) {
        const o = (wpx * k) / 3;
        gd += `M${f2(x + o)} ${f2(y)}V${f2(y + wpx)}M${f2(x)} ${f2(y + o)}H${f2(x + wpx)}`;
      }
      N.grid.setAttribute('d', gd);
      N.grid.setAttribute('opacity', f2(ease(seg(tData, 0.5, 0.75))));
    }
    // intensidade
    {
      const r = rect[2];
      const bins = M.intensityHistogram.bins;
      const n = bins.length, w = r.size * 0.84, bw = w / n;
      const x0 = r.x - w / 2, yb = r.y + r.size * 0.36, hmax = r.size * 0.7;
      for (let q = 0; q < n; q++) {
        const tt = ease(seg(tData, 0.35 + q * 0.013, 0.75 + q * 0.013));
        const hh = Math.max(0.5, bins[q] * hmax * tt);
        setA(N.histRects[q], { x: f2(x0 + q * bw + bw * 0.1), y: f2(yb - hh), width: f2(bw * 0.8), height: f2(hh) });
      }
      setA(N.baseline, { x1: f2(x0), x2: f2(x0 + w), y1: f2(yb + 0.5), y2: f2(yb + 0.5) });
      N.histG.setAttribute('opacity', f2(seg(tData, 0.3, 0.45)));
    }
    root.dataset.state = String(Math.round(p * 3));
    emitLayout(p);
  }

  /* --- laço: só com suavização pendente ou ambiente ativo --- */
  function ambientOn() {
    return ready && !paused && !reduced && visible && !destroyed;
  }
  function settled() {
    return shown === target;
  }
  function tick(now) {
    raf = 0;
    if (destroyed) return;
    const dt = lastT ? Math.min(64, now - lastT) : 16;
    lastT = now;
    if (!settled()) {
      const k = 1 - Math.exp(-dt / 110);
      shown += (target - shown) * k;
      if (Math.abs(target - shown) < 0.0006) shown = target;
    }
    if (ambientOn()) ambientT += dt;
    render(shown);
    schedule();
  }
  function schedule() {
    if (destroyed || raf) return;
    if (!ready) return; // antes da imagem não há o que animar; o estado fica guardado
    if (!settled() || ambientOn()) raf = requestAnimationFrame(tick);
    else lastT = 0;
  }
  const snapPose = (p) => (reduced ? Math.round(p * 3) / 3 : p);

  function relayout() {
    if (destroyed) return;
    const W = Math.max(1, container.clientWidth || root.clientWidth);
    const H = Math.max(1, container.clientHeight || root.clientHeight);
    for (const n of [bg, mid, ov]) {
      n.setAttribute('viewBox', `0 0 ${W} ${H}`);
      n.setAttribute('width', W);
      n.setAttribute('height', H);
    }
    bgLines.forEach((pth, i) => pth.setAttribute('d', topoBgD(W, H, i, bgLines.length)));
    if (M) L = computeLayout(W, H, M);
    render(shown);
  }

  /* --- carregamento assíncrono: respeita estado recebido antes do load; nada após destroy --- */
  const abort = typeof AbortController !== 'undefined' ? new AbortController() : null;
  function fail(reason) {
    if (destroyed) return;
    root.dataset.loaded = 'error';
    root.dataset.error = reason;
  }
  function onImage() {
    if (destroyed) return;
    const gb = M.gland.bbox, pad = 4;
    lift = document.createElement('canvas');
    lift.className = 'ararat-journey__bitmap';
    lift.width = gb[2] + pad * 2;
    lift.height = gb[3] + pad * 2;
    const lc = lift.getContext('2d');
    lc.translate(pad - gb[0], pad - gb[1]);
    lc.clip(new Path2D(M.glandPath));
    lc.drawImage(img, 0, 0);
    liftHolder.appendChild(lift);
    N.cropImg.setAttribute('href', img.src);
    ready = true;
    if (reduced) shown = target = snapPose(target);
    relayout();
    root.dataset.loaded = 'true';
    schedule();
  }
  function startImage() {
    if (destroyed) return;
    N = buildOverlay();
    img.style.width = M.width + 'px';
    img.style.height = M.height + 'px';
    img.onload = () => {
      const go = () => onImage();
      if (img.decode) img.decode().then(go, go);
      else go();
    };
    img.onerror = () => fail('image');
    img.src = baseUrl + (M.image || 'assets/mri-base.webp');
  }
  if (EMBEDDED_MAP) {
    M = EMBEDDED_MAP;
    startImage();
  } else if (typeof fetch === 'function') {
    fetch(baseUrl + 'assets/mri-map.json', abort ? { signal: abort.signal } : undefined)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m) => {
        if (destroyed) return;
        M = m;
        startImage();
        relayout();
      })
      .catch(() => fail('map'));
  } else fail('map');

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => relayout()) : null;
  if (ro) ro.observe(container);
  const io =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
          visible = entries[entries.length - 1].isIntersecting;
          schedule();
        })
      : null;
  if (io) io.observe(root);
  relayout();

  return {
    setProgress(progress) {
      if (destroyed) return;
      if (typeof progress !== 'number' || !Number.isFinite(progress)) return;
      target = clamp01(progress);
      if (reduced || !ready) {
        target = snapPose(target);
        shown = target;
        render(shown);
        return;
      }
      schedule();
    },
    setReducedMotion(enabled) {
      if (destroyed) return;
      reduced = !!enabled;
      root.dataset.reducedMotion = String(reduced);
      if (reduced) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        lastT = 0;
        shown = target = snapPose(target);
      }
      render(shown);
      schedule();
    },
    setPaused(next) {
      if (destroyed) return;
      paused = !!next;
      root.dataset.paused = String(paused);
      schedule();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (abort) abort.abort();
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      img.onload = img.onerror = null;
      img.removeAttribute('src');
      if (lift) lift.width = lift.height = 0;
      lift = null;
      root.remove();
    },
  };
}
