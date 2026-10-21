/* Abertura com a montanha VIVA (Home). Módulo home-montanha 1.2.1-03d2 do Motion, SEM alteração (public/previa/…,
 * o mesmo arquivo já servido pelo institucional; sha256 conferido). Regras de raio e famílias de poster:
 * composicao-panoramica.mjs do Motion (portfolio-motion-v1), SEM alteração.
 * O Site decide a composição com as medidas reais (cabeçalho, margens, texto EN/PT/ES, ações e pausa):
 *   - horizonte: montanha centrada no alto da faixa, texto sob o sopé (nunca sobre o desenho);
 *   - lateral (desktop baixo): montanha à direita, texto à esquerda, última linha no sopé;
 *   - celular (< 900 px): montanha no alto, texto sob o sopé; alturaUtil em degraus de 10 px se faltar altura.
 * Integração (14/10/2026), correção do resize: `medir()` começa sem o `data-estagios` da decisão anterior. Com
 * 1440×900 → 800×560 → 1440×900 o atributo "abaixo" (celular baixo) continuava no herói durante a medida do desktop,
 * mudava a grade do texto (482/489 px em vez de 364/371) e a decisão ficava em lateral/900, diferente do carregamento
 * direto (horizonte). Reproduzido no Atlas e na Home anterior; a margem g continua lida na composição de referência. */
import { importarExterno, parametro } from "./externo";
import type { Movimento } from "./movimento";

type Familias = { desktop: number[]; movel: number[]; movelUtil: number[] };
type Raio = { pad: number; desenhoH: number; desenhoW: number; arcR: number; dir: number; esq?: number };
type Composicao = { FAMILIAS: Familias; raio: (dim: { w: number; h: number }, util?: number) => Raio };
type Esc = { setPaused(p: boolean): void; setReducedMotion(r: boolean): void; setLayout(l: unknown): void; destroy(): void };

const INTRO_KEY = "ararat:montanha-institucional";
// Decisores já criados, por URL do módulo de composição (proposta do Motion, R3/R4). O decisor é PURO — só as regras
// de raio e as famílias de poster do módulo —; nenhuma medida fica guardada: a cada aplicação, medir() lê a janela, o
// cabeçalho e o texto do idioma atual. Assim, na volta à Home pela navegação no app, a composição é aplicada NA
// MONTAGEM (síncrona, antes de o navegador devolver a rolagem) e a abertura já nasce na altura final (medido em
// 1280×600: nascia em 635 px, com a geometria do servidor, e ia a 536 px depois da rolagem devolvida → −99 px).
// Na 1ª carga do documento não há decisor: a composição espera o módulo e as fontes, como antes.
const decisores = new Map<string, ReturnType<typeof criarDecisor>>();

export type Medidas = { vw: number; vh: number; head: number; g: number; textoH: number; textoHProprio: number; textoSemEst: number; textoHLateral: number; larguraLateral: number };

