/* Transição entre páginas — CANDIDATO (revisão privada). O desenho e o mecanismo estão em styles/ararat/transicoes.css
 * e components/ararat/Cabeca.tsx. Aqui fica só o FOCO depois de uma navegação no app:
 *  - hoje, depois da troca de página, o foco cai no <body>: quem navega pelo teclado volta ao começo do documento;
 *  - no candidato, o foco vai ao destino: o título da seção pedida (âncora) ou o h1 da página nova — sem rolar
 *    (preventScroll) e só se ele estiver na tela;
 *  - voltar/avançar: a rolagem é restaurada DEPOIS da montagem; o foco espera dois quadros e vai ao primeiro título
 *    visível do conteúdo (nunca a um título fora da tela); sem nenhum visível, não mexe no foco.
 * Carga direta, recarga, troca de idioma (recarga) e âncora na mesma página não passam por aqui. */

let travessia = false; // voltar/avançar (popstate) — singleton do cliente, sobrevive à navegação
if (typeof window !== "undefined") addEventListener("popstate", () => { travessia = true; });

/** A navegação que acabou de ser aplicada veio de voltar/avançar? Lê e zera o sinal (EntradaPagina, a cada commit). */
export const consumirTravessia = () => { const t = travessia; travessia = false; return t; };

// "na tela" = inteiro abaixo do cabeçalho fixo e acima do fim da janela (um título sob o cabeçalho não serve de destino)
const naTela = (el: Element) => {
  const topo = (document.querySelector(".cab") as HTMLElement | null)?.getBoundingClientRect().bottom ?? 0;
  const r = el.getBoundingClientRect();
  return r.height > 0 && r.top >= topo - 1 && r.bottom <= innerHeight;
};
const focavel = (el: HTMLElement) => el.matches("a[href], button, input, select, textarea, summary, [tabindex]");

function focar(el: HTMLElement) {
  if (!focavel(el)) {
    el.setAttribute("tabindex", "-1");
    el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
  }
  el.focus({ preventScroll: true });
}

/** Chamada por EntradaPagina.tsx no commit de uma navegação no app (nunca na carga direta). Devolve o destino focado. */
export function focarDestinoDaNavegacao(travessiaAtual: boolean): HTMLElement | null {
  const atual = location.pathname;
  const main = document.getElementById("conteudo");
  if (!main) return null;
  if (travessiaAtual) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!main.isConnected || location.pathname !== atual) return;
      const t = [...main.querySelectorAll<HTMLElement>("h1, h2, h3")].find(naTela);
      if (t) focar(t);
    }));
    return null;
  }
  const id = decodeURIComponent(location.hash.slice(1));
  let alvo: HTMLElement | null = null;
  if (id) {
    const sec = document.getElementById(id);
    if (sec) alvo = sec.matches("h1, h2, h3") ? sec : (sec.querySelector<HTMLElement>("h1, h2, h3") ?? sec);
  }
  alvo ??= main.querySelector<HTMLElement>("h1");
  if (!alvo || !naTela(alvo)) alvo = [...main.querySelectorAll<HTMLElement>("h1, h2, h3")].find(naTela) ?? null;
  if (!alvo) return null;
  focar(alvo);
  return alvo;
}
