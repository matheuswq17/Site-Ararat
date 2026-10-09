"use client";

import { useEffect } from "react";
import { applyMotionAttribute, useMotionPaused } from "@/lib/motion-prefs";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import "./entrada-editorial.css";

/**
 * Revelação editorial de títulos, parágrafos selecionados e listas marcados com
 * data-reveal="title|text|soft|list". Só esconde (estado "pending") blocos que
 * ainda estão ABAIXO da viewport no momento da montagem — nada que já foi visto
 * desaparece. Cada bloco anima uma vez ao entrar na área útil. Sem JS, com
 * movimento reduzido ou pausa global, tudo fica no estado final.
 * Foco por teclado dentro de um bloco pendente o mostra imediatamente.
 *
 * Modo `editorial` (refinada: "/", "/pt", /previa/refinada — as quatro identidades):
 *  · títulos de seção (h2) entram como BLOCO (data-reveal-bloco), sem separar palavras;
 *  · o rótulo pequeno da seção (.eyebrow que precede o título) entra primeiro (data-reveal="rotulo") e o título
 *    acompanha com o atraso do token --entrada-atraso-titulo; rótulo e título disparam juntos (um só gatilho);
 *  · a pergunta estudada na Ciência: o filete junto ao bloco se desenha (data-reveal="fio"); o texto não se move;
 *  · âncora aberta (hash inicial, clique em link interno, hashchange): a seção de destino fica no estado final na
 *    hora, sem esperar entrada.
 * As marcas são postas aqui, no cliente: o HTML do servidor nunca traz nada escondido. Ficam de fora a 1ª dobra,
 * a Jornada e os módulos do Motion (montanha, Jornada, Ciência, Time, Hub/Viewer).
 * Estilo: entrada-editorial.css (comportamento) + tokens de cada identidade.
 */
const FORA = "[data-opening], [data-fluxo], [data-topo], [class*='Topo'], [class*='topo']";

function marcarEditorial(): void {
  for (const s of Array.from(document.querySelectorAll<HTMLElement>("main section[id]"))) {
    if (s.id === "inicio" || s.id === "jornada") continue;
    const h = s.querySelector<HTMLElement>("h2");
    if (!h || h.closest(FORA)) continue;
    if (!h.dataset.reveal) h.dataset.reveal = "title";
    h.dataset.revealBloco = "";
    // rótulo: o .eyebrow do mesmo cabeçalho que vem ANTES do título
    const rot = Array.from(h.parentElement?.querySelectorAll<HTMLElement>(":scope > .eyebrow") ?? []).find(
      (e) => e.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    if (rot && !rot.dataset.reveal) {
      rot.dataset.reveal = "rotulo";
      h.dataset.revealComRotulo = "";
    }
  }
  // Pergunta estudada: o fio é o filete à esquerda que a identidade JÁ desenha junto ao bloco (na própria pergunta
  // ou no cartão da publicação). Largura e cor vêm do estilo calculado da identidade — nada é copiado entre
  // identidades — e o estado final é o mesmo filete, no mesmo lugar. Sem filete, desenha-se um fio novo (tokens).
  const q = document.querySelector<HTMLElement>('#ciencia [class*="__pubQuestion"]');
  if (q && !q.closest(FORA)) {
    const filete = (e: HTMLElement | null) => {
      if (!e) return null;
      const c = getComputedStyle(e);
      const w = parseFloat(c.borderLeftWidth);
      return c.borderLeftStyle !== "none" && w > 0 ? { w, cor: c.borderLeftColor } : null;
    };
    const host = filete(q) ? q : filete(q.parentElement) ? (q.parentElement as HTMLElement) : q;
    const f = filete(host);
    if (!host.dataset.reveal) {
      host.dataset.reveal = "fio";
      if (f) {
        host.style.setProperty("--fio-largura", `${f.w}px`);
        host.style.setProperty("--fio-cor", f.cor);
        host.style.setProperty("--fio-x", `${-f.w}px`);
        host.style.setProperty("--fio-topo", "0px");
        host.style.setProperty("--fio-base", "0px");
        host.style.borderLeftColor = "transparent";
      }
    }
  }
}

export function TextReveal({ editorial = false }: { editorial?: boolean }) {
  const paused = useMotionPaused();
  const reduced = usePrefersReducedMotion();

  // Estado de pausa salvo na aba → <html data-motion="paused"> após hidratar.
  useEffect(() => {
    applyMotionAttribute();
  }, []);

  useEffect(() => {
    if (editorial) marcarEditorial();
    const all = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const showAll = () => {
      for (const el of all) if (el.dataset.revealState === "pending") el.dataset.revealState = "shown";
    };
    if (paused || reduced || typeof IntersectionObserver === "undefined") {
      showAll();
      return;
    }

    // Rótulo e título entram juntos: o primeiro dos dois a entrar na área útil dispara o par.
    const par = (el: HTMLElement): HTMLElement[] => {
      if (el.dataset.reveal === "rotulo") {
        const h = el.parentElement?.querySelector<HTMLElement>(":scope > [data-reveal-com-rotulo]");
        return h ? [el, h] : [el];
      }
      if (el.dataset.revealComRotulo !== undefined) {
        const r = el.parentElement?.querySelector<HTMLElement>(':scope > [data-reveal="rotulo"]');
        return r ? [r, el] : [el];
      }
      return [el];
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          for (const el of par(e.target as HTMLElement)) {
            if (el.dataset.revealState !== "pending") continue;
            if (el.dataset.reveal === "list") {
              Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(i)));
            }
            el.dataset.revealState = "in";
            io.unobserve(el);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );

    const vh = window.innerHeight;
    for (const el of all) {
      if (el.dataset.revealState) continue; // já processado nesta página
      if (el.getBoundingClientRect().top > vh * 0.9) {
        el.dataset.revealState = "pending";
        io.observe(el);
      } else {
        el.dataset.revealState = "shown";
      }
    }

    // Estado final imediato (sem entrada) para tudo dentro de `alvo`.
    const mostrar = (alvo: Element | null) => {
      if (!alvo) return;
      const els = [alvo, ...Array.from(alvo.querySelectorAll<HTMLElement>('[data-reveal-state="pending"]'))];
      for (const el of els as HTMLElement[]) {
        if (el.dataset?.revealState !== "pending") continue;
        el.dataset.revealState = "shown";
        io.unobserve(el);
      }
    };
    const porHash = (hash: string) => {
      if (!hash || hash.length < 2) return;
      try {
        mostrar(document.getElementById(decodeURIComponent(hash.slice(1))));
      } catch {
        /* hash inválido: nada a fazer */
      }
    };
    porHash(window.location.hash);
    const onHash = () => porHash(window.location.hash);
    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      if (a) porHash(a.getAttribute("href") ?? "");
    };
    const onFocus = (ev: FocusEvent) => {
      const el = (ev.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-reveal-state="pending"]');
      if (el) {
        el.dataset.revealState = "shown";
        io.unobserve(el);
      }
      // foco num título/rótulo de seção: o par fica visível junto
      const sec = (ev.target as HTMLElement | null)?.closest?.("section[id]");
      if (sec && (ev.target as HTMLElement).matches?.("h2, h2 *, .eyebrow")) mostrar(sec.querySelector("header") ?? sec);
    };
    window.addEventListener("hashchange", onHash);
    document.addEventListener("click", onClick, true);
    document.addEventListener("focusin", onFocus);
    return () => {
      io.disconnect();
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("focusin", onFocus);
      showAll();
    };
  }, [paused, reduced, editorial]);

  return null;
}
