import type { Metadata } from "next";
import { EmpresaInstitucional } from "@/components/institucional/Paginas";
import { EMPRESA, t } from "@/lib/institucional/textos";
import { ICONES_03D2, MANIFESTO_WEB_03D2, VIEWPORT_03D2 } from "@/lib/marca-03d2";

/** institucional-site-v1 (Etapa 2 experimental): /company · equivalente em /pt/empresa. Não indexar. */
export const metadata: Metadata = {
  title: t(EMPRESA.metaTitulo, "en"),
  description: t(EMPRESA.metaDescricao, "en"),
  robots: { index: false, follow: false },
  alternates: { languages: { "pt-BR": "/previa/institucional/pt/empresa" } },
  icons: ICONES_03D2,
  manifest: MANIFESTO_WEB_03D2,
};
export const viewport = VIEWPORT_03D2;

export default function Pagina() {
  return <EmpresaInstitucional idioma="en" />;
}
