"use client";

import { useTranslation } from "@/lib/i18n";

import { useEffect, useId, useRef, useState } from "react";
import { NAV_ITEMS } from "@/lib/navigation";
import { setMotionPaused, useMotionPaused } from "@/lib/motion-prefs";
import { usePrefersReducedMotion } from "./motion/usePrefersReducedMotion";
import { BrandMark } from "./BrandMark";
import { LogoCanonico } from "./marca/LogoCanonico";
import { LanguageSwitch } from "./LanguageSwitch";
import styles from "./SiteHeader.module.css";

/**
 * Opções explícitas (todas desligadas por padrão: "/" e /previa, /a, /b não mudam):
 *  · brandWords — 2ª palavra da marca alterna (ex.: MODEL ↔ PROSTATE na /previa/refinada);
 *  · menuFocus — Escape devolve o foco ao botão do menu; escolher uma seção leva o foco a ela;
 *  · solid — fundo mais opaco quando rolado (o texto do conteúdo não atravessa os links);
 *  · marcaCanonica — lockup horizontal da masterbrand (Fase 1) no lugar do ícone antigo + nome
 *    tipografado; sem o ciclo MODEL/PROSTATE (experimento experiment/brand-canonical-v1).
 */
export function SiteHeader({
  brandWords,
  menuFocus = false,
  solid = false,
  languageSwitch = false,
  marcaCanonica = false,
}: { brandWords?: readonly string[]; menuFocus?: boolean; solid?: boolean; languageSwitch?: boolean; marcaCanonica?: boolean } = {}) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      // Menu de navegação comum (sem focus trap): ao fechar por Escape, o foco volta ao botão.
      if (menuFocus) menuButton.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, menuFocus]);

  /** Seção escolhida no menu: fecha e leva o foco ao destino (o link some com o menu fechado).
   *  #jornada fica com o controlador da abertura, que já foca a seção ao chegar. */
  const onPick = (href: string) => {
    setOpen(false);
    if (!menuFocus || href === "#jornada") return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    window.setTimeout(() => {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }, 0);
  };

  return (
    <header className={styles.header} data-scrolled={scrolled || open} data-open={open} data-solid={solid || undefined} data-localized={languageSwitch || undefined} data-marca={marcaCanonica ? "canonica" : undefined}>
      <div className={styles.bar}>
        <a href="#inicio" className={styles.brand} aria-label={t("ARARAT MODEL — início")}>
          {marcaCanonica ? <LogoCanonico /> : <BrandMark cycleWords={brandWords} />}
        </a>

        {languageSwitch && <LanguageSwitch />}
        <MotionToggle />

        <button
          ref={menuButton}
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.menuIcon} aria-hidden="true" />
          <span className="visually-hidden">{t(open ? "Fechar menu" : "Abrir menu")}</span>
        </button>

        <nav id={menuId} className={styles.nav} aria-label={t("Principal")}>
          <ul className={styles.list}>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={styles.link} onClick={() => onPick(item.href)}>
                  {t(item.label)}
                </a>
              </li>
            ))}
          </ul>
          <a href="#jornada" className={`btn btn-gold ${styles.cta}`} onClick={() => onPick("#jornada")}>
            {t("Explorar a jornada")}</a>
          <MotionToggle inMenu />
        </nav>
      </div>
    </header>
  );
}

/** Pausa global de animações; no celular fica dentro do menu (falta espaço na barra). */
function MotionToggle({ inMenu = false }: { inMenu?: boolean }) {
  const { t } = useTranslation();
  const paused = useMotionPaused();
  const reduced = usePrefersReducedMotion();
  const label = reduced ? "Movimento reduzido" : paused ? "Retomar animações" : "Pausar animações";
  return (
    <button
      type="button"
      className={`${styles.motionToggle} ${inMenu ? styles.inMenu : styles.inBar}`}
      aria-pressed={paused}
      onClick={() => setMotionPaused(!paused)}
      disabled={reduced}
      title={t(reduced ? "Movimento reduzido ativo no sistema" : label)}
    >
      <span className={styles.motionIcon} data-paused={paused || reduced} aria-hidden="true" />
      <span className={styles.motionLabel}>{t(label)}</span>
    </button>
  );
}
