/* Títulos revelados por linhas reais (GSAP core + SplitText) — CANDIDATO PRIVADO, 19/10/2026.
 * Direção aprovada pelo proprietário na prévia docs/review/gsap-textos-montanha-2026-10-19 (?texto=gsap), adaptada ao
 * app (não é o controlador da prévia). Ativo só na revisão privada com ?texto=gsap (Cabeca.tsx guarda na sessão).
 *
 * Alvos marcados no HTML com data-texto: "h1" (Home, Plataforma, Soluções, Próstata, Tireoide, Evidências, Empresa) e
 * "titulo" (Home: títulos do caso e da evidência). Nada mais se move.
 * Linguagem: cada linha sobe por uma máscara (yPercent 108 + .3em → 0, opacidade .15 → 1, power3.out). h1: 780 ms por linha,
 * 105 ms entre linhas; títulos: 680/85 ms. Celular (< 900 px): 700/90 e 620/75, mesma linguagem.
 *
 * Regras:
 *  - h1: o <head> marca data-texto-entrada="h1" numa carga elegível e o CSS segura o h1 antes da 1ª pintura (nunca
 *    aparece e some); na navegação no app, a marca é posta por useLayoutEffect antes da pintura. Um prazo de CSS
 *    (2,5 s) mostra o h1 se o JS não chegar; se ele já tiver aparecido, o JS não o esconde de novo.
 *  - na Home, o h1 espera também a montagem da montanha (criação + 1ª pintura do canvas), para a entrada não cair num
 *    quadro travado; limite de 2 s, abaixo do prazo de CSS.
 *  - títulos abaixo da janela: divididos e preparados só se ainda não foram vistos, quando tudo está pronto; tocam ao
 *    entrar na janela. Prazo de 1,5 s para a 1ª resposta do observador; sem resposta, os títulos que esperam voltam
 *    completos (o h1 que já está entrando termina a sua entrada). Um salto de rolagem que passa por um título sem que
 *    ele cruze a janela o devolve completo: nada fica escondido acima de onde já se leu.
 *  - teste (só revisão privada): sessionStorage "ararat:texto-teste"="t:<s>" deixa as linhas paradas nesse instante
 *    da entrada (t:0 = estado inicial, para medir tinta antes da subida); "congelar" mantém as linhas no estado final, sem
 *    desfazer a divisão, para comparar as letras com e sem máscara.
 *  - divide só depois das fontes e, na Home, da composição da abertura; as palavras se separam também depois de hífen
 *    e travessão, como o navegador quebra. Se a altura mudar mais de 1 px, ou as linhas divididas não forem as mesmas
 *    do texto normal, desfaz e deixa o título parado e inteiro (data-textos-recusados registra quem). Resize/zoom, fonte que chega depois, mudança de composição, pausa, movimento
 *    reduzido, âncora, saída da página: tudo termina completo e a divisão é desfeita (nenhuma linha de largura antiga).
 *  - nunca na restauração (voltar/avançar, recarga, travessia no app), com âncora, pausa ou reduzido; uma vez por aba.
 *  - limpeza local: gsap.context().revert(), SplitText.revert(), observador, ouvintes e timers deste módulo.
 */
import type { Movimento } from "./movimento";

type G = typeof import("gsap").gsap;
type ST = typeof import("gsap/SplitText").SplitText;
type Split = InstanceType<ST>;

const VISTOS = "ararat:textos-vistos";
export const PRAZO_OBSERVADOR = 1500;
export const PARAMETROS = {
  h1: { desktop: { dur: 0.78, stagger: 0.105 }, movel: { dur: 0.7, stagger: 0.09 } },
  titulo: { desktop: { dur: 0.68, stagger: 0.085 }, movel: { dur: 0.62, stagger: 0.075 } },
  de: { yPercent: 108, opacity: 0.15 },
  // 20/10: folga somada aos 108 % (em em do próprio título). A máscara precisa de .18em de margem para não cortar
  // descendentes em repouso (medido: .14em é o mínimo na Home); com só 108 %, o alto das letras aparecia por essa
  // margem antes da subida (Motion, §2A: "no 1º quadro, nenhuma tinta visível").
  folgaEm: 0.3,
  ease: "power3.out",
};

