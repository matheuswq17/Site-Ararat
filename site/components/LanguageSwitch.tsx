"use client";

import { useTranslation } from "@/lib/i18n";

export function LanguageSwitch() {
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
      {locale === "en" ? "PT" : "EN"}
      <span className="visually-hidden"> — {t("Idioma")}</span>
    </a>
  );
}
