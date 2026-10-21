import ESTATICO from "@/public/refinada/plataforma-fluxo-estatico-v1/derivados.json";
import REENQ from "@/public/institucional/capturas-v1/derivados.json";
import type { T } from "./textos";

/**
 * Capturas reais usadas no institucional, com a EVIDÊNCIA de cada uma (arquivo da entrega
 * C:\ARARAT\SiteDemo\entrega_site_demo_20261007, commit da6430c, 07/10/2026; caso público ProstateX-0067).
 * Uma função só aparece no site se tiver captura aqui. DWI, ROI persistente, PDF, detecção e XAI ficam fora.
 *
 * Teto de ampliação (mesma conta do Motion): px do dispositivo por px da captura = largura CSS × dpr / largura natural.
 * Interface ≤ 2,0; com pixels de RM ≤ 1,75. O CSS limita a largura CSS em função do dpr (ver Institucional.module.css,
 * --nat e --teto). Legibilidade é outra coisa: depende do tamanho real do texto na captura e da revisão humana.
 */
type Arq = { src: string; w: number; h: number };
const E = (ESTATICO as unknown as { arquivos: Record<string, { fonte: string; arquivos: Arq[] }> }).arquivos;
const R = (REENQ as unknown as { arquivos: Record<string, { fonte: string; arquivo: Arq; medica: boolean }> }).arquivos;

export type Captura = {
  id: string;
  produto: "hub" | "viewer";
  /** true = a placa tem pixels de RM (teto 1,75). */
  medica: boolean;
  fontes: Arq[];
  alt: T;
  /** Arquivo de origem na entrega (camada de revisão e EDITAR.md). */
  evidencia: string;
};

const est = (id: string, produto: Captura["produto"], medica: boolean, alt: T): Captura => {
  const d = E[id];
  if (!d) throw new Error(`derivado ausente: ${id}`);
  return { id, produto, medica, fontes: d.arquivos, alt, evidencia: d.fonte };
};
const reenq = (id: string, produto: Captura["produto"], alt: T): Captura => {
  const d = R[id];
  if (!d) throw new Error(`reenquadramento ausente: ${id}`);
  return { id, produto, medica: d.medica, fontes: [d.arquivo], alt, evidencia: d.fonte };
};

export const CAP = {
  hubFila: est("hub-fila-pronto", "hub", false, {
    en: "ARARAT Hub patient queue: ProstateX-0067 ready for review; ProstateX-0068 and ProstateX-0069 waiting in the queue.",
    pt: "Fila de Pacientes do ARARAT Hub: ProstateX-0067 pronto para revisão; ProstateX-0068 e ProstateX-0069 aguardando na fila.",
  }),
  hubPainel: est("hub-painel-abrir", "hub", true, {
    en: "ARARAT Hub case panel with thumbnails of the available views and the “Open review” button.",
    pt: "Painel do caso no ARARAT Hub com miniaturas das visualizações e o botão “Abrir revisão”.",
  }),
  hubCasoPendente: reenq("hub-caso-revisao-pendente", "hub", {
    en: "ARARAT Hub, after the review: row of case ProstateX-0067 with the status “Review pending”.",
    pt: "ARARAT Hub, depois da revisão: linha do caso ProstateX-0067 com o estado “Revisão pendente”.",
  }),
  hubEtapaPendente: reenq("hub-etapa-revisao-pendente", "hub", {
    en: "ARARAT Hub, Stage column of case ProstateX-0067: “Review pending”.",
    pt: "ARARAT Hub, coluna Etapa do caso ProstateX-0067: “Revisão pendente”.",
  }),
  planos: est("viewer-planos-mira", "viewer", true, {
    en: "ARARAT Viewer: axial and coronal T2 planes with the crosshair on the same point in both.",
    pt: "ARARAT Viewer: planos axial e coronal de T2 com a mira no mesmo ponto nos dois.",
  }),
  t2: est("viewer-comparar-t2", "viewer", true, {
    en: "ARARAT Viewer comparison: axial T2 panel, the main series and synchronization reference.",
    pt: "Comparação no ARARAT Viewer: painel T2 axial, série principal e referência da sincronização.",
  }),
  adc: est("viewer-comparar-adc", "viewer", true, {
    en: "ARARAT Viewer comparison: axial ADC panel at the matching position, labeled “Safe synchronization”.",
    pt: "Comparação no ARARAT Viewer: painel ADC axial na posição correspondente, com o selo “Sincronização segura”.",
  }),
  regua: est("viewer-regua", "viewer", true, {
    en: "ARARAT Viewer: axial T2 with a completed ruler measurement labeled M1 55.1 mm (demonstrative).",
    pt: "ARARAT Viewer: T2 axial com uma medida concluída com a régua, rotulada M1 55,1 mm (demonstrativa).",
  }),
  medidaM1: reenq("viewer-medida-m1", "viewer", {
    en: "Close crop of the completed measurement: both ruler points and the label M1 55.1 mm.",
    pt: "Recorte da medida concluída: os dois pontos da régua e o rótulo M1 55,1 mm.",
  }),
  medicoes: est("viewer-medicoes", "viewer", false, {
    en: "ARARAT Viewer, Measurements tab: card M1, 55.1 mm, series 4 axial T2, slice 13.",
    pt: "ARARAT Viewer, aba Medições: cartão M1, 55,1 mm, série 4 T2 axial, fatia 13.",
  }),
  imagensRelatorio: est("viewer-imagens-relatorio", "viewer", true, {
    en: "ARARAT Viewer, Report images: two selected images, series 4 T2 axial slice 13 and series 7 ADC axial slice 8.",
    pt: "ARARAT Viewer, Imagens do relatório: duas imagens selecionadas, série 4 T2 axial fatia 13 e série 7 ADC axial fatia 8.",
  }),
  visualizarRelatorio: reenq("viewer-visualizar-relatorio", "viewer", {
    en: "ARARAT Viewer, foot of the report images panel: the “Organize images” and “View report” buttons.",
    pt: "ARARAT Viewer, pé do painel Imagens do relatório: os botões “Organizar imagens” e “Visualizar relatório”.",
  }),
  previa: est("viewer-previa-relatorio", "viewer", true, {
    en: "ARARAT Viewer report preview: page titled Selected images for the report, with the T2 and ADC images.",
    pt: "Prévia do relatório no ARARAT Viewer: página Imagens selecionadas para o relatório, com as imagens T2 e ADC.",
  }),
} as const;

export type ChaveCaptura = keyof typeof CAP;
