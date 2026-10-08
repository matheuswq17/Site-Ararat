"use client";

import { useTranslation } from "@/lib/i18n";

import { FAQ_REFINADA } from "@/lib/faq-refinada";
import styles from "./FaqRefinada.module.css";

/** FAQ curta (rodada 6): quatro perguntas em <details>, sem JS; respostas curtas que apontam para
 *  as seções em vez de repetir a Ciência. Fica entre Time e Contato. */
export function FaqRefinada() {
  const { t } = useTranslation();
  return (
    <section id="faq" className={styles.section} aria-labelledby="faq-title">
      <div className={`wrap ${styles.inner}`}>
        <header className={styles.header}>
          <p className="eyebrow">{t("Perguntas frequentes")}</p>
          <h2 id="faq-title" className={styles.title}>
            {t("Antes de conversar.")}</h2>
        </header>
        <div className={styles.list}>
          {FAQ_REFINADA.map((f) => (
            <details key={f.id} id={f.id} className={styles.item}>
              <summary className={styles.q}>
                <span>{t(f.q)}</span>
                <span className={styles.plus} aria-hidden="true" />
              </summary>
              <div className={styles.a}>
                <p>{t(f.a)}</p>
                {f.link && (
                  <p>
                    <a href={f.link.href} className={styles.link}>
                      {t(f.link.label)}
                    </a>
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