const lerVistos = (): string[] => { try { return JSON.parse(sessionStorage.getItem(VISTOS) || "[]"); } catch { return []; } };
const chave = (el: HTMLElement) => (el.dataset.texto === "h1" ? "h1:" : `t:${el.id}:`) + location.pathname;
const marcarVisto = (el: HTMLElement) => { try { const v = new Set(lerVistos()); v.add(chave(el)); sessionStorage.setItem(VISTOS, JSON.stringify([...v])); } catch { /* sem armazenamento */ } };
const esquecerPagina = () => { try { sessionStorage.setItem(VISTOS, JSON.stringify(lerVistos().filter((k) => !k.endsWith(":" + location.pathname) && !k.endsWith(location.pathname)))); } catch { /* idem */ } };

const reduzido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Quebra de linha igual à do navegador: por padrão o SplitText só separa palavras em espaços e mantém "radiologist-led"
// inteiro, enquanto o navegador quebra depois do hífen; as linhas da entrada sairiam diferentes das do texto final e
// a palavra pularia de linha ao desfazer. Separar também depois de hífen/travessão (sem inserir nada) reproduz as
// quebras. Lookbehind em RegExp construída: navegador sem suporte usa o padrão, e a conferência abaixo decide.
const DELIMITADOR = (() => { try { return { delimiter: new RegExp("(?<=[-\u2013\u2014])|(?= )"), replaceWith: "" }; } catch { return undefined; } })();
const normal = (t: string) => t.replace(/\s+/g, " ").trim();
/** Linhas como o navegador as quebrou (texto de cada linha), medidas por caractere antes de dividir. */
function linhasNaturais(el: HTMLElement): string[] {
  const out: string[] = []; let cur = "", topo: number | null = null;
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const r = document.createRange();
  for (let n = w.nextNode() as Text | null; n; n = w.nextNode() as Text | null) {
    for (let i = 0; i < n.length; i++) {
      r.setStart(n, i); r.setEnd(n, i + 1);
      const q = r.getClientRects()[0];
      if (q && q.width > 0) { const t = Math.round(q.top); if (topo !== null && t > topo + 2) { out.push(cur); cur = ""; } topo = t; }
      cur += n.data[i];
    }
  }
  out.push(cur);
  return out.map(normal).filter(Boolean);
}

/** Chamada em useLayoutEffect (antes da pintura) numa navegação no app: segura o h1 como o <head> faz na carga. */
export function prepararEntrada({ pref, restaurando }: { pref: Movimento; restaurando: boolean }) {
  const html = document.documentElement;
  if (html.dataset.texto !== "gsap") { delete html.dataset.textoEntrada; return; }
  const h1 = document.querySelector<HTMLElement>("main [data-texto=h1]");
  // a pausa é lida também da sessão: no 1º carregamento este layout effect roda antes de iniciarMovimento (useEffect)
  let pausaSessao = false; try { pausaSessao = sessionStorage.getItem("ararat:paused") === "1"; } catch { /* sem armazenamento */ }
  const ok = h1 && !restaurando && !location.hash && !pref.pausado() && !pausaSessao && !reduzido() && !lerVistos().includes(chave(h1));
  if (ok) html.dataset.textoEntrada = "h1"; else delete html.dataset.textoEntrada;
}

