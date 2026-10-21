/* ARARAT — retrato do Time: foto natural em repouso; pontilhado SÓ durante a troca de integrante.
 * 0.5.0-03d2 — brand system monocromático ARARAT 03D2 v1.0 (experimental). Base 0.2.0-draft. Muda SÓ: pontos padrão
 * #303030 (gray/800; numa seção escura o Site passa pontos: { cor: '#C6C6C6' }), enquadramento final alinhado à grade
 * de pixel do aparelho (alinhar(): normal = reduzido) e a opção `fundo` (cor do quadro pintada pelo módulo, no mesmo
 * alinhamento; padrão nenhuma). Foto em cor natural por padrão; cor: 'mono' continua disponível. Arquivos de foto
 * intactos. Tempos, fases, seleção (vale o último clique), repouso sem pontos e contrato iguais. Sem aprovação estética.
 *
 * Contrato (resumo — ver README):
 *   const r = createStipplePortrait(raiz, { pessoas: [{ id, recorte, foto, alt }], inicial, interativo, reducedMotion, paused, onEstado })
 *   r.select(id)   → Promise<boolean>  troca; a nova pessoa só assume depois de decodificada e com os pontos calculados;
 *                                       vale o último pedido (sem fila); pedir quem já está pedido não faz nada
 *   r.preload(id)  → Promise            prepara sem trocar (ex.: hover/foco na linha da lista)
 *   r.setPaused(bool) / r.setReducedMotion(bool|null)   → troca direta entre fotos; no meio da troca, assenta na hora
 *   r.state        { fase, ativo, pedido, modo, animando, revelado, visao }
 *   r.destroy()
 *   Eventos: CustomEvent('retrato:estado') na raiz e opts.onEstado, sempre que fase, ativo ou pedido mudam.
 *   Mantidos só por compatibilidade com a integração 0.1.0 (sem efeito): opção visao, setVisao(), setHover();
 *   setCor('mono') continua funcionando, mas a direção é foto em cor natural.
 *
 * Sequência da troca (~1 s, contínua, sem pausa no pontilhado):
 *   desfazendo    a foto atual se desfaz em pontos da MESMA pessoa (foto some 300 ms; pontos entram 240 ms)
 *   transformando os pontos saem da pessoa A, passam por uma nuvem dispersa (deslocamento horizontal por faixas) e
 *                 formam a pessoa B (640 ms; começa quando a foto de A já está pela metade)
 *   recompondo    os pontos de B se recompõem na foto natural de B (foto entra 300 ms, pontos saem 300 ms;
 *                 começa a 78 % do movimento)
 *   foto          parada: foto íntegra, canvas oculto e limpo, nenhum redesenho
 * Duas fotografias nunca aparecem juntas (a de A acaba antes de a de B começar) e nenhum quadro desenha uma face
 * mista: no meio do caminho os pontos estão dispersos.
 */
