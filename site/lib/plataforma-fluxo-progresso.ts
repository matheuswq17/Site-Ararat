/**
 * Progresso da demonstração "do Hub ao Viewer" (/previa/refinada) — FONTE ÚNICA = Site.
 *
 * Linha de leitura: no meio da área útil da janela, abaixo do cabeçalho fixo:
 *   y = cabecalho + 0,5 × (alturaJanela − cabecalho)
 * Cada etapa (<li>) ocupa um trecho da rolagem igual à sua altura real. A etapa ativa é a que contém a linha
 * de leitura; `local` ∈ [0, 1] é quanto dela já passou pela linha; `progresso` ∈ [0, 1] é o total:
 *   progresso = (índice + local) / nº de etapas   (antes da 1ª: 0; depois da última: 1)
 * Recalculado a cada medida (scroll, resize, mudança de layout): nada de contagem de rolagens, deltas de roda
 * ou temporizadores; a mesma posição sempre dá o mesmo estado (reversível).
 */
export type ProgressoFluxo = { progresso: number; etapa: number; local: number };

export const linhaDeLeitura = (vh: number, cabecalho: number) => cabecalho + 0.5 * (vh - cabecalho);

export function progressoFluxo(etapas: Array<{ top: number; height: number }>, vh: number, cabecalho: number): ProgressoFluxo {
  const n = etapas.length;
  if (!n) return { progresso: 0, etapa: 0, local: 0 };
  const y = linhaDeLeitura(vh, cabecalho);
  if (y < etapas[0].top) return { progresso: 0, etapa: 0, local: 0 };
  for (let i = 0; i < n; i++) {
    const e = etapas[i];
    const fim = i + 1 < n ? etapas[i + 1].top : e.top + e.height; // inclui o espaço entre etapas
    if (y < fim) {
      const local = Math.min(1, Math.max(0, (y - e.top) / Math.max(1, fim - e.top)));
      return { progresso: (i + local) / n, etapa: i, local };
    }
  }
  return { progresso: 1, etapa: n - 1, local: 1 };
}

/**
 * Progresso do PERCURSO ANIMADO (contrato do Motion 0.1.0): trilho alto com um palco sticky limitado à seção.
 *   p = (cabecalho − trilho.top) / (trilho.height − (alturaJanela − cabecalho)), limitado a [0, 1]
 *   p = 0 quando o palco encosta sob o cabeçalho fixo; p = 1 quando o palco se solta no fim do trilho.
 * Recalculado a cada medida (scroll, resize, mudança de layout); reversível.
 */
export function progressoTrilho(trilho: { top: number; height: number }, vh: number, cabecalho: number): number {
  const curso = trilho.height - (vh - cabecalho);
  if (curso <= 0) return trilho.top <= cabecalho ? 1 : 0;
  const p = (cabecalho - trilho.top) / curso;
  return p < 0 ? 0 : p > 1 ? 1 : p;
}
