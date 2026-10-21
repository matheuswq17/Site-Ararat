"use client";

import { useLayoutEffect } from "react";
import { consumirTravessia, focarDestinoDaNavegacao } from "@/lib/ararat/cliente/transicao";

/**
 * Transição entre páginas — CANDIDATO PRIVADO, coreografia "A" do Motion
 * (docs/coordination/MONTANHA-LUZ-E-TRANSICOES-MOTION-2026-10-14.md §3):
 *  - o conteúdo antigo sai de uma vez no commit da rota (um único <main>, nunca dois visíveis juntos);
 *  - o novo entra em 180 ms (opacidade 0 → 1, 6 px → 0, cubic-bezier(.23,1,.32,1)) — styles/ararat/transicoes.css;
 *  - fechamento 14/10 (proposta ao Motion): quem entra é o CONTEÚDO de cada seção; o fundo de cada seção aparece
 *    inteiro no commit. Nada fica transparente sobre o papel do <body> — nem clarão no topo escuro, nem pulso escuro
 *    numa seção clara (a solução anterior, fundo escuro global durante a entrada, criava esse pulso);
 *  - voltar/avançar: só opacidade (sem os 6 px), para o palco fixo do Atlas e a rolagem restaurada não se moverem;
 *  - cabeçalho e rodapé não animam; nada espera: a animação começa no mesmo quadro em que a página nova aparece;
 *  - carga direta, modo "atual", movimento reduzido e site pausado: sem entrada;
 *  - foco no destino no próprio commit (microtarefa, antes da pintura e depois do foco padrão do Next).
 * useLayoutEffect: a classe entra antes da primeira pintura da página nova (sem um quadro "cheio" antes do fade).
 */
let caminhoAnterior: string | null = null;

export function EntradaPagina() {
  useLayoutEffect(() => {
    const travessia = consumirTravessia(); // voltar/avançar (sempre consumido, em qualquer modo)
    const antes = caminhoAnterior;
    caminhoAnterior = location.pathname;
    if (antes === null || antes === location.pathname) return; // primeira página do documento (ou a mesma): sem entrada
    const html = document.documentElement;
    if (html.dataset.transicao !== "candidata") return;
    queueMicrotask(() => { focarDestinoDaNavegacao(travessia); });
    if (html.dataset.movimento === "pausado" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.getElementById("conteudo");
    if (!main) return;
    const soOpacidade = travessia;
    main.classList.add("pagina-entra");
    if (soOpacidade) main.classList.add("so-opacidade");
    const limpar = () => { main.classList.remove("pagina-entra", "so-opacidade"); };
    const fim = (e: AnimationEvent) => { if (e.animationName.startsWith("ararat-pagina-entra")) limpar(); };
    main.addEventListener("animationend", fim);
    main.addEventListener("animationcancel", fim);
    return () => { main.removeEventListener("animationend", fim); main.removeEventListener("animationcancel", fim); limpar(); };
  }, []);
  return null;
}
