/* ARARAT — paisagem topográfica da Ciência ligada à revisão humana. Motion, 0.1.0-draft (rascunho).
 *
 * Metáfora visual, não demonstração: nenhum score, máscara, indicador ou dado. O terreno nunca se move;
 * só um trecho luminoso dourado percorre as curvas existentes, guiado pelo progresso da rolagem.
 *
 * Enriquece o SVG estático do Site (TopoLandscape). Sem JS, com pausa ou com movimento reduzido, o SVG
 * continua sendo a composição completa: 26 curvas navy + a curva dourada inteira.
 *
 *   const t = createTopoRevisao(svg, { frase, alvo, inicio, fim, paused, reducedMotion, onEstado })
 *   t.setPaused(bool) · t.setReducedMotion(bool|null) · t.setProgresso(p)  (só com progresso: 'externo')
 *   t.atualizar()  (remedir após mudança de layout) · t.state · t.destroy()
 *   Evento 'topo:estado' no svg quando etapa ou modo mudam: { modo, etapa, nome, progresso }.
 *
 * Etapas (progresso 0–1, ver ETAPAS): 1 "O modelo sugere" — um trecho numa região limitada;
 * 2 "O radiologista revisa" — trechos em curvas vizinhas, a leitura se amplia; 3 "O médico contextualiza" —
 * dois trechos desenham a curva dourada até as bordas e outros se distribuem pela composição;
 * 4 "A decisão permanece humana" — um último trecho desacelera até o cume e some; fica a composição estática.
 */
export const VERSION = '0.1.0-draft';
export const ETAPAS = [
  { etapa: 1, nome: 'sugere', de: 0, ate: 0.25 },
  { etapa: 2, nome: 'revisa', de: 0.25, ate: 0.5 },
  { etapa: 3, nome: 'contextualiza', de: 0.5, ate: 0.75 },
  { etapa: 4, nome: 'decisao', de: 0.75, ate: 1 },
];
const NS = 'http://www.w3.org/2000/svg';
const VW = 1440, VH = 300;
const OURO = 13; // a curva dourada do TopoLandscape (lines[13])

/* Coreografia. Cada trecho: curva (índice em ridgeLines), quadros-chave [p, x (unidades do viewBox), comprimento, alfa].
 * As fases 1–2 ficam na faixa central (x 640–1100), visível também no celular (o SVG usa "slice"). */
