import { CAP } from "@/lib/institucional/capturas";
import { MODULO_DEMO, etapasDemo } from "@/lib/institucional/demo";
import { equipe, type Pessoa } from "@/lib/institucional/equipe";
import { PACOTE_MONTANHA, POSTERS_MONTANHA } from "@/lib/institucional/montanha.server";
import { ROTAS, rotaPessoa } from "@/lib/institucional/rotas";
import { EMPRESA, HOME, PESQUISA, PLATAFORMA, PRINCIPIOS, t, type Idioma } from "@/lib/institucional/textos";
import { PUBLICACAO } from "@/lib/science-refinada";
import { ATRIBUICAO_FLUXO } from "@/lib/plataforma-fluxo";
import { AberturaMontanha } from "./AberturaMontanha";
import { DemoGuiada } from "./DemoGuiada";
import { EquipeGrade } from "./EquipeGrade";
import { Figura } from "./Figura";
import { Moldura } from "./Moldura";
import s from "./Institucional.module.css";

const M = (a: string, b?: string) => `${s.mono} ${b ?? s.muted} ${a}`.trim();

/* ================================================================ HOME */
export function HomeInstitucional({ idioma }: { idioma: Idioma }) {
  const r = ROTAS[idioma];
  const pessoas = equipe(idioma);
  return (
    <Moldura idioma={idioma} pagina="home">
      <section className={s.hero} aria-labelledby="home-t">
        <div className={s.heroGrade}>
          <div className={s.heroTexto}>
            <p className={M("")}>{t(HOME.rotulo, idioma)}</p>
            <h1 id="home-t">{t(HOME.titulo, idioma)}</h1>
            <p className={`${s.lead} ${s.muted}`}>{t(HOME.subtitulo, idioma)}</p>
            <p className={`${s.mono} ${s.estagio}`}>{t(HOME.estagio, idioma)}</p>
            <div className={s.acoes}>
              <a className={s.btn} href={r.plataforma}>{t(HOME.acaoPrincipal, idioma)}</a>
              <a className={s.lk} href={r.pesquisa}>{t(HOME.acaoSecundaria, idioma)}</a>
            </div>
          </div>
          <AberturaMontanha modulo={PACOTE_MONTANHA.modulo} fontes={POSTERS_MONTANHA.fontes} padrao={POSTERS_MONTANHA.padrao} />
        </div>
      </section>

      <section className={`${s.secao} ${s.claro}`} aria-labelledby="home-plat-t">
        <div className={s.w}>
          <p className={M("")}>{t(HOME.plataformaRotulo, idioma)}</p>
          <h2 id="home-plat-t">{t(HOME.plataformaTitulo, idioma)}</h2>
          <p className={s.lead}>{t(HOME.plataformaTexto, idioma)}</p>
          <div className={s.dois}>
            <article className={s.app}>
              <div className={s.appCab}>
                <h3>ARARAT Hub</h3>
                <p className={s.papel}>{t(HOME.hubPapel, idioma)}</p>
                <p>{t(HOME.hubTexto, idioma)}</p>
              </div>
              <div className={`${s.quadro} ${s.quadroHub}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- captura real */}
                <img src={CAP.hubFila.fontes[1].src} srcSet={CAP.hubFila.fontes.map((f) => `${f.src} ${f.w}w`).join(", ")} sizes="(min-width: 900px) 40vw, 90vw" width={CAP.hubFila.fontes[1].w} height={CAP.hubFila.fontes[1].h} alt={t(CAP.hubFila.alt, idioma)} loading="lazy" decoding="async" />
              </div>
            </article>
            <article className={s.app}>
              <div className={s.appCab}>
                <h3>ARARAT Viewer</h3>
                <p className={s.papel}>{t(HOME.viewerPapel, idioma)}</p>
                <p>{t(HOME.viewerTexto, idioma)}</p>
              </div>
              {/* Recorte só por CSS das faixas escuras acima e abaixo da imagem; pixels intactos; captura inteira na Plataforma. */}
              <div className={`${s.quadro} ${s.quadroViewer}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- captura real */}
                <img src={CAP.t2.fontes[1].src} srcSet={CAP.t2.fontes.map((f) => `${f.src} ${f.w}w`).join(", ")} sizes="(min-width: 900px) 20vw, 45vw" width={CAP.t2.fontes[1].w} height={CAP.t2.fontes[1].h} alt={t(CAP.t2.alt, idioma)} loading="lazy" decoding="async" />
                {/* eslint-disable-next-line @next/next/no-img-element -- captura real */}
                <img src={CAP.adc.fontes[1].src} srcSet={CAP.adc.fontes.map((f) => `${f.src} ${f.w}w`).join(", ")} sizes="(min-width: 900px) 20vw, 45vw" width={CAP.adc.fontes[1].w} height={CAP.adc.fontes[1].h} alt={t(CAP.adc.alt, idioma)} loading="lazy" decoding="async" />
              </div>
            </article>
          </div>
          <div className={s.pe}>
            <p className={s.origem} style={{ margin: 0 }}>{t(HOME.origemCapturas, idioma)}</p>
            <a className={s.lk} href={r.plataforma}>{t(HOME.comoFunciona, idioma)} →</a>
          </div>
        </div>
      </section>

      <section className={`${s.secao} ${s.branco}`}>
        <div className={`${s.w} ${s.cartoes}`}>
          <article className={s.cartao}>
            <p className={M("")}>{t(HOME.pesquisaRotulo, idioma)}</p>
            <h3>{t(HOME.pesquisaTitulo, idioma)}</h3>
            <p className={s.muted} style={{ margin: 0 }}>{t(HOME.pesquisaTexto, idioma)}</p>
            <a className={s.lk} href={r.pesquisa}>{t(HOME.pesquisaRotulo, idioma)} →</a>
          </article>
          <article className={s.cartao}>
            <p className={M("")}>{t(HOME.empresaRotulo, idioma)}</p>
            <h3>{t(HOME.empresaTitulo, idioma)}</h3>
            <div className={s.rostos}>
              {pessoas.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element -- retrato pequeno
                <img key={p.id} src={p.fotos[0].src} width={p.fotos[0].w} height={Math.round((p.fotos[0].w * 5) / 4)} alt="" loading="lazy" decoding="async" />
              ))}
            </div>
            <p className={s.muted} style={{ margin: 0 }}>{t(HOME.empresaTexto, idioma)}</p>
            <a className={s.lk} href={r.empresa}>{t(HOME.empresaRotulo, idioma)} →</a>
          </article>
        </div>
      </section>
    </Moldura>
  );
}

