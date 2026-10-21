/**
 * Demonstração "Plataforma · do Hub ao Viewer" da /previa/refinada — DADOS do Site (textos, avisos,
 * atribuição e imagens da apresentação estática). A animação conduzida pela rolagem é do Motion
 * (motion/proposta/plataforma-fluxo/, contrato em docs/coordination/PLATAFORMA-FLUXO-MOTION.md) e entra
 * por um registro versionado (MODULOS_FLUXO), sem stub na página normal.
 *
 * Fonte das imagens: C:\ARARAT\SiteDemo\entrega_site_demo_20261007 (capturas reais do ARARAT Hub 1.0.0 e
 * do Viewer, commit da6430c, 07/10/2026; caso público desidentificado ProstateX-0067, coleção PROSTATEx do
 * TCIA, CC BY 3.0). Derivados WebP gerados por scripts/derivar-plataforma-fluxo.mjs (originais intactos,
 * SHA-256 conferido pelo manifesto). Recortes sem score e abaixo da faixa de título com a data do estudo.
 *
 * Fora do escopo desta versão (não aparece nem é sugerido): DWI, segmentação, volumes, detecção, scores,
 * probabilidades, ISUP, XAI, modelo GGG, finalização, assinatura ou conclusão clínica.
 */
import DERIVADOS from "@/public/refinada/plataforma-fluxo-estatico-v1/derivados.json";

type Arquivo = { src: string; w: number; h: number; bytes: number };
const D = DERIVADOS.arquivos as unknown as Record<string, { arquivos: Arquivo[] }>;

export type ImagemFluxo = {
  nome: string;
  /** Produto da captura: decide o tratamento visual (Hub claro × Viewer escuro). */
  produto: "hub" | "viewer";
  alt: string;
  /** Fontes do menor ao maior; a maior tem as dimensões intrínsecas usadas para reservar espaço. */
  fontes: Arquivo[];
  /** Largura de exibição aproximada em relação ao quadro (sizes). */
  sizes: string;
};

const img = (nome: string, produto: ImagemFluxo["produto"], alt: string, sizes: string): ImagemFluxo => {
  const a = D[nome]?.arquivos;
  if (!a) throw new Error(`derivado ausente: ${nome}`);
  return { nome, produto, alt, fontes: a, sizes };
};

export type EtapaFluxo = {
  id: string;
  n: string;
  titulo: string;
  texto: string;
  /** Versão curta para a legenda do percurso animado (coluna estreita ao lado do palco). */
  legenda: string;
  /** Rótulo curto do produto em cena. */
  produto: string;
  /** Imagens da apresentação estática (desktop) — no máximo duas, lado a lado. */
  imagens: ImagemFluxo[];
  /** Variante para celular (≤ 600 px), quando a do desktop fica ilegível. */
  celular?: ImagemFluxo[];
};

