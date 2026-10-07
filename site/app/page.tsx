import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/Hero";
import { Journey } from "@/components/journey/Journey";
import { Passage } from "@/components/Passage";
import { Platform } from "@/components/Platform";
import { Explainability } from "@/components/Explainability";
import { Science } from "@/components/Science";
import { Contact } from "@/components/Contact";
import { SiteFooter } from "@/components/SiteFooter";
import { readHeroAtmosphere, readMotionPackage, readMriSource } from "@/lib/motion-manifest.server";
import { TextReveal } from "@/components/motion/TextReveal";

export default function Home() {
  // Detectado no build: só há import do módulo se o pacote "ready" foi sincronizado.
  const motionPackage = readMotionPackage();
  // Uma fonte, uma geometria: a mesma RM (e o mapa do Motion, quando houver) em todas as cenas.
  const mri = readMriSource();

  return (
    <>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1}>
        <Hero mri={mri} atmosphere={readHeroAtmosphere()} />
        <Journey motionPackage={motionPackage} mri={mri} />
        <Passage />
        <Platform />
        <Explainability mri={mri} />
        <Science />
        <Contact />
      </main>
      <SiteFooter />
      <TextReveal />
    </>
  );
}
