import type { Metadata } from "next";
import { PreviewPage } from "@/components/preview/PreviewPage";
// Barra de rolagem da marca (comum às propostas) + tipografia A com pesos reais e reserva métrica.
import "@/components/preview/proposta/proposta.css";
import "@/components/preview/proposta/refinada.css";
// Experimento brand-sinal-v1: identidade ARARAT Sinal v1.0 sobre a refinada.
import "@/components/preview/proposta/marca-sinal.css";
import { ICONES_SINAL, VIEWPORT_SINAL } from "@/lib/marca-sinal";

export const metadata: Metadata = {
  title: "Prévia refinada — tipografia A + montanha B | ARARAT MODEL",
  robots: { index: false, follow: false },
  icons: ICONES_SINAL,
};
export const viewport = VIEWPORT_SINAL;

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
