/**
 * Ciência da /previa/refinada. Fonte: auditoria factual de 06/10/2026
 * (plans/pesquisa-direcao-ararat/AUDITORIA-FACTUAL-PAPERS-SITE-2026-10-06.md).
 * Conteúdo próprio desta rota; lib/science.ts segue servindo /previa, /a e /b sem mudança.
 *
 * Regras: classificação publicada e segmentação em ajustes finais identificadas separadamente;
 * validação externa em andamento; sem métricas nesta rodada; sem links privados
 * (Drive/PDF interno); sem certificação, superioridade clínica, paridade macOS ou B11 como entregues;
 * autoria do manuscrito ≠ equipe ou parceria institucional.
 */
import type { Evidence, ScienceItem } from "./science";

/** Texto de abertura indicado pela revisão integral (sem alteração). */
export const PESQUISA_LEAD =
  "Duas frentes de pesquisa sustentam o desenvolvimento do ARARAT: classificação de agressividade por radiômica T2, com estudo publicado, e segmentação da próstata e de lesões, com manuscrito em ajustes finais. São estudos distintos, com avaliação interna; a validação externa está em andamento.";

/** 1ª camada: classificação publicada · segmentação em andamento · revisão · alcance. */
export const PESQUISA: ScienceItem[] = [
  { term: "Classificação · estudo publicado", text: "Em Clinical Radiology (2026), radiômica T2 e aprendizado de máquina foram estudados para distinguir ISUP < 3 de ISUP ≥ 3 em lesões com câncer confirmado por biópsia. Não é um estudo de detecção de câncer em exames sem diagnóstico." },
  {
    term: "Segmentação · pesquisa em andamento",
    text: "O manuscrito analisa a delimitação da próstata e de lesões em dados públicos desidentificados, com teste interno retido. Ainda não publicado, investiga onde os modelos acertam e onde falham.",
  },
  {
    term: "Limites e revisão humana",
    text: "Na pesquisa de segmentação, alvos menores e lesões de menor suspeição concentram dificuldades. Na classificação, os resultados se limitam à população e ao protocolo estudados. A revisão humana permanece essencial.",
  },
  {
    term: "Alcance",
    text: "Os estudos não validam um fluxo automático completo nem a plataforma como um todo. Seus resultados não podem ser atribuídos a outra versão de modelo ou software sem demonstrar equivalência.",
  },
];

/** 2ª camada — princípios (versão da refinada: sem absolutos). */
export const PRINCIPIOS_REFINADA: ScienceItem[] = [
  {
    term: "Separação por paciente",
    text: "Treino e teste não podem compartilhar pacientes: lesões do mesmo paciente nos dois conjuntos inflam os resultados.",
  },
  { term: "Métricas adequadas", text: "Medidas de desempenho escolhidas para o problema clínico, não para favorecer o número." },
  { term: "Generalização", text: "Atenção ao comportamento do modelo fora dos dados em que foi desenvolvido — daí a validação externa." },
  {
    term: "Rastreabilidade",
    text: "Registrar a série, a região de interesse, o pré-processamento, as características e a versão do modelo é necessário para vincular uma estimativa ao protocolo que a produziu.",
  },
  {
    term: "Explicabilidade",
    text: "O estudo publicado utilizou SHAP para analisar contribuições das características. Isso apoia a leitura; não prova que o resultado esteja correto nem revela toda a causalidade do modelo. O painel XAI do Viewer mostrado ainda não está disponível.",
  },
];

/** 2ª camada — limites (versão da refinada). */
export const LIMITES_REFINADA: ScienceItem[] = [
  { term: "Diagnóstico", text: "Nenhuma estimativa é apresentada como diagnóstico final." },
  { term: "Decisão", text: "Não substitui a avaliação de profissionais de saúde; a conduta permanece humana." },
  {
    term: "Evidência",
    text: "A publicação apresenta resultados de avaliação interna, não eficácia clínica da plataforma. Este site não apresenta métricas de desempenho nem certificação regulatória.",
  },
  { term: "Demonstrações", text: "Imagens, máscaras, capturas e contribuições mostradas no site são demonstrativas." },
];

/** Evidência pública final da classificação; o manuscrito de segmentação permanece privado. */
export const EVIDENCIAS_ROTULO = "Publicação científica";

/** Fonte pública final; não expor rascunhos ou documentos privados do Drive. */
export const SCIENCE_EVIDENCE_REFINADA: Evidence[] = [{
  kind: "artigo",
  title: "Machine learning using T2-weighted radiomics for International Society of Urological Pathology (ISUP) classification in prostate cancer",
  credit: "Ohannesian et al. · Clinical Radiology",
  year: 2026,
  href: "https://doi.org/10.1016/j.crad.2026.107417",
}];

export const METODO_REFINADA: ScienceItem[] = [
  {
    term: "Protocolo da classificação publicada",
    text: "O estudo analisou 112 lesões com câncer confirmado, da PROSTATEx. Usou T2 axial e uma ROI esférica 3D de raio de 5 mm, centrada numa lesão previamente identificada. Características extraídas com PyRadiomics alimentaram um classificador Random Forest; SHAP foi usado na análise de suas contribuições. A máscara automática da demonstração não reproduz esse protocolo.",
  },
  {
    term: "Protocolo da pesquisa de segmentação",
    text: "Em outra base de dados, modelos separados analisam a próstata inteira em T2 e lesões em T2, ADC e DWI. O alvo das lesões é ISUP ≥ 2, diferente do corte ISUP ≥ 3 do classificador publicado. O manuscrito não valida classificadores, scores ou explicabilidade.",
  },
];

/** Cartão editorial da publicação (rodada 6). Título bibliográfico completo e DOI = os mesmos de
 *  SCIENCE_EVIDENCE_REFINADA; título curto e pergunta resumem o objeto já descrito em PESQUISA. */
export const PUBLICACAO = {
  periodico: "Clinical Radiology",
  ano: 2026,
  tituloCurto: "Radiômica T2 para a classificação ISUP do câncer de próstata",
  pergunta:
    "Radiômica de T2 com aprendizado de máquina distingue ISUP < 3 de ISUP ≥ 3 em lesões com câncer de próstata confirmado por biópsia?",
  tituloCompleto: SCIENCE_EVIDENCE_REFINADA[0].title,
  autores: SCIENCE_EVIDENCE_REFINADA[0].credit.split(" · ")[0],
  href: SCIENCE_EVIDENCE_REFINADA[0].href,
  doi: SCIENCE_EVIDENCE_REFINADA[0].href.replace("https://doi.org/", ""),
} as const;
