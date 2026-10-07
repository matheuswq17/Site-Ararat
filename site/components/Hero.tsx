import { preload } from "react-dom";
import { HeroMri } from "./HeroMri";
import type { MriSource } from "@/lib/mri";
import type { HeroAtmosphereInfo } from "@/lib/motion-contract";
import { HeroAtmosphere } from "./motion/HeroAtmosphere";
import { ArrowDown, ArrowRight } from "./icons";
import { JOURNEY_STEPS } from "@/lib/journey-content";
import { RevealWords } from "./text/RevealWords";
import styles from "./Hero.module.css";

export function Hero({ mri, atmosphere = null }: { mri: MriSource; atmosphere?: HeroAtmosphereInfo | null }) {
  // RM do hero (mesmo URL usado pelo <image> SVG): descoberta no <head>, prioridade alta.
  // Só esta imagem é priorizada; jornada, explicabilidade e atmosfera seguem tardias.
  preload(mri.src, { as: "image", fetchPriority: "high" });
  return (
    <section id="inicio" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.art}>
        {atmosphere && <HeroAtmosphere info={atmosphere} className={styles.atmosphere} />}
        <HeroMri source={mri} />
      </div>

      <div className={`wrap ${styles.content}`}>
        <p className={`eyebrow ${styles.introFade}`}>Radiômica explicável · RM de próstata</p>
        <h1 id="hero-title" className={styles.title}>
          <RevealWords text="Entre na imagem." className={`rw ${styles.introWord}`} />
        </h1>
        <p className={`${styles.subtitle} ${styles.introLine}`}>Descubra o caminho até a explicação.</p>
        <p className={`${styles.description} ${styles.introLine} ${styles.introLate}`}>
          O ARARAT MODEL é uma plataforma de IA e radiômica explicável para RM de próstata: organiza o
          exame, delimita regiões e mostra o que sustenta cada estimativa, para apoiar a revisão clínica.
        </p>

        <div className={styles.actions}>
          <a href="#jornada" className="btn btn-gold" data-arrow="down">
            Explorar a jornada
            <ArrowDown />
          </a>
          <a href="#plataforma" className="btn btn-ghost">
            Conhecer a plataforma
            <ArrowRight />
          </a>
        </div>

        <nav className={styles.steps} aria-label="Etapas da jornada">
          <ol>
            {JOURNEY_STEPS.map((step, i) => (
              <li key={step.id} data-first={i === 0 || undefined}>
                <a href={`#${step.id}`}>
                  <span className={styles.stepDot} aria-hidden="true" />
                  {step.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <p className={`ill-note ${styles.note}`}>Imagem demonstrativa de RM · marcações ilustrativas · plataforma em validação científica</p>
    </section>
  );
}
