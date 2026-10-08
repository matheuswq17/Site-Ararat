import type { Metadata, Viewport } from "next";

/**
 * Experimento brand-canonical-v1 — referências da identidade canônica usadas pela refinada
 * ("/", "/pt", /previa/refinada). Arquivos copiados sem alteração dos pacotes canônicos; hashes em
 * public/marca/MANIFESTO.json (conferência: node tests/marca-integridade.mjs).
 *
 * Favicon: desenho próprio de 16 px da Fase 1 (silhueta mineral-clara sobre deep slate-pine), em SVG
 * e no PNG de 16 px do pacote. Ícones de aplicativo 32/180/512 px não fazem parte da Fase 1 → pendência.
 */
export const ICONES_MARCA: Metadata["icons"] = {
  icon: [
    { url: "/marca/fase1-v1.0.1/ararat-favicon-reversed-16px-v1.0.svg", type: "image/svg+xml" },
    { url: "/marca/fase1-v1.0.1/ararat-favicon-reversed-16px-v1.0.png", sizes: "16x16", type: "image/png" },
  ],
};

/** Barra do navegador: superfície escura do tema (viewer-dark surface.base, Fase 2A). */
export const VIEWPORT_MARCA: Viewport = { themeColor: "#10282E", colorScheme: "dark" };
