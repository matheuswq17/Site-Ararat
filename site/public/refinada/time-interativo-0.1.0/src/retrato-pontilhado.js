/* ARARAT — retrato pontilhado interativo do Time ("stipple" + revelação da foto + transformação entre pessoas).
 * Motion, 0.1.0-draft. Canvas 2D, sem dependências. Rascunho: sem aprovação visual final.
 *
 * Contrato (resumo — ver README):
 *   const r = createStipplePortrait(raiz, { pessoas, inicial, visao, interativo, reducedMotion, paused, cor, onEstado })
 *   r.select(id)        → Promise<boolean>  troca de integrante; só assume depois de a nova foto estar decodificada e
 *                                           os pontos calculados; vale sempre o último pedido (sem fila)
 *   r.preload(id)       → Promise           prepara uma pessoa sem trocar (ex.: ao passar o mouse na linha da lista)
 *   r.setVisao(v)       'auto' (pontos; foto com o ponteiro sobre o retrato) | 'foto' | 'pontos'  — controle "Ver foto / Ver pontos"
 *   r.setHover(bool)    hover controlado pelo Site (opcional; por padrão o módulo escuta pointerenter/leave do mouse)
 *   r.setPaused(bool) / r.setReducedMotion(bool)  → foto íntegra estática, trocas instantâneas
 *   r.setCor('natural'|'mono')
 *   r.state             { fase, ativo, pedido, visao, modo, revelado }
 *   r.destroy()
 * Eventos: raiz recebe CustomEvent('retrato:estado', { detail: state }) a cada mudança de fase; também opts.onEstado.
 *
 * Estados visuais:
 *   pontos     retrato pontilhado (navy) gerado da própria foto recortada: difusão de erro (Floyd–Steinberg) sobre o
 *              tom do sujeito, com tremor fixo por semente — mesmo desenho a cada carga. Parado: nenhum redesenho.
 *   foto       a fotografia (recorte sobre transparente) em cor natural ou P&B por CSS.
 *   revelar    ponteiro entra: os pontos somem em ordem aleatória fixa e a foto aparece (≈380 ms); sair reverte (≈420 ms).
 *   transformar  troca de pessoa: cada ponto sai da posição na pessoa A, passa por um ponto disperso (deslocamento
 *              horizontal por faixas + ruído) e chega à posição na pessoa B (≈950 ms). A identidade só existe nas pontas:
 *              no meio do caminho os pontos estão dispersos; nenhuma face misturada é desenhada. A foto só aparece
 *              depois que B assentou. Com a foto visível, ela primeiro volta a pontos.
 */
export const VERSION = '0.1.0-draft';
export const TEMPOS = { revelar: 380, ocultar: 420, transformar: 950, retarget: 760 };

const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const sstep = (t) => t * t * (3 - 2 * t);
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function hilbert(n, x, y) { let d = 0; for (let s = n >> 1; s > 0; s >>= 1) { const rx = (x & s) > 0 ? 1 : 0, ry = (y & s) > 0 ? 1 : 0; d += s * s * ((3 * rx) ^ ry); if (ry === 0) { if (rx === 1) { x = s - 1 - x; y = s - 1 - y; } const t = x; x = y; y = t; } } return d; }

