import { Fragment } from "react";
import { FundoVideo } from "./FundoVideo";
import { conteudo, type Idioma } from "@/lib/ararat/conteudo";
import { href } from "@/lib/ararat/rotas";
import { ChipEstagio, EstagioLi, Ponto, Lk } from "./base";
import { comCapturas } from "@/lib/ararat/midia";
import { Camadas } from "./Camadas";

/* Soluções, Próstata e Tireoide. Regra desta integração: não misturar DESENVOLVIMENTO (estado do componente),
 * DEMONSTRAÇÃO (o que este site mostra), VALIDAÇÃO (informada só no nível da frente de próstata) e DISPONIBILIDADE
 * (ainda não publicada). PI-RADS descreve só o modelo novo. Tireoide: proporcional ao que existe — sem produto pronto. */

function Topo({ titulo, lead, children, id, idioma, fundo = false }: { titulo: string; lead: string; children?: React.ReactNode; id: string; idioma: Idioma; fundo?: boolean }) {
  return (
    <section className={`sec escura topo-pag${fundo ? " topo-com-fundo" : ""}`} aria-labelledby={id}>
      {fundo ? <FundoVideo idioma={idioma} /> : null}
      <div className="w">
        <span className="estrato" aria-hidden="true" />
        <div className="cabeca-sec" style={{ marginBottom: 0 }}>
          <h1 id={id} className="titulo-sec" data-texto="h1">{titulo}</h1>
          <p className="lead">{lead}</p>
          {children}
        </div>
      </div>
    </section>
  );
}

