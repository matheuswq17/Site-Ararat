import type { ReactNode } from "react";
import { conteudo, IDIOMAS, type Idioma } from "@/lib/ararat/conteudo";
import { href, secaoDaPagina, type Pagina } from "@/lib/ararat/rotas";
import { REVISAO_PRIVADA, SITE_URL, TRANSICOES } from "@/lib/ararat/ambiente";
import { alternativos } from "@/lib/ararat/metadados";
import { CAPTURAS, exibivel, type ArquivoCaptura } from "@/lib/ararat/midia";

// alguma captura PROSTATEx pode aparecer nesta variante? (todas pendentes hoje: só na revisão privada)
const mostraImagens = () => (Object.keys(CAPTURAS) as ArquivoCaptura[]).some(exibivel);
import { BotaoPausa, Lk } from "./base";
import { Controladores } from "./Controladores";
import { EntradaPagina } from "./EntradaPagina";

type ChavePagina = Pagina | `pessoa:${string}`;
const MARCA = "/ararat/marca/ararat-horizontal-negativo.svg";

function Idiomas({ idioma, pagina }: { idioma: Idioma; pagina: ChavePagina }) {
  const c = conteudo(idioma);
  return (
    <div className="idiomas" role="group" aria-label={c.idioma}>
      {IDIOMAS.map((l) => (
        <a key={l} href={href(pagina, l)} hrefLang={l === "pt" ? "pt-BR" : l} lang={l === "pt" ? "pt-BR" : l} data-idioma={l}
          aria-current={l === idioma ? "true" : undefined}>{l.toUpperCase()}</a>
      ))}
    </div>
  );
}

function Cabecalho({ idioma, pagina }: { idioma: Idioma; pagina: ChavePagina }) {
  const c = conteudo(idioma);
  const atual = secaoDaPagina(pagina);
  const itens = c.nav.map(([k, rotulo]) => ({ k: k as Pagina, rotulo, href: href(k as Pagina, idioma) }));
  return (
    <>
      <a className="pular" href="#conteudo">{c.pular}</a>
      {/* lugar reservado do cabeçalho fixo (ver .cab-lugar em site.css) */}
      <div className="cab-lugar">
      <header className="cab">
        <div className="w">
          <Lk className="marca" href={href("home", idioma)} aria-label={`ARARAT — ${c.extra.inicio}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MARCA} alt="ARARAT" width={173} height={20} />
          </Lk>
          <nav className="nav" aria-label={c.extra.principal}>
            {itens.map((i) => <Lk key={i.k} href={i.href} aria-current={i.k === atual ? "page" : undefined}>{i.rotulo}</Lk>)}
          </nav>
          <Idiomas idioma={idioma} pagina={pagina} />
          {pagina === "home" ? <BotaoPausa idioma={idioma} className="pausa pausa-cab" /> : null}
          <details className="menu-d" data-menu="">
            <summary className="menu-btn">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5h12M2 11h12" stroke="currentColor" strokeWidth="1.6" /></svg>
              <span className="menu-rot">{c.menu}</span>
            </summary>
            <div className="painel-menu" id="painel-menu">
              <nav aria-label={c.extra.menuPrincipal}>
                <ul>{itens.map((i) => <li key={i.k}><Lk href={i.href} aria-current={i.k === atual ? "page" : undefined}>{i.rotulo}</Lk></li>)}</ul>
              </nav>
              <Idiomas idioma={idioma} pagina={pagina} />
            </div>
          </details>
        </div>
      </header>
      </div>
    </>
  );
}

function Rodape({ idioma, pagina }: { idioma: Idioma; pagina: ChavePagina }) {
  const c = conteudo(idioma);
  return (
    <footer className="rodape">
      <div className="w">
        <div className="cols">
          <Lk className="rod-marca" href={href("home", idioma)} aria-label={`ARARAT — ${c.extra.inicio}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MARCA} alt="ARARAT" width={173} height={20} />
          </Lk>
          {c.nav.map(([k, r]) => <Lk key={k} href={href(k as Pagina, idioma)}>{r}</Lk>)}
          <Lk href={href("company", idioma, "contato")}>{c.contato}</Lk>
        </div>
        {/* crédito das imagens PROSTATEx só onde elas são exibidas (revisão privada); a variante sem capturas não as mostra */}
        <p className="aviso">{mostraImagens() ? c.rodape.aviso : c.rodape.avisoSemImagens}</p>
        <Idiomas idioma={idioma} pagina={pagina} />
      </div>
    </footer>
  );
}

/** Moldura comum: pular, cabeçalho, conteúdo, rodapé e os controladores do lado do cliente (montados/desmontados
 *  por página). `modulos` diz quais controladores a página usa. */
export function Moldura({ idioma, pagina, children, modulos = [] }:
  { idioma: Idioma; pagina: ChavePagina; children: ReactNode; modulos?: Array<"abertura" | "prostata" | "caso" | "demo" | "bio" | "e2"> }) {
  return (
    <>
      {/* hreflang: com domínio confirmado vêm dos metadados (absolutos); sem ele, relativos, só como estrutura */}
      {!SITE_URL ? alternativos(pagina).map((a) => <link key={a.hrefLang} rel="alternate" hrefLang={a.hrefLang} href={a.href} />) : null}
      <Cabecalho idioma={idioma} pagina={pagina} />
      <main id="conteudo">{children}</main>
      <Rodape idioma={idioma} pagina={pagina} />
      {/* transição entre páginas (candidato privado): entrada curta do conteúdo novo, só em navegação no app */}
      {TRANSICOES ? <EntradaPagina /> : null}
      <Controladores idioma={idioma} modulos={modulos} revisao={REVISAO_PRIVADA} />
    </>
  );
}
