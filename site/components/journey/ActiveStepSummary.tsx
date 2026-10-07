import { JOURNEY_STEPS, type JourneyStep } from "@/lib/journey-content";
import styles from "./Journey.module.css";

/**
 * Resumo da etapa ativa, junto da cena e dos controles (celular/tablet).
 * Visual apenas (aria-hidden): o texto completo de cada etapa continua na
 * lista abaixo e a troca de etapa já é anunciada pela região aria-live.
 * No desktop fica oculto — a coluna de textos acompanha a arte sticky.
 */
export function ActiveStepSummary({ index, steps = JOURNEY_STEPS }: { index: number; steps?: JourneyStep[] }) {
  const step = steps[index];
  return (
    <div className={styles.summary} aria-hidden="true" data-step={index}>
      <p className={styles.summaryKicker}>
        <span>{step.number}</span> {step.title} · {step.verb}
      </p>
      <p className={styles.summaryText}>{step.text}</p>
    </div>
  );
}
