"use client";

import { useTranslation } from "@/lib/i18n";

import { LogoSinal } from "../marca/LogoSinal";
import { DISCLAIMER, NAV_ITEMS_REFINADA } from "@/lib/navigation";
import base from "../SiteFooter.module.css";
import styles from "./FooterRefinada.module.css";

/**
 * Rodapé da /previa/refinada. Experimento brand-sinal-v1: lockup horizontal FULL oficial do ARARAT
 * Sinal (≥ 40 px) no lugar do PNG antigo + nome tipografado; a tagline segue como TEXTO separado. Um só aviso permanente curto; os
 * avisos específicos ficam junto das demonstrações (Jornada, Explicabilidade, Plataforma) e o
 * estágio científico na Ciência.
 */
export function FooterRefinada() {
  const { t } = useTranslation();
  return (
    <footer className={`${base.footer} ${styles.footer}`}>
      <div className={`wrap ${base.inner} ${styles.inner}`}>
        <div className={styles.brand}>
          <a href="#inicio" className={styles.logo} aria-label={t("ARARAT MODEL — início")}>
            <LogoSinal contexto="rodape" />
          </a>
          <p className={styles.tagline}>{t("Radiômica explicável para uma oncologia de precisão")}</p>
        </div>

        <nav aria-label={t("Rodapé")} className={base.nav}>
          <ul>
            {NAV_ITEMS_REFINADA.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{t(item.label)}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={base.meta}>
          <p>{t(DISCLAIMER)}</p>
        </div>
      </div>
    </footer>
  );
}