export const ETAPAS_FLUXO: EtapaFluxo[] = [
  {
    id: "fila",
    legenda: "Os exames são preparados localmente; o caso fica pronto para a revisão.",
    n: "01",
    titulo: "A fila do Hub",
    texto: "Os exames chegam ao Hub e são preparados localmente antes da leitura. Ao fim do preparo, o caso fica pronto para a revisão.",
    produto: "ARARAT Hub",
    imagens: [
      img("hub-cartoes-pronto", "hub", "ARARAT Hub: indicadores da fila — 1 pronto para revisão, 0 processando agora, 0 na fila e 0 revisados hoje.", "(min-width: 901px) 50vw, 100vw"),
      img("hub-fila-pronto", "hub", "ARARAT Hub, Fila de Pacientes: ProstateX-0067 com marcador verde e etapa Revisão pendente; ProstateX-0068 e ProstateX-0069 aguardando na fila.", "(min-width: 901px) 50vw, 100vw"),
    ],
    celular: [img("hub-linha-pronto", "hub", "ARARAT Hub: linha do caso ProstateX-0067 com etapa Revisão pendente.", "100vw")],
  },
  {
    id: "abrir",
    legenda: "Abrir revisão leva o mesmo caso ao Viewer, com T2 e ADC.",
    n: "02",
    titulo: "O mesmo caso no Viewer",
    texto: "Abrir revisão leva o caso selecionado do Hub ao Viewer, já com as séries T2 e ADC listadas e a T2 axial carregada.",
    produto: "Hub → Viewer",
    imagens: [
      img("hub-painel-abrir", "hub", "ARARAT Hub, painel do caso: T2 axial presente, segmentação concluída e inferência concluída como checagens de arquivo, miniaturas das visualizações e o botão Abrir revisão.", "(min-width: 901px) 22vw, 50vw"),
      img("viewer-series", "viewer", "ARARAT Viewer, Estudos e séries do paciente ProstateX-0067: séries T2 sagital, axial e coronal e a série ADC, com miniaturas.", "(min-width: 901px) 18vw, 45vw"),
    ],
  },
  {
    id: "planos",
    legenda: "Axial, coronal e sagital navegados em sincronia.",
    n: "03",
    titulo: "Cortes e planos sincronizados",
    texto: "Axial, coronal e sagital são navegados em sincronia: a mira marca o mesmo ponto nos planos.",
    produto: "ARARAT Viewer",
    imagens: [img("viewer-planos-mira", "viewer", "ARARAT Viewer: planos axial e coronal de RM T2 da próstata com a mira cruzando o mesmo ponto nos dois planos.", "(min-width: 901px) 55vw, 100vw")],
  },
  {
    id: "comparar",
    legenda: "T2 e ADC lado a lado, na mesma posição do paciente.",
    n: "04",
    titulo: "T2 e ADC lado a lado",
    texto: "Na comparação, T2 e ADC ficam lado a lado, alinhados pela mesma posição do paciente.",
    produto: "ARARAT Viewer",
    imagens: [
      img("viewer-comparar-t2", "viewer", "ARARAT Viewer, comparação: painel T2 axial marcado como série principal, referência da sincronização.", "(min-width: 901px) 26vw, 50vw"),
      img("viewer-comparar-adc", "viewer", "ARARAT Viewer, comparação: painel ADC axial na posição correspondente, com o selo Sincronização segura.", "(min-width: 901px) 26vw, 50vw"),
    ],
  },
  {
    id: "regua",
    legenda: "Régua em milímetros. A medida M1 55,1 mm é demonstrativa.",
    n: "05",
    titulo: "Uma medida com a régua",
    texto: "A régua mede em milímetros, no espaço do paciente. A medida M1 55,1 mm é demonstrativa: os pontos foram posicionados para esta captura.",
    produto: "ARARAT Viewer",
    imagens: [
      img("viewer-regua", "viewer", "ARARAT Viewer: plano axial T2 com uma régua amarela rotulada M1 55,1 mm, medida demonstrativa.", "(min-width: 901px) 30vw, 100vw"),
      img("viewer-medicoes", "viewer", "ARARAT Viewer, aba Medições: cartão M1 de 55,1 mm na série 4 t2_tse_tra, axial, fatia 13, com a opção Incluir no relatório.", "(min-width: 901px) 26vw, 100vw"),
    ],
  },
  {
    id: "relatorio",
    legenda: "As imagens marcadas entram na prévia do relatório; nada é emitido.",
    n: "06",
    titulo: "Imagens-chave e prévia do relatório",
    texto: "As imagens marcadas durante a leitura entram na prévia do relatório. É uma prévia: nada é emitido nem assinado aqui.",
    produto: "ARARAT Viewer",
    imagens: [
      img("viewer-imagens-relatorio", "viewer", "ARARAT Viewer, Imagens do relatório: duas imagens selecionadas, série 4 T2 axial fatia 13 e série 7 ADC axial fatia 8.", "(min-width: 901px) 26vw, 100vw"),
      img("viewer-previa-relatorio", "viewer", "ARARAT Viewer, prévia do relatório: página com o título Imagens selecionadas para o relatório e as duas imagens, T2 e ADC, no modelo 2 × 2.", "(min-width: 901px) 30vw, 100vw"),
    ],
  },
  {
    id: "retorno",
    legenda: "O caso volta ao Hub em Revisão pendente.",
    n: "07",
    titulo: "De volta ao Hub",
    texto: "De volta ao Hub, o caso mostra o estado atual da revisão: Revisão pendente. Finalizar é uma decisão do radiologista e não é simulado aqui.",
    produto: "Viewer → Hub",
    imagens: [
      img("viewer-voltar-hub", "viewer", "ARARAT Viewer, barra de status: Abrindo o ARARAT Hub…", "(min-width: 901px) 40vw, 100vw"),
      img("hub-fila-pendente", "hub", "ARARAT Hub, Fila de Pacientes: ProstateX-0067 com etapa Revisão pendente, lida do registro da revisão.", "(min-width: 901px) 50vw, 100vw"),
    ],
    celular: [img("hub-linha-pendente", "hub", "ARARAT Hub: linha do caso ProstateX-0067 com etapa Revisão pendente.", "100vw")],
  },
];

/** Aviso visível junto da demonstração. */
export const AVISO_FLUXO =
  "Demonstração do fluxo da interface. O sistema está em validação; a medida exibida é demonstrativa e não constitui interpretação clínica.";

/** Identificação das imagens. */
export const ORIGEM_FLUXO =
  "Capturas reais do ARARAT Hub 1.0.0 e do ARARAT Viewer com imagens de RM reais, públicas e desidentificadas: caso ProstateX-0067 da coleção PROSTATEx.";

/** Atribuição exigida (CC BY 3.0 §4(b) e política do TCIA): citação com DOI, licença com link, tratamentos e
 *  ausência de endosso. Conferida em 07/10/2026 na página da coleção e na política do TCIA. */
export const ATRIBUICAO_FLUXO = {
  citacao:
    "Litjens, G., Debats, O., Barentsz, J., Karssemeijer, N., & Huisman, H. (2017). SPIE-AAPM PROSTATEx Challenge Data (Version 2) [dataset]. The Cancer Imaging Archive.",
  doi: "https://doi.org/10.7937/K9TCIA.2017.MURS5CL",
  licenca: { nome: "CC BY 3.0", url: "https://creativecommons.org/licenses/by/3.0/" },
  tratamentos:
    "Imagens exibidas no ARARAT Viewer e no ARARAT Hub (renderização e janela/nível do produto), capturadas e recortadas para esta página; sobreposições da interface (régua, mira) fazem parte das capturas.",
  endosso: "Uso sem endosso do TCIA, da Radboudumc ou dos autores do dataset.",
};

