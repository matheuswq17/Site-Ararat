import { PreviewPage } from "@/components/preview/PreviewPage";
import "@/components/preview/proposta/proposta.css";
import "@/components/preview/proposta/refinada.css";
// Experimento brand-sinal-v1: identidade ARARAT Sinal v1.0 sobre a refinada.
import "@/components/preview/proposta/marca-sinal.css";
import { ICONES_SINAL, VIEWPORT_SINAL } from "@/lib/marca-sinal";

export const metadata = { icons: ICONES_SINAL };
export const viewport = VIEWPORT_SINAL;

export default function Home() {
  return <PreviewPage proposta="refinada" />;
}