/* Pontilhado de uma imagem RGBA (recorte): devolve pontos normalizados (0–1) em ordem de Hilbert. */
export function stipple(img, { colunas = 150, aspecto = 4 / 5, semente = 1, tremor = 0.32, limiar = 0.3, faixa = 0.7, gama = 1.5, detalhe = 1.6, contorno = 0.25 } = {}) {
  const gw = colunas, gh = Math.round(colunas / aspecto);
  const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(gw, gh) : Object.assign(document.createElement('canvas'), { width: gw, height: gh });
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, gw, gh);
  const d = g.getImageData(0, 0, gw, gh).data;
  const N = gw * gh, L = new Float32Array(N), A = new Float32Array(N);
  for (let i = 0; i < N; i++) { A[i] = d[i * 4 + 3] / 255; L[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255; }
  // nível automático por pessoa: escuridão normalizada entre os percentis 8 e 97 do próprio sujeito (fotos com
  // exposições muito diferentes ganham densidade comparável)
  const amostra = [];
  for (let i = 0; i < N; i++) if (A[i] > 0.5) amostra.push(1 - L[i]);
  amostra.sort((a, b) => a - b);
  const pLo = amostra.length ? amostra[Math.floor(amostra.length * 0.08)] : 0, pHi = amostra.length ? amostra[Math.floor(amostra.length * 0.97)] : 1;
  const amp = Math.max(0.15, pHi - pLo);
  // contraste local (realça olhos, óculos, contorno): média 5×5 − L
  const tom = new Float32Array(N);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    let s = 0, n = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue; s += L[yy * gw + xx]; n++; }
    const i = y * gw + x, det = (s / n - L[i]) / amp;
    const escuro = (1 - L[i] - pLo) / amp;
    let t = clamp01((escuro - limiar) / faixa); // pele quase vazia; cabelo, sobrancelhas, roupa densos
    t = t ** gama + det * detalhe;
    // contorno do sujeito: leve reforço onde o alfa cai (silhueta legível sem fundo)
    tom[i] = clamp01(t) * A[i] + (A[i] > 0.15 && A[i] < 0.85 ? contorno : 0);
  }
  // Floyd–Steinberg serpentina
  const pts = [];
  const rnd = prng(semente);
  for (let y = 0; y < gh; y++) {
    const ida = (y & 1) === 0;
    for (let k = 0; k < gw; k++) {
      const x = ida ? k : gw - 1 - k, i = y * gw + x;
      const v = tom[i], q = v >= 0.5 ? 1 : 0, e = v - q;
      if (q) pts.push((x + 0.5 + (rnd() * 2 - 1) * tremor) / gw, (y + 0.5 + (rnd() * 2 - 1) * tremor) / gh);
      const dir = ida ? 1 : -1;
      if (x + dir >= 0 && x + dir < gw) tom[i + dir] += (e * 7) / 16;
      if (y + 1 < gh) { if (x - dir >= 0 && x - dir < gw) tom[i + gw - dir] += (e * 3) / 16; tom[i + gw] += (e * 5) / 16; if (x + dir >= 0 && x + dir < gw) tom[i + gw + dir] += e / 16; }
    }
  }
  const n = pts.length / 2, ord = new Array(n);
  for (let i = 0; i < n; i++) ord[i] = [hilbert(256, Math.min(255, (pts[2 * i] * 256) | 0), Math.min(255, (pts[2 * i + 1] * 256) | 0)), i];
  ord.sort((a, b) => a[0] - b[0]);
  const xs = new Float32Array(n), ys = new Float32Array(n);
  ord.forEach(([, i], k) => { xs[k] = pts[2 * i]; ys[k] = pts[2 * i + 1]; });
  return { n, xs, ys, colunas: gw, linhas: gh };
}

