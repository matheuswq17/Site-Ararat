"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Identidade visual ativa na árvore. A refinada fornece a identidade da branch (codex/brand-03d2-v1: "03d2";
 * a camada "sinal" continua disponível); as rotas de comparação não têm provedor e ficam em "base". Usado por componentes compartilhados
 * que desenham em SVG/filtros (ExplainMri, JourneyMriScene), onde CSS não alcança os valores.
 */
export type MarcaTema = "base" | "sinal" | "03d2";
const Contexto = createContext<MarcaTema>("base");

export function MarcaTemaProvider({ tema, children }: { tema: MarcaTema; children: ReactNode }) {
  return <Contexto.Provider value={tema}>{children}</Contexto.Provider>;
}

export const useMarcaTema = () => useContext(Contexto);

/**
 * Matrizes dos filtros da Explicabilidade.
 *  · base: bordas em dourado; Intensidade = mapa de cores navy→dourado pintado sobre os pixels.
 *  · sinal (combinado com o Motion, 0.9.0-sinal): bordas em gray-90 (#E2E2E2 = 0,886); Intensidade =
 *    CURVAS de iso-intensidade em gray-90 sobre a RM intacta — 6 faixas de tom servem só para extrair as
 *    fronteiras; os pixels quantizados não são exibidos e a RM não é remapeada nem janelada.
 */
export const FILTROS_XAI = {
  base: {
    bordas: "0 0 0 0 0.88  0 0 0 0 0.73  0 0 0 0 0.25  5 5 5 0 -0.35",
    bordasSuave: "0 0 0 0 0.88  0 0 0 0 0.73  0 0 0 0 0.25  2.2 2.2 2.2 0 -0.3",
  },
  sinal: {
    bordas: "0 0 0 0 0.886  0 0 0 0 0.886  0 0 0 0 0.886  5 5 5 0 -0.35",
    bordasSuave: "0 0 0 0 0.886  0 0 0 0 0.886  0 0 0 0 0.886  2.2 2.2 2.2 0 -0.3",
    isoCurvas: "0 0 0 0 0.886  0 0 0 0 0.886  0 0 0 0 0.886  4 4 4 0 0",
  },
  /** 03D2: mesmo desenho do Sinal, na cor de text/primary do tema escuro (#EDEDED = 237/255 = 0,929). */
  "03d2": {
    bordas: "0 0 0 0 0.929  0 0 0 0 0.929  0 0 0 0 0.929  5 5 5 0 -0.35",
    bordasSuave: "0 0 0 0 0.929  0 0 0 0 0.929  0 0 0 0 0.929  2.2 2.2 2.2 0 -0.3",
    isoCurvas: "0 0 0 0 0.929  0 0 0 0 0.929  0 0 0 0 0.929  4 4 4 0 0",
  },
} as const;
