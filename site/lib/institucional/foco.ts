/**
 * Mantém o foco do teclado dentro de um <dialog> modal: Tab no último elemento volta ao primeiro e Shift+Tab no
 * primeiro vai ao último (o Chromium deixaria o foco sair para a interface do navegador). Devolve a função de remoção.
 */
export function prenderFoco(d: HTMLDialogElement): () => void {
  const sel = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';
  const tecla = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const el = [...d.querySelectorAll<HTMLElement>(sel)].filter((x) => x.offsetParent !== null || x === document.activeElement);
    if (!el.length) return;
    const primeiro = el[0], ultimo = el[el.length - 1];
    if (e.shiftKey && (document.activeElement === primeiro || !d.contains(document.activeElement))) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && (document.activeElement === ultimo || !d.contains(document.activeElement))) { e.preventDefault(); primeiro.focus(); }
  };
  d.addEventListener("keydown", tecla);
  return () => d.removeEventListener("keydown", tecla);
}
