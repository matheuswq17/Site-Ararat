"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CapturaProduto } from "@/lib/refinada-capturas";
import styles from "./CapturaProdutoFigura.module.css";

/**
 * Uma captura do produto na Plataforma da /previa/refinada.
 *  · <picture> com direção de arte: no celular (≤ 600 px) um RECORTE útil e legível; acima, a
 *    captura inteira. Dimensões reservadas pelos atributos width/height de cada fonte + aspect-ratio.
 *  · Carregamento preguiçoso (abaixo da dobra) e decodificação assíncrona.
 *  · "Ver captura completa": <dialog> nativo (modal, Escape fecha, foco preso; ao fechar, o foco
 *    volta ao acionador). Sem JS, o acionador é um link para a imagem inteira.
 *  · Falha de carregamento: troca a imagem por um quadro identificado com a legenda (sem mídia
 *    fictícia) e retira o acionador de ampliação.
 *  · Marcadores numéricos (passos do percurso) só sobre a captura inteira; ficam fora do recorte.
 */
export function CapturaProdutoFigura({
  captura,
  rotulo,
  marcadores,
  destaque = false,
}: {
  captura: CapturaProduto;
  /** Ex.: "Hub · passos 01–02". */
  rotulo: string;
  /** Posição em % da captura inteira; só visíveis acima de 600 px. */
  marcadores: ReadonlyArray<{ n: string; left: string; top: string }>;
  destaque?: boolean;
}) {
  const id = useId();
  const legendaId = `${id}-legenda`;
  const tituloId = `${id}-titulo`;
  const img = useRef<HTMLImageElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLAnchorElement>(null);
  const [falhou, setFalhou] = useState(false);
  const maior = captura.inteira[captura.inteira.length - 1];

  // Erro antes da hidratação (o evento já passou): confere o estado da imagem ao montar.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0 && el.currentSrc) setFalhou(true);
  }, []);

  const abrir = (e: React.MouseEvent) => {
    const d = dialog.current;
    if (!d || typeof d.showModal !== "function") return; // sem suporte: segue o link
    e.preventDefault();
    d.showModal();
  };
  const fechar = () => dialog.current?.close();

  return (
    <figure className={styles.figure} data-captura={captura.id} data-destaque={destaque || undefined} aria-labelledby={legendaId}>
      <p className={styles.top}>
        <span className={styles.rotulo}>{rotulo}</span>
        <span className={styles.demo}>Ambiente demonstrativo · dados sintéticos</span>
      </p>

      {falhou ? (
        <div className={styles.falha} role="note" style={{ aspectRatio: `${captura.width} / ${captura.height}` }}>
          <p>
            Captura do {captura.produto} indisponível no momento. O percurso descrito ao lado não depende dela.
          </p>
        </div>
      ) : (
        <div
          className={styles.window}
          style={
            {
              "--ar": `${captura.width} / ${captura.height}`,
              "--ar-m": `${captura.recorte.width} / ${captura.recorte.height}`,
            } as React.CSSProperties
          }
        >
          <picture>
            <source
              media="(max-width: 600px)"
              srcSet={captura.recorte.fontes.map((f) => `${f.src} ${f.w}w`).join(", ")}
              sizes="calc(100vw - 32px)"
              width={captura.recorte.width}
              height={captura.recorte.height}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={img}
              src={captura.inteira[1]?.src ?? maior.src}
              srcSet={captura.inteira.map((f) => `${f.src} ${f.w}w`).join(", ")}
              sizes={destaque ? "(min-width: 1240px) 780px, (min-width: 960px) 62vw, calc(100vw - 48px)" : "(min-width: 1240px) 480px, (min-width: 960px) 37vw, calc(100vw - 48px)"}
              width={captura.width}
              height={captura.height}
              alt={captura.alt}
              loading="lazy"
              decoding="async"
              className={styles.shot}
              onError={() => setFalhou(true)}
            />
          </picture>
          {marcadores.map((m) => (
            <span key={m.n} className={styles.marker} style={{ left: m.left, top: m.top }} aria-hidden="true">
              {m.n}
            </span>
          ))}
        </div>
      )}

      <figcaption id={legendaId} className={`ill-note ${styles.caption}`}>
        <span className={styles.recorteNota}>
          No celular, {captura.recorte.descricao.toLowerCase()}; a captura inteira abre em “Ver captura completa”.{" "}
        </span>
        {captura.legenda}
      </figcaption>

      {!falhou && (
        <>
          <a ref={trigger} href={maior.src} className={styles.trigger} onClick={abrir} aria-haspopup="dialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false">
              <circle cx="10.5" cy="10.5" r="6" />
              <path d="M15 15l5 5M10.5 8v5M8 10.5h5" strokeLinecap="round" />
            </svg>
            Ver captura completa do {captura.produto.replace("ARARAT ", "")}
          </a>
          <dialog
            ref={dialog}
            className={styles.dialog}
            aria-labelledby={tituloId}
            aria-describedby={`${id}-dlg-legenda`}
            onClose={() => trigger.current?.focus()}
            onClick={(e) => {
              if (e.target === e.currentTarget) fechar(); // clique no fundo
            }}
          >
            <div className={styles.inner}>
              <div className={styles.bar}>
                <h2 id={tituloId} className={styles.dlgTitle}>
                  {captura.produto}
                  {captura.versao ? ` ${captura.versao}` : ""} · captura completa
                </h2>
                <button type="button" className={styles.close} onClick={fechar}>
                  Fechar
                </button>
              </div>
              <div className={styles.scroller} tabIndex={0} aria-label="Captura completa; role para percorrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={maior.src} width={captura.width} height={captura.height} alt={captura.alt} className={styles.full} loading="lazy" decoding="async" />
              </div>
              <p id={`${id}-dlg-legenda`} className={styles.dlgCaption}>
                {captura.legenda}
              </p>
            </div>
          </dialog>
        </>
      )}
    </figure>
  );
}
