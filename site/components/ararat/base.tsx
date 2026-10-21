import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { conteudo, type Idioma } from "@/lib/ararat/conteudo";
import { CAPTURAS, exibivel, srcCaptura, type ArquivoCaptura, type Captura as CapturaInfo } from "@/lib/ararat/midia";

/** Componentes pequenos e comuns ao site ARARAT (servidor; sem estado). */

export const Seta = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
);

export function BotaoPausa({ idioma, className = "pausa" }: { idioma: Idioma; className?: string }) {
  return (
    <button className={className} type="button" data-pausa="" hidden aria-pressed="false" aria-label={conteudo(idioma).extra.pausar}>
      <svg className="i-p" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" fill="currentColor" /></svg>
      <svg className="i-r" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor" /></svg>
    </button>
  );
}

const CHEIO = new Set(["validacao", "frente_validacao", "desenvolvido", "publicado"]);
export type ChaveEstagio = keyof ReturnType<typeof conteudo>["estagio"];

export function Ponto({ cheio }: { cheio: boolean }) {
  return <span className={cheio ? "ponto" : "ponto oco"} aria-hidden="true" />;
}

/** Item de estágio (lista .estagios): ponto cheio = estágio concluído/em curso; vazado = em desenvolvimento. */
export function EstagioLi({ idioma, chave, rotulo }: { idioma: Idioma; chave: string; rotulo?: string }) {
  const c = conteudo(idioma);
  return (
    <li>
      <Ponto cheio={CHEIO.has(chave)} />
      <span>{rotulo ? <><b>{rotulo}</b> · </> : null}{c.estagio[chave as ChaveEstagio]}</span>
    </li>
  );
}

export function ChipEstagio({ idioma, chave, cheio }: { idioma: Idioma; chave: string; cheio?: boolean }) {
  const c = conteudo(idioma);
  return (
    <span className="estagio-chip"><Ponto cheio={cheio ?? CHEIO.has(chave)} />{c.estagio[chave as ChaveEstagio]}</span>
  );
}

type CapProps = { arquivo: ArquivoCaptura; alt: string; ui?: boolean; className?: string; eager?: boolean };

/** <img> de uma captura real, com o teto técnico de densidade (data-midia-tipo + --nat). Só chamar se exibivel(). */
export function ImgCaptura({ arquivo, alt, ui, className = "", eager }: CapProps) {
  const m = CAPTURAS[arquivo] as CapturaInfo;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`cap${ui ? " ui" : ""}${className ? " " + className : ""}`} data-midia-tipo={m.tipo} style={{ "--nat": m.w } as CSSProperties}
      src={srcCaptura(arquivo)} width={m.w} height={m.h} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
  );
}

/** Variante apta a publicação: a captura vira a sua descrição factual (mesmo texto do alt), sem quadro decorativo. */
export function CapturaTexto({ idioma, alt, compacto }: { idioma: Idioma; alt: string; compacto?: boolean }) {
  const x = conteudo(idioma).extra;
  return (
    <p className={`cap-texto${compacto ? " compacto" : ""}`}>
      <span className="cap-texto-rot">{x.capturaRotulo}</span>
      <span className="cap-texto-alt">{alt}</span>
    </p>
  );
}

/**
 * Captura emoldurada: na revisão privada, <div class="quadro|moldura"> com a imagem; na variante pública, só o texto.
 * `moldura` escolhe a classe da moldura (quadro do Atlas ou moldura das internas); `claro` = fundo branco (Hub).
 */
export function Quadro({ idioma, arquivo, alt, ui, claro, moldura = "quadro", eager, className, estilo }:
  CapProps & { idioma: Idioma; claro?: boolean; moldura?: "quadro" | "moldura"; estilo?: CSSProperties }) {
  if (!exibivel(arquivo)) return <CapturaTexto idioma={idioma} alt={alt} />;
  return (
    <div className={`${moldura}${claro ? " claro" : ""}${className ? " " + className : ""}`} style={claro && moldura === "moldura" ? { background: "#fff", ...estilo } : estilo}>
      <ImgCaptura arquivo={arquivo} alt={alt} ui={ui} eager={eager} />
    </div>
  );
}

/** Link "abrir a captura no tamanho original" — só existe quando a captura pode ser exibida. */
export function LinkOriginal({ idioma, arquivo, className = "leg-ampliar" }: { idioma: Idioma; arquivo: ArquivoCaptura; className?: string }) {
  if (!exibivel(arquivo)) return null;
  return <a className={className} href={srcCaptura(arquivo)}>{conteudo(idioma).extra.abrirOriginal}</a>;
}

export function Aviso({ children, colado }: { children: ReactNode; colado?: boolean }) {
  return <span className={`aviso-midia${colado ? " aviso-colado" : ""}`} role="note"><span aria-hidden="true">●</span> {children}</span>;
}

export function AvisoP({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`aviso-midia${className ? " " + className : ""}`} role="note"><span aria-hidden="true">●</span> {children}</p>;
}

/**
 * Link do site: rotas internas (e âncoras) usam next/link — navegação no cliente entre páginas do mesmo idioma, com
 * os controladores da página desmontados e montados de novo; para outro idioma (outro layout raiz) o Next recarrega a
 * página. Endereços externos ficam como <a> comum. Quem trata o clique antes (palco, demonstração, biografia) chama
 * preventDefault e o next/link não navega.
 */
export function Lk({ href, children, ...resto }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  if (/^https?:/.test(href)) return <a href={href} {...resto}>{children}</a>;
  return <Link href={href} {...resto}>{children}</Link>;
}
