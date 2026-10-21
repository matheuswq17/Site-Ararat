import type { Metadata } from "next";
import { EmpresaInstitucional } from "@/components/institucional/Paginas";
import { EMPRESA, t } from "@/lib/institucional/textos";
import { ICONES_03D2, MANIFESTO_WEB_03D2, VIEWPORT_03D2 } from "@/lib/marca-03d2";

/** institucional-site-v1 (Etapa 2 experimental): /pt/empresa · equivalente em /company. Não indexar. */
export const metadata: Metadata = {
  title: t(EMPRESA.metaTitulo, "pt"),
  description: t(EMPRESA.metaDescricao, "pt"),
  robots: { index: false, follow: false },
  alternates: { languages: { en: "/previa/institucional/company" } },
  icons: ICONES_03D2,
  manifest: MANIFESTO_WEB_03D2,
};
export const viewport = VIEWPORT_03D2;

export default function Pagina() {
  return <EmpresaInstitucional idioma="pt" />;
}
