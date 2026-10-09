import type { Metadata } from "next";
import { PreviewPage } from "@/components/preview/PreviewPage";
// Barra de rolagem da marca (comum às propostas) + tipografia A com pesos reais e reserva métrica.
import "@/components/preview/proposta/proposta.css";
import "@/components/preview/proposta/refinada.css";
// codex/brand-03d2-v1: identidade ARARAT 03D2 v1.0 sobre a refinada (tokens oficiais com escopo + camada).
// A camada do Sinal (marca-sinal.css) fica no repositório, sem uso nestas rotas.
import "@/components/preview/proposta/marca-03d2.tokens.css";
import "@/components/preview/proposta/marca-03d2.css";
import { ICONES_03D2, MANIFESTO_WEB_03D2, VIEWPORT_03D2 } from "@/lib/marca-03d2";

export const metadata: Metadata = {
  title: "Prévia refinada — tipografia A + montanha B | ARARAT MODEL",
  robots: { index: false, follow: false },
  icons: ICONES_03D2,
  manifest: MANIFESTO_WEB_03D2,
};
export const viewport = VIEWPORT_03D2;

/**
 * VERSÃO CONJUNTA EXPERIMENTAL — escolha do usuário: tipografia A (Space Grotesk 500/600 +
 * Source Sans 3 400/600) + montanha B do Motion e sua transição.
 *  · Montanha B refinada: pacote experimental do Motion 0.4.0-draft (public/previa/
 *    home-montanha-0.4.0/, manifest conferido 37/37), lido só por esta rota (REFINADA_PACKAGE).
 *  · Barra nativa dourada/navy e entrada de 1000 ms (navMode "eased") das propostas.
 *  · Hero sem "Escultura conceitual, não anatomia"; mantém "Plataforma em validação científica".
 * /previa, /previa/a e /previa/b seguem como comparação; "/" não muda. Não publicar.
 */
export default function PreviaRefinada() {
  return <PreviewPage proposta="refinada" />;
}
