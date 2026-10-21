import type { ReactNode } from "react";
import { AssinaturaCabecalho03d2, AssinaturaRodape03d2 } from "@/components/marca/Marca03d2";
import { SCRIPT_REVELACAO, SVG_ASSINATURA_ANIMAVEL } from "@/lib/marca-03d2.server";
import { CONTATO, GERAL, t, type Idioma } from "@/lib/institucional/textos";
import { NAV, ROTA_COMPARACAO, ROTAS, outroIdioma, type Pagina } from "@/lib/institucional/rotas";
import { BotaoPausa } from "./BotaoPausa";
import { MenuMovel } from "./MenuMovel";
import "./fontes.css";
import s from "./Institucional.module.css";

/**
 * Moldura comum das páginas institucionais: cabeçalho (logo 03D2 provisória com a revelação de 900 ms do kit,
 * navegação real entre páginas, idioma → página equivalente, pausa das animações, contato), conteúdo, contato
 * e rodapé. Sem JavaScript tudo funciona como links; o menu móvel cai para a navegação do rodapé.
 */
export function Moldura({ idioma, pagina, children, rotaOutroIdioma }: { idioma: Idioma; pagina: Pagina; children: ReactNode; rotaOutroIdioma?: string }) {
  const outro = outroIdioma(idioma);
  const hrefOutro = rotaOutroIdioma ?? ROTAS[outro][pagina];
  const itens = NAV[idioma].map(([k, nome]) => ({ href: ROTAS[idioma][k], nome, atual: k === pagina }));
  return (
    <div className={s.raiz} data-inst="" data-pagina={pagina} lang={idioma === "en" ? "en" : "pt-BR"}>
      {SCRIPT_REVELACAO ? <script dangerouslySetInnerHTML={{ __html: SCRIPT_REVELACAO }} /> : null}
      <header className={s.cab}>
        <div className={s.w}>
          <a className={s.logo} href={ROTAS[idioma].home} aria-label={idioma === "en" ? "ARARAT — home" : "ARARAT — início"}>
            <AssinaturaCabecalho03d2 svg={SVG_ASSINATURA_ANIMAVEL} />
          </a>
          <nav className={s.nav} aria-label={t(GERAL.navPrincipal, idioma)}>
            {itens.map((i) => (
              <a key={i.href} href={i.href} aria-current={i.atual ? "page" : undefined}>{i.nome}</a>
            ))}
          </nav>
          <a className={s.idioma} href={hrefOutro} lang={outro === "en" ? "en" : "pt-BR"} hrefLang={outro === "en" ? "en" : "pt-BR"} aria-label={t(GERAL.outroIdioma, idioma)}>
            {idioma === "en" ? <><b>EN</b>&nbsp;·&nbsp;PT</> : <>EN&nbsp;·&nbsp;<b>PT</b></>}
          </a>
          <BotaoPausa rotuloPausar={t(GERAL.pausar, idioma)} rotuloRetomar={t(GERAL.retomar, idioma)} />
          <a className={s.cta} href="#contato">{t(GERAL.contato, idioma)}</a>
          <MenuMovel
            itens={itens}
            rotulo={t(GERAL.menu, idioma)}
            fechar={t(GERAL.fecharMenu, idioma)}
            contato={t(GERAL.contato, idioma)}
            idiomaRotulo={t(GERAL.idiomaRotulo, idioma)}
            outroNome={t(GERAL.outroIdioma, idioma)}
            hrefOutro={hrefOutro}
            langOutro={outro === "en" ? "en" : "pt-BR"}
            logo={<AssinaturaRodape03d2 />}
          />
        </div>
      </header>
      <main id="conteudo" tabIndex={-1}>{children}</main>
      <section className={`${s.contato}`} id="contato" aria-labelledby="contato-t">
        <div className={s.w}>
          <p className={`${s.mono} ${s.muted}`}>{t(CONTATO.rotulo, idioma)}</p>
          <h2 id="contato-t">{t(CONTATO.titulo, idioma)}</h2>
          <p className={s.muted} style={{ maxWidth: "34em", marginTop: 12 }}>{t(CONTATO.texto, idioma)}</p>
        </div>
      </section>
      <footer className={s.rodape}>
        <div className={`${s.w} ${s.rodapeGrade}`}>
          <div>
            <AssinaturaRodape03d2 />
            <p style={{ marginTop: 14, maxWidth: "34em" }}>{t(GERAL.aviso, idioma)}</p>
            <p className={s.experimental}>{t(GERAL.rotuloExperimental, idioma)}</p>
          </div>
          <nav id="rodape-nav" aria-label={t(GERAL.navPrincipal, idioma)}>
            <ul>{itens.map((i) => <li key={i.href}><a href={i.href} aria-current={i.atual ? "page" : undefined}>{i.nome}</a></li>)}</ul>
          </nav>
          <ul>
            <li><a href="#contato">{t(GERAL.contato, idioma)}</a></li>
            <li><a href={hrefOutro} lang={outro === "en" ? "en" : "pt-BR"}>{t(GERAL.outroIdioma, idioma)}</a></li>
            <li><a href={ROTA_COMPARACAO[idioma]}>{t(GERAL.versaoAnterior, idioma)}</a></li>
          </ul>
          <p className={s.atrib}>{t(GERAL.atribuicaoCurta, idioma)}</p>
        </div>
      </footer>
    </div>
  );
}
