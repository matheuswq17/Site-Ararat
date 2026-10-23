import { FundoVideo } from "./FundoVideo";
import type { ReactNode } from "react";
import { conteudo, type Idioma } from "@/lib/ararat/conteudo";
import { href } from "@/lib/ararat/rotas";
import { comCapturas, DEMO_ASSETS, demoDisponivel, exibivel, PACOTES, srcVideo, VIDEO_DEMO, videoDisponivel } from "@/lib/ararat/midia";
import { AvisoP, BotaoPausa, ImgCaptura, LinkOriginal, Quadro, Seta, Lk } from "./base";
import type { ArquivoCaptura } from "@/lib/ararat/midia";

/** Legenda de uma figura: some na variante pública quando repetiria a descrição textual da captura. */
function Leg({ arquivo, alt, children }: { arquivo: ArquivoCaptura; alt: string; children: ReactNode }) {
  if (!exibivel(arquivo) && typeof children === "string" && children === alt) return null;
  return <figcaption className="legenda">{children}</figcaption>;
}

/* Plataforma: Hub e Viewer com contexto e a demonstração acessível NO TOPO. Composição por tarefa (não o mesmo bloco
 * seis vezes): faixa larga para a fila do Hub; planos em largura total; máscaras com as tiras do Viewer; medir pelas
 * medições (a régua inteira fica no caso da Home e no arquivo original); revisão numa linha; documentar pelas
 * imagens do relatório (a prévia inteira fica na Home e no arquivo original). Adoção aprofundada no fim. */

type Etapa = ReturnType<typeof conteudo>["demo"]["etapas"][number];
type ImgDemo = readonly [string, number, number, string, ...boolean[]];
const imgsDemo = (lista: readonly ImgDemo[]) => lista.map(([src, w, h, alt, hub]) => ({ src, w, h, alt, hub: !!hub }));

function dadosDemo(idioma: Idioma) {
  const c = conteudo(idioma), D = c.demo;
  const etapas = D.etapas.map((e: Etapa) => {
    const x = e as Etapa & { avisoTipo?: string; leituras?: ReadonlyArray<{ p: number; rotulo: string; texto: string; principal?: boolean; imagens: readonly ImgDemo[] }> };
    const leituras = x.leituras?.map((l) => ({ p: l.p, rotulo: l.rotulo, texto: l.texto, principal: !!l.principal, imagens: imgsDemo(l.imagens) }));
    return { p: x.p, titulo: x.titulo, texto: x.texto, aviso: x.aviso, avisoTipo: x.avisoTipo ?? "origem", detalhe: x.detalhe,
      imagens: leituras ? leituras[leituras.length - 1].imagens : imgsDemo(("imagens" in x ? x.imagens : []) as readonly ImgDemo[]), ...(leituras ? { leituras } : {}) };
  });
  return { rotulos: { ...D.rotulos, carregando: c.extra.demoCarregando, falha: c.extra.demoFalhou }, etapas, pacote: PACOTES.fluxo, assets: DEMO_ASSETS };
}

/** Demonstração guiada (fluxo 0.8.0-03d2). Revisão privada: diálogo + roteiro sem JS com capturas. Variante pública:
 *  só o roteiro em texto (as capturas têm permissão pendente), sem botão de algo que não existe. */
