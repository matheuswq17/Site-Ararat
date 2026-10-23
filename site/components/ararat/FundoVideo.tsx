import type { Idioma } from "@/lib/ararat/conteudo";
import { BotaoPausa } from "./base";

/** Fundo decorativo aprovado para Soluções, Plataforma e Empresa, nos três idiomas. */
export function VideoFundoDecorativo() {
  const base = "/ararat/fundos/mineral-v1/";
  return (
    <div className="vis-video" aria-hidden="true" data-video-fundo="" data-src-desktop={base + "fundo-desktop.mp4"} data-src-movel={base + "fundo-movel.mp4"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={base + "poster.webp"} width={1440} height={810} alt="" loading="lazy" />
      <video autoPlay muted loop playsInline preload="none" disablePictureInPicture disableRemotePlayback tabIndex={-1} width={1440} height={810} />
    </div>
  );
}

export function PausaFundoVideo({ idioma }: { idioma: Idioma }) {
  return <div className="vis-video-pausa" data-fundo-pausa=""><BotaoPausa idioma={idioma} /></div>;
}

export function FundoVideo({ idioma }: { idioma: Idioma }) {
  return <><div className="vis-video-camada" aria-hidden="true"><VideoFundoDecorativo /></div><PausaFundoVideo idioma={idioma} /></>;
}