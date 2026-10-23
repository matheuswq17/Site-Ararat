import type { Movimento } from "./movimento";

/** Fundo decorativo: silencioso, sob a pausa única, sem relógio fora da tela. */
export function montarFundoVideo(raiz: HTMLElement, { pref }: { pref: Movimento }): () => void {
  const video = raiz.querySelector<HTMLVideoElement>("video");
  const secao = raiz.closest<HTMLElement>(".topo-com-fundo");
  if (!video || !secao) return () => {};
  const reduzido = matchMedia("(prefers-reduced-motion: reduce)");
  const economizar = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const nome = "fundo-topo";
  let emTela = !("IntersectionObserver" in window), destruido = false, falha = false;
  video.muted = true; video.defaultMuted = true; video.volume = 0;
  const elegivel = () => !destruido && !falha && !pref.pausado() && !reduzido.matches && !economizar && !document.hidden && emTela;
  const parar = () => { if (!video.paused) video.pause(); };
  const sincronizar = () => {
    if (!elegivel()) { parar(); return; }
    if (!video.getAttribute("src")) {
      video.src = (matchMedia("(max-width:899px)").matches ? raiz.dataset.srcMovel : raiz.dataset.srcDesktop) || "";
      video.load();
    }
    video.play().then(() => { if (!elegivel()) parar(); }).catch(() => { /* autoplay recusado: a imagem continua completa */ });
  };
  const tocando = () => {
    if (!elegivel()) { parar(); return; }
    raiz.dataset.fundoPronto = "1";
    raiz.dataset.fundoEstado = "reproduzindo";
  };
  const semSom = () => { if (!video.muted) video.muted = true; if (video.volume !== 0) video.volume = 0; };
  const aoFalhar = () => {
    falha = true; parar(); delete raiz.dataset.fundoPronto;
    raiz.dataset.fundoEstado = "falha"; pref.remover(nome);
  };
  video.addEventListener("playing", tocando);
  video.addEventListener("volumechange", semSom);
  video.addEventListener("error", aoFalhar);
  reduzido.addEventListener("change", sincronizar);
  document.addEventListener("visibilitychange", sincronizar);
  window.addEventListener("pagehide", parar);
  window.addEventListener("pageshow", sincronizar);
  const observador = "IntersectionObserver" in window ? new IntersectionObserver(([e]) => {
    emTela = e.isIntersecting; sincronizar();
  }) : null;
  observador?.observe(secao);
  pref.registrar(nome, sincronizar);
  sincronizar();
  return () => {
    destruido = true; observador?.disconnect(); pref.remover(nome);
    reduzido.removeEventListener("change", sincronizar);
    document.removeEventListener("visibilitychange", sincronizar);
    window.removeEventListener("pagehide", parar);
    window.removeEventListener("pageshow", sincronizar);
    video.removeEventListener("playing", tocando);
    video.removeEventListener("volumechange", semSom);
    video.removeEventListener("error", aoFalhar);
    parar(); video.removeAttribute("src"); video.load();
  };
}