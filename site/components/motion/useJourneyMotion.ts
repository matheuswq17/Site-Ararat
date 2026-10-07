"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  JOURNEY_LAYOUT_EVENT,
  MOTION_BASE_URL,
  parseJourneyLayout,
  type CreateJourneyScene,
  type JourneyLayout,
  type JourneySceneController,
  type MotionPackageInfo,
} from "@/lib/motion-contract";

export type MotionStatus = "fallback" | "loading" | "ready" | "failed";

type Options = {
  pkg: MotionPackageInfo | null;
  /** Só inicia o carregamento quando a seção estiver próxima da viewport. */
  enabled: boolean;
  progress: number;
  reducedMotion: boolean;
  paused: boolean;
};

function loadStylesheet(href: string): Promise<HTMLLinkElement> {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.araratMotion = "journey";
    link.onload = () => resolve(link);
    link.onerror = () => {
      link.remove();
      reject(new Error(`Falha ao carregar ${href}`));
    };
    document.head.appendChild(link);
  });
}

/**
 * Bridge do contrato v1. Carrega o módulo de motion de forma tardia e
 * client-side, apenas se o pacote "ready" foi sincronizado em public/motion.
 * Qualquer falha mantém a cena estática do site (status "failed").
 */
export function useJourneyMotion(
  containerRef: RefObject<HTMLElement | null>,
  { pkg, enabled, progress, reducedMotion, paused }: Options,
): { status: MotionStatus; layout: JourneyLayout | null } {
  const [status, setStatus] = useState<MotionStatus>(pkg ? "loading" : "fallback");
  // Rótulos (adendo v1.1): null = módulo não emite o evento → legenda estática.
  const [layout, setLayout] = useState<JourneyLayout | null>(null);
  const layoutKey = useRef("");
  const controllerRef = useRef<JourneySceneController | null>(null);

  // Valores mais recentes, lidos no momento da criação da cena.
  const latest = useRef({ progress, reducedMotion, paused });
  latest.current = { progress, reducedMotion, paused };

  useEffect(() => {
    if (!pkg || !enabled) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let link: HTMLLinkElement | null = null;
    let observer: MutationObserver | null = null;

    // Listener registrado ANTES de createJourneyScene, no próprio container
    // (o evento não borbulha nem é despachado em window/document).
    const onLayout = (ev: Event) => {
      if (cancelled) return;
      const next = parseJourneyLayout((ev as CustomEvent).detail);
      if (!next) return;
      const key = JSON.stringify(next);
      if (key === layoutKey.current) return; // sem re-render quando nada mudou
      layoutKey.current = key;
      setLayout(next);
    };
    container.addEventListener(JOURNEY_LAYOUT_EVENT, onLayout);

    (async () => {
      try {
        const base = pkg.baseUrl ?? MOTION_BASE_URL;
        link = await loadStylesheet(base + pkg.stylesheet);
        const url = base + pkg.entry;
        const mod: { createJourneyScene?: CreateJourneyScene } = await import(
          /* webpackIgnore: true */ /* turbopackIgnore: true */ url
        );
        if (cancelled) return;
        if (typeof mod.createJourneyScene !== "function") {
          throw new Error("createJourneyScene ausente no módulo de motion");
        }
        const { progress: p, reducedMotion: rm, paused: ps } = latest.current;
        const controller = mod.createJourneyScene(container, {
          baseUrl: base,
          reducedMotion: rm,
          paused: ps,
        });
        controller.setProgress(p);
        controllerRef.current = controller;
        // Convenção opcional (pacote 0.2.0): o nó raiz expõe data-loaded="false|true|error".
        // Enquanto a mídia do módulo carrega, a cena estática do site continua visível;
        // em erro, o módulo é desmontado e o fallback permanece. Sem o atributo: pronto.
        const node = container.querySelector<HTMLElement>("[data-loaded]");
        const apply = () => {
          if (cancelled) return;
          const state = node?.dataset.loaded;
          if (!node || state === "true") {
            setStatus("ready");
            observer?.disconnect();
          } else if (state === "error") {
            observer?.disconnect();
            console.warn("[ARARAT] Mídia da cena de motion indisponível; usando cena estática.");
            try {
              controllerRef.current?.destroy();
            } catch {}
            controllerRef.current = null;
            link?.remove();
            link = null;
            setLayout(null);
            setStatus("failed");
          }
        };
        observer = node ? new MutationObserver(apply) : null;
        observer?.observe(node!, { attributes: true, attributeFilter: ["data-loaded"] });
        apply();
      } catch (error) {
        if (cancelled) return;
        console.warn("[ARARAT] Cena de motion indisponível; usando cena estática.", error);
        link?.remove();
        link = null;
        setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
      container.removeEventListener(JOURNEY_LAYOUT_EVENT, onLayout);
      layoutKey.current = "";
      setLayout(null);
      observer?.disconnect();
      try {
        controllerRef.current?.destroy();
      } catch (error) {
        console.warn("[ARARAT] Erro ao desmontar a cena de motion.", error);
      }
      controllerRef.current = null;
      link?.remove();
    };
  }, [pkg, enabled, containerRef]);

  useEffect(() => {
    controllerRef.current?.setProgress(progress);
  }, [progress, status]);

  useEffect(() => {
    controllerRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion, status]);

  useEffect(() => {
    controllerRef.current?.setPaused(paused);
  }, [paused, status]);

  return { status, layout: status === "ready" ? layout : null };
}
