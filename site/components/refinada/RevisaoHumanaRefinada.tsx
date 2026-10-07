"use client";

import { useEffect, useRef, useState } from "react";
import { paisagemDe, VERSAO_PADRAO } from "@/lib/topo-paisagens";
import { useMotionPaused } from "@/lib/motion-prefs";
import { usePrefersReducedMotion } from "../motion/usePrefersReducedMotion";
import { carregarTopoRevisao, encerramentoRevisao, fraseAtiva, progressoRevisao, type TopoRevisao } from "@/lib/topo-revisao";
import styles from "./RevisaoHumanaRefinada.module.css";

/**
 * Fechamento da Ciência na /previa/refinada: as quatro frases sobre revisão humana e a paisagem
 * topográfica numa única composição. Componente PRÓPRIO da refinada — o TopoLandscape usado em
 * /previa, /a, /b e / continua intacto (só reaproveitamos a geometria `ridgeLines`, sem alterá-la).
 *
 *  · Texto: um <p> com as quatro frases, todas visíveis desde o início (nenhuma é revelada pela
 *    animação). Uma marca dourada discreta acompanha a frase do trecho; no estado estático ela fica
 *    na última ("A decisão permanece humana.").
 *  · Gráfico: SVG decorativo (aria-hidden), mesma geometria e proporção da paisagem original, com
 *    margem acima dos cumes (sem corte) e recorte só nas laterais em telas estreitas.
 *  · Progresso: fonte única no Site (lib/topo-revisao.ts) — posição real da composição, reversível,
 *    recalculada em scroll/resize/layout; entregue ao módulo do Motion (topo-revisao 0.1.0, trecho
 *    luminoso dourado sobre as curvas, terreno parado) por setProgresso(p), com progresso: 'externo'.
 *  · Paisagem versionada (lib/topo-paisagens.ts): padrão 0.3.0 (montanha do Motion + encerramento crista → arco:
 *    depois de p = 1, um segundo progresso `e`, também calculado aqui, conduz o brilho até o arco; a decisão segue
 *    dourada). 0.2.0 e 0.1.0 preservadas para comparação (?paisagem=0.2.0, ?paisagem=0.1.0).
 *    Rolagem normal: nada de scroll hijacking, pin ou altura extra.
 *  · Sem JS, pausa, movimento reduzido ou falha do módulo: composição estática completa (o SVG do Site).
 */
// Atributos do SVG em dados → props do React (kebab-case → camelCase, exceto data-* e aria-*).
const camel = (k: string) => (k.startsWith("data-") || k.startsWith("aria-") ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));
const atributos = (a: Record<string, string>) => Object.fromEntries(Object.entries(a).map(([k, v]) => [camel(k), v]));

const FRASES = ["O modelo sugere.", "O radiologista revisa.", "O médico contextualiza.", "A decisão permanece humana."] as const;

