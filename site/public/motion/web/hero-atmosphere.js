/*!
 * ARARAT MODEL — atmosfera do hero · v0.3
 * Módulo ESM autocontido, sem dependências e sem requisições. Adendo v1.1 (DIRECAO-04).
 * createHeroAtmosphere(container, { baseUrl, paused, reducedMotion }) → { setPaused, setReducedMotion, destroy }
 * Camada abstrata e aria-hidden: azul profundo, curvas topográficas discretas, arco e luz dourada numa pequena área.
 * Sem texto, sem logo, sem RM. Movimento só por animações CSS de baixa amplitude (ciclos de 10–12 s),
 * suspensas com paused, offscreen ou reducedMotion. Nenhum requestAnimationFrame.
 */

const NS = 'http://www.w3.org/2000/svg';
const ART = { w: 1600, h: 1000 };
const FOCUS = { x: 1180, y: 470 }; // centro das curvas: lado direito, longe do texto

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
const f1 = (n) => Math.round(n * 10) / 10;

// anel topográfico irregular, determinístico
function ring(cx, cy, r, k, squash = 0.78, n = 96) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const rr = r * (1 + 0.06 * Math.sin(3 * t + k * 0.9) + 0.045 * Math.cos(5 * t + k * 1.7) + 0.025 * Math.sin(7 * t + k * 0.4));
    d += (i ? 'L' : 'M') + f1(cx + rr * Math.cos(t)) + ' ' + f1(cy + rr * squash * Math.sin(t));
  }
  return d + 'Z';
}

export function createHeroAtmosphere(container, options = {}) {
  let paused = !!options.paused;
  let reduced = !!options.reducedMotion;
  let offscreen = false;
  let destroyed = false;
  const uid = 'ah' + Math.random().toString(36).slice(2, 8);

  const root = document.createElement('div');
  root.className = 'ararat-hero-atm';
  root.setAttribute('aria-hidden', 'true');
  root.dataset.loaded = 'true';

  const s = el('svg', { class: 'ararat-hero-atm__svg', focusable: 'false', preserveAspectRatio: 'none' });
  const defs = el('defs', {}, s);
  const glow = el('radialGradient', { id: uid + 'g' }, defs);
  el('stop', { offset: '0', 'stop-color': '#E1C465', 'stop-opacity': '0.2' }, glow);
  el('stop', { offset: '0.45', 'stop-color': '#D4AF37', 'stop-opacity': '0.06' }, glow);
  el('stop', { offset: '1', 'stop-color': '#D4AF37', 'stop-opacity': '0' }, glow);
  const depth = el('radialGradient', { id: uid + 'd', cx: '0.5', cy: '0.5', r: '0.5' }, defs);
  el('stop', { offset: '0', 'stop-color': '#1B3049', 'stop-opacity': '0.55' }, depth);
  el('stop', { offset: '1', 'stop-color': '#0D1B2A', 'stop-opacity': '0' }, depth);
  const veil = el('linearGradient', { id: uid + 'v', x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
  el('stop', { offset: '0', 'stop-color': '#080f18', 'stop-opacity': '0.7' }, veil);
  el('stop', { offset: '0.45', 'stop-color': '#080f18', 'stop-opacity': '0' }, veil);

  // profundidade: luz difusa azul atrás da área médica
  el('ellipse', { cx: FOCUS.x, cy: FOCUS.y, rx: 620, ry: 460, fill: `url(#${uid}d)` }, s);
  // curvas topográficas: dois planos com derivas diferentes (paralaxe sutil)
  const far = el('g', { class: 'ararat-hero-atm__far' }, s);
  for (let k = 0; k < 9; k++) {
    el('path', { d: ring(FOCUS.x, FOCUS.y, 120 + k * 62, k), class: 'ararat-hero-atm__topo', 'stroke-opacity': (0.085 - k * 0.006).toFixed(3) }, far);
  }
  const near = el('g', { class: 'ararat-hero-atm__near' }, s);
  for (let k = 0; k < 5; k++) {
    el('path', { d: ring(FOCUS.x + 90, FOCUS.y + 140, 520 + k * 90, k + 11, 0.62), class: 'ararat-hero-atm__topo', 'stroke-opacity': (0.05 - k * 0.006).toFixed(3) }, near);
  }
  // luz dourada atravessando uma pequena área
  const light = el('g', { class: 'ararat-hero-atm__light' }, s);
  el('ellipse', { cx: FOCUS.x - 70, cy: FOCUS.y - 250, rx: 300, ry: 120, transform: `rotate(-14 ${FOCUS.x - 70} ${FOCUS.y - 250})`, fill: `url(#${uid}g)` }, light);
  // arco da marca (fragmento superior) e brilho que o percorre
  const R = 392;
  const a0 = (-158 * Math.PI) / 180, a1 = (-22 * Math.PI) / 180;
  const arcPath = `M${f1(FOCUS.x + R * Math.cos(a0))} ${f1(FOCUS.y + R * Math.sin(a0))}A${R} ${R} 0 0 1 ${f1(FOCUS.x + R * Math.cos(a1))} ${f1(FOCUS.y + R * Math.sin(a1))}`;
  el('path', { d: arcPath, class: 'ararat-hero-atm__arc' }, s);
  el('path', { d: arcPath, class: 'ararat-hero-atm__sweep', pathLength: '1000' }, s);
  // véu à esquerda: reserva a área de leitura
  el('rect', { x: 0, y: 0, width: ART.w, height: ART.h, fill: `url(#${uid}v)` }, s);

  root.appendChild(s);
  container.appendChild(root);

  function sync() {
    root.dataset.paused = String(paused || offscreen);
    root.dataset.reducedMotion = String(reduced);
  }
  function relayout() {
    if (destroyed) return;
    const W = Math.max(1, container.clientWidth), H = Math.max(1, container.clientHeight);
    const k = Math.max(W / ART.w, H / ART.h);
    const vw = W / k, vh = H / k;
    const fx = W / H >= 1 ? 0.68 : 0.62;
    const vx = Math.min(Math.max(FOCUS.x - fx * vw, 0), ART.w - vw);
    const vy = Math.min(Math.max(FOCUS.y - 0.46 * vh, 0), ART.h - vh);
    s.setAttribute('viewBox', `${f1(vx)} ${f1(vy)} ${f1(vw)} ${f1(vh)}`);
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(relayout) : null;
  if (ro) ro.observe(container);
  const io =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
          offscreen = !entries[entries.length - 1].isIntersecting;
          sync();
        })
      : null;
  if (io) io.observe(root);
  sync();
  relayout();

  return {
    setPaused(v) {
      if (destroyed) return;
      paused = !!v;
      sync();
    },
    setReducedMotion(v) {
      if (destroyed) return;
      reduced = !!v;
      sync();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      root.remove();
    },
  };
}
