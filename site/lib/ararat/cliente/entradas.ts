/* Entradas editoriais seletivas (candidato de movimento, revisão privada). Rodada 10 (17/10/2026), fechamento pela
 * verificação do Motion (VERIFICACAO-ENTRADAS-EDITORIAIS-MOTION-2026-10-16.md):
 *  - os conectores do esquema não se movem mais (não eram perceptíveis);
 *  - GSAP substituído por CSS (@keyframes em site.css, "Entradas editoriais"); este módulo só decide QUANDO;
 *  - prazo de segurança do IntersectionObserver: sem nenhuma resposta em 1,5 s depois de observe(), tudo volta ao
 *    estado estático completo. A 1ª resposta (mesmo sem interseção) cancela o prazo; ele não conta até o visitante
 *    chegar à seção.
 * Dois momentos: no caso, o fio cobre do rótulo se desenha e o título sobe 8 px (4 no celular) ao aparecer; na
 * evidência, o fio se desenha e o título só aparece. Valores em site.css (o Motion define; o Site integra).
 *
 * Regras que continuam: nada escondido por padrão (só o JS marca um grupo como "espera", e só se ele ainda estiver
 * abaixo da janela); nunca na restauração (voltar/avançar, recarga, travessia no app), com âncora, pausa ou movimento
 * reduzido; uma vez por aba (sessionStorage); pausa, movimento reduzido, âncora, saída da página ou desmontagem
 * terminam tudo no estado estático completo (sem a marca, vale o CSS normal); só opacidade e transform.
 */
import type { Movimento } from "./movimento";

const CHAVE = "ararat:entradas-vistas";
export const PRAZO_OBSERVADOR = 1500; // ms sem nenhuma resposta do IntersectionObserver
const FOLGA_FIM = 600; // ms: se animationend não vier (aba oculta, etc.), o grupo é liberado assim mesmo

type Grupo = { id: string; el: HTMLElement; ultimo: HTMLElement };

const vistas = (): Set<string> => { try { return new Set(JSON.parse(sessionStorage.getItem(CHAVE) || "[]")); } catch { return new Set(); } };
const marcarVista = (id: string) => { try { const v = vistas(); v.add(id); sessionStorage.setItem(CHAVE, JSON.stringify([...v])); } catch { /* sem armazenamento: vale para este documento */ } };

function grupos(): Grupo[] {
  const out: Grupo[] = [];
  for (const [id, sel, titulo] of [["caso", "#caso .cabeca-sec", "#caso-t"], ["evidencia", "#evidencia .cabeca-sec", "#ev-t"]] as const) {
    const el = document.querySelector<HTMLElement>(sel), t = el?.querySelector<HTMLElement>(titulo);
    if (el && t && el.querySelector(".rotulo-sec")) out.push({ id, el, ultimo: t });
  }
  return out;
}

const naoVisto = (el: HTMLElement) => el.getBoundingClientRect().top > innerHeight;

export function montarEntradas({ pref, restaurando }: { pref: Movimento; restaurando: boolean }): () => void {
  const red = matchMedia("(prefers-reduced-motion: reduce)");
  const html = document.documentElement;
  const estado = (m: string) => { html.dataset.entradas = m; };
  if (red.matches || pref.pausado() || restaurando || location.hash || typeof IntersectionObserver !== "function") { estado("estatico"); return () => {}; }
  const ja = vistas();
  const armar = grupos().filter((x) => !ja.has(x.id) && naoVisto(x.el));
  if (!armar.length) { estado("estatico"); return () => {}; }

  let concluido = false, io: IntersectionObserver | null = null, prazo = 0;
  const pendentes = new Set(armar);
  const timers = new Set<number>();
  const ouvintes: Array<() => void> = [];
  const on = (alvo: EventTarget, ev: string, f: EventListener, o?: AddEventListenerOptions) => { alvo.addEventListener(ev, f, o); ouvintes.push(() => alvo.removeEventListener(ev, f, o)); };
  const liberar = (g: Grupo) => { delete g.el.dataset.entrada; pendentes.delete(g); if (!pendentes.size) concluir(); };
  // termina tudo no estado estático completo: sem a marca, vale o CSS normal (completo e parado)
  function concluir() {
    if (concluido) return; concluido = true;
    clearTimeout(prazo); prazo = 0;
    timers.forEach((t) => clearTimeout(t)); timers.clear();
    io?.disconnect(); io = null;
    armar.forEach((g) => { delete g.el.dataset.entrada; });
    pendentes.clear();
    ouvintes.splice(0).forEach((f) => f());
    pref.remover("entradas");
    estado("concluido");
  }

  armar.forEach((g) => { g.el.dataset.entrada = "espera"; }); // fora da janela: ninguém vê o estado inicial
  estado("armado");
  pref.registrar("entradas", (p) => { if (p) concluir(); });
  on(red, "change", () => { if (red.matches) concluir(); });
  on(window, "hashchange", concluir);
  on(window, "pagehide", concluir);
  // link para seção da própria página: o destino tem de estar pronto na chegada
  on(document, "click", ((e: MouseEvent) => { if ((e.target as Element | null)?.closest?.("a[href*='#']")) concluir(); }) as EventListener, { capture: true });

  const porEl = new Map(armar.map((g) => [g.el, g]));
  io = new IntersectionObserver((es) => {
    clearTimeout(prazo); prazo = 0; // houve resposta: o observador funciona
    for (const e of es) {
      if (!e.isIntersecting || concluido) continue;
      const g = porEl.get(e.target as HTMLElement); if (!g || g.el.dataset.entrada !== "espera") continue;
      io?.unobserve(g.el);
      marcarVista(g.id);
      g.el.dataset.entrada = "entra";
      const fim = () => { g.ultimo.removeEventListener("animationend", fim); liberar(g); };
      g.ultimo.addEventListener("animationend", fim);
      ouvintes.push(() => g.ultimo.removeEventListener("animationend", fim));
      const t = window.setTimeout(fim, FOLGA_FIM); timers.add(t);
    }
  }, { rootMargin: "0px 0px -12% 0px" });
  armar.forEach((g) => io!.observe(g.el));
  // prazo de segurança: um observador que existe e nunca responde não pode deixar títulos escondidos
  prazo = window.setTimeout(() => { prazo = 0; concluir(); }, PRAZO_OBSERVADOR);

  return () => { concluir(); delete html.dataset.entradas; };
}
