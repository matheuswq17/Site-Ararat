"use client";

import { useTranslation } from "@/lib/i18n";

import { useEffect, useRef, useState } from "react";
import { useMotionPaused } from "@/lib/motion-prefs";
import {
  AVISO_FLUXO,
  ATRIBUICAO_FLUXO,
  ETAPAS_FLUXO,
  MODULOS_FLUXO,
  MODULO_FLUXO_PADRAO,
  ORIGEM_FLUXO,
  carregarPlataformaFluxo,
  type ImagemFluxo,
  type PlataformaFluxoModulo,
} from "@/lib/plataforma-fluxo";
import { progressoFluxo, progressoTrilho } from "@/lib/plataforma-fluxo-progresso";
import styles from "./PlataformaFluxo.module.css";

/**
 * Demonstração "do Hub ao Viewer" conduzida pela rolagem — seção Plataforma da /previa/refinada.
 *
 * Duas apresentações, ambas na página (só uma visível):
 *  · PERCURSO ANIMADO (módulo do Motion, contrato 0.1.0 — docs/coordination/PLATAFORMA-FLUXO-MOTION.md): um trilho
 *    alto com palco sticky LIMITADO à seção e as legendas das 7 etapas. Não prende, não bloqueia e não captura a
 *    rolagem (sem snap, sem preventDefault). O módulo só desenha capturas; todo texto é HTML daqui.
 *  · ROTEIRO ESTÁTICO: as 7 etapas em HTML com as capturas-chave (derivados próprios do Site, sem a data do estudo).
 *    É o conteúdo sem JS, com movimento reduzido, com a pausa e quando o módulo ou um asset falha.
 * Qual aparece é decidido por CSS desde a 1ª pintura (sem mexer no portão do <head>/abertura):
 *  · com módulo registrado: trilho; `@media (prefers-reduced-motion)`: roteiro; sem JS: roteiro (<noscript><style>);
 *  · `html[data-motion=paused]` (aplicado na hidratação) ou `data-fluxo-modo="estatico"` (módulo): roteiro.
 * Ao pausar/retomar com a seção na tela, a rolagem é reposicionada na MESMA etapa da outra apresentação.
 *
 * PROGRESSO (fonte única = Site), pela posição real, recalculado em scroll, resize e ResizeObserver:
 *  · percurso: p = (cabeçalho − trilho.top) / (trilho.height − (janela − cabeçalho)) → setProgresso(p);
 *  · roteiro: etapa sob a linha de leitura (lib/plataforma-fluxo-progresso.ts), para a marca discreta.
 * Nada de contagem de rolagens, deltas de roda ou temporizadores; a mesma posição dá o mesmo estado.
 */
const MODULO = MODULO_FLUXO_PADRAO ? MODULOS_FLUXO[MODULO_FLUXO_PADRAO] : null;
const SEM_JS = "[data-fluxo=root] [data-fluxo=trilho]{display:none!important}[data-fluxo=root] [data-fluxo=roteiro]{display:block!important}";

