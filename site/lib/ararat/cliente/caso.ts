/* Palco do caso real (Model · Hub · Viewer) na Home. Composição acordada com o Motion (contrato R2, mantida no R3):
 * - Palco persistente (sticky) só com largura ≥1024 E altura ≥820, IntersectionObserver disponível e o bloco Model
 *   montado pelo saidas-caso. Fora disso: sequência normal (desktop: texto | mídia; celular: vertical).
 * - Rolagem NORMAL: o capítulo na faixa de leitura (40–60 %) por ≥120 ms escolhe a mídia (E3). Sem scroll hijacking.
 * - Seleção manual: âncoras comuns; com JS o palco troca na hora, a página rola até o capítulo e o foco vai ao título.
 * - Falha do saidas-caso, erro ao montar, módulo que não monta em 4 s, sem IO ou sem mídia (variante pública): fluxo
 *   normal. As figuras são MOVIDAS (não copiadas). destroy() desfaz tudo.
 * - RESTAURAÇÃO (voltar/avançar no app, recarga, voltar entre documentos): o navegador devolve a rolagem DEPOIS da
 *   montagem (na montagem scrollY ainda é 0). Enquanto ninguém mexe (roda, toque, tecla, ponteiro), cada rolagem que o
 *   próprio navegador aplica escolhe o capítulo pela mesma faixa de 40–60 % e o mostra SEM troca cruzada e sem a espera
 *   de 120 ms — que fica só para a rolagem normal. Assim o palco já aparece em Hub/Viewer, sem passar por Model.
 *   Termina no 1º gesto do visitante, numa seleção manual, ou 1,5 s depois de montar; tudo é cancelado no desmonte. */
import { parametro } from "./externo";

// voltar/avançar dentro do app: o sinal vale para a PRÓXIMA montagem do palco e é zerado por ela ou por um clique em
// link (início de navegação comum). Singleton do cliente, como em transicao.ts (que tem o próprio sinal, consumido
// pela entrada das páginas).
let travessiaNoApp = false;
let primeiraMontagemDoDocumento = true;
// algum gesto do visitante desde a carga do documento (para não corrigir a posição de uma âncora depois que ele mexeu)
let gestoDesdeACarga = false;
const urlDoDocumento = typeof window !== "undefined" ? location.href : "";
if (typeof window !== "undefined") {
  addEventListener("popstate", () => { travessiaNoApp = true; });
  addEventListener("click", (e) => { if ((e.target as Element | null)?.closest?.("a[href]")) travessiaNoApp = false; }, true);
  for (const g of ["wheel", "touchstart", "keydown", "pointerdown"]) addEventListener(g, () => { gestoDesdeACarga = true; }, { capture: true, passive: true });
}
export function espiarRestauracao(): boolean {
  let r = travessiaNoApp;
  if (primeiraMontagemDoDocumento && location.href === urlDoDocumento) {
    const tipo = (performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined)?.type;
    r ||= tipo === "back_forward" || tipo === "reload";
  }
  return r;
}
function restauracao(): boolean {
  const r = espiarRestauracao();
  travessiaNoApp = false; primeiraMontagemDoDocumento = false;
  return r;
}

/** Âncora da carga (#evidencia, #cap-hub, #adocao…) que o navegador (ou o Next, na navegação com âncora) JÁ
 *  posicionou quando os controladores da página começam a montar. Chamada por Controladores.tsx ANTES de montar: a
 *  montagem (abas, palco do caso, camadas) muda a altura do que está acima e a desloca (medido na Home em ES:
 *  #evidencia a −1137 px). Nunca na restauração pelo histórico nem depois de um gesto do visitante. */
export function ancoraDaCarga(): { el: HTMLElement; t: number } | null {
  if (espiarRestauracao() || gestoDesdeACarga || !location.hash) return null;
  let el: HTMLElement | null = null;
  try { el = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return null; }
  if (!el) return null;
  const t = el.getBoundingClientRect().top;
  return t >= -1 && t <= innerHeight * 0.5 ? { el, t } : null;
}
/** Depois de montar: se a âncora saiu do lugar, um único scrollIntoView (mesmas regras de pouso do navegador). */
export function reposicionarAncora(a: { el: HTMLElement; t: number } | null) {
  if (!a || !a.el.isConnected || gestoDesdeACarga) return;
  if (Math.abs(a.el.getBoundingClientRect().top - a.t) > 1) a.el.scrollIntoView({ block: "start" });
}

