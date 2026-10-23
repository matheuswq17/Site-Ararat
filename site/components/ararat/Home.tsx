import { conteudo, IDIOMAS, type Idioma } from "@/lib/ararat/conteudo";
import { href, type Pagina } from "@/lib/ararat/rotas";
import { comCapturas, demoDisponivel, exibivel, PACOTES, videoDisponivel, type ArquivoCaptura } from "@/lib/ararat/midia";
import { Aviso, BotaoPausa, CapturaTexto, EstagioLi, ImgCaptura, LinkOriginal, Ponto, Quadro, Seta, ChipEstagio, Lk } from "./base";
import { Camadas } from "./Camadas";
import { MONTANHA_CANDIDATA, MONTANHA_CANDIDATA_ANTERIOR } from "@/lib/ararat/montanha-candidata";

/* Home (Atlas clínico, integrado): 1) abertura com a montanha; 2) um caso real ligando Model, Hub e Viewer;
 * 3) evidência publicada + instalação local; 4) equipe, públicos e contato. */

const MOVEL = [320, 335, 350, 365, 380, 390, 395, 410, 430, 450, 475, 500, 530, 560, 590];

function PictureHero() {
  const a = (f: string) => `${PACOTES.montanha}assets/${f}`;
  return (
    <picture>
      {MOVEL.map((w, i) => {
        const prox = MOVEL[i + 1] ?? 900;
        const [f1, f2] = w === 390 ? ["arte-escultura-movel.webp", "arte-escultura-movel.webp"] : [`arte-escultura-movel-w${w}@1x.webp`, `arte-escultura-movel-w${w}@2x.webp`];
        const mn = i === 0 ? "" : `(min-width: ${w}px) and `;
        return <source key={w} media={`${mn}(max-width: ${prox - 0.02}px)`} srcSet={`${a(f1)} 1x, ${a(f2)} 2x`} />;
      })}
      {([["(min-width: 1200px) and (min-height: 960px)", 1060], ["(min-width: 900px) and (min-height: 860px)", 860], ["(min-width: 900px)", 660]] as const).map(([m, w]) => (
        <source key={w} media={m} srcSet={`${a(`arte-escultura-desktop-w${w}@1x.webp`)} 1x, ${a(`arte-escultura-desktop-w${w}@2x.webp`)} 2x`} />
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a("arte-escultura-desktop-w660@1x.webp")} width={660} height={396} alt="" fetchPriority="high" decoding="async" data-poster-montanha="" />
    </picture>
  );
}

const esc = (x: string | number) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const SETA_HTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const CHEIO = new Set(["validacao", "frente_validacao", "desenvolvido", "publicado"]);

/** Cópia INERTE do texto da abertura em outro idioma, só para medir (a montanha usa a MAIOR altura entre EN/PT/ES e
 *  não muda ao trocar de idioma). Vai num <template> como HTML pronto: o React não hidrata conteúdo de template. */
function textoHeroMedida(l: Idioma): string {
  const c = conteudo(l), demo = demoDisponivel();
  const est = c.home.estagio.map(([, r, k]) => {
    const kk = k === "validacao" ? "frente_validacao" : k;
    return `<li><span class="ponto${CHEIO.has(kk) ? "" : " oco"}" aria-hidden="true"></span><span><b>${esc(r)}</b> · ${esc(c.estagio[kk as keyof typeof c.estagio])}</span></li>`;
  }).join("");
  return `<div class="w txt"><h1>${esc(c.abertura.h1)}</h1><div class="base"><p class="sub"><span class="sub-longa">${esc(c.abertura.sub)}</span><span class="sub-curta">${esc(c.abertura.sub_curta)}</span></p>`
    + `<div class="lado"><ul class="estagios">${est}</ul><div class="acoes"><a class="btn btn-1">${esc(demo ? c.home.cta1 : c.extra.verPlataforma)}${SETA_HTML}</a><a class="link-seta">${esc(c.home.cta2)}</a></div>`
    + `<span class="pausa-reserva" aria-hidden="true"></span></div></div></div>`;
}

/** Texto da abertura no idioma da página. */
function TextoHero({ idioma }: { idioma: Idioma }) {
  const c = conteudo(idioma);
  const demo = demoDisponivel();
  return (
    <div className="w txt" data-txt="">
      <h1 id="h1" data-texto="h1">{c.abertura.h1}</h1>
      <div className="base">
        <p className="sub"><span className="sub-longa">{c.abertura.sub}</span><span className="sub-curta">{c.abertura.sub_curta}</span></p>
        <div className="lado">
          <ul className="estagios" aria-label={c.extra.estagioRotulo}>
            {c.home.estagio.map(([id, r, k]) => <EstagioLi key={id} idioma={idioma} chave={k === "validacao" ? "frente_validacao" : k} rotulo={r} />)}
          </ul>
          <div className="acoes">
            <Lk className="btn btn-1" href={href("platform", idioma, demo ? "demo" : undefined)}>{demo ? c.home.cta1 : c.extra.verPlataforma}<Seta /></Lk>
            <Lk className="link-seta" href={href("prostate", idioma)}>{c.home.cta2}</Lk>
          </div>
          <BotaoPausa idioma={idioma} />
        </div>
      </div>
    </div>
  );
}

function Abertura({ idioma }: { idioma: Idioma }) {
  return (
    <section className="hero" data-hero="" data-variante="horizonte" data-montanha="poster" aria-labelledby="h1"
      data-montanha-candidata={MONTANHA_CANDIDATA ? JSON.stringify(MONTANHA_CANDIDATA) : undefined}
      data-montanha-candidata-anterior={MONTANHA_CANDIDATA_ANTERIOR ? JSON.stringify(MONTANHA_CANDIDATA_ANTERIOR) : undefined}>
      <div className="hero-host" data-host="" aria-hidden="true" />
      <div className="hero-arte" data-arte="" aria-hidden="true"><PictureHero /></div>
      <TextoHero idioma={idioma} />
      <BotaoPausa idioma={idioma} className="pausa pausa-faixa" />
      {IDIOMAS.filter((l) => l !== idioma).map((l) => (
        <template key={l} data-medida={l} dangerouslySetInnerHTML={{ __html: textoHeroMedida(l) }} />
      ))}
    </section>
  );
}

// Largura das marcas a 20 px de altura (viewBox dos SVG em public/ararat/marca/…-negativo.svg). Sem ela a marca tinha
// largura 0 até carregar, e o cabeçalho do capítulo mudava de 1 para 2 linhas depois (+34 px no Viewer em 1280×720).
const LARGURA_LOGO: Record<string, number> = { model: 267, hub: 230, viewer: 280 };

function Vista({ idioma, id, arquivo, alt, legenda, origem, aviso, ui, claro, alta }:
  { idioma: Idioma; id: string; arquivo: ArquivoCaptura; alt: string; legenda: string; origem: string; aviso?: string; ui?: boolean; claro?: boolean; alta?: boolean }) {
  const ver = exibivel(arquivo);
  return (
    <figure className={`vista${alta ? " vista-alta" : ""}`} id={id} data-vista-fig={id}>
      {ver ? <div className={`quadro${claro ? " claro" : ""}`}><ImgCaptura arquivo={arquivo} alt={alt} ui={ui} /></div> : <CapturaTexto idioma={idioma} alt={alt} />}
      <figcaption className="legenda-palco">
        {ver ? <span className="leg-o-que">{legenda}</span> : null}
        <span className="leg-origem">{origem}</span>
        {aviso ? <Aviso colado>{aviso}</Aviso> : null}
        {alta ? <LinkOriginal idioma={idioma} arquivo={arquivo} /> : null}
      </figcaption>
    </figure>
  );
}

function Capitulos({ idioma }: { idioma: Idioma }) {
  const c = conteudo(idioma), C = c.caso, X = c.extra;
  const vistasViewer = [["v-planos", "planos"], ["v-regua", "regua"], ["v-previa", "previa"]] as const;
  const midias: Record<string, React.ReactNode> = {
    model: <div className="cap-midia" data-midia="model"><Camadas idioma={idioma} imediata /></div>,
    hub: (
      <div className="cap-midia" data-midia="hub">
        <Vista idioma={idioma} id="v-fila" arquivo="hub-fila-pronto-1184.webp" alt={C.leg.fila} legenda={C.leg.fila} origem={C.origem} ui claro />
      </div>
    ),
    viewer: (
      <div className="cap-midia" data-midia="viewer">
        <div className="abas abas-palco so-js" role="tablist" aria-label={`${C.vistas} — Viewer`}>
          {vistasViewer.map(([vid, k], j) => (
            <button key={vid} role="tab" id={`tab-${vid}`} data-vista={vid} aria-controls={vid} aria-selected={j === 0 ? "true" : "false"} tabIndex={j === 0 ? undefined : -1}>{C.vista[k]}</button>
          ))}
        </div>
        <div className="vistas">
          <Vista idioma={idioma} id="v-planos" arquivo="viewer-planos-mira-1510.webp" alt={C.leg.planos} legenda={C.leg.planos} origem={C.origem} />
          <Vista idioma={idioma} id="v-regua" arquivo="viewer-regua-748.webp" alt={C.leg.regua} legenda={X.reguaLegenda} origem={C.origem} aviso={X.reguaAviso} alta />
          <Vista idioma={idioma} id="v-previa" arquivo="viewer-previa-relatorio-1280.webp" alt={C.leg.previa} legenda={X.previaLegenda} origem={C.origem} aviso={X.previaAviso} alta />
        </div>
      </div>
    ),
  };
  const comps = c.prostata.componentes;
  const extra: Record<string, React.ReactNode> = {
    model: (
      <>
        {exibivel("seg-legenda-mascaras.webp") ? (
          <figure className="detalhe">
            <div className="tiras"><ImgCaptura arquivo="seg-legenda-mascaras.webp" alt={C.leg.legenda_mascaras} ui /><ImgCaptura arquivo="seg-volume-glandula.webp" alt="" ui /></div>
            <figcaption className="legenda">{C.leg.legenda_mascaras}</figcaption>
          </figure>
        ) : null}
        <div className="comp-atlas">
          <h4>{C.comp_titulo}</h4>
          <ul>
            {comps.map((k) => {
              const mostrado = k.id === "glandula" || k.id === "zonas";
              return (
                <li key={k.id} className={mostrado ? "sim" : "nao"}>
                  <span className="c-nome">{k.nome}</span>
                  <span className="c-estado"><Ponto cheio={mostrado} />{C.comp_estado[k.id as keyof typeof C.comp_estado]}</span>
                </li>
              );
            })}
          </ul>
          <p className="validacao"><Ponto cheio />{C.validacao}</p>
          <p className="mais"><Lk className="link-seta" href={href("prostate", idioma)}>{C.comp_link}</Lk></p>
        </div>
      </>
    ),
    hub: (
      <>
        {exibivel("hub-painel-sem-checagens-556.webp") ? (
          <figure className="detalhe detalhe-painel">
            <Quadro idioma={idioma} arquivo="hub-painel-sem-checagens-556.webp" alt={C.leg.painel} ui claro />
            <figcaption className="legenda">{C.leg.painel}</figcaption>
          </figure>
        ) : <CapturaTexto idioma={idioma} alt={C.leg.painel} compacto />}
        <p className="mais"><Lk className="link-seta" href={href("platform", idioma, "receber")}>{C.mais_plataforma.hub}</Lk></p>
      </>
    ),
    viewer: (
      <>
        <p className="decisao">{C.decisao}</p>
        <p className="mais">
          <Lk className="link-seta" href={href("platform", idioma, "navegar")}>{C.mais_plataforma.viewer}</Lk>
          {demoDisponivel() ? <Lk className="link-seta" href={href("platform", idioma, "demo")}>{C.demo}</Lk> : null}
        </p>
      </>
    ),
  };
  return (
    <div className="capitulos">
      {C.cap.map((k) => (
        <article key={k.id} className="capitulo" id={`cap-${k.id}`} data-capitulo={k.id} aria-labelledby={`cap-${k.id}-t`}>
          <header className="cap-cab">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cap-logo" src={`/ararat/marca/ararat-${k.id}-negativo.svg`} alt={k.prod} width={LARGURA_LOGO[k.id]} height={20} />
            <span className="cap-passos">{k.passos}</span>
          </header>
          <h3 id={`cap-${k.id}-t`} className="cap-titulo">{k.titulo}</h3>
          <p className="cap-texto">{k.texto}</p>
          <div className="cap-ancora" data-ancora={k.id}>{midias[k.id]}</div>
          {extra[k.id]}
        </article>
      ))}
    </div>
  );
}

/** Chamada discreta para o vídeo da Plataforma (#video); o player não se repete na Home. Só quando o vídeo está
 *  liberado para a variante. */
function ChamadaVideo({ idioma }: { idioma: Idioma }) {
  if (!videoDisponivel()) return null;
  return <p className="mais video-chamada"><Lk className="link-seta" href={href("platform", idioma, "video")}>{conteudo(idioma).plataforma.video.chamada}</Lk></p>;
}

/** Variante SEM capturas: os três produtos em colunas de texto — tarefa, itens, estágio e limites —, sem palco,
 *  abas, descrições de tela, avisos da régua ou legenda de origem (eles só existem para acompanhar as imagens). */
function CasoSemCapturas({ idioma }: { idioma: Idioma }) {
  const c = conteudo(idioma), C = c.caso, S = c.semMidia, Pl = c.plataforma;
  const g = Object.fromEntries(Pl.grupos.map((x) => [x.id, x]));
  const viewer = Pl.grupos.filter((x) => x.produto === "viewer");
  const [mod, hub, vw] = C.cap;
  return (
    <section className="sec escura atlas-caso caso-texto" id="caso" aria-labelledby="caso-t">
      <div className="w">
        <div className="cabeca-sec">
          <span className="rotulo-sec">{S.caso_rotulo}</span>
          <h2 id="caso-t" className="titulo-sec" data-texto="titulo">{S.caso_titulo}</h2>
          <p className="lead">{S.caso_lead}</p>
          <div className="fluxo-linha">
            <span className="fluxo-rot">{C.fluxo_rotulo}</span>
            <ol className="fluxo">{C.fluxo.map(([a, b]) => <li key={a}><span className="f-passo">{a}</span><span className="f-prod">{b}</span></li>)}</ol>
            <p className="fluxo-nota">{S.fluxo_nota}</p>
          </div>
          <ChamadaVideo idioma={idioma} />
        </div>
        <div className="produtos-texto">
          <article className="prod-col" id="cap-model" aria-labelledby="cap-model-t">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cap-logo" src="/ararat/marca/ararat-model-negativo.svg" alt={mod.prod} width={LARGURA_LOGO.model} height={20} />
            <h3 id="cap-model-t" className="cap-titulo">{S.model_titulo}</h3>
            <p className="cap-texto">{c.home.prod[0][2]}</p>
            <ul className="prod-comps">
              {c.prostata.componentes.map((k) => <li key={k.id}><span className="c-nome">{k.nome}</span><ChipEstagio idioma={idioma} chave={k.estagio} /></li>)}
            </ul>
            <p className="legenda">{c.prostata.pirads_nota}</p>
            <p className="validacao"><Ponto cheio />{C.validacao}</p>
            <p className="mais"><Lk className="link-seta" href={href("prostate", idioma)}>{C.comp_link}</Lk></p>
          </article>
          <article className="prod-col" id="cap-hub" aria-labelledby="cap-hub-t">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cap-logo" src="/ararat/marca/ararat-hub-negativo.svg" alt={hub.prod} width={LARGURA_LOGO.hub} height={20} />
            <h3 id="cap-hub-t" className="cap-titulo">{g.receber.titulo}</h3>
            <p className="cap-texto">{g.receber.texto}</p>
            <ul className="t-itens">{g.receber.itens.map((i) => <li key={i}>{i}</li>)}</ul>
            <p className="mais"><Lk className="link-seta" href={href("platform", idioma, "receber")}>{C.mais_plataforma.hub}</Lk></p>
          </article>
          <article className="prod-col" id="cap-viewer" aria-labelledby="cap-viewer-t">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cap-logo" src="/ararat/marca/ararat-viewer-negativo.svg" alt={vw.prod} width={LARGURA_LOGO.viewer} height={20} />
            <h3 id="cap-viewer-t" className="cap-titulo">{vw.titulo}</h3>
            <p className="cap-texto">{vw.texto}</p>
            <ul className="prod-tarefas" aria-label={S.viewer_rotulo}>{viewer.map((x) => <li key={x.id}><Lk href={href("platform", idioma, x.id)}>{x.titulo}</Lk></li>)}</ul>
            <p className="decisao">{C.decisao}</p>
            <p className="mais"><Lk className="link-seta" href={href("platform", idioma, "navegar")}>{C.mais_plataforma.viewer}</Lk></p>
          </article>
        </div>
      </div>
    </section>
  );
}

function Caso({ idioma }: { idioma: Idioma }) {
  if (!comCapturas()) return <CasoSemCapturas idioma={idioma} />;
  const C = conteudo(idioma).caso;
  // o palco só monta com o bloco de saídas (Camadas com as duas capturas); sem ele, caso.ts desiste ("sem-midia") e a
  // geometria pendente do palco não deve ser anunciada
  const palcoPossivel = conteudo(idioma).prostata.midia.every((v) => exibivel(v.img as ArquivoCaptura));
  return (
    <section className="sec escura atlas-caso" id="caso" aria-labelledby="caso-t">
      <div className="w">
        <div className="cabeca-sec">
          <span className="rotulo-sec">{C.rotulo}</span>
          <h2 id="caso-t" className="titulo-sec" data-texto="titulo">{C.titulo}</h2>
          <p className="lead">{C.lead}</p>
          <div className="fluxo-linha">
            <span className="fluxo-rot">{C.fluxo_rotulo}</span>
            <ol className="fluxo">{C.fluxo.map(([a, b]) => <li key={a}><span className="f-passo">{a}</span><span className="f-prod">{b}</span></li>)}</ol>
            <p className="fluxo-nota">{C.fluxo_nota}</p>
          </div>
          <ChamadaVideo idioma={idioma} />
        </div>
        <div className="atlas-grade" data-atlas="" data-palco={palcoPossivel ? "pendente" : undefined}>
          <div className="palco-col">
            <div className="palco-atlas" data-palco="">
              <nav className="cap-nav" aria-label={C.nav}>
                <span className="cap-nav-rot" aria-hidden="true">{C.nav}</span>
                <ol>{C.cap.map((k) => <li key={k.id}><Lk href={`#cap-${k.id}`} data-cap={k.id}>{k.curto}</Lk></li>)}</ol>
              </nav>
              <div className="palco-midia" data-palco-midia="" />
            </div>
          </div>
          <Capitulos idioma={idioma} />
        </div>
      </div>
    </section>
  );
}

function EvidenciaAdocao({ idioma }: { idioma: Idioma }) {
  const c = conteudo(idioma), A = c.evidHome, P = c.publicacao, est0 = c.evidencia.estudos[0];
  const [pacs, ...nos] = A.nos;
  return (
    <section className="sec clara atlas-evid atlas-evid2" id="evidencia" aria-labelledby="ev-t">
      <div className="w">
        <div className="cabeca-sec"><span className="rotulo-sec">{A.rotulo}</span><h2 id="ev-t" className="titulo-sec titulo-medio" data-texto="titulo">{A.titulo}</h2></div>
        <div className="evid-ad-grade">
          <article className="pub-atlas pub-destaque" aria-labelledby="pub-t">
            <ChipEstagio idioma={idioma} chave="publicado" />
            <h3 id="pub-t">{est0.titulo}</h3>
            <dl>
              <div><dt>{A.pub_campos[1]}</dt><dd>{A.pub_contrib}</dd></div>
              <div className="lim"><dt>{A.pub_campos[3]}</dt><dd>{A.pub_limite_curto}</dd></div>
              <div><dt>{A.pub_campos[2]}</dt><dd><span className="ref">{P.autores} · {P.periodico} · {P.ano} · <Lk href={`https://doi.org/${P.doi}`}>doi:{P.doi}</Lk></span></dd></div>
            </dl>
            <p className="mais"><Lk className="link-seta" href={href("evidence", idioma, "fichas")}>{A.pub_link}</Lk></p>
          </article>
          <div className="ad-compacto" aria-labelledby="ad-t">
            <h3 id="ad-t" className="h-menor">{A.ad_titulo}</h3>
            <p className="lead-menor">{A.ad_lead}</p>
            <figure className="esquema" aria-labelledby="esq-leg">
              <div className="esq">
                <div className={`no no-${pacs[0]}`}><b>{pacs[1]}</b><span>{pacs[2]}</span></div>
                <div className="inst"><span className="inst-rot">{A.inst}</span>
                  <ol className="nos">{nos.map(([k, n, d]) => <li key={k} className={`no no-${k}`}><b>{n}</b><span>{d}</span></li>)}</ol>
                </div>
              </div>
              <figcaption id="esq-leg" className="legenda">{c.extra.esquemaLegenda}</figcaption>
            </figure>
            <p className="ad-limite" role="note">{A.ad_limite}</p>
            <p className="mais"><Lk className="link-seta" href={href("platform", idioma, "adocao")}>{A.ad_link}</Lk></p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Confianca({ idioma }: { idioma: Idioma }) {
  const c = conteudo(idioma), A = c.evidHome;
  return (
    <section className="sec tom atlas-conf" aria-labelledby="cf-t">
      <div className="w">
        <div className="conf-cab"><h2 id="cf-t" className="titulo-sec titulo-medio">{A.conf_titulo}</h2><Lk className="link-seta" href={href("company", idioma, "equipe")}>{c.home.pessoas_cta}</Lk></div>
        <ul className="rostos-mini">
          {c.equipe.map(([pid, nome, foto, func]) => (
            <li key={pid}><Lk href={href(`pessoa:${pid}`, idioma)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/ararat/time/${foto}`} alt="" width={96} height={96} loading="lazy" />
              <span className="r-nome">{nome}</span><span className="r-func">{func}</span>
            </Lk></li>
          ))}
        </ul>
        <div className="conf-rodape">
          <nav className="conf-publicos" aria-labelledby="pu-t">
            <h3 id="pu-t">{c.publicos.titulo}</h3>
            <ul>{c.publicos.itens.map(([dest, anc, quem]) => <li key={quem}><Lk className="link-seta" href={href(dest as Pagina, idioma) + anc}>{quem}</Lk></li>)}</ul>
          </nav>
          <div className="conf-contato"><h3>{A.contato_titulo}</h3><p>{c.contatoSec.texto}</p></div>
        </div>
      </div>
    </section>
  );
}

export function PaginaHome({ idioma }: { idioma: Idioma }) {
  return (<><Abertura idioma={idioma} /><Caso idioma={idioma} /><EvidenciaAdocao idioma={idioma} /><Confianca idioma={idioma} /></>);
}
