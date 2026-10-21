import type { Metadata } from "next";
import { HomeInstitucional } from "@/components/institucional/Paginas";
import { HOME, t } from "@/lib/institucional/textos";
import { ICONES_03D2, MANIFESTO_WEB_03D2, VIEWPORT_03D2 } from "@/lib/marca-03d2";

/** institucional-site-v1 (Etapa 2 experimental): / · equivalente em /pt. Não indexar. */
export const metadata: Metadata = {
  title: t(HOME.metaTitulo, "en"),
  description: t(HOME.metaDescricao, "en"),
  robots: { index: false, follow: false },
  alternates: { languages: { "pt-BR": "/previa/institucional/pt" } },
  icons: ICONES_03D2,
  manifest: MANIFESTO_WEB_03D2,
};
export const viewport = VIEWPORT_03D2;

export default function Pagina() {
  return <HomeInstitucional idioma="en" />;
}
