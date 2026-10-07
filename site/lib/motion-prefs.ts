"use client";

import { useSyncExternalStore } from "react";

/**
 * Pausa global de animações (hero, textos em andamento, ambiente da jornada e
 * atmosfera). Guardada por aba em sessionStorage (protegido) e refletida em
 * <html data-motion="paused">, que o CSS usa para levar tudo ao estado final.
 * O script de abertura (app/intro-script.ts) lê a mesma chave antes da 1ª pintura
 * (pausa salva = abertura não toca); o atributo em <html> é aplicado após a hidratação.
 */
export const PAUSE_KEY = "ararat:paused";

const listeners = new Set<() => void>();
let paused: boolean | null = null;

function read(): boolean {
  if (paused !== null) return paused;
  if (typeof window === "undefined") return false;
  try {
    paused = window.sessionStorage.getItem(PAUSE_KEY) === "1";
  } catch {
    paused = false;
  }
  return paused;
}

/** Aplica o estado em <html> (após a hidratação; nunca no markup do servidor). */
export function applyMotionAttribute() {
  if (read()) document.documentElement.setAttribute("data-motion", "paused");
  else document.documentElement.removeAttribute("data-motion");
}

export function setMotionPaused(next: boolean) {
  paused = next;
  try {
    if (next) sessionStorage.setItem(PAUSE_KEY, "1");
    else sessionStorage.removeItem(PAUSE_KEY);
  } catch {
    /* armazenamento indisponível: vale só nesta página */
  }
  applyMotionAttribute();
  // Abertura em andamento conclui imediatamente.
  if (next) document.getElementById("ararat-intro")?.remove();
  listeners.forEach((l) => l());
}

export function useMotionPaused(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => false,
  );
}