/* ================================================================ PLATAFORMA */
export function PlataformaInstitucional({ idioma }: { idioma: Idioma }) {
  const P = PLATAFORMA;
  const oHub = t(P.origemHub, idioma), oViewer = t(P.origemViewer, idioma);
  const etapas = etapasDemo(idioma);
  return (
    <Moldura idioma={idioma} pagina="plataforma">
      <section className={`${s.topo}`} aria-labelledby="plat-t">
        <div className={s.w}>
          <p className={M("")}>{t(P.rotulo, idioma)}</p>
          <h1 id="plat-t">{t(P.titulo, idioma)}</h1>
          <p className={`${s.lead} ${s.muted}`}>{t(P.subtitulo, idioma)}</p>
          <dl className={s.registro}>
            <div><dt>{t(P.r1Titulo, idioma)}</dt><dd>{t(P.r1Texto, idioma)}</dd></div>
            <div><dt>{t(P.r2Titulo, idioma)}</dt><dd>{t(P.r2Texto, idioma)}</dd></div>
            <div><dt>{t(P.r3Titulo, idioma)}</dt><dd>{t(P.r3Texto, idioma)}</dd></div>
          </dl>
        </div>
      </section>

      <nav className={s.grupos} aria-label={t(P.gruposRotulo, idioma)}>
        <ul className={s.w}>
          <li><a href="#organizar"><b>01</b>{t(P.g1, idioma)}</a></li>
          <li><a href="#visualizar"><b>02</b>{t(P.g2, idioma)}</a></li>
          <li><a href="#medir"><b>03</b>{t(P.g3, idioma)}</a></li>
          <li><a href="#demonstracao"><b>→</b>{t(P.gDemo, idioma)}</a></li>
          <li><a href="#gravacao"><b>□</b>{t(P.gRoteiro, idioma)}</a></li>
        </ul>
      </nav>

      <section className={`${s.secao} ${s.claro} ${s.alvo}`} id="organizar" aria-labelledby="g1-t">
        <div className={s.w}>
          <p className={s.aviso} style={{ marginBottom: 36 }}>{t(P.aviso, idioma)}</p>
          <div className={s.cabGrupo}>
            <div><p className={s.num}>01 · ARARAT HUB</p><h2 id="g1-t">{t(P.g1, idioma)}</h2></div>
            <ul>{t(P.g1Itens, idioma).split("|").map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className={s.org}>
            <Figura cap={CAP.hubFila} idioma={idioma} legenda={oHub} sizes="(min-width: 900px) 60vw, 100vw" />
            <Figura cap={CAP.hubPainel} idioma={idioma} legenda={idioma === "en" ? "Case panel with “Open review”. The “completed” lines are file checks; the other buttons are not demonstrated here." : "Painel do caso com “Abrir revisão”. As linhas “concluída” são checagens de arquivo; os outros botões não são demonstrados aqui."} sizes="(min-width: 900px) 25vw, 80vw" />
          </div>
          <div className={s.destaque} style={{ marginTop: 24, maxWidth: 620 }}>
            <Figura className={s.soDesk} cap={CAP.hubCasoPendente} idioma={idioma} legenda={`${oHub} · ${idioma === "en" ? "after the review: “Review pending”" : "depois da revisão: “Revisão pendente”"}`} sizes="(min-width: 900px) 60vw, 100vw" />
            {/* celular: só a célula Etapa, para "Revisão pendente" chegar ao teto de ampliação; o caso vai na legenda */}
            <Figura className={s.soCel} cap={CAP.hubEtapaPendente} idioma={idioma} legenda={`${oHub} · ProstateX-0067 · ${idioma === "en" ? "after the review: “Review pending”" : "depois da revisão: “Revisão pendente”"}`} sizes="147px" />
          </div>
        </div>
      </section>

      <section className={`${s.secao} ${s.escuro} ${s.alvo}`} id="visualizar" aria-labelledby="g2-t">
        <div className={s.w}>
          <div className={s.cabGrupo}>
            <div><p className={s.num}>02 · ARARAT VIEWER</p><h2 id="g2-t">{t(P.g2, idioma)}</h2></div>
            <p className={s.muted} style={{ margin: 0 }}>{t(P.g2Texto, idioma)}</p>
          </div>
          <div className={s.vis}>
            <Figura cap={CAP.planos} idioma={idioma} legenda={oViewer} sizes="(min-width: 1320px) 1240px, 100vw" />
            <figure className={s.fig}>
              <div className={s.par}>
                {/* eslint-disable-next-line @next/next/no-img-element -- captura real */}
                <img src={CAP.t2.fontes[1].src} srcSet={CAP.t2.fontes.map((f) => `${f.src} ${f.w}w`).join(", ")} sizes="(min-width: 900px) 410px, 50vw" width={CAP.t2.fontes[1].w} height={CAP.t2.fontes[1].h} alt={t(CAP.t2.alt, idioma)} loading="lazy" decoding="async" />
                {/* eslint-disable-next-line @next/next/no-img-element -- captura real */}
                <img src={CAP.adc.fontes[1].src} srcSet={CAP.adc.fontes.map((f) => `${f.src} ${f.w}w`).join(", ")} sizes="(min-width: 900px) 410px, 50vw" width={CAP.adc.fontes[1].w} height={CAP.adc.fontes[1].h} alt={t(CAP.adc.alt, idioma)} loading="lazy" decoding="async" />
              </div>
              <figcaption className={s.origem}>{oViewer}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className={`${s.secao} ${s.branco} ${s.alvo}`} id="medir" aria-labelledby="g3-t">
        <div className={s.w}>
          <div className={s.cabGrupo}>
            <div><p className={s.num}>03 · ARARAT VIEWER</p><h2 id="g3-t">{t(P.g3, idioma)}</h2></div>
            <p className={s.muted} style={{ margin: 0 }}>{t(P.g3Texto, idioma)}</p>
          </div>
          <div className={s.mede}>
            <div>
              <h3>{t(P.reguaTitulo, idioma)}</h3>
              <p className={s.muted}>{t(P.reguaTexto, idioma)}</p>
              <div className={s.duas}>
                <Figura cap={CAP.regua} idioma={idioma} sizes="(min-width: 900px) 280px, 50vw" />
                <Figura cap={CAP.medicoes} idioma={idioma} sizes="(min-width: 900px) 280px, 50vw" />
              </div>
              <div className={s.destaque}><Figura cap={CAP.medidaM1} idioma={idioma} legenda={idioma === "en" ? "Completed measurement, cropped from the same screenshot." : "Medida concluída, recortada da mesma captura."} sizes="(min-width: 900px) 404px, 90vw" /></div>
            </div>
            <div>
              <h3>{t(P.relatorioTitulo, idioma)}</h3>
              <p className={s.muted}>{t(P.relatorioTexto, idioma)}</p>
              <div className={s.duas}>
                <Figura cap={CAP.imagensRelatorio} idioma={idioma} sizes="(min-width: 900px) 280px, 50vw" />
                <Figura cap={CAP.previa} idioma={idioma} sizes="(min-width: 900px) 280px, 50vw" />
              </div>
              <div className={s.destaque}><Figura cap={CAP.visualizarRelatorio} idioma={idioma} legenda={idioma === "en" ? "Foot of the same panel: “View report” opens the preview." : "Pé do mesmo painel: “Visualizar relatório” abre a prévia."} sizes="(min-width: 900px) 389px, 90vw" /></div>
            </div>
          </div>
          <p className={s.origem}>{oViewer}</p>
        </div>
      </section>

      <section className={`${s.secao} ${s.alvo}`} id="demonstracao" aria-labelledby="demo-sec-t">
        <div className={`${s.w} ${s.guiada}`}>
          <div>
            <p className={M("")}>{t(P.demoRotulo, idioma)}</p>
            <h2 id="demo-sec-t">{t(P.gDemo, idioma)}</h2>
            <p className={s.muted}>{t(P.demoTexto, idioma)}</p>
            <ol className={s.passos}>{etapas.map((e) => <li key={e.id}>{e.titulo}</li>)}</ol>
            <div style={{ marginTop: 22 }}>
              <DemoGuiada
                etapas={etapas}
                modulo={MODULO_DEMO}
                rotulos={{ iniciar: t(P.demoIniciar, idioma), sair: t(P.demoSair, idioma), anterior: t(P.demoAnterior, idioma), proxima: t(P.demoProxima, idioma), etapa: t(P.demoEtapa, idioma), de: t(P.demoDe, idioma), titulo: t(P.gDemo, idioma), origem: oViewer.replace("ARARAT Viewer", "ARARAT Hub · ARARAT Viewer") }}
              />
            </div>
            <noscript><p className={s.muted}>{t(P.demoSemJs, idioma)}</p></noscript>
          </div>
          <details className={s.estatico}>
            <summary>{idioma === "en" ? "The seven steps as still screenshots" : "As sete etapas em capturas estáticas"}</summary>
            <ol className={s.estaticoLista}>
              {etapas.map((e) => (
                <li key={e.id}>
                  <h3>{e.n} · {e.titulo}</h3>
                  <p className={s.muted} style={{ margin: "4px 0 0", fontSize: 15 }}>{e.texto}</p>
                  <div className={s.estaticoImgs}>
                    {e.imagens.map((im) => (
                      // eslint-disable-next-line @next/next/no-img-element -- capturas do roteiro estático
                      <img key={im.src} src={im.src} width={im.w} height={im.h} alt={im.alt} loading="lazy" decoding="async" style={{ background: im.produto === "hub" ? "#fff" : "#0b0c0e" }} />
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </details>
        </div>
      </section>

      <section className={`${s.secao} ${s.claro} ${s.alvo}`} id="gravacao" aria-labelledby="grav-t">
        <div className={s.w}>
          <p className={M("")}>{t(P.roteiroRotulo, idioma)}</p>
          <h2 id="grav-t">{t(P.roteiroTitulo, idioma)}</h2>
          <p className={s.lead}>{t(P.roteiroTexto, idioma)}</p>
          <ol className={s.roteiro} style={{ listStyle: "none", padding: 0 }}>
            <li><figure>
              <span className={s.tag}>1 · {t(P.roteiroInicio, idioma)}</span>
              <div className={s.tela}>
                {/* eslint-disable-next-line @next/next/no-img-element -- captura real */}
                <img src={CAP.hubFila.fontes[1].src} width={CAP.hubFila.fontes[1].w} height={CAP.hubFila.fontes[1].h} alt={t(CAP.hubFila.alt, idioma)} loading="lazy" decoding="async" />
              </div>
              <figcaption>{t(P.roteiroInicioTexto, idioma)}</figcaption>
            </figure></li>
            <li><figure>
              <span className={s.tag}>2 · {t(P.roteiroAcao, idioma)}</span>
              <div className={`${s.tela} ${s.escura}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- captura real */}
                <img src={CAP.regua.fontes[1].src} width={CAP.regua.fontes[1].w} height={CAP.regua.fontes[1].h} alt={t(CAP.regua.alt, idioma)} loading="lazy" decoding="async" />
              </div>
              <figcaption>{t(P.roteiroAcaoTexto, idioma)}</figcaption>
            </figure></li>
            <li><figure>
              <span className={s.tag}>3 · {t(P.roteiroResultado, idioma)}</span>
              <div className={s.tela}>
                {/* eslint-disable-next-line @next/next/no-img-element -- captura real */}
                <img src={CAP.hubCasoPendente.fontes[0].src} width={CAP.hubCasoPendente.fontes[0].w} height={CAP.hubCasoPendente.fontes[0].h} alt={t(CAP.hubCasoPendente.alt, idioma)} loading="lazy" decoding="async" />
              </div>
              <figcaption>{t(P.roteiroResultadoTexto, idioma)}</figcaption>
            </figure></li>
          </ol>
          <p className={s.semVideo}>{idioma === "en" ? "Still images · no video yet" : "Imagens estáticas · ainda sem vídeo"}</p>
        </div>
      </section>

      <section className={`${s.secao} ${s.branco}`}>
        <div className={`${s.w} ${s.modelos}`}>
          <div><p className={M("")}>{t(P.modelosRotulo, idioma)}</p><h2>{t(P.modelosTitulo, idioma)}</h2></div>
          <div><p className={s.muted} style={{ margin: "0 0 10px" }}>{t(P.modelosTexto, idioma)}</p><a className={s.lk} href={ROTAS[idioma].pesquisa}>{t(PESQUISA.rotulo, idioma)} →</a></div>
        </div>
      </section>

      <section className={s.branco} style={{ padding: "8px 0 44px" }}>
        <div className={s.w}>
          <p className={s.aviso}>
            {idioma === "en" ? "Images: " : "Imagens: "}{ATRIBUICAO_FLUXO.citacao}{" "}
            <a href={ATRIBUICAO_FLUXO.doi}>{ATRIBUICAO_FLUXO.doi.replace("https://", "")}</a> —{" "}
            <a href={ATRIBUICAO_FLUXO.licenca.url}>{ATRIBUICAO_FLUXO.licenca.nome}</a>.{" "}
            {idioma === "en"
              ? "Shown in ARARAT Viewer and ARARAT Hub (product rendering and window/level), captured and cropped for this page; interface overlays (ruler, crosshair) are part of the screenshots. No endorsement by TCIA, Radboudumc or the dataset authors."
              : `${ATRIBUICAO_FLUXO.tratamentos} ${ATRIBUICAO_FLUXO.endosso}`}
          </p>
        </div>
      </section>
    </Moldura>
  );
}

/* ================================================================ PESQUISA */
export function PesquisaInstitucional({ idioma }: { idioma: Idioma }) {
  const P = PESQUISA;
  const pergunta = idioma === "en" ? "Can T2 radiomics with machine learning distinguish ISUP < 3 from ISUP ≥ 3 in biopsy-confirmed prostate cancer lesions?" : PUBLICACAO.pergunta;
  return (
    <Moldura idioma={idioma} pagina="pesquisa">
      <section className={s.topo} aria-labelledby="pesq-t">
        <div className={s.w}>
          <p className={M("")}>{t(P.rotulo, idioma)}</p>
          <h1 id="pesq-t">{t(P.titulo, idioma)}</h1>
          <p className={`${s.lead} ${s.muted}`}>{t(P.subtitulo, idioma)}</p>
        </div>
      </section>
      <section className={`${s.secao} ${s.claro}`} id="publicado" aria-labelledby="pub-t">
        <div className={s.w}>
          <p className={M("")}>{t(P.publicadoRotulo, idioma)}</p>
          <h2 id="pub-t" style={{ marginBottom: 32 }}>{t(HOME.pesquisaTitulo, idioma)}</h2>
          <div className={s.pub}>
            <dl>
              <div><dt>{t(P.pergunta, idioma)}</dt><dd>{pergunta}</dd></div>
              <div><dt>{t(P.dadosMetodo, idioma)}</dt><dd>{t(P.dadosMetodoTexto, idioma)}</dd></div>
              <div><dt>{t(P.avaliacao, idioma)}</dt><dd>{t(P.avaliacaoTexto, idioma)}</dd></div>
            </dl>
            <aside className={s.ref} aria-label={t(P.referencia, idioma)}>
              <p className={M("")}>{t(P.referencia, idioma)}</p>
              <p className={s.refTit} lang="en">{PUBLICACAO.tituloCompleto}</p>
              <p className={s.muted} style={{ margin: 0 }}>{PUBLICACAO.autores} · {PUBLICACAO.periodico} · {PUBLICACAO.ano}</p>
              <p style={{ margin: "14px 0 0" }}><a className={s.lk} href={PUBLICACAO.href}>DOI {PUBLICACAO.doi}</a></p>
            </aside>
          </div>
          <div className={s.limites}>
            <div><h3>{t(P.l1Titulo, idioma)}</h3>{t(P.l1Texto, idioma)}</div>
            <div><h3>{t(P.l2Titulo, idioma)}</h3>{t(P.l2Texto, idioma)}</div>
            <div><h3>{t(P.l3Titulo, idioma)}</h3>{t(P.l3Texto, idioma)}</div>
          </div>
        </div>
      </section>
      <section className={`${s.secao} ${s.branco}`} id="andamento" aria-labelledby="and-t">
        <div className={`${s.w} ${s.anda}`}>
          <div><p className={M("")}>{t(P.andamentoRotulo, idioma)}</p><h2 id="and-t">{t(P.andamentoTitulo, idioma)}</h2></div>
          <div><span className={s.estado}>{t(P.andamentoEstado, idioma)}</span><p style={{ marginTop: 14 }}>{t(P.andamentoTexto, idioma)}</p></div>
        </div>
      </section>
      <section className={s.secao} id="limites" aria-labelledby="lim-t">
        <div className={s.w}>
          <p className={M("")}>{t(P.naoMostraRotulo, idioma)}</p>
          <h2 id="lim-t" style={{ maxWidth: "22em" }}>{t(P.naoMostraTitulo, idioma)}</h2>
          <p className={s.muted} style={{ maxWidth: "40em", marginTop: 14 }}>{t(P.naoMostraTexto, idioma)} <a className={s.lk} href={ROTAS[idioma].plataforma}>{t(PLATAFORMA.rotulo, idioma)} →</a></p>
          <p className={M("")} style={{ marginTop: 40 }}>{t(P.principiosRotulo, idioma)}</p>
          <div className={s.principios}>
            {PRINCIPIOS.map((p) => <div key={p.titulo.pt}><h3>{t(p.titulo, idioma)}</h3>{t(p.texto, idioma)}</div>)}
          </div>
        </div>
      </section>
    </Moldura>
  );
}

/* ================================================================ EMPRESA */
export function EmpresaInstitucional({ idioma }: { idioma: Idioma }) {
  const E = EMPRESA;
  const pessoas = equipe(idioma);
  const rotas = Object.fromEntries(pessoas.map((p) => [p.id, rotaPessoa(idioma, p.id)]));
  return (
    <Moldura idioma={idioma} pagina="empresa">
      <section className={s.topo} aria-labelledby="emp-t">
        <div className={s.w}>
          <p className={M("")}>{t(E.rotulo, idioma)}</p>
          <h1 id="emp-t">{t(E.titulo, idioma)}</h1>
          <p className={`${s.lead} ${s.muted}`}>{t(E.subtitulo, idioma)}</p>
          <dl className={s.fatos}>
            <div><dt>{t(E.fFoco, idioma)}</dt><dd>{t(E.fFocoV, idioma)}</dd></div>
            <div><dt>{t(E.fApps, idioma)}</dt><dd>ARARAT Hub · ARARAT Viewer</dd></div>
            <div><dt>{t(E.fPesquisa, idioma)}</dt><dd>{t(E.fPesquisaV, idioma)}</dd></div>
            <div><dt>{t(E.fEquipe, idioma)}</dt><dd>{t(E.fEquipeV, idioma)}</dd></div>
          </dl>
        </div>
      </section>
      <section className={`${s.secao} ${s.claro}`} id="equipe" aria-labelledby="eq-t">
        <div className={s.w}>
          <p className={M("")}>{t(E.equipeRotulo, idioma)}</p>
          <h2 id="eq-t">{t(E.equipeTitulo, idioma)}</h2>
          <EquipeGrade pessoas={pessoas} rotas={rotas} rotulos={{ lerBio: t(E.lerBio, idioma), fecharBio: t(E.fecharBio, idioma), fechar: t(E.fechar, idioma), equipe: t(E.equipeRotulo, idioma), de: t(E.de, idioma) }} />
          <p className={s.muted} style={{ marginTop: 32, fontSize: 14, maxWidth: "46em" }}>{t(E.nota, idioma)}</p>
        </div>
      </section>
    </Moldura>
  );
}

/* ================================================================ PESSOA (destino sem JavaScript) */
export function PessoaInstitucional({ idioma, pessoa }: { idioma: Idioma; pessoa: Pessoa }) {
  const outra = rotaPessoa(idioma === "en" ? "pt" : "en", pessoa.id);
  const f = pessoa.fotos[pessoa.fotos.length - 1];
  return (
    <Moldura idioma={idioma} pagina="empresa" rotaOutroIdioma={outra}>
      <section className={`${s.secao} ${s.branco}`} aria-labelledby="pessoa-t">
        <div className={s.w}>
          <p><a className={s.lk} href={`${ROTAS[idioma].empresa}#p-${pessoa.id}`}>← {t(EMPRESA.voltarEquipe, idioma)}</a></p>
          <div className={s.individual}>
            {/* eslint-disable-next-line @next/next/no-img-element -- retrato */}
            <img src={f.src} width={f.w} height={Math.round((f.w * 5) / 4)} alt={pessoa.alt} />
            <div>
              <p className={M("")}>{t(EMPRESA.equipeRotulo, idioma)}</p>
              <h1 id="pessoa-t">{pessoa.nome}</h1>
              <p style={{ color: "#4a4a4a", fontSize: 18, margin: "6px 0 24px" }}>{pessoa.funcao}</p>
              {pessoa.bio.map((b) => <p key={b.slice(0, 24)} className={s.bioTexto}>{b}</p>)}
              <p className={s.muted} style={{ fontSize: 14, marginTop: 28 }}>{t(EMPRESA.nota, idioma)}</p>
            </div>
          </div>
        </div>
      </section>
    </Moldura>
  );
}
