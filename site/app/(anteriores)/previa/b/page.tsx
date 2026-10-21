import type { Metadata } from "next";
import { PreviewPage } from "@/components/preview/PreviewPage";
// Tipografia da proposta B (fontes locais WOFF2, OFL) + barra de rolagem da marca.
import "@/components/preview/proposta/proposta.css";
import "@/components/preview/proposta/tipografia-b.css";

export const metadata: Metadata = {
  title: "Prévia B — tipografia e navegação | ARARAT MODEL",
  robots: { index: false, follow: false },
};

/**
 * PROPOSTA EXPERIMENTAL B — Sora 600 (títulos) + IBM Plex Sans 400/500 (corpo).
 * Mesmos textos e mesma cena da /previa (base de comparação, 0.2.1-draft); escultura atual como
 * referência até a escolha da montanha nova. Não aprovada; não substitui "/".
 */
export default function PreviaPropostaB() {
  return <PreviewPage proposta="b" />;
}
