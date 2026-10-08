/**
 * Paisagens do fechamento da Ciência (/previa/refinada), versionadas.
 *
 * Cada versão traz a GEOMETRIA (para o SVG estático renderizado no servidor — sem JS, pausa, movimento
 * reduzido e falha mostram exatamente este desenho, completo) e o MÓDULO do Motion que o enriquece.
 *
 *  · 0.1.0 — "linhas onduladas" (ridgeLines do TopoLandscape, sem alterá-lo) + topo-revisao 0.1.0.
 *    Preservada para comparação (?paisagem=0.1.0).
 *  · 0.2.0 — montanha reconhecível (cume dominante, pico secundário, sela, cristas e vales), geometria e
 *    renderer do Motion. Enquadramento combinado em docs/coordination/CIENCIA-MONTANHA-ENQUADRAMENTO-SITE.md.
 *    Preservada para comparação (?paisagem=0.2.0).
 *  · 0.3.0 — a MESMA montanha da 0.2.0 + encerramento (Motion topo-revisao 0.3.0-draft): depois da decisão, o
 *    brilho desce a crista e passa para um arco dourado atrás dos cumes. viewBox 0 -72 1440 432 (reserva acima
 *    dos cumes para o arco; coordenadas da montanha iguais). Enquadramento "montanha-arco". Padrão.
 */
import { ridgeLines } from "@/components/art/topo";
// Dados de render do Motion (topo-revisao 0.2.0-draft, integracao/0.2.0/fechamento-montanha.json), copiados SEM
// ALTERAÇÃO para a pasta versionada do pacote; o SSR monta o SVG a partir deles.
import MONTANHA_020 from "@/public/refinada/topo-revisao-0.2.0/fechamento-montanha.json";
import MONTANHA_030 from "@/public/refinada/topo-revisao-0.3.0/fechamento-montanha.json";
import MONTANHA_050S from "@/public/refinada/topo-revisao-0.5.0-sinal/fechamento-montanha.json";
import MONTANHA_050SE from "@/public/refinada/topo-revisao-0.5.0-sinal/fechamento-montanha-escuro.json";

export type LinhaPaisagem = { d: string; stroke: string; opacity?: number; width: number; ouro?: boolean };

export type DadosSvg = {
  versao: string;
  geometria: string;
  svgAtributos: Record<string, string>;
  defs: string;
  elementos: Record<string, string>[];
  ouroIndice: number;
  /** 0.3.0+: unidades do viewBox reservadas acima da montanha (arco) e índice do arco em `elementos`. */
  reserva?: number;
  arcoIndice?: number;
};

export type Paisagem = {
  versao: string;
  /** viewBox real do desenho: [x, y, largura, altura] — usado também pelo renderer para a escala. */
  viewBox: [number, number, number, number];
  preserveAspectRatio: string;
  /** Enquadramento CSS da área (RevisaoHumanaRefinada.module.css): "linhas" = 0.1.0; "montanha" = combinado com o Motion. */
  enquadramento: "linhas" | "montanha" | "montanha-arco";
  /** 0.3.0+: tem a etapa de encerramento (progresso `e`, depois de p = 1). */
  encerramento?: boolean;
  linhas: LinhaPaisagem[];
  /** Geometria em DADOS do Motion (0.2.0+): atributos do <svg>, <defs> e caminhos em ordem, com estilo. */
  dados?: DadosSvg;
  modulo: { url: string; exportName: string; version: string };
};

function paisagem010(): Paisagem {
  const W = 1440, H = 300;
  const L = ridgeLines(26, W, H);
  const minY = Math.min(...L.flatMap((d) => [...d.matchAll(/[ML][\d.-]+ ([\d.-]+)/g)].map((m) => +m[1])));
  const topo = Math.floor(minY - 10);
  return {
    versao: "0.1.0",
    viewBox: [0, topo, W, H + 4 - topo],
    preserveAspectRatio: "xMidYMax slice",
    enquadramento: "linhas",
    linhas: [
      ...L.map((d, i) => ({ d, stroke: "#415A77", opacity: 0.18 + (i / L.length) * 0.4, width: 1 })),
      { d: L[13], stroke: "#D4AF37", width: 1.8, ouro: true },
    ],
    modulo: { url: "/refinada/topo-revisao-0.1.0/topo-revisao.js", exportName: "createTopoRevisao", version: "0.1.0-draft" },
  };
}

function paisagem020(): Paisagem {
  const dados = MONTANHA_020 as unknown as DadosSvg;
  const vb = dados.svgAtributos.viewBox.split(/[\s,]+/).map(Number) as Paisagem["viewBox"];
  return {
    versao: "0.2.0",
    viewBox: vb, // 0 0 1440 360 — o renderer mede a escala pelo getScreenCTM() do próprio SVG
    preserveAspectRatio: dados.svgAtributos.preserveAspectRatio,
    enquadramento: "montanha",
    linhas: [],
    dados,
    modulo: { url: "/refinada/topo-revisao-0.2.0/topo-revisao.js", exportName: "createTopoRevisao", version: dados.versao },
  };
}

function paisagem030(): Paisagem {
  const dados = MONTANHA_030 as unknown as DadosSvg;
  const vb = dados.svgAtributos.viewBox.split(/[\s,]+/).map(Number) as Paisagem["viewBox"];
  return {
    versao: "0.3.0",
    viewBox: vb, // 0 -72 1440 432
    preserveAspectRatio: dados.svgAtributos.preserveAspectRatio,
    enquadramento: "montanha-arco",
    encerramento: true,
    linhas: [],
    dados,
    modulo: { url: "/refinada/topo-revisao-0.3.0/topo-revisao.js", exportName: "createTopoRevisao", version: dados.versao },
  };
}

// brand-sinal-v1: fechamento 0.5.0-sinal do Motion (@ 99c91c8; 5/5) — mesma geometria 0.3.0 em cinzas, sem halo.
// "0.5.0-sinal" = tema claro (fundo #F6F6F6); "0.5.0-sinal-escuro" = seção escura (#111111).
function paisagem050sinal(dadosJson: unknown, versao: string): Paisagem {
  const dados = dadosJson as DadosSvg;
  const vb = dados.svgAtributos.viewBox.split(/[\s,]+/).map(Number) as Paisagem["viewBox"];
  return {
    versao,
    viewBox: vb,
    preserveAspectRatio: dados.svgAtributos.preserveAspectRatio,
    enquadramento: "montanha-arco",
    encerramento: true,
    linhas: [],
    dados,
    modulo: { url: "/refinada/topo-revisao-0.5.0-sinal/topo-revisao.js", exportName: "createTopoRevisao", version: dados.versao },
  };
}

export const PAISAGENS: Record<string, Paisagem> = {
  "0.1.0": paisagem010(),
  "0.2.0": paisagem020(),
  "0.3.0": paisagem030(),
  "0.5.0-sinal": paisagem050sinal(MONTANHA_050S, "0.5.0-sinal"),
  "0.5.0-sinal-escuro": paisagem050sinal(MONTANHA_050SE, "0.5.0-sinal-escuro"),
};

/** Versão mostrada por padrão (a mais nova registrada). */
export const VERSAO_PADRAO = "0.5.0-sinal";

export function paisagemDe(versao: string | null | undefined): Paisagem {
  return (versao && PAISAGENS[versao]) || PAISAGENS[VERSAO_PADRAO];
}
