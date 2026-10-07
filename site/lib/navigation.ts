export const NAV_ITEMS = [
  { href: "#jornada", label: "Jornada" },
  { href: "#plataforma", label: "Plataforma" },
  { href: "#explicabilidade", label: "Explicabilidade" },
  { href: "#ciencia", label: "Ciência" },
  { href: "#contato", label: "Contato" },
] as const;

export const DISCLAIMER =
  "ARARAT MODEL é uma plataforma de apoio à análise médica e pesquisa. Não substitui a avaliação de profissionais de saúde.";

/** Palavras da marca no cabeçalho da /previa/refinada (ciclo MODEL ↔ PROSTATE). Configurável:
 *  outras palavras (ex.: áreas futuras) só entram quando houver modelo disponível — não nesta rodada. */
export const BRAND_WORDS_REFINADA = ["MODEL", "PROSTATE"] as const;

/** Rodapé da /previa/refinada (rodada 6): inclui Time antes de Contato. No cabeçalho, Time só entra
 *  se couber sem comprimir a navegação em 1280 px (ver STATUS-TIME-SITE.md). */
export const NAV_ITEMS_REFINADA = [
  { href: "#jornada", label: "Jornada" },
  { href: "#plataforma", label: "Plataforma" },
  { href: "#explicabilidade", label: "Explicabilidade" },
  { href: "#ciencia", label: "Ciência" },
  { href: "#time", label: "Time" },
  { href: "#contato", label: "Contato" },
] as const;
