/* Comportamento comum das páginas: menu do celular (<details>, funciona sem JS), abas acessíveis, troca de idioma
 * que preserva a seção (âncora) e a entrada E2 opcional. Cada função devolve o seu destroy(). */
import { parametro } from "./externo";

export function montarMenu(): () => void {
  const d = document.querySelector<HTMLDetailsElement>("[data-menu]");
  if (!d) return () => {};
  const sm = d.querySelector("summary")!;
  // ao abrir: foco na página atual da NAVEGAÇÃO (não no idioma atual, que também tem aria-current) ou no 1º link
  const onToggle = () => { if (d.open) { const c = d.querySelector<HTMLElement>(".painel-menu nav [aria-current=page]") || d.querySelector<HTMLElement>(".painel-menu a"); c?.focus(); } };
  // o painel cobre a página: se o foco sai do menu (Tab depois do último item, Shift+Tab antes do botão), o menu fecha,
  // para o foco não ficar num elemento escondido atrás dele
  const onFocusOut = (e: FocusEvent) => { const para = e.relatedTarget as Node | null; if (d.open && para && !d.contains(para)) d.open = false; };
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && d.open) { d.open = false; sm.focus(); } };
  const mq = matchMedia("(min-width: 900px)");
  const onMq = (m: MediaQueryListEvent) => { if (m.matches) d.open = false; };
  const onClick = (e: MouseEvent) => { if ((e.target as Element).closest(".painel-menu a")) d.open = false; };
  d.addEventListener("toggle", onToggle); document.addEventListener("keydown", onKey); mq.addEventListener?.("change", onMq); d.addEventListener("click", onClick); d.addEventListener("focusout", onFocusOut);
  return () => { d.removeEventListener("toggle", onToggle); document.removeEventListener("keydown", onKey); mq.removeEventListener?.("change", onMq); d.removeEventListener("click", onClick); d.removeEventListener("focusout", onFocusOut); d.open = false; };
}

/** Abas (←/→, Home/End). Abas que controlam o MESMO painel (camadas) não o escondem. Emite 'aba' no tablist. */
export function montarAbas(raiz: ParentNode = document): () => void {
  const desfazer: Array<() => void> = [];
  raiz.querySelectorAll<HTMLElement>("[role=tablist]").forEach((tl) => {
    const bs = [...tl.querySelectorAll<HTMLElement>("[role=tab]")];
    function sel(x: HTMLElement, foco?: boolean) {
      bs.forEach((o) => {
        const s = o === x; o.setAttribute("aria-selected", String(s)); o.tabIndex = s ? 0 : -1;
        const pn = document.getElementById(o.getAttribute("aria-controls") || ""); if (pn && !s) pn.hidden = true;
      });
      const px = document.getElementById(x.getAttribute("aria-controls") || ""); if (px) px.hidden = false;
      if (foco) x.focus();
      tl.dispatchEvent(new CustomEvent("aba", { detail: { vista: x.dataset.vista } }));
    }
    bs.forEach((x, i) => {
      const onC = () => sel(x);
      const onK = (e: KeyboardEvent) => {
        const j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? bs.length - 1 : null;
        if (j === null) return; e.preventDefault(); sel(bs[(j + bs.length) % bs.length], true);
      };
      x.addEventListener("click", onC); x.addEventListener("keydown", onK);
      desfazer.push(() => { x.removeEventListener("click", onC); x.removeEventListener("keydown", onK); });
    });
    const q = parametro("vista"); const alvo = q ? tl.querySelector<HTMLElement>(`[data-vista="${q}"]`) : null;
    sel(alvo || bs.find((x) => x.getAttribute("aria-selected") === "true") || bs[0]);
    // abas montadas: a regra do CSS que mostra só a 1ª vista antes do script cede ao `hidden` (fica até a página sair)
    bs.forEach((o) => document.getElementById(o.getAttribute("aria-controls") || "")?.parentElement?.setAttribute("data-abas", ""));
    // sem JS (ou depois do destroy) todos os painéis ficam visíveis em sequência
    desfazer.push(() => bs.forEach((o) => { const pn = document.getElementById(o.getAttribute("aria-controls") || ""); if (pn) pn.hidden = false; }));
  });
  return () => desfazer.splice(0).forEach((f) => f());
}

