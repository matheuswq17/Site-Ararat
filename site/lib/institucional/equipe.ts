import english from "@/lib/locales/en.json";
import { TIME, type Integrante } from "@/lib/time-refinada";
import type { Idioma } from "./textos";

/**
 * Equipe do institucional. FONTE ÚNICA: lib/time-refinada.ts (nomes, funções, biografias e fotos informados pela
 * equipe; ordem do brief; Miguel sem sobrenome). As versões em inglês vêm do dicionário existente lib/locales/en.json
 * (chave = texto em português). Para editar uma biografia: mude o texto em time-refinada.ts E a chave/valor
 * correspondentes em en.json (ver site/EDITAR.md).
 */
const EN = english as Record<string, string>;
const traduzir = (pt: string, idioma: Idioma) => (idioma === "en" ? EN[pt.replace(/\s+/g, " ").trim()] ?? pt : pt);

export type Pessoa = { id: Integrante["id"]; nome: string; funcao: string; bio: string[]; foto: { src: string; w: number }; fotos: Integrante["fotos"]; alt: string };

export function equipe(idioma: Idioma): Pessoa[] {
  return TIME.map((p) => ({
    id: p.id,
    nome: p.nome,
    funcao: traduzir(p.funcao, idioma),
    bio: p.bio.map((b) => traduzir(b, idioma)),
    foto: p.fotos.find((f) => f.w >= 360) ?? p.fotos[p.fotos.length - 1],
    fotos: p.fotos,
    alt: idioma === "en" ? `Portrait of ${p.nome}` : p.alt,
  }));
}

export const IDS_EQUIPE = TIME.map((p) => p.id);
