/** Expansão progressiva da navegação. Os links e details funcionam sem este controlador. */
export function montarNavegacao(): () => void {
  const header = document.querySelector<HTMLElement>('header.cab');
  if (!header) return () => {};
  const desktop = matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)');
  const cleanups: Array<() => void> = [];
  const groups = [...header.querySelectorAll<HTMLElement>('[data-nav-grupo]')].map(group => ({
    group,
    details: group.querySelector<HTMLDetailsElement>('details')!,
    summary: group.querySelector<HTMLElement>('summary')!,
    openTimer: 0,
    closeTimer: 0,
  }));
  const clear = (g: typeof groups[number]) => { clearTimeout(g.openTimer); clearTimeout(g.closeTimer); };
  const closeAll = (except?: typeof groups[number]) => groups.forEach(g => { if (g !== except) { clear(g); g.details.open = false; } });
  const open = (g: typeof groups[number]) => { clear(g); closeAll(g); g.details.open = true; };
  groups.forEach(g => {
    const enter = (e: PointerEvent) => {
      if (!desktop.matches || e.pointerType !== 'mouse') return;
      clear(g);
      g.openTimer = window.setTimeout(() => open(g), 140);
    };
    const leave = () => {
      clear(g);
      g.closeTimer = window.setTimeout(() => { if (!g.group.contains(document.activeElement)) g.details.open = false; }, 180);
    };
    const focusOut = (e: FocusEvent) => { if (!e.relatedTarget || !g.group.contains(e.relatedTarget as Node)) { clear(g); g.details.open = false; } };
    const toggle = () => { if (g.details.open) closeAll(g); };
    const clickSummary = () => clear(g);
    g.group.addEventListener('pointerenter', enter);
    g.group.addEventListener('pointerleave', leave);
    g.group.addEventListener('focusout', focusOut);
    g.summary.addEventListener('click', clickSummary);
    g.details.addEventListener('toggle', toggle);
    cleanups.push(() => {
      clear(g); g.details.open = false;
      g.group.removeEventListener('pointerenter', enter);
      g.group.removeEventListener('pointerleave', leave);
      g.group.removeEventListener('focusout', focusOut);
      g.summary.removeEventListener('click', clickSummary);
      g.details.removeEventListener('toggle', toggle);
    });
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const g = groups.find(x => x.details.open);
      if (!g) return;
      const hadFocus = g.group.contains(document.activeElement);
      closeAll();
      if (hadFocus) g.summary.focus({ preventScroll: true });
      e.preventDefault(); e.stopPropagation();
    } else if (e.key === 'ArrowDown') {
      const g = groups.find(x => e.target === x.summary || e.target === x.group.querySelector('.nav-principal'));
      if (!g) return;
      e.preventDefault(); open(g);
      g.details.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
    }
  };
  const outside = (e: PointerEvent) => { if (!groups.some(g => g.group.contains(e.target as Node))) closeAll(); };
  const navigate = (e: MouseEvent) => { if ((e.target as Element).closest('.nav-painel a, .nav-principal')) closeAll(); };
  const resize = () => closeAll();
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('pointerdown', outside);
  header.addEventListener('click', navigate);
  desktop.addEventListener('change', resize);
  return () => {
    cleanups.forEach(f => f());
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('pointerdown', outside);
    header.removeEventListener('click', navigate);
    desktop.removeEventListener('change', resize);
  };
}
