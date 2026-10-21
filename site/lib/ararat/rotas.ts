import type { Idioma } from "./conteudo";

/** Páginas do site ARARAT (integração do Atlas clínico, portfolio-site-v1). Inglês é o idioma principal ("/");
 *  português em /pt, espanhol em /es. O seletor de idioma leva sempre à página EQUIVALENTE. */
export type Pagina = "home" | "solutions" | "prostate" | "thyroid" | "platform" | "evidence" | "company";

export const ROTAS: Record<Pagina, Record<Idioma, string>> = {
  home: { en: "/", pt: "/pt", es: "/es" },
  solutions: { en: "/solutions", pt: "/pt/solucoes", es: "/es/soluciones" },
  prostate: { en: "/solutions/prostate-mri", pt: "/pt/solucoes/prostata", es: "/es/soluciones/prostata" },
  thyroid: { en: "/solutions/thyroid-ultrasound", pt: "/pt/solucoes/tireoide", es: "/es/soluciones/tiroides" },
  platform: { en: "/platform", pt: "/pt/plataforma", es: "/es/plataforma" },
  evidence: { en: "/research", pt: "/pt/pesquisa", es: "/es/investigacion" },
  company: { en: "/company", pt: "/pt/empresa", es: "/es/empresa" },
};

const PESSOA: Record<Idioma, string> = { en: "/company/team/", pt: "/pt/empresa/equipe/", es: "/es/empresa/equipo/" };
export const rotaPessoa = (idioma: Idioma, id: string) => PESSOA[idioma] + id;

/** Endereço de uma página, com âncora opcional. Página de pessoa: chave "pessoa:<id>". */
export function href(chave: Pagina | `pessoa:${string}`, idioma: Idioma, ancora?: string): string {
  const base = chave.startsWith("pessoa:") ? rotaPessoa(idioma, chave.slice(7)) : ROTAS[chave as Pagina][idioma];
  return ancora ? `${base}#${ancora}` : base;
}

/** Página atual para destacar na navegação (Próstata e Tireoide ficam em Soluções; pessoas em Empresa). */
export const secaoDaPagina = (p: Pagina | `pessoa:${string}`): Pagina =>
  p === "prostate" || p === "thyroid" ? "solutions" : p.startsWith("pessoa:") ? "company" : (p as Pagina);
