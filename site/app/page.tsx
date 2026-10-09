import { PreviewPage } from "@/components/preview/PreviewPage";
import "@/components/preview/proposta/proposta.css";
import "@/components/preview/proposta/refinada.css";
// codex/brand-03d2-v1: identidade ARARAT 03D2 v1.0 sobre a refinada (tokens oficiais com escopo + camada).
// A camada do Sinal (marca-sinal.css) fica no repositório, sem uso nestas rotas.
import "@/components/preview/proposta/marca-03d2.tokens.css";
import "@/components/preview/proposta/marca-03d2.css";
import { ICONES_03D2, MANIFESTO_WEB_03D2, VIEWPORT_03D2 } from "@/lib/marca-03d2";

export const metadata = { icons: ICONES_03D2, manifest: MANIFESTO_WEB_03D2 };
export const viewport = VIEWPORT_03D2;

export default function Home() {
  return <PreviewPage proposta="refinada" />;
}
