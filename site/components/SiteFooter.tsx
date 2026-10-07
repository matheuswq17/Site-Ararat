import Image from "next/image";
import { DISCLAIMER, NAV_ITEMS } from "@/lib/navigation";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.inner}`}>
        <a href="#inicio" className={styles.logo}>
          <Image
            src="/brand/ararat_logo_principal_transparente.png"
            alt="ARARAT MODEL — Radiômica explicável para uma oncologia de precisão"
            width={945}
            height={795}
            className={styles.logoImg}
          />
        </a>

        <nav aria-label="Rodapé" className={styles.nav}>
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.meta}>
          <p>{DISCLAIMER}</p>
          <p className={styles.small}>
            Imagem de RM demonstrativa; marcações, recortes e contribuições são ilustrativos e não representam resultados clínicos nem saídas do modelo.
          </p>
        </div>
      </div>
    </footer>
  );
}