export const VERSION = '0.5.0-03d2';
export const TEMPOS = { fotoSai: 300, pontosEntram: 240, transformar: 640, retarget: 560, fotoEntra: 300, pontosSaem: 300, iniciarTransformacaoCom: 0.55, recomporA: 0.78 };

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
    interativo: 'auto', reducedMotion: 'auto', paused: false, cor: 'natural',
    aspecto: 4 / 5, onEstado: null, fundo: null,
    agora: () => performance.now(), raf: (f) => requestAnimationFrame(f), caf: (h) => cancelAnimationFrame(h), ...opts,
  };
  O.pontos = { cor: '#303030', celula: 2.4, lado: 1.35, ...(opts.pontos || {}) };
  const pessoas = new Map((O.pessoas || []).map((p) => [p.id, { ...p, estado: 'novo', prom: null, img: null, pts: null, fallback: false }]));
  if (!pessoas.size) throw new Error('createStipplePortrait: pessoas vazio');
  const mqRed = matchMedia('(prefers-reduced-motion: reduce)');
  const mqFino = matchMedia('(hover: hover) and (pointer: fine)');
  let destruido = false, handle = 0, ultimo = 0, visivel = true;
  let paused = !!O.paused, redForcado = O.reducedMotion === 'auto' ? null : !!O.reducedMotion;
  let ativo = null, pedido = O.inicial && pessoas.has(O.inicial) ? O.inicial : [...pessoas.keys()][0];
  let op = 0;        // opacidade da foto em cena (pessoa fotoId)
  let fotoId = null; // de quem é a foto no <img>
  let d = 0;         // fração dos pontos visíveis (0 = nenhum, 1 = todos)
  let morph = null;  // { para, t, D }
  let etapa = 'carregando';
  let assinatura = '';
  const stats = { quadros: 0, ms: 0, max: 0 }; // custo de JS (passo + desenho) por quadro animado

  // DOM próprio do módulo
  if (getComputedStyle(raiz).position === 'static') raiz.style.position = 'relative';
  const foto = document.createElement('img');
  foto.className = 'rp-foto'; foto.decoding = 'async'; foto.draggable = false;
  foto.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;pointer-events:none;user-select:none';
  const cv = document.createElement('canvas');
  cv.className = 'rp-pontos'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;visibility:hidden';
  const aviso = document.createElement('div');
  aviso.className = 'rp-falha'; aviso.hidden = true; aviso.setAttribute('role', 'img');
  // 0.5.0-03d2: fundo opcional do quadro, pintado pelo módulo no mesmo alinhamento de pixel da foto (ver alinhar()).
  const fundo = O.fundo ? document.createElement('div') : null;
  if (fundo) { fundo.className = 'rp-fundo'; fundo.setAttribute('aria-hidden', 'true'); fundo.style.cssText = 'position:absolute;left:0;right:0;top:0;height:100%;pointer-events:none;background:' + O.fundo; }
  raiz.append(...(fundo ? [fundo] : []), foto, cv, aviso);
  const legado = raiz.querySelector('[data-retrato-fallback]'); // <img> do Site para sem JS: some quando o módulo assume
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, canvasLimpo = true;

  // partículas: pool fixo (as pessoas usam até POOL pontos; as sobras ficam invisíveis)
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
  const modoFoto = () => paused || reduzido() || !interativoOk();
  const usavel = (id) => { const e = pessoas.get(id)?.estado; return e === 'pronto' || e === 'falha'; };
  const temPontos = (id) => !!pessoas.get(id)?.pts;

  function emitir() {
    const fase = !ativo ? 'carregando' : modoFoto() ? (pessoas.get(ativo).estado === 'falha' ? 'falha' : 'foto-estatica') : etapa;
    const ass = fase + '|' + ativo + '|' + pedido;
    if (ass === assinatura) return;
    assinatura = ass;
    raiz.dataset.fase = fase;
    const det = estado(fase);
    raiz.dispatchEvent(new CustomEvent('retrato:estado', { detail: det }));
    O.onEstado?.(det);
  }
  const estado = (fase = raiz.dataset.fase || 'carregando') => ({ fase, ativo, pedido, modo: modoFoto() ? 'foto' : 'interativo', revelado: +op.toFixed(3), animando: !!handle, visao: 'foto' });

  // ---------- carregamento ----------
  function carregarImg(src) { return new Promise((ok, erro) => { const im = new Image(); im.decoding = 'async'; im.onload = () => (im.decode ? im.decode().then(() => ok(im), () => ok(im)) : ok(im)); im.onerror = () => erro(new Error('falha: ' + src)); im.src = src; }); }
  function preparar(id) {
    const p = pessoas.get(id);
    if (!p) return Promise.reject(new Error('pessoa desconhecida: ' + id));
    if (p.prom) return p.prom;
    p.estado = 'carregando';
    p.prom = carregarImg(p.recorte)
      .then((im) => {
        p.img = im; p.src = p.recorte;
        try { p.pts = limitar(stipple(im, { ...(O.pontos.tom || {}), colunas: colunasAtual(), aspecto: O.aspecto, semente: hashStr(id) })); }
        catch { p.pts = null; } // canvas contaminado (ex.: file://): foto sem pontos
        p.estado = 'pronto';
      })
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
  // 0.5.0-03d2 — quadro final independente da fração de pixel (enquadramento normal × reduzido): a foto (e o fundo
  // opcional) começa sempre na 1ª linha INTEIRA de pixel do aparelho abaixo do topo do quadro e termina uma linha
  // antes da base. Duas cargas com frações de y diferentes rasterizam a foto nas mesmas linhas relativas ao quadro, e
  // a borda do quadro nunca corta a foto pela metade de um pixel. Chamado antes de cada troca de foto e no resize.
  function alinhar() {
    const rc = raiz.getBoundingClientRect(), k = window.devicePixelRatio || 1;
    const q = rc.top * k, off = (Math.floor(q + 1e-4) + 1 - q) / k;
    const t = `${+off.toFixed(4)}px`, h = `calc(100% - ${+(1 / k).toFixed(4)}px)`;
    for (const el of fundo ? [foto, fundo] : [foto]) {
      if (el.style.top !== t) el.style.top = t;
      if (el.style.height !== h) { el.style.height = h; el.style.bottom = 'auto'; }
    }
  }
  function medir() {
    const rc = raiz.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(rc.width * dpr), h = Math.round(rc.height * dpr);
    W = rc.width; H = rc.height;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; canvasLimpo = true; return true; }
    return false;
  }
  function aplicarFoto() {
    const v = op >= 1 ? '' : String(+sstep(clamp01(op)).toFixed(4)); // '' = opacidade 1 do CSS do módulo removida → foto íntegra
    if (v === '') { if (foto.style.opacity !== '1') foto.style.opacity = '1'; }
    else if (foto.style.opacity !== v) foto.style.opacity = v;
  }
  function desenhar() {
    aplicarFoto();
    const mostrar = !modoFoto() && d > 0.001 && P > 0;
    if (!mostrar) { // repouso: canvas oculto e limpo (sem camada residual)
      if (cv.style.visibility !== 'hidden') cv.style.visibility = 'hidden';
      if (!canvasLimpo) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); canvasLimpo = true; }
      return;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    canvasLimpo = false;
    if (cv.style.visibility !== 'visible') cv.style.visibility = 'visible';
    const w = cv.width, h = cv.height, lado = O.pontos.lado * dpr, m = lado / 2;
    ctx.fillStyle = O.pontos.cor;
    const lim = d * 1.08; // pontos aparecem/somem em ordem aleatória fixa (chave), borda suave de 0,08
    const baldes = [[], [], [], []];
    for (let i = 0; i < P; i++) {
      let a = al[i];
      if (a <= 0.01) continue;
      if (d < 1) { a *= clamp01((lim - chave[i]) / 0.08); if (a <= 0.01) continue; }
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

  // ---------- transformação (pontos de A → nuvem → pontos de B) ----------
  function iniciarMorph(para, D) {
    const rnd = prng(hashStr(para) ^ (P * 2654435761));
    const faixas = 48, desloc = new Float32Array(faixas);
    for (let b = 0; b < faixas; b++) desloc[b] = (rnd() * 2 - 1) * (0.05 + 0.12 * rnd());
    const temDe = morph || (ativo && temPontos(ativo));
    for (let i = 0; i < P; i++) {
      const t = alvoDe(para, i);
      sx[i] = px[i]; sy[i] = py[i]; a0[i] = temDe ? al[i] : 0;
      let exi = t ? t[0] : px[i] + (rnd() * 2 - 1) * 0.25, eyi = t ? t[1] : py[i] + (rnd() * 2 - 1) * 0.06; // sem pontos no destino: dispersa e some
      ex[i] = exi; ey[i] = eyi; a1[i] = t ? t[2] : 0;
      if (!temDe) { sx[i] = exi + (rnd() * 2 - 1) * 0.2; sy[i] = eyi + (rnd() * 2 - 1) * 0.05; }
      const b = Math.min(faixas - 1, Math.max(0, (((sy[i] + eyi) / 2) * faixas) | 0));
      const mx = (sx[i] + exi) / 2 + desloc[b] + (rnd() * 2 - 1) * 0.035, my = (sy[i] + eyi) / 2 + (rnd() * 2 - 1) * 0.03;
      cx[i] = 2 * mx - (sx[i] + exi) / 2; cy[i] = 2 * my - (sy[i] + eyi) / 2; // Bézier quadrática que passa por M em u = 0,5
      atraso[i] = rnd() * 0.14;
    }
    morph = { para, t: 0, D };
  }
  function passoMorph(dt) {
    morph.t += dt;
    const T = morph.t / morph.D;
    for (let i = 0; i < P; i++) {
      if (a0[i] === 0 && a1[i] === 0) continue;
      const u = easeIO(clamp01((T - atraso[i]) / 0.86)), v = 1 - u;
      px[i] = v * v * sx[i] + 2 * u * v * cx[i] + u * u * ex[i];
      py[i] = v * v * sy[i] + 2 * u * v * cy[i] + u * u * ey[i];
      al[i] = a0[i] === a1[i] ? a1[i] : a0[i] + (a1[i] - a0[i]) * sstep(clamp01((u - 0.3) / 0.4));
    }
    if (T >= 1) { const para = morph.para; morph = null; ativo = para; if (temPontos(para)) assentar(para); }
    return T;
  }
  function trocarFotoPara(id) { // só com a foto anterior totalmente fora (op = 0): nunca duas fotos juntas
    const p = pessoas.get(id);
    fotoId = id;
    aviso.hidden = p.estado !== 'falha';
    if (p.estado === 'falha') { foto.removeAttribute('src'); foto.alt = ''; foto.hidden = true; aviso.textContent = p.alt ? `${p.alt} — foto indisponível` : 'Foto indisponível'; aviso.setAttribute('aria-label', aviso.textContent); raiz.dataset.falha = ''; return; }
    delete raiz.dataset.falha; foto.hidden = false;
    alinhar();
    if (foto.getAttribute('src') !== p.src) foto.src = p.src; // já decodificada em preparar()
    foto.alt = p.alt || '';
    foto.style.filter = O.cor === 'mono' ? 'grayscale(1) contrast(1.04)' : '';
    if (legado) legado.hidden = true;
  }

  // ---------- laço (só enquanto há movimento) ----------
  function passo(dt) {
    if (modoFoto() || !ativo) return false; // sem retrato inicial ainda: nada a animar
    const dest = usavel(pedido) ? pedido : morph ? morph.para : ativo; // até a nova estar pronta, segue para onde já ia
    const sobe = (x, ms) => Math.min(1, x + dt / ms), desce = (x, ms) => Math.max(0, x - dt / ms);
    if (morph) {
      if (dest !== morph.para) iniciarMorph(dest, TEMPOS.retarget); // último pedido prevalece, a partir de onde os pontos estão
      const T = passoMorph(dt);
      const recompor = morph ? morph.para === dest && T >= TEMPOS.recomporA : ativo === dest;
      if (recompor && (fotoId === dest || op <= 0)) {
        if (fotoId !== dest) trocarFotoPara(dest);
        op = pessoas.get(dest).estado === 'falha' ? 0 : sobe(op, TEMPOS.fotoEntra); d = desce(d, TEMPOS.pontosSaem); etapa = 'recompondo';
      } else { op = desce(op, TEMPOS.fotoSai); d = sobe(d, TEMPOS.pontosEntram); etapa = 'transformando'; }
      return true;
    }
    if (dest !== ativo) { // a foto atual se desfaz em pontos da mesma pessoa; a transformação começa no meio disso
      etapa = 'desfazendo';
      if (fotoId !== ativo && op > 0) { op = desce(op, TEMPOS.fotoSai); return true; }
      op = desce(op, TEMPOS.fotoSai);
      d = temPontos(ativo) ? sobe(d, TEMPOS.pontosEntram) : d;
      if (op <= TEMPOS.iniciarTransformacaoCom) iniciarMorph(dest, TEMPOS.transformar);
      return true;
    }
    // dest === ativo: recompõe a foto natural e tira os pontos
    if (fotoId !== ativo) { if (op > 0) { op = desce(op, TEMPOS.fotoSai); etapa = 'desfazendo'; return true; } trocarFotoPara(ativo); }
    if (pessoas.get(ativo).estado === 'falha') { op = 0; d = desce(d, TEMPOS.pontosSaem); etapa = d > 0 ? 'recompondo' : 'falha'; return d > 0; }
    op = sobe(op, TEMPOS.fotoEntra); d = desce(d, TEMPOS.pontosSaem);
    const fim = op >= 1 && d <= 0;
    etapa = fim ? (pedido === ativo || usavel(pedido) ? 'foto' : 'carregando') : 'recompondo';
    return !fim;
  }
  function tick(now) {
    handle = 0;
    if (destruido) return;
    const dt = Math.min(50, Math.max(0, now - ultimo)); ultimo = now;
    const t0 = performance.now();
    const mais = passo(dt);
    desenhar();
    const ms = performance.now() - t0; stats.quadros++; stats.ms += ms; if (ms > stats.max) stats.max = ms;
    if (mais && visivel && !document.hidden) handle = O.raf(tick);
    emitir();
  }
  function acordar() {
    if (destruido) return;
    if (modoFoto()) { assentarFoto(); return; }
    if (handle || !visivel || document.hidden) { emitir(); return; }
    ultimo = O.agora(); handle = O.raf(tick); emitir();
  }
  function assentarFoto() { // pausa / reduzido / toque: foto natural íntegra do pedido (se pronta), sem animação
    if (handle) { O.caf(handle); handle = 0; }
    morph = null;
    if (usavel(pedido)) ativo = pedido;
    if (ativo) { if (temPontos(ativo)) assentar(ativo); trocarFotoPara(ativo); }
    op = 1; d = 0; etapa = ativo && pessoas.get(ativo).estado === 'falha' ? 'falha' : 'foto';
    desenhar(); emitir();
  }

  // ---------- entradas (sem hover: o cursor não altera o retrato) ----------
  const onVis = () => { if (document.hidden) { if (handle) { O.caf(handle); handle = 0; } } else acordar(); };
  document.addEventListener('visibilitychange', onVis);
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { visivel = es.some((e) => e.isIntersecting); if (!visivel && handle) { O.caf(handle); handle = 0; } else if (visivel) acordar(); }) : null;
  io?.observe(raiz);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { alinhar(); if (medir() && !handle) desenhar(); }) : null;
  ro?.observe(raiz);
  const onMq = () => acordar();
  mqRed.addEventListener?.('change', onMq); mqFino.addEventListener?.('change', onMq);

  function select(id) {
    if (!pessoas.has(id) || destruido) return Promise.resolve(false);
    if (id === pedido) return Promise.resolve(true); // integrante já selecionado: não repete a animação
    pedido = id;
    if (usavel(id)) { acordar(); return Promise.resolve(true); }
    if (!morph && etapa !== 'desfazendo' && etapa !== 'recompondo') etapa = 'carregando'; // a foto atual fica íntegra até a nova decodificar
    emitir();
    return preparar(id).then(() => { if (destruido || pedido !== id) return false; acordar(); return true; });
  }

  // início: foto natural íntegra da pessoa inicial, sem animação
  garantirPool(O.particulas || 16000);
  medir();
  const pronto = preparar(pedido).then(() => {
    if (destruido) return;
    ativo = pedido;
    if (temPontos(ativo)) assentar(ativo);
    trocarFotoPara(ativo);
    op = 1; d = 0; etapa = pessoas.get(ativo).estado === 'falha' ? 'falha' : 'foto';
    desenhar(); emitir();
  });

  return {
    VERSION,
    pronto,
    select,
    preload: (id) => preparar(id),
    setVisao() {}, // 0.1.0: sem efeito na 0.2.0 (não há modo de pontos permanente)
    setHover() {}, // 0.1.0: sem efeito na 0.2.0 (o cursor não altera o retrato)
    setPaused(v) { paused = !!v; acordar(); },
    setReducedMotion(v) { redForcado = v == null ? null : !!v; acordar(); },
    setCor(c) { O.cor = c === 'mono' ? 'mono' : 'natural'; if (fotoId) foto.style.filter = O.cor === 'mono' ? 'grayscale(1) contrast(1.04)' : ''; },
    get state() { return estado(); },
    _stats: () => ({ quadros: stats.quadros, jsMedioMs: stats.quadros ? +(stats.ms / stats.quadros).toFixed(2) : 0, jsMaxMs: +stats.max.toFixed(2) }),
    _zerarStats: () => { stats.quadros = 0; stats.ms = 0; stats.max = 0; },
    _pos: () => ({ x: px.slice(), y: py.slice(), a: al.slice() }), // só testes
    _debug: () => ({ P, n: Object.fromEntries([...pessoas].map(([k, p]) => [k, p.pts?.n ?? 0])), op, d, fotoId, etapa, morph: morph && { para: morph.para, t: morph.t }, W, H, cv: [cv.width, cv.height] }),
    destroy() {
      destruido = true; if (handle) O.caf(handle); handle = 0;
      document.removeEventListener('visibilitychange', onVis); io?.disconnect(); ro?.disconnect();
      mqRed.removeEventListener?.('change', onMq); mqFino.removeEventListener?.('change', onMq);
      foto.remove(); fundo?.remove(); cv.remove(); aviso.remove(); if (legado) legado.hidden = false;
      delete raiz.dataset.fase; delete raiz.dataset.falha;
    },
  };
}
