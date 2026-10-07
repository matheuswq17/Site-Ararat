import type { Metadata } from "next";
import { PreviewPage } from "@/components/preview/PreviewPage";
// Tipografia da proposta A (fontes locais WOFF2, OFL) + barra de rolagem da marca.
import "@/components/preview/proposta/proposta.css";
import "@/components/preview/proposta/tipografia-a.css";

export const metadata: Metadata = {
  title: "Prévia A — tipografia e navegação | ARARAT MODEL",
  robots: { index: false, follow: false },
};

/**
 * PROPOSTA EXPERIMENTAL A — Space Grotesk 500/600 (títulos) + Source Sans 3 400/600 (corpo).
 * Mesmos textos e mesma cena da /previa (base de comparação, 0.2.1-draft); escultura atual como
 * referência até a escolha da montanha nova. Não aprovada; não substitui "/".
 */
export default function PreviaPropostaA() {
  return <PreviewPage proposta="a" />;
}
