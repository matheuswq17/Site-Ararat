/**
 * Capturas do produto na /previa/refinada (rodada 5). Contrato PRÓPRIO desta rota — não usa nem
 * ativa o `PRODUCT_DEMO` global (lib/product-media.ts), que trocaria a Plataforma em todas as rotas.
 *
 * Fontes: references/produto/capturas-2026-10-06/ (fornecidas e autorizadas pelo usuário para esta
 * prévia; originais intactos, SHA-256 conferido por scripts/derivar-capturas-refinada.mjs). Os
 * arquivos servidos são derivados WebP em public/product/refinada/.
 *
 * Regras de conteúdo (README das capturas + revisão integral de 06/10/2026):
 *  · `mostra` = só o que está VISÍVEL na captura. `naoMostra` = limites que a legenda precisa dizer.
 *  · `versao`: `null` quando a captura não identifica a versão (Viewer) — não inventar.
 *  · Os rótulos "ambiente demonstrativo / dados sintéticos" são da interface; não equivalem a uma
 *    auditoria da origem ou licença das imagens médicas exibidas.
 */

export type DerivadoWebp = { src: string; w: number };

export type CapturaProduto = {
  id: "hub" | "viewer";
  produto: "ARARAT Hub" | "ARARAT Viewer";
  /** Versão visível na própria captura; null = não identificada (não inventar). */
  versao: string | null;
  /** Dimensões da imagem inteira (do original). */
  width: number;
  height: number;
  /** Imagem inteira, do menor ao maior (o maior = largura original). */
  inteira: DerivadoWebp[];
  /** Enquadramento para celular (≤ 600 px): recorte útil + acesso à captura completa. */
  recorte: { width: number; height: number; fontes: DerivadoWebp[]; descricao: string; alt: string };
  /** Descrição objetiva do que está visível (imagem inteira). */
  alt: string;
  /** Legenda curta, junto da imagem (repete os avisos que o recorte possa esconder). */
  legenda: string;
  /** Visível na captura. */
  mostra: string[];
  /** Não demonstrado pela captura (dito na legenda/nota). */
  naoMostra: string[];
};

const D = "/product/refinada/";

export const CAPTURA_HUB: CapturaProduto = {
  id: "hub",
  produto: "ARARAT Hub",
  versao: "1.0.0",
  width: 1672,
  height: 941,
  inteira: [640, 960, 1280, 1672].map((w) => ({ src: `${D}hub-${w}.webp`, w })),
  recorte: {
    width: 640,
    height: 322,
    fontes: [
      { src: `${D}hub-fila-461.webp`, w: 461 },
      { src: `${D}hub-fila-640.webp`, w: 640 },
    ],
    descricao: "Recorte da fila de revisão",
    alt: "Recorte do ARARAT Hub: fila de revisão com filtros por status (todos, prontos, processando, na fila, erro, revisados) e três casos ARARAT-DEMO com etapa Revisão pendente.",
  },
  alt: "Tela do ARARAT Hub em ambiente demonstrativo com dados sintéticos: indicadores de 3 casos prontos para revisão, 0 em processamento, 0 na fila e 0 revisados hoje; fila de revisão com três casos ARARAT-DEMO em revisão pendente, score marcado como ilustrativo e botão Abrir revisão em cada linha; painel lateral com o caso ARARAT-DEMO-001 aguardando revisão humana, visualizações axial, sagital e coronal, 3D não gerado, versão 1.0.0 e botões Abrir revisão e Exportar relatório.",
  legenda:
    "ARARAT Hub 1.0.0 em ambiente demonstrativo, com dados sintéticos: fila com três casos aguardando revisão humana. Scores marcados como ilustrativos. O botão Exportar relatório aparece na interface; a exportação não é demonstrada nesta captura.",
  mostra: [
    "Fila de revisão com filtros por status",
    "Três casos ARARAT-DEMO em revisão pendente",
    "Ação Abrir revisão",
    "Versão 1.0.0, ambiente demonstrativo, dados sintéticos",
  ],
  naoMostra: ["Exportação funcional (só o botão aparece)", "Casos processados ou revisados"],
};

export const CAPTURA_VIEWER: CapturaProduto = {
  id: "viewer",
  produto: "ARARAT Viewer",
  versao: null,
  width: 1600,
  height: 900,
  inteira: [800, 1200, 1600].map((w) => ({ src: `${D}viewer-${w}.webp`, w })),
  recorte: {
    width: 500,
    height: 370,
    fontes: [
      { src: `${D}viewer-axial-360.webp`, w: 360 },
      { src: `${D}viewer-axial-500.webp`, w: 500 },
    ],
    descricao: "Recorte do plano axial",
    alt: "Recorte do ARARAT Viewer: plano axial T2 de RM sintética, marcado como ilustrativo, com uma ROI elíptica identificada como ROI ilustrativa.",
  },
  alt: "Tela do ARARAT Viewer em ambiente demonstrativo com RM sintética: planos T2 axial, coronal e sagital lado a lado, uma ROI elíptica identificada como ilustrativa no plano axial e o quadro de volume 3D com a mensagem Visualização não gerada; painel de análise com abas de metadados, segmentação, ROIs, lesões, inferência, revisão clínica, imagens do relatório e medições, aviso Aguardando revisão humana, scores marcados como não disponíveis nesta versão, nenhuma lesão listada antes de executar a inferência e explicabilidade ainda não disponível nesta versão.",
  legenda:
    "ARARAT Viewer em ambiente demonstrativo, com RM sintética: três planos T2 (axial, coronal e sagital) e uma ROI ilustrativa — não é máscara de lesão. Nesta captura não há inferência executada: scores e explicabilidade aparecem como indisponíveis nesta versão e o 3D não foi gerado. Versão do Viewer não identificada na captura.",
  mostra: [
    "Planos T2 axial, coronal e sagital lado a lado",
    "ROI elíptica ilustrativa",
    "Painel de análise com abas de revisão clínica, imagens do relatório e medições",
  ],
  naoMostra: [
    "Comparação T2/ADC/DWI (os três planos são T2)",
    "Máscara de lesão ou resultado de inferência",
    "Scores e explicabilidade (indisponíveis nesta versão)",
    "Volume 3D (não gerado)",
    "Relatório PDF gerado",
  ],
};

/**
 * Recursos do Viewer documentados no Cérebro (versão 2.0.1, 06/10/2026) como integrados, mas NÃO
 * demonstrados por estas capturas. Fonte documental: a revisão não inspecionou o executável atual.
 */
export const VIEWER_DOCUMENTADO = [
  "Comparação de séries T2, ADC e DWI na mesma referência espacial",
  "Medições e ROIs persistentes",
  "Imagens-chave da revisão",
  "Relatório em PDF",
] as const;
