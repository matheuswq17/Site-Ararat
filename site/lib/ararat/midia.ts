import { REVISAO_PRIVADA } from "./ambiente";

/**
 * Manifesto de mídia do site ARARAT.
 *
 * Capturas reais do ARARAT Hub e do ARARAT Viewer (caso público ProstateX-0067, coleção PROSTATEx/TCIA, CC BY 3.0)
 * e as camadas de segmentação geradas no Hub. A PERMISSÃO DE EXIBIÇÃO PÚBLICA ESTÁ PENDENTE (licença dos pesos e
 * origem das máscaras, permissão das capturas): por isso os arquivos ficam em public/privado/ (ignorado pelo Git) e
 * só são usados na revisão local privada (ARARAT_REVISAO_PRIVADA=1). Na variante apta a publicação, cada captura vira
 * a sua descrição textual (o mesmo `alt`), sem quadro vazio nem imagem substituta.
 *
 * Para liberar uma captura depois da permissão: mudar `permissao` para "publica" e mover o arquivo para
 * public/ararat/capturas/ (versionado). O verificador do build (scripts/ararat-verificar-midia.mjs) falha se uma
 * página pública referenciar /privado/.
 *
 * `tipo` alimenta o teto técnico de densidade (CSS): imagem médica e interface com imagem médica ≤ 1,75 px do
 * aparelho por px da captura; interface ≤ 2. É parâmetro técnico do projeto, não norma clínica nem prova de leitura.
 */
export type TipoMidia = "medica" | "interface-com-imagem" | "interface";
export type Permissao = "pendente" | "publica";
export type Captura = { w: number; h: number; tipo: TipoMidia; permissao: Permissao };

export const CAPTURAS = {
  "seg-t2-com-mascaras-748.webp": { w: 748, h: 760, tipo: "medica", permissao: "pendente" },
  "seg-t2-sem-mascaras-748.webp": { w: 748, h: 760, tipo: "medica", permissao: "pendente" },
  "seg-legenda-mascaras.webp": { w: 721, h: 180, tipo: "interface", permissao: "pendente" },
  "seg-volume-glandula.webp": { w: 721, h: 110, tipo: "interface", permissao: "pendente" },
  "seg-estado-mascaras.webp": { w: 721, h: 145, tipo: "interface", permissao: "pendente" },
  "hub-fila-pronto-1184.webp": { w: 1184, h: 564, tipo: "interface", permissao: "pendente" },
  "hub-painel-sem-checagens-556.webp": { w: 556, h: 444, tipo: "interface-com-imagem", permissao: "pendente" },
  "hub-caso-revisao-pendente-900.webp": { w: 900, h: 96, tipo: "interface", permissao: "pendente" },
  "viewer-planos-mira-1510.webp": { w: 1510, h: 720, tipo: "medica", permissao: "pendente" },
  "viewer-regua-748.webp": { w: 748, h: 714, tipo: "medica", permissao: "pendente" },
  "viewer-medicoes-814.webp": { w: 814, h: 400, tipo: "interface", permissao: "pendente" },
  "viewer-medida-m1-404.webp": { w: 404, h: 108, tipo: "medica", permissao: "pendente" },
  "viewer-comparar-t2-752.webp": { w: 752, h: 1340, tipo: "medica", permissao: "pendente" },
  "viewer-comparar-adc-750.webp": { w: 750, h: 1340, tipo: "medica", permissao: "pendente" },
  "viewer-series-460.webp": { w: 460, h: 1085, tipo: "interface-com-imagem", permissao: "pendente" },
  "viewer-imagens-relatorio-778.webp": { w: 778, h: 520, tipo: "interface-com-imagem", permissao: "pendente" },
  "viewer-previa-relatorio-1280.webp": { w: 1280, h: 1062, tipo: "interface-com-imagem", permissao: "pendente" },
} as const satisfies Record<string, Captura>;

export type ArquivoCaptura = keyof typeof CAPTURAS;

/** A captura pode aparecer nesta variante? (pública: sempre; pendente: só na revisão privada) */
export const exibivel = (f: ArquivoCaptura) => (CAPTURAS[f] as Captura).permissao === "publica" || REVISAO_PRIVADA;
export const srcCaptura = (f: ArquivoCaptura) =>
  (CAPTURAS[f] as Captura).permissao === "publica" ? `/ararat/capturas/${f}` : `/privado/cap/${f}`;

/** Composição com capturas? Só quando TODAS podem aparecer nesta variante. Sem elas, as páginas usam a composição
 *  própria para texto (não a mesma página com cada imagem trocada pela descrição). */
export const comCapturas = () => (Object.keys(CAPTURAS) as ArquivoCaptura[]).every(exibivel);

/** A demonstração guiada usa as capturas do pacote plataforma-fluxo-0.1.0 (mesma permissão pendente). */
export const DEMO_ASSETS = "/privado/plataforma-fluxo-0.1.0/assets/";
export const demoDisponivel = () => REVISAO_PRIVADA;

/** Fotos da equipe (já publicadas antes desta integração; qualidade de algumas é dependência registrada). */
export const FOTOS: Record<string, { w: number; h: number }> = {
  "matheus-560-enquadrado.webp": { w: 537, h: 672 },
  "miguel-560.webp": { w: 560, h: 700 },
  "rodrigo-552-enquadrado.webp": { w: 524, h: 656 },
  "hartmann-560.webp": { w: 560, h: 700 },
  "victor-304-enquadrado.webp": { w: 243, h: 304 },
};

/**
 * Montanha 1.2.1 preservada como comparação e fonte dos posters. A pública usa MONTANHA_APROVADA abaixo;
 * lib/ararat/montanha-candidata.ts mantém as alternativas da revisão privada sem alterar os pacotes.
 */
export type Montanha = { versao: string; base: string; posters: string; ambiente: true | "passagem"; ambientPerfil?: "recomendado" | "expressivo"; sha256: string };
export const MONTANHA_ESTAVEL: Montanha = {
  versao: "1.2.1-03d2", base: "/previa/home-montanha-1.2.1-03d2/", posters: "/previa/home-montanha-1.2.1-03d2/", ambiente: true,
  sha256: "f919d61ddc29437749b5e50f0a42cd211637bd4e2547a693878818789fad8ba9",
};

/** Ritmo aprovado: mesmo pacote 1.3.1, sem alterar desenho, intensidade ou posters da 1.2.1. */
export const MONTANHA_APROVADA: Montanha = {
  versao: "1.3.1-03d2-candidato", base: "/previa/home-montanha-1.3.1-03d2-candidato/",
  posters: MONTANHA_ESTAVEL.posters, ambiente: "passagem", ambientPerfil: "recomendado",
  sha256: "014e0257dc8df118ec57f3da419d3d243b66d73e71560284917fce24386c0a25",
};

/** Pacotes do Motion servidos por esta integração (conferidos por sha256 com portfolio-motion-v1@b918de2). */
export const PACOTES = {
  montanha: MONTANHA_ESTAVEL.base,
  fluxo: "/ararat/pacotes/plataforma-fluxo-0.8.0-03d2/",
  saidasCaso: "/ararat/pacotes/motion-portfolio-07d5483/saidas-caso.js",
  composicao: "/ararat/pacotes/motion-portfolio-07d5483/composicao-panoramica.mjs",
} as const;
