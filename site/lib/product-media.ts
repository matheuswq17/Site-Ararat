/**
 * Percurso do produto (Plataforma) e encaixe para a demonstração REAL do Hub/Viewer.
 *
 * Um único encaixe: `PRODUCT_ROUTE` descreve os quatro acontecimentos do uso real
 * (sempre visível como faixa de etapas); `PRODUCT_DEMO` liga as capturas autorizadas a
 * esses acontecimentos. Estado atual: `PRODUCT_DEMO = null` — nenhuma captura nova do
 * Hub/Viewer foi fornecida. Enquanto for null, a Plataforma mostra a captura real atual
 * do Hub e o aviso "Capturas do Viewer em preparação"; nada simulado é exibido e nenhum
 * arquivo inexistente é requisitado. Como ativar: site/PRODUCT-MEDIA.md.
 */

export type ProductEventId = "hub" | "caso" | "viewer" | "revisao";

export type ProductEvent = {
  id: ProductEventId;
  /** Nome curto (botão / faixa de etapas). */
  title: string;
  /** O que acontece nessa etapa — descrição do produto, vale com ou sem captura. */
  summary: string;
};

/** Os quatro acontecimentos do percurso real (fonte: references/produto/contexto-produto-fonte.md §4–6). */
export const PRODUCT_ROUTE: readonly ProductEvent[] = [
  {
    id: "hub",
    title: "Hub",
    summary: "Os estudos DICOM chegam, entram na fila de processamento e aparecem com status para a equipe.",
  },
  {
    id: "caso",
    title: "Abrir o caso",
    summary: "Da fila, o caso pronto para revisão é aberto diretamente no Viewer.",
  },
  {
    id: "viewer",
    title: "Séries e máscaras",
    summary: "No Viewer, o especialista percorre as séries de RM e sobrepõe as máscaras de segmentação.",
  },
  {
    id: "revisao",
    title: "Revisar a análise",
    summary: "Medidas, análise e explicabilidade ficam ao lado da imagem para a revisão do especialista.",
  },
] as const;

/** Uma captura estática real. Várias etapas podem usar a mesma captura. */
export type ProductMedia = {
  id: string;
  /** Arquivo em public/product/ (ou data: URI apenas no harness de teste). */
  src: string;
  width: number;
  height: number;
  /** Descreve o que está visível na captura. */
  alt: string;
};

/**
 * Comentário de uma etapa sobre uma captura. Só pode descrever o que está VISÍVEL
 * nela; `focus` (em % da captura) contorna a área comentada — um contorno estático,
 * nunca um clique ou movimento simulado.
 */
export type ProductStep = {
  event: ProductEventId;
  mediaId: string;
  caption: string;
  focus?: { x: number; y: number; w: number; h: number };
};

export type ProductVideo = {
  /** Gravação real, sem áudio (ou com áudio desativado), MP4 H.264 e/ou WebM. */
  sources: Array<{ src: string; type: "video/mp4" | "video/webm" }>;
  poster: string;
  width: number;
  height: number;
  /** Descrição textual equivalente ao vídeo (acessibilidade). */
  description: string;
  durationSeconds: number;
};

export type ProductDemo = {
  /** Autorização do material (quem/quando), conforme informada pelo usuário. */
  authorization: string;
  /** Confirmação de que os casos exibidos são anonimizados/demonstrativos. */
  deidentified: true;
  /** Versão do software mostrada nas capturas. */
  softwareVersion: string;
  media: ProductMedia[];
  /** Na ordem do percurso; cada acontecimento pode aparecer uma vez. Etapas sem captura são omitidas. */
  steps: ProductStep[];
  /** Opcional; nunca obrigatório para ativar a demonstração. */
  video?: ProductVideo;
  /** Só no harness: rótulo visível "TESTE DE LAYOUT". Nunca em material real. */
  testLabel?: string;
};

export const PRODUCT_DEMO: ProductDemo | null = null;

/** Valida o encaixe (usado no build e no harness): referências, ordem e porcentagens. */
export function checkProductDemo(demo: ProductDemo): string[] {
  const problems: string[] = [];
  const ids = new Set(demo.media.map((m) => m.id));
  const order = PRODUCT_ROUTE.map((e) => e.id);
  let last = -1;
  const seen = new Set<string>();
  for (const s of demo.steps) {
    if (!ids.has(s.mediaId)) problems.push(`etapa ${s.event}: captura "${s.mediaId}" não existe`);
    const i = order.indexOf(s.event);
    if (i < 0) problems.push(`etapa desconhecida: ${s.event}`);
    if (i <= last) problems.push(`etapa ${s.event} fora de ordem ou repetida`);
    last = Math.max(last, i);
    if (seen.has(s.event)) problems.push(`etapa ${s.event} repetida`);
    seen.add(s.event);
    if (s.focus) {
      const { x, y, w, h } = s.focus;
      if ([x, y, w, h].some((v) => v < 0 || v > 100) || x + w > 100.01 || y + h > 100.01)
        problems.push(`etapa ${s.event}: focus fora da captura`);
    }
    if (!s.caption.trim()) problems.push(`etapa ${s.event}: legenda vazia`);
  }
  for (const m of demo.media) {
    if (!m.alt.trim()) problems.push(`captura ${m.id}: alt vazio`);
    if (!(m.width > 0 && m.height > 0)) problems.push(`captura ${m.id}: dimensões ausentes`);
  }
  if (!demo.steps.length) problems.push("nenhuma etapa");
  return problems;
}
