"use client";

import { useTranslation } from "@/lib/i18n";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MriSource } from "@/lib/mri";
import { JOURNEY_STEPS, type JourneyStep } from "@/lib/journey-content";
import {
  JOURNEY_STOPS,
  normalizeProgress,
  stepIndexFromProgress,
  type MotionPackageInfo,
} from "@/lib/motion-contract";
import { useJourneyMotion } from "../motion/useJourneyMotion";
import { setMotionPaused, useMotionPaused } from "@/lib/motion-prefs";
import { RevealWords } from "../text/RevealWords";
import { ActiveStepSummary } from "./ActiveStepSummary";
import { useMediaQuery, usePrefersReducedMotion } from "../motion/usePrefersReducedMotion";
import { JourneyControls } from "./JourneyControls";
import { JourneyStage } from "./JourneyStage";
import { JourneySteps } from "./JourneySteps";
import styles from "./Journey.module.css";

const DESKTOP_QUERY = "(min-width: 960px)";

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

/**
 * Seção #jornada. O site é dono do progress [0,1], dos controles e dos textos
 * (contrato v1). Em desktop, o progresso acompanha a rolagem de um trecho
 * limitado com arte sticky; em mobile, a leitura é natural e os controles
 * respondem ao toque. Nenhum listener captura wheel ou impede a rolagem.
 */
type JourneyProps = {
  motionPackage: MotionPackageInfo | null;
  mri: MriSource;
  /**
   * "opening" (só na rota experimental /previa): a jornada começa no topo da página e
   * uma pista (runway) antes das etapas recebe a passagem da home. A MESMA cena e o
   * MESMO quadro servem à passagem e às etapas. O padrão ("default") é o da home "/".
   */
  variant?: "default" | "opening";
  /** Progresso da passagem (0–1), medido no mesmo retângulo que dá o progress das etapas. */
  onPassage?: (p: number) => void;
  /**
   * Variante "opening": grupos da jornada visualmente cobertos pela escultura (estado efetivo
   * de revelação, informado pelo HomeOpening). Cobertos ficam `inert` — sem foco, clique nem
   * leitura assistiva —, mas continuam montados e recebendo progress.
   */
  covered?: boolean;
  /** Quadro inteiramente coberto (janela ainda fechada): o ambiente da cena pausa. */
  sceneCovered?: boolean;
  /** Passagem concluída com a cena ainda carregando: controles ocultos (espaço preservado). */
  controlsWaiting?: boolean;
  /** Falha definitiva da RM (só /previa): aviso no quadro. */
  frameNote?: string | null;
  /** /previa/refinada: no celular, o texto longo de cada etapa vai para "Ler mais" (o resumo ativo
   *  junto do quadro já o mostra); no desktop nada muda. */
  compactSteps?: boolean;
  /** /previa/refinada: o início da coluna ("Como funciona") começa abaixo do cabeçalho fixo. */
  safeIntro?: boolean;
  /** Textos das etapas (mesmos ids/títulos). Padrão = JOURNEY_STEPS; só a /previa/refinada passa outra versão. */
  steps?: JourneyStep[];
  /** Nota conceitual específica da rota, sem alterar a cena ou o progresso. */
  introText?: string;
};

