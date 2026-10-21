import type { Metadata, Viewport } from "next";

/**
 * Alternativa codex/brand-03d2-v1 — referências da identidade ARARAT 03D2 v1.0 usadas pela refinada
 * ("/", "/pt", /previa/refinada). Arquivos oficiais copiados sem alteração, nos mesmos caminhos relativos do
 * kit, em public/marca-03d2/v1.0/; hashes em public/marca-03d2/v1.0/MANIFESTO.json
 * (conferência: node tests/marca-03d2-integridade.mjs).
 */
export const BASE_03D2 = "/marca-03d2/v1.0/";
const F = `${BASE_03D2}01_logo/favicon/`;

/** Favicons do kit (head-snippet.html): ICO 16/32/48, SVG que troca de tinta com o tema do sistema,
 *  ícone iOS 180 e manifesto com ícones de app 192/512 + maskable. O desenho é a REDUÇÃO (16–48 px). */
export const ICONES_03D2: Metadata["icons"] = {
  icon: [
    { url: `${F}favicon.ico`, sizes: "16x16 32x32 48x48" },
    { url: `${F}favicon.svg`, type: "image/svg+xml" },
  ],
  apple: [{ url: `${F}apple-touch-icon-180.png`, sizes: "180x180" }],
};
export const MANIFESTO_WEB_03D2 = `${F}site.webmanifest`;

/** Barra do navegador: bg/canvas do tema escuro (o site usa o escuro como padrão no kit). */
export const VIEWPORT_03D2: Viewport = { themeColor: "#111111", colorScheme: "dark" };

/** Cobertura do quadro da jornada = fundo da seção sob o quadro (bg/canvas escuro). */
export const COR_COBERTURA_03D2 = "#111111";

/** Assinaturas usadas no Site (SVG oficiais, caminhos e proporções do arquivo; nunca redigitadas).
 *  · cabeçalho: ararat-assinatura-animavel.svg — os MESMOS 14 caminhos da assinatura horizontal (conferido
 *    por teste), com as camadas separadas para a revelação; inserida no HTML (completa sem JavaScript);
 *  · rodapé: assinatura horizontal negativa (#F6F6F6) como <img>.
 *  viewBox: animável −2 −120 1025,6 122 (2 u de margem); horizontal 0 −118 1021,65 118. */
export const ASSINATURA_03D2 = {
  animavel: { src: `${BASE_03D2}07_motion/ararat-assinatura-animavel.svg`, proporcao: 1025.6 / 122 },
  horizontal: { src: `${BASE_03D2}01_logo/assinatura-horizontal/ararat-horizontal-negativo.svg`, proporcao: 1021.65 / 118 },
} as const;
