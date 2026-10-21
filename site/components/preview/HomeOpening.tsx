"use client";

import { useTranslation } from "@/lib/i18n";

import type { JourneyStep } from "@/lib/journey-content";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { MriSource } from "@/lib/mri";
import type { MotionPackageInfo } from "@/lib/motion-contract";
import { PREVIEW_COPY, type PreviewConfig } from "@/lib/home-preview";
import { useMotionPaused } from "@/lib/motion-prefs";
import { usePrefersReducedMotion } from "../motion/usePrefersReducedMotion";
import { Journey } from "../journey/Journey";
import { ArrowDown, ArrowRight } from "../icons";
import styles from "./HomeOpening.module.css";

/* ───────────────────────────────────────────────────────────────────────────
 * PROPOSTA EXPERIMENTAL (/previa) — home com a escultura do Motion (home-v2 0.2.1-draft) e
 * passagem até a MESMA cena da jornada (0.4.1-exp).
 *
 * Dois layouts, decididos ANTES da 1ª pintura pelo head script (app/intro-script.ts):
 *  · abertura (JS, sem movimento reduzido, sem pausa salva): a jornada começa no topo da
 *    página; o hero é uma camada por cima da trilha. O quadro sticky da jornada já está no
 *    lugar final; a escultura (canvas do Motion, sticky) cobre-o e, na passagem, abre a
 *    janela sobre ele. Uma pista ("runway") na trilha dá a passagem; depois dela, o mesmo
 *    retângulo dá o progress das quatro etapas.
 *  · estático (sem JS, movimento reduzido, pausa salva): hero com o poster oficial e a
 *    jornada em fluxo normal.
 *
 * Ponte com o módulo (setLayout): art = retângulo REAL do slot do poster; target = retângulo
 * REAL do quadro; ready = a cena da jornada tem conteúdo; arc = data-start-arc da própria cena.
 * Uma só fonte de progresso (Journey → onPassage); nenhum controlador de rolagem extra.
 * ─────────────────────────────────────────────────────────────────────────── */

type Rect = { x: number; y: number; w: number; h: number; r?: number };
type Arc = { cx: number; cy: number; r: number; [k: string]: unknown };
type Sculpture = {
  setPassage(p: number): void;
  setLayout(l: { art?: Rect | null; target?: Rect | null; ready?: boolean; arc?: Arc | null; composicao?: Composicao }): void;
  setPaused(v: boolean): void;
  setReducedMotion(v: boolean): void;
  setIntroTime(ms: number | null): void;
  getComposition(): { layout: string; R0: number; arcR: number; cx: number; cy: number; art: Rect } | null;
  destroy(): void;
};
type SculptureModule = {
  VERSION?: string;
  createHomeSculpture: (el: HTMLElement, o: Record<string, unknown>) => Sculpture;
};

/** Grupos da jornada liberados (foco/clique/leitura) a partir deste p, com a cena revelada. */
const REVEAL_P = 0.95;
/** A janela do módulo abre a partir de p = 0,26 (antes disso o quadro está inteiramente coberto). */
const WINDOW_P = 0.26;
/** A abertura só toca se o módulo chegar cedo (mesma regra do driver do Motion). */
const INTRO_DEADLINE_MS = 1500;
/** Cor da seção da jornada sob o quadro (o quadro coberto “some” no fundo, sem caixa vazia). */
const COVER_COLOR = "#0d1b2a";

/** groups: grupos da jornada inert · scene: quadro inteiramente coberto · loading: passagem
 *  concluída mas a cena ainda não foi revelada (RM em carregamento) — controles ocultos + aviso. */
type Cover = { groups: boolean; scene: boolean; loading: boolean };


/** Composição do desenho no slot (montanha ≥ 1.1.0-03d2; contrato EDITORIAL-03D2-MOTION.md §3.1 e §6).
 *  · duas colunas (≥ 1200 px, declarado pelo CSS): "centro" — a massa da montanha fica na altura do bloco de texto.
 *  · abaixo: "topo" (= 1.0.0-03d2, pixel a pixel).
 *  · celular baixo (o slot passa da dobra): alturaUtil = altura da 1ª tela abaixo do topo do slot NO DOCUMENTO.
 *    O .front não é fixo, então ar.top + scrollY não muda com a rolagem: o valor depende só da tela. Só quando a
 *    dobra corta o desenho e ao menos metade do slot está na 1ª tela (num celular deitado a arte já fica abaixo).
 *  Módulos anteriores ignoram a opção. */
