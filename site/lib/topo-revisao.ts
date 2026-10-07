/**
 * Fechamento da Ciência (/previa/refinada) — "revisão humana" com paisagem topográfica.
 * Ponte entre o Site (composição, frases, progresso) e o módulo do Motion (trecho luminoso nas curvas).
 *
 * Pacote: motion/proposta/topo-revisao/ 0.1.0-draft (PROPOSTA-TOPO-REVISAO-MOTION.md), copiado SEM
 * ALTERAÇÃO para public/refinada/topo-revisao-0.1.0/topo-revisao.js. O módulo enriquece o SVG estático
 * do Site (26 curvas + a dourada); o terreno não se move. Sem JS, pausa, reduzido ou falha: SVG estático.
 *
 * FONTE ÚNICA DO PROGRESSO: o Site. `progressoRevisao()` calcula p ∈ [0, 1] pela posição real da
 * composição na janela (reversível; recalculado em scroll, resize e mudança de layout) e o entrega ao
 * módulo com setProgresso(p) — o módulo é montado com progresso: 'externo' e não lê a rolagem.
 *
 *   p = 0  topo da paisagem a 85 % da altura da janela (o trecho começa já visível)
 *   p = 1  centro da 4ª frase ("A decisão permanece humana.") a 45 % da altura da janela
 *   frase/etapa = min(3, floor(p × 4)) — mesmas faixas de 0,25 das ETAPAS do módulo
 *
 * Contrato do Motion (0.1.0):
 *   createTopoRevisao(svg, { alvo, frase, progresso: 'externo', paused, reducedMotion: 'auto', onEstado })
 *   → { setProgresso(p), setPaused(b), setReducedMotion(b|null), atualizar(), state, destroy() }
 *   Evento 'topo:estado' { modo: 'animado'|'estatico', etapa 0–4, nome, progresso }; a frase recebe
 *   data-topo-etapa e data-topo-modo.
 */
export type EstadoTopo = { modo: "animado" | "estatico"; etapa: number; nome: string; progresso: number; fase?: "frases" | "encerramento" | "final"; encerramento?: number };

export type TopoRevisao = {
  VERSION: string;
  /** p: frases (0–1). e: encerramento (0–1, só depois de p = 1; ignorado pelos módulos 0.1/0.2). */
  setProgresso(p: number, e?: number): void;
  setPaused(v: boolean): void;
  setReducedMotion(v: boolean | null): void;
  atualizar(): void;
  readonly state: EstadoTopo & { alvo: number; animando: boolean };
  destroy(): void;
};

export type CreateTopoRevisao = (
  svg: SVGSVGElement,
  opts: {
    alvo?: Element;
    frase?: HTMLElement | null;
    progresso: "externo" | "rolagem";
    paused: boolean;
    reducedMotion: "auto" | boolean;
    onEstado?: (e: EstadoTopo) => void;
  },
) => TopoRevisao;

export const TOPO_REVISAO_PACKAGE = {
  url: "/refinada/topo-revisao-0.1.0/topo-revisao.js",
  version: "0.1.0-draft",
  exportName: "createTopoRevisao",
} as const;

declare global {
  interface Window {
    __TOPO_REVISAO_TESTE__?: { url: string; exportName?: string };
  }
}

export async function carregarTopoRevisao(pacote: { url: string; exportName: string } = TOPO_REVISAO_PACKAGE): Promise<CreateTopoRevisao> {
  const teste = typeof window !== "undefined" ? window.__TOPO_REVISAO_TESTE__ : undefined;
  const fonte = teste ? { url: teste.url, exportName: teste.exportName ?? "createTopoRevisao" } : pacote;
  const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ fonte.url);
  const f = mod[fonte.exportName];
  if (typeof f !== "function") throw new Error(`${fonte.exportName} ausente`);
  return f as CreateTopoRevisao;
}

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Progresso pela posição real: `comp` = composição; `paisagem` = área do desenho; `ultima` = 4ª frase. */
export function progressoRevisao(comp: DOMRect, paisagem: DOMRect, ultima: DOMRect, vh: number): number {
  const inicio = 0.85 * vh - (paisagem.top - comp.top); // comp.top quando p = 0
  const fim = 0.45 * vh - (ultima.top + ultima.height / 2 - comp.top); // comp.top quando p = 1
  if (inicio <= fim) return 1;
  return clamp01((inicio - comp.top) / (inicio - fim));
}

export const fraseAtiva = (p: number) => Math.min(3, Math.floor(p * 4));

/**
 * Encerramento (topo-revisao 0.3.0, contrato combinado com o Motion): e ∈ [0, 1], continuação depois de p = 1.
 * FONTE ÚNICA = Site, pela posição real do bloco (recalculada em scroll, resize e mudança de layout); nada de
 * contagem de rolagens, deltas de roda ou temporizadores.
 *   e = 0  no mesmo ponto de p = 1 (centro da 4ª frase a 45 % da janela) — fim das frases
 *   e = 1  quando o topo da área da paisagem (já com a reserva do arco) chega a `topoLivre`
 *          (--header-h + 12 px): fim do desenho, arco inteiro abaixo do menu, composição toda na tela.
 * Janela mínima de 0,2 × altura da janela (telas baixas), para o gesto não virar um salto.
 */
export function encerramentoRevisao(comp: DOMRect, paisagem: DOMRect, ultima: DOMRect, vh: number, topoLivre: number): number {
  const e0 = 0.45 * vh - (ultima.top + ultima.height / 2 - comp.top); // comp.top quando e = 0 (= p = 1)
  let e1 = topoLivre - (paisagem.top - comp.top); // comp.top quando e = 1
  if (e0 - e1 < 0.2 * vh) e1 = e0 - 0.2 * vh;
  return clamp01((e0 - comp.top) / (e0 - e1));
}
