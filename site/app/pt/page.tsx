import type { Metadata } from "next";
import { PreviewPage } from "@/components/preview/PreviewPage";
import "@/components/preview/proposta/proposta.css";
import "@/components/preview/proposta/refinada.css";
// Experimento brand-canonical-v1: identidade canônica (Fases 1/2A) sobre a refinada.
import "@/components/preview/proposta/marca-canonica.css";
import { ICONES_MARCA, VIEWPORT_MARCA } from "@/lib/marca-canonica";

export const metadata: Metadata = {
  title: "ARARAT MODEL | Radiômica explicável para RM de próstata",
  description: "Conheça o Hub e o Viewer do ARARAT, a pesquisa em radiômica explicável e o fluxo de revisão de RM de próstata. Plataforma em validação científica.",
  openGraph: {
    title: "ARARAT MODEL — Radiômica explicável para RM de próstata",
    description: "Ferramentas e pesquisa para a revisão de RM de próstata, com revisão humana e limites científicos à vista.",
    locale: "pt_BR",
  },
  icons: ICONES_MARCA,
};
export const viewport = VIEWPORT_MARCA;

export default function PortugueseHome() {
  return <PreviewPage proposta="refinada" />;
}
