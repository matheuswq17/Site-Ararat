/* ARARAT — fechamento da Ciência: paisagem ligada à revisão humana. 0.7.0-03d2 — rodada editorial 03D2.
 * 0.7.0-03d2: o trecho luminoso é um traço único e opaco (3.4 px, 1.6× o trecho), SEM filete nem halo;
 * a crista fica mais clara durante o percurso (claro #919191 / escuro #5E5E5E) para o traço se separar dela só por
 * contraste; no fim ela fica a 0.75 (era 0,5), para o cume manter o peso. Geometrias `fechamento-0.7.0-03d2` e `-escuro` = mesmos caminhos. Coreografia, tempos e contrato iguais.
 * Histórico 0.6.0-03d2:
 * 0.6.0-03d2: SÓ cores e o desenho do trecho luminoso mudam. Duas geometrias de tema com os MESMOS caminhos da 0.3.0:
 * `fechamento-0.6.0-03d2` (claro: linhas #5E5E5E/#303030, crista #777777, brilho #111111 com filete #F6F6F6, arco #111111)
 * e `fechamento-0.6.0-03d2-escuro` (escuro: linhas #919191/#ABABAB, crista #777777, brilho #EDEDED com filete #111111,
 * arco #EDEDED). Crista e brilho em tons diferentes: o percurso é visível desde o primeiro passo da continuação.
 * Coreografia, tempos, contrato e reversibilidade idênticos. O arco é gesto desta composição, não o símbolo.
 * Base: 0.3.0-draft.
 *
 *
 * Metáfora visual, não demonstração: nenhum score, máscara, indicador ou dado. O terreno nunca se move;
 * só trechos luminosos dourados percorrem as curvas que já existem, guiados pelo progresso da rolagem.
 *
 * 0.2.0: geometria própria do fechamento (montanha com cume dominante, secundário e sela; curvas de nível
 * que envolvem o relevo, com partes ocultas removidas — `geometria/fechamento-montanha.json`). A coreografia é
 * escrita por caminho (id) e por fração de comprimento, e vem embutida aqui para a geometria correspondente
 * (`data-topo-geometria` no <svg>). Se o SVG não for dessa geometria, o módulo não anima: fica a composição
 * estática completa (nunca um trecho fora do lugar).
 *
 * 0.3.0: ENCERRAMENTO. Depois de "A decisão permanece humana." chegar ao dourado (p = 1), um segundo progresso
 * `e` (0–1, também enviado pelo Site) continua o gesto: o brilho reacende no cume, desce a crista e — no mesmo
 * traço — passa para um arco dourado atrás dos cumes, que ele desenha; a crista perde intensidade na mesma medida.
 * Em e = 1 fica a composição final (montanha + crista menos intensa + arco), que é o SVG estático da geometria
 * `fechamento-0.3.0-draft`. A montanha não muda. Sem relógio próprio: só acompanha p e e (com a mesma
 * suavização curta da 0.2.0), para ao parar de rolar e reverte ao subir. A geometria 0.2.0 continua suportada
 * (sem encerramento).
 *
 *   const t = createTopoRevisao(svg, { frase, alvo, inicio, fim, paused, reducedMotion, progresso, onEstado })
 *   t.setPaused(bool) · t.setReducedMotion(bool|null) · t.setProgresso(p, e?) (com progresso: 'externo')
 *   t.atualizar() · t.state · t.destroy()
 *   Evento 'topo:estado' no svg quando etapa ou modo mudam: { modo, etapa, nome, progresso }.
 *
 * Sem JS, com pausa, com movimento reduzido ou se o módulo falhar, o SVG do Site é a composição completa — e é
 * também o estado final da animação (0.2.0: p = 1; 0.3.0: p = 1 e e = 1). A frase recebe data-topo-etapa (0–4;
 * o encerramento continua na etapa 4, com a decisão dourada) e data-topo-fase ('frases' | 'encerramento' | 'final').
 */
export const VERSION = '0.7.0-03d2';
export const ETAPAS = [
  { etapa: 1, nome: 'sugere', de: 0, ate: 0.25 },
  { etapa: 2, nome: 'revisa', de: 0.25, ate: 0.5 },
  { etapa: 3, nome: 'contextualiza', de: 0.5, ate: 0.75 },
  { etapa: 4, nome: 'decisao', de: 0.75, ate: 1 },
];
const NS = 'http://www.w3.org/2000/svg';

