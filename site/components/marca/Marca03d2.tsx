import { ASSINATURA_03D2 } from "@/lib/marca-03d2";
import styles from "./Marca03d2.module.css";

/**
 * ARARAT 03D2 v1.0 — assinatura horizontal OFICIAL (símbolo mestre + nome em curvas; nunca redigitada).
 *
 *  · Cabeçalho: o SVG animável do kit (mesmos 14 caminhos da horizontal, com as três camadas separadas)
 *    vem no HTML como markup, sem alteração; a tinta segue logo/ink por CSS. Se o arquivo não puder ser
 *    lido no servidor, cai para o <img> da horizontal negativa (mesmo desenho).
 *  · Rodapé: <img> da horizontal negativa (#F6F6F6).
 *  · Só a LARGURA vem do CSS (≥ 160 px em toda tela); a altura sai da proporção do arquivo — nada é esticado.
 *    A variante compacta (símbolo de redução) e o micro não são usados aqui: ficam para favicon e ícones.
 *  · Decorativa dentro de um link com nome acessível próprio (aria-hidden / alt vazio).
 */
export function AssinaturaCabecalho03d2({ svg }: { svg: string | null }) {
  if (!svg) {
    const a = ASSINATURA_03D2.horizontal;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- SVG oficial servido como arquivo
      <img src={a.src} alt="" width={192} height={Math.round(192 / a.proporcao)} className={`${styles.assinatura} ${styles.cabecalho}`} data-assinatura="horizontal" fetchPriority="high" />
    );
  }
  return <span className={`${styles.assinatura} ${styles.cabecalho}`} data-assinatura="animavel" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function AssinaturaRodape03d2() {
  const a = ASSINATURA_03D2.horizontal;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG oficial servido como arquivo
    <img src={a.src} alt="" width={232} height={Math.round(232 / a.proporcao)} className={`${styles.assinatura} ${styles.rodape}`} data-assinatura="horizontal" loading="lazy" decoding="async" />
  );
}