export function Journey({ motionPackage, mri, variant = "default", onPassage, covered = false, sceneCovered = false, controlsWaiting = false, frameNote = null, compactSteps = false, safeIntro = false, steps = JOURNEY_STEPS, introText }: JourneyProps) {
  const { t } = useTranslation();
  const opening = variant === "opening";
  const isDesktop = useMediaQuery(DESKTOP_QUERY, true);
  const isNarrow = useMediaQuery("(max-width: 599px)", false);
  const reducedMotion = usePrefersReducedMotion();
  const [progress, setProgressState] = useState(0);
  // Pausa global (header e controle da jornada compartilham o mesmo estado).
  const paused = useMotionPaused();
  // Ambiente da jornada também pausa fora da tela ou com a aba oculta.
  const [onScreen, setOnScreen] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [nearViewport, setNearViewport] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const motionContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  // Pistas da passagem (variante "opening"): altura 0 até o layout de abertura ser ativado.
  const runwayDesktopRef = useRef<HTMLDivElement>(null);
  const runwayMobileRef = useRef<HTMLDivElement>(null);
  const onPassageRef = useRef(onPassage);
  onPassageRef.current = onPassage;

  const setProgress = useCallback((value: number) => {
    const next = normalizeProgress(value, progressRef.current);
    progressRef.current = next;
    setProgressState(next);
  }, []);

  // Carregamento tardio: só aproxima o módulo quando a seção está perto.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearViewport(true);
          io.disconnect();
        }
      },
      { rootMargin: "25% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setOnScreen(entries.some((e) => e.isIntersecting)));
    io.observe(el);
    const onVis = () => setTabHidden(document.visibilityState === "hidden");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Desktop: progresso derivado da rolagem do trecho (listener passivo).
  // Variante "opening": o mesmo retângulo dá a passagem (0–1 na pista) e, depois dela,
  // o progress das etapas (0–1 no restante) — uma única fonte, sem salto na entrega.
  const runwayPx = useCallback(() => {
    const el = isDesktop ? runwayDesktopRef.current : runwayMobileRef.current;
    if (!el) return 0;
    if (isDesktop) return el.offsetHeight;
    // Celular/tablet: o quadro fica preso a `top` (cabeçalho + 8 px) e se solta quando a pista
    // acaba menos esse deslocamento — a passagem termina exatamente aí (quadro no lugar).
    const col = el.parentElement?.querySelector<HTMLElement>("[data-opening=stage-col]");
    const top = col && getComputedStyle(col).position === "sticky" ? parseFloat(getComputedStyle(col).top) || 0 : 0;
    return Math.max(0, el.offsetHeight - top);
  }, [isDesktop]);

  useEffect(() => {
    if (!opening) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const track = trackRef.current;
      if (!track) return;
      const runway = runwayPx();
      const scrolled = -track.getBoundingClientRect().top;
      onPassageRef.current?.(runway > 0 ? clamp01(scrolled / runway) : 1);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [opening, runwayPx]);

  useEffect(() => {
    if (!isDesktop) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const runway = opening ? runwayPx() : 0;
      const total = rect.height - window.innerHeight - runway;
      if (total <= 0) return;
      setProgress(clamp01((-rect.top - runway) / total));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isDesktop, setProgress, opening, runwayPx]);

  // Links de etapa (#etapa-…) também posicionam a cena, inclusive no mobile.
  useEffect(() => {
    const sync = () => {
      const index = JOURNEY_STEPS.findIndex((s) => `#${s.id}` === window.location.hash);
      if (index >= 0 && !window.matchMedia(DESKTOP_QUERY).matches) setProgress(JOURNEY_STOPS[index]);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [setProgress]);

  const selectStep = useCallback(
    (index: number) => {
      const target = JOURNEY_STOPS[index];
      setProgress(target);
      setAnnouncement(`Etapa ${index + 1} de 4: ${JOURNEY_STEPS[index].title}`);

      const track = trackRef.current;
      if (!track || !window.matchMedia(DESKTOP_QUERY).matches) return;
      // Mantém rolagem e cena coerentes: leva a página à posição da etapa.
      const rect = track.getBoundingClientRect();
      const runway = opening ? runwayPx() : 0;
      const total = rect.height - window.innerHeight - runway;
      const top = window.scrollY + rect.top + runway + target * total;
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: Math.round(top), behavior: smooth ? "smooth" : "auto" });
    },
    [setProgress, opening, runwayPx],
  );

  // "Estar na viewport não é estar visível": coberto pela escultura, o ambiente também pausa.
  const ambientPaused = paused || !onScreen || tabHidden || (opening && sceneCovered);
  const inertGroup = opening && covered ? true : undefined;
  const { status, layout } = useJourneyMotion(motionContainerRef, {
    pkg: motionPackage,
    enabled: nearViewport,
    progress,
    reducedMotion,
    paused: ambientPaused,
  });

  const activeIndex = stepIndexFromProgress(progress);
  // Movimento reduzido: pose estática do estado correspondente, sem interpolação.
  const shown = reducedMotion ? JOURNEY_STOPS[activeIndex] : progress;


  return (
    <section
      ref={sectionRef}
      id="jornada"
      className={styles.section}
      aria-labelledby="jornada-title"
      data-progress={progress.toFixed(4)}
      data-active-step={activeIndex}
    >
      {!opening && (
        <header className={`wrap ${styles.intro}`}>
          <p className="eyebrow">{t(introText ? "Percurso conceitual" : "Como funciona")}</p>
          <h2 id="jornada-title" className={styles.title} data-reveal="title">
            <RevealWords text={t("Uma imagem.\nNovas camadas.")} />
          </h2>
          <p className={styles.lead} data-reveal="text">
            {t(introText ?? "Veja a transformação: a mesma imagem passa por quatro estados, da leitura do exame à explicação. Role a página ou escolha uma etapa.")}
          </p>
        </header>
      )}

      <div ref={trackRef} className={`wrap ${styles.track}`} data-journey-variant={variant}>
        {opening ? (
          <>
            {/* Celular: o quadro fica preso durante a pista e depois segue em fluxo normal. */}
            <div className={styles.openingHold} data-opening="hold">
              <div className={styles.stickyCol} data-opening="stage-col" inert={inertGroup} data-covered={inertGroup ? "true" : undefined}>
                <JourneyStage
                  mri={mri}
                  progress={shown}
                  layout={isNarrow ? "portrait" : "landscape"}
                  motionContainerRef={motionContainerRef}
                  motionStatus={status}
                  motionLayout={layout}
                  activeIndex={activeIndex}
                  ambientOff={ambientPaused || reducedMotion}
                  frameNote={frameNote}
                >
                  <JourneyControls
                    activeIndex={activeIndex}
                    progress={shown}
                    onSelect={selectStep}
                    paused={paused}
                    onTogglePause={() => setMotionPaused(!paused)}
                    reducedMotion={reducedMotion}
                    waiting={opening && controlsWaiting}
                  />
                  <ActiveStepSummary key={activeIndex} index={activeIndex} steps={steps} />
                </JourneyStage>
              </div>
              <div ref={runwayMobileRef} className={styles.runwayMobile} data-opening="runway-mobile" aria-hidden="true" />
            </div>
            <div className={styles.openingCol} data-opening="steps-col" inert={inertGroup} data-covered={inertGroup ? "true" : undefined}>
              <div ref={runwayDesktopRef} className={styles.runwayDesktop} data-opening="runway-desktop" aria-hidden="true" />
              <header id="jornada-inicio" className={styles.openingIntro} data-safe={safeIntro || undefined}>
                <p className="eyebrow">{t(introText ? "Percurso conceitual" : "Como funciona")}</p>
                <h2 id="jornada-title" className={styles.openingTitle} data-reveal="title">
                  <RevealWords text={t("Uma imagem.\nNovas camadas.")} />
                </h2>
                <p className={styles.openingLead} data-reveal="text">
                  {t(introText ?? "A mesma imagem passa por quatro estados, da leitura do exame à explicação. Role a página ou escolha uma etapa.")}
                </p>
              </header>
              <JourneySteps activeIndex={activeIndex} compact={compactSteps} steps={steps} />
            </div>
          </>
        ) : (
          <>
            <div className={styles.stickyCol}>
              <JourneyStage
                mri={mri}
                progress={shown}
                layout={isNarrow ? "portrait" : "landscape"}
                motionContainerRef={motionContainerRef}
                motionStatus={status}
                motionLayout={layout}
                activeIndex={activeIndex}
                ambientOff={ambientPaused || reducedMotion}
              >
                <JourneyControls
                  activeIndex={activeIndex}
                  progress={shown}
                  onSelect={selectStep}
                  paused={paused}
                  onTogglePause={() => setMotionPaused(!paused)}
                  reducedMotion={reducedMotion}
                />
                <ActiveStepSummary key={activeIndex} index={activeIndex} steps={steps} />
              </JourneyStage>
            </div>
            <JourneySteps activeIndex={activeIndex} steps={steps} />
          </>
        )}
      </div>

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {t(announcement)}
      </p>
    </section>
  );
}
