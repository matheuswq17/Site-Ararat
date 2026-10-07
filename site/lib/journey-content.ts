export type JourneyStep = {
  id: string;
  number: string;
  title: string;
  verb: string;
  text: string;
  detail: string;
};

/** Textos baseados em references/produto/contexto-produto-fonte.md (seções 4, 6, 7 e 8). */
export const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: "etapa-imagem",
    number: "01",
    title: "Imagem",
    verb: "Visualizar",
    text: "Uma RM de próstata reúne séries, planos e sequências — axial, sagital, coronal, T2, DWI, ADC. A análise começa pela leitura cuidadosa da imagem.",
    detail: "Os exames DICOM chegam ao Hub, são organizados e abertos no Viewer para revisão.",
  },
  {
    id: "etapa-segmentacao",
    number: "02",
    title: "Segmentação",
    verb: "Delimitar",
    text: "Próstata, zonas anatômicas e regiões suspeitas são delimitadas. O contorno define com precisão de onde os dados serão extraídos.",
    detail: "As máscaras apoiam a revisão e podem ser avaliadas pelo especialista.",
  },
  {
    id: "etapa-dados",
    number: "03",
    title: "Dados",
    verb: "Quantificar",
    text: "A radiômica transforma padrões visuais da região segmentada em descritores de forma, textura e intensidade — dados estruturados e comparáveis.",
    detail: "Cada característica vem da mesma região delimitada na etapa anterior.",
  },
  {
    id: "etapa-explicacao",
    number: "04",
    title: "Explicação",
    verb: "Explicar",
    text: "A estimativa do modelo vem acompanhada das características de maior peso e da região que as originou. Nenhuma saída sem contexto.",
    detail: "Contribuições aparecem como pesos relativos — sem número e sem diagnóstico.",
  },
];

/**
 * Textos da Jornada na /previa/refinada (rodada 5; revisão integral de 06/10/2026). Mesmos ids,
 * números, títulos e verbos de JOURNEY_STEPS (a cena do Motion e os controles não mudam); só texto
 * e detalhe ficam mais precisos:
 *  · Segmentação: sem "com precisão" (a própria pesquisa investiga os erros de segmentação).
 *  · Dados: forma, textura e intensidade como FAMÍLIAS de descritores.
 *  · Explicação: apoio à leitura, não prova de correção; "sem número" localizado na demonstração.
 */
export const JOURNEY_STEPS_REFINADA: JourneyStep[] = JOURNEY_STEPS.map((s) => {
  // Rodada 6: texto principal curto; a ressalva de cada etapa fica no detalhe (uma por etapa).
  // O caráter conceitual da cena está na introdução da Jornada (não se repete aqui).
  if (s.id === "etapa-segmentacao")
    return {
      ...s,
      text: "Máscaras de segmentação e regiões de interesse (ROIs) delimitam áreas para tarefas diferentes.",
      detail: "Nesta cena, o contorno é demonstrativo: não representa uma lesão nem a ROI do estudo publicado.",
    };
  if (s.id === "etapa-dados")
    return {
      ...s,
      text: "A radiômica quantifica padrões da região analisada em famílias de descritores — forma, textura e intensidade.",
      detail: "No estudo publicado, a extração usa T2 axial e uma ROI esférica 3D de raio de 5 mm; os recortes desta cena não a reproduzem.",
    };
  if (s.id === "etapa-explicacao")
    return {
      ...s,
      text: "No estudo publicado, SHAP analisa como as características contribuem para a classificação de agressividade — um apoio à leitura, não uma prova de que o resultado está correto.",
      detail: "Nesta demonstração, os pesos são ilustrativos e não representam uma saída do modelo nem uma estimativa de risco.",
    };
  return s;
});
