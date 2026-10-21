import type { Metadata } from "next";
import { PlataformaInstitucional } from "@/components/institucional/Paginas";
import { PLATAFORMA, t } from "@/lib/institucional/textos";
import { ICONES_03D2, MANIFESTO_WEB_03D2, VIEWPORT_03D2 } from "@/lib/marca-03d2";

/** institucional-site-v1 (Etapa 2 experimental): /platform · equivalente em /pt/plataforma. Não indexar. */
export const metadata: Metadata = {
  title: t(PLATAFORMA.metaTitulo, "en"),
  description: t(PLATAFORMA.metaDescricao, "en"),
  robots: { index: false, follow: false },
  alternates: { languages: { "pt-BR": "/previa/institucional/pt/plataforma" } },
  icons: ICONES_03D2,
  manifest: MANIFESTO_WEB_03D2,
};
export const viewport = VIEWPORT_03D2;

export default function Pagina() {
  return <PlataformaInstitucional idioma="en" />;
}