export function PlataformaFluxo() {
  const { t, locale } = useTranslation();
  const raiz = useRef<HTMLDivElement>(null);
  const trilho = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const roteiro = useRef<HTMLOListElement>(null);
  const motor = useRef<PlataformaFluxoModulo | null>(null);
  const faixas = useRef<Array<{ etapa: number; ate: number }>>([]);
  const etapaAtual = useRef(1); // 1–7, a etapa em leitura na apresentação visível
  const paused = useMotionPaused();
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const [js, setJs] = useState(false);
  const [etapaRoteiro, setEtapaRoteiro] = useState(0);

  useEffect(() => setJs(true), []);

  const cabecalho = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72;
  const trilhoVisivel = () => !!trilho.current && trilho.current.getBoundingClientRect().height > 0;

  // Progresso pela posição real (percurso e roteiro). Só ouve scroll/resize/layout.
  useEffect(() => {
    const el = raiz.current, tr = trilho.current, ol = roteiro.current;
    if (!el || !tr || !ol) return;
    let pedido = 0;
    let ultimoP = -1; // progresso da última medida feita por ROLAGEM (base para manter a cena num resize)
    let porResize = false; // a medida foi pedida por resize/mudança de layout (não por rolagem)
    const medir = () => {
      pedido = 0;
      const cab = cabecalho(), vh = window.innerHeight;
      if (trilhoVisivel()) {
        // Resize no meio do percurso: o trilho muda de altura (svh); a rolagem é reposta no MESMO progresso, para a
        // cena não saltar. Fora do percurso (p 0 ou 1) nada é reposto.
        if (porResize && ultimoP > 0 && ultimoP < 1) {
          const t = tr.getBoundingClientRect();
          const curso = t.height - (vh - cab);
          if (curso > 0) window.scrollTo({ top: window.scrollY + t.top - cab + ultimoP * curso, behavior: "instant" });
        }
        const p = progressoTrilho(tr.getBoundingClientRect(), vh, cab);
        if (!porResize || ultimoP < 0) ultimoP = p;
        const v = p.toFixed(4);
        if (el.dataset.progresso !== v) el.dataset.progresso = v;
        motor.current?.setProgresso(p);
        porResize = false;
      } else {
        porResize = false;
        ultimoP = -1;
        const r = progressoFluxo([...ol.querySelectorAll<HTMLElement>(":scope > li")].map((li) => li.getBoundingClientRect()), vh, cab);
        const v = r.progresso.toFixed(4);
        if (el.dataset.progresso !== v) {
          el.dataset.progresso = v;
          el.dataset.etapa = String(r.etapa);
          el.dataset.local = r.local.toFixed(4);
        }
        etapaAtual.current = r.etapa + 1;
        setEtapaRoteiro(r.etapa);
      }
    };
    const agendar = () => {
      if (!pedido) pedido = requestAnimationFrame(medir);
    };
    medir();
    const aoRolar = () => {
      porResize = false;
      agendar();
    };
    const aoRedimensionar = () => {
      porResize = true;
      agendar();
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRedimensionar);
    const ro = new ResizeObserver(aoRedimensionar);
    ro.observe(tr);
    ro.observe(ol);
    // Etapa anunciada pelo módulo (o desenho acompanha o progresso com uma suavização curta).
    const onEstado = (ev: Event) => {
      const e = (ev as CustomEvent<{ etapa: number }>).detail?.etapa;
      if (e >= 1 && trilhoVisivel()) etapaAtual.current = e;
    };
    el.addEventListener("fluxo:estado", onEstado);
    return () => {
      el.removeEventListener("fluxo:estado", onEstado);
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRedimensionar);
      ro.disconnect();
      if (pedido) cancelAnimationFrame(pedido);
    };
  }, []);

  // Módulo do Motion: montado uma vez; o progresso vem SEMPRE do Site.
  useEffect(() => {
    const el = raiz.current;
    if (!el || !MODULO) return;
    let vivo = true;
    carregarPlataformaFluxo(MODULO)
      .then(({ criar, etapas }) => {
        if (!vivo) return;
        faixas.current = etapas;
        motor.current = criar(el, { palco: palco.current, base: MODULO.base, progresso: "externo", paused: pausedRef.current, reducedMotion: "auto" });
        if (trilho.current && trilhoVisivel()) motor.current.setProgresso(progressoTrilho(trilho.current.getBoundingClientRect(), window.innerHeight, cabecalho()));
      })
      .catch(() => {
        if (!vivo) return;
        el.dataset.fluxoModo = "estatico";
        el.dataset.fluxoFalha = "modulo";
      });
    return () => {
      vivo = false;
      try {
        motor.current?.destroy();
      } catch {
        /* o roteiro estático continua disponível */
      }
      motor.current = null;
    };
  }, []);

  // Pausa global: repassa ao módulo e mantém a pessoa na MESMA etapa ao trocar de apresentação.
  const pausaAnterior = useRef(paused);
  useEffect(() => {
    if (pausaAnterior.current === paused) return;
    pausaAnterior.current = paused;
    const e = etapaAtual.current;
    try {
      motor.current?.setPaused(paused);
    } catch {
      /* nada */
    }
    const el = raiz.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return; // seção fora da tela: nada a reposicionar
    requestAnimationFrame(() => {
      const cab = cabecalho();
      if (trilhoVisivel() && trilho.current) {
        // retomou: posição do trilho no meio da faixa da etapa (faixas do próprio módulo; senão, divisão igual)
        const f = faixas.current;
        const ini = e > 1 ? (f[e - 2]?.ate ?? (e - 1) / 7) : 0;
        const fim = Math.min(1, f[e - 1]?.ate ?? e / 7);
        const t = trilho.current.getBoundingClientRect();
        const curso = t.height - (window.innerHeight - cab);
        window.scrollTo({ top: window.scrollY + t.top - cab + ((ini + fim) / 2) * curso, behavior: "instant" });
      } else {
        const li = roteiro.current?.querySelectorAll<HTMLElement>(":scope > li")[e - 1];
        if (li) window.scrollTo({ top: window.scrollY + li.getBoundingClientRect().top - cab - 16, behavior: "instant" });
      }
    });
  }, [paused]);

  const total = ETAPAS_FLUXO.length;

  return (
    <div ref={raiz} className={styles.fluxo} data-fluxo="root" data-com-modulo={MODULO ? "" : undefined} data-modulo={MODULO?.versao} data-motor={MODULO ? undefined : "ausente"} data-js={js ? "" : undefined}>
      <noscript dangerouslySetInnerHTML={{ __html: `<style>${SEM_JS}</style>` }} />
      <p className={styles.aviso} role="note">
        <strong>{t(AVISO_FLUXO)}</strong> {t(ORIGEM_FLUXO)}
        {locale === "en" && " The captured product interface is in Portuguese."}
      </p>

      {/* Percurso animado: trilho + palco sticky limitado a esta seção. */}
      <div ref={trilho} className={styles.trilho} data-fluxo="trilho">
        <div className={styles.fixo}>
          <ol className={styles.legendas} aria-label={t(`Percurso em ${total} etapas, do Hub ao Viewer e de volta`)}>
            {ETAPAS_FLUXO.map((e, i) => (
              <li key={e.id} data-etapa={i + 1}>
                <span className={styles.legendaNum} aria-hidden="true">
                  {t(e.n)}
                </span>
                <div>
                  <b className={styles.legendaTitulo}>{t(e.titulo)}</b>
                  <small className={styles.legendaTexto}>{t(e.legenda)}</small>
                  <span className={styles.sr}>
                    {t(" ")}
                    {t("Capturas:")}{" "}{e.imagens.map((im) => t(im.alt)).join(" ")}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <div ref={palco} className={styles.palco} data-fluxo-palco="" aria-hidden="true" />
        </div>
      </div>

      {/* Roteiro estático (sem JS, reduzido, pausa, falha). */}
      <ol ref={roteiro} className={styles.etapas} data-fluxo="roteiro" aria-label={t(`Percurso em ${total} etapas, do Hub ao Viewer e de volta`)}>
        {ETAPAS_FLUXO.map((e, i) => (
          <li key={e.id} className={styles.etapa} data-i={i} data-etapa-id={e.id} data-ativa={js && i === etapaRoteiro ? "" : undefined}>
            <div className={styles.texto} data-parte="texto">
              <p className={styles.num}>
                <span>{t(e.n)}</span>
                <span className={styles.produto}>{t(e.produto)}</span>
              </p>
              <h3 className={styles.titulo}>{t(e.titulo)}</h3>
              <p className={styles.descricao}>{t(e.texto)}</p>
            </div>
            <div className={styles.quadro} data-parte="quadro" data-n={e.imagens.length}>
              <div className={styles.imagens} data-celular={e.celular ? "" : undefined}>
                {e.imagens.map((im) => (
                  <Captura key={im.nome} im={im} />
                ))}
              </div>
              {e.celular && (
                <div className={styles.imagensCelular}>
                  {e.celular.map((im) => (
                    <Captura key={im.nome} im={im} />
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      <p className={styles.atribuicao}>
        {t("Imagens de RM:")}{" "}{ATRIBUICAO_FLUXO.citacao}{" "}
        <a href={ATRIBUICAO_FLUXO.doi} rel="noopener noreferrer">
          {t(ATRIBUICAO_FLUXO.doi.replace("https://", ""))}
        </a>{t(" ")}
        {t("— licença")}{t(" ")}
        <a href={ATRIBUICAO_FLUXO.licenca.url} rel="license noopener noreferrer">
          {t(ATRIBUICAO_FLUXO.licenca.nome)}
        </a>
        {". "}{t(ATRIBUICAO_FLUXO.tratamentos)} {t(ATRIBUICAO_FLUXO.endosso)}
      </p>
    </div>
  );
}

function Captura({ im }: { im: ImagemFluxo }) {
  const { t } = useTranslation();
  const maior = im.fontes[im.fontes.length - 1];
  const [falhou, setFalhou] = useState(false);
  return (
    <figure
      className={styles.captura}
      data-produto={im.produto}
      data-falhou={falhou ? "" : undefined}
      style={{ aspectRatio: `${maior.w} / ${maior.h}`, maxWidth: `calc(var(--fluxo-alt-max) * ${(maior.w / maior.h).toFixed(4)})` }}
    >
      {falhou ? (
        <figcaption className={styles.falha}>{t("Captura indisponível:")}{" "}{t(im.alt)}</figcaption>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={maior.src}
          srcSet={im.fontes.map((f) => `${f.src} ${f.w}w`).join(", ")}
          sizes={im.sizes}
          width={maior.w}
          height={maior.h}
          alt={t(im.alt)}
          loading="lazy"
          decoding="async"
          onError={() => setFalhou(true)}
        />
      )}
    </figure>
  );
}
