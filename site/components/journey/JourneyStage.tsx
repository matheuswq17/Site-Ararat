"use client";

import { useTranslation } from "@/lib/i18n";

import type { CSSProperties, ReactNode, RefObject } from "react";
import type { MriSource } from "@/lib/mri";
import { LABEL_TEXT, type JourneyLayout } from "@/lib/motion-contract";
import type { MotionStatus } from "../motion/useJourneyMotion";
import { JourneyMriScene, type SceneLayout } from "./JourneyMriScene";
import styles from "./Journey.module.css";

type Props = {
  mri: MriSource;
  progress: number;
  layout: SceneLayout;
  motionContainerRef: RefObject<HTMLDivElement | null>;
  motionStatus: MotionStatus;
  /** Posições de rótulos emitidas pelo módulo (adendo v1.1); null = legenda estática. */
  motionLayout: JourneyLayout | null;
  activeIndex: number;
  ambientOff: boolean;
  children: ReactNode;
  /** Aviso no próprio quadro (só /previa): falha definitiva da RM — nunca um quadro vazio. */
  frameNote?: string | null;
};

/**
 * Palco da jornada: cena estática própria sobre a RM demonstrativa (sempre
 * renderizada, também como fallback), camada do módulo de motion e camada de
 * rótulos HTML (Forma/Textura/Intensidade) posicionados pelo evento
 * "ararat:journey-layout". Rótulos e arte são aria-hidden; o equivalente
 * textual está no parágrafo visualmente oculto e nos textos das etapas.
 */
export function JourneyStage({
  mri,
  progress,
  layout,
  motionContainerRef,
  motionStatus,
  motionLayout,
  activeIndex,
  ambientOff,
  children,
  frameNote = null,
}: Props) {
  const { t } = useTranslation();
  const moduleShown = motionStatus === "ready";
  const visibleLabels = moduleShown && motionLayout ? motionLayout.labels.filter((l) => l.visible) : [];
  // Módulo sem o evento (ex.: pacote 0.2.0): legenda estática nas etapas com dados.
  const staticLegend = moduleShown && !motionLayout && activeIndex >= 2;

  return (
    <div className={styles.stage} data-motion-status={motionStatus} data-ambient={ambientOff ? "off" : "on"}>
      <div className={styles.frame} data-layout={layout}>
        <div className={styles.fallback} aria-hidden="true" data-progress={progress.toFixed(4)}>
          <JourneyMriScene source={mri} progress={progress} layout={layout} />
        </div>
        <div ref={motionContainerRef} className={styles.motionLayer} aria-hidden="true" />
        {moduleShown && motionLayout && (
          <div className={styles.labelLayer} aria-hidden="true" data-emphasis={motionLayout.emphasis ?? undefined}>
            {visibleLabels.map((l) => (
              <span
                key={l.id}
                className={styles.sceneLabel}
                data-label-id={l.id}
                data-emphasis={motionLayout.emphasis === l.id || undefined}
                style={{ left: `${(l.x * 100).toFixed(3)}%`, top: `${(l.y * 100).toFixed(3)}%` } as CSSProperties}
              >
                {t(LABEL_TEXT[l.id])}
              </span>
            ))}
          </div>
        )}
        <span className={styles.corner} aria-hidden="true" />
        {frameNote && (
          <p className={styles.frameNote} role="status">
            {t(frameNote)}
          </p>
        )}
      </div>
      <p className="visually-hidden">
        {t("Na cena ilustrativa, os dados extraídos da região aparecem identificados como forma, textura e intensidade.")}</p>
      <p className={`ill-note ${styles.caption}`}>
        {staticLegend && (
          <span className={styles.legend} aria-hidden="true">
            {t("Na cena: forma · textura · intensidade.")}{t(" ")}
          </span>
        )}
        {t("RM demonstrativa · segmentação demonstrativa, região de exemplo, não lesão · contribuições ilustrativas, sem valores — não são resultado do modelo.")}</p>
      {children}
    </div>
  );
}
