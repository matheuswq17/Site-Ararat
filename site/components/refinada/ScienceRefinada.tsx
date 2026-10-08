"use client";

import { useTranslation } from "@/lib/i18n";

import { RevisaoHumanaRefinada } from "./RevisaoHumanaRefinada";
import { SCOPE } from "@/lib/science";
import { EVIDENCIAS_ROTULO, LIMITES_REFINADA, METODO_REFINADA, PESQUISA, PESQUISA_LEAD, PRINCIPIOS_REFINADA, PUBLICACAO } from "@/lib/science-refinada";
import base from "../Science.module.css";
import styles from "./ScienceRefinada.module.css";

/**
 * Ciência da refinada: classificação publicada e segmentação em andamento, sem métricas.
 *  · Fundo claro e quatro blocos; detalhes dos protocolos, escopo, princípios e limites.
 *  · Link DOI público; nenhum link a rascunhos ou documentos privados do Drive.
 */
const scope = (term: string) => SCOPE.find((s) => s.term === term)?.text ?? "";

export function ScienceRefinada() {
  const { t } = useTranslation();
  return (
    <section id="ciencia" className={base.section} aria-labelledby="ciencia-title">
      <div className="wrap">
        <header className={base.head}>
          <p className={`eyebrow ${base.eyebrow}`}>{t("Ciência")}</p>
          <h2 id="ciencia-title" className={base.title}>
            {t("Pesquisa com os limites à vista.")}</h2>
          <p className={base.lead}>{t(PESQUISA_LEAD)}</p>
        </header>

        <div className={styles.summary} data-pesquisa="classificacao-e-segmentacao">
          {PESQUISA.map((it, i) => (
            <section key={it.term} className={styles.card} aria-labelledby={`ciencia-p${i}`}>
              <h3 id={`ciencia-p${i}`} className={styles.cardTitle}>
                {t(it.term)}
              </h3>
              <p className={styles.cardText}>{t(it.text)}</p>
            </section>
          ))}
        </div>
        <article className={styles.pub} aria-labelledby="ciencia-publicacao">
          <p className={styles.pubKicker}>
            <span>{t(EVIDENCIAS_ROTULO)}</span>
            <span aria-hidden="true">{t("·")}</span>
            <span>
              {t(PUBLICACAO.periodico)}, {PUBLICACAO.ano}
            </span>
          </p>
          <h3 id="ciencia-publicacao" className={styles.pubTitle}>
            {t(PUBLICACAO.tituloCurto)}
          </h3>
          <p className={styles.pubQuestion}>
            <span className={styles.pubLabel}>{t("Pergunta estudada")}</span> {t(PUBLICACAO.pergunta)}
          </p>
          <p className={styles.pubRef}>
            {PUBLICACAO.autores.replace(/\.$/, "")}. <cite>{PUBLICACAO.tituloCompleto}</cite>. {PUBLICACAO.periodico}, {PUBLICACAO.ano}. DOI{" "}
            {t(PUBLICACAO.doi)}
          </p>
          <a className={styles.pubLink} href={PUBLICACAO.href} rel="noopener" target="_blank">
            {t("Ler publicação")}<span className={styles.pubExt}> {t("(abre o DOI em nova aba)")}</span>
          </a>
          <p className={styles.pubNote}>{t("Estudo de classificação, separado da pesquisa de segmentação em andamento.")}</p>
        </article>

        <p className={styles.stageLine}>
          <span className={styles.stage}>{t("Plataforma em validação científica.")}</span> {t("Este site não apresenta métricas de desempenho nem certificação regulatória.")}</p>

        <details className={styles.more}>
          <summary className={styles.moreSummary}>
            <span>{t("Escopo, princípios de avaliação e limites de interpretação")}</span>
            <span className={styles.chev} aria-hidden="true" />
          </summary>
          <div className={styles.moreBody}>
            <section aria-labelledby="ciencia-metodos-det">
              <h4 id="ciencia-metodos-det" className={styles.detTitle}>{t("O que cada estudo analisou")}</h4>
              {METODO_REFINADA.map((it) => (
                <div key={it.term}>
                  <h5 className={styles.detTitle}>{t(it.term)}</h5>
                  <p className={styles.cardText}>{t(it.text)}</p>
                </div>
              ))}
            </section>
            <section aria-labelledby="ciencia-escopo-det">
              <h4 id="ciencia-escopo-det" className={styles.detTitle}>
                {t("Escopo atual")}</h4>
              <dl className={base.items}>
                {["Imagem", "Finalidade", "Uso"].map((term) => (
                  <div key={term} className={base.item}>
                    <dt>{t(term)}</dt>
                    <dd>{t(scope(term))}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section aria-labelledby="ciencia-principios-det">
              <h4 id="ciencia-principios-det" className={styles.detTitle}>
                {t("Princípios de avaliação")}</h4>
              <dl className={base.items}>
                {PRINCIPIOS_REFINADA.map((it) => (
                  <div key={it.term} className={base.item}>
                    <dt>{t(it.term)}</dt>
                    <dd>{t(it.text)}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section aria-labelledby="ciencia-limites-det">
              <h4 id="ciencia-limites-det" className={styles.detTitle}>
                {t("Limites de interpretação")}</h4>
              <dl className={base.items}>
                {LIMITES_REFINADA.map((it) => (
                  <div key={it.term} className={base.item}>
                    <dt>{t(it.term)}</dt>
                    <dd>{t(it.text)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </details>

      </div>

      {/* Fechamento: frases + paisagem numa composição só (componente próprio da refinada). */}
      <RevisaoHumanaRefinada />
    </section>
  );
}
