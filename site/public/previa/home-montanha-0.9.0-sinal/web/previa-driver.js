/*
 * ARARAT home-v2 · “driver” de integração B (EXPERIMENTAL, somente /previa). ESM sem dependências.
 * Liga a escultura (home-sculpture.js) ao layout REAL da página — sem decidir o layout:
 *   art    ← retângulo do slot da arte no hero;
 *   target ← retângulo do quadro da jornada (a cena fica por baixo, no estado Imagem);
 *   ready  ← status "ready" do palco + data-loaded="true" da cena;
 *   arc    ← data-start-arc da cena (journey 0.4.1-exp, extensão start-arc-v1);
 *   p      ← (vh − topoDoQuadro) / (vh − topoFinal): do quadro entrando pela base da tela até a posição final.
 * Listener de rolagem passivo + rAF; nenhum pin, nenhuma captura de roda. O Site pode usar este
 * arquivo como está ou reescrever a mesma lógica no próprio componente.
 *
 * Movimento reduzido: NÃO chame connect — mantenha o poster da área da arte no slot (conteúdo normal).
 */
export function connectHomeSculpture({
  createHomeSculpture, // export do módulo home-sculpture.js
  layer, // elemento da camada (position: fixed; inset: 0; abaixo dos textos)
  slot, // área da arte no hero
  frame, // quadro da jornada (.frame com data-layout)
  headerHeight = 72,
  stickyQuery = '(min-width: 960px)',
  paused = false,
  intro = false,
  coverColor = ['#111111'], // 0.9.0-sinal: --ararat-bg (home-v2: gradiente navy)
  introDeadline = 1500,
}) {
  // a abertura só toca se o módulo chegar cedo (≤ 1,5 s após a navegação); depois disso, assenta direto
  const early = typeof performance !== 'undefined' && performance.now() < introDeadline;
  const s = createHomeSculpture(layer, { paused, intro: intro && !paused && early, coverColor });
  let raf = 0;
  const rect = (el, r) => {
    const b = el.getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height, ...(r ? { r } : {}) };
  };
  function update() {
    raf = 0;
    const vh = window.innerHeight || 1;
    const f = frame.getBoundingClientRect();
    const sticky = frame.closest("[class*='stickyCol'], [data-sticky-col]");
    const finalTop = window.matchMedia(stickyQuery).matches && sticky
      ? headerHeight + (f.top - sticky.getBoundingClientRect().top) // onde o quadro prende
      : headerHeight + 16; // celular: logo abaixo do cabeçalho
    const p = Math.min(1, Math.max(0, (vh - f.top) / Math.max(1, vh - finalTop)));
    const root = frame.querySelector('.ararat-journey');
    const status = frame.closest('[data-motion-status]')?.dataset.motionStatus ?? 'ready';
    const ready = status === 'ready' && root?.dataset.loaded === 'true';
    let arc = null;
    try { arc = root?.dataset.startArc ? JSON.parse(root.dataset.startArc) : null; } catch { arc = null; }
    s.setLayout({ art: rect(slot), target: rect(frame, 12), ready, arc });
    s.setPassage(p);
    layer.dataset.passage = p.toFixed(3);
    // enquanto coberto, o Site pode tirar sombra/borda do quadro (ver CSS de exemplo)
    if (p < 0.9 || !ready) frame.dataset.covered = 'true';
    else delete frame.dataset.covered;
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  const mo = new MutationObserver(schedule);
  mo.observe(frame.closest('[data-motion-status]') ?? frame, { attributes: true, subtree: true, attributeFilter: ['data-loaded', 'data-start-arc', 'data-motion-status'] });
  slot.dataset.live = 'true';
  update();
  return {
    sculpture: s,
    update,
    setPaused: (b) => s.setPaused(b),
    destroy() {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
      s.destroy();
      delete slot.dataset.live;
      delete frame.dataset.covered;
    },
  };
}