function Demo({ idioma }: { idioma: Idioma }) {
  const c = conteudo(idioma), Pl = c.plataforma;
  const d = dadosDemo(idioma), R = d.rotulos;
  if (!demoDisponivel()) {
    return (
      <details className="demo-texto" id="demo">
        <summary>{Pl.demo_titulo}</summary>
        <p className="lead-menor">{c.extra.demoTexto}</p>
        <ol className="demo-roteiro">
          {d.etapas.map((e, n) => (
            <li key={n}><span className="mono">{R.etapa} {n + 1} {R.de} {d.etapas.length}</span><b>{e.titulo}</b><span>{e.texto}</span><span className="aviso-demo" data-tipo={e.avisoTipo}>{e.aviso}</span></li>
          ))}
        </ol>
      </details>
    );
  }
  const json = JSON.stringify(d).replace(/</g, "\\u003c");
  return (
    <div className="demo-topo" id="demo" data-demo-raiz="">
      <div className="demo-acao">
        <button className="btn btn-1" type="button" data-demo-abrir="" hidden>{Pl.topo_demo}<Seta /></button>
        <p className="legenda">{Pl.topo_demo_nota}</p>
      </div>
      <details className="demo-semjs" data-demo-semjs="">
        <summary>{Pl.demo_semjs}</summary>
        <ol>
          {d.etapas.map((e, n) => {
            const imgs = e.leituras ? e.leituras.flatMap((l) => l.imagens) : e.imagens;
            return (
              <li key={n}>
                <p className="mono">{R.etapa} {n + 1} {R.de} {d.etapas.length}</p><h3>{e.titulo}</h3><p>{e.texto}</p>
                <p className="aviso-demo" data-tipo={e.avisoTipo}>{e.aviso}</p>
                <div className="semjs-imgs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {imgs.map((im, j) => <img key={j} className={im.hub ? "cap ui" : "cap"} src={DEMO_ASSETS + im.src} width={im.w} height={im.h} alt={im.alt} loading="lazy" style={{ background: im.hub ? "#fff" : "#0b0c0e", "--nat": im.w } as React.CSSProperties} />)}
                </div>
              </li>
            );
          })}
        </ol>
      </details>
      <script type="application/json" dangerouslySetInnerHTML={{ __html: json }} />
      <dialog className="demo2" aria-labelledby="demo-titulo" data-demo="">
        <div className="d-barra">
          <span className="d-rot">{Pl.demo_titulo}</span><span className="d-n" data-n="" aria-live="polite" />
          <BotaoPausa idioma={idioma} />
          <button type="button" className="btn btn-2 d-sair" data-sair="">{R.sair} <span aria-hidden="true">✕</span></button>
        </div>
        <div className="d-corpo">
          <div className="d-texto">
            <h2 id="demo-titulo" data-titulo="" />
            <p className="d-desc" data-texto="" />
            <p className="aviso-demo" data-aviso="" role="note" />
            {/* carregando / falha: texto na coluna de leitura, fora do desenho — legível em 320 px, sem depender de alt cortado no palco */}
            <p className="d-estado" data-palco-estado="" role="status" hidden />
            <div className="d-leituras" data-leituras="" role="group" aria-label={R.leitura} hidden />
            <details className="d-det">
              <summary><span className="d-det-rot">{R.detalhe}</span><span className="d-det-i" aria-hidden="true">i</span></summary>
              <div className="d-det-corpo"><p data-detalhe-desc="" /><p data-detalhe="" /></div>
            </details>
            <div className="d-ctrl">
              <button type="button" className="btn btn-2" data-anterior="">← {R.anterior}</button>
              <button type="button" className="btn btn-1" data-proxima="">{R.proxima} →</button>
            </div>
            <div className="d-pontos" data-pontos="" aria-hidden="true">{d.etapas.map((_, n) => <span key={n} />)}</div>
          </div>
          <div className="d-palco" data-palco="">
            <div className="d-host" data-palco-host="" aria-hidden="true" />
            <div className="d-estatico" data-palco-estatico="" hidden />
          </div>
        </div>
      </dialog>
    </div>
  );
}

type Grupo = ReturnType<typeof conteudo>["plataforma"]["grupos"][number];

function Tarefa({ g, children, classe }: { g: Grupo; idioma: Idioma; children?: ReactNode; classe: string }) {
  return (
    <article className={`tarefa ${classe}${children ? "" : " sem-midia"}`} id={g.id} aria-labelledby={`${g.id}-t`}>
      <div className="t-txt">
        <span className="prod">ARARAT {g.produto === "hub" ? "Hub" : "Viewer"}</span>
        <h2 id={`${g.id}-t`}>{g.titulo}</h2>
        <p>{g.texto}</p>
        <ul className="t-itens">{g.itens.map((i) => <li key={i}>{i}</li>)}</ul>
      </div>
      {children ? <div className="t-midia">{children}</div> : null}
    </article>
  );
}