export function montarTextos({ pref, restaurando, forcar = false, carregar }:
  { pref: Movimento; restaurando: boolean; forcar?: boolean; carregar?: () => Promise<[G, ST]> }): () => void {
  const html = document.documentElement;
  const estado = (m: string) => { html.dataset.textos = m; };
  const soltarH1 = () => { delete html.dataset.textoEntrada; };
  if (html.dataset.texto !== "gsap") { soltarH1(); return () => {}; }
  const red = matchMedia("(prefers-reduced-motion: reduce)");
  if (red.matches || pref.pausado() || (!forcar && (restaurando || location.hash))) { soltarH1(); estado("estatico"); return () => {}; }

  const vistos = forcar ? [] : lerVistos();
  let teste = ""; try { teste = html.dataset.revisao === "1" ? sessionStorage.getItem("ararat:texto-teste") || "" : ""; } catch { /* idem */ }
  const congelar = teste === "congelar", pausaEm = /^t:(\d+(?:\.\d+)?)$/.exec(teste)?.[1]; // "t:0.3": parado aos 0,3 s
  const h1 = document.querySelector<HTMLElement>("main [data-texto=h1]");
  let h1Alvo = !!h1 && (forcar || html.dataset.textoEntrada === "h1") && !vistos.includes(chave(h1));
  const abaixo = (el: HTMLElement) => el.getBoundingClientRect().top > innerHeight;
  let titulos = [...document.querySelectorAll<HTMLElement>("main [data-texto=titulo]")].filter((el) => !vistos.includes(chave(el)) && abaixo(el));
  if (!h1Alvo && !titulos.length) { soltarH1(); estado("estatico"); return () => {}; }

  let destruido = false, concluido = false, io: IntersectionObserver | null = null, prazo = 0, mo: MutationObserver | null = null;
  let ctx: ReturnType<G["context"]> | null = null;
  const splits = new Set<Split>();
  const ouvintes: Array<() => void> = [];
  const timers = new Set<number>();
  const on = (alvo: EventTarget, ev: string, f: EventListener, o?: AddEventListenerOptions) => { alvo.addEventListener(ev, f, o); ouvintes.push(() => alvo.removeEventListener(ev, f, o)); };
  // termina tudo completo: desfaz tweens e divisões deste módulo (nunca comandos globais)
  // soltar = false na desmontagem: a marca do h1 já pertence à página seguinte (prepararEntrada roda antes, no layout)
  function concluir(soltar = true) {
    if (concluido) return; concluido = true;
    clearTimeout(prazo); prazo = 0;
    timers.forEach((t) => clearTimeout(t)); timers.clear();
    io?.disconnect(); io = null; mo?.disconnect(); mo = null;
    ctx?.revert(); ctx = null;
    splits.forEach((s) => { try { s.revert(); } catch { /* já desfeita */ } }); splits.clear();
    ouvintes.splice(0).forEach((f) => f());
    pref.remover("textos");
    if (soltar) soltarH1();
    estado("concluido");
  }
  estado("preparando");
  pref.registrar("textos", (p) => { if (p) concluir(); });
  on(red, "change", () => { if (red.matches) concluir(); });
  on(window, "hashchange", () => concluir());
  on(window, "pagehide", () => concluir());
  on(document, "click", ((e: MouseEvent) => { if ((e.target as Element | null)?.closest?.("a[href*='#']")) concluir(); }) as EventListener, { capture: true });
  // linhas calculadas para uma largura/fonte/composição anterior nunca ficam: qualquer mudança termina tudo completo
  let largura = document.documentElement.clientWidth;
  on(window, "resize", () => { if (document.documentElement.clientWidth !== largura) concluir(); largura = document.documentElement.clientWidth; });

  const fontes = (window as unknown as { ARARAT_FONTES?: Promise<unknown> }).ARARAT_FONTES ?? document.fonts?.ready ?? Promise.resolve();
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const composicao = new Promise<void>((ok) => {
    if (!hero || !h1 || !hero.contains(h1) || hero.hasAttribute("data-composta")) return ok();
    const o = new MutationObserver(() => { if (hero.hasAttribute("data-composta")) { o.disconnect(); ok(); } });
    o.observe(hero, { attributes: true, attributeFilter: ["data-composta"] });
    const t = window.setTimeout(() => { o.disconnect(); ok(); }, 2500); timers.add(t);
    ouvintes.push(() => o.disconnect());
  });
  // Home: a montanha monta no mesmo período (criação síncrona + 1ª pintura do canvas, que pode travar a página por
  // ~250 ms num aparelho fraco). O h1 só toca depois dela, para a entrada não ser engolida por um quadro travado.
  const montanha = new Promise<void>((ok) => {
    if (!hero || !h1 || !hero.contains(h1) || hero.dataset.montanha === "canvas") return ok();
    const pronto = () => { o.disconnect(); requestAnimationFrame(() => requestAnimationFrame(() => ok())); };
    const o = new MutationObserver(pronto); // canvas criado, ou poster confirmado na falha (mesmo valor também conta)
    o.observe(hero, { attributes: true, attributeFilter: ["data-montanha"] });
    const t = window.setTimeout(() => { o.disconnect(); ok(); }, 2000); timers.add(t);
    ouvintes.push(() => o.disconnect());
  });
  const lib = carregar ?? (() => Promise.all([import("gsap").then((m) => m.gsap), import("gsap/SplitText").then((m) => m.SplitText)]));

  Promise.all([lib(), fontes, composicao, montanha]).then(([[gsap, SplitText]]) => {
    if (destruido || concluido) return;
    if (red.matches || pref.pausado()) { concluir(); return; }
    // o h1 já apareceu (prazo de CSS venceu, ou marca ausente): não some de novo
    if (h1Alvo && !forcar && (html.dataset.textoEntrada !== "h1" || parseFloat(getComputedStyle(h1!).opacity) > 0.5)) h1Alvo = false;
    titulos = titulos.filter(abaixo);
    if (!h1Alvo && !titulos.length) { concluir(); return; }
    gsap.registerPlugin(SplitText);
    const movel = innerWidth < 900;
    const tocar = new Map<HTMLElement, () => void>();
    const desfazer = new Map<HTMLElement, () => void>(); // devolve UM alvo ao texto completo (sem tocar)
    const tocados = new Set<HTMLElement>();
    const recusados: string[] = [];
    ctx = gsap.context(() => {
      const preparar = (el: HTMLElement, tipo: "h1" | "titulo") => {
        const antes = el.getBoundingClientRect().height, naturais = linhasNaturais(el);
        const s = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "texto-linha", aria: "auto", autoSplit: false, ...(DELIMITADOR ? { wordDelimiter: DELIMITADOR } : {}) });
        splits.add(s);
        // geometria: altura diferente, ou linhas diferentes das do navegador → desfaz e o título fica parado e inteiro
        const iguais = s.lines.length === naturais.length && s.lines.every((l, i) => normal(l.textContent || "") === naturais[i]);
        if (Math.abs(el.getBoundingClientRect().height - antes) > 1 || !iguais) { s.revert(); splits.delete(s); recusados.push(el.dataset.texto === "h1" ? "h1" : el.id); return; }
        gsap.set(s.lines, { ...PARAMETROS.de, y: parseFloat(getComputedStyle(el).fontSize) * PARAMETROS.folgaEm });
        const p = PARAMETROS[tipo][movel ? "movel" : "desktop"];
        const soltar = () => { tl.kill(); s.revert(); splits.delete(s); tocar.delete(el); desfazer.delete(el); if (!tocar.size) concluir(); };
        // congelar: só na revisão privada, para o teste comparar letras com e sem máscara no estado final
        const tl = gsap.timeline({ paused: true, onComplete: () => { if (congelar) { tocar.delete(el); return; } soltar(); } });
        tl.to(s.lines, { yPercent: 0, y: 0, opacity: 1, duration: p.dur, stagger: p.stagger, ease: PARAMETROS.ease });
        tocar.set(el, () => { tocados.add(el); marcarVisto(el); if (pausaEm != null) tl.seek(+pausaEm); else tl.play(); });
        desfazer.set(el, soltar);
      };
      if (h1Alvo) preparar(h1!, "h1");
      titulos.forEach((el) => preparar(el, "titulo"));
    });
    if (recusados.length) html.dataset.textosRecusados = recusados.join(" "); // revisão/teste: alvos que ficaram parados
    soltarH1(); // o h1 já está dividido e com as linhas abaixo da máscara: soltar a marca não o mostra antes da hora
    if (!tocar.size) { concluir(); return; }
    estado("armado");
    // abertura recomposta (resize, fonte tardia, idioma) ou fonte que chega depois: linhas antigas não ficam
    const alvos = [...tocar.keys()];
    const medida = (el: HTMLElement) => `${Math.round(el.getBoundingClientRect().width)}|${getComputedStyle(el).fontSize}`;
    const medidas = new Map(alvos.map((el) => [el, medida(el)]));
    if (hero && h1Alvo) {
      // a abertura mede alternando atributos; só conta se a caixa ou o corpo do h1 mudarem de fato
      let q = 0;
      mo = new MutationObserver(() => { cancelAnimationFrame(q); q = requestAnimationFrame(() => { if (alvos.some((el) => tocar.has(el) && medida(el) !== medidas.get(el))) concluir(); }); });
      mo.observe(hero, { attributes: true, attributeFilter: ["data-variante", "style"] });
      ouvintes.push(() => cancelAnimationFrame(q));
    }
    const familias = new Set(alvos.map((el) => getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim()));
    on(document.fonts as unknown as EventTarget, "loadingdone", ((e: Event) => {
      const faces = (e as unknown as { fontfaces?: FontFace[] }).fontfaces || [];
      if ([...faces].some((f) => familias.has(f.family.replace(/["']/g, "")))) concluir();
    }) as EventListener);
    const h1Toca = h1Alvo ? tocar.get(h1!) : null;
    h1Toca?.();
    const pend = titulos.filter((el) => tocar.has(el));
    if (!pend.length) return;
    if (typeof IntersectionObserver !== "function") { concluir(); return; }
    io = new IntersectionObserver((es) => {
      clearTimeout(prazo); prazo = 0; // houve resposta
      for (const e of es) { if (!e.isIntersecting) continue; io?.unobserve(e.target); tocar.get(e.target as HTMLElement)?.(); }
    }, { rootMargin: "0px 0px -12% 0px" });
    pend.forEach((el) => io!.observe(el));
    // salto (PageDown, End, barra de rolagem) que passa por um título sem que ele cruze a janela: ele fica inteiro;
    // nada fica escondido acima de onde já se leu
    on(window, "scroll", () => { for (const el of pend) if (desfazer.has(el) && !tocados.has(el) && el.getBoundingClientRect().bottom < 0) desfazer.get(el)!(); }, { passive: true });
    // sem resposta: só os títulos que esperam voltam completos; o h1 que já está entrando termina a sua entrada
    prazo = window.setTimeout(() => { prazo = 0; io?.disconnect(); io = null; pend.forEach((el) => desfazer.get(el)?.()); }, PRAZO_OBSERVADOR);
  }).catch(() => { if (!destruido) { concluir(); estado("falha"); } });

  return () => { destruido = true; concluir(false); delete html.dataset.textos; delete html.dataset.textosRecusados; };
}

/** Controle da revisão privada (não existe na pública): repetir a entrada e trocar para o atual. */
export function montarControleRevisao(repetir: () => void): () => void {
  if (document.documentElement.dataset.revisao !== "1") return () => {};
  const caixa = document.createElement("div");
  caixa.className = "texto-revisao";
  caixa.setAttribute("role", "group");
  caixa.setAttribute("aria-label", "Revisão: títulos por linhas");
  const rever = document.createElement("button");
  rever.type = "button"; rever.textContent = "Rever entrada";
  rever.addEventListener("click", () => { esquecerPagina(); repetir(); });
  const atual = document.createElement("a");
  atual.href = location.pathname + "?texto=atual"; atual.textContent = "Ver atual";
  caixa.append(rever, atual);
  document.body.append(caixa);
  return () => caixa.remove();
}
