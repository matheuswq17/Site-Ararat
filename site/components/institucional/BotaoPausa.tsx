"use client";

import { useEffect, useState } from "react";
import { applyMotionAttribute, setMotionPaused, useMotionPaused } from "@/lib/motion-prefs";
import s from "./Institucional.module.css";

/** Pausa global das animações (mesma chave de sessão da refinada: ararat:paused). Sem JS não aparece. */
export function BotaoPausa({ rotuloPausar, rotuloRetomar }: { rotuloPausar: string; rotuloRetomar: string }) {
  const pausado = useMotionPaused();
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  useEffect(() => applyMotionAttribute(), [pausado]);
  // Sem JavaScript não há o que pausar: o lugar fica reservado (sem deslocar o cabeçalho) e o botão não aparece.
  if (!montado) return <span className={s.pausa} aria-hidden="true" style={{ visibility: "hidden" }} />;
  return (
    <button
      type="button"
      className={s.pausa}
      aria-pressed={pausado}
      aria-label={pausado ? rotuloRetomar : rotuloPausar}
      title={pausado ? rotuloRetomar : rotuloPausar}
      onClick={() => setMotionPaused(!pausado)}
      data-pausa=""
    >
      {pausado ? (
        <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor" /></svg>
      ) : (
        <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" fill="currentColor" /></svg>
      )}
    </button>
  );
}
