import { JOURNEY_STEPS, type JourneyStep } from "@/lib/journey-content";
import styles from "./Journey.module.css";

/** Equivalente textual da cena: todo o conteúdo essencial vive aqui, no HTML. */
/** compact (/previa/refinada): no celular (< 960 px), o texto longo fica num <details> "Ler mais"
 *  — o resumo da etapa ativa, junto do quadro, já o mostra; a lista dá a orientação (etapa, verbo,
 *  linha curta) e o aprofundamento continua acessível, inclusive sem JS. No desktop, texto inteiro.
 *  As duas formas nunca aparecem juntas (display: none tira a duplicada da leitura assistiva). */
/** steps: textos da rota (padrão = JOURNEY_STEPS; a /previa/refinada passa a versão revisada, mesmos ids). */
export function JourneySteps({ activeIndex, compact = false, steps = JOURNEY_STEPS }: { activeIndex: number; compact?: boolean; steps?: JourneyStep[] }) {
  return (
    <ol className={styles.steps}>
      {steps.map((step, i) => (
        <li key={step.id} id={step.id} className={styles.step} data-active={activeIndex === i || undefined}>
          <div className={styles.stepInner}>
            <p className={styles.stepKicker}>
              <span>{step.number}</span> {step.title}
            </p>
            <h3 className={styles.stepTitle}>{step.verb}</h3>
            <p className={`${styles.stepText} ${compact ? styles.stepTextWide : ""}`}>{step.text}</p>
            <p className={styles.stepDetail}>{step.detail}</p>
            {compact && (
              <details className={styles.stepMore}>
                <summary>Ler mais sobre {step.title.toLowerCase()}</summary>
                <p className={styles.stepText}>{step.text}</p>
              </details>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