type Composicao = { alinhar: "topo" | "centro"; alturaUtil?: number };
function composicaoDoSlot(slot: HTMLElement | null | undefined, ar: DOMRect | null | undefined): Composicao {
  // Quem decide é o layout: o CSS da composição editorial (duas colunas, ≥ 1200 px) declara
  // --opening-composicao: centro no slot. Rotas sem esse layout seguem em "topo".
  if (slot && getComputedStyle(slot).getPropertyValue("--opening-composicao").trim() === "centro") return { alinhar: "centro" };
  if (!ar || ar.height <= 0) return { alinhar: "topo" };
  const visivel = Math.floor(window.innerHeight - (ar.top + window.scrollY));
  // Em "topo" o desenho termina a ≈ 72 % da altura do slot (Motion: 390 × 844, slot 534 + 312, sopé em ≈ 759); só
  // quando a dobra corta antes disso (folga: 75 %) a montanha é recomposta na altura visível.
  return visivel < ar.height * 0.75 && visivel >= ar.height / 2 ? { alinhar: "topo", alturaUtil: visivel } : { alinhar: "topo" };
}

export function HomeOpening({
  motionPackage,
  mri,
  config,
  navMode = "native",
  note = "Escultura conceitual, não anatomia · plataforma em validação científica",
  scrollInvite = false,
  journeyCompact = false,
  journeySafeIntro = false,
  revealOnChange = false,
  journeySteps,
  journeyIntro,
  coverColor = COVER_COLOR,
  titleLines,
  titleSecondary,
  introModuloMs,
}: {
  motionPackage: MotionPackageInfo | null;
  mri: MriSource;
  config: PreviewConfig | null;
  /** Entrada nos links para #jornada: "native" (smooth do navegador + conferência, base /previa) ou
   *  "eased" (propostas /previa/a e /b: rolagem explícita de 1000 ms, 3t²−2t³, por frame). */
  navMode?: "native" | "eased";
  /** Linha de estado sob as ações. Padrão = texto da /previa e das propostas A/B; a versão
   *  conjunta (/previa/refinada) passa só o estado científico, sem a explicação da escultura. */
  note?: string;
  /** /previa/refinada: convite discreto "Role para explorar" na base da 1ª tela, sobre a arte. */
  scrollInvite?: boolean;
  /** /previa/refinada: no celular, etapas da jornada sem repetir o resumo ativo (texto em "Ler mais"). */
  journeyCompact?: boolean;
  /** /previa/refinada: "Como funciona" abaixo do cabeçalho fixo na chegada (área segura). */
  journeySafeIntro?: boolean;
  /** /previa/refinada: só repassa ao Site uma revelação que MUDOU. O módulo regrava `data-reveal` a
   *  cada quadro (mesmo valor); o MutationObserver dispara mesmo assim e a passada do Site chamava
   *  setLayout + setPassage de novo, fazendo o módulo redesenhar ~30 vezes por segundo parado, sem
   *  rolagem (medido na 0.6.0 e na 0.2.1). Com esta opção o observador compara o valor antigo. */
  revealOnChange?: boolean;
  /** Duração da abertura do PRÓPRIO módulo (ms), contada de quando ele começa. Com ela, o fim da abertura do
   *  Site por TEMPO (1400 ms após a navegação) não corta a abertura do módulo: ela termina sozinha nesse prazo
   *  (rede de segurança: setIntroTime(null) ao fim dele). Interação, pausa, resize ou movimento reduzido continuam
   *  concluindo na hora. Sem a opção (rotas de comparação), o comportamento anterior. 03D2: 900 ms. */
  introModuloMs?: number;
  /** Textos das etapas da Jornada (padrão do componente se ausente). */
  journeySteps?: JourneyStep[];
  journeyIntro?: string;
  /** Cor com que o módulo da escultura cobre o quadro da jornada (= fundo da seção sob o quadro).
   *  Experimento brand-sinal-v1: gray-5 #111111. */
  coverColor?: string;
  /** Título do hero (linhas). Padrão: PREVIEW_COPY.titleLines. brand-sinal-v1: a mensagem do Sinal. */
  titleLines?: readonly string[];
  /** Índice da linha em tom secundário (data-tom="secundario"). */
  titleSecondary?: number;
}) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLElement>(null);
  const sculpture = useRef<Sculpture | null>(null);
  const passage = useRef(0);
  const revealOnChangeRef = useRef(revealOnChange);
  revealOnChangeRef.current = revealOnChange;
  const frameReq = useRef(0);
  const coverRef = useRef<Cover>({ groups: false, scene: false, loading: false });
  const [cover, setCover] = useState<Cover>({ groups: false, scene: false, loading: false });
  const waitRef = useRef<HTMLParagraphElement>(null);
  const armed = useRef(false);
  // Falha definitiva da RM (cena estática informou erro): aviso no quadro, sem espera.
  const failedRef = useRef(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const paused = useMotionPaused();
  const reduced = usePrefersReducedMotion();
  const latest = useRef({ paused, reduced, navMode });
  latest.current = { paused, reduced, navMode };

  const openingOn = () => !!document.getElementById("ararat-opening");

  /** Estado da cena da jornada: pronta (conteúdo real ou aviso local) e arco inicial (0.4.1-exp). */
  const readScene = useCallback(() => {
    const stage = document.querySelector<HTMLElement>("#jornada [data-motion-status]");
    const status = stage?.dataset.motionStatus;
    const node = document.querySelector<HTMLElement>("#jornada .ararat-journey");
    if (status === "ready" && node) {
      let arc: Arc | null = null;
      try {
        arc = node.dataset.startArc ? (JSON.parse(node.dataset.startArc) as Arc) : null;
      } catch {
        arc = null;
      }
      return { ready: node.dataset.loaded === "true", arc, failed: false };
    }
    if (status === "loading") return { ready: false, arc: null, failed: false };
    // Sem módulo da jornada (pacote ausente ou falhou): a cena estática do Site, quando a RM
    // chegou (ou o aviso local, se falhou), é conteúdo real — revela sem arco de entrega.
    const st = document.querySelector("#jornada [data-layout] svg[data-mri-state]")?.getAttribute("data-mri-state");
    return { ready: st === "loaded" || st === "error", arc: null, failed: st === "error" };
  }, []);

  /** Foco que precisaria ficar atrás da escultura vai para um destino visível e coerente. */
  const rescueFocus = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active || !active.closest("#jornada [data-opening=stage-col], #jornada [data-opening=steps-col]")) return;
    const visible = (el: HTMLElement | null) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
    };
    const candidates = [
      document.querySelector<HTMLElement>('header nav a[href="#jornada"]:not([class*="cta"])'),
      document.querySelector<HTMLElement>('header a[href="#inicio"]'),
    ];
    const target = candidates.find(visible);
    target?.focus({ preventScroll: true });
  }, []);

  /** Aviso de carregamento posicionado sobre o espaço (preservado) dos controles da jornada. */
  const placeWaitNote = useCallback(() => {
    const note = waitRef.current;
    const controls = document.querySelector<HTMLElement>("#jornada [data-journey-controls]");
    if (!note || !controls) return;
    // Sobre o trilho das etapas (o controle principal). No celular os controles usam
    // display: contents e o botão de pausa fica depois do resumo — o aviso não cobre o resumo.
    const rail = controls.querySelector<HTMLElement>("[role=group]") ?? controls;
    const r = rail.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const { left, top, right, bottom } = r;
    note.style.setProperty("--wait-x", `${left.toFixed(1)}px`);
    note.style.setProperty("--wait-y", `${top.toFixed(1)}px`);
    note.style.setProperty("--wait-w", `${(right - left).toFixed(1)}px`);
    note.style.setProperty("--wait-h", `${(bottom - top).toFixed(1)}px`);
  }, []);

  /** Uma passada: CSS (passagem), módulo (setLayout + setPassage) e estado de cobertura. */
  const update = useCallback(() => {
    frameReq.current = 0;
    const root = rootRef.current;
    const host = hostRef.current;
    const slot = slotRef.current;
    if (!root) return;
    const p = passage.current;
    root.style.setProperty("--opening-p", p.toFixed(4));
    if (!openingOn()) return;

    const scene = readScene();
    root.dataset.scene = scene.failed ? "failed" : scene.ready ? "ready" : "waiting";
    if (scene.failed !== failedRef.current) {
      failedRef.current = scene.failed;
      setSceneFailed(scene.failed);
    }
    const frame = document.querySelector<HTMLElement>("#jornada [data-layout]");
    let reveal = "covered";
    if (host && frame) {
      const hr = host.getBoundingClientRect();
      const fr = frame.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(frame).borderTopLeftRadius) || 12;
      const target: Rect = { x: fr.left - hr.left, y: fr.top - hr.top, w: fr.width, h: fr.height, r: radius };
      // Contorno do quadro para o fundo com “janela” (CSS): fora do quadro, cobre a jornada até o fim.
      root.style.setProperty("--frame-x", `${target.x.toFixed(1)}px`);
      root.style.setProperty("--frame-y", `${target.y.toFixed(1)}px`);
      root.style.setProperty("--frame-w", `${target.w.toFixed(1)}px`);
      root.style.setProperty("--frame-h", `${target.h.toFixed(1)}px`);
      root.style.setProperty("--frame-r", `${radius}px`);
      const s = sculpture.current;
      if (s && slot) {
        const ar = slot.getBoundingClientRect();
        s.setLayout({
          art: { x: ar.left - hr.left, y: ar.top - hr.top, w: ar.width, h: ar.height },
          target,
          ready: scene.ready,
          arc: scene.arc,
          composicao: composicaoDoSlot(slot, ar),
        });
        s.setPassage(p);
        reveal = host.querySelector("canvas")?.dataset.reveal ?? "covered";
        root.dataset.geometry = `${Math.round(hr.width)}x${Math.round(hr.height)}:art=${Math.round(ar.width)}x${Math.round(ar.height)}`;
      }
    }

    // Cobertura efetiva (não só o progresso bruto): com o canvas, vale o estado de revelação
    // do módulo (atraso da RM mantém coberto); sem ele, o fundo em CSS cobre até p ≈ 0,86–1.
    const canvasOn = root.dataset.sculpture === "canvas";
    const revealed = canvasOn ? reveal === "ready" : scene.ready;
    const next: Cover = {
      groups: p < REVEAL_P || !revealed,
      scene: canvasOn ? p <= WINDOW_P || reveal === "covered" : p < 0.86 || !scene.ready,
      // Estado real de carregamento (sem temporizador): a passagem terminou, mas o Motion ainda
      // não informou a revelação concluída (data-reveal ≠ ready) — ou, sem canvas, a cena não está
      // pronta. Uma falha definitiva da RM conta como pronta (aviso local da cena), então não há
      // espera indefinida.
      loading: p >= REVEAL_P && !revealed,
    };
    if (next.loading) placeWaitNote();
    const prev = coverRef.current;
    if (next.groups !== prev.groups || next.scene !== prev.scene || next.loading !== prev.loading) {
      if (next.groups && !prev.groups) rescueFocus(); // antes de aplicar o inert
      coverRef.current = next;
      setCover(next); // data-cover é escrito depois do commit (inert, controles e aviso já aplicados)
    }
  }, [readScene, rescueFocus, placeWaitNote]);

  const schedule = useCallback(() => {
    if (!frameReq.current) frameReq.current = requestAnimationFrame(update);
  }, [update]);

  const onPassage = useCallback(
    (p: number) => {
      passage.current = p;
      update(); // já vem num rAF do Journey (fonte única)
    },
    [update],
  );

  // Estado inicial da cobertura + observadores da cena (carregamento tardio, arco, falhas).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!openingOn()) {
      root.dataset.cover = "static"; // layout estático: nada é coberto, nada fica inert
      return;
    }
    coverRef.current = { groups: true, scene: true, loading: false };
    root.dataset.cover = "covered"; // antes da 1ª passada: tira a proteção pré-hidratação
    armed.current = true;
    setCover({ groups: true, scene: true, loading: false });
    const section = document.getElementById("jornada");
    const mo = new MutationObserver(schedule);
    if (section)
      mo.observe(section, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["data-loaded", "data-start-arc", "data-motion-status", "data-mri-state"],
      });
    window.addEventListener("resize", schedule);
    void document.fonts?.ready.then(schedule);
    schedule();
    // Hero: foco que cai num controle esmaecido pela passagem leva a página ao início (visível).
    const content = root.querySelector<HTMLElement>("[data-opening=content]");
    const onFocusIn = (e: FocusEvent) => {
      // Só foco de teclado (focus-visible): o foco que o clique dá ao link não desloca a página
      // (um 2º clique no CTA parte da posição corrente).
      const t = e.target as Element | null;
      if (t?.matches?.(":focus-visible") === false) return;
      if (passage.current > 0.02) window.scrollTo({ top: 0, behavior: "instant" });
    };
    content?.addEventListener("focusin", onFocusIn);

    // Links para #jornada ("Entre na imagem", "Explorar a jornada", "Jornada"): navegação feita
    // aqui, não pela âncora nativa. Motivo (verificado): com `scroll-behavior: smooth`, a rolagem
    // da âncora se perde quando outra rolagem suave ainda está em curso (ex.: a rolagem que o
    // próprio foco por Tab provoca) — a página fica perto do topo, a jornada coberta (inert) e o
    // ponto de partida do Tab já foi para #jornada, então o Tab seguinte pula para Explicabilidade.
    // Aqui: destino calculado (fim da passagem = etapa Imagem), rolagem que substitui qualquer
    // outra em curso, conferência no fim (scrollend) e foco de chegada na própria seção.
    let nav: { dest: number; cancelled: boolean; timer: number; t0: number } | null = null;
    const destination = () => {
      const track = section?.querySelector<HTMLElement>("[data-journey-variant]");
      if (!track) return null;
      const desk = section!.querySelector<HTMLElement>("[data-opening=runway-desktop]")?.offsetHeight ?? 0;
      let end = desk;
      if (!desk) {
        const mob = section!.querySelector<HTMLElement>("[data-opening=runway-mobile]")?.offsetHeight ?? 0;
        const col = section!.querySelector<HTMLElement>("[data-opening=stage-col]");
        const top = col && getComputedStyle(col).position === "sticky" ? parseFloat(getComputedStyle(col).top) || 0 : 0;
        end = Math.max(0, mob - top);
      }
      return Math.round(window.scrollY + track.getBoundingClientRect().top + end);
    };
    const settle = (e?: Event) => {
      if (!nav) return;
      // scrollend de uma rolagem anterior (substituída agora) não encerra a navegação
      if (e && performance.now() - nav.t0 < 150) return;
      window.clearTimeout(nav.timer);
      const { dest, cancelled } = nav;
      nav = null;
      if (!cancelled && Math.abs(window.scrollY - dest) > 2) window.scrollTo({ top: dest, behavior: "instant" });
    };
    // ── Modo "eased" (propostas): rolagem explícita, 1000 ms, y = y0 + (dest − y0)·(3t² − 2t³).
    // Cada quadro escreve a posição real da página (scrollTo instantâneo); o Journey a lê no próprio
    // listener de rolagem e alimenta escultura e jornada — não há relógio paralelo da cena. Nada de
    // smooth nativo nem de conferência posterior: interrompida, a rolagem fica onde a pessoa deixou.
    const NAV_MS = 1000;
    const ease = (t: number) => t * t * (3 - 2 * t);
    let run: { raf: number; from: number; t0: number; last: number } | null = null;
    const endRun = (state: "concluida" | "interrompida" | "direta") => {
      if (run) cancelAnimationFrame(run.raf);
      const t0 = run?.t0;
      run = null;
      root.dataset.nav = state;
      if (t0 != null && state === "concluida") root.dataset.navMs = String(Math.round(performance.now() - t0));
    };
    const stepRun = (now: number) => {
      if (!run) return;
      // Outro agente rolou desde o último quadro (arraste da barra, teclado, foco…): a pessoa manda.
      // Nos primeiros 120 ms, o resto de uma rolagem suave nativa já cancelada ainda pode mover a
      // página 1–2 quadros (medido no Chromium): não conta como interrupção.
      if (now - run.t0 > 120 && Math.abs(window.scrollY - run.last) > 2) return endRun("interrompida");
      const dest = destination();
      if (dest == null) return endRun("interrompida");
      const t = Math.min(1, Math.max(0, (now - run.t0) / NAV_MS));
      window.scrollTo({ top: Math.round(run.from + (dest - run.from) * ease(t)), behavior: "instant" });
      run.last = window.scrollY;
      if (t < 1) run.raf = requestAnimationFrame(stepRun);
      else endRun("concluida");
    };
    const startRun = (dest: number) => {
      if (run) cancelAnimationFrame(run.raf); // clique repetido: cancela e parte da posição corrente
      const { paused: ps, reduced: rm } = latest.current;
      if (ps || rm) {
        run = null;
        window.scrollTo({ top: dest, behavior: "instant" }); // pausa geral / movimento reduzido: direto
        root.dataset.nav = "direta";
        return;
      }
      // Interrompe qualquer rolagem suave nativa ainda em curso (ex.: a do foco por Tab): a partir
      // daqui só esta navegação escreve a posição — e qualquer outra mudança é da pessoa.
      window.scrollTo({ top: window.scrollY, behavior: "instant" });
      const y = window.scrollY;
      run = { raf: 0, from: y, t0: performance.now(), last: y };
      root.dataset.nav = "andamento";
      delete root.dataset.navMs;
      run.raf = requestAnimationFrame(stepRun);
    };

    const interrupt = () => {
      if (nav) nav.cancelled = true; // a pessoa assumiu a rolagem: não corrigir
      if (run) endRun("interrompida");
    };
    const onNavClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href="#jornada"]');
      if (!link || !section || !openingOn()) return;
      const dest = destination();
      if (dest == null) return; // sem medida: fica a âncora nativa
      e.preventDefault();
      if (location.hash !== "#jornada") history.pushState(history.state, "", "#jornada");
      if (latest.current.navMode === "eased") {
        if (nav) window.clearTimeout(nav.timer);
        nav = null; // sem conferência posterior neste modo (nada puxa a pessoa de volta)
        startRun(dest);
      } else {
        const smooth = !latest.current.reduced && getComputedStyle(document.documentElement).scrollBehavior === "smooth";
        if (nav) window.clearTimeout(nav.timer);
        nav = { dest, cancelled: false, t0: performance.now(), timer: window.setTimeout(() => settle(), smooth ? 1600 : 50) };
        window.scrollTo({ top: dest, behavior: smooth ? "smooth" : "instant" });
      }
      // Chegada: foco na seção (fora dos grupos inert). Durante a espera da RM o Tab continua sem
      // entrar nos controles; revelada a cena, o Tab seguinte entra neles. Nada é focado depois.
      if (!section.hasAttribute("tabindex")) section.setAttribute("tabindex", "-1");
      section.focus({ preventScroll: true });
    };
    document.addEventListener("click", onNavClick);
    window.addEventListener("scrollend", settle);
    for (const ev of ["wheel", "touchstart", "pointerdown"]) window.addEventListener(ev, interrupt, { passive: true });
    const onKey = (e: KeyboardEvent) => {
      // Tab também: a pessoa já foi para outro lugar (o foco que ela move manda na rolagem)
      if (["Tab", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) interrupt();
    };
    window.addEventListener("keydown", onKey);
    const onResizeNav = () => {
      if (run) endRun("interrompida");
    };
    window.addEventListener("resize", onResizeNav);

    return () => {
      window.removeEventListener("resize", onResizeNav);
      if (run) cancelAnimationFrame(run.raf);
      run = null;
      mo.disconnect();
      window.removeEventListener("resize", schedule);
      content?.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("click", onNavClick);
      window.removeEventListener("scrollend", settle);
      for (const ev of ["wheel", "touchstart", "pointerdown"]) window.removeEventListener(ev, interrupt);
      window.removeEventListener("keydown", onKey);
      if (nav) window.clearTimeout(nav.timer);
      if (frameReq.current) cancelAnimationFrame(frameReq.current);
      frameReq.current = 0;
    };
  }, [schedule]);

  // Módulo da escultura (pacote experimental), só no layout de abertura.
  useEffect(() => {
    const root = rootRef.current;
    const host = hostRef.current;
    if (!root || !host) return;
    if (!openingOn() || !config) {
      root.dataset.sculpture = "estatico";
      return;
    }
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let canvasMo: MutationObserver | null = null;
    let headMo: MutationObserver | null = null;
    let introTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const mod = (await import(
          /* webpackIgnore: true */ /* turbopackIgnore: true */ config.sculptureModule
        )) as SculptureModule;
        if (cancelled) return;
        if (typeof mod.createHomeSculpture !== "function") throw new Error("createHomeSculpture ausente");
        const introOn = !!document.getElementById("ararat-intro") && performance.now() < INTRO_DEADLINE_MS;
        const introInicio = performance.now();
        const hr = host.getBoundingClientRect();
        const frame = document.querySelector<HTMLElement>("#jornada [data-layout]");
        const fr = frame?.getBoundingClientRect();
        const ar = slotRef.current?.getBoundingClientRect();
        const scene = readScene();
        sculpture.current = mod.createHomeSculpture(host, {
          reducedMotion: latest.current.reduced,
          // Luz ambiente da 1ª dobra (montanha 1.2.0-03d2): o módulo decide quando corre (p = 0, depois da abertura,
          // visível, sem pausa, sem movimento reduzido) e para o laço fora disso. O Site só liga a opção do pacote;
          // sem ela, a opção NÃO é passada (pacotes de outras rotas mantêm o próprio padrão).
          ...(config.ambient ? { ambient: true } : {}),
          paused: latest.current.paused,
          intro: introOn,
          coverColor,
          // 1ª pintura já com a geometria real (sem quadro a descoberto nem pose provisória)
          art: ar ? { x: ar.left - hr.left, y: ar.top - hr.top, w: ar.width, h: ar.height } : null,
          target: fr ? { x: fr.left - hr.left, y: fr.top - hr.top, w: fr.width, h: fr.height, r: 12 } : null,
          ready: scene.ready,
          arc: scene.arc,
          composicao: composicaoDoSlot(slotRef.current, ar),
        });
        const canvas = host.querySelector("canvas");
        if (!canvas || canvas.dataset.renderer === "none") throw new Error("canvas indisponível");
        root.dataset.sculptureVersion = canvas.dataset.version ?? mod.VERSION ?? "";
        update();
        // Poster → canvas só depois de o canvas ter sido composto (2 quadros): sem lacuna.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (cancelled) return;
            root.dataset.sculpture = "canvas";
            update();
          }),
        );
        // Revelação do módulo (covered → opening → ready, READY_MS do próprio módulo).
        canvasMo = new MutationObserver((records) => {
          if (!revealOnChangeRef.current || records.some((r) => r.oldValue !== canvas.dataset.reveal)) schedule();
        });
        canvasMo.observe(canvas, { attributes: true, attributeFilter: ["data-reveal"], attributeOldValue: true });
        if (introOn) {
          headMo = new MutationObserver(() => {
            if (!document.getElementById("ararat-intro")) {
              headMo?.disconnect();
              // Fim por tempo (intro-script marca o motivo): deixa o módulo completar o próprio gesto.
              const porTempo = (window as Window & { __araratIntroFim?: string }).__araratIntroFim === "tempo";
              const resta = introModuloMs && porTempo ? introInicio + introModuloMs - performance.now() : 0;
              if (resta > 0) introTimer = setTimeout(() => sculpture.current?.setIntroTime(null), resta);
              else sculpture.current?.setIntroTime(null);
            }
          });
          headMo.observe(document.head, { childList: true });
        } else {
          sculpture.current.setIntroTime(null);
        }
        ro = new ResizeObserver(schedule);
        ro.observe(host);
        if (slotRef.current) ro.observe(slotRef.current);
      } catch (error) {
        if (cancelled) return;
        console.warn("[ARARAT] Escultura indisponível; poster mantido.", error);
        try {
          sculpture.current?.destroy();
        } catch {}
        sculpture.current = null;
        root.dataset.sculpture = "falhou";
        update();
      }
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      canvasMo?.disconnect();
      headMo?.disconnect();
      clearTimeout(introTimer);
      try {
        sculpture.current?.destroy();
      } catch {}
      sculpture.current = null;
    };
  }, [config, readScene, schedule, update, introModuloMs]);

  // Estado público de cobertura só depois que o React aplicou inert/controles/aviso no DOM:
  // quem observa data-cover (testes, CSS) nunca vê "revealed" com os controles ainda presos.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !armed.current) return; // só depois de a ponte assumir (layout de abertura)
    root.dataset.cover = cover.loading ? "loading" : cover.groups ? "covered" : "revealed";
  }, [cover]);

  useEffect(() => {
    sculpture.current?.setPaused(paused);
  }, [paused]);
  useEffect(() => {
    sculpture.current?.setReducedMotion(reduced);
  }, [reduced]);

  const c = PREVIEW_COPY;
  const vars = config
    ? ({
        "--art-ratio-wide": `${config.posterDesktop.areaW} / ${config.posterDesktop.areaH}`,
        "--art-ratio-narrow": `${config.posterMobile.areaW} / ${config.posterMobile.areaH}`,
      } as CSSProperties)
    : undefined;
  return (
    <div ref={rootRef} className={styles.root} data-opening="root" data-preview-version={config?.version} style={vars}>
      <section className={styles.layer} data-opening="layer" id="inicio" aria-labelledby="hero-title">
        {/* Fundo + escultura: presos à tela durante a passagem (só no layout de abertura). */}
        <div className={styles.sticky} data-opening="sticky" aria-hidden="true">
          <div className={styles.backdrop} data-opening="backdrop" />
          <div className={styles.surround} data-opening="surround" />
          <div ref={hostRef} className={styles.host} />
        </div>

        <div className={styles.front} data-opening="front">
          <div className={`wrap ${styles.content}`} data-opening="content">
            <p className={`eyebrow ${styles.eyebrow}`}>{t(c.eyebrow)}</p>
            <h1 id="hero-title" className={styles.title}>
              {(titleLines ?? c.titleLines).map((line, i, all) => (
                <span key={line} className={styles.line} style={{ "--i": i } as CSSProperties} data-tom={i === titleSecondary ? "secundario" : undefined}>
                  {t(line)}
                  {i < all.length - 1 ? " " : ""}
                </span>
              ))}
            </h1>
            <p className={styles.description}>{t(c.description)}</p>
            <div className={styles.actions}>
              <a href={c.primary.href} className="btn btn-gold" data-arrow="down">
                {t(c.primary.label)}
                <ArrowDown />
              </a>
              <a href={c.secondary.href} className="btn btn-ghost">
                {t(c.secondary.label)}
                <ArrowRight />
              </a>
            </div>
            {/* Estado científico (documentos atuais): linha discreta sob as ações, fora da arte. */}
            <p className={`ill-note ${styles.note}`} data-opening="note">
              {t(note)}
            </p>
          </div>

          {scrollInvite && (
            <p className={styles.invite} data-opening="invite" aria-hidden="true">
              <span>{t("Role para explorar")}</span>
              <span className={styles.inviteLine} />
            </p>
          )}

          {/* Área da arte (slot): poster oficial do Motion na proporção da área para a qual foi
              gerado; o canvas assume exatamente aqui (art = este retângulo). */}
          <div className={styles.art} aria-hidden="true">
            <picture ref={slotRef} className={styles.picture} data-opening="slot">
              {/* Variante desenhada na largura do slot (traço = canvas), 1x/2x pela densidade. */}
              {config?.posterSources.map((s) => <source key={s.media} media={s.media} srcSet={s.srcSet} />)}
              {config && (
                <img
                  src={config.posterDesktop.src}
                  alt={t("")}
                  className={styles.poster}
                  data-opening="poster"
                  decoding="async"
                  fetchPriority="high"
                />
              )}
            </picture>
          </div>
        </div>
      </section>

      <Journey
        motionPackage={motionPackage}
        mri={mri}
        variant="opening"
        onPassage={onPassage}
        covered={cover.groups}
        sceneCovered={cover.scene}
        controlsWaiting={cover.loading}
        frameNote={sceneFailed ? "Imagem de RM indisponível no momento" : null}
        compactSteps={journeyCompact}
        safeIntro={journeySafeIntro}
        steps={journeySteps}
        introText={journeyIntro}
      />

      {/* Aviso de carregamento tardio: fora dos grupos inert (legível por tecnologia assistiva),
          fixo sobre o espaço dos controles ocultos. Região de status sempre montada; o texto só
          existe enquanto a cena não foi revelada. */}
      <p ref={waitRef} className={styles.wait} role="status" aria-live="polite" data-opening="wait" data-active={cover.loading || undefined}>
        {t(cover.loading ? "Carregando imagem de RM…" : "")}
      </p>
    </div>
  );
}
