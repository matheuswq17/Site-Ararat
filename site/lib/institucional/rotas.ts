import type { Idioma } from "./textos";

/**
 * Rotas do institucional. Inglês é o idioma inicial ("/"); português em "/pt/…".
 * O seletor de idioma leva sempre à página EQUIVALENTE (mesma chave). As rotas de comparação ficam fora daqui:
 *   /previa/refinada (experiência anterior, PT) · /previa/refinada/en (a mesma em inglês, antes servida em "/").
 */
/** Desde a integração do Atlas (portfolio-site-v1, 14/10/2026) esta experiência é uma versão de COMPARAÇÃO em
 * /previa/institucional (EN) e /previa/institucional/pt (PT); a Home nova ocupa "/". Os links internos dela ficam no
 * próprio conjunto preservado. */
const P = "/previa/institucional";

export type Pagina = "home" | "plataforma" | "pesquisa" | "empresa";

export const ROTAS: Record<Idioma, Record<Pagina, string>> = {
  en: { home: P, plataforma: `${P}/platform`, pesquisa: `${P}/research`, empresa: `${P}/company` },
  pt: { home: `${P}/pt`, plataforma: `${P}/pt/plataforma`, pesquisa: `${P}/pt/pesquisa`, empresa: `${P}/pt/empresa` },
};

export const NAV: Record<Idioma, Array<[Pagina, string]>> = {
  en: [["home", "Home"], ["plataforma", "Platform"], ["pesquisa", "Research"], ["empresa", "Company"]],
  pt: [["home", "Início"], ["plataforma", "Plataforma"], ["pesquisa", "Pesquisa"], ["empresa", "Empresa"]],
};

/** Página individual de cada pessoa (destino sem JavaScript dos cartões da equipe). */
export const rotaPessoa = (idioma: Idioma, id: string) => (idioma === "en" ? `${P}/company/team/${id}` : `${P}/pt/empresa/equipe/${id}`);

/** Rota de comparação com a experiência anterior, no mesmo idioma. */
export const ROTA_COMPARACAO: Record<Idioma, string> = { en: "/previa/refinada/en", pt: "/previa/refinada" };

export const outroIdioma = (idioma: Idioma): Idioma => (idioma === "en" ? "pt" : "en");
