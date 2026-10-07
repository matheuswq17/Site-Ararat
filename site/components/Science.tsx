import { TopoLandscape } from "./art/TopoLandscape";
import { DISCLAIMER } from "@/lib/navigation";
import { LIMITS, PRINCIPLES, SCIENCE_EVIDENCE, SCOPE, type ScienceItem } from "@/lib/science";
import styles from "./Science.module.css";

/**
 * Ciência — composição editorial em três partes (escopo, princípios de avaliação,
 * limites de interpretação). Princípios são requisitos de método, não resultados.
 * Rastreabilidade de cada frase: site/COPY-RASTREABILIDADE.md. Menos movimento que
 * os capítulos escuros: nenhum reveal aqui.
 */
const PARTS: Array<{ id: string; n: string; title: string; note?: string; items: ScienceItem[] }> = [
  { id: "escopo", n: "1", title: "Escopo", items: SCOPE },
  {
    id: "principios",
    n: "2",
    title: "Princípios de avaliação",
    note: "Requisitos que orientam o desenvolvimento e a avaliação dos modelos — não são, por si, resultados.",
    items: PRINCIPLES,
  },
  { id: "limites", n: "3", title: "Limites de interpretação", items: LIMITS },
];

export function Science() {
  return (
    <section id="ciencia" className={styles.section} aria-labelledby="ciencia-title">
      <div className="wrap">
        <header className={styles.head}>
          <p className={`eyebrow ${styles.eyebrow}`}>Ciência</p>
          <h2 id="ciencia-title" className={styles.title}>
            Construído sobre método, não sobre promessas.
          </h2>
          <p className={styles.lead}>
            O que o ARARAT cobre, os princípios pelos quais deve ser avaliado e como não ler qualquer saída
            do sistema.
          </p>
        </header>

        <div className={styles.parts}>
          {PARTS.map((part) => (
            <section key={part.id} className={styles.part} aria-labelledby={`ciencia-${part.id}`}>
              <div className={styles.partHead}>
                <span className={styles.partNum} aria-hidden="true">
                  {part.n}
                </span>
                <h3 id={`ciencia-${part.id}`} className={styles.partTitle}>
                  {part.title}
                </h3>
                {part.note && <p className={styles.partNote}>{part.note}</p>}
              </div>
              <dl className={styles.items}>
                {part.items.map((it) => (
                  <div key={it.term} className={styles.item}>
                    <dt>{it.term}</dt>
                    <dd>{it.text}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        {/* Encaixe opcional: só aparece quando houver evidência publicada (lib/science.ts). */}
        {SCIENCE_EVIDENCE.length > 0 && (
          <section className={styles.evidence} aria-labelledby="ciencia-evidencias">
            <h3 id="ciencia-evidencias" className={styles.partTitle}>
              Publicações e resultados
            </h3>
            <ul>
              {SCIENCE_EVIDENCE.map((e) => (
                <li key={e.href}>
                  <span className={styles.evKind}>{e.kind}</span>{" "}
                  <a href={e.href} rel="noopener" target="_blank">
                    {e.title}
                  </a>{" "}
                  <span className={styles.evMeta}>
                    — {e.credit}, {e.year}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className={styles.statement}>
          <span>O modelo sugere.</span> <span>O radiologista revisa.</span>{" "}
          <span>O médico contextualiza.</span> <span className={styles.em}>A decisão permanece humana.</span>
        </p>

        <p className={styles.disclaimer}>{DISCLAIMER}</p>
      </div>

      <div className={styles.landscape}>
        <TopoLandscape />
        <p className={`ill-note ${styles.landNote}`}>Da imagem ao entendimento · Ilustração</p>
      </div>
    </section>
  );
}
