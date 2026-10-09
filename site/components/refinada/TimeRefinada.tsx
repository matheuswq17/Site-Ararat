"use client";

import { useTranslation } from "@/lib/i18n";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from "react";
import { TIME, TIME_INTRO, TIME_NOTA, TIME_TITULO, type Integrante } from "@/lib/time-refinada";
import { carregarRetrato, PESSOAS_RETRATO, type CreateStipplePortrait, type EstadoRetrato, type RetratoPontilhado } from "@/lib/time-retrato";
import { useMotionPaused } from "@/lib/motion-prefs";
import { useMediaQuery } from "../motion/usePrefersReducedMotion";
import styles from "./TimeRefinada.module.css";

/**
 * Time da /previa/refinada — "Quem constrói o ARARAT" (rodada 7: retrato com troca pontilhada, módulo 0.2.0).
 * Direção: docs/coordination/DIRECAO-TIME-INTERATIVO-2026-10-06.md.
 *
 *  · Seção off-white, títulos navy, dourado só na seleção; fotos em cor natural, sem moldura.
 *  · Lista: cada integrante é um <details name="time"> (acordeão exclusivo nativo, funciona sem JS,
 *    por toque e teclado). FONTE ÚNICA da seleção: o estado `sel` (vem do integrante aberto). No
 *    desktop (≥ 960 px) há sempre exatamente um aberto: clicar no aberto não o fecha. Passar o
 *    mouse numa linha só prepara a foto (preload); nunca troca.
 *  · Retrato do desktop = módulo do Motion 0.2.0 (lib/time-retrato.ts, createStipplePortrait):
 *    foto natural em repouso; ao escolher outro integrante, foto atual → pontos → reorganização no
 *    novo → foto natural do escolhido, parada. O cursor não altera o retrato. Clicar no atual não
 *    chama select (sel não muda; e o módulo ignora pedido repetido). Pausa → setPaused; reduzido e
 *    toque: o módulo decide (troca direta). Carregamento, decodificação, última seleção e 404: módulo.
 *  · Sem JS ou com o módulo ausente: fotos empilhadas do Site (a escolhida só assume depois de
 *    decodificada; 404 → iniciais). Celular: foto íntegra dentro do item aberto.
 */
const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter((p) => /^[A-ZÁÉÍÓÚ]/.test(p))
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

const DESKTOP = "(min-width: 960px)";

function Retrato({ m, sizes, className, alt, onErro, erro }: { m: Integrante; sizes: string; className: string; alt: string; onErro: () => void; erro: boolean }) {
  const { t } = useTranslation();
  const maior = m.fotos[m.fotos.length - 1];
  const ref = useRef<HTMLImageElement>(null);
  // Falha antes da hidratação (o evento error já passou): confere o estado ao montar.
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0 && el.currentSrc) onErro();
  }, [onErro]);
  if (erro)
    return (
      <span className={`${className} ${styles.semFoto}`} data-id={m.id} role={alt ? "img" : undefined} aria-label={t(alt || undefined)} aria-hidden={alt ? undefined : true}>
        {t(iniciais(m.nome))}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      className={className}
      src={m.fotos[Math.min(1, m.fotos.length - 1)].src}
      srcSet={m.fotos.map((f) => `${f.src} ${f.w}w`).join(", ")}
      sizes={sizes}
      width={maior.w}
      height={Math.round((maior.w * 5) / 4)}
      alt={t(alt)}
      loading="lazy"
      decoding="async"
      data-id={m.id}
      onError={onErro}
    />
  );
}

type EstadoFabrica = "carregando" | "falhou" | CreateStipplePortrait;