export function createStipplePortrait(raiz, opts = {}) {
  const O = {
    visao: 'auto', interativo: 'auto', reducedMotion: 'auto', paused: false, cor: 'natural', hover: true,
    pontos: { cor: '#0D1B2A', celula: 2.4, lado: 1.35 }, aspecto: 4 / 5, onEstado: null,
    agora: () => performance.now(), raf: (f) => requestAnimationFrame(f), caf: (h) => cancelAnimationFrame(h), ...opts,
  };
  O.pontos = { cor: '#0D1B2A', celula: 2.4, lado: 1.35, ...(opts.pontos || {}) };
  const pessoas = new Map((O.pessoas || []).map((p) => [p.id, { ...p, estado: 'novo', prom: null, img: null, pts: null, fallback: false }]));
  if (!pessoas.size) throw new Error('createStipplePortrait: pessoas vazio');
  const mqRed = matchMedia('(prefers-reduced-motion: reduce)');
  const mqFino = matchMedia('(hover: hover) and (pointer: fine)');
  let destruido = false, handle = 0, ultimo = 0, visivel = true, hover = false;
  let paused = !!O.paused, redForcado = O.reducedMotion === 'auto' ? null : !!O.reducedMotion;
  let visao = O.visao, ativo = null, pedido = O.inicial && pessoas.has(O.inicial) ? O.inicial : [...pessoas.keys()][0];
  let r = 0; // 0 = pontos, 1 = foto
  let morph = null; // { para, t, D }
  let fase = '', faseAnt = '';
  const stats = { quadros: 0, ms: 0, max: 0 }; // custo de JS (passo + desenho) por quadro animado

  // DOM próprio do módulo
  if (getComputedStyle(raiz).position === 'static') raiz.style.position = 'relative';
  const foto = document.createElement('img');
  foto.className = 'rp-foto'; foto.decoding = 'async'; foto.draggable = false;
  foto.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;pointer-events:none;user-select:none';
  const cv = document.createElement('canvas');
  cv.className = 'rp-pontos'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  const aviso = document.createElement('div');
  aviso.className = 'rp-falha'; aviso.hidden = true; aviso.setAttribute('role', 'img');
  raiz.append(foto, cv, aviso);
  const legado = raiz.querySelector('[data-retrato-fallback]'); // <img> do Site para sem JS: some quando o módulo assume
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;

  // partículas: pool fixo (as pessoas usam até POOL pontos; as sobras ficam invisíveis nas mesmas posições)
  let P = 0, px, py, sx, sy, cx, cy, ex, ey, al, a0, a1, atraso, chave;
  function garantirPool(n) {
    if (n <= P) return;
    const novo = (old) => { const a = new Float32Array(n); if (old) a.set(old); return a; };
    [px, py, sx, sy, cx, cy, ex, ey, al, a0, a1, atraso] = [px, py, sx, sy, cx, cy, ex, ey, al, a0, a1, atraso].map(novo);
    const ch = new Float32Array(n); if (chave) ch.set(chave); const rk = prng(97 + P); for (let i = P; i < n; i++) ch[i] = rk();
    chave = ch; P = n;
  }
  function alvoDe(id, i) { // posição e alfa da partícula i no desenho da pessoa id
    const pp = pessoas.get(id)?.pts;
    if (!pp) return null;
    const k = Math.floor((i * pp.n) / P), kAnt = i === 0 ? -1 : Math.floor(((i - 1) * pp.n) / P);
    return [pp.xs[k], pp.ys[k], k !== kAnt ? 1 : 0];
  }
  function assentar(id) { // partículas exatamente no desenho de id (sem animação)
    for (let i = 0; i < P; i++) { const t = alvoDe(id, i); if (t) { px[i] = ex[i] = t[0]; py[i] = ey[i] = t[1]; al[i] = a1[i] = t[2]; } else { al[i] = a1[i] = 0; } }
  }

  const reduzido = () => (redForcado != null ? redForcado : mqRed.matches);
  const interativoOk = () => (O.interativo === 'auto' ? mqFino.matches : !!O.interativo);
  const modoFoto = () => paused || reduzido() || !interativoOk() || (ativo && pessoas.get(ativo)?.fallback) || (ativo && pessoas.get(ativo)?.estado === 'falha');
  const rAlvo = () => (visao === 'foto' ? 1 : visao === 'pontos' ? 0 : hover ? 1 : 0);

  function emitir() {
    fase = !ativo ? 'carregando' : pessoas.get(ativo).estado === 'falha' ? 'falha' : modoFoto() ? 'foto-estatica' : morph ? 'transformando' : pedido !== ativo ? (pessoas.get(pedido)?.estado !== 'pronto' ? 'carregando' : r > 0 ? 'ocultando' : 'transformando') : r === 1 ? 'foto' : r === 0 ? 'pontos' : rAlvo() > r ? 'revelando' : 'ocultando';
    if (fase === faseAnt) return;
    faseAnt = fase;
    raiz.dataset.fase = fase;
    const det = estado();
    raiz.dispatchEvent(new CustomEvent('retrato:estado', { detail: det }));
    O.onEstado?.(det);
  }
  const estado = () => ({ fase, ativo, pedido, visao, modo: modoFoto() ? 'foto' : 'interativo', revelado: +r.toFixed(3), animando: !!handle });

  // ---------- carregamento ----------
  function carregarImg(src) { return new Promise((ok, erro) => { const im = new Image(); im.decoding = 'async'; im.onload = () => (im.decode ? im.decode().then(() => ok(im), () => ok(im)) : ok(im)); im.onerror = () => erro(new Error('falha: ' + src)); im.src = src; }); }
  function preparar(id) {
    const p = pessoas.get(id);
    if (!p) return Promise.reject(new Error('pessoa desconhecida: ' + id));
    if (p.prom) return p.prom;
    p.estado = 'carregando';
    p.prom = carregarImg(p.recorte)
      .then((im) => { p.img = im; p.src = p.recorte; p.pts = limitar(stipple(im, { ...(O.pontos.tom || {}), colunas: colunasAtual(), aspecto: O.aspecto, semente: hashStr(id) })); p.estado = 'pronto'; })
      .catch(() => (p.foto ? carregarImg(p.foto).then((im) => { p.img = im; p.src = p.foto; p.fallback = true; p.estado = 'pronto'; }) : Promise.reject()))
      .catch(() => { p.estado = 'falha'; })
      .then(() => p.estado);
    return p.prom;
  }
  function limitar(pts) { // nunca mais pontos que partículas: subamostra uniforme na ordem de Hilbert
    if (pts.n <= P) return pts;
    const xs = new Float32Array(P), ys = new Float32Array(P);
    for (let i = 0; i < P; i++) { const k = Math.floor((i * pts.n) / P); xs[i] = pts.xs[k]; ys[i] = pts.ys[k]; }
    return { ...pts, n: P, xs, ys };
  }
  const colunasAtual = () => Math.max(60, Math.min(220, Math.round((W || 360) / O.pontos.celula)));

  // ---------- desenho ----------
  function medir() {
    const rc = raiz.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(rc.width * dpr), h = Math.round(rc.height * dpr);
    W = rc.width; H = rc.height;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; return true; }
    return false;
  }
  function desenhar() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const mf = modoFoto();
    // foto
    const fotoOp = mf ? 1 : sstep(clamp01(r));
    if (foto.style.opacity !== String(+fotoOp.toFixed(3))) foto.style.opacity = String(+fotoOp.toFixed(3));
    cv.style.visibility = mf || r >= 1 ? 'hidden' : 'visible';
    if (mf || r >= 1 || !P) return;
    const w = cv.width, h = cv.height, lado = O.pontos.lado * dpr, m = lado / 2;
    ctx.fillStyle = O.pontos.cor;
    // revelação: pontos somem em ordem aleatória fixa (chave), com borda suave de 0,08
    const lim = r * 1.08;
    const baldes = [[], [], [], []];
    for (let i = 0; i < P; i++) {
      let a = al[i];
      if (a <= 0.01) continue;
      if (r > 0) { const v = clamp01((chave[i] - lim) / 0.08 + 1); a *= v; if (a <= 0.01) continue; }
      if (a >= 0.97) ctx.fillRect(px[i] * w - m, py[i] * h - m, lado, lado);
      else baldes[Math.min(3, (a * 4) | 0)].push(i);
    }
    for (let b = 0; b < 4; b++) {
      if (!baldes[b].length) continue;
      ctx.globalAlpha = (b + 0.5) / 4;
      for (const i of baldes[b]) ctx.fillRect(px[i] * w - m, py[i] * h - m, lado, lado);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- transformação ----------
  function iniciarMorph(para, D) {
    const rnd = prng(hashStr(para) ^ (P * 2654435761));
    const faixas = 48, desloc = new Float32Array(faixas);
    for (let b = 0; b < faixas; b++) desloc[b] = (rnd() * 2 - 1) * (0.05 + 0.12 * rnd());
    const temDe = morph || (ativo && pessoas.get(ativo)?.pts);
    for (let i = 0; i < P; i++) {
      const t = alvoDe(para, i);
      sx[i] = px[i]; sy[i] = py[i]; a0[i] = temDe ? al[i] : 0;
      const exi = t ? t[0] : px[i], eyi = t ? t[1] : py[i];
      ex[i] = exi; ey[i] = eyi; a1[i] = t ? t[2] : 0;
      if (!temDe) { sx[i] = exi + (rnd() * 2 - 1) * 0.2; sy[i] = eyi + (rnd() * 2 - 1) * 0.05; }
      // ponto disperso do meio: média + deslocamento horizontal da faixa + ruído
      const b = Math.min(faixas - 1, Math.max(0, ((sy[i] + eyi) / 2 * faixas) | 0));
      const mx = (sx[i] + exi) / 2 + desloc[b] + (rnd() * 2 - 1) * 0.035, my = (sy[i] + eyi) / 2 + (rnd() * 2 - 1) * 0.03;
      cx[i] = 2 * mx - (sx[i] + exi) / 2; cy[i] = 2 * my - (sy[i] + eyi) / 2; // controle da Bézier quadrática que passa por M em u = 0,5
      atraso[i] = rnd() * 0.14;
    }
    morph = { para, t: 0, D };
  }
  function passoMorph(dt) {
    morph.t += dt;
    const T = morph.t / morph.D;
    for (let i = 0; i < P; i++) {
      if (a0[i] === 0 && a1[i] === 0) continue; // sobras invisíveis nas duas pontas: não andam (assentar() as reposiciona)
      const u = easeIO(clamp01((T - atraso[i]) / 0.86)), v = 1 - u;
      px[i] = v * v * sx[i] + 2 * u * v * cx[i] + u * u * ex[i];
      py[i] = v * v * sy[i] + 2 * u * v * cy[i] + u * u * ey[i];
      // alfa: quem só existe numa das pontas aparece/some perto do meio (sem dois desenhos ao mesmo tempo)
      al[i] = a0[i] === a1[i] ? a1[i] : a0[i] + (a1[i] - a0[i]) * sstep(clamp01((u - 0.3) / 0.4));
    }
    if (T >= 1) { const para = morph.para; morph = null; ativo = para; assentar(para); fixarFoto(); return r !== rAlvo(); } // com a foto fixa/hover, segue para a revelação
    return true;
  }
  function fixarFoto() {
    const p = pessoas.get(ativo);
    if (!p) return;
    aviso.hidden = p.estado !== 'falha';
    if (p.estado === 'falha') { foto.removeAttribute('src'); foto.alt = ''; foto.hidden = true; aviso.textContent = p.alt ? `${p.alt} — foto indisponível` : 'Foto indisponível'; aviso.setAttribute('aria-label', aviso.textContent); raiz.dataset.falha = ''; return; }
    delete raiz.dataset.falha; foto.hidden = false;
    if (foto.getAttribute('src') !== p.src) foto.src = p.src;
    foto.alt = p.alt || '';
    foto.style.filter = O.cor === 'mono' ? 'grayscale(1) contrast(1.04)' : '';
        if (legado) legado.hidden = true;
  }

  // ---------- laço (só enquanto há movimento) ----------
  function passo(dt) {
    if (modoFoto()) return false;
    if (morph) {
      if (pedido !== morph.para && pessoas.get(pedido)?.estado === 'pronto' && !pessoas.get(pedido).fallback) iniciarMorph(pedido, TEMPOS.retarget); // último pedido prevalece, a partir de onde os pontos estão
      return passoMorph(dt);
    }
    const pp = pessoas.get(pedido);
    if (pedido !== ativo && pp?.estado === 'falha') { ativo = pedido; fixarFoto(); return false; } // 404: sem pontos; aviso coerente com a pessoa
    if (pedido !== ativo && pp?.estado === 'pronto') {
      if (r > 0) { r = Math.max(0, r - dt / TEMPOS.ocultar); return true; } // foto volta a pontos antes de trocar
      if (pp.fallback) { ativo = pedido; fixarFoto(); return false; }
      iniciarMorph(pedido, TEMPOS.transformar); return true;
    }
    const alvo = rAlvo();
    if (r < alvo) r = Math.min(alvo, r + dt / TEMPOS.revelar);
    else if (r > alvo) r = Math.max(alvo, r - dt / TEMPOS.ocultar);
    return r !== alvo;
  }
  function tick(now) {
    handle = 0;
    if (destruido) return;
    const dt = Math.min(50, Math.max(0, now - ultimo)); ultimo = now;
    const t0 = performance.now();
    const mais = passo(dt);
    desenhar(); emitir();
    const ms = performance.now() - t0; stats.quadros++; stats.ms += ms; if (ms > stats.max) stats.max = ms;
    if (mais && visivel && !document.hidden) handle = O.raf(tick);
    else emitir();
  }
  function acordar() {
    if (destruido) return;
    if (modoFoto()) { assentarFoto(); return; }
    if (handle || !visivel || document.hidden) { emitir(); return; }
    ultimo = O.agora(); handle = O.raf(tick); emitir();
  }
  function assentarFoto() { // pausa / reduzido / toque / fallback: foto íntegra, troca instantânea quando pronta
    if (handle) { O.caf(handle); handle = 0; }
    morph = null;
    if (pessoas.get(pedido)?.estado === 'pronto' || pessoas.get(pedido)?.estado === 'falha') ativo = pedido;
    if (ativo) { if (pessoas.get(ativo)?.pts) assentar(ativo); fixarFoto(); }
    r = rAlvo();
    desenhar(); emitir();
  }

  // ---------- entradas ----------
  const onEnter = (e) => { if (O.hover && e.pointerType !== 'touch') { hover = true; acordar(); } };
  const onLeave = (e) => { if (O.hover && e.pointerType !== 'touch') { hover = false; acordar(); } };
  raiz.addEventListener('pointerenter', onEnter);
  raiz.addEventListener('pointerleave', onLeave);
  const onVis = () => { if (document.hidden) { if (handle) { O.caf(handle); handle = 0; } } else acordar(); };
  document.addEventListener('visibilitychange', onVis);
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { visivel = es.some((e) => e.isIntersecting); if (!visivel && handle) { O.caf(handle); handle = 0; } else if (visivel) acordar(); }) : null;
  io?.observe(raiz);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { if (medir()) desenhar(); }) : null;
  ro?.observe(raiz);
  const onMq = () => acordar();
  mqRed.addEventListener?.('change', onMq); mqFino.addEventListener?.('change', onMq);

  function select(id) {
    if (!pessoas.has(id) || destruido) return Promise.resolve(false);
    pedido = id;
    const est = pessoas.get(id).estado;
    if (est === 'pronto' || est === 'falha') { acordar(); return Promise.resolve(true); } // já preparada: começa no mesmo quadro
    emitir();
    return preparar(id).then(() => { if (destruido || pedido !== id) return false; acordar(); return true; });
  }

  // início: mede, prepara a inicial e mostra pontos (ou foto) sem animação
  garantirPool(O.particulas || 16000);
  medir();
  const pronto = preparar(pedido).then(() => {
    if (destruido) return;
    ativo = pedido;
    if (pessoas.get(ativo).pts) assentar(ativo);
    fixarFoto();
    r = modoFoto() ? 0 : rAlvo();
    desenhar(); emitir();
  });

  return {
    VERSION,
    pronto,
    select,
    preload: (id) => preparar(id),
    setVisao(v) { if (!['auto', 'foto', 'pontos'].includes(v)) return; visao = v; acordar(); },
    setHover(v) { hover = !!v; acordar(); },
    setPaused(v) { paused = !!v; acordar(); if (!modoFoto()) { r = rAlvo(); desenhar(); emitir(); } },
    setReducedMotion(v) { redForcado = v == null ? null : !!v; acordar(); if (!modoFoto()) { r = rAlvo(); desenhar(); emitir(); } },
    setCor(c) { O.cor = c === 'mono' ? 'mono' : 'natural'; fixarFoto(); },
    get state() { return estado(); },
    _stats: () => ({ quadros: stats.quadros, jsMedioMs: stats.quadros ? +(stats.ms / stats.quadros).toFixed(2) : 0, jsMaxMs: +stats.max.toFixed(2) }),
    _zerarStats: () => { stats.quadros = 0; stats.ms = 0; stats.max = 0; },
    _pos: () => ({ x: px.slice(), y: py.slice(), a: al.slice() }), // só testes
    _debug: () => ({ P, n: Object.fromEntries([...pessoas].map(([k, p]) => [k, p.pts?.n ?? 0])), r, morph: morph && { para: morph.para, t: morph.t }, W, H, cv: [cv.width, cv.height] }),
    destroy() {
      destruido = true; if (handle) O.caf(handle); handle = 0;
      raiz.removeEventListener('pointerenter', onEnter); raiz.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis); io?.disconnect(); ro?.disconnect();
      mqRed.removeEventListener?.('change', onMq); mqFino.removeEventListener?.('change', onMq);
      foto.remove(); cv.remove(); aviso.remove(); if (legado) legado.hidden = false;
      delete raiz.dataset.fase; delete raiz.dataset.falha;
    },
  };
}
