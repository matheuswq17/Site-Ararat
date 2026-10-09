/**
 * Proposta experimental da home (rota /previa). A home aprovada continua em "/".
 *
 * Pacote do Claude Motion "ararat-home-v2-exp" 0.2.1-draft (motion/proposta/home-v2/deliverables),
 * autorizado pelo maestro só para /previa. Copiado SEM ALTERAÇÃO para public/previa/home-v2-0.2.1/
 * (subpasta versionada; public/motion continua com a jornada 0.4.0 ready da home "/"). Conferência
 * da cópia: motion/proposta/home-v2/scripts/sync-manifest.mjs <pasta> --check (39/39, tamanho e
 * sha256 do manifest, que já registra os blocos C2PA dos WebP).
 *  - web/home-sculpture.js  escultura (createHomeSculpture, setLayout({art,target,ready,arc}))
 *  - web/journey.js/.css    jornada 0.4.1-exp = 0.4.0 + extensão start-arc-v1 (data-start-arc)
 *  - assets/arte-escultura-{desktop,movel}-w<largura>@{1x,2x}.webp + arte-escultura-variantes.json
 *                           posters por largura de exibição (traço igual ao do canvas)
 *  - assets/arte-escultura-{desktop,movel}[-transparente].webp + .json  posters canônicos
 *  - assets/mri-base.webp, mri-map.json
 *  - web/previa-driver.js   copiado só como referência; NÃO é carregado (o Site usa o próprio
 *                           controlador de rolagem — HomeOpening + Journey).
 * public/previa/home-v2-0.2.0/ (versão anterior) não é mais lida.
 * O manifesto é lido no servidor (lib/home-preview.server.ts); estes são só os caminhos.
 */
/** Pacote experimental lido pela prévia (pasta versionada em public/previa/). */
export type PreviewPackage = {
  readonly dir: string;
  readonly baseUrl: string;
  /** Versão esperada no manifesto; outra versão desativa a prévia animada (fica o layout estático). */
  readonly version: string;
};

export const PREVIEW_PACKAGE = {
  dir: "home-v2-0.2.1",
  baseUrl: "/previa/home-v2-0.2.1/",
  version: "0.2.1-draft",
} as const satisfies PreviewPackage;

/**
 * Versão conjunta /previa/refinada — pacote do Claude Motion "ararat-home-montanha-exp"
 * 0.7.0-draft (montanha B; luz no arco e onda nas curvas ATRAVESSAM a passagem: relevo → linhas →
 * mapa; ganho pleno até p 0,42 e saída suave até 0,56, antes da entrega do arco à Jornada; mesma
 * API da 0.6.0; motion/proposta/home-montanha-b/pacotes/0.7.0, plano 005).
 * Copiado SEM ALTERAÇÃO (cp no próprio computador, sem recálculo) para
 * public/previa/home-montanha-0.7.0/ e conferido com o script do Motion:
 *   node motion/proposta/home-montanha-b/scripts/sync-manifest.mjs site/public/previa/home-montanha-0.7.0 --check
 *   → 71/71 (tamanho e sha256). Diferem da 0.6.0 só web/home-sculpture.js, os três JSON da arte e
 *   manifest.json; posters, Jornada, RM e driver idênticos. `ambient` (padrão true) não é passada.
 * A 0.6.0-draft fica em public/previa/home-montanha-0.6.0/ para comparação (e 0.5.0/0.4.0).
 * Só a /previa/refinada lê este pacote; /previa, /previa/a e /previa/b seguem na 0.2.1.
 */