/* Coreografias por geometria (gerado por scripts/gerar-modulo.mjs a partir de geometria/coreografia.json). */
export const COREOGRAFIAS = {"fechamento-0.2.0-draft":{"geometria":"fechamento-0.2.0-draft","trechos":[{"id":"sugere","linha":"n32-0","nivel":0.798,"chaves":[[0,0.17222,0.28585,0],[0.06,0.26511,0.41579,1],[0.25,0.50065,0.49375,1],[0.45,0.74179,0.49375,1],[0.52,0.79435,0.41579,0]]},{"id":"viz-70","linha":"n28-1","nivel":0.702,"chaves":[[0.25,0.61774,0.15908,0],[0.31,0.54571,0.31815,1],[0.5,0.29666,0.37118,1],[0.64,0.17062,0.33583,0.6],[0.7,0.13515,0.30048,0]]},{"id":"viz-60","linha":"n24-1","nivel":0.606,"chaves":[[0.28,0.48864,0.11877,0],[0.34,0.55593,0.23755,1],[0.5,0.77567,0.27714,1],[0.64,0.85489,0.25074,0.6],[0.7,0.8813,0.22435,0]]},{"id":"viz-90","linha":"n36-0","nivel":0.894,"chaves":[[0.31,0.30259,0.2368,0],[0.37,0.38203,0.3552,0.9],[0.5,0.61988,0.39467,0.8],[0.58,0.70024,0.3552,0]]},{"id":"viz-sec","linha":"n18-1","nivel":0.462,"chaves":[[0.35,0.19336,0.23106,0],[0.41,0.3204,0.42361,0.9],[0.55,0.62926,0.46212,0.8],[0.66,0.74903,0.3851,0]]},{"id":"base-32","linha":"n12-2","nivel":0.318,"chaves":[[0.5,0.27459,0.0636,0],[0.56,0.33248,0.1272,0.9],[0.72,0.65675,0.13877,0.8],[0.8,0.74383,0.11564,0]]},{"id":"base-34","linha":"n13-1","nivel":0.342,"chaves":[[0.52,0.86193,0.1828,0],[0.58,0.77891,0.34529,0.9],[0.72,0.36349,0.3656,0.8],[0.8,0.21975,0.30467,0]]},{"id":"base-22","linha":"n08-0","nivel":0.222,"chaves":[[0.54,0.34533,0.04419,0],[0.6,0.30017,0.0924,0.85],[0.74,0.15238,0.10043,0.7],[0.82,0.11211,0.08838,0]]},{"id":"base-10","linha":"n03-0","nivel":0.102,"chaves":[[0.56,0.58938,0.01855,0],[0.62,0.61497,0.04047,0.85],[0.75,0.72572,0.04384,0.7],[0.82,0.75959,0.03878,0]]},{"id":"base-05","linha":"n01-0","nivel":0.054,"chaves":[[0.58,0.4512,0.01469,0],[0.64,0.42446,0.03472,0.75],[0.76,0.28982,0.03739,0.6],[0.84,0.24973,0.03205,0]]},{"id":"crista-esq","linha":"crista","chaves":[[0.48,0.59279,0.02956,0],[0.53,0.5698,0.08538,1],[0.78,0,0.09852,1],[0.8,0,0.09852,0]]},{"id":"crista-dir","linha":"crista","chaves":[[0.48,0.59279,0.02956,0],[0.53,0.61578,0.08538,1],[0.78,1,0.09852,1],[0.8,1,0.09852,0]]},{"id":"assenta","linha":"crista","chaves":[[0.745,0.78772,0.04926,0],[0.79,0.72115,0.09195,0.9],[0.88,0.64701,0.07881,0.75],[0.96,0.60905,0.06568,0.45],[1,0.59625,0.05911,0]]}],"desenho":{"linha":"crista","de":0.5,"ate":0.78,"esquerda":"crista-esq","direita":"crista-dir","centro":0.59279},"camadas":[{"largura":10,"alfa":0.13,"fator":1.5,"cor":"#D4AF37"},{"largura":4.5,"alfa":0.36,"fator":1.12,"cor":"#D4AF37"},{"largura":2.2,"alfa":1,"fator":0.72,"cor":"#D9B23A"}]},"fechamento-0.3.0-draft":{"geometria":"fechamento-0.3.0-draft","trechos":[{"id":"sugere","linha":"n32-0","nivel":0.798,"chaves":[[0,0.17222,0.28585,0],[0.06,0.26511,0.41579,1],[0.25,0.50065,0.49375,1],[0.45,0.74179,0.49375,1],[0.52,0.79435,0.41579,0]]},{"id":"viz-70","linha":"n28-1","nivel":0.702,"chaves":[[0.25,0.61774,0.15908,0],[0.31,0.54571,0.31815,1],[0.5,0.29666,0.37118,1],[0.64,0.17062,0.33583,0.6],[0.7,0.13515,0.30048,0]]},{"id":"viz-60","linha":"n24-1","nivel":0.606,"chaves":[[0.28,0.48864,0.11877,0],[0.34,0.55593,0.23755,1],[0.5,0.77567,0.27714,1],[0.64,0.85489,0.25074,0.6],[0.7,0.8813,0.22435,0]]},{"id":"viz-90","linha":"n36-0","nivel":0.894,"chaves":[[0.31,0.30259,0.2368,0],[0.37,0.38203,0.3552,0.9],[0.5,0.61988,0.39467,0.8],[0.58,0.70024,0.3552,0]]},{"id":"viz-sec","linha":"n18-1","nivel":0.462,"chaves":[[0.35,0.19336,0.23106,0],[0.41,0.3204,0.42361,0.9],[0.55,0.62926,0.46212,0.8],[0.66,0.74903,0.3851,0]]},{"id":"base-32","linha":"n12-2","nivel":0.318,"chaves":[[0.5,0.27459,0.0636,0],[0.56,0.33248,0.1272,0.9],[0.72,0.65675,0.13877,0.8],[0.8,0.74383,0.11564,0]]},{"id":"base-34","linha":"n13-1","nivel":0.342,"chaves":[[0.52,0.86193,0.1828,0],[0.58,0.77891,0.34529,0.9],[0.72,0.36349,0.3656,0.8],[0.8,0.21975,0.30467,0]]},{"id":"base-22","linha":"n08-0","nivel":0.222,"chaves":[[0.54,0.34533,0.04419,0],[0.6,0.30017,0.0924,0.85],[0.74,0.15238,0.10043,0.7],[0.82,0.11211,0.08838,0]]},{"id":"base-10","linha":"n03-0","nivel":0.102,"chaves":[[0.56,0.58938,0.01855,0],[0.62,0.61497,0.04047,0.85],[0.75,0.72572,0.04384,0.7],[0.82,0.75959,0.03878,0]]},{"id":"base-05","linha":"n01-0","nivel":0.054,"chaves":[[0.58,0.4512,0.01469,0],[0.64,0.42446,0.03472,0.75],[0.76,0.28982,0.03739,0.6],[0.84,0.24973,0.03205,0]]},{"id":"crista-esq","linha":"crista","chaves":[[0.48,0.59279,0.02956,0],[0.53,0.5698,0.08538,1],[0.78,0,0.09852,1],[0.8,0,0.09852,0]]},{"id":"crista-dir","linha":"crista","chaves":[[0.48,0.59279,0.02956,0],[0.53,0.61578,0.08538,1],[0.78,1,0.09852,1],[0.8,1,0.09852,0]]},{"id":"assenta","linha":"crista","chaves":[[0.745,0.78772,0.04926,0],[0.79,0.72115,0.09195,0.9],[0.88,0.64701,0.07881,0.75],[0.96,0.60905,0.06568,0.45],[1,0.59625,0.05911,0]]}],"desenho":{"linha":"crista","de":0.5,"ate":0.78,"esquerda":"crista-esq","direita":"crista-dir","centro":0.59279},"camadas":[{"largura":10,"alfa":0.13,"fator":1.5,"cor":"#D4AF37"},{"largura":4.5,"alfa":0.36,"fator":1.12,"cor":"#D4AF37"},{"largura":2.2,"alfa":1,"fator":0.72,"cor":"#D9B23A"}],"encerramento":{"gesto":"M870.0 52.1L868.0 52.7L866.0 53.9L852.0 64.8L827.0 82.1L802.0 99.1L783.0 111.2L769.0 119.7L752.0 129.1L739.0 135.7L728.0 140.6L722.0 142.6L718.0 142.9L714.0 142.2L709.0 140.2L702.0 136.2L690.0 128.1L673.0 115.6L662.0 106.9L660.0 105.9L658.0 105.8L655.0 107.3L646.0 115.2L635.0 124.3L617.0 138.5L613.8 140.9A224 224 0 0 1 1059.0 171.5","juncao":0.31549,"arco":"arco","crista":"crista","cristaFinal":0.5,"completo":0.97,"chaves":[[0,0,0.01649,0],[0.06,0.01031,0.04948,1],[0.32,0.31549,0.04123,0.85],[0.4,0.38765,0.05566,1],[0.86,0.96908,0.05979,0.95],[0.93,0.99382,0.04123,0.55],[0.985,1,0.0268,0]]}},"fechamento-0.6.0-03d2":{"geometria":"fechamento-0.6.0-03d2","trechos":[{"id":"sugere","linha":"n32-0","nivel":0.798,"chaves":[[0,0.17222,0.28585,0],[0.06,0.26511,0.41579,1],[0.25,0.50065,0.49375,1],[0.45,0.74179,0.49375,1],[0.52,0.79435,0.41579,0]]},{"id":"viz-70","linha":"n28-1","nivel":0.702,"chaves":[[0.25,0.61774,0.15908,0],[0.31,0.54571,0.31815,1],[0.5,0.29666,0.37118,1],[0.64,0.17062,0.33583,0.6],[0.7,0.13515,0.30048,0]]},{"id":"viz-60","linha":"n24-1","nivel":0.606,"chaves":[[0.28,0.48864,0.11877,0],[0.34,0.55593,0.23755,1],[0.5,0.77567,0.27714,1],[0.64,0.85489,0.25074,0.6],[0.7,0.8813,0.22435,0]]},{"id":"viz-90","linha":"n36-0","nivel":0.894,"chaves":[[0.31,0.30259,0.2368,0],[0.37,0.38203,0.3552,0.9],[0.5,0.61988,0.39467,0.8],[0.58,0.70024,0.3552,0]]},{"id":"viz-sec","linha":"n18-1","nivel":0.462,"chaves":[[0.35,0.19336,0.23106,0],[0.41,0.3204,0.42361,0.9],[0.55,0.62926,0.46212,0.8],[0.66,0.74903,0.3851,0]]},{"id":"base-32","linha":"n12-2","nivel":0.318,"chaves":[[0.5,0.27459,0.0636,0],[0.56,0.33248,0.1272,0.9],[0.72,0.65675,0.13877,0.8],[0.8,0.74383,0.11564,0]]},{"id":"base-34","linha":"n13-1","nivel":0.342,"chaves":[[0.52,0.86193,0.1828,0],[0.58,0.77891,0.34529,0.9],[0.72,0.36349,0.3656,0.8],[0.8,0.21975,0.30467,0]]},{"id":"base-22","linha":"n08-0","nivel":0.222,"chaves":[[0.54,0.34533,0.04419,0],[0.6,0.30017,0.0924,0.85],[0.74,0.15238,0.10043,0.7],[0.82,0.11211,0.08838,0]]},{"id":"base-10","linha":"n03-0","nivel":0.102,"chaves":[[0.56,0.58938,0.01855,0],[0.62,0.61497,0.04047,0.85],[0.75,0.72572,0.04384,0.7],[0.82,0.75959,0.03878,0]]},{"id":"base-05","linha":"n01-0","nivel":0.054,"chaves":[[0.58,0.4512,0.01469,0],[0.64,0.42446,0.03472,0.75],[0.76,0.28982,0.03739,0.6],[0.84,0.24973,0.03205,0]]},{"id":"crista-esq","linha":"crista","chaves":[[0.48,0.59279,0.02956,0],[0.53,0.5698,0.08538,1],[0.78,0,0.09852,1],[0.8,0,0.09852,0]]},{"id":"crista-dir","linha":"crista","chaves":[[0.48,0.59279,0.02956,0],[0.53,0.61578,0.08538,1],[0.78,1,0.09852,1],[0.8,1,0.09852,0]]},{"id":"assenta","linha":"crista","chaves":[[0.745,0.78772,0.04926,0],[0.79,0.72115,0.09195,0.9],[0.88,0.64701,0.07881,0.75],[0.96,0.60905,0.06568,0.45],[1,0.59625,0.05911,0]]}],"desenho":{"linha":"crista","de":0.5,"ate":0.78,"esquerda":"crista-esq","direita":"crista-dir","centro":0.59279},"camadas":[{"largura":8,"alfa":1,"fator":1.1,"cor":"#F6F6F6"},{"largura":2.8,"alfa":1,"fator":0.72,"cor":"#111111"}],"encerramento":{"gesto":"M870.0 52.1L868.0 52.7L866.0 53.9L852.0 64.8L827.0 82.1L802.0 99.1L783.0 111.2L769.0 119.7L752.0 129.1L739.0 135.7L728.0 140.6L722.0 142.6L718.0 142.9L714.0 142.2L709.0 140.2L702.0 136.2L690.0 128.1L673.0 115.6L662.0 106.9L660.0 105.9L658.0 105.8L655.0 107.3L646.0 115.2L635.0 124.3L617.0 138.5L613.8 140.9A224 224 0 0 1 1059.0 171.5","juncao":0.31549,"arco":"arco","crista":"crista","cristaFinal":0.5,"completo":0.97,"chaves":[[0,0,0.01649,0],[0.06,0.01031,0.04948,1],[0.32,0.31549,0.04123,0.85],[0.4,0.38765,0.05566,1],[0.86,0.96908,0.05979,0.95],[0.93,0.99382,0.04123,0.55],[0.985,1,0.0268,0]]}},"fechamento-0.6.0-03d2-escuro":{"geometria":"fechamento-0.6.0-03d2-escuro","trechos":[{"id":"sugere","linha":"n32-0","nivel":0.798,"chaves":[[0,0.17222,0.28585,0],[0.06,0.26511,0.41579,1],[0.25,0.50065,0.49375,1],[0.45,0.74179,0.49375,1],[0.52,0.79435,0.41579,0]]},{"id":"viz-70","linha":"n28-1","nivel":0.702,"chaves":[[0.25,0.61774,0.15908,0],[0.31,0.54571,0.31815,1],[0.5,0.29666,0.37118,1],[0.64,0.17062,0.33583,0.6],[0.7,0.13515,0.30048,0]]},{"id":"viz-60","linha":"n24-1","nivel":0.606,"chaves":[[0.28,0.48864,0.11877,0],[0.34,0.55593,0.23755,1],[0.5,0.77567,0.27714,1],[0.64,0.85489,0.25074,0.6],[0.7,0.8813,0.22435,0]]},{"id":"viz-90","linha":"n36-0","nivel":0.894,"chaves":[[0.31,0.30259,0.2368,0],[0.37,0.38203,0.3552,0.9],[0.5,0.61988,0.39467,0.8],[0.58,0.70024,0.3552,0]]},{"id":"viz-sec","linha":"n18-1","nivel":0.462,"chaves":[[0.35,0.19336,0.23106,0],[0.41,0.3204,0.42361,0.9],[0.55,0.62926,0.46212,0.8],[0.66,0.74903,0.3851,0]]},{"id":"base-32","linha":"n12-2","nivel":0.318,"chaves":[[0.5,0.27459,0.0636,0],[0.56,0.33248,0.1272,0.9],[0.72,0.65675,0.13877,0.8],[0.8,0.74383,0.11564,0]]},{"id":"base-34","linha":"n13-1","nivel":0.342,"chaves":[[0.52,0.86193,0.1828,0],[0.58,0.77891,0.34529,0.9],[0.72,0.36349,0.3656,0.8],[0.8,0.21975,0.30467,0]]},{"id":"base-22","linha":"n08-0","nivel":0.222,"chaves":[[0.54,0.34533,0.04419,0],[0.6,0.30017,0.0924,0.85],[0.74,0.15238,0.10043,0.7],[0.82,0.11211,0.08838,0]]},{"id":"base-10","linha":"n03-0","nivel":0.102,"chaves":[[0.56,0.58938,0.01855,0],[0.62,0.61497,0.04047,0.85],[0.75,0.72572,0.04384,0.7],[0.82,0.75959,0.03878,0]]},{"id":"base-05","linha":"n01-0","nivel":0.054,"chaves":[[0.58,0.4512,0.01469,0],[0.64,0.42446,0.03472,0.75],[0.76,0.28982,0.03739,0.6],[0.84,0.24973,0.03205,0]]},{"id":"crista-esq","linha":"crista","chaves":[[0.48,0.59279,0.02956,0],[0.53,0.5698,0.08538,1],[0.78,0,0.09852,1],[0.8,0,0.09852,0]]},{"id":"crista-dir","linha":"crista","chaves":[[0.48,0.59279,0.02956,0],[0.53,0.61578,0.08538,1],[0.78,1,0.09852,1],[0.8,1,0.09852,0]]},{"id":"assenta","linha":"crista","chaves":[[0.745,0.78772,0.04926,0],[0.79,0.72115,0.09195,0.9],[0.88,0.64701,0.07881,0.75],[0.96,0.60905,0.06568,0.45],[1,0.59625,0.05911,0]]}],"desenho":{"linha":"crista","de":0.5,"ate":0.78,"esquerda":"crista-esq","direita":"crista-dir","centro":0.59279},"camadas":[{"largura":8,"alfa":1,"fator":1.1,"cor":"#111111"},{"largura":2.8,"alfa":1,"fator":0.72,"cor":"#EDEDED"}],"encerramento":{"gesto":"M870.0 52.1L868.0 52.7L866.0 53.9L852.0 64.8L827.0 82.1L802.0 99.1L783.0 111.2L769.0 119.7L752.0 129.1L739.0 135.7L728.0 140.6L722.0 142.6L718.0 142.9L714.0 142.2L709.0 140.2L702.0 136.2L690.0 128.1L673.0 115.6L662.0 106.9L660.0 105.9L658.0 105.8L655.0 107.3L646.0 115.2L635.0 124.3L617.0 138.5L613.8 140.9A224 224 0 0 1 1059.0 171.5","juncao":0.31549,"arco":"arco","crista":"crista","cristaFinal":0.5,"completo":0.97,"chaves":[[0,0,0.01649,0],[0.06,0.01031,0.04948,1],[0.32,0.31549,0.04123,0.85],[0.4,0.38765,0.05566,1],[0.86,0.96908,0.05979,0.95],[0.93,0.99382,0.04123,0.55],[0.985,1,0.0268,0]]}},"fechamento-0.7.0-03d2":{"geometria":"fechamento-0.7.0-03d2","trechos":[{"id":"sugere","linha":"n32-0","nivel":0.798,"chaves":[[0,0.17222,0.28585,0],[0.06,0.26511,0.41579,1],[0.25,0.50065,0.49375,1],[0.45,0.74179,0.49375,1],[0.52,0.79435,0.41579,0]]},{"id":"viz-70","linha":"n28-1","nivel":0.702,"chaves":[[0.25,0.61774,0.15908,0],[0.31,0.54571,0.31815,1],[0.5,0.29666,0.37118,1],[0.64,0.17062,0.33583,0.6],[0.7,0.13515,0.30048,0]]},{"id":"viz-60","linha":"n24-1","nivel":0.606,"chaves":[[0.28,0.48864,0.11877,0],[0.34,0.55593,0.23755,1],[0.5,0.77567,0.27714,1],[0.64,0.85489,0.25074,0.6],[0.7,0.8813,0.22435,0]]},{"id":"viz-90","linha":"n36-0","nivel":0.894,"chaves":[[0.31,0.30259,0.2368,0],[0.37,0.38203,0.3552,0.9],[0.5,0.61988,0.39467,0.8],[0.58,0.70024,0.3552,0]]},{"id":"viz-sec","linha":"n18-1","nivel":0.462,"chaves":[[0.35,0.19336,0.23106,0],[0.41,0.3204,0.42361,0.9],[0.55,0.62926,0.46212,0.8],[0.66,0.74903,0.3851,0]]},{"id":"base-32","linha":"n12-2","nivel":0.318,"chaves":[[0.5,0.27459,0.0636,0],[0.56,0.33248,0.1272,0.9],[0.72,0.65675,0.13877,0.8],[0.8,0.74383,0.11564,0]]},{"id":"base-34","linha":"n13-1","nivel":0.342,"chaves":[[0.52,0.86193,0.1828,0],[0.58,0.77891,0.34529,0.9],[0.72,0.36349,0.3656,0.8],[0.8,0.21975,0.30467,0]]},{"id":"base-22","linha":"n08-0","nivel":0.222,"chaves":[[0.54,0.34533,0.04419,0],[0.6,0.30017,0.0924,0.85],[0.74,0.15238,0.10043,0.7],[0.82,0.11211,0.08838,0]]},{"id":"base-10","linha":"n03-0","nivel":0.102,"chaves":[[0.56,0.58938,0.01855,0],[0.62,0.61497,0.04047,0.85],[0.75,0.72572,0.04384,0.7],[0.82,0.75959,0.03878,0]]},{"id":"base-05","linha":"n01-0","nivel":0.054,"chaves":[[0.58,0.4512,0.01469,0],[0.64,0.42446,0.03472,0.75],[0.76,0.28982,0.03739,0.6],[0.84,0.24973,0.03205,0]]},{"id":"crista-esq","linha":"crista","chaves":[[0.48,0.59279,0.02956,0],[0.53,0.5698,0.08538,1],[0.78,0,0.09852,1],[0.8,0,0.09852,0]]},{"id":"crista-dir","linha":"crista","chaves":[[0.48,0.59279,0.02956,0],[0.53,0.61578,0.08538,1],[0.78,1,0.09852,1],[0.8,1,0.09852,0]]},{"id":"assenta","linha":"crista","chaves":[[0.745,0.78772,0.04926,0],[0.79,0.72115,0.09195,0.9],[0.88,0.64701,0.07881,0.75],[0.96,0.60905,0.06568,0.45],[1,0.59625,0.05911,0]]}],"desenho":{"linha":"crista","de":0.5,"ate":0.78,"esquerda":"crista-esq","direita":"crista-dir","centro":0.59279},"camadas":[{"largura":3.4,"alfa":1,"fator":1.6,"cor":"#111111"}],"encerramento":{"gesto":"M870.0 52.1L868.0 52.7L866.0 53.9L852.0 64.8L827.0 82.1L802.0 99.1L783.0 111.2L769.0 119.7L752.0 129.1L739.0 135.7L728.0 140.6L722.0 142.6L718.0 142.9L714.0 142.2L709.0 140.2L702.0 136.2L690.0 128.1L673.0 115.6L662.0 106.9L660.0 105.9L658.0 105.8L655.0 107.3L646.0 115.2L635.0 124.3L617.0 138.5L613.8 140.9A224 224 0 0 1 1059.0 171.5","juncao":0.31549,"arco":"arco","crista":"crista","cristaFinal":0.75,"completo":0.97,"chaves":[[0,0,0.01649,0],[0.06,0.01031,0.04948,1],[0.32,0.31549,0.04123,0.85],[0.4,0.38765,0.05566,1],[0.86,0.96908,0.05979,0.95],[0.93,0.99382,0.04123,0.55],[0.985,1,0.0268,0]]}},"fechamento-0.7.0-03d2-escuro":{"geometria":"fechamento-0.7.0-03d2-escuro","trechos":[{"id":"sugere","linha":"n32-0","nivel":0.798,"chaves":[[0,0.17222,0.28585,0],[0.06,0.26511,0.41579,1],[0.25,0.50065,0.49375,1],[0.45,0.74179,0.49375,1],[0.52,0.79435,0.41579,0]]},{"id":"viz-70","linha":"n28-1","nivel":0.702,"chaves":[[0.25,0.61774,0.15908,0],[0.31,0.54571,0.31815,1],[0.5,0.29666,0.37118,1],[0.64,0.17062,0.33583,0.6],[0.7,0.13515,0.30048,0]]},{"id":"viz-60","linha":"n24-1","nivel":0.606,"chaves":[[0.28,0.48864,0.11877,0],[0.34,0.55593,0.23755,1],[0.5,0.77567,0.27714,1],[0.64,0.85489,0.25074,0.6],[0.7,0.8813,0.22435,0]]},{"id":"viz-90","linha":"n36-0","nivel":0.894,"chaves":[[0.31,0.30259,0.2368,0],[0.37,0.38203,0.3552,0.9],[0.5,0.61988,0.39467,0.8],[0.58,0.70024,0.3552,0]]},{"id":"viz-sec","linha":"n18-1","nivel":0.462,"chaves":[[0.35,0.19336,0.23106,0],[0.41,0.3204,0.42361,0.9],[0.55,0.62926,0.46212,0.8],[0.66,0.74903,0.3851,0]]},{"id":"base-32","linha":"n12-2","nivel":0.318,"chaves":[[0.5,0.27459,0.0636,0],[0.56,0.33248,0.1272,0.9],[0.72,0.65675,0.13877,0.8],[0.8,0.74383,0.11564,0]]},{"id":"base-34","linha":"n13-1","nivel":0.342,"chaves":[[0.52,0.86193,0.1828,0],[0.58,0.77891,0.34529,0.9],[0.72,0.36349,0.3656,0.8],[0.8,0.21975,0.30467,0]]},{"id":"base-22","linha":"n08-0","nivel":0.222,"chaves":[[0.54,0.34533,0.04419,0],[0.6,0.30017,0.0924,0.85],[0.74,0.15238,0.10043,0.7],[0.82,0.11211,0.08838,0]]},{"id":"base-10","linha":"n03-0","nivel":0.102,"chaves":[[0.56,0.58938,0.01855,0],[0.62,0.61497,0.04047,0.85],[0.75,0.72572,0.04384,0.7],[0.82,0.75959,0.03878,0]]},{"id":"base-05","linha":"n01-0","nivel":0.054,"chaves":[[0.58,0.4512,0.01469,0],[0.64,0.42446,0.03472,0.75],[0.76,0.28982,0.03739,0.6],[0.84,0.24973,0.03205,0]]},{"id":"crista-esq","linha":"crista","chaves":[[0.48,0.59279,0.02956,0],[0.53,0.5698,0.08538,1],[0.78,0,0.09852,1],[0.8,0,0.09852,0]]},{"id":"crista-dir","linha":"crista","chaves":[[0.48,0.59279,0.02956,0],[0.53,0.61578,0.08538,1],[0.78,1,0.09852,1],[0.8,1,0.09852,0]]},{"id":"assenta","linha":"crista","chaves":[[0.745,0.78772,0.04926,0],[0.79,0.72115,0.09195,0.9],[0.88,0.64701,0.07881,0.75],[0.96,0.60905,0.06568,0.45],[1,0.59625,0.05911,0]]}],"desenho":{"linha":"crista","de":0.5,"ate":0.78,"esquerda":"crista-esq","direita":"crista-dir","centro":0.59279},"camadas":[{"largura":3.4,"alfa":1,"fator":1.6,"cor":"#EDEDED"}],"encerramento":{"gesto":"M870.0 52.1L868.0 52.7L866.0 53.9L852.0 64.8L827.0 82.1L802.0 99.1L783.0 111.2L769.0 119.7L752.0 129.1L739.0 135.7L728.0 140.6L722.0 142.6L718.0 142.9L714.0 142.2L709.0 140.2L702.0 136.2L690.0 128.1L673.0 115.6L662.0 106.9L660.0 105.9L658.0 105.8L655.0 107.3L646.0 115.2L635.0 124.3L617.0 138.5L613.8 140.9A224 224 0 0 1 1059.0 171.5","juncao":0.31549,"arco":"arco","crista":"crista","cristaFinal":0.75,"completo":0.97,"chaves":[[0,0,0.01649,0],[0.06,0.01031,0.04948,1],[0.32,0.31549,0.04123,0.85],[0.4,0.38765,0.05566,1],[0.86,0.96908,0.05979,0.95],[0.93,0.99382,0.04123,0.55],[0.985,1,0.0268,0]]}}};

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sstep = (t) => t * t * (3 - 2 * t);