export const COREOGRAFIA = {
  trechos: [
    // 1 · sugere: um único trecho na curva dourada, perto do cume principal; vira o cometa da direita na fase 3
    { id: 'sugere', linha: OURO, chaves: [[0, 840, 46, 0], [0.06, 856, 56, 1], [0.25, 925, 66, 1], [0.5, 1000, 72, 1], [0.78, 1480, 72, 1], [0.8, 1500, 72, 0]] },
    // 3 · cometa da esquerda: nasce onde o primeiro está e desenha a curva até a borda
    { id: 'conecta', linha: OURO, chaves: [[0.48, 1000, 20, 0], [0.53, 980, 62, 1], [0.78, -40, 72, 1], [0.8, -60, 72, 0]] },
    // 2 · revisa: curvas vizinhas, abrindo para os lados
    { id: 'viz-11', linha: 11, chaves: [[0.25, 930, 30, 0], [0.3, 900, 55, 1], [0.5, 700, 60, 1], [0.66, 470, 55, 0.7], [0.74, 380, 50, 0]] },
    { id: 'viz-15', linha: 15, chaves: [[0.27, 960, 30, 0], [0.33, 985, 55, 1], [0.5, 1080, 60, 1], [0.66, 1230, 55, 0.7], [0.74, 1290, 50, 0]] },
    { id: 'viz-9', linha: 9, chaves: [[0.34, 880, 30, 0], [0.4, 860, 50, 1], [0.5, 780, 55, 1], [0.7, 520, 50, 0.6], [0.78, 430, 45, 0]] },
    { id: 'viz-17', linha: 17, chaves: [[0.37, 990, 30, 0], [0.43, 960, 50, 1], [0.5, 920, 55, 1], [0.7, 700, 50, 0.6], [0.78, 620, 45, 0]] },
    // 3 · contextualiza: a leitura se distribui pela composição (frente e fundo)
    { id: 'dist-6', linha: 6, chaves: [[0.5, 660, 30, 0], [0.56, 640, 50, 0.9], [0.72, 470, 50, 0.8], [0.8, 420, 45, 0]] },
    { id: 'dist-20', linha: 20, chaves: [[0.52, 760, 30, 0], [0.58, 790, 50, 0.9], [0.72, 960, 50, 0.8], [0.8, 1010, 45, 0]] },
    { id: 'dist-4', linha: 4, chaves: [[0.55, 1100, 30, 0], [0.61, 1120, 45, 0.8], [0.74, 1300, 45, 0.6], [0.8, 1360, 40, 0]] },
    { id: 'dist-22', linha: 22, chaves: [[0.56, 560, 30, 0], [0.62, 540, 45, 0.8], [0.74, 330, 45, 0.6], [0.8, 260, 40, 0]] },
    // 4 · decisão: último trecho desacelera até o cume e se apaga sobre a curva completa
    { id: 'assenta', linha: OURO, chaves: [[0.745, 790, 30, 0], [0.79, 840, 60, 0.9], [0.88, 890, 52, 0.75], [0.96, 920, 44, 0.45], [1, 930, 40, 0]] },
  ],
  desenho: { de: 0.5, ate: 0.78, esquerda: 'conecta', direita: 'sugere' }, // curva dourada: entre os dois cometas
  camadas: [ // traço luminoso afinado nas pontas: halo largo e fraco, meio, núcleo (larguras em px de tela)
    { largura: 10, alfa: 0.13, fator: 1.5, cor: '#D4AF37' },
    { largura: 4.5, alfa: 0.36, fator: 1.12, cor: '#D4AF37' },
    { largura: 2.2, alfa: 1, fator: 0.72, cor: '#D9B23A' },
  ],
};

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sstep = (t) => t * t * (3 - 2 * t);

