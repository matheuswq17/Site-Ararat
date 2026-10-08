"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import english from "./locales/en.json";

export type Locale = "en" | "pt";
const Language = createContext<Locale>("pt");
const dictionary: Record<string, string> = english;

export function translate<T>(value: T, locale: Locale): T {
  if (locale !== "en" || typeof value !== "string") return value;
  const key = value.replace(/\s+/g, " ").trim();
  let translated = dictionary[key];
  if (translated == null && key && key[0] === key[0].toLowerCase()) {
    const sentence = dictionary[key[0].toUpperCase() + key.slice(1)];
    if (sentence) translated = sentence[0].toLowerCase() + sentence.slice(1);
  }
  if (translated == null) {
    const patterns: Array<[RegExp, string]> = [
      [/^Retrato de (.+) carregando$/, "Loading portrait of $1"],
      [/^Retrato de (.+) — foto indisponível$/, "Portrait of $1 — photo unavailable"],
      [/^Retrato de (.+)$/, "Portrait of $1"],
      [/^Retrato indisponível de (.+)$/, "Portrait unavailable for $1"],
      [/^Ler biografia de (.+)$/, "Read biography of $1"],
      [/^Percurso em (\d+) etapas, do Hub ao Viewer e de volta$/, "A $1-step journey from Hub to Viewer and back"],
      [/^Os tons de cinza (da região|da janela central) numa escala de cor, para ficarem comparáveis\.$/, "Grayscale values shown on a color scale for comparison."],
      // brand-sinal-v1 (Intensidade em curvas de iso-intensidade, sem mapa de cores).
      [/^Os tons de cinza (da região|da janela central) em curvas de mesma intensidade, para ficarem comparáveis\.$/, "Grayscale values traced as lines of equal intensity, for comparison."],
    ];
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(key)) { translated = key.replace(pattern, replacement); break; }
    }
    const step = key.match(/^Etapa (\d+) de (\d+): (.+)$/);
    if (step) translated = `Step ${step[1]} of ${step[2]}: ${translate(step[3], locale)}`;
    if (key.startsWith("Leitura da família ")) translated = `Reading the ${translate(key.slice(18), locale)} feature family`;
  }
  if (translated == null) return value;
  return (value.match(/^\s*/)?.[0] + translated + value.match(/\s*$/)?.[0]) as T;
}

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <Language.Provider value={locale}>{children}</Language.Provider>;
}

export function useTranslation() {
  const locale = useContext(Language);
  const t = useCallback(<T,>(value: T): T => translate(value, locale), [locale]);
  return { locale, t };
}
