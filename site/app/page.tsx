import { PreviewPage } from "@/components/preview/PreviewPage";
import "@/components/preview/proposta/proposta.css";
import "@/components/preview/proposta/refinada.css";
// Experimento brand-canonical-v1: identidade canônica (Fases 1/2A) sobre a refinada.
import "@/components/preview/proposta/marca-canonica.css";
import { ICONES_MARCA, VIEWPORT_MARCA } from "@/lib/marca-canonica";

export const metadata = { icons: ICONES_MARCA };
export const viewport = VIEWPORT_MARCA;

export default function Home() {
  return <PreviewPage proposta="refinada" />;
}