// Hermite monotônico (Fritsch–Carlson): x(p) suave, sem parar em cada quadro-chave e sem ultrapassar
function curvaMonotona(ps, xs) {
  const n = ps.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (xs[i + 1] - xs[i]) / (ps[i + 1] - ps[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (p) => {
    if (p <= ps[0]) return xs[0];
    if (p >= ps[n - 1]) return xs[n - 1];
    let i = 0; while (p > ps[i + 1]) i++;
    const h = ps[i + 1] - ps[i], t = (p - ps[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * xs[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * xs[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
function linearSuave(ps, vs) { // entre quadros-chave, transição suave (alfa e comprimento)
  return (p) => {
    if (p <= ps[0]) return vs[0];
    const n = ps.length; if (p >= ps[n - 1]) return vs[n - 1];
    let i = 0; while (p > ps[i + 1]) i++;
    return vs[i] + (vs[i + 1] - vs[i]) * sstep((p - ps[i]) / (ps[i + 1] - ps[i]));
  };
}
export function avaliar(p, coreo = COREOGRAFIA) { // função pura: o que aparece no progresso p (usada também nos testes)
  if (!coreo._f) coreo._f = coreo.trechos.map((t) => { const ps = t.chaves.map((k) => k[0]); return { x: curvaMonotona(ps, t.chaves.map((k) => k[1])), len: linearSuave(ps, t.chaves.map((k) => k[2])), a: linearSuave(ps, t.chaves.map((k) => k[3])) }; });
  const trechos = coreo.trechos.map((t, i) => { const f = coreo._f[i]; return { id: t.id, linha: t.linha, x: f.x(p), len: f.len(p), a: clamp01(f.a(p)) }; });
  const ds = coreo.desenho; let desenho = null;
  if (p >= ds.de) {
    const e = trechos.find((t) => t.id === ds.esquerda), d = trechos.find((t) => t.id === ds.direita);
    desenho = p >= ds.ate ? { x0: 0, x1: VW, completo: true } : { x0: Math.max(0, Math.min(e.x, 1000)), x1: Math.min(VW, Math.max(d.x, 1000)), completo: false };
  }
  return { trechos, desenho };
}
export function etapaDe(p) { if (p <= 0) return ETAPAS[0].etapa - 1; for (const e of ETAPAS) if (p < e.ate) return e.etapa; return 4; }

export function createTopoRevisao(svg, opts = {}) {
  const O = {
    frase: null,          // elemento com as quatro frases: recebe data-topo-etapa (0–4) e data-topo-modo
    alvo: null,           // elemento medido para o progresso (padrão: o próprio svg)
    inicio: 0.95,         // p = 0 quando o centro do alvo está nesta fração da altura da janela
    fim: 0.5,             // p = 1 quando o centro do alvo está nesta fração da altura da janela
    suavizar: 140,        // ms: acompanha a rolagem com uma suavização curta (rodas com passos grandes)
    progresso: 'rolagem', // 'rolagem' | 'externo' (o Site chama setProgresso)
    paused: false,
    reducedMotion: 'auto',
    onEstado: null,
    raf: (f) => requestAnimationFrame(f), caf: (h) => cancelAnimationFrame(h), agora: () => performance.now(),
    ...opts,
  };
  const alvo = O.alvo || svg;
  const todos = [...svg.querySelectorAll('path')];
  const linhas = svg.querySelectorAll('[data-topo-linha]').length ? [...svg.querySelectorAll('[data-topo-linha]')] : todos.slice(0, -1);
  const ouro = svg.querySelector('[data-topo-ouro]') || todos[todos.length - 1];
  const mqRed = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = !!O.paused, redForcado = O.reducedMotion === 'auto' ? null : !!O.reducedMotion;
  const stats = { n: 0, ms: 0, max: 0 };
  let alvoP = 0, atual = -1, handle = 0, ultimo = 0, visivel = false, destruido = false, assinatura = '', escala = 1, ouvindo = false;

  // camada dos trechos (acima das curvas e da curva dourada)
  const g = document.createElementNS(NS, 'g'); g.setAttribute('data-topo-trechos', ''); g.setAttribute('aria-hidden', 'true');
  const amostras = new Map(); // linha → { xs: x por fração de comprimento } para posicionar por x
  function amostrar(i) {
    if (amostras.has(i)) return amostras.get(i);
    const p = linhas[i] || ouro, L = p.getTotalLength(), N = 360, xs = new Float32Array(N + 1);
    for (let k = 0; k <= N; k++) xs[k] = p.getPointAtLength((k / N) * L).x;
    const r = { xs, N }; amostras.set(i, r); return r;
  }
  const fracaoEm = (i, x) => { const { xs, N } = amostrar(i); if (x <= xs[0]) return 0; if (x >= xs[N]) return 1; let lo = 0, hi = N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] < x) lo = m; else hi = m; } return (lo + (x - xs[lo]) / (xs[hi] - xs[lo] || 1)) / N; };
  const compr = (i, unidades) => { const { xs, N } = amostrar(i); return unidades / (xs[N] - xs[0]); }; // fração aproximada (curvas quase horizontais)
  const els = COREOGRAFIA.trechos.map((t) => COREOGRAFIA.camadas.map((c) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', (linhas[t.linha] || ouro).getAttribute('d'));
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', c.cor); p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('pathLength', '1000'); p.setAttribute('stroke-dasharray', '0 3000'); p.setAttribute('stroke-dashoffset', '0'); p.setAttribute('stroke-width', '0'); p.style.opacity = '0';
    g.append(p); return p;
  }));
  svg.append(g);
  const ouroOrig = { dash: ouro.getAttribute('stroke-dasharray'), off: ouro.getAttribute('stroke-dashoffset'), pl: ouro.getAttribute('pathLength') };

  const reduzido = () => (redForcado != null ? redForcado : mqRed.matches);
  const estatico = () => paused || reduzido();
  const set = (el, k, v) => { if (el.getAttribute(k) !== v) el.setAttribute(k, v); };
  const op = (el, v) => { if (el.style.opacity !== v) el.style.opacity = v; if (!v && el.getAttribute('style') === '') el.removeAttribute('style'); };
  const ocultar = (el) => { op(el, '0'); set(el, 'stroke-dasharray', '0 3000'); set(el, 'stroke-dashoffset', '0'); set(el, 'stroke-width', '0'); }; // estado oculto canônico (mesmo DOM venha de onde vier)

  function medirEscala() { const r = svg.getBoundingClientRect(); escala = Math.max(r.width / VW, r.height / VH) || 1; }
  function progressoDaRolagem() {
    const r = alvo.getBoundingClientRect(), vh = innerHeight || 1;
    const y0 = vh * O.inicio - r.height / 2, y1 = vh * O.fim - r.height / 2; // topo do alvo em p = 0 e em p = 1
    return clamp01((y0 - r.top) / (y0 - y1 || 1));
  }

  function composicaoEstatica() { // = o SVG original do Site
    for (const cam of els) for (const el of cam) ocultar(el);
    if (ouroOrig.dash == null) ouro.removeAttribute('stroke-dasharray'); else set(ouro, 'stroke-dasharray', ouroOrig.dash);
    if (ouroOrig.off == null) ouro.removeAttribute('stroke-dashoffset'); else set(ouro, 'stroke-dashoffset', ouroOrig.off);
    if (ouroOrig.pl == null) ouro.removeAttribute('pathLength'); else set(ouro, 'pathLength', ouroOrig.pl);
    op(ouro, '');
  }
  function desenhar(p) {
    const { trechos, desenho } = avaliar(p);
    trechos.forEach((t, i) => {
      const cam = els[i];
      if (t.a < 0.01 || t.len <= 0) { for (const el of cam) ocultar(el); return; }
      const s = fracaoEm(t.linha, t.x) * 1000;
      COREOGRAFIA.camadas.forEach((c, j) => {
        const el = cam[j], len = compr(t.linha, t.len * c.fator) * 1000;
        set(el, 'stroke-dasharray', `${len.toFixed(2)} 3000`);
        set(el, 'stroke-dashoffset', (-(s - len / 2)).toFixed(2));
        set(el, 'stroke-width', (c.largura / escala).toFixed(2));
        op(el, String(+(c.alfa * t.a).toFixed(3)));
      });
    });
    if (!desenho) { op(ouro, '0'); set(ouro, 'pathLength', '1000'); set(ouro, 'stroke-dasharray', '0 3000'); set(ouro, 'stroke-dashoffset', '0'); return; }
    op(ouro, '');
    if (desenho.completo) { composicaoOuroCompleta(); return; }
    const a = fracaoEm(OURO, desenho.x0) * 1000, b = fracaoEm(OURO, desenho.x1) * 1000;
    set(ouro, 'pathLength', '1000');
    set(ouro, 'stroke-dasharray', `${Math.max(0, b - a).toFixed(2)} 3000`);
    set(ouro, 'stroke-dashoffset', (-a).toFixed(2));
  }
  function composicaoOuroCompleta() {
    if (ouroOrig.dash == null) ouro.removeAttribute('stroke-dasharray'); else set(ouro, 'stroke-dasharray', ouroOrig.dash);
    if (ouroOrig.off == null) ouro.removeAttribute('stroke-dashoffset'); else set(ouro, 'stroke-dashoffset', ouroOrig.off);
    if (ouroOrig.pl == null) ouro.removeAttribute('pathLength'); else set(ouro, 'pathLength', ouroOrig.pl);
  }

  function emitir(p) {
    const modo = estatico() ? 'estatico' : 'animado';
    const etapa = modo === 'estatico' ? 4 : etapaDe(p);
    const ass = modo + etapa;
    if (O.frase) { if (O.frase.dataset.topoEtapa !== String(etapa)) O.frase.dataset.topoEtapa = String(etapa); if (O.frase.dataset.topoModo !== modo) O.frase.dataset.topoModo = modo; }
    if (ass === assinatura) return;
    assinatura = ass;
    const det = { modo, etapa, nome: etapa ? ETAPAS[etapa - 1].nome : 'antes', progresso: +p.toFixed(3) };
    svg.dispatchEvent(new CustomEvent('topo:estado', { detail: det }));
    O.onEstado?.(det);
  }
  function aplicar(p) {
    if (estatico()) { composicaoEstatica(); atual = -1; emitir(1); return; }
    if (p === atual) return;
    atual = p; const t0 = performance.now(); desenhar(p); const ms = performance.now() - t0; stats.n++; stats.ms += ms; if (ms > stats.max) stats.max = ms; emitir(p);
  }
  function tick(now) {
    handle = 0;
    if (destruido || estatico()) return;
    if (O.progresso === 'rolagem') alvoP = progressoDaRolagem();
    const dt = Math.min(64, Math.max(0, now - ultimo)); ultimo = now;
    let p = atual < 0 ? alvoP : atual + (alvoP - atual) * (1 - Math.exp(-dt / O.suavizar));
    if (Math.abs(alvoP - p) < 0.0006) p = alvoP;
    aplicar(p);
    if (p !== alvoP && visivel && !document.hidden) handle = O.raf(tick);
  }
  function acordar() {
    if (destruido) return;
    if (estatico()) { if (handle) { O.caf(handle); handle = 0; } aplicar(1); return; }
    if (handle || !visivel || document.hidden) return;
    ultimo = O.agora(); handle = O.raf(tick);
  }
  const onScroll = () => acordar();
  const onResize = () => { medirEscala(); amostras.clear(); atual = -1; acordar(); };
  function ouvir(sim) {
    if (sim === ouvindo || O.progresso !== 'rolagem') return;
    ouvindo = sim;
    if (sim) { addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onResize); }
    else { removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); }
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    visivel = es.some((e) => e.isIntersecting);
    if (visivel) { ouvir(true); if (O.progresso === 'rolagem') { alvoP = progressoDaRolagem(); atual = -1; } acordar(); }
    else { ouvir(false); if (handle) { O.caf(handle); handle = 0; } if (!estatico() && O.progresso === 'rolagem') aplicar(progressoDaRolagem()); }
  }, { rootMargin: '15% 0px 15% 0px' }) : null;
  if (io) io.observe(alvo); else { visivel = true; ouvir(true); }
  const onVis = () => { if (!document.hidden) acordar(); };
  document.addEventListener('visibilitychange', onVis);
  const onMq = () => acordar(); mqRed.addEventListener?.('change', onMq);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { medirEscala(); atual = -1; if (!handle) acordar(); }) : null;
  ro?.observe(svg);

  medirEscala();
  if (O.progresso === 'rolagem') alvoP = progressoDaRolagem();
  aplicar(estatico() ? 1 : alvoP);

  return {
    VERSION,
    setPaused(v) { paused = !!v; atual = -1; acordar(); if (!estatico()) { alvoP = O.progresso === 'rolagem' ? progressoDaRolagem() : alvoP; aplicar(alvoP); } },
    setReducedMotion(v) { redForcado = v == null ? null : !!v; atual = -1; acordar(); if (!estatico()) aplicar(alvoP); },
    setProgresso(p) { if (O.progresso !== 'externo') return; alvoP = clamp01(+p || 0); acordar(); },
    atualizar() { medirEscala(); amostras.clear(); atual = -1; if (O.progresso === 'rolagem') alvoP = progressoDaRolagem(); aplicar(estatico() ? 1 : alvoP); },
    _stats: () => ({ atualizacoes: stats.n, msMedio: stats.n ? +(stats.ms / stats.n).toFixed(3) : 0, msMax: +stats.max.toFixed(3) }),
    _zerarStats: () => { stats.n = 0; stats.ms = 0; stats.max = 0; },
    get state() { const modo = estatico() ? 'estatico' : 'animado'; const p = modo === 'estatico' ? 1 : Math.max(0, atual); const etapa = modo === 'estatico' ? 4 : etapaDe(p); return { modo, etapa, nome: etapa ? ETAPAS[etapa - 1].nome : 'antes', progresso: +p.toFixed(4), alvo: +alvoP.toFixed(4), animando: !!handle }; },
    destroy() {
      destruido = true; if (handle) O.caf(handle); handle = 0;
      io?.disconnect(); ro?.disconnect(); ouvir(false); document.removeEventListener('visibilitychange', onVis); mqRed.removeEventListener?.('change', onMq);
      g.remove(); composicaoEstatica();
      if (O.frase) { delete O.frase.dataset.topoEtapa; delete O.frase.dataset.topoModo; }
    },
  };
}
