"use client";

import { useEffect, useRef, useState } from "react";
import {
  MOTION_BASE_URL,
  type CreateHeroAtmosphere,
  type HeroAtmosphereController,
  type HeroAtmosphereInfo,
} from "@/lib/motion-contract";
import { useMotionPaused } from "@/lib/motion-prefs";
import { useMediaQuery, usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** A atmosfera só compõe o hero amplo; abaixo disso não é baixada nem montada. */
const DESKTOP_HERO = "(min-width: 1081px)";

type Status = "idle" | "loading" | "ready" | "failed";

/**
 * Atmosfera opcional do hero (bloco "hero" do manifest, adendo v1.1).
 * Independente da jornada: carrega depois do conteúdo essencial (após o load
 * da página, em tempo ocioso), nunca atrasa o LCP nem antecipa a jornada.
 * Pausa com a pausa global, fora da tela ou com a aba oculta. Qualquer falha
 * mantém o fundo estático (CSS) e o conteúdo do hero.
 */
export function HeroAtmosphere({ info, className }: { info: HeroAtmosphereInfo; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const controller = useRef<HeroAtmosphereController | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [onScreen, setOnScreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const userPaused = useMotionPaused();
  const reduced = usePrefersReducedMotion();
  const wide = useMediaQuery(DESKTOP_HERO, false);
  // Trava: monta na primeira vez que o hero fica amplo; voltar a estreito não desmonta
  // (a camada fica oculta e pausada por estar fora da tela).
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (wide) setArmed(true);
  }, [wide]);
  const paused = userPaused || !onScreen || tabHidden;
  const latest = useRef({ paused, reduced });
  latest.current = { paused, reduced };

  useEffect(() => {
    // Observa a própria camada: oculta (≤1080 px) ou fora da tela = pausada.
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => setOnScreen(e.some((x) => x.isIntersecting)));
    io.observe(el);
    const onVis = () => setTabHidden(document.visibilityState === "hidden");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    const container = ref.current;
    // Tablet/celular: nada é importado até o hero ficar amplo.
    if (!container || !armed) return;
    let cancelled = false;
    let link: HTMLLinkElement | null = null;
    let idle = 0;

    const start = async () => {
      if (cancelled) return;
      setStatus("loading");
      try {
        link = await new Promise<HTMLLinkElement>((resolve, reject) => {
          const l = document.createElement("link");
          l.rel = "stylesheet";
          l.href = MOTION_BASE_URL + info.stylesheet;
          l.dataset.araratMotion = "hero";
          l.onload = () => resolve(l);
          l.onerror = () => {
            l.remove();
            reject(new Error("stylesheet"));
          };
          document.head.appendChild(l);
        });
        const url = MOTION_BASE_URL + info.entry;
        const mod: { createHeroAtmosphere?: CreateHeroAtmosphere } = await import(
          /* webpackIgnore: true */ /* turbopackIgnore: true */ url
        );
        if (cancelled) return;
        if (typeof mod.createHeroAtmosphere !== "function") throw new Error("createHeroAtmosphere ausente");
        controller.current = mod.createHeroAtmosphere(container, {
          baseUrl: MOTION_BASE_URL,
          paused: latest.current.paused,
          reducedMotion: latest.current.reduced,
        });
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        console.warn("[ARARAT] Atmosfera do hero indisponível; fundo estático mantido.", error);
        link?.remove();
        link = null;
        setStatus("failed");
      }
    };

    const schedule = () => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
        .requestIdleCallback;
      idle = ric ? ric(() => void start(), { timeout: 1500 }) : window.setTimeout(() => void start(), 300);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (cic) cic(idle);
      window.clearTimeout(idle);
      try {
        controller.current?.destroy();
      } catch {}
      controller.current = null;
      link?.remove();
    };
  }, [info, armed]);

  useEffect(() => {
    controller.current?.setPaused(paused);
  }, [paused, status]);

  useEffect(() => {
    controller.current?.setReducedMotion(reduced);
  }, [reduced, status]);

  return (
    <div
      ref={ref}
      className={className}
      aria-hidden="true"
      data-hero-atmosphere={status}
      data-paused={paused || undefined}
      // Poster só no desktop (o elemento fica display:none abaixo de 1081 px; sem fundo = sem download).
      style={armed ? { backgroundImage: `url(${MOTION_BASE_URL}${info.poster})` } : undefined}
    />
  );
}
