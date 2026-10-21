import { conteudo, type Idioma } from "@/lib/ararat/conteudo";
import { href, type Pagina } from "@/lib/ararat/rotas";
import { FOTOS } from "@/lib/ararat/midia";
import { Lk } from "./base";

/* Empresa: propósito documentado (sem história inventada), o trabalho de hoje, a equipe real com biografias e o
 * contato honesto. Biografia: janela modal acessível com JS (bio.ts); sem JS, cada cartão leva à página da pessoa. */

type Pessoa = ReturnType<typeof conteudo>["equipe"][number];

function Bio({ idioma, p, nivel, hid }: { idioma: Idioma; p: Pessoa; nivel: "h1" | "h2"; hid?: string }) {
  const c = conteudo(idioma);
  const [, nome, foto, func, bio] = p;
  const d = FOTOS[foto] ?? { w: 360, h: 450 };
  const H = nivel;
  return (
    <>
      {/* foto nunca maior que o tamanho natural (a de baixa resolução não é ampliada) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bio-foto" src={`/ararat/time/${foto}`} alt={c.extra.retratoDe + nome} width={d.w} height={d.h} style={{ maxWidth: `min(100%, ${d.w}px)` }} loading="lazy" />
      <div className="bio-txt">
        <H className="bio-nome" id={hid}>{nome}</H>
        <p className="func">{func}</p>
        <div className="bio-corpo">{bio.map((x) => <p key={x.slice(0, 24)}>{x}</p>)}</div>
      </div>
    </>
  );
}

export function PaginaEmpresa({ idioma }: { idioma: Idioma }) {
  const c = conteudo(idioma), Em = c.empresa;
  return (
    <>
      <section className="sec escura topo-pag" aria-labelledby="em-h1">
        <div className="w">
          <span className="estrato" aria-hidden="true" />
          <div className="cabeca-sec" style={{ marginBottom: 0 }}>
            <h1 id="em-h1" className="titulo-sec" data-texto="h1">{Em.titulo}</h1>
            <p className="lead">{Em.lead}</p>
          </div>
        </div>
      </section>
      <section className="sec escura" aria-labelledby="hj-t">
        <div className="w">
          <h2 id="hj-t" className="titulo-sec titulo-medio">{Em.hoje_titulo}</h2>
          <ul className="hoje">
            {Em.hoje.map(([dest, tt, tx, lk]) => (
              <li key={tt}><h3>{tt}</h3><p>{tx}</p><Lk className="link-seta" href={dest.startsWith("#") ? dest : href(dest as Pagina, idioma)}>{lk}</Lk></li>
            ))}
          </ul>
        </div>
      </section>
      <section className="sec clara" id="equipe" aria-labelledby="eq-t">
        <div className="w">
          <div className="cabeca-sec"><h2 id="eq-t" className="titulo-sec titulo-medio">{Em.equipe}</h2></div>
          <ul className="rostos">
            {c.equipe.map(([pid, nome, foto, func]) => (
              <li key={pid} id={`p-${pid}`}>
                <Lk className="pessoa" href={href(`pessoa:${pid}`, idioma)} data-bio={pid}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/ararat/time/${foto}`} alt="" loading="lazy" width={360} height={450} />
                  <span className="nome">{nome}</span><span className="func">{func}</span>
                  <span className="ver">{Em.bio_abrir}<span className="sr"> — {nome}</span></span>
                </Lk>
              </li>
            ))}
          </ul>
          <p className="legenda" style={{ marginTop: 32 }}>{Em.nota}</p>
        </div>
        {c.equipe.map((p) => (
          <dialog key={p[0]} className="bio-dlg" id={`bio-${p[0]}`} aria-labelledby={`bio-${p[0]}-n`} data-bio-dlg={p[0]}>
            <div className="bio-barra"><button type="button" className="btn btn-2 bio-fechar" data-bio-fechar="">{Em.fechar} <span aria-hidden="true">✕</span></button></div>
            <div className="bio-grade"><Bio idioma={idioma} p={p} nivel="h2" hid={`bio-${p[0]}-n`} /></div>
          </dialog>
        ))}
      </section>
      <section className="sec escura" id="contato" aria-labelledby="ct-t">
        <div className="w contato">
          <h2 id="ct-t" className="titulo-sec titulo-medio">{c.contatoSec.titulo}</h2>
          <p className="lead">{c.contatoSec.texto}</p>
        </div>
      </section>
    </>
  );
}

export function PaginaPessoa({ idioma, id }: { idioma: Idioma; id: string }) {
  const c = conteudo(idioma);
  const p = c.equipe.find((x) => x[0] === id)!;
  return (
    <section className="sec clara topo-pag pessoa-pag">
      <div className="w">
        <p><Lk className="link-seta voltar" href={href("company", idioma, `p-${id}`)}>{c.empresa.voltar}</Lk></p>
        <article className="bio-grade bio-pagina"><Bio idioma={idioma} p={p} nivel="h1" /></article>
        <p className="legenda" style={{ marginTop: 32 }}>{c.empresa.nota}</p>
      </div>
    </section>
  );
}

export const idsEquipe = (idioma: Idioma = "en") => conteudo(idioma).equipe.map(([pid]) => pid);
export const pessoa = (idioma: Idioma, id: string) => conteudo(idioma).equipe.find((x) => x[0] === id);