/** Densidade real do aparelho (--dpr-real), acompanhando zoom e troca de monitor. Sem JS vale a faixa do CSS. */
export function acompanharDensidade(): () => void {
  let mq: MediaQueryList | null = null;
  const aplicar = () => {
    const d = window.devicePixelRatio || 1;
    document.documentElement.style.setProperty("--dpr-real", String(d));
    mq?.removeEventListener?.("change", aplicar);
    mq = matchMedia(`(resolution: ${d}dppx)`); mq.addEventListener?.("change", aplicar);
  };
  aplicar();
  return () => { mq?.removeEventListener?.("change", aplicar); mq = null; };
}

export function createAtlasCaso(grade: HTMLElement, { win = window }: { win?: Window & typeof globalThis } = {}) {
  const palcoMidia = grade.querySelector<HTMLElement>("[data-palco-midia]")!;
  const links = [...grade.querySelectorAll<HTMLAnchorElement>(".cap-nav a[data-cap]")];
  const caps = [...grade.querySelectorAll<HTMLElement>("[data-capitulo]")];
  const ids = caps.map((c) => c.dataset.capitulo!);
  const midias = new Map(caps.map((c) => [c.dataset.capitulo!, c.querySelector<HTMLElement>(".cap-midia")!]));
  const ancoras = new Map(caps.map((c) => [c.dataset.capitulo!, c.querySelector<HTMLElement>("[data-ancora]")!]));
  const saidas = grade.querySelector<HTMLElement>("[data-saidas]");
  const mq = win.matchMedia("(min-width: 1024px) and (min-height: 820px)");
  const red = win.matchMedia("(prefers-reduced-motion: reduce)");
  const temIO = typeof win.IntersectionObserver === "function";
  let ativo = ids[0], montado = false;
  let bloqueio: string | null = !temIO ? "sem-io" : !saidas ? "sem-midia" : null;
  if (bloqueio) grade.dataset.palcoBloqueio = bloqueio;
  let obs: IntersectionObserver | null = null, mo: MutationObserver | null = null;
  let espera = 0, reconc = 0, prazo = 0, travaAte = 0, destruido = false;
  const naFaixa = new Set<string>();
  // restauração da rolagem pelo navegador (ver o cabeçalho do arquivo)
  let restaurando = restauracao(), fimRestauracao = 0, quadroSinc = 0, quadroTransicao = 0;
  const GESTOS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

  const marcar = () => links.forEach((a) => (montado && a.dataset.cap === ativo ? a.setAttribute("aria-current", "step") : a.removeAttribute("aria-current")));
  function mostrar(id: string) {
    if (!midias.has(id)) return;
    ativo = id;
    if (montado) {
      midias.forEach((m, k) => {
        if (k === id) { m.dataset.ativo = ""; m.removeAttribute("inert"); m.removeAttribute("aria-hidden"); }
        else { delete m.dataset.ativo; m.setAttribute("inert", ""); m.setAttribute("aria-hidden", "true"); }
      });
      grade.dataset.capAtivo = id;
    }
    marcar();
  }
  const candidato = () => ids.filter((id) => naFaixa.has(id)).pop();
  /** O capítulo na faixa de leitura (40–60 % da janela) pela geometria atual — o mesmo critério do IO, sem esperar por ele. */
  const pelaGeometria = () => {
    const h = win.innerHeight;
    return ids.filter((_, i) => { const r = caps[i].getBoundingClientRect(); return r.bottom > h * 0.4 && r.top < h * 0.6; }).pop();
  };
  /** Aplica `f` SEM transições nas mídias E no indicador (.cap-nav a: fundo, borda e cor de 120 ms): o primeiro quadro
   *  pintado já mostra o estado final. As transições voltam no quadro seguinte. */
  const comTransicao = () => [...midias.values(), ...links];
  function semTransicao(f: () => void) {
    const els = comTransicao();
    els.forEach((m) => { m.style.transition = "none"; });
    f();
    void palcoMidia.offsetWidth; // aplica o estado final antes de devolver as transições
    cancelAnimationFrame(quadroTransicao);
    quadroTransicao = requestAnimationFrame(() => { quadroTransicao = 0; els.forEach((m) => { m.style.transition = ""; }); });
  }
  /** Troca o capítulo SEM troca cruzada: a mídia e o indicador novos já são os primeiros a aparecer (montagem, âncora,
   *  restauração). */
  function mostrarSemTroca(id: string) {
    if (!montado || id === ativo) { mostrar(id); return; }
    semTransicao(() => mostrar(id));
  }
  /** Mostra o capítulo da faixa de leitura, sem troca cruzada (restauração da rolagem). */
  function sincronizar() {
    if (!montado || destruido || performance.now() < travaAte) return;
    const id = pelaGeometria();
    if (id && id !== ativo) mostrarSemTroca(id);
  }
  const aoRolarNaRestauracao = () => sincronizar();
  function encerrarRestauracao() {
    if (!restaurando) return;
    restaurando = false; clearTimeout(fimRestauracao); fimRestauracao = 0;
    win.removeEventListener("scroll", aoRolarNaRestauracao);
    GESTOS.forEach((g) => win.removeEventListener(g, encerrarRestauracao, true));
  }
  // âncora #cap-* que ficou para trás: quando a ROLAGEM do visitante leva a outro capítulo, a âncora sai do endereço
  // (replaceState, sem nova entrada). Senão o Chromium, ao voltar pelo histórico, leva a página de novo à âncora em vez
  // da posição em que o visitante saiu (medido: 2687 → 2327).
  function largarAncoraAntiga(novo: string) {
    if (/^#cap-/.test(location.hash) && location.hash !== "#cap-" + novo) history.replaceState(history.state, "", location.pathname + location.search);
  }
  function reconciliar() { const c = candidato(); if (c && c !== ativo) { mostrar(c); largarAncoraAntiga(c); } else mostrar(ativo); }

  function desmontar() {
    clearTimeout(espera); clearTimeout(reconc); espera = reconc = 0;
    encerrarRestauracao();
    cancelAnimationFrame(quadroSinc); cancelAnimationFrame(quadroTransicao); quadroSinc = quadroTransicao = 0;
    comTransicao().forEach((m) => { m.style.transition = ""; });
    obs?.disconnect(); obs = null; naFaixa.clear();
    if (montado) midias.forEach((m, k) => { delete m.dataset.ativo; m.removeAttribute("inert"); m.removeAttribute("aria-hidden"); ancoras.get(k)!.append(m); });
    montado = false; delete grade.dataset.palco; delete grade.dataset.capAtivo;
    marcar();
  }
  function montar() {
    if (montado || bloqueio || destruido) return;
    try {
      midias.forEach((m) => palcoMidia.append(m));
      montado = true; grade.dataset.palco = "ativo";
      obs = new win.IntersectionObserver((es) => {
        es.forEach((e) => ((e.isIntersecting ? naFaixa.add((e.target as HTMLElement).dataset.capitulo!) : naFaixa.delete((e.target as HTMLElement).dataset.capitulo!))));
        clearTimeout(espera);
        espera = window.setTimeout(() => { if (performance.now() >= travaAte) reconciliar(); }, 120);
      }, { rootMargin: "-40% 0px -40% 0px" });
      caps.forEach((c) => obs!.observe(c));
      semTransicao(() => mostrar(ativo)); // o indicador nasce no estado certo, sem os 120 ms
      // montagem com a página já rolada (restauração já aplicada, ou a janela cresceu até o limite do palco com a
      // página no meio do caso): o capítulo vem da geometria, sem troca cruzada; no topo nenhum está na faixa
      sincronizar();
      if (restaurando) {
        win.addEventListener("scroll", aoRolarNaRestauracao, { passive: true });
        GESTOS.forEach((g) => win.addEventListener(g, encerrarRestauracao, { capture: true, passive: true }));
        fimRestauracao = window.setTimeout(encerrarRestauracao, 1500);
        // 1º quadro: a rolagem pode ter sido devolvida sem evento próprio (mesmo valor, ou antes do ouvinte)
        quadroSinc = requestAnimationFrame(() => { quadroSinc = 0; sincronizar(); });
      }
    } catch {
      bloqueio = "erro"; grade.dataset.palcoBloqueio = "erro"; desmontar();
    }
  }
  const aplicar = () => (mq.matches && !bloqueio ? montar() : desmontar());
  function bloquear(motivo: string) { if (bloqueio) return; bloqueio = motivo; grade.dataset.palcoBloqueio = motivo; desmontar(); }

  const verModo = () => {
    const m = saidas?.dataset.saidasModo;
    if (m === "estatico" || m === "destruido") bloquear("falha-saidas");
    if (m === "modulo") clearTimeout(prazo);
  };
  if (saidas) {
    mo = new win.MutationObserver(verModo); mo.observe(saidas, { attributes: true, attributeFilter: ["data-saidas-modo"] });
    prazo = window.setTimeout(() => { if (saidas.dataset.saidasModo !== "modulo") bloquear("saidas-sem-resposta"); }, 4000);
    verModo();
  }

  const onClick = (e: MouseEvent) => {
    const a = e.currentTarget as HTMLAnchorElement, id = a.dataset.cap!, alvo = document.getElementById("cap-" + id);
    if (!alvo) return;
    e.preventDefault();
    encerrarRestauracao();
    mostrar(id);
    const parado = red.matches || document.documentElement.dataset.movimento === "pausado";
    const trava = parado ? 150 : 900;
    travaAte = performance.now() + trava;
    clearTimeout(reconc); reconc = window.setTimeout(() => { if (montado) reconciliar(); }, trava + 60);
    alvo.scrollIntoView({ behavior: parado ? "auto" : "smooth", block: "start" });
    history.replaceState(history.state, "", "#cap-" + id);
    const h = alvo.querySelector<HTMLElement>(".cap-titulo"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  };
  links.forEach((a) => a.addEventListener("click", onClick));
  mq.addEventListener?.("change", aplicar);
  aplicar();
  if (!montado) restaurando = false; // sem palco nesta montagem (tela abaixo do limite, bloqueio): não há o que restaurar
  // âncora #cap-* na carga: o capítulo pedido. Na restauração a posição devolvida manda (o endereço pode guardar uma
  // âncora antiga, de antes de o visitante seguir rolando); a âncora só vale se nenhum capítulo estiver na faixa.
  const hash = location.hash.replace("#cap-", "");
  if (midias.has(hash) && !(restaurando && montado && pelaGeometria())) {
    mostrarSemTroca(hash);
    // carga direta (ou navegação) para #cap-*: o navegador posiciona a âncora ANTES de o palco montar; a montagem
    // muda a altura dos capítulos e a faixa de leitura podia cair no capítulo seguinte (Hub → Viewer). Uma única
    // correção, síncrona, na montagem — só se o visitante ainda não mexeu e o capítulo pedido saiu da faixa.
    const alvo = document.getElementById("cap-" + hash);
    if (montado && !restaurando && !gestoDesdeACarga && alvo && pelaGeometria() !== hash) alvo.scrollIntoView({ block: "start" });
  }

  return {
    mostrar, ativo: () => ativo, montado: () => montado, bloqueio: () => bloqueio, montar: aplicar, desmontar,
    destroy() {
      destruido = true; clearTimeout(prazo); mo?.disconnect(); mo = null;
      links.forEach((a) => a.removeEventListener("click", onClick));
      mq.removeEventListener?.("change", aplicar);
      desmontar();
    },
  };
}

export function montarCaso(grade: HTMLElement): () => void {
  // ?io=0 (só na revisão privada): simula navegador sem IntersectionObserver
  const win = parametro("io") === "0"
    ? Object.assign(Object.create(window), { IntersectionObserver: undefined, matchMedia: window.matchMedia.bind(window), MutationObserver: window.MutationObserver })
    : window;
  const c = createAtlasCaso(grade, { win });
  (window as unknown as { __atlas: unknown }).__atlas = c;
  return () => c.destroy();
}
