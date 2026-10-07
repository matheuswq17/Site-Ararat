import type { Metadata } from "next";
import { PreviewPage } from "@/components/preview/PreviewPage";

export const metadata: Metadata = {
  title: "Prévia — nova home | ARARAT MODEL",
  robots: { index: false, follow: false },
};

/**
 * ROTA EXPERIMENTAL PARA REVISÃO — nova home com a escultura do Motion (home-v2 0.2.1-draft) e
 * passagem até a mesma cena da jornada (0.4.1-exp, só aqui). A home aprovada continua em "/"
 * (app/page.tsx, jornada 0.4.0 ready de public/motion).
 * Reverter: remover app/previa/, components/preview/, lib/home-preview*.ts, public/previa/,
 * a variante "opening" de Journey (props opcionais), MotionPackageInfo.baseUrl (opcional) e
 * OPENING_CSS em app/intro-script.ts.
 */
export default function HomePreview() {
  // Base de comparação: pacote 0.2.1-draft, Montserrat/Open Sans, barra nativa, âncora com smooth nativo.
  return <PreviewPage />;
}