/** Topo da Plataforma (comum às duas composições). */
function TopoPlataforma({ idioma, children }: { idioma: Idioma; children?: ReactNode }) {
  const c = conteudo(idioma), Pl = c.plataforma;
  return (
    <section className="sec escura topo-pag plat-topo topo-com-fundo" aria-labelledby="pl-h1">
      <FundoVideo idioma={idioma} />
      <div className="w">
        <span className="estrato" aria-hidden="true" />
        <div className="plat-topo-grade">
          <div className="plat-topo-txt">
            <h1 id="pl-h1" className="titulo-sec" data-texto="h1">{Pl.titulo}</h1>
            <p className="lead">{Pl.lead}</p>
          </div>
          <ul className="plat-produtos">
            {(["hub", "viewer"] as const).map((k) => (
              <li key={k}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/ararat/marca/ararat-${k}-negativo.svg`} alt={`ARARAT ${k === "hub" ? "Hub" : "Viewer"}`} height={24} />
                <span>{(k === "hub" ? c.percurso.passos.slice(0, 2) : c.percurso.passos.slice(2)).map(([, tt]) => tt).join(" · ")}</span>
              </li>
            ))}
          </ul>
        </div>
        {children}
      </div>
    </section>
  );
}

/** "Hub e Viewer em ação" (#video): UM player, formato escolhido no clique (horizontal; vertical até
 *  VIDEO_DEMO.verticalAte px). Sem autoplay, sem loop, sem download antes do clique: a capa vem de <picture> (só a do
 *  formato da tela) e o <video> só é criado pelo cliente (lib/ararat/cliente/video.ts). A área é reservada pelo CSS
 *  (proporção do formato). Sem JS: <noscript> com o player nativo (preload="none"). Resumo textual sempre presente. */
function VideoDemo({ idioma }: { idioma: Idioma }) {
  if (!videoDisponivel()) return null;
  const c = conteudo(idioma), V = c.plataforma.video, H = VIDEO_DEMO.horizontal, Vt = VIDEO_DEMO.vertical;
  const mqV = `(max-width: ${VIDEO_DEMO.verticalAte}px)`;
  return (
    <section className="sec escura plat-video" id="video" aria-labelledby="video-t">
      <div className="w">
        <div className="cabeca-sec">
          <span className="rotulo-sec">{V.rotulo}</span>
          <h2 id="video-t" className="titulo-sec titulo-medio">{V.titulo}</h2>
          <p className="lead">{V.lead}</p>
        </div>
        <div className="video-demo" data-video-demo="" data-mq={mqV} data-src-h={srcVideo(H.arquivo)} data-src-v={srcVideo(Vt.arquivo)}
          data-rotulo={V.rotulo_video} data-falha={V.falha}>
          <div className="video-quadro" data-video-quadro="">
            <button type="button" className="video-capa" data-video-play="" aria-label={`${V.reproduzir}: ${V.titulo} (${V.duracao})`}>
              <picture>
                <source media={mqV} srcSet={srcVideo(Vt.capa)} width={Vt.w / 2} height={Vt.h / 2} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={srcVideo(H.capa)} width={H.w / 2} height={H.h / 2} alt="" loading="lazy" decoding="async" />
              </picture>
              <span className="video-acao" aria-hidden="true">
                <span className="video-play"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg></span>
                <span className="video-dur">{V.reproduzir} · <time dateTime="PT1M55S">{V.duracao}</time></span>
              </span>
            </button>
            <noscript>
              <video className="video-nativo" controls preload="none" playsInline poster={srcVideo(H.capa)} aria-label={V.rotulo_video}>
                <source src={srcVideo(H.arquivo)} type="video/mp4" />
              </video>
            </noscript>
            <p className="video-msg" data-video-msg="" role="status" aria-live="polite" hidden />
          </div>
        </div>
        <div className="video-info">
          <p className="legenda">{V.nota}</p>
          <p className="legenda">{V.limite}</p>
          <details className="video-resumo">
            <summary>{V.resumo_titulo}</summary>
            <ol>{V.resumo.map(([tt, x]) => <li key={tt}><span className="mono">{tt}</span><span>{x}</span></li>)}</ol>
          </details>
        </div>
      </div>
    </section>
  );
}

/** Variante SEM capturas: as seis tarefas em texto (o que faz, itens, papel do radiologista), sem demonstração,
 *  sem quadros vazios e sem legendas ou avisos de régua/prévia que só existem para acompanhar as imagens. */
function PlataformaSemCapturas({ idioma }: { idioma: Idioma }) {
  const c = conteudo(idioma), Pl = c.plataforma, C = c.caso;
  const g = Object.fromEntries(Pl.grupos.map((x) => [x.id, x])) as Record<string, Grupo>;
  return (
    <>
      <TopoPlataforma idioma={idioma} />
      <VideoDemo idioma={idioma} />
      <section className="sec clara plat-hub" aria-label="ARARAT Hub">
        <div className="w">
          <div className="rad-intro"><span className="rotulo-sec">{Pl.radiologista_rotulo}</span><p className="lead">{Pl.radiologista}</p></div>
          <Tarefa g={g.receber} idioma={idioma} classe="tarefa-plena" />
        </div>
      </section>
      <section className="sec escura plat-viewer" aria-label="ARARAT Viewer">
        <div className="w">
          <Tarefa g={g.navegar} idioma={idioma} classe="tarefa-plena" />
          <div className="tarefas-grade tarefas-texto">
            {(["mascaras", "medir", "revisar", "documentar"] as const).map((id) => (
              <div key={id} className="tarefa-celula">
                <Tarefa g={g[id]} idioma={idioma} classe={`tarefa-${id}`} />
                {id === "revisar" ? <p className="decisao">{C.decisao}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
      <Adocao idioma={idioma} />
    </>
  );
}

export function PaginaPlataforma({ idioma }: { idioma: Idioma }) {
  if (!comCapturas()) return <PlataformaSemCapturas idioma={idioma} />;
  const c = conteudo(idioma), Pl = c.plataforma, X = c.extra, C = c.caso;
  const g = Object.fromEntries(Pl.grupos.map((x) => [x.id, x])) as Record<string, Grupo>;
  const alt = {
    fila: C.leg.fila, painel: C.leg.painel, planos: C.leg.planos,
    seg: c.prostata.midia[0].alt, legenda: C.leg.legenda_mascaras,
  };
  return (
    <>
      <TopoPlataforma idioma={idioma}><Demo idioma={idioma} /></TopoPlataforma>
      <VideoDemo idioma={idioma} />

      <section className="sec clara plat-hub" aria-label="ARARAT Hub">
        <div className="w">
          <div className="rad-intro"><span className="rotulo-sec">{Pl.radiologista_rotulo}</span><p className="lead">{Pl.radiologista}</p></div>
          <Tarefa g={g.receber} idioma={idioma} classe="tarefa-larga">
            <figure className="t-fig">
              <Quadro idioma={idioma} arquivo="hub-fila-pronto-1184.webp" alt={alt.fila} ui claro moldura="moldura" />
              <Leg arquivo="hub-fila-pronto-1184.webp" alt={alt.fila}>{alt.fila}</Leg>
            </figure>
            <figure className="t-fig t-fig-menor">
              <Quadro idioma={idioma} arquivo="hub-painel-sem-checagens-556.webp" alt={alt.painel} ui claro moldura="moldura" />
              <Leg arquivo="hub-painel-sem-checagens-556.webp" alt={alt.painel}>{Pl.hub_legenda}</Leg>
            </figure>
          </Tarefa>
        </div>
      </section>

      <section className="sec escura plat-viewer" aria-label="ARARAT Viewer">
        <div className="w">
          <Tarefa g={g.navegar} idioma={idioma} classe="tarefa-plena">
            <figure className="t-fig">
              <Quadro idioma={idioma} arquivo="viewer-planos-mira-1510.webp" alt={alt.planos} moldura="moldura" />
              <figcaption className="legenda">{exibivel("viewer-planos-mira-1510.webp") ? `${alt.planos} · ` : ""}{C.origem}</figcaption>
            </figure>
          </Tarefa>
          <div className="tarefas-grade">
            <Tarefa g={g.mascaras} idioma={idioma} classe="tarefa-mascaras">
              <figure className="t-fig">
                <Quadro idioma={idioma} arquivo="seg-t2-com-mascaras-748.webp" alt={alt.seg} moldura="moldura" />
                {exibivel("seg-legenda-mascaras.webp") ? (
                  <div className="tiras">
                    <ImgCaptura arquivo="seg-legenda-mascaras.webp" alt={alt.legenda} ui />
                    <ImgCaptura arquivo="seg-estado-mascaras.webp" alt={X.altEstadoMascaras} ui />
                    <ImgCaptura arquivo="seg-volume-glandula.webp" alt={X.altVolume} ui />
                  </div>
                ) : null}
                <figcaption className="legenda">{X.metricasReais} {c.prostata.aviso_regua}</figcaption>
              </figure>
            </Tarefa>
            <Tarefa g={g.medir} idioma={idioma} classe="tarefa-medir">
              <figure className="t-fig">
                <Quadro idioma={idioma} arquivo="viewer-medicoes-814.webp" alt={X.altMedicoes} ui moldura="moldura" />
                <Quadro idioma={idioma} arquivo="viewer-medida-m1-404.webp" alt={X.reguaLegenda} moldura="moldura" className="m1" />
                <figcaption className="legenda">{X.reguaLegenda} <LinkOriginal idioma={idioma} arquivo="viewer-regua-748.webp" className="link-seta" /></figcaption>
              </figure>
              <AvisoP>{X.reguaAviso}</AvisoP>
            </Tarefa>
            <Tarefa g={g.revisar} idioma={idioma} classe="tarefa-revisar">
              <figure className="t-fig">
                <Quadro idioma={idioma} arquivo="hub-caso-revisao-pendente-900.webp" alt={Pl.volta_legenda} ui claro moldura="moldura" />
                <Leg arquivo="hub-caso-revisao-pendente-900.webp" alt={Pl.volta_legenda}>{Pl.volta_legenda}</Leg>
              </figure>
              <p className="decisao">{C.decisao}</p>
            </Tarefa>
            <Tarefa g={g.documentar} idioma={idioma} classe="tarefa-documentar">
              <figure className="t-fig">
                <Quadro idioma={idioma} arquivo="viewer-imagens-relatorio-778.webp" alt={X.altImagensRelatorio} ui moldura="moldura" />
                <figcaption className="legenda">{X.previaLegenda} <LinkOriginal idioma={idioma} arquivo="viewer-previa-relatorio-1280.webp" className="link-seta" /></figcaption>
              </figure>
              <AvisoP>{X.soPrevia}</AvisoP>
            </Tarefa>
          </div>
        </div>
      </section>

      <Adocao idioma={idioma} />
    </>
  );
}

function Adocao({ idioma }: { idioma: Idioma }) {
  const Pl = conteudo(idioma).plataforma;
  return (
    <section className="sec tom" id="adocao" aria-labelledby="ad-t">
      <div className="w">
        <div className="cabeca-sec"><h2 id="ad-t" className="titulo-sec titulo-medio">{Pl.adocao_titulo}</h2><p className="lead">{Pl.adocao_lead}</p></div>
        <h3 className="sub-adocao">{Pl.conhecido_titulo}</h3>
        <div className="adocao adocao-3">
          {Pl.adocao_cols.map(([a, itens]) => <div key={a}><h4>{a}</h4><ul>{itens.map((x) => <li key={x}>{x}</li>)}</ul></div>)}
        </div>
        <div className="adocao-duas">
          <div className="definir"><h3>{Pl.definir_titulo}</h3><ol>{Pl.definir.map((x) => <li key={x}>{x}</li>)}</ol></div>
          <div className="aberto"><h3>{Pl.aberto_titulo}</h3><ul>{Pl.aberto.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </div>
        <p className="mais"><Lk className="link-seta" href={href("evidence", idioma)}>{conteudo(idioma).nav[2][1]}</Lk></p>
      </div>
    </section>
  );
}
