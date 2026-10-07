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
  return (
    <section id="ciencia" className={base.section} aria-labelledby="ciencia-title">
      <div className="wrap">
        <header className={base.head}>
          <p className={`eyebrow ${base.eyebrow}`}>Ciência</p>
          <h2 id="ciencia-title" className={base.title}>
            Pesquisa com os limites à vista.
          </h2>
          <p className={base.lead}>{PESQUISA_LEAD}</p>
        </header>

        <div className={styles.summary} data-pesquisa="classificacao-e-segmentacao">
          {PESQUISA.map((it, i) => (
            <section key={it.term} className={styles.card} aria-labelledby={`ciencia-p${i}`}>
              <h3 id={`ciencia-p${i}`} className={styles.cardTitle}>
                {it.term}
              </h3>
              <p className={styles.cardText}>{it.text}</p>
            </section>
          ))}
        </div>
        <article className={styles.pub} aria-labelledby="ciencia-publicacao">
          <p className={styles.pubKicker}>
            <span>{EVIDENCIAS_ROTULO}</span>
            <span aria-hidden="true">·</span>
            <span>
              {PUBLICACAO.periodico}, {PUBLICACAO.ano}
            </span>
          </p>
          <h3 id="ciencia-publicacao" className={styles.pubTitle}>
            {PUBLICACAO.tituloCurto}
          </h3>
          <p className={styles.pubQuestion}>
            <span className={styles.pubLabel}>Pergunta estudada</span> {PUBLICACAO.pergunta}
          </p>
          <p className={styles.pubRef}>
            {PUBLICACAO.autores.replace(/\.$/, "")}. <cite>{PUBLICACAO.tituloCompleto}</cite>. {PUBLICACAO.periodico}, {PUBLICACAO.ano}. DOI{" "}
            {PUBLICACAO.doi}
          </p>
          <a className={styles.pubLink} href={PUBLICACAO.href} rel="noopener" target="_blank">
            Ler publicação
            <span className={styles.pubExt}> (abre o DOI em nova aba)</span>
          </a>
          <p className={styles.pubNote}>Estudo de classificação, separado da pesquisa de segmentação em andamento.</p>
        </article>

        <p className={styles.stageLine}>
          <span className={styles.stage}>Plataforma em validação científica.</span> Este site não apresenta métricas de
          desempenho nem certificação regulatória.
        </p>

        <details className={styles.more}>
          <summary className={styles.moreSummary}>
            <span>Escopo, princípios de avaliação e limites de interpretação</span>
            <span className={styles.chev} aria-hidden="true" />
          </summary>
          <div className={styles.moreBody}>
            <section aria-labelledby="ciencia-metodos-det">
              <h4 id="ciencia-metodos-det" className={styles.detTitle}>O que cada estudo analisou</h4>
              {METODO_REFINADA.map((it) => (
                <div key={it.term}>
                  <h5 className={styles.detTitle}>{it.term}</h5>
                  <p className={styles.cardText}>{it.text}</p>
                </div>
              ))}
            </section>
            <section aria-labelledby="ciencia-escopo-det">
              <h4 id="ciencia-escopo-det" className={styles.detTitle}>
                Escopo atual
              </h4>
              <dl className={base.items}>
                {["Imagem", "Finalidade", "Uso"].map((t) => (
                  <div key={t} className={base.item}>
                    <dt>{t}</dt>
                    <dd>{scope(t)}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section aria-labelledby="ciencia-principios-det">
              <h4 id="ciencia-principios-det" className={styles.detTitle}>
                Princípios de avaliação
              </h4>
              <dl className={base.items}>
                {PRINCIPIOS_REFINADA.map((it) => (
                  <div key={it.term} className={base.item}>
                    <dt>{it.term}</dt>
                    <dd>{it.text}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section aria-labelledby="ciencia-limites-det">
              <h4 id="ciencia-limites-det" className={styles.detTitle}>
                Limites de interpretação
              </h4>
              <dl className={base.items}>
                {LIMITES_REFINADA.map((it) => (
                  <div key={it.term} className={base.item}>
                    <dt>{it.term}</dt>
                    <dd>{it.text}</dd>
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
