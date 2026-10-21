import type { Metadata, Viewport } from "next";
import { conteudo, IDIOMAS, LOCALE_OG, type Idioma } from "./conteudo";
import { href, ROTAS, type Pagina } from "./rotas";
import { SITE_URL } from "./ambiente";

const HREFLANG: Record<Idioma, string> = { en: "en", pt: "pt-BR", es: "es" };

/**
 * Metadados de uma página: title, description, Open Graph e Twitter por idioma, hreflang (EN/PT/ES + x-default).
 * Revisão: SEMPRE noindex/nofollow. Canonical, og:url e hreflang absolutos só quando ARARAT_SITE_URL (domínio
 * definitivo) existir — sem domínio confirmado, nenhum endereço é inventado. og:image: depende do domínio e de uma
 * imagem autorizada; não há.
 */
export function metadados(chave: Pagina | `pessoa:${string}`, idioma: Idioma, titulo?: string, descricao?: string): Metadata {
  const c = conteudo(idioma);
  // Todas as páginas, inclusive a Home, usam a tabela `meta` do conteúdo (título e descrição próprios por página).
  const meta = !chave.startsWith("pessoa:") ? (c.meta as Record<string, readonly [string, string]>)[chave] : undefined;
  const title = titulo ?? meta?.[0] ?? "ARARAT";
  const description = descricao ?? meta?.[1] ?? "";
  const linguas = Object.fromEntries(IDIOMAS.map((l) => [HREFLANG[l], href(chave, l)]));
  const absoluto = !!SITE_URL;
  return {
    title, description,
    robots: { index: false, follow: false },
    ...(absoluto ? { metadataBase: new URL(SITE_URL), alternates: { canonical: href(chave, idioma), languages: { ...linguas, "x-default": href(chave, "en") } } } : {}),
    openGraph: { siteName: "ARARAT", type: "website", title, description, locale: LOCALE_OG[idioma], ...(absoluto ? { url: href(chave, idioma) } : {}) },
    twitter: { card: "summary", title, description },
    icons: { icon: [{ url: "/ararat/marca/favicon.svg", type: "image/svg+xml" }] },
  };
}

/** hreflang relativos (sem domínio confirmado): estrutura pronta, renderizada como <link rel="alternate">. */
export function alternativos(chave: Pagina | `pessoa:${string}`) {
  return IDIOMAS.map((l) => ({ hrefLang: HREFLANG[l], href: href(chave, l) }));
}

export const viewportArarat: Viewport = { themeColor: "#0F1214", colorScheme: "light dark" };
export { ROTAS };
