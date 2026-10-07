import Image from "next/image";
import { BrandWordCycle } from "./brand/BrandWordCycle";
import styles from "./BrandMark.module.css";

/**
 * Ícone original da marca (references/brand/ararat_icone_transparente.png)
 * + nome tipografado em Montserrat, seguindo a "versão secundária" do brand kit.
 * Pendência: substituir pelo arquivo oficial horizontal (idealmente SVG) quando fornecido.
 */
export function BrandMark({
  size = "md",
  cycleWords,
}: {
  /** lgFit (só rodapé da /previa/refinada): igual a lg e encolhe em telas estreitas (≤ 420 px)
   *  para caber sem rolagem lateral; lg segue como antes nas outras rotas. */
  size?: "md" | "lg" | "lgFit";
  /** Opcional (só /previa/refinada): a 2ª palavra alterna entre estas, começando pela 1ª. */
  cycleWords?: readonly string[];
}) {
  return (
    <span className={`${styles.mark} ${size === "lgFit" ? `${styles.lg} ${styles.lgFit}` : styles[size]} ${cycleWords && cycleWords.length > 1 ? styles.cycling : ""}`}>
      <Image
        src="/brand/ararat_icone_transparente.png"
        alt=""
        // Tamanho real de exibição (54/72 px): srcset 1×/2× pequeno em vez de 828 px.
        width={size === "md" ? 54 : 72}
        height={size === "md" ? 33 : 44}
        className={styles.icon}
        // Identidade acima da dobra: busca imediata, alta prioridade, sem <link preload> extra.
        loading={size === "md" ? "eager" : undefined}
        fetchPriority={size === "md" ? "high" : undefined}
      />
      <span className={styles.word} aria-hidden="true">
        <span className={styles.ararat}>ARARAT</span>
        {cycleWords && cycleWords.length > 1 ? (
          <BrandWordCycle words={cycleWords} className={styles.model} />
        ) : (
          <span className={styles.model}>MODEL</span>
        )}
      </span>
    </span>
  );
}
