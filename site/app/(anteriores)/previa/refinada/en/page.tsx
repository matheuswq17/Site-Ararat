import type { Metadata } from "next";
import { PreviewPage } from "@/components/preview/PreviewPage";
import "@/components/preview/proposta/proposta.css";
import "@/components/preview/proposta/refinada.css";
// codex/brand-03d2-v1: identidade ARARAT 03D2 v1.0 sobre a refinada (tokens oficiais com escopo + camada).
import "@/components/preview/proposta/marca-03d2.tokens.css";
import "@/components/preview/proposta/marca-03d2.css";
import { ICONES_03D2, MANIFESTO_WEB_03D2, VIEWPORT_03D2 } from "@/lib/marca-03d2";

/**
 * ROTA DE COMPARAÇÃO (institucional-site-v1): a experiência anterior em INGLÊS, exatamente como era servida em "/"
 * até c87b205 (mesmo componente, mesmos estilos, mesma montanha 1.2.0-03d2, Jornada e Explicabilidade).
 * "/" passou a ser a home institucional. A versão em português continua em /previa/refinada, sem mudança.
 */
export const metadata: Metadata = {
  title: "Previous experience (comparison) | ARARAT",
  robots: { index: false, follow: false },
  icons: ICONES_03D2,
  manifest: MANIFESTO_WEB_03D2,
};
export const viewport = VIEWPORT_03D2;

export default function RefinadaIngles() {
  return <PreviewPage proposta="refinada" />;
}
