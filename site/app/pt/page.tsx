import type { Metadata } from "next";
import { PreviewPage } from "@/components/preview/PreviewPage";
import "@/components/preview/proposta/proposta.css";
import "@/components/preview/proposta/refinada.css";
// Experimento brand-sinal-v1: identidade ARARAT Sinal v1.0 sobre a refinada.
import "@/components/preview/proposta/marca-sinal.css";
import { ICONES_SINAL, VIEWPORT_SINAL } from "@/lib/marca-sinal";

export const metadata: Metadata = {
  title: "ARARAT MODEL | Radiômica explicável para RM de próstata",
  description: "Conheça o Hub e o Viewer do ARARAT, a pesquisa em radiômica explicável e o fluxo de revisão de RM de próstata. Plataforma em validação científica.",
  openGraph: {
    title: "ARARAT MODEL — Radiômica explicável para RM de próstata",
    description: "Ferramentas e pesquisa para a revisão de RM de próstata, com revisão humana e limites científicos à vista.",
    locale: "pt_BR",
  },
  icons: ICONES_SINAL,
};
export const viewport = VIEWPORT_SINAL;

export default function PortugueseHome() {
  return <PreviewPage proposta="refinada" />;
}
