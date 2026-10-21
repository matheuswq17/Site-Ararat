import english from "@/lib/locales/en.json";
import { ETAPAS_FLUXO, type ModuloFluxo } from "@/lib/plataforma-fluxo";
import type { Idioma } from "./textos";

/**
 * Demonstração guiada OPCIONAL da Plataforma (institucional). Usa o módulo do Motion fluxo 0.6.0-03d2 (candidato
 * com teto de ampliação; institucional-motion-v1 @ 4b47a39; copiado sem alteração para
 * public/refinada/plataforma-fluxo-0.6.0-03d2/, sha256 do módulo e do manifest conferidos com o MANIFESTO.json do
 * Motion). A /previa/refinada continua no 0.5.0-03d2 (MODULO_FLUXO_PADRAO não muda).
 *
 * Aqui o progresso NÃO vem da rolagem: o visitante escolhe a etapa e o Site leva p até a PARADA dela (o momento
 * em que o resultado da etapa está na tela), com uma transição curta. Sem relógio no módulo. Paradas escolhidas pelos
 * MOMENTOS do próprio módulo:
 *   1 fila 0,130 (estados reais da fila até "Revisão pendente") · 2 abrir 0,290 (Viewer aberto com a T2) ·
 *   3 planos 0,466 (mira e planos sincronizados) · 4 comparar 0,598 (contorno em "Sincronização segura") ·
 *   5 régua 0,688 (medida COMPLETA "M1 55,1 mm" aproximada, depois da régua concluída em 0,670) ·
 *   6 relatório 0,884 (prévia aberta a partir de "Visualizar relatório") · 7 retorno 0,958 ("Revisão pendente").
 */
export const MODULO_DEMO: ModuloFluxo = {
  versao: "0.6.0-03d2",
  url: "/refinada/plataforma-fluxo-0.6.0-03d2/plataforma-fluxo.js",
  base: "/refinada/plataforma-fluxo-0.1.0/assets/",
  exportName: "createPlataformaFluxo",
};

export const PARADAS = [0.13, 0.29, 0.466, 0.598, 0.688, 0.884, 0.958] as const;

const EN = english as Record<string, string>;
const tr = (pt: string, idioma: Idioma) => (idioma === "en" ? EN[pt] ?? pt : pt);

/** Etapas (títulos e textos da demonstração existente; EN pelo dicionário). Imagens = roteiro estático. */
export function etapasDemo(idioma: Idioma) {
  return ETAPAS_FLUXO.map((e, i) => ({
    id: e.id,
    n: e.n,
    parada: PARADAS[i],
    titulo: tr(e.titulo, idioma),
    texto: tr(e.texto, idioma),
    imagens: e.imagens.map((im) => ({ src: im.fontes[im.fontes.length - 1].src, w: im.fontes[im.fontes.length - 1].w, h: im.fontes[im.fontes.length - 1].h, alt: tr(im.alt, idioma), produto: im.produto })),
  }));
}
