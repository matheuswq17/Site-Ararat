import type { Metadata } from "next";
import { PreviewPage } from "@/components/preview/PreviewPage";
// Barra de rolagem da marca (comum às propostas) + tipografia A com pesos reais e reserva métrica.
import "@/components/preview/proposta/proposta.css";
import "@/components/preview/proposta/refinada.css";
// Experimento brand-canonical-v1: identidade canônica (Fases 1/2A) sobre a refinada.
import "@/components/preview/proposta/marca-canonica.css";
import { ICONES_MARCA, VIEWPORT_MARCA } from "@/lib/marca-canonica";

export const metadata: Metadata = {
  title: "Prévia refinada — tipografia A + montanha B | ARARAT MODEL",
  robots: { index: false, follow: false },
  icons: ICONES_MARCA,
};
export const viewport = VIEWPORT_MARCA;

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
