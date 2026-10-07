import Image from "next/image";
import { RevealWords } from "./text/RevealWords";
import { ProductDemo } from "./ProductDemo";
import { PRODUCT_DEMO, PRODUCT_ROUTE, checkProductDemo } from "@/lib/product-media";
import styles from "./Platform.module.css";

/** Pontos comentados na captura real atual do Hub (só o que é visível nela). */
const HUB_POINTS = [
  {
    n: "a",
    title: "Fila e status",
    text: "Indicadores de casos prontos, em processamento, na fila e revisados, acima da fila de pacientes.",
    marker: { left: "26%", top: "17%" },
  },
  {
    n: "b",
    title: "Situação de cada caso",
    text: "Cada linha mostra chegada, etapa e status do caso, para a equipe saber o que já pode ser revisado.",
    marker: { left: "50%", top: "47%" },
  },
  {
    n: "c",
    title: "Abrir revisão",
    text: "O caso selecionado abre direto no Viewer — é ali que a revisão médica acontece.",
    marker: { left: "92%", top: "82%" },
  },
] as const;

/** O que o Viewer reúne, agrupado pelos acontecimentos 03 e 04 do percurso. */
const VIEWER_GROUPS = [
  {
    event: "viewer",
    items: ["Séries de RM em planos axial, coronal e sagital", "Máscaras de próstata, zonas e lesões, com controle de opacidade"],
  },
  {
    event: "revisao",
    items: [
      "Medidas prostáticas e análise de lesões",
      "Inferência com explicabilidade e features relevantes",
      "Exportação da análise para documentação",
    ],
  },
] as const;

const num = (id: string) => String(PRODUCT_ROUTE.findIndex((e) => e.id === id) + 1).padStart(2, "0");
const titleOf = (id: string) => PRODUCT_ROUTE.find((e) => e.id === id)?.title ?? "";

/**
 * Plataforma = percurso de uso. Faixa de etapas (Hub → abrir o caso → séries e máscaras →
 * revisar a análise) seguida das paradas. Sem material novo, as paradas são a captura real
 * atual do Hub e a descrição honesta do Viewer ("capturas em preparação"). Com
 * `PRODUCT_DEMO`, o mesmo encaixe vira a sequência de capturas (ProductDemo).
 */
export function Platform() {
  // Material preenchido com erro (referência quebrada, ordem, focus, alt vazio) falha no build.
  if (PRODUCT_DEMO) {
    const problems = checkProductDemo(PRODUCT_DEMO);
    if (problems.length) throw new Error(`PRODUCT_DEMO inválido:\n${problems.join("\n")}`);
  }
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
            O Hub organiza a chegada e a fila dos exames; o Viewer é onde o especialista revisa imagem e análise.
          </p>
        </header>

        {PRODUCT_DEMO ? (
          <ProductDemo demo={PRODUCT_DEMO} />
        ) : (
          <>
            <ol className={styles.route} aria-label="Percurso de uso" data-reveal="list">
              {PRODUCT_ROUTE.map((e, i) => (
                <li key={e.id} className={styles.routeItem}>
                  <span className={styles.routeNum} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className={styles.routeTitle}>{e.title}</h3>
                  <p className={styles.routeText}>{e.summary}</p>
                </li>
              ))}
            </ol>

            <div className={styles.stop}>
              <h3 id="parada-hub" className={styles.stopLabel}>
                <span aria-hidden="true">{num("hub")}–{num("caso")}</span> {titleOf("hub")} e {titleOf("caso").toLowerCase()}
              </h3>
              <div className={styles.hub}>
                <figure className={styles.figure}>
                  <div className={styles.window}>
                    <Image
                      src="/brand/ararat_hub.png"
                      alt="Tela do ARARAT Hub: indicadores de casos prontos para revisão, em processamento, na fila e revisados; fila de pacientes com status, risco e ação Abrir; painel de resumo operacional com o caso selecionado e o botão Abrir revisão."
                      width={1672}
                      height={941}
                      sizes="(min-width: 1200px) 860px, 100vw"
                      className={styles.shot}
                    />
                    {HUB_POINTS.map((p) => (
                      <span key={p.n} className={styles.marker} style={p.marker} aria-hidden="true">
                        {p.n}
                      </span>
                    ))}
                  </div>
                  <figcaption className={`ill-note ${styles.caption}`}>
                    Captura real do ARARAT Hub (versão 1.0), fornecida pela equipe. Valores visíveis na interface não
                    constituem resultado clínico.
                  </figcaption>
                </figure>

                <ol className={styles.points} data-reveal="list">
                  {HUB_POINTS.map((p) => (
                    <li key={p.n}>
                      <span className={styles.pointNum} aria-hidden="true">
                        {p.n}
                      </span>
                      <div>
                        <h4 className={styles.pointTitle}>{p.title}</h4>
                        <p>{p.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className={styles.stop}>
              <h3 id="parada-viewer" className={styles.stopLabel}>
                <span aria-hidden="true">{num("viewer")}–{num("revisao")}</span> ARARAT Viewer
              </h3>
              <div className={styles.viewer}>
                <div className={styles.viewerHead}>
                  <p className={styles.viewerTitle}>Imagem, máscara e resultado no mesmo ambiente.</p>
                  <p className={styles.viewerNote}>Capturas do Viewer em preparação.</p>
                </div>
                <div className={styles.groups}>
                  {VIEWER_GROUPS.map((g) => (
                    <div key={g.event} className={styles.group}>
                      <h4 className={styles.groupTitle}>
                        <span aria-hidden="true">{num(g.event)}</span> {titleOf(g.event)}
                      </h4>
                      <ul className={styles.features}>
                        {g.items.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
