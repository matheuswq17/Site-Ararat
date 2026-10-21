/* Demonstração guiada OPCIONAL (Plataforma). Módulo do Motion: plataforma-fluxo 0.8.0-03d2 + manifesto r2, SEM
 * alteração (sha256 conferidos com portfolio-motion-v1). Assets: capturas reais do pacote plataforma-fluxo-0.1.0.
 * Progresso NÃO vem da rolagem: o visitante escolhe a etapa (7) e, na etapa 6, uma parada de leitura; o Site leva p
 * até a parada com uma transição curta, sem reprodução automática.
 * RITMO desta rodada (14/10): CURTO é o padrão — dist × 5000 ms, 600–1200 ms (recomendação do Motion e da auditoria).
 * Na revisão privada, ?ritmo=atual (dist × 7000, 900–3600) e ?ritmo=curto continuam para comparação.
 * aria-busy no palco ao carregar e em cada passagem; encerrado ao concluir, cancelar, pausar, falhar ou fechar.
 * Pausa (preferência do site), movimento reduzido ou falha: a etapa mostra as capturas estáticas. */
import { importarExterno, parametro } from "./externo";
import type { Movimento } from "./movimento";

type Img = { src: string; w: number; h: number; alt: string; hub?: boolean };
type Etapa = { p: number; titulo: string; texto: string; aviso: string; avisoTipo?: string; detalhe: string; imagens: Img[]; leituras?: Array<{ p: number; rotulo: string; texto: string; principal?: boolean; imagens: Img[] }> };
type Dados = { rotulos: Record<string, string>; etapas: Etapa[]; pacote: string; assets: string };
type Fluxo = { setProgresso(p: number): void; setPaused(p: boolean): void; destroy(): void };

export const RITMOS = {
  curto: (d: number) => Math.min(1200, Math.max(600, d * 5000)),
  atual: (d: number) => Math.min(3600, Math.max(900, d * 7000)),
};

