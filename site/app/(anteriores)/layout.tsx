import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
// Fontes self-hosted a partir de pacotes @fontsource (licença OFL), sem requisição externa.
import "@fontsource-variable/montserrat";
import "@fontsource-variable/open-sans";
import "../globals.css";
import { INTRO_SCRIPT } from "../intro-script";
import { headers } from "next/headers";
import { LocaleProvider } from "@/lib/i18n";

const englishMetadata: Metadata = {
  title: "ARARAT MODEL | Explainable Radiomics for Prostate MRI",
  description:
    "Explore ARARAT's Hub and Viewer, explainable radiomics research and a specialist-led prostate MRI review workflow. Platform undergoing scientific validation.",
  openGraph: {
    title: "ARARAT MODEL — Explainable Radiomics for Prostate MRI",
    description:
      "Explore prostate MRI review tools and research, with human review and scientific limitations in view.",
    locale: "en_US",
    type: "website",
  },
  // Primeira entrega local: não indexar até a revisão de publicação.
  robots: { index: false, follow: false },
  icons: { icon: "/brand/ararat_icone_transparente.png" },
};

export async function generateMetadata(): Promise<Metadata> {
  if ((await headers()).get("x-ararat-locale") === "en") return englishMetadata;
  return {
    ...englishMetadata,
    title: "ARARAT MODEL | Radiômica explicável para RM de próstata",
    description: "Conheça o Hub e o Viewer do ARARAT, a pesquisa em radiômica explicável e o fluxo de revisão de RM de próstata. Plataforma em validação científica.",
    openGraph: {
      title: "ARARAT MODEL — Radiômica explicável para RM de próstata",
      description: "Ferramentas e pesquisa para a revisão de RM de próstata, com revisão humana e limites científicos à vista.",
      locale: "pt_BR",
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0D1B2A",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = (await headers()).get("x-ararat-locale") === "en" ? "en" : "pt";
  return (
    <html lang={locale === "en" ? "en" : "pt-BR"}>
      <head>
        {/* Decide a abertura antes da 1ª pintura (sem alterar o markup do React). */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#conteudo">
          {locale === "en" ? "Skip to content" : "Pular para o conteúdo"}
        </a>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
