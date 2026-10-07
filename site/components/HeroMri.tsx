"use client";

import type { CSSProperties } from "react";
import type { MriSource } from "@/lib/mri";
import { MriFigure } from "./art/MriFigure";
import styles from "./Hero.module.css";

/**
 * Arredondamento único para TODA coordenada derivada de trigonometria.
 * Math.cos/sin podem diferir no último dígito entre o Node (SSR) e o navegador
 * do visitante; serializar valores já arredondados garante markup idêntico na
 * hidratação (correção do aviso registrado na auditoria 03).
 */
const q = (v: number) => Math.round(v * 100) / 100;
const q4 = (v: number) => Math.round(v * 10000) / 10000;
const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
/** Raio do arco compacto no início da abertura, em px da base (referência Motion r05). */
const ARC_R0 = 44;
const pt = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: q(cx + r * Math.cos(a)), y: q(cy + r * Math.sin(a)) };
};

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = pt(cx, cy, r, a0);
  const p1 = pt(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${p0.x} ${p0.y}A${q(r)} ${q(r)} 0 ${large} 1 ${p1.x} ${p1.y}`;
}

/**
 * Cena do hero: a RM demonstrativa, com arco de foco e chamadas ancoradas no
 * mesmo sistema de coordenadas. preserveAspectRatio "slice" + quadro com a
 * proporção da imagem = imagem inteira no desktop/tablet; no celular o quadro
 * fica mais baixo (3:2) e corta só topo/base, mantendo a pelve e a região central.
 */
export function HeroMri({ source }: { source: MriSource }) {
  const { width: W, height: H } = source;
  const f = { x: q(source.focus.x), y: q(source.focus.y) };
  const r = q(W * 0.215);
  const a = { x: q(W * 0.95), y: q(H * 0.13) };
  const b = { x: q(W * 0.95), y: q(H * 0.8) };
  const elbow = q(W * 0.74);
  const pct = (v: number, t: number) => `${(Math.round((v / t) * 100000) / 1000).toFixed(3)}%`;
  const ea = pt(f.x, f.y, r, -48);
  const eb = pt(f.x, f.y, r, 40);
  // Abertura "o arco encontra a imagem": o MESMO arco permanente nasce compacto no
  // centro da área da RM e viaja/expande até o foco. Deslocamento inicial em
  // unidades da imagem (arredondado → markup idêntico no servidor e no cliente).
  // Raio cresce de forma geométrica (r0·(R/r0)^u) e o centro faz lerp, com u em
  // ease-in-out; 6 segmentos amostrados aqui (valores arredondados → SSR = cliente).
  const s0 = ARC_R0 / r;
  const arcStyle: Record<string, string> = {
    transformOrigin: `${f.x}px ${f.y}px`,
    "--arc-dx": `${q(W / 2 - f.x)}px`,
    "--arc-dy": `${q(H / 2 - f.y)}px`,
    "--arc-s0": `${q4(s0)}`,
  };
  for (let i = 1; i <= 5; i++) {
    const u = easeInOutCubic(i / 6);
    arcStyle[`--arc-k${i}`] = `${q4(1 - u)}`;
    arcStyle[`--arc-s${i}`] = `${q4(s0 ** (1 - u))}`;
  }

  return (
    <div className={styles.artInner} style={{ "--img-ar": `${W} / ${H}` } as CSSProperties}>
      <MriFigure
        id="hero-mri"
        source={source}
        fit="slice"
        edgeFade={0.13}
        statusLabel
        className={styles.mri}
        overlay={
          <g className={styles.marks}>
            <path d={arcPath(f.x, f.y, r, 196, 344)} pathLength={1} className={styles.arc} style={arcStyle as CSSProperties} />
            <path d={arcPath(f.x, f.y, r, 20, 160)} className={styles.arcFaint} />
            <path
              d={`M${f.x} ${q(f.y - r - 14)}V${q(f.y - r + 10)}M${q(f.x - r - 14)} ${f.y}H${q(f.x - r + 10)}M${q(f.x + r - 10)} ${f.y}H${q(f.x + r + 14)}`}
              className={styles.ticks}
            />
            <g className={styles.leaders}>
              <path d={`M${ea.x} ${ea.y}L${elbow} ${a.y}H${a.x}`} className={styles.leader} />
              <path d={`M${eb.x} ${eb.y}L${elbow} ${b.y}H${b.x}`} className={styles.leader} />
              <circle cx={a.x} cy={a.y} r={3.5} className={styles.dot} />
              <circle cx={b.x} cy={b.y} r={3.5} className={styles.dot} />
              <circle cx={ea.x} cy={ea.y} r={3} className={styles.dot} />
              <circle cx={eb.x} cy={eb.y} r={3} className={styles.dot} />
            </g>
          </g>
        }
      />
      <div className={styles.callouts} aria-hidden="true">
        <span className={`${styles.callout} ${styles.above}`} style={{ right: pct(W - a.x, W), top: pct(a.y, H) }}>
          Uma região.
          <br />
          Muitas características.
        </span>
        <span className={`${styles.callout} ${styles.below}`} style={{ right: pct(W - b.x, W), top: pct(b.y, H) }}>
          Explore por camadas.
        </span>
      </div>
    </div>
  );
}
