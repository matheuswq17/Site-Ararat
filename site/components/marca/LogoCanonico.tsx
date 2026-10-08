import styles from "./LogoCanonico.module.css";

/**
 * Masterbrand ARARAT — lockup horizontal NEGATIVO da Fase 1 (v1.0.1), servido sem alteração a partir
 * de public/marca/fase1-v1.0.1/ (SHA-256 conferido contra o manifesto canônico; ver public/marca/MANIFESTO.json).
 *
 *  · Arquivo de distribuição em curvas: o wordmark NÃO é tipografado em Lora.
 *  · viewBox 1800 × 620 (proporção 2,903:1); a altura vem do CSS e a largura acompanha — sem deformar.
 *  · Lockup horizontal: mínimo de 120 px de largura (especificação §4.6); área de proteção aplicada
 *    pelo CSS do contexto. O símbolo dentro do lockup segue o desenho completo aprovado para o lockup.
 *  · Decorativo dentro de um link com nome acessível próprio (alt vazio).
 */
export const LOGO_HORIZONTAL_NEGATIVO = "/marca/fase1-v1.0.1/ararat-masterbrand-logo-horizontal-negative-full-v1.0.svg";
const PROPORCAO = 1800 / 620;

export function LogoCanonico({ tamanho = "cabecalho" }: { tamanho?: "cabecalho" | "rodape" }) {
  const altura = tamanho === "cabecalho" ? 46 : 64;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG canônico servido como arquivo, sem otimização
    <img
      src={LOGO_HORIZONTAL_NEGATIVO}
      alt=""
      width={Math.round(altura * PROPORCAO)}
      height={altura}
      className={`${styles.logo} ${styles[tamanho]}`}
      decoding="async"
      fetchPriority={tamanho === "cabecalho" ? "high" : undefined}
    />
  );
}