export function criarDecisor({ FAMILIAS, raio }: Composicao) {
  const sopeDe = (W: number, narrow: boolean, util?: number | null) => {
    const r = raio({ w: W, h: narrow ? W * 0.8 : W * 0.6 }, util || undefined);
    return { ...r, sope: r.pad + r.desenhoH };
  };
  /** Escolhe composição e variante com as medidas reais da página. Puro: recebe medidas, devolve decisão. */
  function decidir({ vw, vh, head, g, textoH, textoSemEst, textoHLateral, larguraLateral }: Medidas) {
    const band = Math.max(vh - head, 0);
    if (vw < 900) {
      const W = [...FAMILIAS.movel].reverse().find((w) => w <= vw) ?? 320;
      const TOPO = 4, GAP = 12, BASE = 16;
      let util: number | null = null, m = sopeDe(W, true);
      const abaixo = TOPO + m.sope + GAP + textoH + BASE > band;
      const tH = abaixo ? textoSemEst : textoH;
      const livre = band - TOPO - GAP - tH - BASE;
      if (m.sope > livre && FAMILIAS.movelUtil.includes(W)) {
        util = Math.max(120, Math.floor(((livre - m.pad) / (1.52 * 0.56)) / 10) * 10);
        m = sopeDe(W, true, util);
      }
      return { variante: "celular", W, narrow: true, util, ...m, band, estagios: abaixo ? "abaixo" : "dobra", cabe: TOPO + m.sope + GAP + tH + BASE <= band, topo: TOPO, gap: GAP, base: BASE };
    }
    const TOPO = 12, GAP = 28, BASE = 28;
    let Wh: number | null = null;
    for (const W of FAMILIAS.desktop) {
      if (W > vw - 2 * g) break;
      if (TOPO + sopeDe(W, false).sope + GAP + textoH + BASE <= band) Wh = W;
    }
    let Wl: number | null = null;
    for (const W of FAMILIAS.desktop) {
      const m = sopeDe(W, false);
      const coluna = vw - 2 * g - 48 - m.desenhoW;
      if (coluna < larguraLateral) break;
      if (TOPO + m.sope + BASE <= band && textoHLateral + TOPO + BASE <= band) Wl = W;
    }
    const Rh = Wh ? sopeDe(Wh, false).arcR : 0, Rl = Wl ? sopeDe(Wl, false).arcR : 0;
    if (Wh && Rh >= 0.9 * Rl) return { variante: "horizonte", W: Wh, narrow: false, util: null, ...sopeDe(Wh, false), band, Rlateral: Rl, cabe: true, topo: TOPO, gap: GAP, base: BASE };
    if (Wl) return { variante: "lateral", W: Wl, narrow: false, util: null, ...sopeDe(Wl, false), band, Rhorizonte: Rh, cabe: true, topo: TOPO, gap: GAP, base: BASE };
    return { variante: "horizonte", W: 600, narrow: false, util: null, ...sopeDe(600, false), band, cabe: false, topo: TOPO, gap: GAP, base: BASE };
  }
  return decidir;
}
type Decisao = ReturnType<ReturnType<typeof criarDecisor>>;

function arquivoPoster(W: number, narrow: boolean, util: number | null) {
  if (narrow && util) return [`arte-escultura-movel-util-w${W}-a${util}@1x.webp`, `arte-escultura-movel-util-w${W}-a${util}@2x.webp`];
  if (narrow && W === 390) return ["arte-escultura-movel.webp", "arte-escultura-movel.webp"];
  const f = narrow ? "movel" : "desktop";
  return [`arte-escultura-${f}-w${W}@1x.webp`, `arte-escultura-${f}-w${W}@2x.webp`];
}

/** `pkg`: pasta do MÓDULO da montanha; `posters`: pasta dos posters (o candidato 1.3.0 herda os da 1.2.1, ver
 *  docs/coordination/ACORDO-INTEGRACAO-MONTANHA-1.3.0-SITE-2026-10-14.md); `ambiente`: valor de `ambient` quando a luz
 *  está ligada (estável: true, a respiração; candidata: 'passagem' + `ambientPerfil`). `?ambient=0` desliga nas duas. */
