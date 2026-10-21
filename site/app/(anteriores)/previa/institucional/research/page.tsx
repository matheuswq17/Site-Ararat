import type { Metadata } from "next";
import { PesquisaInstitucional } from "@/components/institucional/Paginas";
import { PESQUISA, t } from "@/lib/institucional/textos";
import { ICONES_03D2, MANIFESTO_WEB_03D2, VIEWPORT_03D2 } from "@/lib/marca-03d2";

/** institucional-site-v1 (Etapa 2 experimental): /research · equivalente em /pt/pesquisa. Não indexar. */
export const metadata: Metadata = {
  title: t(PESQUISA.metaTitulo, "en"),
  description: t(PESQUISA.metaDescricao, "en"),
  robots: { index: false, follow: false },
  alternates: { languages: { "pt-BR": "/previa/institucional/pt/pesquisa" } },
  icons: ICONES_03D2,
  manifest: MANIFESTO_WEB_03D2,
};
export const viewport = VIEWPORT_03D2;

export default function Pagina() {
  return <PesquisaInstitucional idioma="en" />;
}
