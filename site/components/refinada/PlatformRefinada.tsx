import { RevealWords } from "../text/RevealWords";
import { CAPTURA_HUB, CAPTURA_VIEWER, VIEWER_DOCUMENTADO } from "@/lib/refinada-capturas";
import { CapturaProdutoFigura } from "./CapturaProdutoFigura";
import styles from "./PlatformRefinada.module.css";

/**
 * Plataforma da /previa/refinada (rodada 5) — capturas fornecidas em 06/10/2026 (Hub 1.0.0 e
 * Viewer, ambiente demonstrativo com dados sintéticos; lib/refinada-capturas.ts).
 *  · Um percurso de quatro passos, uma linha cada (sem repetir um bloco de texto por captura).
 *  · O Viewer em destaque (onde o trabalho clínico acontece); o Hub como início do percurso.
 *  · Separação explícita: o que AS CAPTURAS MOSTRAM (legendas) × o que está DOCUMENTADO como
 *    recurso do Viewer e não aparece nelas (nota "Também documentado"). Nada de inferência, XAI,
 *    3D, exportação ou comparação T2/ADC/DWI apresentados como demonstrados.
 *  · "Revisado" no Hub = marcador operacional; a revisão clínica é no Viewer.
 *  · Não usa o PRODUCT_DEMO global: /previa, /a e /b seguem com a Plataforma própria delas.
 */
const STEPS = [
  {
    n: "01",
    action: "Organizar a fila",
    result: "No Hub, cada estudo entra na fila com sua etapa e status. “Revisado”, ali, é um marcador operacional; a revisão clínica acontece no Viewer.",
  },
  { n: "02", action: "Abrir o caso", result: "Abrir revisão leva o caso selecionado do Hub ao Viewer." },
  {
    n: "03",
    action: "Explorar imagem e região",
    result: "O Viewer mostra os planos axial, coronal e sagital lado a lado e permite marcar uma região de interesse.",
  },
  { n: "04", action: "Documentar a revisão", result: "O painel de análise reúne revisão clínica, medições e imagens do relatório." },
] as const;

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

/** Marcadores numéricos: só sobre o que está visível na captura, sem cobrir rótulos. */
const HUB_MARKS = [
  { n: "01", left: "15.3%", top: "26%" }, // à direita do título "Fila de revisão", acima dos filtros
  { n: "02", left: "82%", top: "64.5%" }, // à esquerda do botão "Abrir revisão" do painel
] as const;
const VIEWER_MARKS = [
  { n: "03", left: "11%", top: "30%" }, // área vazia da coluna "Estudos e séries", junto do plano axial
  { n: "04", left: "92.5%", top: "6.8%" }, // faixa vazia acima do painel "Análise" (sem cobrir título nem abas)
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
              <RevealWords text="em quatro passos." start={4} />
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

        <ol className={styles.steps} aria-label="Percurso de uso, do Hub ao Viewer" data-reveal="list">
          {STEPS.map((s) => (
            <li key={s.n} className={styles.step}>
              <span className={styles.stepNum} aria-hidden="true">
                {s.n}
              </span>
              <div>
                <h3 className={styles.stepAction}>{s.action}</h3>
                <p className={styles.stepResult}>{s.result}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className={styles.media}>
          <div className={styles.hub}>
            <CapturaProdutoFigura captura={CAPTURA_HUB} rotulo="Hub · passos 01–02" marcadores={HUB_MARKS} />
          </div>
          <div className={styles.viewer}>
            <CapturaProdutoFigura captura={CAPTURA_VIEWER} rotulo="Viewer · passos 03–04" marcadores={VIEWER_MARKS} destaque />
          </div>
        </div>

        <aside className={styles.documented} aria-labelledby="viewer-documentado">
          <h3 id="viewer-documentado" className={styles.docTitle}>
            Também documentado no Viewer — não demonstrado nestas capturas
          </h3>
          <ul className={styles.docList}>
            {VIEWER_DOCUMENTADO.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className={styles.docNote}>As capturas mostram uma demonstração com dados sintéticos.</p>
          <details className={styles.docMore}>
            <summary className={styles.docMoreSummary}>Sobre os módulos e as demonstrações</summary>
            <ul className={styles.docMoreList}>
              <li>Segmentação, detecção e predição são módulos com configurações próprias; não constituem um único modelo validado.</li>
              <li>A Jornada e a Explicabilidade desta página são demonstrações didáticas, separadas desta interface.</li>
              <li>SHAP foi utilizado na pesquisa de classificação; o painel XAI do Viewer mostrado ainda está indisponível.</li>
              <li>Um score do modelo não equivale, por si, a uma probabilidade clínica calibrada de câncer.</li>
            </ul>
          </details>
        </aside>
      </div>
    </section>
  );
}