export function montarDemo(raiz: HTMLElement, { pref }: { pref: Movimento }): () => void {
  const D = JSON.parse(raiz.querySelector('script[type="application/json"]')!.textContent!) as Dados;
  const R = D.rotulos, E = D.etapas;
  const RITMO: keyof typeof RITMOS = parametro("ritmo") === "atual" ? "atual" : "curto";
  const DURACAO = RITMOS[RITMO];
  const abrirBtn = raiz.querySelector<HTMLButtonElement>("[data-demo-abrir]")!;
  const dlg = raiz.querySelector<HTMLDialogElement>("dialog")!;
  const palco = dlg.querySelector<HTMLElement>("[data-palco]")!;
  const host = dlg.querySelector<HTMLElement>("[data-palco-host]")!;
  const est = dlg.querySelector<HTMLElement>("[data-palco-estatico]")!;
  const estado = dlg.querySelector<HTMLElement>("[data-palco-estado]");
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => dlg.querySelector<T>(s)!;
  let mod: Fluxo | null = null, p = 0, raf = 0, i = 0, k = 0;
  dlg.dataset.fluxo = "0.8.0-03d2"; dlg.dataset.ritmo = RITMO;
  const ocupado = { carregando: false, passagem: false };
  const marcarOcupado = () => { if (ocupado.carregando || ocupado.passagem) palco.setAttribute("aria-busy", "true"); else palco.removeAttribute("aria-busy"); };
  const setOcupado = (c: keyof typeof ocupado, v: boolean) => { ocupado[c] = v; marcarOcupado(); };
  const paradaAtual = () => (E[i].leituras ? E[i].leituras![k].p : E[i].p);
  const mqReduzido = matchMedia("(prefers-reduced-motion: reduce)");
  const reduzido = () => mqReduzido.matches;
  // timers de foco guardados: cancelados ao fechar, ao reabrir e na desmontagem (navegação rápida não foca nó solto)
  let tFoco = 0;
  const focarDepois = (alvo: () => HTMLElement | null) => {
    clearTimeout(tFoco);
    tFoco = window.setTimeout(() => { tFoco = 0; const el = alvo(); if (el && el.isConnected) el.focus({ preventScroll: true }); }, 0);
  };
  /** Conclui a passagem em curso na parada-alvo (pausa, aba oculta, movimento reduzido ativado no meio). */
  const assentar = () => { if (!raf || !mod) return; const alvo = +dlg.dataset.alvo!; encerrarPassagem(); p = alvo; mod.setProgresso(alvo); };

  function encerrarPassagem() { cancelAnimationFrame(raf); raf = 0; delete dlg.dataset.transicao; setOcupado("passagem", false); }
  function ir(alvo: number, inst?: boolean) {
    encerrarPassagem();
    if (!mod) { p = alvo; return; }
    const de = p, dist = Math.abs(alvo - de);
    if (inst || reduzido() || pref.pausado() || dist < 0.001) { p = alvo; mod.setProgresso(alvo); return; }
    const dur = DURACAO(dist), t0 = performance.now();
    dlg.dataset.transicao = "1"; dlg.dataset.alvo = String(alvo); setOcupado("passagem", true);
    const passo = (agora: number) => {
      const f = Math.min(1, (agora - t0) / dur);
      p = de + (alvo - de) * f; mod!.setProgresso(p);
      if (f < 1) raf = requestAnimationFrame(passo); else encerrarPassagem();
    };
    raf = requestAnimationFrame(passo);
  }

  function desenhar() {
    const e = E[i];
    $("[data-n]").textContent = `${R.etapa} ${i + 1} ${R.de} ${E.length}`;
    $("[data-titulo]").textContent = e.titulo;
    const txt = e.leituras ? (e.leituras[k].texto || e.texto) : e.texto;
    $("[data-texto]").textContent = txt;
    $("[data-aviso]").textContent = e.aviso;
    $("[data-aviso]").dataset.tipo = e.avisoTipo || "origem";
    $("[data-detalhe]").textContent = e.detalhe;
    $("[data-detalhe-desc]").textContent = txt;
    const lt = $("[data-leituras]");
    lt.hidden = !e.leituras;
    if (!e.leituras) { lt.innerHTML = ""; delete lt.dataset.etapa; }
    else {
      if (lt.dataset.etapa !== String(i)) {
        lt.innerHTML = ""; lt.dataset.etapa = String(i);
        e.leituras.forEach((l, j) => {
          const b = document.createElement("button");
          b.type = "button"; b.textContent = l.rotulo; b.dataset.p = String(l.p); b.dataset.j = String(j);
          b.addEventListener("click", () => { if (k === j) return; k = j; desenhar(); ir(paradaAtual()); });
          lt.append(b);
        });
      }
      [...lt.children].forEach((b, j) => b.setAttribute("aria-pressed", String(j === k)));
    }
    $<HTMLButtonElement>("[data-anterior]").disabled = i === 0;
    $<HTMLButtonElement>("[data-proxima]").disabled = i === E.length - 1;
    dlg.querySelectorAll<HTMLElement>("[data-pontos] span").forEach((s, j) => { s.dataset.on = j <= i ? "1" : "0"; });
    dlg.dataset.etapa = String(i + 1);
    dlg.dataset.parada = String(paradaAtual());
    const imgs = e.leituras ? e.leituras[k].imagens : e.imagens;
    est.replaceChildren(...imgs.map((im) => {
      const n = document.createElement("img");
      n.src = D.assets + im.src; n.width = im.w; n.height = im.h; n.alt = im.alt; n.style.background = im.hub ? "#fff" : "#0b0c0e";
      n.className = im.hub ? "cap ui" : "cap"; n.style.setProperty("--nat", String(im.w)); // teto técnico pela largura natural
      return n;
    }));
  }

  function definirModo(m: "carregando" | "animado" | "estatico" | "falha") {
    dlg.dataset.modo = m === "falha" ? "estatico" : m;
    host.style.visibility = m === "animado" ? "visible" : "hidden";
    est.hidden = !(m === "estatico" || m === "falha");
    // mensagem de estado FORA do quadro, em texto legível (carregando / falha); some quando o palco está pronto
    if (estado) {
      estado.hidden = !(m === "carregando" || m === "falha");
      estado.textContent = m === "carregando" ? R.carregando : m === "falha" ? R.falha : "";
    }
  }

  let sessao = 0;
  async function montar() {
    const minha = ++sessao;
    definirModo("carregando"); setOcupado("carregando", true);
    try {
      if (parametro("demo") === "falha") throw new Error("falha simulada");
      const M = await importarExterno<{ createPlataformaFluxo(h: HTMLElement, o: unknown): Fluxo }>(D.pacote + "plataforma-fluxo.js");
      if (minha !== sessao || !dlg.open) return;
      mod = M.createPlataformaFluxo(host, {
        palco, base: D.assets, progresso: "externo", paused: pref.pausado(), reducedMotion: "auto",
        onEstado: (s: { modo: string }) => { if (minha === sessao) definirModo(s.modo === "animado" ? "animado" : "estatico"); },
      });
      definirModo(host.dataset.fluxoModo === "animado" ? "animado" : "estatico");
      pref.registrar("demo", (pa) => {
        if (!mod) return;
        mod.setPaused(pa);
        if (pa) assentar();
      });
      ir(paradaAtual(), true);
      setOcupado("carregando", false);
      (window as unknown as { __demo: unknown }).__demo = { mod, M, versao: "0.8.0-03d2", ritmo: RITMO, ir, sessao: minha, get p() { return p; } };
    } catch {
      if (minha === sessao) { definirModo("falha"); setOcupado("carregando", false); }
    }
  }

  function desmontar() {
    sessao++; encerrarPassagem(); setOcupado("carregando", false);
    mod?.destroy(); mod = null; p = 0; pref.remover("demo");
    palco.querySelectorAll(":scope > :not([data-palco-host]):not([data-palco-estatico]):not([data-palco-estado])").forEach((n) => n.remove());
    (window as unknown as { __demo: unknown }).__demo = null;
  }

  function etapa(n: number) { i = Math.max(0, Math.min(E.length - 1, n)); k = E[i].leituras ? E[i].leituras!.findIndex((l) => l.principal) : 0; if (k < 0) k = 0; desenhar(); ir(paradaAtual()); }

  const ouv: Array<[EventTarget, string, EventListener]> = [];
  const on = (el: EventTarget, ev: string, fn: EventListener) => { el.addEventListener(ev, fn); ouv.push([el, ev, fn]); };
  abrirBtn.hidden = false;
  raiz.querySelector("[data-demo-semjs]")?.setAttribute("hidden", "");
  let retorno: HTMLElement = abrirBtn;
  document.querySelectorAll<HTMLElement>("[data-demo-atalho]").forEach((a) => on(a, "click", (e) => { e.preventDefault(); abrirBtn.click(); retorno = a; }));
  on(abrirBtn, "click", () => {
    if (dlg.open) return;
    retorno = abrirBtn;
    i = 0; k = 0; delete $("[data-leituras]").dataset.etapa; desenhar(); dlg.showModal(); montar();
    focarDepois(() => $("[data-proxima]"));
  });
  on($("[data-anterior]"), "click", () => etapa(i - 1));
  on($("[data-proxima]"), "click", () => etapa(i + 1));
  on($("[data-sair]"), "click", () => dlg.close());
  on(dlg, "close", () => {
    desmontar();
    focarDepois(() => (retorno.isConnected ? retorno : abrirBtn));
  });
  on(dlg, "keydown", (ev) => {
    const e = ev as KeyboardEvent;
    if (e.key !== "Tab") return;
    const f = [...dlg.querySelectorAll<HTMLElement>("button:not([disabled]):not([hidden]), summary, a[href]")].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });
  // aba oculta no meio de uma passagem: conclui na parada pelo mesmo caminho da pausa (Motion, correção opcional §4)
  on(document, "visibilitychange", () => {
    if (document.visibilityState === "hidden") assentar();
  });
  // movimento reduzido ativado no meio de uma passagem: o controlador também para no alvo (o módulo já reage sozinho)
  on(mqReduzido, "change", () => { if (mqReduzido.matches) assentar(); });
  const pedido = parametro("demo");
  if (pedido === "abrir" || pedido === "falha") {
    abrirBtn.click(); const n = +(parametro("etapa") || 0); if (n) etapa(n - 1);
  }

  return () => {
    if (dlg.open) dlg.close();
    desmontar();
    clearTimeout(tFoco); tFoco = 0;
    ouv.splice(0).forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    abrirBtn.hidden = true;
    raiz.querySelector("[data-demo-semjs]")?.removeAttribute("hidden");
  };
}