// brand-sinal-v1: montanha 0.9.0-sinal do Motion (experiment/brand-sinal-motion-v1 @ 99c91c8), copiada sem alteração
// para public/previa/home-montanha-0.9.0-sinal/ e conferida (sync-manifest --check 71/71). A 0.7.0 segue em public/previa/.
// codex/brand-03d2-v1: montanha 1.0.0-03d2 + jornada 0.4.3-03d2 do Motion (codex/brand-03d2-motion-v1 @ 8568d8f),
// extraída com git archive para public/previa/home-montanha-1.0.0-03d2/ (sync-manifest --check 71/71; sha256 do
// manifest = MANIFESTO.json da rodada). Abertura = gesto 03D2 de 900 ms (o relevo sobe da linha de base); arco #919191.
// A 0.9.0-sinal e as anteriores ficam em public/previa/ sem alteração.
export const REFINADA_PACKAGE = {
  // codex/brand-03d2-editorial-v1: montanha 1.1.0-03d2 do Motion (codex/brand-03d2-editorial-motion-v1 @ e340de1;
  // sync-manifest --check 93/93) = 1.0.0-03d2 + composicao { alinhar, alturaUtil } + posters da 1ª dobra editorial.
  // A 1.0.0-03d2 continua em public/previa/home-montanha-1.0.0-03d2/ para comparação.
  dir: "home-montanha-1.1.0-03d2",
  baseUrl: "/previa/home-montanha-1.1.0-03d2/",
  version: "1.1.0-03d2",
} as const satisfies PreviewPackage;

/** Largura máxima do slot da arte (CSS: width min(1100px, 100cqw)) e limite celular/desktop
 *  (o módulo usa a composição "narrow" abaixo de 600 px de área). */
export const ART_SLOT = { maxWidth: 1100, narrowBelow: 600 } as const;

/** Largura REAL do slot da arte na composição editorial (duas colunas, ≥ 1200 px; marca-03d2.css §11.1):
 *  frente = min(viewport, content-max + 2·gutter) com padding gutter; colunas 5fr/7fr com gap clamp(24, 3vw, 64);
 *  slot = 7/12 de (largura interna − gap). gutter = clamp(20px, 5vw, 72px) e content-max = 1320 (styles/site.css).
 *  Medido na página: 1200 → 609, 1280 → 650, 1440 → 731, 1920 → 736, 2560 → 733 (headless, sem barra lateral). */
export const EDITORIAL_SLOT = { minViewport: 1200, contentMax: 1320 } as const;
export function editorialSlotWidth(vw: number): number {
  const clamp = (lo: number, v: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const gutter = clamp(20, 0.05 * vw, 72);
  const inner = Math.min(vw - 2 * gutter, EDITORIAL_SLOT.contentMax);
  const gap = clamp(24, 0.03 * vw, 64);
  return ((inner - gap) * 7) / 12;
}

/** Uma faixa do <picture>: media em largura de viewport + variantes 1x/2x desenhadas na largura
 *  CSS `areaW` (o traço do poster coincide com o do canvas quando o slot tem ~areaW px). */
export type PosterSource = { media: string; srcSet: string; areaW: number; areaH: number; slotMin: number; slotMax: number };

/** Poster da área da arte (metadados oficiais do Motion). */
export type ArtPoster = {
  src: string;
  /** Área CSS para a qual o poster foi gerado (a proporção do slot segue esta área). */
  areaW: number;
  areaH: number;
  pixelsW: number;
  pixelsH: number;
};

/** Configuração da prévia montada no servidor a partir do manifesto do pacote. */
export type PreviewConfig = {
  version: string;
  sculptureModule: string;
  journeyVersion: string;
  posterDesktop: ArtPoster;
  posterMobile: ArtPoster;
  /** Variantes por largura do slot (0.2.1-draft), em ordem; a última cobre até o fim. */
  posterSources: PosterSource[];
};

/** Textos da proposta. */
export const PREVIEW_COPY = {
  eyebrow: "Radiômica explicável · RM de próstata",
  titleLines: ["Da imagem ao", "conhecimento."],
  description: "IA e radiômica explicável para explorar imagens de RM de próstata e apoiar a revisão clínica.",
  primary: { label: "Entre na imagem", href: "#jornada" },
  secondary: { label: "Conhecer a plataforma", href: "#plataforma" },
} as const;
