/* ARARAT — fechamento da Ciência: paisagem ligada à revisão humana. Motion, 0.2.0-draft (rascunho).
 *
 * Metáfora visual, não demonstração: nenhum score, máscara, indicador ou dado. O terreno nunca se move;
 * só trechos luminosos dourados percorrem as curvas que já existem, guiados pelo progresso da rolagem.
 *
 * 0.2.0: geometria própria do fechamento (montanha com cume dominante, secundário e sela; curvas de nível
 * que envolvem o relevo, com partes ocultas removidas — `geometria/fechamento-montanha.json`). A coreografia é
 * escrita por caminho (id) e por fração de comprimento, e vem embutida aqui para a geometria correspondente
 * (`data-topo-geometria` no <svg>). Se o SVG não for dessa geometria, o módulo não anima: fica a composição
 * estática completa (nunca um trecho fora do lugar).
 *
 *   const t = createTopoRevisao(svg, { frase, alvo, inicio, fim, paused, reducedMotion, progresso, onEstado })
 *   t.setPaused(bool) · t.setReducedMotion(bool|null) · t.setProgresso(p) (com progresso: 'externo')
 *   t.atualizar() · t.state · t.destroy()
 *   Evento 'topo:estado' no svg quando etapa ou modo mudam: { modo, etapa, nome, progresso }.
 *
 * Sem JS, com pausa ou com movimento reduzido, o SVG do Site é a composição completa (curvas + crista dourada
 * inteira) — e é também o estado final da animação (p = 1).
 */
export const VERSION = '0.2.0-draft';
export const ETAPAS = [
  { etapa: 1, nome: 'sugere', de: 0, ate: 0.25 },
  { etapa: 2, nome: 'revisa', de: 0.25, ate: 0.5 },
  { etapa: 3, nome: 'contextualiza', de: 0.5, ate: 0.75 },
  { etapa: 4, nome: 'decisao', de: 0.75, ate: 1 },
];
const NS = 'http://www.w3.org/2000/svg';

/* Coreografias por geometria (gerado por scripts/gerar-modulo.mjs a partir de geometria/coreografia.json). */
export const COREOGRAFIAS = /*COREOGRAFIAS*/{};

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sstep = (t) => t * t * (3 - 2 * t);

