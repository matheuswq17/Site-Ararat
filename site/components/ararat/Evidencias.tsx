import { conteudo, type Idioma } from "@/lib/ararat/conteudo";
import { href } from "@/lib/ararat/rotas";
import { ChipEstagio, Ponto, Lk } from "./base";

/* Evidências: primeiro o índice POR TAREFA (fichas: pergunta, evidência hoje, o que não demonstra), depois os estudos
 * com tarefa · modelo · dados · protocolo · estágio · não mostra, e a referência. Glândula, zonas, lesões, PI-RADS e a
 * pesquisa ISUP ficam separadas: a evidência de uma tarefa não se estende a outra nem à plataforma. */

const ESTUDO_DA_FICHA: Record<string, string> = { glandula: "seg", lesoes: "seg", isup: "isup" };
const CHEIO = new Set(["publicado", "desenvolvido", "frente_validacao"]);

export function PaginaEvidencias({ idioma }: { idioma: Idioma }) {
  const c = conteudo(idioma), Ev = c.evidencia, P = c.publicacao, X = c.extra;
  return (
    <>
      <section className="sec escura topo-pag" aria-labelledby="ev-h1">
        <div className="w">
          <span className="estrato" aria-hidden="true" />
          <div className="cabeca-sec" style={{ marginBottom: 0 }}>
            <h1 id="ev-h1" className="titulo-sec" data-texto="h1">{Ev.titulo}</h1>
            <p className="lead">{Ev.lead}</p>
          </div>
        </div>
      </section>

      <section className="sec clara" id="fichas" aria-labelledby="fi-t">
        <div className="w">
          <div className="cabeca-sec">
            <span className="rotulo-sec">{X.indiceTarefas}</span>
            <h2 id="fi-t" className="titulo-sec titulo-medio">{c.fichasTitulo}</h2>
            <p className="lead">{c.fichasLead}</p>
          </div>
          <p className="exp-validacao"><Ponto cheio />{c.caso.validacao}</p>
          <ul className="fichas-ev">
            {c.fichas.map((f) => (
              <li key={f.id} className="ficha-ev" id={`ficha-${f.id}`}>
                <h3>{f.tarefa}</h3>
                <ChipEstagio idioma={idioma} chave={f.estagio} cheio={CHEIO.has(f.estagio)} />
                <dl>
                  {f.pergunta ? <div><dt>{c.fichasCampos[0]}</dt><dd>{f.pergunta}</dd></div> : null}
                  <div><dt>{c.fichasCampos[1]}</dt><dd>{f.hoje}</dd></div>
                  {f.nao ? <div><dt>{c.fichasCampos[2]}</dt><dd>{f.nao}</dd></div> : null}
                </dl>
                {ESTUDO_DA_FICHA[f.id] ? <Lk className="link-seta" href={`#est-${ESTUDO_DA_FICHA[f.id]}`}>{X.verFicha}</Lk> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec tom" id="estudos" aria-labelledby="es-t">
        <div className="w">
          <h2 id="es-t" className="titulo-sec titulo-medio" style={{ marginBottom: 32 }}>{X.estudosTitulo}</h2>
          <div className="estudos">
            {Ev.estudos.map((e) => (
              <article key={e.id} className="estudo" id={`est-${e.id}`} aria-labelledby={`est-${e.id}-t`}>
                <div className="estudo-cab">
                  <ChipEstagio idioma={idioma} chave={e.estagio} cheio={CHEIO.has(e.estagio)} />
                  <h3 id={`est-${e.id}-t`}>{e.titulo}</h3>
                  {e.id === "isup" ? (
                    <p className="cite-est"><cite lang="en">{P.titulo}</cite> — {P.autores} · {P.periodico} · {P.ano} <Lk className="doi" href={`https://doi.org/${P.doi}`}>doi.org/{P.doi}</Lk></p>
                  ) : null}
                </div>
                <dl className="estudo-dl">{Ev.campos.map((campo, j) => <div key={campo}><dt>{campo}</dt><dd>{e.v[j]}</dd></div>)}</dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec escura" aria-labelledby="tm-t">
        <div className="w">
          <div className="cabeca-sec"><h2 id="tm-t" className="titulo-sec titulo-medio">{Ev.termos_titulo}</h2></div>
          <dl className="termos">{Ev.termos.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
          <p className="mais"><Lk className="link-seta" href={href("prostate", idioma)}>{c.home.cta2}</Lk></p>
        </div>
      </section>
    </>
  );
}
