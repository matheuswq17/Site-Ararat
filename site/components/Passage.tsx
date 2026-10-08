"use client";

import { useTranslation } from "@/lib/i18n";

import { RevealWords } from "./text/RevealWords";
import styles from "./Passage.module.css";

/**
 * Passagem curta Jornada → Plataforma. Conceitual: não representa a RM demonstrativa
 * como um caso processado; só conduz o olhar da explicação ao ambiente de revisão.
 * O traço dourado desce do fim da jornada e assenta no arco compacto da identidade
 * (mesma forma do arco de foco do hero), e daí segue para a faixa de etapas da
 * Plataforma. Movimento único na entrada (data-reveal="trace", via TextReveal):
 * traço 700 ms → arco 420 ms; pausa/movimento reduzido/sem JS = composição final.
 */
export function Passage({ refinada = false }: { refinada?: boolean }) {
  const { t } = useTranslation();
  return (
    <section id="passagem" className={styles.section} aria-labelledby="passagem-title">
      <div className={`wrap ${styles.inner}`} data-reveal="trace">
        <div className={styles.trace} aria-hidden="true">
          <span className={styles.line} />
          <svg className={styles.arc} viewBox="0 0 64 26" focusable="false">
            {/* Arco 196°→344° de um círculo r = 30 (proporção do arco de foco). */}
            <path d="M3.16 21.73A30 30 0 0 1 60.84 21.73" pathLength={1} />
          </svg>
        </div>
        <div className={styles.copy}>
          <h2 id="passagem-title" className={styles.title} data-reveal="title">
            <RevealWords text={t("Da explicação à revisão.")} />
          </h2>
          <p className={styles.text} data-reveal="text">
            {t(refinada
              ? "No produto, o Hub organiza os casos e o Viewer reúne as ferramentas de revisão. Segmentação, predição e explicabilidade têm protocolos e estágios próprios."
              : "A cena acima é demonstrativa: serve para aprender a ler a imagem. No produto, a mesma lógica — região, dados e explicação — acompanha cada exame, da chegada no Hub à revisão do especialista.")}
          </p>
        </div>
      </div>
    </section>
  );
}