/** Como ler os estágios: os quatro eixos, cada um no seu lugar. */
function Eixos({ idioma, escura }: { idioma: Idioma; escura?: boolean }) {
  const X = conteudo(idioma).extra;
  // sem capturas, o eixo "Neste site" (o que é demonstrado aqui) não tem objeto: fica fora
  const eixos = comCapturas() ? X.eixos : X.eixos.filter((_, i) => i !== 1);
  return (
    <aside className={`eixos${escura ? " eixos-escura" : ""}`} aria-labelledby="eixos-t">
      <h2 id="eixos-t" className="eixos-t">{X.eixosTitulo}</h2>
      <dl>{eixos.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
    </aside>
  );
}

export function PaginaSolucoes({ idioma }: { idioma: Idioma }) {
  const c = conteudo(idioma), S = c.solucoes, P = c.prostata, T = c.tireoide, C = c.comp;
  const cap = comCapturas();
  return (
    <>
      <Topo idioma={idioma} fundo titulo={S.titulo} lead={S.lead} id="so-h1" />
      <section className="sec escura frente-prostata" aria-labelledby="fp-t">
        <div className="w">
          <div className="frente-cab">
            <span className="rotulo-sec">{c.extra.frenteAtual}</span>
            <h2 id="fp-t" className="titulo-sec titulo-medio">{P.titulo}</h2>
            <ul className="estagios"><EstagioLi idioma={idioma} chave="frente_validacao" rotulo={P.frente} /></ul>
            <p className="lead">{cap ? P.pagina_lead : c.semMidia.prostata_lead}</p>
          </div>
          <ol className="comp-mapa">
            {P.componentes.map((k) => (
              <li key={k.id}>
                <h3>{k.nome}</h3>
                <ChipEstagio idioma={idioma} chave={k.estagio} />
                {cap ? <p><b>{C.nesta}</b> {C.aqui[k.id as keyof typeof C.aqui]}</p> : <p>{k.tarefa}</p>}
              </li>
            ))}
          </ol>
          <p className="mais"><Lk className="link-seta" href={href("prostate", idioma)}>{S.ver}</Lk></p>
        </div>
      </section>
      <section className="sec clara frente-tireoide" id="tireoide" aria-labelledby="ft-t">
        <div className="w duas-col">
          <div>
            <h2 id="ft-t" className="titulo-sec titulo-medio">{T.titulo}</h2>
            <ul className="estagios" style={{ marginTop: 14 }}><EstagioLi idioma={idioma} chave="desenv" /></ul>
          </div>
          <div>
            <p className="lead" style={{ color: "var(--ink)" }}>{T.lead} {T.texto}</p>
            <div className="ficha" style={{ marginTop: 16 }}><dl>{T.pagina.map(([a, b]) => <Fragment key={a}><dt>{a}</dt><dd>{b}</dd></Fragment>)}</dl></div>
            <p className="mais"><Lk className="link-seta" href={href("thyroid", idioma)}>{S.ver}</Lk></p>
          </div>
        </div>
      </section>
      <section className="sec tom"><div className="w"><Eixos idioma={idioma} /></div></section>
    </>
  );
}

export function PaginaProstata({ idioma }: { idioma: Idioma }) {
  const c = conteudo(idioma), P = c.prostata, R = P.rot, X = c.extra, U = P.urologia, C = c.comp;
  // sem capturas: sem o bloco das camadas, sem a linha "Neste site" e sem frases que apontam para uma imagem
  const cap = comCapturas(), S = c.semMidia;
  return (
    <>
      <Topo idioma={idioma} titulo={P.pagina_titulo} lead={cap ? P.pagina_lead : S.prostata_lead} id="pr-h1">
        <ul className="estagios" style={{ marginTop: 8 }}>
          <EstagioLi idioma={idioma} chave="frente_validacao" rotulo={P.frente} />
          <EstagioLi idioma={idioma} chave="novo" rotulo={X.piradsClassificacao} />
        </ul>
      </Topo>
      <section className="sec escura" aria-labelledby="pr-t2" id="componentes">
        <div className="w">
          <h2 id="pr-t2" className="sr">{P.tabela_titulo}</h2>
          <div className={`prostata2${cap ? "" : " sem-midia"}`}>
            {cap ? <Camadas idioma={idioma} imediata /> : null}
            <div className="componentes">
              <ol className="comps">
                {P.componentes.map((k) => (
                  <li key={k.id} className="comp" id={`c-${k.id}`}>
                    <h3>{k.nome}</h3>
                    <dl>
                      <dt>{R.tarefa}</dt><dd>{k.tarefa}</dd>
                      <dt>{R.papel}</dt><dd>{k.papel}</dd>
                      <dt>{X.eixos[0][0]}</dt><dd><ChipEstagio idioma={idioma} chave={k.estagio} /></dd>
                      {cap ? <><dt>{C.nesta}</dt><dd>{P.nesta_det[k.id as keyof typeof P.nesta_det]}</dd></> : null}
                    </dl>
                  </li>
                ))}
              </ol>
              <p className="legenda pirads-nota">{P.pirads_nota}</p>
              <p className="validacao"><Ponto cheio />{c.caso.validacao}</p>
              {/* pesquisa: linha de investigação, separada dos componentes e da categoria PI-RADS; sem números */}
              <div className="pesquisa-comp" id="pesquisa">
                <h2 className="rotulo-sec">{P.pesquisa.rotulo}</h2>
                <div className="comps">
                  <div className="comp" id="c-risco">
                    <h3>{P.pesquisa.nome}</h3>
                    <dl>
                      <dt>{R.tarefa}</dt><dd>{P.pesquisa.tarefa}</dd>
                      <dt>{R.papel}</dt><dd>{P.pesquisa.papel}</dd>
                      <dt>{R.estagio}</dt><dd><ChipEstagio idioma={idioma} chave={P.pesquisa.estagio} /></dd>
                    </dl>
                  </div>
                </div>
                <p className="legenda">{P.pesquisa.nota}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="sec clara" id="urologia" aria-labelledby="ur-t">
        <div className="w duas-col uro">
          <div>
            <h2 id="ur-t" className="titulo-sec titulo-medio">{U.titulo}</h2>
            <p className="lead" style={{ marginTop: 16 }}>{cap ? U.texto : S.urologia_texto}</p>
          </div>
          <div>
            <ul className="limites">{U.limites.map((x) => <li key={x}>{x}</li>)}</ul>
            <p className="mais"><Lk className="link-seta" href={href("platform", idioma, "documentar")}>{cap ? X.verPreviaPlataforma : S.ver_documentar}</Lk></p>
          </div>
        </div>
      </section>
      <section className="sec tom" aria-labelledby="li-t">
        <div className="w duas-col">
          <div>
            <h2 id="li-t" className="titulo-sec titulo-medio">{P.limites_titulo}</h2>
            <ul className="limites" style={{ marginTop: 20 }}>{P.limites.map((x) => <li key={x}>{x}</li>)}</ul>
            <p className="mais">
              <Lk className="link-seta" href={href("platform", idioma, "receber")}>{X.comoHubViewer}</Lk>
              <Lk className="link-seta" href={href("evidence", idioma, "fichas")}>{c.nav[2][1]}</Lk>
            </p>
          </div>
          <Eixos idioma={idioma} />
        </div>
      </section>
    </>
  );
}

export function PaginaTireoide({ idioma }: { idioma: Idioma }) {
  const c = conteudo(idioma), T = c.tireoide, X = c.extra;
  return (
    <>
      <Topo idioma={idioma} titulo={T.titulo} lead={T.lead} id="ti-h1"><ul className="estagios"><EstagioLi idioma={idioma} chave="desenv" /></ul></Topo>
      <section className="sec clara">
        <div className="w duas-col">
          <p className="lead" style={{ color: "var(--ink)" }}>{T.texto}</p>
          <div>
            <div className="ficha"><dl>{T.pagina.map(([a, b]) => <Fragment key={a}><dt>{a}</dt><dd>{b}</dd></Fragment>)}</dl></div>
            <p className="mais">
              <Lk className="link-seta" href={href("prostate", idioma)}>{X.frenteAtual}</Lk>
              <Lk className="link-seta" href={href("solutions", idioma)}>{X.voltarSolucoes}</Lk>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
