import { JOURNEY_STEPS_REFINADA } from "@/lib/journey-content";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { HomeOpening } from "@/components/preview/HomeOpening";
import { Passage } from "@/components/Passage";
import { Platform } from "@/components/Platform";
import { Explainability } from "@/components/Explainability";
import { Science } from "@/components/Science";
import { Contact } from "@/components/Contact";
import { SiteFooter } from "@/components/SiteFooter";
import { PlatformRefinada } from "@/components/refinada/PlatformRefinada";
import { ExplainabilityRefinada } from "@/components/refinada/ExplainabilityRefinada";
import { ScienceRefinada } from "@/components/refinada/ScienceRefinada";
import { FooterRefinada } from "@/components/refinada/FooterRefinada";
import { TimeRefinada } from "@/components/refinada/TimeRefinada";
import { FaqRefinada } from "@/components/refinada/FaqRefinada";
import { TextReveal } from "@/components/motion/TextReveal";
import { readPreviewConfig, readPreviewJourney, readPreviewMri } from "@/lib/home-preview.server";
import { PREVIEW_PACKAGE, REFINADA_PACKAGE } from "@/lib/home-preview";

const FONTS = "/previa/tipografia/fontes/";
type Proposta = "a" | "b" | "refinada";

const FONT_FILES: Record<Proposta, string[]> = {
  a: [
    `${FONTS}space-grotesk/space-grotesk-latin-500-normal.woff2`,
    `${FONTS}space-grotesk/space-grotesk-latin-600-normal.woff2`,
    `${FONTS}source-sans-3/source-sans-3-latin-400-normal.woff2`,
    `${FONTS}source-sans-3/source-sans-3-latin-600-normal.woff2`,
  ],
  b: [
    `${FONTS}sora/sora-latin-600-normal.woff2`,
    `${FONTS}ibm-plex-sans/ibm-plex-sans-latin-400-normal.woff2`,
    `${FONTS}ibm-plex-sans/ibm-plex-sans-latin-500-normal.woff2`,
  ],
  // Versão conjunta: tipografia A. Preload só dos arquivos da 1ª tela (títulos 500/600 e corpo
  // 400); o corpo 600 (poucos trechos, abaixo da dobra) chega sob demanda. Com font-display: swap
  // e reserva métrica (refinada.css), o preload só antecipa — o texto nunca espera por ele.
  // Experimento brand-canonical-v1: a refinada ("/", "/pt", /previa/refinada) usa a tipografia
  // canônica da Fase 2A — Lora (títulos institucionais, 600) e Inter (400/500/600). Binários
  // variáveis oficiais, sem conversão nem subconjunto (Lora tem Reserved Font Name na OFL);
  // ver components/preview/proposta/marca-canonica.css.
  refinada: [
    "/marca/fase2a-v1.1.1/fontes/Lora%5Bwght%5D.ttf",
    "/marca/fase2a-v1.1.1/fontes/Inter%5Bopsz%2Cwght%5D.ttf",
  ],
};

/** Linha de estado do hero na versão conjunta: só o estado científico (sem "Escultura conceitual,
 *  não anatomia"); o hero representa a marca. Avisos da demonstração seguem nas seções. */
const NOTE_REFINADA = "Plataforma em validação científica";

/** Experimento brand-canonical-v1: cobertura do quadro da jornada = superfície do tema escuro canônico
 *  (viewer-dark surface.base #10282E), o fundo da seção sob o quadro. Parâmetro já previsto na API do
 *  módulo da escultura (coverColor); o pacote do Motion não muda. */
const COR_COBERTURA_MARCA = "#10282e";

/**
 * Página da prévia (/previa, as propostas /previa/a, /previa/b e a versão conjunta
 * /previa/refinada = tipografia A + barra + entrada de 1000 ms + montanha B 0.4.0-draft do Motion). Mesmos textos e mesma cena;
 * as propostas só acrescentam: tipografia (wrapper data-tipografia), barra de rolagem da marca
 * e a entrada na jornada com rolagem explícita de 1000 ms (navMode "eased").
 */
export function PreviewPage({ proposta }: { proposta?: Proposta }) {
  const refinada = proposta === "refinada";
  // Pacote do Motion: refinada = montanha B 0.4.0-draft; base e propostas A/B = 0.2.1-draft.
  const pkg = refinada ? REFINADA_PACKAGE : PREVIEW_PACKAGE;
  const config = readPreviewConfig(pkg);
  const motionPackage = readPreviewJourney(pkg);
  const mri = readPreviewMri(pkg);
  const fonts = proposta ? FONT_FILES[proposta] : [];
  const content: ReactNode = (
    <>
      {/* Fontes da proposta descobertas cedo. A/B: font-display block + preload (como entregues);
          refinada: swap + reserva com métricas ajustadas (texto legível com rede lenta ou 404). */}
      {fonts.map((f) => (
        <link key={f} rel="preload" as="font" type={f.endsWith(".ttf") ? "font/ttf" : "font/woff2"} href={f} crossOrigin="" />
      ))}
      {/* O módulo da escultura é descoberto cedo (draft, fora de public/motion). */}
      {config && <link rel="modulepreload" href={config.sculptureModule} />}
      {refinada ? <SiteHeader marcaCanonica menuFocus solid languageSwitch /> : <SiteHeader />}
      <main id="conteudo" tabIndex={-1}>
        <HomeOpening
          motionPackage={motionPackage}
          mri={mri}
          config={config}
          navMode={proposta ? "eased" : "native"}
          {...(refinada ? { coverColor: COR_COBERTURA_MARCA, note: NOTE_REFINADA, scrollInvite: true, journeyCompact: true, journeySafeIntro: true, revealOnChange: true, journeySteps: JOURNEY_STEPS_REFINADA,
            journeyIntro: "Um percurso conceitual para explorar região, dados e explicação — não um pipeline automático validado. Role a página ou escolha uma etapa." } : {})}
        />
        <Passage refinada={refinada} />
        {refinada ? <PlatformRefinada /> : <Platform />}
        {refinada ? <ExplainabilityRefinada mri={mri} /> : <Explainability mri={mri} />}
        {refinada ? <ScienceRefinada /> : <Science />}
        {refinada && <TimeRefinada />}
        {refinada && <FaqRefinada />}
        <Contact arrowIcon={refinada} refinada={refinada} marcaCanonica={refinada} />
      </main>
      {refinada ? <FooterRefinada /> : <SiteFooter />}
      <TextReveal />
    </>
  );
  if (!proposta) return content;
  // display: contents — o wrapper não cria caixa (layout idêntico ao da /previa).
  return (
    <div data-tipografia={proposta} data-proposta="" data-marca={refinada ? "canonica" : undefined} style={{ display: "contents" }}>
      {content}
    </div>
  );
}