// Hermite monotônico (Fritsch–Carlson): s(p) suave, sem parar em cada quadro-chave e sem ultrapassar
function curvaMonotona(ps, xs) {
  const n = ps.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (xs[i + 1] - xs[i]) / (ps[i + 1] - ps[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (p) => {
    if (p <= ps[0]) return xs[0];
    if (p >= ps[n - 1]) return xs[n - 1];
    let i = 0; while (p > ps[i + 1]) i++;
    const h = ps[i + 1] - ps[i], t = (p - ps[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * xs[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * xs[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
function linearSuave(ps, vs) {
  return (p) => {
    if (p <= ps[0]) return vs[0];
    const n = ps.length; if (p >= ps[n - 1]) return vs[n - 1];
    let i = 0; while (p > ps[i + 1]) i++;
    return vs[i] + (vs[i + 1] - vs[i]) * sstep((p - ps[i]) / (ps[i + 1] - ps[i]));
  };
}
/** Função pura: o que aparece no progresso p para uma coreografia (usada também nos testes). */
export function avaliar(p, coreo) {
  if (!coreo._f) coreo._f = coreo.trechos.map((t) => { const ps = t.chaves.map((k) => k[0]); return { s: curvaMonotona(ps, t.chaves.map((k) => k[1])), len: linearSuave(ps, t.chaves.map((k) => k[2])), a: linearSuave(ps, t.chaves.map((k) => k[3])) }; });
  const trechos = coreo.trechos.map((t, i) => { const f = coreo._f[i]; return { id: t.id, linha: t.linha, s: clamp01(f.s(p)), len: Math.max(0, f.len(p)), a: clamp01(f.a(p)) }; });
  const ds = coreo.desenho; let desenho = null;
  if (p >= ds.de) {
    const e = trechos.find((t) => t.id === ds.esquerda), d = trechos.find((t) => t.id === ds.direita);
    desenho = p >= ds.ate ? { s0: 0, s1: 1, completo: true } : { s0: Math.min(e.s, ds.centro), s1: Math.max(d.s, ds.centro), completo: false };
  }
  return { trechos, desenho };
}
/** Função pura do encerramento (0.3.0): onde está o brilho no gesto, quanto do arco está desenhado e a intensidade da crista. */
export function avaliarEncerramento(e, enc) {
  if (!enc._f) { const ps = enc.chaves.map((k) => k[0]); enc._f = { s: curvaMonotona(ps, enc.chaves.map((k) => k[1])), len: linearSuave(ps, enc.chaves.map((k) => k[2])), a: linearSuave(ps, enc.chaves.map((k) => k[3])) }; }
  const f = enc._f, s = clamp01(f.s(e)), len = Math.max(0, f.len(e)), a = clamp01(f.a(e));
  const arco = e >= enc.completo ? 1 : clamp01((s - enc.juncao) / (1 - enc.juncao));
  return { s, len, a, arco, crista: 1 - (1 - enc.cristaFinal) * sstep(arco), completo: e >= enc.completo };
}
export function etapaDe(p) { if (p <= 0) return 0; for (const e of ETAPAS) if (p < e.ate) return e.etapa; return 4; }

export function createTopoRevisao(svg, opts = {}) {
  const O = {
    frase: null,          // elemento com as quatro frases: recebe data-topo-etapa (0–4) e data-topo-modo
    alvo: null,           // elemento medido para o progresso (padrão: o próprio svg)
    inicio: 0.95,         // p = 0 quando o centro do alvo está nesta fração da altura da janela
    fim: 0.5,             // p = 1 quando o centro do alvo está nesta fração da altura da janela
    suavizar: 140,        // ms: acompanha a rolagem com uma suavização curta (rodas com passos grandes)
    progresso: 'rolagem', // 'rolagem' | 'externo' (o Site chama setProgresso)
    paused: false,
    reducedMotion: 'auto',
    coreografia: null,    // opcional: outra coreografia (mesmo formato); padrão: a embutida para a geometria do svg
    onEstado: null,
    raf: (f) => requestAnimationFrame(f), caf: (h) => cancelAnimationFrame(h), agora: () => performance.now(),
    ...opts,
  };
  const alvo = O.alvo || svg;
  const coreo = O.coreografia || COREOGRAFIAS[svg.getAttribute('data-topo-geometria')] || null;
  const porId = new Map([...svg.querySelectorAll('[data-topo-id]')].map((el) => [el.getAttribute('data-topo-id'), el]));
  const ouro = coreo ? porId.get(coreo.desenho.linha) || svg.querySelector('[data-topo-ouro]') : svg.querySelector('[data-topo-ouro]');
  const enc = coreo && coreo.encerramento ? coreo.encerramento : null;
  const arcoEl = enc ? porId.get(enc.arco) || null : null;
  const geometriaOk = !!coreo && !!ouro && coreo.trechos.every((t) => porId.has(t.linha)) && (!enc || !!arcoEl);
  const TMAX = enc ? 2 : 1; // linha do tempo interna: T = p (0–1) e, no encerramento, T = 1 + e
  const mqRed = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = !!O.paused, redForcado = O.reducedMotion === 'auto' ? null : !!O.reducedMotion;
  const stats = { n: 0, ms: 0, max: 0 };
  let alvoP = 0, atual = -1, handle = 0, ultimo = 0, visivel = false, destruido = false, assinatura = '', escala = 1, ouvindo = false;

  // camada dos trechos (acima das curvas e da crista)
  const g = document.createElementNS(NS, 'g'); g.setAttribute('data-topo-trechos', ''); g.setAttribute('aria-hidden', 'true');
  const els = geometriaOk ? coreo.trechos.map((t) => coreo.camadas.map((c) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', porId.get(t.linha).getAttribute('d'));
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', c.cor); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('pathLength', '1000'); p.setAttribute('stroke-dasharray', '0 3000'); p.setAttribute('stroke-dashoffset', '0'); p.setAttribute('stroke-width', '0'); p.style.opacity = '0';
    g.append(p); return p;
  })) : [];
  // 0.3.0: o brilho do encerramento percorre um único caminho (crista do cume até o flanco + arco)
  const gesto = geometriaOk && enc ? coreo.camadas.map((c) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', enc.gesto);
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', c.cor); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('pathLength', '1000'); p.setAttribute('stroke-dasharray', '0 3000'); p.setAttribute('stroke-dashoffset', '0'); p.setAttribute('stroke-width', '0'); p.style.opacity = '0';
    p.setAttribute('data-topo-gesto', '');
    g.append(p); return p;
  }) : [];
  if (geometriaOk) (ouro.parentNode || svg).append(g);
  const ouroOrig = ouro ? { dash: ouro.getAttribute('stroke-dasharray'), off: ouro.getAttribute('stroke-dashoffset'), pl: ouro.getAttribute('pathLength'), so: ouro.getAttribute('stroke-opacity') } : null;
  const arcoOrig = arcoEl ? { dash: arcoEl.getAttribute('stroke-dasharray'), off: arcoEl.getAttribute('stroke-dashoffset'), pl: arcoEl.getAttribute('pathLength') } : null;

  const reduzido = () => (redForcado != null ? redForcado : mqRed.matches);
  const estatico = () => paused || reduzido() || !geometriaOk;
  const set = (el, k, v) => { if (el.getAttribute(k) !== v) el.setAttribute(k, v); };
  const op = (el, v) => { if (el.style.opacity !== v) el.style.opacity = v; if (!v && el.getAttribute('style') === '') el.removeAttribute('style'); };
  const ocultar = (el) => { op(el, '0'); set(el, 'stroke-dasharray', '0 3000'); set(el, 'stroke-dashoffset', '0'); set(el, 'stroke-width', '0'); }; // estado oculto canônico

  function medirEscala() { const m = svg.getScreenCTM?.(); escala = (m && Math.hypot(m.a, m.b)) || 1; } // px de tela por unidade do viewBox, qualquer enquadramento
  // p (0–1) e e (0–1) → T: o encerramento só existe depois de p = 1 (e só em geometrias com encerramento)
  function alvoT(p, e) { p = clamp01(+p || 0); e = clamp01(+e || 0); return enc && p >= 1 ? 1 + e : p; }
  function progressoDaRolagem() {
    const r = alvo.getBoundingClientRect(), vh = innerHeight || 1;
    const y0 = vh * O.inicio - r.height / 2, y1 = vh * O.fim - r.height / 2;
    return clamp01((y0 - r.top) / (y0 - y1 || 1));
  }
  const repor = (el, pares) => { for (const [k, v] of pares) { if (v == null) el.removeAttribute(k); else set(el, k, v); } };
  function restaurarOuro() {
    if (!ouro) return;
    repor(ouro, [['stroke-dasharray', ouroOrig.dash], ['stroke-dashoffset', ouroOrig.off], ['pathLength', ouroOrig.pl], ['stroke-opacity', ouroOrig.so]]);
    op(ouro, '');
  }
  function restaurarArco() { if (!arcoEl) return; repor(arcoEl, [['stroke-dasharray', arcoOrig.dash], ['stroke-dashoffset', arcoOrig.off], ['pathLength', arcoOrig.pl]]); op(arcoEl, ''); }
  function ocultarArco() { if (!arcoEl) return; op(arcoEl, '0'); set(arcoEl, 'pathLength', '1000'); set(arcoEl, 'stroke-dasharray', '0 3000'); set(arcoEl, 'stroke-dashoffset', '0'); }
  function composicaoEstatica() { for (const cam of els) for (const el of cam) ocultar(el); for (const el of gesto) ocultar(el); restaurarOuro(); restaurarArco(); }
  function trecho(cam, s, len, a) { // um trecho luminoso (camadas) centrado em s, com comprimento len (frações do caminho)
    if (a < 0.01 || len <= 0) { for (const el of cam) ocultar(el); return; }
    coreo.camadas.forEach((c, j) => {
      const el = cam[j], L = len * c.fator * 1000;
      set(el, 'stroke-dasharray', `${L.toFixed(2)} 3000`);
      set(el, 'stroke-dashoffset', (-(s * 1000 - L / 2)).toFixed(2));
      set(el, 'stroke-width', (c.largura / escala).toFixed(2));
      op(el, String(+(c.alfa * a).toFixed(3)));
    });
  }
  function desenhar(T) {
    if (enc && T > 1) return desenharEncerramento(T - 1);
    if (enc) { for (const el of gesto) ocultar(el); ocultarArco(); set(ouro, 'stroke-opacity', '1'); } // durante as frases: crista inteira, sem arco
    desenharFrases(T);
  }
  function desenharEncerramento(e) {
    const r = avaliarEncerramento(e, enc);
    for (const cam of els) for (const el of cam) ocultar(el); // os trechos das frases já assentaram (p = 1)
    if (r.completo && r.a < 0.01) { composicaoEstatica(); return; } // composição final exata (= SVG estático)
    trecho(gesto, r.s, r.len, r.a);
    repor(ouro, [['stroke-dasharray', ouroOrig.dash], ['stroke-dashoffset', ouroOrig.off], ['pathLength', ouroOrig.pl]]); op(ouro, '');
    set(ouro, 'stroke-opacity', String(+r.crista.toFixed(3)));
    if (r.arco >= 1) { restaurarArco(); return; }
    if (r.arco <= 0) { ocultarArco(); return; }
    op(arcoEl, ''); set(arcoEl, 'pathLength', '1000');
    set(arcoEl, 'stroke-dasharray', `${(r.arco * 1000).toFixed(2)} 3000`); set(arcoEl, 'stroke-dashoffset', '0');
  }
  function desenharFrases(p) {
    const { trechos, desenho } = avaliar(p, coreo);
    trechos.forEach((t, i) => trecho(els[i], t.s, t.len, t.a));
    if (!desenho) { op(ouro, '0'); set(ouro, 'pathLength', '1000'); set(ouro, 'stroke-dasharray', '0 3000'); set(ouro, 'stroke-dashoffset', '0'); return; }
    if (desenho.completo) { repor(ouro, [['stroke-dasharray', ouroOrig.dash], ['stroke-dashoffset', ouroOrig.off], ['pathLength', ouroOrig.pl]]); op(ouro, ''); return; }
    op(ouro, '');
    const a = desenho.s0 * 1000, b = desenho.s1 * 1000;
    set(ouro, 'pathLength', '1000');
    set(ouro, 'stroke-dasharray', `${Math.max(0, b - a).toFixed(2)} 3000`);
    set(ouro, 'stroke-dashoffset', (-a).toFixed(2));
  }

  const faseDe = (T) => (T <= 1 ? (T >= 1 && !enc ? 'final' : 'frases') : T >= TMAX ? 'final' : 'encerramento');
  function emitir(T) {
    const modo = estatico() ? 'estatico' : 'animado';
    const p = Math.min(1, T), etapa = modo === 'estatico' ? 4 : etapaDe(p), fase = modo === 'estatico' ? 'final' : faseDe(T);
    if (O.frase) { const d = O.frase.dataset; if (d.topoEtapa !== String(etapa)) d.topoEtapa = String(etapa); if (d.topoModo !== modo) d.topoModo = modo; if (d.topoFase !== fase) d.topoFase = fase; }
    const ass = modo + etapa + fase;
    if (ass === assinatura) return;
    assinatura = ass;
    const det = { modo, etapa, nome: etapa ? ETAPAS[etapa - 1].nome : 'antes', fase, progresso: +p.toFixed(3), encerramento: +Math.max(0, T - 1).toFixed(3), geometria: geometriaOk ? coreo.geometria : null };
    svg.dispatchEvent(new CustomEvent('topo:estado', { detail: det }));
    O.onEstado?.(det);
  }
  function aplicar(p) {
    if (estatico()) { composicaoEstatica(); atual = -1; emitir(TMAX); return; }
    if (p === atual) return;
    atual = p; const t0 = performance.now(); desenhar(p); const ms = performance.now() - t0; stats.n++; stats.ms += ms; if (ms > stats.max) stats.max = ms; emitir(p);
  }
  function tick(now) {
    handle = 0;
    if (destruido || estatico()) return;
    if (O.progresso === 'rolagem') alvoP = alvoT(progressoDaRolagem(), 0);
    const dt = Math.min(64, Math.max(0, now - ultimo)); ultimo = now;
    // suavização curta + velocidade mínima (um salto grande assenta em ≤ ~0,5 s, sem cauda longa)
    let p = alvoP;
    if (atual >= 0) { const dif = alvoP - atual, passo = Math.max(Math.abs(dif) * (1 - Math.exp(-dt / O.suavizar)), Math.min(Math.abs(dif), dt / 450)); p = atual + Math.sign(dif) * passo; }
    if (Math.abs(alvoP - p) < 0.0006) p = alvoP;
    aplicar(p);
    if (p !== alvoP && visivel && !document.hidden) handle = O.raf(tick);
  }
  function acordar() {
    if (destruido) return;
    if (estatico()) { if (handle) { O.caf(handle); handle = 0; } aplicar(TMAX); return; }
    if (handle || !visivel || document.hidden) return;
    ultimo = O.agora(); handle = O.raf(tick);
  }
  const onScroll = () => acordar();
  const onResize = () => { medirEscala(); atual = -1; acordar(); };
  function ouvir(sim) {
    if (sim === ouvindo) return;
    ouvindo = sim;
    if (sim) { if (O.progresso === 'rolagem') addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onResize); }
    else { removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); }
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    visivel = es.some((e) => e.isIntersecting);
    if (visivel) { ouvir(true); medirEscala(); if (O.progresso === 'rolagem') { alvoP = alvoT(progressoDaRolagem(), 0); atual = -1; } acordar(); }
    else { ouvir(false); if (handle) { O.caf(handle); handle = 0; } if (!estatico()) aplicar(O.progresso === 'rolagem' ? progressoDaRolagem() : alvoP); }
  }, { rootMargin: '15% 0px 15% 0px' }) : null;
  if (io) io.observe(alvo); else { visivel = true; ouvir(true); }
  const onVis = () => { if (!document.hidden) acordar(); };
  document.addEventListener('visibilitychange', onVis);
  const onMq = () => acordar(); mqRed.addEventListener?.('change', onMq);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { medirEscala(); atual = -1; if (!handle) acordar(); }) : null;
  ro?.observe(svg);

  medirEscala();
  if (O.progresso === 'rolagem') alvoP = alvoT(progressoDaRolagem(), 0);
  aplicar(estatico() ? TMAX : alvoP);

  return {
    VERSION,
    geometria: geometriaOk ? coreo.geometria : null,
    setPaused(v) { paused = !!v; atual = -1; acordar(); if (!estatico()) { if (O.progresso === 'rolagem') alvoP = alvoT(progressoDaRolagem(), 0); aplicar(alvoP); } },
    setReducedMotion(v) { redForcado = v == null ? null : !!v; atual = -1; acordar(); if (!estatico()) aplicar(alvoP); },
    setProgresso(p, e = 0) { if (O.progresso !== 'externo') return; alvoP = alvoT(p, e); if (estatico()) return; if (!visivel) { aplicar(alvoP); return; } acordar(); },
    atualizar() { medirEscala(); atual = -1; if (O.progresso === 'rolagem') alvoP = alvoT(progressoDaRolagem(), 0); aplicar(estatico() ? TMAX : alvoP); },
    _stats: () => ({ atualizacoes: stats.n, msMedio: stats.n ? +(stats.ms / stats.n).toFixed(3) : 0, msMax: +stats.max.toFixed(3) }),
    _zerarStats: () => { stats.n = 0; stats.ms = 0; stats.max = 0; },
    get state() {
      const modo = estatico() ? 'estatico' : 'animado', T = modo === 'estatico' ? TMAX : Math.max(0, atual), p = Math.min(1, T), etapa = modo === 'estatico' ? 4 : etapaDe(p);
      return { modo, etapa, nome: etapa ? ETAPAS[etapa - 1].nome : 'antes', fase: modo === 'estatico' ? 'final' : faseDe(T), progresso: +p.toFixed(4), encerramento: +Math.max(0, T - 1).toFixed(4), alvo: +Math.min(1, alvoP).toFixed(4), alvoEncerramento: +Math.max(0, alvoP - 1).toFixed(4), animando: !!handle, temEncerramento: !!enc, geometria: geometriaOk ? coreo.geometria : null };
    },
    destroy() {
      destruido = true; if (handle) O.caf(handle); handle = 0;
      io?.disconnect(); ro?.disconnect(); ouvir(false); document.removeEventListener('visibilitychange', onVis); mqRed.removeEventListener?.('change', onMq);
      g.remove(); restaurarOuro(); restaurarArco();
      if (O.frase) { delete O.frase.dataset.topoEtapa; delete O.frase.dataset.topoModo; delete O.frase.dataset.topoFase; }
    },
  };
}
