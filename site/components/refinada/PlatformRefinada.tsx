import { RevealWords } from "../text/RevealWords";
import { PlataformaFluxo } from "./PlataformaFluxo";
import styles from "./PlatformRefinada.module.css";

/**
 * Plataforma da /previa/refinada. Desde 07/10/2026: demonstração "do Hub ao Viewer" com capturas reais
 * (Hub 1.0.0 e Viewer, caso público desidentificado ProstateX-0067 — PlataformaFluxo.tsx,
 * lib/plataforma-fluxo.ts), no lugar das capturas com dados sintéticos da rodada 5 (componentes e
 * derivados preservados: CapturaProdutoFigura, lib/refinada-capturas.ts).
 * Histórico da rodada 5:
 *  · Um percurso de quatro passos, uma linha cada (sem repetir um bloco de texto por captura).
 *  · O Viewer em destaque (onde o trabalho clínico acontece); o Hub como início do percurso.
 *  · Separação explícita: o que AS CAPTURAS MOSTRAM (legendas) × o que está DOCUMENTADO como
 *    recurso do Viewer e não aparece nelas (nota "Também documentado"). Nada de inferência, XAI,
 *    3D, exportação ou comparação T2/ADC/DWI apresentados como demonstrados.
 *  · "Revisado" no Hub = marcador operacional; a revisão clínica é no Viewer.
 *  · Não usa o PRODUCT_DEMO global: /previa, /a e /b seguem com a Plataforma própria delas.
 */
/** Públicos e tarefas DOCUMENTADAS (percurso Hub → Viewer e frentes de pesquisa), sem promessa de
 *  ganho de tempo, acurácia clínica ou desfecho. */
const PARA_QUEM = [
  {
    who: "Equipes de radiologia",
    tasks: "Organizar a fila de estudos no Hub, abrir o caso no Viewer, revisar séries e regiões e documentar a revisão.",
  },
  {
    who: "Pesquisadores",
    tasks: "Revisar casos com regiões e medições e acompanhar as frentes de pesquisa — classificação e segmentação — com protocolos e limites descritos.",
  },
] as const;

/** Recursos documentados do Viewer que ESTA demonstração não mostra (a comparação mostrada é só T2 + ADC; a
 *  medida é uma régua; o relatório aparece só como prévia). */
const VIEWER_DOCUMENTADO_FLUXO = [
  "Comparação com DWI na mesma referência espacial",
  "ROIs persistentes",
  "Relatório em PDF",
] as const;

export function PlatformRefinada() {
  return (
    <section id="plataforma" className={styles.section} aria-labelledby="plataforma-title">
      <div className="wrap">
        <header className={styles.header}>
          <p className="eyebrow">Plataforma</p>
          <h2 id="plataforma-title" className={styles.title} data-reveal="title">
            <RevealWords text="Do Hub ao Viewer," />{" "}
            <span className={styles.gold}>
              <RevealWords text="em um caso público." start={4} />
            </span>
          </h2>
          <p className={styles.lead} data-reveal="text">
            Uma plataforma local de apoio ao radiologista: o Hub organiza a fila e o processamento; o Viewer reúne
            ferramentas para revisar imagem e região.
          </p>
        </header>

        {/* Para quem (rodada 6): públicos e tarefas documentadas, sem promessa de eficácia clínica. */}
        <div className={styles.audience} aria-labelledby="plataforma-para-quem">
          <h3 id="plataforma-para-quem" className={styles.audienceTitle}>
            Para quem
          </h3>
          <dl className={styles.audienceList}>
            {PARA_QUEM.map((a) => (
              <div key={a.who}>
                <dt>{a.who}</dt>
                <dd>{a.tasks}</dd>
              </div>
            ))}
          </dl>
        </div>

        <PlataformaFluxo />

        <aside className={styles.documented} aria-labelledby="viewer-documentado">
          <h3 id="viewer-documentado" className={styles.docTitle}>
            Também documentado no Viewer — não demonstrado nesta demonstração
          </h3>
          <ul className={styles.docList}>
            {VIEWER_DOCUMENTADO_FLUXO.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <details className={styles.docMore}>
            <summary className={styles.docMoreSummary}>Sobre os módulos e as demonstrações</summary>
            <ul className={styles.docMoreList}>
              <li>Segmentação, detecção e predição são módulos com configurações próprias; não constituem um único modelo validado.</li>
              <li>A Jornada e a Explicabilidade desta página são demonstrações didáticas, separadas desta interface.</li>
              <li>SHAP foi utilizado na pesquisa de classificação; o painel XAI do Viewer ainda está indisponível.</li>
              <li>Um score do modelo não equivale, por si, a uma probabilidade clínica calibrada de câncer.</li>
            </ul>
          </details>
        </aside>
      </div>
    </section>
  );
}
