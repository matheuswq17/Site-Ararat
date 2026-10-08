/* ARARAT — Plataforma: percurso Hub → Viewer conduzido pela rolagem. Motion, 0.1.0-draft (rascunho).
 *
 * Demonstração sobre CAPTURAS REAIS dos produtos (Hub claro, Viewer escuro; caso público e desidentificado
 * ProstateX-0067, coleção PROSTATEx/TCIA, CC BY 3.0). Não é um aplicativo dentro do site nem um vídeo: cada quadro
 * é uma captura (ou recorte dela) e o avanço segue SÓ o progresso que o Site envia (setProgresso). Parou de rolar,
 * o quadro fica; subiu, volta aos mesmos estados. Sem relógio próprio, sem controlador de rolagem.
 *
 *   const f = createPlataformaFluxo(host, { palco, base, progresso: 'externo', paused, reducedMotion, onEstado })
 *   f.setProgresso(p) · f.setPaused(bool) · f.setReducedMotion(bool|null) · f.atualizar() · f.state · f.destroy()
 *   Evento 'fluxo:estado' no host quando etapa, modo ou carregamento mudam.
 *   host: data-fluxo-modo ('animado' | 'estatico'), data-fluxo-etapa (1–7), data-fluxo-layout, data-fluxo-carregado.
 *
 * Sem JS, com pausa, com movimento reduzido ou se o módulo/um asset falhar: o módulo não desenha nada e deixa
 * data-fluxo-modo="estatico" — o Site mostra o roteiro estático (HTML com as mesmas capturas-chave).
 * Regras de imagem: troca de quadro dentro de uma sequência é seca (como a roda do mouse no produto); entre cenas,
 * a placa escurece e reaparece — nunca mistura duas imagens médicas numa só.
 */
export const VERSION = '0.1.0-draft';
const NS_DADOS = /*DADOS*/{};
export const DADOS = NS_DADOS;
export const ETAPAS = NS_DADOS.etapas || [];

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sstep = (t) => t * t * (3 - 2 * t);
/** valor de uma trilha de chaves [[p, v], …] em p (suave entre chaves; constante fora). */
export function trilha(k, p, linear = false) {
  if (k == null) return undefined;
  if (typeof k === 'number') return k;
  const n = k.length;
  if (p <= k[0][0]) return k[0][1];
  if (p >= k[n - 1][0]) return k[n - 1][1];
  let i = 0; while (p > k[i + 1][0]) i++;
  const [p0, v0] = k[i], [p1, v1] = k[i + 1];
  const t = p1 > p0 ? (p - p0) / (p1 - p0) : 1;
  return v0 + (v1 - v0) * (linear ? t : sstep(t));
}
export function etapaDe(p) { for (const e of ETAPAS) if (p < e.ate) return e.etapa; return ETAPAS.length ? ETAPAS[ETAPAS.length - 1].etapa : 0; }

/** Estado puro de uma placa em p (usado também nos testes). */
export function avaliarPlaca(pl, p) {
  const o = clamp01(trilha(pl.o, p) ?? 1);
  const r = { o, x: trilha(pl.x, p), y: trilha(pl.y, p), w: trilha(pl.w, p), h: trilha(pl.h, p), cx: trilha(pl.cx, p), cy: trilha(pl.cy, p), z: trilha(pl.z, p) };
  r.camadas = (pl.camadas || []).map((c) => clamp01(trilha(c.o, p) ?? 1));
  r.seqs = (pl.seqs || []).map((s) => ({ i: Math.round(trilha(s.i, p, true)), o: clamp01(trilha(s.o, p) ?? 1) }));
  r.marcas = (pl.marcas || []).map((m) => (m.t === 'toque' ? { u: clamp01(trilha(m.u, p) ?? 0) } : { o: clamp01(trilha(m.o, p) ?? 0) }));
  return r;
}

