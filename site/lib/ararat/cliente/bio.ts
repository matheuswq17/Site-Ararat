/* Empresa — biografia em janela acessível. Sem JS, cada cartão é um link para a página da pessoa (rota própria).
 * Com JS: o link abre o <dialog> modal da pessoa; foco inicial no Fechar, Tab/Shift+Tab presos na janela, Esc ou
 * Fechar fecham, clique fora fecha, e o foco volta ao cartão. No celular a barra do Fechar fica fixa no topo da
 * janela enquanto a bio rola. Ctrl/⌘/Shift/botão do meio: abre a página da pessoa (nova aba), como um link comum. */
export function montarBios(raiz: ParentNode = document): () => void {
  const desfazer: Array<() => void> = [];
  let origem: HTMLElement | null = null;
  raiz.querySelectorAll<HTMLAnchorElement>("[data-bio]").forEach((a) => {
    const dlg = document.querySelector<HTMLDialogElement>(`[data-bio-dlg="${a.dataset.bio}"]`);
    if (!dlg || typeof dlg.showModal !== "function") return;
    const fechar = dlg.querySelector<HTMLButtonElement>("[data-bio-fechar]")!;
    a.setAttribute("aria-haspopup", "dialog");
    const onA = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      origem = a;
      dlg.showModal();
      dlg.scrollTop = 0; dlg.querySelector(".bio-grade")?.scrollTo?.(0, 0);
      fechar.focus();
    };
    const onFechar = () => dlg.close();
    const onFora = (e: MouseEvent) => { if (e.target === dlg) dlg.close(); };
    const onClose = () => { const o = origem; origem = null; if (o?.isConnected) o.focus(); };
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = [...dlg.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null || x === document.activeElement);
      if (!f.length) return;
      const p = f[0], u = f[f.length - 1];
      if (e.shiftKey && document.activeElement === p) { e.preventDefault(); u.focus(); }
      else if (!e.shiftKey && document.activeElement === u) { e.preventDefault(); p.focus(); }
    };
    a.addEventListener("click", onA); fechar.addEventListener("click", onFechar);
    dlg.addEventListener("click", onFora); dlg.addEventListener("close", onClose); dlg.addEventListener("keydown", onTab);
    desfazer.push(() => {
      a.removeEventListener("click", onA); fechar.removeEventListener("click", onFechar);
      dlg.removeEventListener("click", onFora); dlg.removeEventListener("close", onClose); dlg.removeEventListener("keydown", onTab);
      if (dlg.open) dlg.close();
      a.removeAttribute("aria-haspopup");
    });
  });
  (window as unknown as { __bio: unknown }).__bio = { abertos: () => [...document.querySelectorAll("dialog[open]")].map((d) => d.id) };
  return () => desfazer.splice(0).forEach((f) => f());
}
