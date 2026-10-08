"use client";

import { useTranslation } from "@/lib/i18n";

import { useRef, type KeyboardEvent } from "react";
import { JOURNEY_STEPS } from "@/lib/journey-content";
import styles from "./Journey.module.css";

type Props = {
  activeIndex: number;
  progress: number;
  onSelect: (index: number) => void;
  paused: boolean;
  onTogglePause: () => void;
  reducedMotion: boolean;
  /** Cena ainda carregando (só /previa): controles ocultos, espaço preservado. */
  waiting?: boolean;
};

export function JourneyControls({ activeIndex, progress, onSelect, paused, onTogglePause, reducedMotion, waiting = false }: Props) {
  const { t } = useTranslation();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  // Setas movem entre etapas (os botões continuam todos acessíveis por Tab).
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = Math.min(3, index + 1);
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = Math.max(0, index - 1);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = 3;
    if (next < 0) return;
    event.preventDefault();
    buttons.current[next]?.focus();
    onSelect(next);
  };

  return (
    <div className={styles.controls} data-journey-controls="" data-waiting={waiting || undefined}>
      <div className={styles.rail} role="group" aria-label={t("Escolher etapa da jornada")}>
        <span className={styles.railTrack} aria-hidden="true">
          <span className={styles.railFill} style={{ transform: `scaleX(${progress})` }} />
        </span>
        {JOURNEY_STEPS.map((step, i) => (
          <button
            key={step.id}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            className={styles.stepButton}
            aria-pressed={activeIndex === i}
            aria-controls={step.id}
            data-reached={progress >= i / 3 - 0.001 || undefined}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <span className={styles.stepNum} aria-hidden="true">
              {t(step.number)}
            </span>
            <span className={styles.stepLabel}>{t(step.title)}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className={styles.pause}
        aria-pressed={paused}
        onClick={onTogglePause}
        disabled={reducedMotion}
        title={t(reducedMotion ? "Movimento reduzido ativo no sistema" : undefined)}
      >
        <span className={styles.pauseIcon} data-paused={paused || reducedMotion} aria-hidden="true" />
        {t(reducedMotion ? "Movimento reduzido" : paused ? "Retomar animações" : "Pausar animações")}
      </button>
    </div>
  );
}
