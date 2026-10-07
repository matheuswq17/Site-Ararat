"use client";

import { memo, type CSSProperties } from "react";
import { visibleRect, type MriSource, type Pt, type Rect } from "@/lib/mri";
import { MriFigure } from "../art/MriFigure";
import styles from "./JourneyMriScene.module.css";

export type SceneLayout = "landscape" | "portrait";
export const SCENE_ASPECT: Record<SceneLayout, number> = { landscape: 6 / 5, portrait: 4 / 5 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Ordem e comprimentos relativos ilustrativos (sem números), iguais aos da seção Explicabilidade. */
export const SCENE_FEATURES = [
  { key: "forma", label: "Forma", len: 0.5 },
  { key: "textura", label: "Textura", len: 1 },
  { key: "intensidade", label: "Intensidade", len: 0.7 },
] as const;

type Tile = Rect & { key: string; label: string; len: number; bar: { x: number; y: number; max: number; h: number } };

type Geometry = {
  view: Rect;
  k: number;
  tx: number;
  ty: number;
  tiles: Tile[];
  panel: Rect;
  anchor: (t: Tile) => Pt;
};

function geometry(src: MriSource, layout: SceneLayout, s1: number, s2: number): Geometry {
  const V = visibleRect(src.width, src.height, SCENE_ASPECT[layout]);
  const S = src.sample;
  const ratio = S.w / S.h;
  const k = 1 + 0.3 * ease(s1);
  if (layout === "landscape") {
    const tw = V.w * 0.2;
    const th = tw / ratio;
    const gap = 26;
    const x = V.x + V.w * 0.585;
    const y0 = V.y + (V.h - (3 * th + 2 * gap)) / 2;
    const barX = x + tw + 16;
    const tiles = SCENE_FEATURES.map((f, i) => ({
      ...f,
      x,
      y: y0 + i * (th + gap),
      w: tw,
      h: th,
      bar: { x: barX, y: y0 + i * (th + gap) + th / 2 - 4, max: V.x + V.w - 24 - barX, h: 8 },
    }));
    return {
      view: V,
      k,
      tx: -0.21 * V.w * ease(s2),
      ty: 0,
      tiles,
      panel: { x: x - 22, y: y0 - 40, w: V.x + V.w - (x - 22), h: 3 * th + 2 * gap + 64 },
      anchor: (t) => ({ x: t.x - 8, y: t.y + t.h / 2 }),
    };
  }
  const pad = 22;
  const gap = 14;
  const tw = (V.w - 2 * pad - 2 * gap) / 3;
  const th = tw / ratio;
  const y = V.y + V.h * 0.63;
  const tiles = SCENE_FEATURES.map((f, i) => {
    const x = V.x + pad + i * (tw + gap);
    return { ...f, x, y, w: tw, h: th, bar: { x, y: y + th + 14, max: tw, h: 9 } };
  });
  return {
    view: V,
    k,
    tx: 0,
    ty: -0.2 * V.h * ease(s2),
    tiles,
    panel: { x: V.x, y: y - 46, w: V.w, h: th + 86 },
    anchor: (t) => ({ x: t.x + t.w / 2, y: t.y - 8 }),
  };
}

type Props = {
  source: MriSource;
  /** Progresso exibido (já quantizado se movimento reduzido). */
  progress: number;
  layout: SceneLayout;
};

/**
 * Cena estática/fallback da jornada sobre a RM demonstrativa. Imagem, janela de
 * amostra, recortes e conexões compartilham o viewBox da imagem.
 * Sem mapa do Motion: nenhuma máscara ou ROI é desenhada sobre o tecido —
 * apenas a janela retangular de amostragem e recortes da mesma base.
 */
export const JourneyMriScene = memo(function JourneyMriScene({ source, progress, layout }: Props) {
  const s1 = clamp01(progress * 3);
  const s2 = clamp01(progress * 3 - 1);
  const s3 = clamp01(progress * 3 - 2);
  const g = geometry(source, layout, s1, s2);
  const f = source.focus;
  const map = source.map;
  const S = source.sample;
  const target = map?.roiCenter ?? f;
  // Ponto da imagem após a câmera: p' = f + k (p − f) + t
  const cam = (p: Pt): Pt => ({ x: f.x + g.k * (p.x - f.x) + g.tx, y: f.y + g.k * (p.y - f.y) + g.ty });
  const from = cam(target);

  const tex = (() => {
    const side = Math.min(S.w, S.h) * 0.42;
    return { x: target.x - side / 2, y: target.y - side / 2, w: side, h: side };
  })();
  const crops: Record<string, Rect> = { forma: S, textura: tex, intensidade: S };

  const cameraStyle: CSSProperties = {
    transformOrigin: `${f.x}px ${f.y}px`,
    transform: `translate(${g.tx.toFixed(2)}px, ${g.ty.toFixed(2)}px) scale(${g.k.toFixed(4)})`,
  };

  const reveal = (s: number, t0: number) => clamp01((s - t0) / 0.5);
  const id = `jm-${layout}`;
  const ringR = Math.max(S.w, S.h) * 0.62;

  const inCamera = (
    <>
      {/* Foco: arco da marca ao redor da região central */}
      <circle
        cx={f.x}
        cy={f.y}
        r={ringR}
        pathLength={1}
        className={styles.ring}
        style={{ opacity: 0.4 + 0.6 * s1 }}
      />
      {map ? (
        <>
          <path d={map.glandPath} pathLength={1} className={styles.gland} style={{ strokeDashoffset: 1 - s1, fillOpacity: 0.12 * s1 }} />
          {map.roiPath && (
            <path d={map.roiPath} pathLength={1} className={styles.roi} style={{ strokeDashoffset: 1 - clamp01(s1 * 2 - 1), fillOpacity: 0.22 * clamp01(s1 * 2 - 1) }} />
          )}
        </>
      ) : null}
      {/* Janela de amostragem (Dados): retângulo da mesma base, não é contorno nem ROI */}
      <g style={{ opacity: s2 }}>
        {!map && <rect x={S.x} y={S.y} width={S.w} height={S.h} className={styles.window} />}
        <g clipPath={`url(#${id}-clip)`} className={styles.lattice}>
          {Array.from({ length: Math.floor(S.w / 14) }, (_, i) => (
            <line key={`v${i}`} x1={S.x + (i + 1) * 14} x2={S.x + (i + 1) * 14} y1={S.y} y2={S.y + S.h} />
          ))}
          {Array.from({ length: Math.floor(S.h / 14) }, (_, i) => (
            <line key={`h${i}`} y1={S.y + (i + 1) * 14} y2={S.y + (i + 1) * 14} x1={S.x} x2={S.x + S.w} />
          ))}
        </g>
        <rect x={tex.x} y={tex.y} width={tex.w} height={tex.h} className={styles.texBox} style={{ opacity: reveal(s2, 0.3) }} />
      </g>
    </>
  );

  const overlay = (
    <>
      <defs>
        <clipPath id={`${id}-clip`}>{map ? <path d={map.glandPath} /> : <rect x={S.x} y={S.y} width={S.w} height={S.h} />}</clipPath>
        <filter id={`${id}-edges`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feGaussianBlur stdDeviation="1.6" />
          <feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.88  0 0 0 0 0.73  0 0 0 0 0.25  5 5 5 0 -0.35" />
        </filter>
        <filter id={`${id}-ramp`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="gamma" exponent="0.55" />
            <feFuncG type="gamma" exponent="0.55" />
            <feFuncB type="gamma" exponent="0.55" />
          </feComponentTransfer>
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.03 0.1 0.25 0.48 0.83 0.96" />
            <feFuncG type="table" tableValues="0.06 0.16 0.35 0.56 0.69 0.9" />
            <feFuncB type="table" tableValues="0.09 0.28 0.47 0.6 0.22 0.68" />
          </feComponentTransfer>
        </filter>
      </defs>

      <rect {...rectProps(g.panel)} rx={10} className={styles.panel} style={{ opacity: 0.86 * s2 }} />

      {g.tiles.map((t, i) => {
        const shown = reveal(s2, i * 0.18);
        const c = crops[t.key];
        return (
          <g key={t.key} style={{ opacity: shown }}>
            <svg x={t.x} y={t.y} width={t.w} height={t.h} viewBox={`${c.x} ${c.y} ${c.w} ${c.h}`} preserveAspectRatio="xMidYMid slice">
              <image href={source.src} width={source.width} height={source.height} filter={t.key === "intensidade" ? `url(#${id}-ramp)` : undefined} />
              {t.key === "forma" &&
                (map ? (
                  <path d={map.glandPath} className={styles.tileContour} />
                ) : (
                  <image href={source.src} width={source.width} height={source.height} filter={`url(#${id}-edges)`} />
                ))}
            </svg>
            <rect x={t.x} y={t.y} width={t.w} height={t.h} className={styles.tileFrame} />
            <rect x={t.bar.x} y={t.bar.y} width={t.bar.max} height={t.bar.h} rx={2} className={styles.barTrack} style={{ opacity: s3 }} />
            <rect
              x={t.bar.x}
              y={t.bar.y}
              width={Math.max(0.01, t.bar.max * t.len * ease(s3))}
              height={t.bar.h}
              rx={2}
              className={t.key === "textura" ? styles.barStrong : styles.bar}
            />
          </g>
        );
      })}

      {g.tiles.map((t) => {
        const a = g.anchor(t);
        const d =
          layout === "landscape"
            ? `M${from.x} ${from.y}C${(from.x + a.x) / 2} ${from.y} ${(from.x + a.x) / 2} ${a.y} ${a.x} ${a.y}`
            : `M${from.x} ${from.y}C${from.x} ${(from.y + a.y) / 2} ${a.x} ${(from.y + a.y) / 2} ${a.x} ${a.y}`;
        return <path key={t.key} d={d} pathLength={1} className={styles.connector} style={{ strokeDashoffset: 1 - s3 }} />;
      })}
      <circle cx={from.x} cy={from.y} r={4} className={styles.origin} style={{ opacity: Math.max(s2, s3) }} />
    </>
  );

  const V = g.view;
  const pct = (p: Pt) => ({ left: `${(((p.x - V.x) / V.w) * 100).toFixed(3)}%`, top: `${(((p.y - V.y) / V.h) * 100).toFixed(3)}%` });

  return (
    <div className={styles.scene} data-layout={layout}>
      <MriFigure id={id} source={source} fit="slice" cameraStyle={cameraStyle} inCamera={inCamera} overlay={overlay} edgeFade={0.06} />
      <div className={styles.labels} aria-hidden="true">
        {g.tiles.map((t, i) => (
          <span key={t.key} className={styles.label} style={{ ...pct({ x: t.x, y: t.y }), opacity: reveal(s2, i * 0.18) }}>
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
});

function rectProps(r: Rect) {
  return { x: r.x, y: r.y, width: r.w, height: r.h };
}
