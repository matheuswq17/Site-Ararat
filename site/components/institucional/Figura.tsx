import type { CSSProperties } from "react";
import type { Captura } from "@/lib/institucional/capturas";
import { t, type Idioma } from "@/lib/institucional/textos";
import s from "./Institucional.module.css";

/** Teto de ampliação (px do dispositivo por px da captura), igual ao do Motion (fluxo 0.6.0-03d2). */
export const TETO = { interface: 2, medica: 1.75 } as const;

/**
 * Captura real com legenda de ORIGEM. A largura CSS máxima é largura natural × teto / densidade (--d no CSS), para a
 * captura nunca passar do teto de ampliação. O teto não garante legibilidade: isso depende do texto na captura.
 */
export function Figura({ cap, idioma, legenda, sizes, className, prioridade }: { cap: Captura; idioma: Idioma; legenda?: string; sizes?: string; className?: string; prioridade?: boolean }) {
  const maior = cap.fontes[cap.fontes.length - 1];
  const estilo = { "--nat": maior.w, "--teto": cap.medica ? TETO.medica : TETO.interface } as CSSProperties;
  return (
    <figure className={`${s.fig} ${className ?? ""}`} data-captura={cap.id} data-evidencia={cap.evidencia}>
      {/* eslint-disable-next-line @next/next/no-img-element -- capturas WebP já derivadas, com srcset próprio */}
      <img
        className={`${s.cap} ${cap.produto === "hub" ? s.capHub : ""}`}
        src={maior.src}
        srcSet={cap.fontes.length > 1 ? cap.fontes.map((f) => `${f.src} ${f.w}w`).join(", ") : undefined}
        sizes={sizes ?? "(min-width: 900px) 50vw, 100vw"}
        width={maior.w}
        height={maior.h}
        alt={t(cap.alt, idioma)}
        loading={prioridade ? "eager" : "lazy"}
        decoding="async"
        style={estilo}
        data-medica={cap.medica ? "1" : "0"}
      />
      {legenda ? <figcaption className={s.origem}>{legenda}</figcaption> : null}
    </figure>
  );
}
