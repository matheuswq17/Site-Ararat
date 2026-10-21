import styles from "./LogoSinal.module.css";

/**
 * ARARAT Sinal v1.0 — lockups horizontais OFICIAIS sobre escuro, servidos sem alteração a partir de
 * public/marca-sinal/v1.0/logo/ (SHA-256 em public/marca-sinal/v1.0/MANIFESTO.json).
 *
 *  · Wordmark em curvas (Geist Medium, tracking 0,34 em) — nunca redigitado.
 *  · Afastamento símbolo ↔ nome é o do próprio arquivo (0,95× a altura das maiúsculas): o símbolo não
 *    lê como sétima letra ("AARARAT").
 *  · Abaixo de 40 px de altura usa o lockup COMPACTO (desenho micro do símbolo); 40 px ou mais, o full.
 *  · Só a altura vem do CSS; width: auto preserva a proporção (sem deformar).
 *  · Área de proteção: 2× o diâmetro do ponto, aplicada pelo CSS do contexto (padding).
 *  · Decorativo dentro de um link com nome acessível próprio (alt vazio).
 */
export const LOCKUP_SINAL = {
  compacto: { src: "/marca-sinal/v1.0/logo/ararat-lockup-horizontal-compacto-escuro.svg", proporcao: 704.1 / 106.5 },
  full: { src: "/marca-sinal/v1.0/logo/ararat-lockup-horizontal-escuro.svg", proporcao: 722.9 / 124.2 },
} as const;

export function LogoSinal({ contexto = "cabecalho" }: { contexto?: "cabecalho" | "rodape" }) {
  const desenho = contexto === "cabecalho" ? LOCKUP_SINAL.compacto : LOCKUP_SINAL.full;
  const altura = contexto === "cabecalho" ? 28 : 48;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG oficial servido como arquivo, sem otimização
    <img
      src={desenho.src}
      alt=""
      width={Math.round(altura * desenho.proporcao)}
      height={altura}
      className={`${styles.logo} ${styles[contexto]}`}
      decoding="async"
      fetchPriority={contexto === "cabecalho" ? "high" : undefined}
      data-lockup={contexto === "cabecalho" ? "compacto" : "full"}
    />
  );
}
