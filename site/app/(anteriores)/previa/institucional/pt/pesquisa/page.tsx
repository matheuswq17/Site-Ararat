import type { Metadata } from "next";
import { PesquisaInstitucional } from "@/components/institucional/Paginas";
import { PESQUISA, t } from "@/lib/institucional/textos";
import { ICONES_03D2, MANIFESTO_WEB_03D2, VIEWPORT_03D2 } from "@/lib/marca-03d2";

/** institucional-site-v1 (Etapa 2 experimental): /pt/pesquisa · equivalente em /research. Não indexar. */
export const metadata: Metadata = {
  title: t(PESQUISA.metaTitulo, "pt"),
  description: t(PESQUISA.metaDescricao, "pt"),
  robots: { index: false, follow: false },
  alternates: { languages: { en: "/previa/institucional/research" } },
  icons: ICONES_03D2,
  manifest: MANIFESTO_WEB_03D2,
};
export const viewport = VIEWPORT_03D2;

export default function Pagina() {
  return <PesquisaInstitucional idioma="pt" />;
}
