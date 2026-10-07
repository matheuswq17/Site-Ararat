"use client";

import { useEffect, useRef } from "react";
import { useMotionPaused } from "@/lib/motion-prefs";
import { usePrefersReducedMotion } from "../motion/usePrefersReducedMotion";
import styles from "./BrandWordCycle.module.css";

/**
 * Segunda palavra da marca com troca por "embaralhamento" curto (efeito do tipo scramble, como
 * em spell.sh/docs/special-text — implementação própria, sem código nem dependência externa).
 *
 *  · HTML/sem JS/movimento reduzido: a primeira palavra (MODEL), estática.
 *  · Largura reservada para a palavra mais longa desde o servidor: as palavras ficam empilhadas
 *    na mesma célula de grid (as de reserva invisíveis) — nada ao redor se desloca na troca.
 *  · Ciclo: ~5 s parada → troca de ~580 ms (resolução da esquerda para a direita; poucos
 *    caracteres transitórios ao mesmo tempo, sem cursor nem flash) → ~5 s parada…
 *  · Pausa geral: assenta a palavra atual e para o ciclo. Aba oculta: para tudo. Ao retomar,
 *    recomeça a contagem (nenhuma troca atrasada acumulada). Desmontagem limpa timers e rAF.
 *  · Acessibilidade: o texto visual é aria-hidden (o link da marca mantém o nome estável
 *    "ARARAT MODEL — início"); nenhum aria-live.
 */
const HOLD_MS = 5000;
const SWAP_MS = 580;
const TICK_MS = 55; // troca dos caracteres transitórios (não a cada quadro: menos ruído)
const WINDOW = 3; // no máximo 3 posições transitórias ao mesmo tempo
// Sem A/O: evita palavras reais transitórias ("PROSTATA", "MODELO").
const GLYPHS = "BCDEHKMNRSTUVXZ";

export function BrandWordCycle({ words, className }: { words: readonly string[]; className?: string }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const paused = useMotionPaused();
  const reduced = usePrefersReducedMotion();
  const still = paused || reduced || words.length < 2;

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Um único nó de texto, alterado por .data (characterData): sem trocar nós a cada quadro e só
    // quando a string muda — menos invalidação de estilo/layout na página.
    if (!(el.firstChild instanceof Text) || el.childNodes.length !== 1) el.textContent = el.textContent ?? "";
    const node = el.firstChild as Text;
    const write = (v: string) => {
      if (node.data !== v) node.data = v;
    };
    let index = Math.max(0, words.indexOf(node.data));
    if (reduced) index = 0; // movimento reduzido: sempre a primeira palavra
    write(words[index]);
    el.dataset.word = words[index];
    if (still) return;

    let hold = 0;
    let raf = 0;
    const clear = () => {
      window.clearTimeout(hold);
      cancelAnimationFrame(raf);
      hold = 0;
      raf = 0;
    };
    const settle = () => {
      clear();
      write(words[index]);
      el.dataset.word = words[index];
      delete el.dataset.swapping;
    };
    const swap = () => {
      const from = words[index];
      const nextIndex = (index + 1) % words.length;
      const to = words[nextIndex];
      const n = Math.max(from.length, to.length);
      const t0 = performance.now();
      let lastTick = -1;
      let noise: string[] = [];
      el.dataset.swapping = "";
      const frame = (now: number) => {
        const t = Math.min(1, (now - t0) / SWAP_MS);
        const tick = Math.floor((now - t0) / TICK_MS);
        if (tick !== lastTick) {
          lastTick = tick;
          // Transitório nunca igual à letra de origem nem à de destino naquela posição (evita
          // "falsa chegada" e palavras reais acidentais no meio da troca).
          noise = Array.from({ length: n }, (_, i) => {
            const pool = GLYPHS.replace(to[i] ?? "", "").replace(from[i] ?? "", "");
            return pool[(Math.random() * pool.length) | 0];
          });
        }
        // Frente de resolução: posição i fica pronta em ~(i+1)/n do tempo; as WINDOW posições
        // logo à frente da frente mostram um caractere transitório; o resto ainda é a palavra de origem.
        const front = t * (n + WINDOW);
        let s = "";
        for (let i = 0; i < n; i++) {
          if (i < front - WINDOW) s += to[i] ?? "";
          else if (i < front) s += i < to.length || i < from.length ? noise[i] : "";
          else s += from[i] ?? "";
        }
        write(s);
        if (t < 1) raf = requestAnimationFrame(frame);
        else {
          index = nextIndex;
          settle();
          hold = window.setTimeout(swap, HOLD_MS);
        }
      };
      raf = requestAnimationFrame(frame);
    };
    const start = (first: boolean) => {
      clear();
      // 1ª vez: depois da abertura do hero assentar (o estilo de abertura some em ≤ 1,4 s).
      const intro = first && document.getElementById("ararat-intro") ? 1400 : 0;
      hold = window.setTimeout(swap, HOLD_MS + intro);
    };
    const onVisibility = () => {
      if (document.hidden) settle();
      else start(false);
    };
    start(true);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      settle();
    };
  }, [still, reduced, words]);

  return (
    <span className={`${styles.cycle} ${className ?? ""}`} aria-hidden="true">
      {/* Reserva de largura: todas as palavras na mesma célula, invisíveis. */}
      {words.map((w) => (
        <span key={w} className={styles.reserve}>
          {w}
        </span>
      ))}
      <span ref={textRef} className={styles.text} data-word={words[0]}>
        {words[0]}
      </span>
    </span>
  );
}
