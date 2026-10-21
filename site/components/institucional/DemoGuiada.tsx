"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { carregarPlataformaFluxo, type PlataformaFluxoModulo } from "@/lib/plataforma-fluxo";
import { useMotionPaused } from "@/lib/motion-prefs";
import { prenderFoco } from "@/lib/institucional/foco";
import s from "./Institucional.module.css";

type Img = { src: string; w: number; h: number; alt: string; produto: "hub" | "viewer" };
export type EtapaDemo = { id: string; n: string; parada: number; titulo: string; texto: string; imagens: Img[] };
type Rotulos = { iniciar: string; sair: string; anterior: string; proxima: string; etapa: string; de: string; titulo: string; origem: string };

/**
 * Demonstração guiada opcional. Entrada: botão. Saída: "Sair", Esc ou fechar o diálogo; o foco volta ao botão de
 * entrada e a página fica onde estava. Avanço: SÓ pelos botões de etapa (o Site leva o progresso do módulo até a
 * parada da etapa com uma transição curta; o módulo não tem relógio). Pausa, movimento reduzido ou falha do módulo:
 * a etapa aparece com as capturas estáticas.
 */
export function DemoGuiada({ etapas, modulo, rotulos }: { etapas: EtapaDemo[]; modulo: { url: string; base: string; exportName: string; versao: string }; rotulos: Rotulos }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const mod = useRef<PlataformaFluxoModulo | null>(null);
  const p = useRef(0);
  const raf = useRef(0);
  const [aberta, setAberta] = useState(false);
  const [i, setI] = useState(0);
  const [modo, setModo] = useState<"carregando" | "animado" | "estatico">("carregando");
  const pausado = useMotionPaused();

  const ir = useCallback((alvo: number, instantaneo = false) => {
    cancelAnimationFrame(raf.current);
    const m = mod.current;
    if (!m) { p.current = alvo; return; }
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const de = p.current, dist = Math.abs(alvo - de);
    if (instantaneo || reduzido || dist < 0.001) { p.current = alvo; m.setProgresso(alvo); return; }
    const dur = Math.min(3600, Math.max(900, dist * 7000));
    const t0 = performance.now();
    const passo = (agora: number) => {
      const k = Math.min(1, (agora - t0) / dur);
      p.current = de + (alvo - de) * k;
      m.setProgresso(p.current);
      if (k < 1) raf.current = requestAnimationFrame(passo);
    };
    raf.current = requestAnimationFrame(passo);
  }, []);

  // monta o módulo ao abrir; desmonta ao fechar
  useEffect(() => {
    if (!aberta) return;
    const h = host.current, pc = palco.current;
    if (!h || !pc) return;
    let vivo = true;
    setModo("carregando");
    (async () => {
      try {
        const { criar } = await carregarPlataformaFluxo(modulo);
        if (!vivo) return;
        mod.current = criar(h, {
          palco: pc,
          base: modulo.base,
          progresso: "externo",
          paused: pausado,
          reducedMotion: "auto",
          onEstado: (e) => { if (vivo) setModo(e.modo === "animado" ? "animado" : "estatico"); },
        });
        setModo(h.dataset.fluxoModo === "animado" ? "animado" : "estatico");
        ir(etapas[i].parada, true);
      } catch {
        if (vivo) setModo("estatico");
      }
    })();
    return () => {
      vivo = false;
      cancelAnimationFrame(raf.current);
      mod.current?.destroy();
      mod.current = null;
      p.current = 0;
    };
    // a etapa inicial só importa na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberta, modulo]);

  useEffect(() => { mod.current?.setPaused(pausado); }, [pausado]);
  useEffect(() => (dlg.current ? prenderFoco(dlg.current) : undefined), []);

  const abrir = () => {
    const d = dlg.current;
    if (!d) return;
    setI(0);
    d.showModal();
    setAberta(true);
  };
  const fechar = () => dlg.current?.close();
  const etapa = (n: number) => {
    const k = Math.max(0, Math.min(etapas.length - 1, n));
    setI(k);
    ir(etapas[k].parada);
  };
  const e = etapas[i];

  return (
    <>
      <button ref={botao} type="button" className={s.btn} onClick={abrir} data-demo-abrir="">{rotulos.iniciar}</button>
      <dialog
        ref={dlg}
        className={s.demo}
        aria-labelledby="demo-t"
        onClose={() => { setAberta(false); setTimeout(() => botao.current?.focus({ preventScroll: true }), 0); }}
        data-demo=""
        data-demo-modo={modo}
        data-demo-etapa={i + 1}
      >
        <div className={s.demoBarra}>
          <span className={`${s.mono} ${s.muted} ${s.rot}`}>{rotulos.titulo}</span>
          <span className={s.mono} aria-live="polite">{rotulos.etapa} {i + 1} {rotulos.de} {etapas.length}</span>
          <button type="button" className={`${s.btn} ${s.btnSec} ${s.sair}`} onClick={fechar} data-demo-sair="">{rotulos.sair} ✕</button>
        </div>
        <div className={s.demoCorpo}>
          <div className={s.demoTexto}>
            <p className={`${s.mono} ${s.muted}`}>{e.n}</p>
            <h2 id="demo-t">{e.titulo}</h2>
            <p className={s.muted}>{e.texto}</p>
            <div className={s.demoCtrl}>
              <button type="button" className={`${s.btn} ${s.btnSec}`} onClick={() => etapa(i - 1)} disabled={i === 0} data-demo-anterior="">← {rotulos.anterior}</button>
              <button type="button" className={s.btn} onClick={() => etapa(i + 1)} disabled={i === etapas.length - 1} data-demo-proxima="">{rotulos.proxima} →</button>
            </div>
            <div className={s.progresso} aria-hidden="true">{etapas.map((x, k) => <span key={x.id} data-on={k <= i ? "1" : "0"} />)}</div>
            <p className={s.origem} style={{ color: "#9a9a9a" }}>{rotulos.origem}</p>
          </div>
          <div className={s.palco} ref={palco}>
            <div className={s.palcoHost} ref={host} aria-hidden="true" style={{ visibility: modo === "estatico" ? "hidden" : "visible" }} />
            {modo === "estatico" ? (
              <div className={s.palcoEstatico} data-demo-estatico="">
                {e.imagens.map((im) => (
                  // eslint-disable-next-line @next/next/no-img-element -- capturas do roteiro estático
                  <img key={im.src} src={im.src} width={im.w} height={im.h} alt={im.alt} style={{ background: im.produto === "hub" ? "#fff" : "#0b0c0e" }} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
