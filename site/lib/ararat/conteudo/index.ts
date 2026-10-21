import { en } from "./en";
import { pt } from "./pt";
import { es } from "./es";
import type { Conteudo } from "./tipo";

export type Idioma = "en" | "pt" | "es";
export const IDIOMAS: readonly Idioma[] = ["en", "pt", "es"];
export const LANG_HTML: Record<Idioma, string> = { en: "en", pt: "pt-BR", es: "es" };
export const LOCALE_OG: Record<Idioma, string> = { en: "en_US", pt: "pt_BR", es: "es_ES" };

const CONTEUDO: Record<Idioma, Conteudo> = { en, pt, es };
export const conteudo = (idioma: Idioma): Conteudo => CONTEUDO[idioma];
export type { Conteudo };
