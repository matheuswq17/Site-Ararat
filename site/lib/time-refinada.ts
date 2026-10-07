/**
 * Time da /previa/refinada (rodada 6). Fonte editorial: docs/coordination/BRIEF-TIME-E-ACABAMENTO-2026-10-06.md
 * (nomes, funções, biografias e fotos fornecidos pelo usuário; não verificados independentemente).
 * Regras: ordem do brief; texto das biografias sem alteração; sem sobrenome para Miguel; sem links
 * profissionais nem qualificações a mais; Victor identificado como estudante; instituições citadas
 * nos currículos não são parceiras, patrocinadoras nem endossam o ARARAT (nota da seção).
 * Fotos: derivados de scripts/derivar-time-refinada.mjs (recorte 4:5 por pessoa, só redução).
 */

export type Retrato = { src: string; w: number };

export type Integrante = {
  id: "matheus" | "miguel" | "rodrigo" | "hartmann" | "victor";
  nome: string;
  funcao: string;
  /** Biografia completa, em frases (a 1ª é o resumo inicial; as demais ficam em "Ler biografia"). */
  bio: string[];
  /** Derivados WebP 4:5, do menor ao maior. */
  fotos: Retrato[];
  alt: string;
};

const T = "/refinada/time/";
const fotos = (id: string, ws: number[]): Retrato[] => ws.map((w) => ({ src: `${T}${id}-${w}.webp`, w }));

export const TIME: Integrante[] = [
  {
    id: "matheus",
    nome: "Matheus Xavier Silva de Toledo",
    funcao: "Co-founder & Technical Lead",
    bio: [
      "Engenheiro de software e responsável técnico pelo ecossistema ARARAT.",
      "Lidera o desenvolvimento do Hub, do Viewer, do pipeline de radiômica e da integração dos modelos de IA — transformando pesquisa em produto, com foco em explicabilidade e experiência clínica.",
    ],
    fotos: fotos("matheus", [240, 360, 560, 746]),
    alt: "Retrato de Matheus Xavier Silva de Toledo",
  },
  {
    id: "miguel",
    nome: "Miguel",
    funcao: "Radiologista / Coordenador de Imagem",
    bio: [
      "Médico radiologista com graduação e doutorado pela FMUSP.",
      "Coordenador Médico do Departamento de Imagem do Hospital Israelita Einstein e professor da disciplina de Morfologia I da FICSAE.",
      "Membro da Academia Latino-Americana de Ultrassonografia e Coordenador Médico da Comissão Nacional de Ultrassonografia do Colégio Brasileiro de Radiologia (CBR) — gestão 2025–2026 — além de Coordenador do Circuito Nacional de Ultrassonografia do CBR.",
    ],
    fotos: fotos("miguel", [240, 360, 560, 880]),
    alt: "Retrato de Miguel",
  },
  {
    id: "rodrigo",
    nome: "Rodrigo Gobbo",
    funcao: "Diretor Médico / Medicina Intervencionista",
    bio: [
      "Diretor Médico do Centro de Medicina Intervencionista do Hospital Israelita Einstein e especialista STAG-MEDEV da Organização Mundial da Saúde para o ciclo 2025–2027.",
      "Atua na interface entre medicina intervencionista, inovação e implementação de tecnologias em saúde.",
    ],
    fotos: fotos("rodrigo", [240, 360, 552]),
    alt: "Retrato de Rodrigo Gobbo",
  },
  {
    id: "hartmann",
    nome: "Luiz G. Hartmann",
    funcao: "Radiologista / Consultor Médico-Científico",
    bio: [
      "Médico radiologista formado pela UNICAMP, com residência e especialização em Radiologia Musculoesquelética pela UNIFESP.",
      "Coordena cursos de pós-graduação em Imagem do Hospital Israelita Einstein, é professor de Morfologia I na FICSAE e membro do Colégio Brasileiro de Radiologia.",
    ],
    fotos: fotos("hartmann", [240, 360, 560, 880]),
    alt: "Retrato de Luiz G. Hartmann",
  },
  {
    id: "victor",
    nome: "Victor Arthur Ohannesian",
    funcao: "CEO & Co-founder",
    bio: [
      "Estudante de Medicina (MS4), com interesse em radiologia diagnóstica e intervencionista.",
      "Tem experiência em pesquisa meta-analítica de acurácia diagnóstica, modelagem estatística e análise de imagem com Stata, R e Python, além do desenvolvimento de modelos preditivos com machine learning e deep learning.",
    ],
    fotos: fotos("victor", [240, 304]),
    alt: "Retrato de Victor Arthur Ohannesian",
  },
];

export const TIME_TITULO = "Quem constrói o ARARAT";
export const TIME_INTRO = "Engenharia, pesquisa e experiência clínica reunidas no desenvolvimento do ARARAT.";
export const TIME_NOTA =
  "Funções e currículos informados pela equipe. As instituições citadas fazem parte da trajetória de cada integrante e não indicam parceria, patrocínio ou endosso ao ARARAT.";