export function RevisaoHumanaRefinada() {
  const compRef = useRef<HTMLDivElement>(null);
  const frasesRef = useRef<HTMLParagraphElement>(null);
  const paisagemRef = useRef<HTMLDivElement>(null);
  const ultimaRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const paused = useMotionPaused();
  const reduced = usePrefersReducedMotion();
  const estatico = paused || reduced;
  const [ativa, setAtiva] = useState<number | null>(null); // null = estático (marca na última)
  const [motor, setMotor] = useState<"modulo" | "falhou" | null>(null);
  const rendRef = useRef<TopoRevisao | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  // Versão da paisagem: a padrão no SSR; ?paisagem=<versão> troca no cliente (só para comparação).
  const [versao, setVersao] = useState(VERSAO_PADRAO);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("paisagem");
    if (v && paisagemDe(v).versao === v) setVersao(v);
  }, []);
  const pais = paisagemDe(versao);

  // Progresso (FONTE ÚNICA). Só ouve scroll/resize/layout; nenhum laço contínuo.
  useEffect(() => {
    const comp = compRef.current;
    const area = paisagemRef.current;
    const ultima = ultimaRef.current;
    if (!comp || !area || !ultima) return;
    const comEncerramento = !!pais.encerramento;
    if (estatico) {
      comp.style.setProperty("--p", "1");
      comp.dataset.progresso = "1";
      comp.dataset.encerramento = comEncerramento ? "1" : "0";
      setAtiva(null);
      return;
    }
    let pedido = 0;
    const medir = () => {
      pedido = 0;
      const rc = comp.getBoundingClientRect(), ra = area.getBoundingClientRect(), ru = ultima.getBoundingClientRect(), vh = window.innerHeight;
      // p (frases): a MESMA fórmula de antes. e (encerramento, 0.3.0+): de p = 1 até o topo da área a --header-h + 12.
      const p = progressoRevisao(rc, ra, ru, vh);
      let e = 0;
      if (comEncerramento && p >= 1) {
        const cab = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72;
        e = encerramentoRevisao(rc, ra, ru, vh, cab + 12);
      }
      const v = p.toFixed(4), ve = e.toFixed(4);
      if (comp.dataset.progresso !== v) {
        comp.dataset.progresso = v;
        comp.style.setProperty("--p", v);
      }
      if (comp.dataset.encerramento !== ve) comp.dataset.encerramento = ve;
      rendRef.current?.setProgresso(p, e); // fonte única: o módulo só recebe p e e
      setAtiva(fraseAtiva(p)); // a marca fica na 4ª frase durante todo o encerramento
    };
    const agendar = () => {
      if (!pedido) pedido = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    const ro = new ResizeObserver(agendar);
    ro.observe(comp);
    return () => {
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      ro.disconnect();
      if (pedido) cancelAnimationFrame(pedido);
    };
  }, [estatico, motor, pais.encerramento]);

  // Módulo do Motion (trecho luminoso nas curvas), montado uma vez; progresso SEMPRE vindo do Site.
  useEffect(() => {
    let vivo = true;
    let r: TopoRevisao | null = null;
    setMotor(null);
    carregarTopoRevisao(pais.modulo)
      .then((f) => {
        const svg = svgRef.current;
        if (!vivo || !svg) return;
        r = f(svg, { alvo: compRef.current ?? undefined, frase: frasesRef.current, progresso: "externo", paused: pausedRef.current, reducedMotion: "auto" });
        rendRef.current = r;
        r.setProgresso(Number(compRef.current?.dataset.progresso ?? 1), Number(compRef.current?.dataset.encerramento ?? 1));
        setMotor("modulo");
      })
      .catch(() => vivo && setMotor("falhou"));
    return () => {
      vivo = false;
      try {
        r?.destroy();
      } catch {
        /* nada */
      }
      rendRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao]);
  useEffect(() => {
    try {
      rendRef.current?.setPaused(paused);
    } catch {
      setMotor("falhou");
    }
  }, [paused, motor]);

  const marca = ativa ?? 3;

  return (
    <div ref={compRef} className={styles.comp} data-paisagem={pais.versao} data-enquadramento={pais.enquadramento} data-com-encerramento={pais.encerramento ? "" : undefined} data-frase-ativa={marca} data-motor={motor ?? undefined} data-estatico={ativa === null ? "" : undefined}>
      <p ref={frasesRef} id="ciencia-revisao" className={styles.frases}>
        {FRASES.map((f, i) => (
          <span key={f} ref={i === 3 ? ultimaRef : undefined} className={`${styles.frase} ${i === 3 ? styles.decisao : ""}`} data-i={i} data-ativa={i === marca ? "" : undefined}>
            {f}
          </span>
        ))}
      </p>
      <div ref={paisagemRef} className={styles.paisagem} aria-hidden="true">
        {pais.dados ? (
          // 0.2.0+: SVG montado dos DADOS do Motion (atributos, <defs>, caminhos em ordem) — mesmo markup do SVG
          // estático do Motion; `data-topo-geometria` diz ao módulo qual coreografia usar.
          <svg key={pais.versao} ref={svgRef} className={styles.svg} {...atributos(pais.dados.svgAtributos)}>
            <defs dangerouslySetInnerHTML={{ __html: pais.dados.defs }} />
            {pais.dados.elementos.map((e, i) => (
              <path key={i} {...atributos(e)} />
            ))}
          </svg>
        ) : (
          <svg key={pais.versao} ref={svgRef} className={styles.svg} viewBox={pais.viewBox.join(" ")} preserveAspectRatio={pais.preserveAspectRatio} focusable="false">
            {pais.linhas.map((l, i) =>
              l.ouro ? (
                <path key={i} d={l.d} fill="none" stroke={l.stroke} strokeWidth={l.width} data-topo-ouro="" />
              ) : (
                <path key={i} d={l.d} fill="none" stroke={l.stroke} strokeOpacity={l.opacity} strokeWidth={l.width} data-topo-linha="" />
              ),
            )}
          </svg>
        )}
      </div>
      <span className={`ill-note ${styles.nota}`} aria-hidden="true">
        Representação conceitual da revisão humana
      </span>
    </div>
  );
}
