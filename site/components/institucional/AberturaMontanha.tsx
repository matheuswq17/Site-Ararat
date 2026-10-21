"use client";

import { useEffect, useRef } from "react";
import { useMotionPaused } from "@/lib/motion-prefs";
import s from "./Institucional.module.css";

type Fonte = { media: string; srcSet: string };
type Escultura = {
  setLayout(l: Record<string, unknown>): void;
  setPaused(v: boolean): void;
  setReducedMotion(v: boolean): void;
  destroy(): void;
};
type Modulo = { createMountainSculpture?: (host: HTMLElement, o: Record<string, unknown>) => Escultura; createHomeSculpture?: (host: HTMLElement, o: Record<string, unknown>) => Escultura; alturaUtilEfetiva?: (px: number) => number | null };

const INTRO_KEY = "ararat:montanha-institucional";

/**
 * Slot da montanha na abertura institucional (contrato do Motion, montanha 1.2.1-03d2, §3): host = o próprio slot,
 * em fluxo normal; sem passagem; luz ambiente; revelação de 900 ms uma vez por aba; pausa e movimento reduzido =
 * desenho estático; falha = o poster fica. O poster (<picture>) vem no HTML e é a apresentação sem JavaScript.
 *  composicao: "centro" em duas colunas (≥ 1200), "topo" no resto; no celular (< 600), alturaUtil = parte visível
 *  do slot na 1ª tela quando ela fica entre 50 % e 75 % da altura do slot (regra da ponte do Site).
 */
export function AberturaMontanha({ modulo, fontes, padrao, cobertura = "#111111" }: { modulo: string; fontes: Fonte[]; padrao: { src: string; w: number; h: number }; cobertura?: string }) {
  const slot = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const esc = useRef<Escultura | null>(null);
  const pausado = useMotionPaused();
  const pausadoRef = useRef(pausado);
  pausadoRef.current = pausado;

  useEffect(() => {
    const el = slot.current, h = host.current;
    if (!el || !h) return;
    let vivo = true;
    let ro: ResizeObserver | null = null;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
    let util: ((px: number) => number | null) | undefined;
    const layout = () => {
      const r = el.getBoundingClientRect();
      const art = { x: 0, y: 0, w: el.clientWidth, h: el.clientHeight };
      const largo = window.innerWidth >= 1200;
      let alturaUtil: number | undefined;
      if (window.innerWidth < 600) {
        // topo do slot no documento: independe da rolagem
        const topo = r.top + window.scrollY;
        const visivel = window.innerHeight - topo;
        if (visivel >= 0.5 * art.h && visivel < 0.75 * art.h) alturaUtil = util ? util(visivel) ?? undefined : Math.floor(visivel / 10) * 10;
      }
      el.dataset.alturaUtil = alturaUtil ? String(alturaUtil) : "";
      return { art, composicao: largo ? { alinhar: "centro" } : alturaUtil ? { alinhar: "topo", alturaUtil } : { alinhar: "topo" } };
    };
    (async () => {
      try {
        const M = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ modulo)) as Modulo;
        if (!vivo) return;
        const criar = M.createMountainSculpture ?? M.createHomeSculpture;
        if (typeof criar !== "function") throw new Error("createMountainSculpture ausente");
        util = M.alturaUtilEfetiva;
        let intro = true;
        try {
          intro = sessionStorage.getItem(INTRO_KEY) !== "1";
          sessionStorage.setItem(INTRO_KEY, "1");
        } catch { /* sem armazenamento: toca a revelação */ }
        const l = layout();
        esc.current = criar(h, { ...l, target: null, ready: false, ambient: true, intro, coverColor: cobertura, paused: pausadoRef.current, reducedMotion: reduzido.matches });
        el.dataset.montanha = "canvas";
        ro = new ResizeObserver(() => esc.current?.setLayout(layout()));
        ro.observe(el);
        reduzido.addEventListener?.("change", (e) => esc.current?.setReducedMotion(e.matches));
      } catch {
        el.dataset.montanha = "poster"; // falha do módulo: o poster continua
      }
    })();
    return () => {
      vivo = false;
      ro?.disconnect();
      esc.current?.destroy();
      esc.current = null;
    };
  }, [modulo, cobertura]);

  useEffect(() => { esc.current?.setPaused(pausado); }, [pausado]);

  return (
    <div className={s.slot} ref={slot} data-montanha="poster" data-slot-arte="">
      <picture>
        {fontes.map((f) => <source key={f.media} media={f.media} srcSet={f.srcSet} />)}
        {/* eslint-disable-next-line @next/next/no-img-element -- poster oficial do pacote, escolhido por <picture> */}
        <img className={s.poster} src={padrao.src} width={padrao.w} height={padrao.h} alt="" fetchPriority="high" decoding="async" data-poster-montanha="" />
      </picture>
      <div className={s.host} ref={host} aria-hidden="true" />
    </div>
  );
}
