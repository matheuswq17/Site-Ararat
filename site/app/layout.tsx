import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
// Fontes self-hosted a partir de pacotes @fontsource (licença OFL), sem requisição externa.
import "@fontsource-variable/montserrat";
import "@fontsource-variable/open-sans";
import "./globals.css";
import { INTRO_SCRIPT } from "./intro-script";

export const metadata: Metadata = {
  title: "ARARAT MODEL | IA Médica e Radiômica para RM de Próstata",
  description:
    "Plataforma de IA médica e radiômica para análise de ressonância magnética de próstata, com Hub, Viewer, segmentação, inferência de risco e explicabilidade para apoiar equipes clínicas e de pesquisa.",
  openGraph: {
    title: "ARARAT MODEL — Radiômica explicável para RM de próstata",
    description:
      "Transforme exames de próstata em segmentações, dados radiômicos e insights explicáveis para apoiar a revisão clínica e a pesquisa.",
    locale: "pt_BR",
    type: "website",
  },
  // Primeira entrega local: não indexar até a revisão de publicação.
  robots: { index: false, follow: false },
  icons: { icon: "/brand/ararat_icone_transparente.png" },
};

export const viewport: Viewport = {
  themeColor: "#0D1B2A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Decide a abertura antes da 1ª pintura (sem alterar o markup do React). */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
