"use client";

import { useEffect } from "react";
import { applyMotionAttribute, useMotionPaused } from "@/lib/motion-prefs";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Revelação editorial de títulos, parágrafos selecionados e listas marcados com
 * data-reveal="title|text|soft|list". Só esconde (estado "pending") blocos que
 * ainda estão ABAIXO da viewport no momento da montagem — nada que já foi visto
 * desaparece. Cada bloco anima uma vez ao entrar na área útil. Sem JS, com
 * movimento reduzido ou pausa global, tudo fica no estado final.
 * Foco por teclado dentro de um bloco pendente o mostra imediatamente.
 */
export function TextReveal() {
  const paused = useMotionPaused();
  const reduced = usePrefersReducedMotion();

  // Estado de pausa salvo na aba → <html data-motion="paused"> após hidratar.
  useEffect(() => {
    applyMotionAttribute();
  }, []);

  useEffect(() => {
    const all = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const showAll = () => {
      for (const el of all) if (el.dataset.revealState === "pending") el.dataset.revealState = "shown";
    };
    if (paused || reduced || typeof IntersectionObserver === "undefined") {
      showAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          if (el.dataset.reveal === "list") {
            Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(i)));
          }
          el.dataset.revealState = "in";
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );

    const vh = window.innerHeight;
    for (const el of all) {
      if (el.dataset.revealState) continue; // já processado nesta página
      if (el.getBoundingClientRect().top > vh * 0.9) {
        el.dataset.revealState = "pending";
        io.observe(el);
      } else {
        el.dataset.revealState = "shown";
      }
    }

    const onFocus = (ev: FocusEvent) => {
      const el = (ev.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-reveal-state="pending"]');
      if (el) {
        el.dataset.revealState = "shown";
        io.unobserve(el);
      }
    };
    document.addEventListener("focusin", onFocus);
    return () => {
      io.disconnect();
      document.removeEventListener("focusin", onFocus);
      showAll();
    };
  }, [paused, reduced]);

  return null;
}