/**
 * Módulos de animação do Motion, versionados (copiados SEM ALTERAÇÃO de motion/proposta/plataforma-fluxo/).
 * Contrato (docs/coordination/PLATAFORMA-FLUXO-MOTION.md, 0.1.0-draft):
 *   createPlataformaFluxo(host, { palco, base, progresso: 'externo', paused, reducedMotion: 'auto', onEstado })
 *   → { setProgresso(p), setPaused(b), setReducedMotion(b|null), atualizar(), state, destroy() }
 *   host recebe data-fluxo-modo ('animado' | 'estatico'), data-fluxo-etapa (0–7), data-fluxo-layout, data-fluxo-carregado,
 *   data-fluxo-falha; evento 'fluxo:estado'. Em 'estatico' (pausa, reduzido, falha do módulo ou de um asset) o módulo
 *   não desenha e o Site mostra o roteiro estático.
 */
export type ModuloFluxo = { versao: string; url: string; base: string; exportName: string };
export const MODULOS_FLUXO: Record<string, ModuloFluxo> = {
  "0.1.0": {
    versao: "0.1.0-draft",
    url: "/refinada/plataforma-fluxo-0.1.0/plataforma-fluxo.js",
    base: "/refinada/plataforma-fluxo-0.1.0/assets/",
    exportName: "createPlataformaFluxo",
  },
  // brand-sinal-v1: fluxo 0.3.0-sinal do Motion (@ 99c91c8; 1/1): só anéis/contornos neutros; assets do 0.1.0 (mesmos sha256)
  "0.3.0-sinal": {
    versao: "0.3.0-sinal",
    url: "/refinada/plataforma-fluxo-0.3.0-sinal/plataforma-fluxo.js",
    base: "/refinada/plataforma-fluxo-0.1.0/assets/",
    exportName: "createPlataformaFluxo",
  },
  // codex/brand-03d2-editorial-v1: fluxo 0.5.0-03d2 do Motion (@ e340de1; 1/1): telas maiores, aproximações nos
  // controles, hierarquia de movimento e enquadramentos de celular; capturas do 0.1.0 (mesmos sha256).
  "0.5.0-03d2": {
    versao: "0.5.0-03d2",
    url: "/refinada/plataforma-fluxo-0.5.0-03d2/plataforma-fluxo.js",
    base: "/refinada/plataforma-fluxo-0.1.0/assets/",
    exportName: "createPlataformaFluxo",
  },
  // codex/brand-03d2-v1: fluxo 0.4.0-03d2 do Motion (@ 8568d8f; 1/1): anel e realce com os tokens de foco do 03D2
  // (Hub #111111 + filete #F6F6F6; Viewer #EDEDED + filete #111111); assets do 0.1.0 (mesmos sha256).
  "0.4.0-03d2": {
    versao: "0.4.0-03d2",
    url: "/refinada/plataforma-fluxo-0.4.0-03d2/plataforma-fluxo.js",
    base: "/refinada/plataforma-fluxo-0.1.0/assets/",
    exportName: "createPlataformaFluxo",
  },
};
export const MODULO_FLUXO_PADRAO: string | null = "0.5.0-03d2";

export type EstadoFluxo = { modo: "animado" | "estatico"; etapa: number; nome: string; progresso: number; layout: string; carregado: string; falha: string | null };
export type PlataformaFluxoModulo = {
  VERSION: string;
  setProgresso(p: number): void;
  setPaused(v: boolean): void;
  setReducedMotion(v: boolean | null): void;
  atualizar(): void;
  readonly state: { modo: string; etapa: number; progresso: number; alvo: number; animando: boolean; layout: string; falha: string | null };
  destroy(): void;
};
export type CriarPlataformaFluxo = (
  host: HTMLElement,
  opts: { palco: HTMLElement | null; base: string; progresso: "externo"; paused: boolean; reducedMotion: "auto" | boolean; onEstado?: (e: EstadoFluxo) => void },
) => PlataformaFluxoModulo;

declare global {
  interface Window {
    /** Só para testes: troca a URL do módulo (ex.: inexistente, para simular falha). */
    __PLATAFORMA_FLUXO_TESTE__?: { url: string };
  }
}

export async function carregarPlataformaFluxo(m: ModuloFluxo): Promise<{ criar: CriarPlataformaFluxo; etapas: Array<{ etapa: number; ate: number }> }> {
  const url = (typeof window !== "undefined" && window.__PLATAFORMA_FLUXO_TESTE__?.url) || m.url;
  const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
  const criar = mod[m.exportName];
  if (typeof criar !== "function") throw new Error(`${m.exportName} ausente`);
  return { criar, etapas: Array.isArray(mod.ETAPAS) ? mod.ETAPAS : [] };
}
