"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { prenderFoco } from "@/lib/institucional/foco";
import s from "./Institucional.module.css";

type Item = { href: string; nome: string; atual: boolean };

/**
 * Menu do celular. Sem JavaScript, o botão é um link para a navegação do rodapé (#rodape-nav). Com JavaScript abre um
 * <dialog> modal em tela inteira: foco preso pelo navegador, Esc fecha, o foco volta ao botão MENU. A página atual é
 * marcada com aria-current; o idioma leva à página equivalente.
 */
export function MenuMovel(p: { itens: Item[]; rotulo: string; fechar: string; contato: string; idiomaRotulo: string; outroNome: string; hrefOutro: string; langOutro: string; logo: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const botao = useRef<HTMLAnchorElement>(null);
  const abrir = (e: React.MouseEvent) => {
    const d = ref.current;
    if (!d || typeof d.showModal !== "function") return; // sem <dialog>: segue o link do rodapé
    e.preventDefault();
    d.showModal();
    d.querySelector<HTMLElement>("[aria-current=page]")?.focus();
  };
  const fechar = () => ref.current?.close();
  useEffect(() => (ref.current ? prenderFoco(ref.current) : undefined), []);
  return (
    <>
      <a ref={botao} className={s.menuBtn} href="#rodape-nav" role="button" aria-haspopup="dialog" aria-controls="menu-movel" onClick={abrir} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); (e.currentTarget as HTMLAnchorElement).click(); } }} data-menu-abrir="">
        {p.rotulo}
      </a>
      <dialog ref={ref} id="menu-movel" className={s.menu} aria-label={p.rotulo} onClose={() => botao.current?.focus()} data-menu="">
        <div className={s.menuTopo}>
          {p.logo}
          <button type="button" className={s.fecharX} aria-label={p.fechar} onClick={fechar} data-menu-fechar="">×</button>
        </div>
        <ul className={s.menuLista}>
          {p.itens.map((i) => (
            <li key={i.href}><a href={i.href} aria-current={i.atual ? "page" : undefined}>{i.nome}</a></li>
          ))}
        </ul>
        <div className={s.menuPe}>
          <a className={`${s.btn} ${s.btnSec}`} href="#contato" onClick={fechar}>{p.contato}</a>
          <div className={s.menuIdioma}>
            <span className={`${s.mono} ${s.muted}`}>{p.idiomaRotulo}</span>
            <a className={s.lk} href={p.hrefOutro} lang={p.langOutro} hrefLang={p.langOutro}>{p.outroNome}</a>
          </div>
        </div>
      </dialog>
    </>
  );
}
