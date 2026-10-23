/**
 * Vídeo "Hub e Viewer em ação" (Plataforma, #video). Nada é baixado antes do clique do visitante: a capa é uma imagem
 * e o <video> só é criado no clique, com o formato escolhido NESSE momento (vertical se a tela for estreita, senão
 * horizontal) — o outro formato nunca é pedido. Sem autoplay e sem loop; controles nativos (teclado, pausa, busca e tela
 * cheia). A pausa global do site interrompe a reprodução; retomar as animações NÃO inicia o vídeo. Ao sair da página
 * (navegação no app, pagehide) o vídeo para e a transferência é interrompida. Falha: mensagem útil, página intacta.
 */
import type { Movimento } from "./movimento";

export function montarVideo(raiz: HTMLElement, { pref }: { pref: Movimento }): () => void {
  const quadro = raiz.querySelector<HTMLElement>("[data-video-quadro]");
  const capa = raiz.querySelector<HTMLButtonElement>("[data-video-play]");
  const msg = raiz.querySelector<HTMLElement>("[data-video-msg]");
  if (!quadro || !capa) return () => {};
  let video: HTMLVideoElement | null = null;
  const NOME = "video-demo";

  const parar = () => { if (video && !video.paused) video.pause(); };
  const aoPausarSite = (pausado: boolean) => { if (pausado) parar(); }; // retomar não reproduz
  const aoTocar = () => pref.registrar(NOME, aoPausarSite);
  const aoParar = () => pref.remover(NOME);
  const falhou = () => {
    aoParar();
    raiz.dataset.video = "falha";
    if (msg) { msg.textContent = raiz.dataset.falha || ""; msg.hidden = false; }
  };

  const iniciar = () => {
    if (video) return;
    const vertical = matchMedia(raiz.dataset.mq || "(max-width: 699px)").matches;
    raiz.dataset.formato = vertical ? "vertical" : "horizontal"; // a proporção fica a do formato escolhido
    const v = document.createElement("video");
    v.controls = true; v.playsInline = true; v.preload = "auto"; v.loop = false; v.autoplay = false;
    v.setAttribute("aria-label", raiz.dataset.rotulo || "");
    const img = capa.querySelector("img");
    if (img?.currentSrc) v.poster = img.currentSrc;
    v.addEventListener("play", aoTocar);
    v.addEventListener("pause", aoParar);
    v.addEventListener("ended", aoParar);
    v.addEventListener("error", falhou);
    v.src = (vertical ? raiz.dataset.srcV : raiz.dataset.srcH) || "";
    video = v;
    capa.replaceWith(v);
    raiz.dataset.video = "aberto";
    v.focus();
    // o clique do visitante autoriza a reprodução com som; se o navegador recusar, os controles continuam disponíveis
    v.play().catch(() => { /* recusado ou interrompido: o visitante usa os controles */ });
  };
  capa.addEventListener("click", iniciar);
  const aoSair = () => parar();
  addEventListener("pagehide", aoSair);

  return () => {
    capa.removeEventListener("click", iniciar);
    removeEventListener("pagehide", aoSair);
    aoParar();
    if (video) {
      video.pause();
      video.removeAttribute("src"); // interrompe a transferência em andamento
      video.load();
    }
  };
}
