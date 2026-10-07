"use client";

import { useEffect, useState } from "react";
import type { MriSource, Rect } from "@/lib/mri";
import styles from "./ExplainMri.module.css";

export type FeatureKey = "forma" | "textura" | "intensidade";

/**
 * Recorte da MESMA RM demonstrativa usada no hero e na jornada (mesmas
 * coordenadas em pixels). Cada característica é uma visualização derivada dos
 * pixels da imagem — bordas, recorte ampliado, mapa de tons — e não uma
 * feature radiômica calculada sobre DICOM.
 */
export function ExplainMri({
  source,
  selected,
  formaSoft = false,
}: {
  source: MriSource;
  selected: FeatureKey;
  /** /previa/refinada: Forma com realce de bordas suave e contorno mais marcado (silhueta legível). */
  formaSoft?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  // Detecta falha de carregamento da base (o evento error de <image> SVG não é confiável no React).
  useEffect(() => {
    let alive = true;
    const probe = new Image();
    probe.onload = () => alive && setFailed(false);
    probe.onerror = () => alive && setFailed(true);
    probe.src = source.src;
    return () => {
      alive = false;
    };
  }, [source.src]);
  const S = source.sample;
  const map = source.map;
  const target = map?.roiCenter ?? source.focus;
  // Contexto 16:10 ao redor da janela, limitado à imagem
  const cw = Math.min(source.width, S.w * 2.6);
  const ch = Math.min(source.height, cw * 0.625);
  const C: Rect = {
    x: Math.max(0, Math.min(source.width - cw, S.x + S.w / 2 - cw / 2)),
    y: Math.max(0, Math.min(source.height - ch, S.y + S.h / 2 - ch / 2)),
    w: cw,
    h: ch,
  };
  const side = Math.min(S.w, S.h) * 0.42;
  const tex: Rect = { x: target.x - side / 2, y: target.y - side / 2, w: side, h: side };
  const inset: Rect = { x: C.x + C.w - C.h * 0.36 - 10, y: C.y + 10, w: C.h * 0.36, h: C.h * 0.36 };
  const clipId = "xai-clip";

  return (
    <svg
      className={styles.art}
      viewBox={`${C.x} ${C.y} ${C.w} ${C.h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-selected={selected}
      data-image-failed={failed || undefined}
    >
      <defs>
        <clipPath id={clipId}>{map ? <path d={map.glandPath} /> : <rect x={S.x} y={S.y} width={S.w} height={S.h} />}</clipPath>
        <filter id="xai-edges" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feGaussianBlur stdDeviation="1.6" />
          <feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.88  0 0 0 0 0.73  0 0 0 0 0.25  5 5 5 0 -0.35" />
        </filter>
        {/* Variante suave (formaSoft): mais desfoque e menos ganho — menos "textura" nas bordas internas. */}
        <filter id="xai-edges-soft" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feGaussianBlur stdDeviation="3" />
          <feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.88  0 0 0 0 0.73  0 0 0 0 0.25  2.2 2.2 2.2 0 -0.3" />
        </filter>
        <filter id="xai-ramp" colorInterpolationFilters="sRGB">
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

      <image href={source.src} width={source.width} height={source.height} className={styles.base} />

      <g className={styles.ovForma}>
        <g clipPath={`url(#${clipId})`}>
          <image href={source.src} width={source.width} height={source.height} filter={formaSoft ? "url(#xai-edges-soft)" : "url(#xai-edges)"} />
        </g>
        {map && <path d={map.glandPath} className={styles.contour} data-strong={formaSoft || undefined} />}
      </g>
      <g className={styles.ovIntensidade} clipPath={`url(#${clipId})`}>
        <image href={source.src} width={source.width} height={source.height} filter="url(#xai-ramp)" />
      </g>

      {map ? (
        <>
          <path d={map.glandPath} className={styles.glandLine} />
          {map.roiPath && <path d={map.roiPath} className={styles.roiLine} />}
        </>
      ) : (
        <rect x={S.x} y={S.y} width={S.w} height={S.h} className={styles.window} />
      )}

      <g className={styles.ovTextura}>
        <rect x={tex.x} y={tex.y} width={tex.w} height={tex.h} className={styles.texBox} />
        <path
          d={`M${tex.x + tex.w} ${tex.y}L${inset.x} ${inset.y + inset.h}`}
          className={styles.texLink}
        />
        <svg x={inset.x} y={inset.y} width={inset.w} height={inset.h} viewBox={`${tex.x} ${tex.y} ${tex.w} ${tex.h}`}>
          <image href={source.src} width={source.width} height={source.height} />
        </svg>
        <rect x={inset.x} y={inset.y} width={inset.w} height={inset.h} className={styles.insetFrame} />
      </g>
    </svg>
  );
}