export function createPlataformaFluxo(host, opts = {}) {
  const O = {
    palco: null,          // elemento onde o módulo desenha (padrão: [data-fluxo-palco] dentro do host)
    base: null,           // URL da pasta dos assets (padrão: ./assets/ ao lado deste arquivo)
    progresso: 'externo', // o Site envia setProgresso(p); o módulo não lê a rolagem
    paused: false,
    reducedMotion: 'auto',
    layout: 'auto',       // 'auto' (celular quando o palco tem < 600 px de largura) | 'desktop' | 'celular'
    suavizar: 120,        // ms: acompanha saltos grandes de rolagem com suavização curta
    onEstado: null,
    raf: (f) => requestAnimationFrame(f), caf: (h) => cancelAnimationFrame(h), agora: () => performance.now(),
    ...opts,
  };
  const palco = O.palco || host.querySelector('[data-fluxo-palco]') || host;
  const base = String(O.base || new URL('./assets/', import.meta.url));
  const mqRed = matchMedia('(prefers-reduced-motion: reduce)');
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  let paused = !!O.paused, redForcado = O.reducedMotion === 'auto' ? null : !!O.reducedMotion;
  let alvo = 0, atual = -1, handle = 0, ultimo = 0, visivel = false, destruido = false, falhou = false;
  let layout = null, L = null, k = 1, assinatura = '', carregados = 0, precisos = 0;
  const stats = { n: 0, ms: 0, max: 0 };
  const imgs = new Map();   // asset id → { el, usada: [pMin, pMax], arquivo }
  let mundo = null, placas = [];

  const reduzido = () => (redForcado != null ? redForcado : mqRed.matches);
  const estatico = () => paused || reduzido() || falhou || !NS_DADOS.layouts;
  const sty = (el, k2, v) => { if (el.style[k2] !== v) el.style[k2] = v; };
  const setVis = (el, o) => { const v = o > 0.004 ? 'visible' : 'hidden'; if (el.style.visibility !== v) el.style.visibility = v; sty(el, 'opacity', o >= 0.999 ? '1' : String(+o.toFixed(3))); };

  function escolherLayout() {
    if (O.layout !== 'auto') return O.layout;
    const w = palco.clientWidth || host.clientWidth || innerWidth;
    return w < 600 ? 'celular' : 'desktop';
  }
  function medir() {
    const W = palco.clientWidth, H = palco.clientHeight;
    if (!L || !W || !H) return;
    k = Math.min(W / L.W, H / L.H);
    const ox = (W - L.W * k) / 2, oy = (H - L.H * k) / 2;
    sty(mundo, 'transform', `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px) scale(${k.toFixed(5)})`);
  }
  function construir() {
    desmontarDom();
    layout = escolherLayout(); L = NS_DADOS.layouts[layout];
    mundo = document.createElement('div');
    mundo.className = 'pf-mundo'; mundo.setAttribute('aria-hidden', 'true');
    Object.assign(mundo.style, { position: 'absolute', left: '0', top: '0', width: L.W + 'px', height: L.H + 'px', transformOrigin: '0 0', pointerEvents: 'none' });
    // escala de cada asset (px de tela por px lógico) → 1× ou 2×
    k = Math.min((palco.clientWidth || L.W) / L.W, (palco.clientHeight || L.H) / L.H);
    const zmax = new Map(), uso = new Map();
    const usar = (id, z, keys) => {
      zmax.set(id, Math.max(zmax.get(id) || 0, z));
      const ps = (keys && typeof keys !== 'number' ? keys.filter((kk) => kk[1] > 0).map((kk) => kk[0]) : [0, 1]);
      const u = uso.get(id) || [1, 0]; uso.set(id, [Math.min(u[0], ...ps, 1), Math.max(u[1], ...ps, 0)]);
    };
    for (const pl of L.placas) {
      const zz = typeof pl.z === 'number' ? pl.z : Math.max(...pl.z.map((q) => q[1]));
      const vis = pl.o;
      (pl.camadas || []).forEach((c) => usar(c.a, zz, c.o ?? vis));
      (pl.seqs || []).forEach((s) => s.a.forEach((a) => usar(a, zz, s.o ?? vis)));
    }
    placas = L.placas.map((pl) => {
      const el = document.createElement('div'); el.className = 'pf-placa'; el.dataset.placa = pl.id; el.dataset.tema = pl.tema;
      Object.assign(el.style, { position: 'absolute', left: '0', top: '0', overflow: 'hidden', borderRadius: (pl.raio ?? 10) + 'px', background: pl.fundo, boxShadow: pl.sombra || '0 18px 48px rgba(3,8,14,0.45)', visibility: 'hidden', willChange: 'transform, opacity', contain: 'layout paint' });
      const cam = document.createElement('div'); cam.className = 'pf-cam';
      Object.assign(cam.style, { position: 'absolute', left: '0', top: '0', transformOrigin: '0 0' });
      el.append(cam);
      const novaImg = (id) => {
        const a = NS_DADOS.assets[id]; if (!a) throw new Error('asset ausente: ' + id);
        let reg = imgs.get(id);
        const im = document.createElement('img');
        im.alt = ''; im.decoding = 'async'; im.draggable = false;
        Object.assign(im.style, { position: 'absolute', left: a.pos[0] + 'px', top: a.pos[1] + 'px', width: a.w + 'px', height: a.h + 'px', maxWidth: 'none', visibility: 'hidden', opacity: '0', userSelect: 'none' });
        const fator = (zmax.get(id) || 1) * k * dpr();
        const arq = fator > 1.1 ? a.f2 : a.f1;
        if (!reg) { reg = { els: [], usada: uso.get(id) || [0, 1], arquivo: arq, pronta: false }; imgs.set(id, reg); precisos++; }
        reg.els.push(im);
        im.addEventListener('load', () => { if (!reg.pronta) { reg.pronta = true; carregados++; emitir(); } }, { once: true });
        im.addEventListener('error', () => { falhou = true; host.dataset.fluxoFalha = id; aplicar(); }, { once: true });
        cam.append(im); return im;
      };
      const camadas = (pl.camadas || []).map((c) => novaImg(c.a));
      const seqs = (pl.seqs || []).map((s) => s.a.map(novaImg));
      const marcas = (pl.marcas || []).map((m) => {
        const d = document.createElement('div'); d.className = m.t === 'toque' ? 'pf-toque' : 'pf-realce';
        if (m.t === 'toque') Object.assign(d.style, { position: 'absolute', left: '0', top: '0', width: '56px', height: '56px', marginLeft: '-28px', marginTop: '-28px', borderRadius: '50%', border: '2.5px solid #D4AF37', boxShadow: '0 0 0 1px rgba(13,27,42,0.35), 0 0 18px rgba(212,175,55,0.45)', visibility: 'hidden' });
        else Object.assign(d.style, { position: 'absolute', left: '0', top: '0', borderRadius: (m.raio ?? 6) + 'px', border: '2px solid #D4AF37', boxShadow: '0 0 0 3px rgba(212,175,55,0.16)', visibility: 'hidden' });
        el.append(d); return d;
      });
      mundo.append(el);
      return { pl, el, cam, camadas, seqs, marcas, ass: '' };
    });
    palco.append(mundo);
    host.dataset.fluxoLayout = layout;
    medir();
  }
  function desmontarDom() {
    mundo?.remove(); mundo = null; placas = []; imgs.clear(); carregados = 0; precisos = 0;
  }
  // carrega só o que está perto de p (janela adiante e atrás), para não baixar o percurso inteiro de uma vez
  function carregarPerto(p) {
    for (const [, reg] of imgs) {
      if (reg.pedida) continue;
      if (p >= reg.usada[0] - 0.14 && p <= reg.usada[1] + 0.08) { reg.pedida = true; reg.els.forEach((im) => { im.src = base + reg.arquivo; }); }
    }
  }
  function desenhar(p) {
    carregarPerto(p);
    for (const P of placas) {
      const r = avaliarPlaca(P.pl, p);
      setVis(P.el, r.o);
      if (r.o <= 0.004) continue;
      sty(P.el, 'transform', `translate(${r.x.toFixed(2)}px, ${r.y.toFixed(2)}px)`);
      sty(P.el, 'width', r.w.toFixed(2) + 'px'); sty(P.el, 'height', r.h.toFixed(2) + 'px');
      sty(P.cam, 'transform', `scale(${r.z.toFixed(5)}) translate(${(-r.cx).toFixed(2)}px, ${(-r.cy).toFixed(2)}px)`);
      P.camadas.forEach((im, i) => setVis(im, r.camadas[i]));
      P.seqs.forEach((fr, i) => { const s = r.seqs[i]; const idx = Math.max(0, Math.min(fr.length - 1, s.i)); fr.forEach((im, j) => setVis(im, j === idx ? s.o : 0)); });
      P.marcas.forEach((d, i) => {
        const m = P.pl.marcas[i], v = r.marcas[i];
        if (m.t === 'toque') {
          const u = v.u, o = u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
          setVis(d, o * 0.95);
          if (o > 0) sty(d, 'transform', `translate(${((m.c[0] - r.cx) * r.z).toFixed(2)}px, ${((m.c[1] - r.cy) * r.z).toFixed(2)}px) scale(${(0.32 + 0.68 * u).toFixed(3)})`);
        } else {
          setVis(d, v.o);
          if (v.o > 0) {
            sty(d, 'transform', `translate(${((m.r[0] - r.cx) * r.z - 3).toFixed(2)}px, ${((m.r[1] - r.cy) * r.z - 3).toFixed(2)}px)`);
            sty(d, 'width', (m.r[2] * r.z + 6).toFixed(2) + 'px'); sty(d, 'height', (m.r[3] * r.z + 6).toFixed(2) + 'px');
          }
        }
      });
    }
  }

  function emitir() {
    const modo = estatico() ? 'estatico' : 'animado';
    const p = Math.max(0, atual);
    const etapa = modo === 'estatico' ? 0 : etapaDe(p);
    const carregado = precisos ? (carregados >= precisos ? 'tudo' : 'parcial') : 'nada';
    const d = host.dataset;
    if (d.fluxoModo !== modo) d.fluxoModo = modo;
    if (d.fluxoEtapa !== String(etapa)) d.fluxoEtapa = String(etapa);
    if (d.fluxoCarregado !== carregado) d.fluxoCarregado = carregado;
    const ass = modo + etapa + carregado + layout;
    if (ass === assinatura) return;
    assinatura = ass;
    const det = { modo, etapa, nome: etapa ? ETAPAS[etapa - 1].nome : '', progresso: +p.toFixed(3), layout, carregado, falha: host.dataset.fluxoFalha || null };
    host.dispatchEvent(new CustomEvent('fluxo:estado', { detail: det }));
    O.onEstado?.(det);
  }
  function aplicar(p = alvo) {
    if (estatico()) { if (mundo) mundo.style.visibility = 'hidden'; atual = -1; emitir(); return; }
    if (!visivel && !mundo) { emitir(); return; } // longe da tela: nada é montado nem baixado (só o modo é anunciado)
    if (!mundo) construir();
    mundo.style.visibility = '';
    if (p === atual) return;
    atual = p; const t0 = performance.now(); desenhar(p); const ms = performance.now() - t0; stats.n++; stats.ms += ms; if (ms > stats.max) stats.max = ms;
    emitir();
  }
  function tick(now) {
    handle = 0;
    if (destruido || estatico()) return;
    const dt = Math.min(64, Math.max(0, now - ultimo)); ultimo = now;
    let p = alvo;
    if (atual >= 0) { const dif = alvo - atual, passo = Math.max(Math.abs(dif) * (1 - Math.exp(-dt / O.suavizar)), Math.min(Math.abs(dif), dt / 500)); p = atual + Math.sign(dif) * passo; }
    if (Math.abs(alvo - p) < 0.0004) p = alvo;
    aplicar(p);
    if (p !== alvo && visivel && !document.hidden) handle = O.raf(tick);
  }
  function acordar() {
    if (destruido) return;
    if (estatico()) { if (handle) { O.caf(handle); handle = 0; } aplicar(); return; }
    if (handle || !visivel || document.hidden) return;
    ultimo = O.agora(); handle = O.raf(tick);
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    visivel = es.some((e) => e.isIntersecting);
    if (visivel) { if (!mundo && !estatico()) { atual = -1; aplicar(alvo); } acordar(); } else if (handle) { O.caf(handle); handle = 0; }
  }, { rootMargin: '20% 0px 20% 0px' }) : null;
  if (io) io.observe(host); else visivel = true;
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => {
    if (destruido || !mundo) return;
    if (escolherLayout() !== layout) { construir(); atual = -1; aplicar(alvo); return; }
    medir();
  }) : null;
  ro?.observe(palco);
  const onVis = () => { if (!document.hidden) acordar(); };
  document.addEventListener('visibilitychange', onVis);
  const onMq = () => { atual = -1; acordar(); };
  mqRed.addEventListener?.('change', onMq);

  host.dataset.fluxoVersao = VERSION;
  aplicar(alvo);

  return {
    VERSION,
    setProgresso(p) { alvo = clamp01(+p || 0); if (estatico()) return; if (!visivel) { atual = -1; emitir(); return; } acordar(); }, // longe da tela: guarda o alvo, não desenha
    setPaused(v) { paused = !!v; atual = -1; if (!estatico()) aplicar(alvo); else aplicar(); acordar(); },
    setReducedMotion(v) { redForcado = v == null ? null : !!v; atual = -1; if (!estatico()) aplicar(alvo); else aplicar(); acordar(); },
    atualizar() { if (mundo) { if (escolherLayout() !== layout) construir(); else medir(); } atual = -1; aplicar(alvo); },
    get state() { const modo = estatico() ? 'estatico' : 'animado'; const p = Math.max(0, atual); return { modo, etapa: modo === 'estatico' ? 0 : etapaDe(p), progresso: +p.toFixed(4), alvo: +alvo.toFixed(4), animando: !!handle, layout, carregados, precisos, falha: host.dataset.fluxoFalha || null }; },
    _stats: () => ({ atualizacoes: stats.n, msMedio: stats.n ? +(stats.ms / stats.n).toFixed(3) : 0, msMax: +stats.max.toFixed(3) }),
    destroy() {
      destruido = true; if (handle) O.caf(handle); handle = 0;
      io?.disconnect(); ro?.disconnect(); document.removeEventListener('visibilitychange', onVis); mqRed.removeEventListener?.('change', onMq);
      desmontarDom();
      for (const k2 of ['fluxoModo', 'fluxoEtapa', 'fluxoLayout', 'fluxoCarregado', 'fluxoFalha', 'fluxoVersao']) delete host.dataset[k2];
    },
  };
}