/** Idioma: o link leva à página equivalente; com JS, leva também a seção atual (âncora), quando houver. */
export function montarIdiomas(): () => void {
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>("a[data-idioma]");
    if (!a || !location.hash || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const alvo = a.getAttribute("href")!;
    if (alvo.includes("#")) return;
    e.preventDefault();
    location.assign(alvo + location.hash);
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}

/** E2 OPCIONAL (contrato do Motion): só no título do caso, só com ?e2=1 na revisão privada. Padrão desligado. */
export function montarE2(): () => void {
  const alvo = document.getElementById("caso-t");
  const nav = performance.getEntriesByType?.("navigation")?.[0] as PerformanceNavigationTiming | undefined;
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.movimento === "pausado";
  const restaurado = !!location.hash || nav?.type === "back_forward" || scrollY > 0;
  if (parametro("e2") !== "1" || quieto || restaurado || !alvo || !("IntersectionObserver" in window) || alvo.getBoundingClientRect().top <= innerHeight) return () => {};
  alvo.classList.add("e2-espera");
  let respondeu = false;
  const io = new IntersectionObserver((es) => {
    respondeu = true;
    if (es.some((e) => e.isIntersecting)) { alvo.classList.add("e2-entra"); alvo.classList.remove("e2-espera"); io.disconnect(); }
  }, { threshold: 0.15 });
  io.observe(alvo);
  const t = setTimeout(() => { if (!respondeu) { alvo.classList.remove("e2-espera"); io.disconnect(); } }, 1500);
  return () => { clearTimeout(t); io.disconnect(); alvo.classList.remove("e2-espera"); };
}

/**
 * Âncora de LEITURA no histórico (todas as páginas). O Chromium, ao voltar/avançar para uma entrada cujo endereço tem
 * #âncora com alvo na página, leva a página de novo à âncora, e não à posição em que o visitante saiu (medido em
 * /pt/pesquisa#fichas: saída em 2171, volta em 457). Regra limitada: quando o PRÓPRIO visitante rola a página (roda,
 * toque, teclas de rolagem) mais de 48 px a partir de onde estava quando a âncora entrou no endereço, a âncora sai da
 * entrada atual por history.replaceState — path, query e history.state preservados, sem nova entrada no histórico.
 * Não mexe na rolagem. Não toca na carga direta, em links para seções (a âncora fica até haver leitura), em rolagens
 * programáticas, na restauração pelo histórico nem em hash sem alvo na página. Troca de idioma depois de ler leva à
 * página equivalente, sem a seção que ficou para trás.
 * Barra de rolagem (fechamento técnico, 15/10): no Chromium/Edge, apertar o botão na barra de rolagem da página (seta,
 * trilho ou arraste do polegar) dispara pointerdown no <html> com o ponteiro FORA da área do documento
 * (clientX ≥ clientWidth ou clientY ≥ clientHeight); enquanto o botão está apertado, cada rolagem conta como leitura.
 * O botão do meio (rolagem automática do Windows) também conta. Barras sobrepostas (que não ocupam espaço, comuns no
 * macOS e em celulares) não são distinguíveis por evento: nesses casos vale só roda, toque e teclado.
 */
export function montarAncoraDeLeitura(): () => void {
  const LIMIAR = 48;
  const TECLAS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"]);
  let gesto = 0, yBase: number | null = null, hrefBase = "", naBarra = false;
  const alvo = () => {
    if (!location.hash || location.hash.length < 2) return null;
    try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return null; }
  };
  // a base vale para o endereço em que foi tomada (o Next troca de entrada por pushState, sem hashchange)
  const marcar = () => { gesto = performance.now(); if (yBase === null || hrefBase !== location.href) { yBase = alvo() ? scrollY : null; hrefBase = location.href; } };
  const onKey = (e: KeyboardEvent) => {
    if (!TECLAS.has(e.key)) return;
    const t = e.target as Element | null;
    if (t?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable=true]")) return;
    marcar();
  };
  const naBarraDeRolagem = (e: PointerEvent) => {
    const r = document.documentElement;
    return e.target === r && (e.clientX >= r.clientWidth || e.clientY >= r.clientHeight);
  };
  const onDown = (e: PointerEvent) => { if (e.button === 1 || (e.button === 0 && naBarraDeRolagem(e))) { naBarra = true; marcar(); } };
  const onUp = () => { naBarra = false; };
  const onScroll = () => {
    if (naBarra) gesto = performance.now(); // arraste em curso: a leitura continua
    if (yBase === null || hrefBase !== location.href || performance.now() - gesto > 1000) return;
    if (Math.abs(scrollY - yBase) <= LIMIAR || !alvo()) return;
    history.replaceState(history.state, "", location.pathname + location.search);
    yBase = null;
  };
  // nova âncora no endereço (link para seção, voltar/avançar): a base da leitura recomeça
  const reiniciar = () => { yBase = null; };
  addEventListener("wheel", marcar, { passive: true });
  addEventListener("touchmove", marcar, { passive: true });
  addEventListener("keydown", onKey);
  addEventListener("pointerdown", onDown, true);
  addEventListener("pointerup", onUp, true);
  addEventListener("pointercancel", onUp, true);
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("hashchange", reiniciar);
  addEventListener("popstate", reiniciar);
  return () => {
    removeEventListener("wheel", marcar); removeEventListener("touchmove", marcar); removeEventListener("keydown", onKey);
    removeEventListener("pointerdown", onDown, true); removeEventListener("pointerup", onUp, true); removeEventListener("pointercancel", onUp, true);
    removeEventListener("scroll", onScroll); removeEventListener("hashchange", reiniciar); removeEventListener("popstate", reiniciar);
  };
}
