"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { PRODUCT_ROUTE, type ProductDemo as Demo } from "@/lib/product-media";
import { useMotionPaused } from "@/lib/motion-prefs";
import { useMediaQuery, usePrefersReducedMotion } from "./motion/usePrefersReducedMotion";
import styles from "./ProductDemo.module.css";

const WIDE = "(min-width: 960px)";
/** Silêncio de rolagem que encerra a trava após um clique. */
const SETTLE_MS = 160;
/** Teto da trava, caso a rolagem nunca aconteça ou nunca pare. */
const LOCK_MAX_MS = 1400;

/**
 * Percurso real do produto a partir de capturas autorizadas (lib/product-media.ts).
 * Só é montado quando há material; sem material a Plataforma mantém o fallback honesto.
 *
 * Desktop (≥ 960 px): quadro fixo (sticky) dentro do próprio capítulo + comentários das
 * etapas; a etapa ativa acompanha a ROLAGEM normal (comentário que cruza o centro da tela).
 * Regra de coexistência clique × rolagem: um clique seleciona a etapa na hora e leva o
 * comentário até o centro; enquanto essa rolagem acontece, a observação por rolagem fica
 * suspensa (trava), e só volta quando a rolagem para por 160 ms (ou após 1,4 s). Assim a
 * seleção clicada não se desfaz no caminho; depois, rolar volta a mandar.
 *
 * Móvel: quadro → botões → resumo da etapa ativa. Leitura normal, sem sticky, sem
 * rolagem capturada. Troca de captura com fade curto; em pausa/movimento reduzido, troca direta.
 * Captura estática nunca finge clique ou movimento: o contorno só marca a área comentada.
 */
export function ProductDemo({ demo }: { demo: Demo }) {
  const steps = demo.steps;
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<string, true>>({});
  const wide = useMediaQuery(WIDE, false);
  const paused = useMotionPaused();
  const reduced = usePrefersReducedMotion();
  const still = paused || reduced;
  const comments = useRef<Array<HTMLLIElement | null>>([]);
  const lock = useRef<{ settle: number; max: number; on: boolean }>({ settle: 0, max: 0, on: false });
  const video = useRef<HTMLVideoElement>(null);

  const step = steps[active];
  const media = demo.media.find((m) => m.id === step?.mediaId);
  const eventOf = (id: string) => PRODUCT_ROUTE.find((e) => e.id === id);

  const release = useCallback(() => {
    const l = lock.current;
    window.clearTimeout(l.settle);
    window.clearTimeout(l.max);
    l.on = false;
  }, []);

  // Seleção pela rolagem (só desktop).
  useEffect(() => {
    if (!wide) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (lock.current.on) return;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.index);
          if (Number.isFinite(i)) setActive(i);
        }
      },
      { rootMargin: "-48% 0px -48% 0px", threshold: 0 },
    );
    comments.current.forEach((el) => el && io.observe(el));
    const onScroll = () => {
      const l = lock.current;
      if (!l.on) return;
      window.clearTimeout(l.settle);
      l.settle = window.setTimeout(release, SETTLE_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      release();
    };
  }, [wide, steps.length, release]);

  const choose = (i: number) => {
    setActive(i);
    const el = comments.current[i];
    if (!wide || !el) return;
    const l = lock.current;
    release();
    l.on = true;
    l.settle = window.setTimeout(release, SETTLE_MS * 2); // se não houver rolagem
    l.max = window.setTimeout(release, LOCK_MAX_MS);
    el.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
  };

  // Vídeo opcional: mudo, só toca visível e sem pausa/movimento reduzido.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (still) {
      v.pause();
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) void v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [still]);

  if (!step || !media) return null;

  const focusStyle = step.focus
    ? ({
        left: `${step.focus.x}%`,
        top: `${step.focus.y}%`,
        width: `${step.focus.w}%`,
        height: `${step.focus.h}%`,
      } as CSSProperties)
    : undefined;

  return (
    <div className={styles.demo} data-still={still || undefined} data-wide={wide || undefined}>
      {demo.testLabel && (
        <p className={styles.testBadge} role="note">
          TESTE DE LAYOUT — {demo.testLabel}
        </p>
      )}
      <div className={styles.layout}>
        <div className={styles.stickyCol}>
          <figure className={styles.frame} style={{ aspectRatio: `${media.width} / ${media.height}` }}>
            {demo.media.map((m) => (
              <Image
                key={m.id}
                src={m.src}
                alt={m.id === media.id ? m.alt : ""}
                aria-hidden={m.id === media.id ? undefined : true}
                width={m.width}
                height={m.height}
                sizes="(min-width: 960px) 62vw, 100vw"
                unoptimized={m.src.startsWith("data:")}
                className={styles.shot}
                data-active={m.id === media.id || undefined}
                onError={() => setFailed((f) => ({ ...f, [m.id]: true }))}
              />
            ))}
            {focusStyle && !failed[media.id] && <span className={styles.focus} style={focusStyle} aria-hidden="true" />}
            {failed[media.id] && <span className={styles.failed}>Captura indisponível no momento.</span>}
          </figure>

          <div className={styles.controls} role="group" aria-label="Etapas do percurso no produto">
            {steps.map((s, i) => (
              <button
                key={s.event}
                type="button"
                className={styles.stepButton}
                aria-pressed={active === i}
                onClick={() => choose(i)}
              >
                <span className={styles.stepNum} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {eventOf(s.event)?.title}
              </button>
            ))}
          </div>

          {/* Móvel: resumo da etapa ativa logo abaixo dos controles (no desktop, os comentários ao lado). */}
          <div className={styles.summary}>
            <p className={styles.summaryTitle}>{eventOf(step.event)?.title}</p>
            <p className={styles.summaryText}>{step.caption}</p>
          </div>
        </div>

        <ol className={styles.comments} aria-label="Comentários das etapas">
          {steps.map((s, i) => (
            <li
              key={s.event}
              ref={(el) => {
                comments.current[i] = el;
              }}
              data-index={i}
              data-active={active === i || undefined}
              className={styles.comment}
            >
              <p className={styles.commentKicker}>
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span> {eventOf(s.event)?.title}
              </p>
              <p className={styles.commentLead}>{eventOf(s.event)?.summary}</p>
              <p className={styles.commentText}>{s.caption}</p>
            </li>
          ))}
        </ol>
      </div>

      <p className={`ill-note ${styles.credit}`}>
        {demo.testLabel
          ? "TESTE DE LAYOUT — nenhuma captura real do ARARAT nesta página."
          : `Capturas reais do ARARAT (versão ${demo.softwareVersion}). Casos anonimizados; valores na interface não constituem resultado clínico.`}
      </p>

      {demo.video && (
        <figure className={styles.videoFigure}>
          <video
            ref={video}
            className={styles.video}
            poster={demo.video.poster}
            width={demo.video.width}
            height={demo.video.height}
            muted
            loop
            playsInline
            controls
            preload="none"
            aria-describedby="product-video-desc"
          >
            {demo.video.sources.map((s) => (
              <source key={s.src} src={s.src} type={s.type} />
            ))}
          </video>
          <figcaption id="product-video-desc" className="ill-note">
            {demo.video.description} Gravação da interface (versão {demo.softwareVersion}); demonstra o fluxo de uso,
            não desempenho clínico.
          </figcaption>
        </figure>
      )}
    </div>
  );
}