// Hermite monotônico (Fritsch–Carlson): s(p) suave, sem parar em cada quadro-chave e sem ultrapassar
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
function linearSuave(ps, vs) {
  return (p) => {
    if (p <= ps[0]) return vs[0];
    const n = ps.length; if (p >= ps[n - 1]) return vs[n - 1];
    let i = 0; while (p > ps[i + 1]) i++;
    return vs[i] + (vs[i + 1] - vs[i]) * sstep((p - ps[i]) / (ps[i + 1] - ps[i]));
  };
}
/** Função pura: o que aparece no progresso p para uma coreografia (usada também nos testes). */
export function avaliar(p, coreo) {
  if (!coreo._f) coreo._f = coreo.trechos.map((t) => { const ps = t.chaves.map((k) => k[0]); return { s: curvaMonotona(ps, t.chaves.map((k) => k[1])), len: linearSuave(ps, t.chaves.map((k) => k[2])), a: linearSuave(ps, t.chaves.map((k) => k[3])) }; });
  const trechos = coreo.trechos.map((t, i) => { const f = coreo._f[i]; return { id: t.id, linha: t.linha, s: clamp01(f.s(p)), len: Math.max(0, f.len(p)), a: clamp01(f.a(p)) }; });
  const ds = coreo.desenho; let desenho = null;
  if (p >= ds.de) {
    const e = trechos.find((t) => t.id === ds.esquerda), d = trechos.find((t) => t.id === ds.direita);
    desenho = p >= ds.ate ? { s0: 0, s1: 1, completo: true } : { s0: Math.min(e.s, ds.centro), s1: Math.max(d.s, ds.centro), completo: false };
  }
  return { trechos, desenho };
}
export function etapaDe(p) { if (p <= 0) return 0; for (const e of ETAPAS) if (p < e.ate) return e.etapa; return 4; }

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
    coreografia: null,    // opcional: outra coreografia (mesmo formato); padrão: a embutida para a geometria do svg
    onEstado: null,
    raf: (f) => requestAnimationFrame(f), caf: (h) => cancelAnimationFrame(h), agora: () => performance.now(),
    ...opts,
  };
  const alvo = O.alvo || svg;
  const coreo = O.coreografia || COREOGRAFIAS[svg.getAttribute('data-topo-geometria')] || null;
  const porId = new Map([...svg.querySelectorAll('[data-topo-id]')].map((el) => [el.getAttribute('data-topo-id'), el]));
  const ouro = coreo ? porId.get(coreo.desenho.linha) || svg.querySelector('[data-topo-ouro]') : svg.querySelector('[data-topo-ouro]');
  const geometriaOk = !!coreo && !!ouro && coreo.trechos.every((t) => porId.has(t.linha));
  const mqRed = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = !!O.paused, redForcado = O.reducedMotion === 'auto' ? null : !!O.reducedMotion;
  const stats = { n: 0, ms: 0, max: 0 };
  let alvoP = 0, atual = -1, handle = 0, ultimo = 0, visivel = false, destruido = false, assinatura = '', escala = 1, ouvindo = false;

  // camada dos trechos (acima das curvas e da crista)
  const g = document.createElementNS(NS, 'g'); g.setAttribute('data-topo-trechos', ''); g.setAttribute('aria-hidden', 'true');
  const els = geometriaOk ? coreo.trechos.map((t) => coreo.camadas.map((c) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', porId.get(t.linha).getAttribute('d'));
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', c.cor); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('pathLength', '1000'); p.setAttribute('stroke-dasharray', '0 3000'); p.setAttribute('stroke-dashoffset', '0'); p.setAttribute('stroke-width', '0'); p.style.opacity = '0';
    g.append(p); return p;
  })) : [];
  if (geometriaOk) (ouro.parentNode || svg).append(g);
  const ouroOrig = ouro ? { dash: ouro.getAttribute('stroke-dasharray'), off: ouro.getAttribute('stroke-dashoffset'), pl: ouro.getAttribute('pathLength') } : null;

  const reduzido = () => (redForcado != null ? redForcado : mqRed.matches);
  const estatico = () => paused || reduzido() || !geometriaOk;
  const set = (el, k, v) => { if (el.getAttribute(k) !== v) el.setAttribute(k, v); };
  const op = (el, v) => { if (el.style.opacity !== v) el.style.opacity = v; if (!v && el.getAttribute('style') === '') el.removeAttribute('style'); };
  const ocultar = (el) => { op(el, '0'); set(el, 'stroke-dasharray', '0 3000'); set(el, 'stroke-dashoffset', '0'); set(el, 'stroke-width', '0'); }; // estado oculto canônico

  function medirEscala() { const m = svg.getScreenCTM?.(); escala = (m && Math.hypot(m.a, m.b)) || 1; } // px de tela por unidade do viewBox, qualquer enquadramento
  function progressoDaRolagem() {
    const r = alvo.getBoundingClientRect(), vh = innerHeight || 1;
    const y0 = vh * O.inicio - r.height / 2, y1 = vh * O.fim - r.height / 2;
    return clamp01((y0 - r.top) / (y0 - y1 || 1));
  }
  function restaurarOuro() {
    if (!ouro) return;
    for (const [k, v] of [['stroke-dasharray', ouroOrig.dash], ['stroke-dashoffset', ouroOrig.off], ['pathLength', ouroOrig.pl]]) { if (v == null) ouro.removeAttribute(k); else set(ouro, k, v); }
    op(ouro, '');
  }
  function composicaoEstatica() { for (const cam of els) for (const el of cam) ocultar(el); restaurarOuro(); }
  function desenhar(p) {
    const { trechos, desenho } = avaliar(p, coreo);
    trechos.forEach((t, i) => {
      const cam = els[i];
      if (t.a < 0.01 || t.len <= 0) { for (const el of cam) ocultar(el); return; }
      const s = t.s * 1000;
      coreo.camadas.forEach((c, j) => {
        const el = cam[j], len = t.len * c.fator * 1000;
        set(el, 'stroke-dasharray', `${len.toFixed(2)} 3000`);
        set(el, 'stroke-dashoffset', (-(s - len / 2)).toFixed(2));
        set(el, 'stroke-width', (c.largura / escala).toFixed(2));
        op(el, String(+(c.alfa * t.a).toFixed(3)));
      });
    });
    if (!desenho) { op(ouro, '0'); set(ouro, 'pathLength', '1000'); set(ouro, 'stroke-dasharray', '0 3000'); set(ouro, 'stroke-dashoffset', '0'); return; }
    if (desenho.completo) { restaurarOuro(); return; }
    op(ouro, '');
    const a = desenho.s0 * 1000, b = desenho.s1 * 1000;
    set(ouro, 'pathLength', '1000');
    set(ouro, 'stroke-dasharray', `${Math.max(0, b - a).toFixed(2)} 3000`);
    set(ouro, 'stroke-dashoffset', (-a).toFixed(2));
  }

  function emitir(p) {
    const modo = estatico() ? 'estatico' : 'animado';
    const etapa = modo === 'estatico' ? 4 : etapaDe(p);
    if (O.frase) { if (O.frase.dataset.topoEtapa !== String(etapa)) O.frase.dataset.topoEtapa = String(etapa); if (O.frase.dataset.topoModo !== modo) O.frase.dataset.topoModo = modo; }
    const ass = modo + etapa;
    if (ass === assinatura) return;
    assinatura = ass;
    const det = { modo, etapa, nome: etapa ? ETAPAS[etapa - 1].nome : 'antes', progresso: +p.toFixed(3), geometria: geometriaOk ? coreo.geometria : null };
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
    // suavização curta + velocidade mínima (um salto grande assenta em ≤ ~0,5 s, sem cauda longa)
    let p = alvoP;
    if (atual >= 0) { const dif = alvoP - atual, passo = Math.max(Math.abs(dif) * (1 - Math.exp(-dt / O.suavizar)), Math.min(Math.abs(dif), dt / 450)); p = atual + Math.sign(dif) * passo; }
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
  const onResize = () => { medirEscala(); atual = -1; acordar(); };
  function ouvir(sim) {
    if (sim === ouvindo) return;
    ouvindo = sim;
    if (sim) { if (O.progresso === 'rolagem') addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onResize); }
    else { removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); }
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    visivel = es.some((e) => e.isIntersecting);
    if (visivel) { ouvir(true); medirEscala(); if (O.progresso === 'rolagem') { alvoP = progressoDaRolagem(); atual = -1; } acordar(); }
    else { ouvir(false); if (handle) { O.caf(handle); handle = 0; } if (!estatico()) aplicar(O.progresso === 'rolagem' ? progressoDaRolagem() : alvoP); }
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
    geometria: geometriaOk ? coreo.geometria : null,
    setPaused(v) { paused = !!v; atual = -1; acordar(); if (!estatico()) { if (O.progresso === 'rolagem') alvoP = progressoDaRolagem(); aplicar(alvoP); } },
    setReducedMotion(v) { redForcado = v == null ? null : !!v; atual = -1; acordar(); if (!estatico()) aplicar(alvoP); },
    setProgresso(p) { if (O.progresso !== 'externo') return; alvoP = clamp01(+p || 0); if (estatico()) return; if (!visivel) { aplicar(alvoP); return; } acordar(); },
    atualizar() { medirEscala(); atual = -1; if (O.progresso === 'rolagem') alvoP = progressoDaRolagem(); aplicar(estatico() ? 1 : alvoP); },
    _stats: () => ({ atualizacoes: stats.n, msMedio: stats.n ? +(stats.ms / stats.n).toFixed(3) : 0, msMax: +stats.max.toFixed(3) }),
    _zerarStats: () => { stats.n = 0; stats.ms = 0; stats.max = 0; },
    get state() { const modo = estatico() ? 'estatico' : 'animado'; const p = modo === 'estatico' ? 1 : Math.max(0, atual); const etapa = modo === 'estatico' ? 4 : etapaDe(p); return { modo, etapa, nome: etapa ? ETAPAS[etapa - 1].nome : 'antes', progresso: +p.toFixed(4), alvo: +alvoP.toFixed(4), animando: !!handle, geometria: geometriaOk ? coreo.geometria : null }; },
    destroy() {
      destruido = true; if (handle) O.caf(handle); handle = 0;
      io?.disconnect(); ro?.disconnect(); ouvir(false); document.removeEventListener('visibilitychange', onVis); mqRed.removeEventListener?.('change', onMq);
      g.remove(); restaurarOuro();
      if (O.frase) { delete O.frase.dataset.topoEtapa; delete O.frase.dataset.topoModo; }
    },
  };
}