export function montarAbertura(hero: HTMLElement, { pref, pkg, composicao, posters, ambiente = true, ambientPerfil }:
  { pref: Movimento; pkg: string; composicao: string; posters?: string; ambiente?: true | "passagem"; ambientPerfil?: "recomendado" | "expressivo" }): () => void {
  const arte = hero.querySelector<HTMLElement>("[data-arte]")!;
  const img = arte.querySelector("img")!;
  const host = hero.querySelector<HTMLElement>("[data-host]")!;
  const txt = hero.querySelector<HTMLElement>("[data-txt]")!;
  const PKG = new URL(pkg, location.href).href;
  const POSTERS = new URL(posters ?? pkg, location.href).href;
  let esc: Esc | null = null, dec: Decisao | null = null, decidir: ReturnType<typeof criarDecisor> | null = null;
  let destruido = false, t = 0, ioHero: IntersectionObserver | null = null, headIO = -1, encoberto = false, remediu = false;
  const limpar: Array<() => void> = [];
  let ultimaArte: { w: number; h: number } | null = null;
  const red = matchMedia("(prefers-reduced-motion: reduce)");

  const medir = (): Medidas => {
    // correção do resize (14/10): nada da decisão anterior pode influir na medida
    delete hero.dataset.estagios;
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const head = (document.querySelector(".cab") as HTMLElement | null)?.offsetHeight ?? 0;
    // A5 (13/10): a margem g é lida na composição de REFERÊNCIA (em lateral o texto não tem padding)
    const varAntes = hero.dataset.variante;
    hero.dataset.variante = vw < 900 ? "celular" : "horizonte";
    const gLido = parseFloat(getComputedStyle(txt).paddingLeft);
    const g = Number.isFinite(gLido) && gLido > 0 ? gLido : 16;
    if (varAntes) hero.dataset.variante = varAntes;
    // a MAIOR altura entre EN/PT/ES (cópias inertes dos outros idiomas): a montanha não muda ao trocar de idioma
    const copias = [...hero.querySelectorAll<HTMLTemplateElement>("template[data-medida]")].map((tp) => {
      const n = (tp.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
      n.classList.add("medida"); n.setAttribute("aria-hidden", "true"); hero.append(n); return n;
    });
    const alt = () => Math.max(txt.offsetHeight, ...copias.map((n) => n.offsetHeight));
    hero.dataset.medindo = "horizonte"; hero.dataset.variante = vw < 900 ? "celular" : "horizonte";
    const textoH = alt(), textoHProprio = txt.offsetHeight;
    let textoSemEst = textoH;
    if (vw < 900) {
      hero.dataset.estagios = "abaixo";
      textoSemEst = Math.max(...[txt, ...copias].map((n) => { const a = n.querySelector(".acoes")!.getBoundingClientRect(), tt = n.getBoundingClientRect(); return Math.ceil(a.bottom - tt.top); }));
      delete hero.dataset.estagios;
    }
    let textoHLateral = 0; const larguraLateral = 440;
    if (vw >= 900) { hero.dataset.variante = "lateral"; hero.style.setProperty("--col", larguraLateral + "px"); copias.forEach((n) => { n.style.width = larguraLateral + "px"; }); textoHLateral = alt(); }
    copias.forEach((n) => n.remove());
    delete hero.dataset.medindo;
    return { vw, vh, head, g, textoH, textoHProprio, textoSemEst, textoHLateral, larguraLateral };
  };

  const layoutModulo = () => {
    const h = hero.getBoundingClientRect(), a = arte.getBoundingClientRect();
    const d = dec!;
    const art = { x: Math.round(a.left - h.left), y: Math.round(a.top - h.top), w: d.W, h: Math.round(d.W * (d.narrow ? 0.8 : 0.6)) };
    const comp = d.util ? { alinhar: "topo", alturaUtil: d.util } : { alinhar: "topo" };
    return { art, composicao: comp };
  };

  const aplicar = () => {
    if (!decidir) return;
    const m = medir();
    const d = decidir(m); dec = d;
    hero.dataset.variante = d.variante;
    if ("estagios" in d && d.estagios === "abaixo") hero.dataset.estagios = "abaixo"; else delete hero.dataset.estagios;
    hero.style.setProperty("--W", d.W + "px");
    hero.style.setProperty("--sope", Math.round(d.sope) + "px");
    hero.style.setProperty("--ratio", String(d.narrow ? 0.8 : 0.6));
    hero.style.setProperty("--banda", d.band + "px");
    hero.style.setProperty("--gap-arte", d.gap + "px");
    hero.style.setProperty("--topo-arte", d.topo + "px");
    hero.style.setProperty("--base-arte", d.base + "px");
    if (d.variante === "lateral") {
      const col = Math.floor(m.vw - 2 * m.g - 48 - d.desenhoW);
      hero.style.setProperty("--col", Math.min(560, col) + "px");
      hero.style.setProperty("--sobra", Math.round(d.W / 2 - d.dir) + "px");
    }
    const [f1, f2] = arquivoPoster(d.W, d.narrow, d.util);
    const src = POSTERS + "assets/" + f1, srcset = `${POSTERS}assets/${f1} 1x, ${POSTERS}assets/${f2} 2x`;
    // troca do arquivo do poster para a composição decidida: só depois de o novo estar decodificado (20/10; com
    // decoding=async, trocar o src direto deixava a arte vazia por alguns quadros até o novo arquivo chegar)
    if (img.dataset.posterAlvo !== srcset && img.getAttribute("srcset") !== srcset) {
      img.dataset.posterAlvo = srcset;
      const novo = new Image(); novo.srcset = srcset; novo.src = src;
      const trocar = () => {
        if (img.dataset.posterAlvo !== srcset) return; // outra composição pediu outro arquivo depois
        // já decodificado: decoding=sync na troca para o quadro seguinte já pintar o arquivo novo (com "async" o
        // Chromium ainda deixava um quadro sem a imagem)
        img.decoding = "sync"; img.srcset = srcset; img.src = src; img.closest("picture")?.querySelectorAll("source").forEach((s) => s.remove());
      };
      novo.decode().then(trocar, trocar);
    }
    hero.dataset.poster = f2;
    hero.dataset.composta = ""; // a regra provisória do CSS (altura = faixa) deixa de valer
    // recomposição (fonte que chega depois) que muda o tamanho da arte: o módulo também limpa e redesenha depois
    if (esc) { const l = layoutModulo(); if (ultimaArte && (l.art.w !== ultimaArte.w || l.art.h !== ultimaArte.h)) protegerTroca(); ultimaArte = l.art; esc.setLayout(l); }
    (window as unknown as { __abertura: unknown }).__abertura = { ...d, medidas: m };
  };

  const aplicarPausa = () => { esc?.setPaused(pref.pausado() || encoberto); }; // não mexe na preferência nem no botão
  const observarHero = () => {
    if (!esc || typeof IntersectionObserver !== "function") return;
    const head = (document.querySelector(".cab") as HTMLElement | null)?.offsetHeight || 0;
    if (ioHero && head === headIO) return;
    ioHero?.disconnect(); headIO = head;
    ioHero = new IntersectionObserver((es) => { encoberto = !es[es.length - 1].isIntersecting; aplicarPausa(); }, { rootMargin: `-${head}px 0px 0px 0px` });
    ioHero.observe(hero);
  };
  const onRed = (e: MediaQueryListEvent) => esc?.setReducedMotion(e.matches);

  const montar = async () => {
    try {
      const M = await importarExterno<Record<string, unknown>>(PKG + "web/home-sculpture.js");
      const criar = (M.createMountainSculpture ?? M.createHomeSculpture) as ((h: HTMLElement, o: unknown) => Esc) | undefined;
      if (typeof criar !== "function") throw new Error("módulo sem createMountainSculpture");
      if (destruido) return;
      // 20/10 (verificação do Motion, COORDENACAO-LINHAS-MONTANHA §3, opção ii): o poster completo já está pintado
      // quando o módulo monta, então a abertura do módulo não toca — com o poster oculto, ela fazia a montanha
      // completa sumir e recomeçar (relevo subindo, arco apagado). Antes da exclusividade a abertura já ficava
      // invisível sob o poster: o que se via continua igual, sem a sobreposição. A abertura visível (opção i) é
      // decisão do proprietário/Motion.
      try { sessionStorage.setItem(INTRO_KEY, "1"); } catch { /* sem armazenamento */ }
      esc = criar(host, { ...layoutModulo(), target: null, ready: false, ambient: parametro("ambient") === "0" ? false : ambiente, ...(ambiente === "passagem" ? { ambientPerfil: ambientPerfil ?? "recomendado" } : {}), intro: false, coverColor: "#111111", paused: pref.pausado(), reducedMotion: red.matches });
      ultimaArte = layoutModulo().art;
      // a criação desenha o quadro completo; o poster só sai depois de esse quadro estar no canvas e de o próprio
      // ciclo do módulo (ResizeObserver/tick) ter rodado: dois quadros depois. Nunca poster → vazio → canvas.
      await new Promise<void>((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok())));
      if (destruido || !esc) return;
      hero.dataset.montanha = "canvas";
      if (document.documentElement.dataset.revisao === "1") (window as unknown as { __montanha: unknown }).__montanha = esc; // só revisão: testes
      red.addEventListener?.("change", onRed); limpar.push(() => red.removeEventListener?.("change", onRed));
      pref.registrar("montanha", aplicarPausa); limpar.push(() => pref.remover("montanha"));
      observarHero(); limpar.push(() => { ioHero?.disconnect(); ioHero = null; });
    } catch {
      hero.dataset.montanha = "poster"; // falha: o poster fica no mesmo retângulo
      pref.semAnimacao("montanha");
    }
  };

  // 20/10: ao mudar de tamanho, o módulo redimensiona o canvas (o que o limpa) e só redesenha no quadro seguinte.
  // Antes da exclusividade o poster ficava por baixo e escondia isso; agora o poster volta durante a troca e o canvas
  // reaparece três quadros depois do último resize, já redesenhado. Nunca vazio, nunca os dois.
  let volta = 0;
  const protegerTroca = () => {
    if (!esc || hero.dataset.montanha !== "canvas") return;
    hero.dataset.montanha = "poster";
    cancelAnimationFrame(volta);
    let n = 0;
    const passo = () => { if (destruido || !esc) return; if (++n < 3) { volta = requestAnimationFrame(passo); return; } hero.dataset.montanha = "canvas"; };
    volta = requestAnimationFrame(passo);
  };
  limpar.push(() => cancelAnimationFrame(volta));
  const onResize = () => { cancelAnimationFrame(t); t = requestAnimationFrame(() => { aplicar(); observarHero(); }); };
  const onJanela = () => { protegerTroca(); onResize(); }; // resize da janela: o contêiner do canvas muda de tamanho
  const familiasHero = () => new Set([txt.querySelector("h1"), txt.querySelector(".sub"), txt.querySelector(".estagios")].filter(Boolean).map((n) => getComputedStyle(n as Element).fontFamily.split(",")[0].replace(/["']/g, "").trim()));
  const onFontes = (ev: Event) => {
    if (remediu) return;
    const fam = familiasHero();
    const faces = (ev as unknown as { fontfaces?: FontFace[] }).fontfaces || [];
    if (![...faces].some((f) => fam.has(f.family.replace(/["']/g, "")))) return;
    remediu = true; document.fonts.removeEventListener?.("loadingdone", onFontes); onResize();
  };

  const chave = new URL(composicao, location.href).href;
  const guardado = decisores.get(chave);
  if (guardado) { decidir = guardado; aplicar(); } // composição final já no 1º quadro da montagem
  const fontes = (window as unknown as { ARARAT_FONTES?: Promise<unknown> }).ARARAT_FONTES ?? document.fonts?.ready ?? Promise.resolve();
  Promise.all([importarExterno<Composicao>(composicao), fontes]).then(([C]) => {
    if (destruido) return;
    if (!decisores.has(chave)) decisores.set(chave, criarDecisor(C));
    decidir = decisores.get(chave)!;
    aplicar(); // mede de novo (fontes carregadas): na volta, o resultado é o mesmo da aplicação síncrona
    if (parametro("montanha") === "falha") { hero.dataset.montanha = "poster"; pref.semAnimacao("montanha"); return; }
    montar();
    addEventListener("resize", onJanela);
    document.fonts?.addEventListener?.("loadingdone", onFontes);
  }).catch(() => { hero.dataset.montanha = "poster"; pref.semAnimacao("montanha"); });

  return function destroy() {
    destruido = true; cancelAnimationFrame(t);
    removeEventListener("resize", onJanela); document.fonts?.removeEventListener?.("loadingdone", onFontes);
    limpar.splice(0).forEach((f) => { try { f(); } catch { /* já removido */ } });
    esc?.destroy(); esc = null;
    hero.dataset.montanha = "poster"; // o DOM pode continuar à vista (transição de saída): volta o poster inteiro
    pref.semAnimacao("montanha");
  };
}
