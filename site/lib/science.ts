/**
 * Conteúdo de Ciência. Cada afirmação está mapeada em site/COPY-RASTREABILIDADE.md
 * (afirmação → fonte → natureza → confirmação pendente).
 *
 * Natureza: "escopo" (o que o produto cobre), "principio" (requisito de método pelo
 * qual o trabalho deve ser avaliado — NÃO é resultado obtido) e "limite" (como não ler).
 */

export type ScienceItem = { term: string; text: string };

export const SCOPE: ScienceItem[] = [
  { term: "Imagem", text: "Ressonância magnética de próstata, com suas séries e planos." },
  { term: "Finalidade", text: "Apoio à análise médica e à pesquisa em oncologia de próstata." },
  { term: "Uso", text: "Dentro de um fluxo de revisão — do Hub ao Viewer — conduzido por especialistas." },
  { term: "Situação", text: "Plataforma em validação." },
];

export const PRINCIPLES: ScienceItem[] = [
  {
    term: "Separação por paciente",
    text: "Treino e teste não podem compartilhar pacientes: lesões do mesmo paciente nos dois conjuntos inflam os resultados.",
  },
  { term: "Métricas adequadas", text: "Medidas de desempenho escolhidas para o problema clínico, não para favorecer o número." },
  { term: "Generalização", text: "Atenção ao comportamento do modelo fora dos dados em que foi desenvolvido." },
  {
    term: "Rastreabilidade",
    text: "Do DICOM recebido às séries, à segmentação, às medidas, às features e ao resultado: um percurso que pode ser acompanhado.",
  },
  {
    term: "Explicabilidade",
    text: "Nenhuma saída sem contexto: região analisada, máscara de base e características de maior peso.",
  },
];

export const LIMITS: ScienceItem[] = [
  { term: "Diagnóstico", text: "Nenhuma estimativa é apresentada como diagnóstico final." },
  { term: "Decisão", text: "Não substitui a avaliação de profissionais de saúde; a conduta permanece humana." },
  {
    term: "Evidência",
    text: "Este site não apresenta métricas de desempenho, validação externa ou certificação regulatória — e nada aqui deve ser lido como tal.",
  },
  { term: "Demonstrações", text: "Imagens, máscaras e contribuições mostradas no site são demonstrativas." },
];

/**
 * Evidências publicadas (artigo, preprint, relatório de validação). VAZIO: nenhuma
 * evidência específica foi fornecida. Quando houver, preencher e o bloco "Publicações
 * e resultados" aparece em Ciência; vazio, nada é renderizado.
 */
export type Evidence = {
  kind: "artigo" | "preprint" | "relatório" | "apresentação";
  title: string;
  /** Autores/instituição, como na publicação. */
  credit: string;
  year: number;
  /** Link permanente (DOI ou URL oficial). */
  href: string;
};

export const SCIENCE_EVIDENCE: Evidence[] = [];
