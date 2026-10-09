"use client";

import { useTranslation } from "@/lib/i18n";

/**
 * Troca de idioma (link para a outra versão, mantendo busca e âncora).
 *  · padrão: mostra só o idioma de destino ("PT" / "EN");
 *  · par (identidade 03D2, seletor ar-lang do kit): mostra "EN / PT" com o idioma atual marcado; o elemento
 *    inteiro continua sendo UM link para o outro idioma (mesmo destino, mesmo nome acessível).
 */
export function LanguageSwitch({ par = false }: { par?: boolean } = {}) {
  const { locale, t } = useTranslation();
  return (
    <a className="language-switch" href={locale === "en" ? "/pt" : "/"}
      hrefLang={locale === "en" ? "pt-BR" : "en"}
      lang={locale === "en" ? "pt-BR" : "en"}
      aria-label={locale === "en" ? "Mudar para português" : "Switch to English"}
      onClick={(event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        window.location.assign((locale === "en" ? "/pt" : "/") + window.location.search + window.location.hash);
      }}>
      {par ? (
        <>
          <span data-lang="en" data-atual={locale === "en" || undefined}>EN</span>
          <span data-lang-sep="" aria-hidden="true">/</span>
          <span data-lang="pt" data-atual={locale !== "en" || undefined}>PT</span>
        </>
      ) : locale === "en" ? "PT" : "EN"}
      <span className="visually-hidden"> — {t("Idioma")}</span>
    </a>
  );
}