export function TimeRefinada() {
  const { t, locale } = useTranslation();
  const [js, setJs] = useState(false);
  const [erros, setErros] = useState<Record<string, boolean>>({});
  const [sel, setSel] = useState<string>(TIME[0].id); // FONTE ÚNICA: integrante escolhido na lista
  const [shown, setShown] = useState<string>(TIME[0].id); // só no fallback (fotos empilhadas)
  const [fabrica, setFabrica] = useState<EstadoFabrica>("carregando");
  const [inst, setInst] = useState<RetratoPontilhado | null>(null);
  const [est, setEst] = useState<EstadoRetrato | null>(null);
  const paused = useMotionPaused();
  const desktop = useMediaQuery(DESKTOP);

  const sectionRef = useRef<HTMLElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pedidoRef = useRef(0);
  const selRef = useRef(sel);
  selRef.current = sel;
  const opRef = useRef({ paused });
  opRef.current = { paused };
  const errosRef = useRef(erros);
  errosRef.current = erros;

  const cbs = useRef<Record<string, () => void>>({});
  const falhou = (id: string) => (cbs.current[id] ??= () => setErros((e) => (e[id] ? e : { ...e, [id]: true })));

  useEffect(() => setJs(true), []);

  // Módulo do Motion (falha ao carregar → fallback de fotos empilhadas).
  useEffect(() => {
    let vivo = true;
    carregarRetrato()
      .then((f) => vivo && setFabrica(() => f)) // função: guardar via updater
      .catch(() => vivo && setFabrica("falhou"));
    return () => {
      vivo = false;
    };
  }, []);

  // Montagem só no desktop (o retrato grande não existe no celular). Desmonta ao sair.
  useEffect(() => {
    if (typeof fabrica !== "function" || !desktop) return;
    const host = stageRef.current;
    if (!host) return;
    let r: RetratoPontilhado;
    try {
      r = fabrica(host, {
        pessoas: PESSOAS_RETRATO,
        inicial: selRef.current,
        // 0.2.0: foto natural em repouso; troca = foto → pontos → reorganização → foto do escolhido.
        interativo: "auto",
        paused: opRef.current.paused,
        reducedMotion: "auto",
        // brand-sinal-v1: P&B de EXIBIÇÃO feito pelo próprio módulo 0.4.0-sinal (img.rp-foto: grayscale(1)
        // contrast(1.04)); o CSS do Site aplica o MESMO tratamento só às <img> que o módulo não controla
        // (estático, celular, sem JS, módulo ausente) — nunca filtro duplo. Arquivos de foto intactos.
        cor: "mono",
        // codex/brand-03d2-v1 (contrato 0.5.0-03d2): o plano tonal do retrato é pintado PELO MÓDULO (`fundo`),
        // alinhado à grade de pixel junto com a foto; o quadro e a coluna do Site ficam transparentes com o módulo
        // ativo (marca-03d2.css). A cor vem do token bg/sunken da seção (claro: #EDEDED), não de um valor fixo.
        fundo: getComputedStyle(host).getPropertyValue("--ararat-bg-sunken").trim() || null,
        onEstado: (e) => setEst({ ...e }),
      });
    } catch {
      setFabrica("falhou");
      return;
    }
    setInst(r);
    setEst(r.state);
    return () => {
      try {
        r.destroy();
      } catch {
        /* nada a desfazer */
      }
      setInst(null);
      setEst(null);
    };
  }, [fabrica, desktop]);

  // Seleção → módulo (a última prevalece dentro do módulo; sem fila).
  // O módulo só emite onEstado quando a FASE muda: em foto-estatica (pausa/reduzido/fallback) a troca
  // de pessoa não muda a fase. Ao resolver select(), relemos inst.state para o nome seguir o retrato.
  useEffect(() => {
    if (!inst) return;
    inst
      .select(sel)
      .then(() => setEst({ ...inst.state }))
      .catch(() => undefined);
  }, [inst, sel]);
  useEffect(() => {
    if (!inst) return;
    inst.setPaused(paused);
    setEst({ ...inst.state });
  }, [inst, paused]);

  const imgDe = useCallback((id: string) => portraitRef.current?.querySelector<HTMLImageElement>(`img[data-id="${id}"]`) ?? null, []);

  // Fallback (sem módulo): o escolhido só assume quando carregado e decodificado; vale a última escolha.
  useEffect(() => {
    const n = ++pedidoRef.current;
    if (sel === shown) return;
    const img = imgDe(sel);
    if (inst || !desktop || errosRef.current[sel] || !img) {
      setShown(sel);
      return;
    }
    img.loading = "eager";
    img
      .decode()
      .catch(() => {
        // decode() também rejeita em troca de src; falha real = sem pixels depois de completo.
        if (img.complete && img.naturalWidth === 0) falhou(sel)();
      })
      .finally(() => {
        if (n === pedidoRef.current) setShown(sel);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, desktop, imgDe, inst]);

  // Desktop: sempre exatamente um integrante aberto (ao crescer a janela com tudo fechado).
  useEffect(() => {
    if (!desktop) return;
    const list = sectionRef.current;
    if (!list || list.querySelector("details[data-id][open]")) return;
    const d = list.querySelector<HTMLDetailsElement>(`details[data-id="${sel}"]`);
    if (d) d.open = true;
  }, [desktop, sel]);

  const onToggle = (id: string) => (e: SyntheticEvent<HTMLDetailsElement>) => {
    if (e.currentTarget.open) setSel(id);
  };
  const onSummaryClick = (e: MouseEvent<HTMLElement>) => {
    const d = e.currentTarget.parentElement as HTMLDetailsElement | null;
    if (d?.open && window.matchMedia(DESKTOP).matches) e.preventDefault();
  };

  const comModulo = !!inst;
  // Pessoa VISÍVEL no retrato. O módulo só troca `ativo` no fim; mas em `recompondo` quem aparece
  // (pontos se fundindo na foto) já é o pedido. Em `desfazendo`/`transformando` segue a última vista.
  const vistoRef = useRef<string | null>(null);
  if (comModulo && est) {
    if (est.fase === "recompondo") vistoRef.current = est.pedido;
    else if (est.fase !== "desfazendo" && est.fase !== "transformando") vistoRef.current = est.ativo;
    else vistoRef.current ??= est.ativo;
  } else vistoRef.current = null;
  const naTela = comModulo ? vistoRef.current : shown;
  const pendente = comModulo ? est?.fase === "carregando" : sel !== shown; // transformação não é carregamento
  const mostrado = TIME.find((m) => m.id === naTela);
  // Pessoa SOLICITADA (lista) × pessoa MOSTRADA (retrato): diferem durante carregamento/transformação.
  const emTroca = comModulo ? !!est && est.pedido !== est.ativo : sel !== shown;
  const falhaTraduzida = locale === "en" && comModulo && est?.fase === "falha";
  const rotulo = mostrado ? `Retrato de ${mostrado.nome}${falhaTraduzida ? " — foto indisponível" : ""}` : "Retrato carregando";

  return (
    <section id="time" ref={sectionRef} className={styles.section} aria-labelledby="time-title">
      <div className="wrap">
        <header className={styles.header}>
          <p className={`eyebrow ${styles.eyebrow}`}>{t("Time")}</p>
          <h2 id="time-title" className={styles.title}>
            {t(TIME_TITULO)}
          </h2>
          <p className={styles.intro}>{t(TIME_INTRO)}</p>
        </header>

        <div className={styles.layout} data-js={js ? "" : undefined}>
          <div className={styles.portraitCol}>
            {/* Retrato grande (desktop). Nome acessível = pessoa efetivamente visível (não a solicitada). */}
            <div
              ref={portraitRef}
              className={styles.portrait}
              role={js ? "img" : undefined}
              aria-label={t(js ? rotulo : undefined)}
              aria-hidden={js ? undefined : true}
              aria-busy={js && emTroca ? true : undefined}
              data-shown={shown}
              data-motor={comModulo ? "modulo" : js && fabrica === "falhou" ? "fallback" : undefined}
              data-fase={est?.fase}
              data-ativo={comModulo ? (est?.ativo ?? undefined) : shown}
              data-visivel={naTela ?? undefined}
              data-pedido={sel}
              data-pendente={pendente ? "" : undefined}
            >
              {TIME.map((m) => (
                <Retrato key={m.id} m={m} sizes="(min-width: 1280px) 440px, 38vw" className={styles.portraitImg} alt={t("")} onErro={falhou(m.id)} erro={!!erros[m.id]} />
              ))}
              {/* Raiz do módulo do Motion: ele cria img.rp-foto, canvas.rp-pontos e div.rp-falha. */}
              <div ref={stageRef} className={styles.stage} hidden={falhaTraduzida} />
              {falhaTraduzida && <p className={styles.failure} data-portrait-failure="">{t(rotulo)}</p>}
            </div>
            {js && (
              <div className={styles.portraitBar}>
                <span className={styles.portraitName} aria-hidden="true">
                  {t(mostrado?.nome ?? "\u00a0")}
                  {pendente && <span className={styles.loading}> {t("· carregando foto")}</span>}
                </span>
              </div>
            )}
          </div>

          <ol id="time-lista" className={styles.list}>
            {TIME.map((m, i) => (
              <li key={m.id} className={styles.item}>
                <details name="time" open={i === 0} data-id={m.id} className={styles.member} onToggle={onToggle(m.id)}>
                  <summary className={styles.summary} onClick={onSummaryClick} onPointerEnter={(e) => e.pointerType === "mouse" && inst?.preload(m.id).catch(() => undefined)}>
                    <span className={styles.num} aria-hidden="true">
                      {t(String(i + 1).padStart(2, "0"))}
                    </span>
                    <span className={styles.who}>
                      <span className={styles.name}>{t(m.nome)}</span>
                      <span className={styles.role}>{t(m.funcao)}</span>
                    </span>
                    <span className={styles.chev} aria-hidden="true" />
                  </summary>
                  <div className={styles.body}>
                    <Retrato m={m} sizes="(max-width: 959px) 148px, 1px" className={styles.inlineImg} alt={t(m.alt)} onErro={falhou(m.id)} erro={!!erros[m.id]} />
                    <div className={styles.text}>
                      <p className={styles.resumo}>{t(m.bio[0])}</p>
                      {m.bio.length > 1 && (
                        <details className={styles.more}>
                          <summary className={styles.moreSummary}>
                            {t("Ler biografia")}<span className={styles.sr}> {t("de")}{" "}{m.nome}</span>
                          </summary>
                          <p className={styles.resto}>{t(m.bio.slice(1).join(" "))}</p>
                        </details>
                      )}
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </div>

        <p className={`ill-note ${styles.nota}`}>{t(TIME_NOTA)}</p>
      </div>
    </section>
  );
}
