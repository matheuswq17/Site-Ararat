"use client";

import { useTranslation } from "@/lib/i18n";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { MriSource } from "@/lib/mri";
import styles from "./MriFigure.module.css";

type Props = {
  id: string;
  source: MriSource;
  /** "meet" mostra a imagem inteira; "slice" preenche o quadro (cortando bordas). */
  fit: "meet" | "slice";
  /** Elementos desenhados junto da imagem, sob a mesma câmera (contornos, janela de amostra). */
  inCamera?: ReactNode;
  /** Elementos de interface no mesmo sistema de coordenadas, fora da câmera (arcos, painéis, conexões). */
  overlay?: ReactNode;
  /** Transformação da câmera, aplicada a imagem e inCamera (CSS transform em unidades da imagem). */
  cameraStyle?: CSSProperties;
  /** Intensidade do esmaecimento das bordas (fração da dimensão). */
  edgeFade?: number;
  /** Mostra no próprio quadro o estado real de carregamento/erro da imagem. */
  statusLabel?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * RM demonstrativa + camadas no MESMO viewBox (pixels da imagem). Como imagem,
 * máscaras e marcações compartilham um único <svg> e preserveAspectRatio, a
 * transformação na tela é idêntica em qualquer tamanho. Decorativo (aria-hidden):
 * o conteúdo equivalente está no HTML adjacente.
 */
type LoadState = "initial" | "loading" | "loaded" | "error";

export function MriFigure({
  id,
  source,
  fit,
  inCamera,
  overlay,
  cameraStyle,
  edgeFade = 0.07,
  statusLabel = false,
  className,
  style,
}: Props) {
  const { t } = useTranslation();
  // "initial" = markup do servidor (imagem visível, sem JS nada é escondido).
  // Na hidratação: se a imagem já está no cache/decodificada → "loaded" sem esconder;
  // se ainda não chegou (nada foi pintado) → "loading" e, ao chegar, revelação de ~220 ms.
  const [state, setState] = useState<LoadState>("initial");
  useEffect(() => {
    let alive = true;
    const probe = new Image(); // mesmo URL: servido pelo preload/cache, sem 2º download
    probe.onload = () => alive && setState("loaded");
    probe.onerror = () => alive && setState("error");
    probe.src = source.src;
    if (probe.complete && probe.naturalWidth > 0) setState("loaded");
    else setState((s) => (s === "initial" ? "loading" : s));
    return () => {
      alive = false;
    };
  }, [source.src]);
  const failed = state === "error";
  const { width: W, height: H } = source;
  const fx = `${id}-fx`;
  const fy = `${id}-fy`;
  const gx = `${id}-gx`;
  const gy = `${id}-gy`;
  const e = edgeFade;

  return (
    <svg
      className={[styles.figure, className].filter(Boolean).join(" ")}
      style={style}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio={`xMidYMid ${fit}`}
      aria-hidden="true"
      focusable="false"
      data-image-failed={failed || undefined}
      data-mri-state={state}
      data-mri-origin={source.origin}
    >
      <defs>
        <linearGradient id={gx} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset={e} stopColor="#fff" stopOpacity="1" />
          <stop offset={1 - e} stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={gy} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset={e} stopColor="#fff" stopOpacity="1" />
          <stop offset={1 - e} stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={fx} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect width={W} height={H} fill={`url(#${gx})`} />
        </mask>
        <mask id={fy} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect width={W} height={H} fill={`url(#${gy})`} />
        </mask>
      </defs>

      <g className={styles.camera} style={cameraStyle}>
        <g mask={`url(#${fy})`}>
          <image
            href={source.src}
            width={W}
            height={H}
            mask={`url(#${fx})`}
            preserveAspectRatio="none"
            className={styles.image}
            data-mri-image=""
          />
        </g>
        {inCamera}
      </g>
      {overlay}
      {/* Aviso local da RM. Vem no HTML do servidor (oculto por padrão) para funcionar
          também ANTES da hidratação: o portão do <head> (intro-script) o torna visível
          enquanto a imagem não chegou; depois, data-mri-state assume. Sem relógio novo. */}
      {statusLabel && (
        <text x={W / 2} y={H - 28} textAnchor="middle" className={styles.status} data-mri-wait="">
          {t(state === "error" ? "Imagem de RM indisponível no momento" : "Carregando imagem de RM…")}
        </text>
      )}
    </svg>
  );
}
