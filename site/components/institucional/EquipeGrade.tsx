"use client";

import { useEffect, useRef, useState } from "react";
import { prenderFoco } from "@/lib/institucional/foco";
import type { Pessoa } from "@/lib/institucional/equipe";
import s from "./Institucional.module.css";

type Rotulos = { lerBio: string; fecharBio: string; fechar: string; equipe: string; de: string };

/**
 * Grade da equipe (sem categorias, ordem do brief). Cada cartão é um LINK REAL para a página individual (funciona sem
 * JavaScript). Com JavaScript, o clique abre a biografia num <dialog> modal: foco preso pelo navegador, Esc fecha,
 * botão × e "Fechar"; ao fechar, o foco volta ao cartão da pessoa (mesmo depois de navegar para a anterior/próxima).
 */
export function EquipeGrade({ pessoas, rotas, rotulos }: { pessoas: Pessoa[]; rotas: Record<string, string>; rotulos: Rotulos }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [atual, setAtual] = useState<number | null>(null);
  const atualRef = useRef<number | null>(null);
  atualRef.current = atual;
  useEffect(() => (dlg.current ? prenderFoco(dlg.current) : undefined), []);
  const abrir = (k: number, ev: React.MouseEvent) => {
    const d = dlg.current;
    if (!d || typeof d.showModal !== "function" || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
    ev.preventDefault();
    setAtual(k);
    d.showModal();
  };
  const fechar = () => dlg.current?.close();
  const p = atual == null ? null : pessoas[atual];
  const n = pessoas.length;
  return (
    <>
      <ul className={s.grade}>
        {pessoas.map((x, k) => (
          <li key={x.id}>
            <a className={s.pessoa} id={`p-${x.id}`} href={rotas[x.id]} onClick={(ev) => abrir(k, ev)} data-pessoa={x.id} aria-haspopup="dialog">
              <div className={s.foto}>
                {/* eslint-disable-next-line @next/next/no-img-element -- retratos WebP já derivados (time-refinada) */}
                <img src={x.foto.src} srcSet={x.fotos.map((f) => `${f.src} ${f.w}w`).join(", ")} sizes="(min-width: 1100px) 230px, (min-width: 900px) 30vw, 46vw" width={x.foto.w} height={Math.round((x.foto.w * 5) / 4)} alt="" loading="lazy" decoding="async" />
              </div>
              <b>{x.nome}</b>
              <span>{x.funcao}</span>
              <u>{rotulos.lerBio}</u>
            </a>
          </li>
        ))}
      </ul>
      <dialog
        ref={dlg}
        className={s.bio}
        aria-labelledby="bio-t"
        onClose={() => {
          // o navegador devolve o foco ao cartão que abriu o diálogo; levamos ao cartão da pessoa EXIBIDA por último
          const k = atualRef.current;
          const id = k == null ? null : pessoas[k].id;
          setAtual(null);
          if (id) setTimeout(() => document.getElementById(`p-${id}`)?.focus(), 0);
        }}
        data-bio={p?.id ?? ""}
      >
        {p ? (
          <div className={s.bioGrade}>
            <div className={s.bioFoto}>
              {/* eslint-disable-next-line @next/next/no-img-element -- retrato */}
              <img src={p.fotos[p.fotos.length - 1].src} alt={p.alt} width={p.fotos[p.fotos.length - 1].w} height={Math.round((p.fotos[p.fotos.length - 1].w * 5) / 4)} />
            </div>
            <div className={s.bioCorpo}>
              <button type="button" className={s.fecharX} aria-label={rotulos.fecharBio} onClick={fechar} data-bio-fechar-x="">×</button>
              <p className={`${s.mono} ${s.bioRot}`}>{rotulos.equipe} · {String(atual! + 1).padStart(2, "0")} {rotulos.de} {String(n).padStart(2, "0")}</p>
              <h2 id="bio-t">{p.nome}</h2>
              <p className={s.bioFuncao}>{p.funcao}</p>
              {p.bio.map((b) => <p key={b.slice(0, 24)} className={s.bioTexto}>{b}</p>)}
              <div className={s.bioPe}>
                <button type="button" onClick={() => setAtual(((atual ?? 0) + n - 1) % n)} data-bio-anterior="">← {pessoas[((atual ?? 0) + n - 1) % n].nome}</button>
                <button type="button" onClick={() => setAtual(((atual ?? 0) + 1) % n)} data-bio-proxima="">{pessoas[((atual ?? 0) + 1) % n].nome} →</button>
                <button type="button" onClick={fechar} data-bio-fechar="">{rotulos.fechar}</button>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
