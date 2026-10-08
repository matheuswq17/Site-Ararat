import type { Metadata, Viewport } from "next";

/**
 * Experimento brand-sinal-v1 — referências da identidade ARARAT Sinal v1.0 usadas pela refinada
 * ("/", "/pt", /previa/refinada). Arquivos oficiais copiados sem alteração; hashes em
 * public/marca-sinal/v1.0/MANIFESTO.json (conferência: node tests/sinal-integridade.mjs).
 */
const F = "/marca-sinal/v1.0/favicon/";
export const ICONES_SINAL: Metadata["icons"] = {
  icon: [
    { url: `${F}favicon.ico`, sizes: "16x16 32x32" },
    { url: `${F}ararat-favicon-16.svg`, type: "image/svg+xml", sizes: "16x16" },
    { url: `${F}ararat-favicon-32.svg`, type: "image/svg+xml", sizes: "32x32" },
    { url: `${F}ararat-app-icon-512px.png`, type: "image/png", sizes: "512x512" },
  ],
  apple: [{ url: `${F}ararat-app-icon-180px.png`, sizes: "180x180" }],
};

/** Barra do navegador: fundo institucional escuro do Sinal (bg = gray-5). */
export const VIEWPORT_SINAL: Viewport = { themeColor: "#111111", colorScheme: "dark" };

/** Primeira dobra (adaptação editorial do Sinal). PT é a frase-mensagem do brand system; EN é tradução
 *  editorial registrada em lib/locales/en.json. A 2ª frase usa o tom secundário (como no brand book). */
export const TITULO_SINAL = ["Contraste é informação.", "Nós medimos.", "Você decide."] as const;
export const TITULO_SINAL_SECUNDARIA = 1;

/** Cobertura do quadro da jornada = fundo da seção sob o quadro (gray-5). */
export const COR_COBERTURA_SINAL = "#111111";
