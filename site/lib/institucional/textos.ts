/**
 * Textos do site institucional (Etapa 2 experimental, branch institucional-site-v1).
 *
 * COMO EDITAR (ver site/EDITAR.md): cada texto tem as duas línguas lado a lado — `en` (idioma inicial) e `pt`.
 * Troque só o conteúdo entre aspas; mantenha as duas versões com o mesmo sentido. Não acrescente capacidades,
 * validação clínica, status regulatório, parceiros ou canal de contato sem confirmação do proprietário.
 *
 * Situação: textos PROVISÓRIOS da proposta v3 aprovada para implementação experimental. A aparência final, a logo
 * definitiva e os textos pendentes NÃO estão aprovados. Foco atual descrito como revisão de RM de próstata.
 */
export type Idioma = "en" | "pt";
export type T = { en: string; pt: string };
export const t = (x: T, idioma: Idioma) => x[idioma];

export const GERAL = {
  pular: { en: "Skip to content", pt: "Pular para o conteúdo" },
  menu: { en: "Menu", pt: "Menu" },
  fecharMenu: { en: "Close menu", pt: "Fechar menu" },
  navPrincipal: { en: "Main", pt: "Principal" },
  contato: { en: "Contact", pt: "Contato" },
  outroIdioma: { en: "Português", pt: "English" },
  idiomaRotulo: { en: "Language", pt: "Idioma" },
  pausar: { en: "Pause animations", pt: "Pausar animações" },
  retomar: { en: "Resume animations", pt: "Retomar animações" },
  versaoAnterior: { en: "Previous version (comparison)", pt: "Versão anterior (comparação)" },
  aviso: {
    en: "ARARAT supports medical analysis and research. It does not replace assessment by healthcare professionals.",
    pt: "O ARARAT apoia a análise médica e a pesquisa. Não substitui a avaliação de profissionais de saúde.",
  },
  atribuicaoCurta: {
    en: "MRI images: PROSTATEx collection (TCIA), CC BY 3.0. Use does not imply endorsement.",
    pt: "Imagens de RM: coleção PROSTATEx (TCIA), CC BY 3.0. O uso não implica endosso.",
  },
  rotuloExperimental: {
    en: "Experimental preview — not the final site",
    pt: "Prévia experimental — não é o site final",
  },
} satisfies Record<string, T>;

export const CONTATO = {
  rotulo: { en: "Contact", pt: "Contato" },
  titulo: { en: "A contact channel is being prepared.", pt: "Estamos preparando um canal de contato." },
  texto: {
    en: "It will be published on this page when it is available. Until then, this site does not receive or send messages.",
    pt: "Ele será publicado nesta página quando estiver disponível. Até lá, este site não recebe nem envia mensagens.",
  },
} satisfies Record<string, T>;

export const HOME = {
  metaTitulo: { en: "ARARAT | Software for prostate MRI review", pt: "ARARAT | Software para revisão de RM de próstata" },
  metaDescricao: {
    en: "ARARAT builds software for prostate MRI review, grounded in research: ARARAT Hub and ARARAT Viewer, shown with real screenshots on a public case.",
    pt: "O ARARAT desenvolve software para revisão de RM de próstata, com base em pesquisa: ARARAT Hub e ARARAT Viewer, mostrados com capturas reais de um caso público.",
  },
  rotulo: { en: "ARARAT", pt: "ARARAT" },
  // Versão estreita (foco atual), conforme a decisão de 12/10: sem ampliar o escopo para "radiologia".
  titulo: {
    en: "We build software for prostate MRI review, grounded in research.",
    pt: "Desenvolvemos software para revisão de RM de próstata, com base em pesquisa.",
  },
  subtitulo: {
    en: "The ARARAT platform organizes cases and supports their review by radiologists.",
    pt: "A plataforma ARARAT organiza os casos e apoia a revisão feita pelo radiologista.",
  },
  // Estágio DEMONSTRÁVEL (o que existe e foi mostrado), sem validação clínica nem status regulatório.
  estagio: {
    en: "Shown today with real screenshots of a public, de-identified case",
    pt: "Mostrado hoje com capturas reais de um caso público e desidentificado",
  },
  acaoPrincipal: { en: "See the platform", pt: "Conheça a plataforma" },
  acaoSecundaria: { en: "Research", pt: "Pesquisa" },
  plataformaRotulo: { en: "Platform", pt: "Plataforma" },
  plataformaTitulo: { en: "One platform, two applications.", pt: "Uma plataforma, duas aplicações." },
  plataformaTexto: {
    en: "ARARAT is the company. Its platform brings together two applications that work in sequence.",
    pt: "ARARAT é a empresa. A plataforma reúne duas aplicações que trabalham em sequência.",
  },
  hubPapel: { en: "Organizes and tracks cases", pt: "Organiza e acompanha os casos" },
  hubTexto: {
    en: "The study queue, local preparation of each exam and the review status.",
    pt: "A fila de estudos, o preparo local de cada exame e o estado da revisão.",
  },
  viewerPapel: { en: "Visualization and review tools", pt: "Visualização e ferramentas de revisão" },
  viewerTexto: {
    en: "Synchronized planes, T2 and ADC side by side, measurements and the report preview.",
    pt: "Planos sincronizados, T2 e ADC lado a lado, medições e a prévia do relatório.",
  },
  origemCapturas: {
    en: "Real screenshots of the applications with a public, de-identified case (ProstateX-0067, PROSTATEx, CC BY 3.0).",
    pt: "Capturas reais das aplicações com um caso público e desidentificado (ProstateX-0067, PROSTATEx, CC BY 3.0).",
  },
  comoFunciona: { en: "How the platform works", pt: "Como a plataforma funciona" },
  pesquisaRotulo: { en: "Research", pt: "Pesquisa" },
  pesquisaTitulo: {
    en: "T2 radiomics for ISUP classification of prostate cancer",
    pt: "Radiômica T2 para a classificação ISUP do câncer de próstata",
  },
  pesquisaTexto: {
    en: "Published in Clinical Radiology (2026). A study of 112 lesions from the public PROSTATEx dataset; it does not evaluate the ARARAT platform.",
    pt: "Publicado na Clinical Radiology (2026). Estudo com 112 lesões da base pública PROSTATEx; não avalia a plataforma ARARAT.",
  },
  empresaRotulo: { en: "Company", pt: "Empresa" },
  empresaTitulo: { en: "Engineering, research and clinical experience", pt: "Engenharia, pesquisa e experiência clínica" },
  empresaTexto: {
    en: "Five people building ARARAT, with roles and biographies.",
    pt: "Cinco pessoas constroem o ARARAT; conheça funções e trajetórias.",
  },
} satisfies Record<string, T>;

export const PLATAFORMA = {
  metaTitulo: { en: "Platform | ARARAT", pt: "Plataforma | ARARAT" },
  metaDescricao: {
    en: "ARARAT Hub organizes and tracks prostate MRI cases; ARARAT Viewer provides the review tools. Functions shown with real screenshots.",
    pt: "O ARARAT Hub organiza e acompanha casos de RM de próstata; o ARARAT Viewer reúne as ferramentas de revisão. Funções mostradas com capturas reais.",
  },
  rotulo: { en: "Platform", pt: "Plataforma" },
  titulo: { en: "The ARARAT platform", pt: "A plataforma ARARAT" },
  subtitulo: {
    en: "Two applications for prostate MRI review. ARARAT Hub organizes and tracks cases. ARARAT Viewer provides the visualization and review tools.",
    pt: "Duas aplicações para revisão de RM de próstata. O ARARAT Hub organiza e acompanha os casos. O ARARAT Viewer reúne a visualização e as ferramentas de revisão.",
  },
  r1Titulo: { en: "What the screenshots show", pt: "O que as capturas mostram" },
  r1Texto: {
    en: "The functions on this page, captured in the applications with one public, de-identified case.",
    pt: "As funções desta página, capturadas nas aplicações com um caso público e desidentificado.",
  },
  r2Titulo: { en: "Where they were captured", pt: "Onde foram capturadas" },
  r2Texto: {
    en: "Windows desktop applications, local installation, 7 October 2026.",
    pt: "Aplicações de desktop para Windows, instalação local, 7 de outubro de 2026.",
  },
  r3Titulo: { en: "What is not claimed", pt: "O que não é afirmado" },
  r3Texto: {
    en: "This site does not claim clinical validation or any regulatory status.",
    pt: "Este site não afirma validação clínica nem qualquer status regulatório.",
  },
  gruposRotulo: { en: "Platform sections", pt: "Seções da plataforma" },
  g1: { en: "Organize", pt: "Organizar" },
  g2: { en: "View and compare", pt: "Visualizar e comparar" },
  g3: { en: "Measure and document", pt: "Medir e documentar" },
  gDemo: { en: "Guided demonstration", pt: "Demonstração guiada" },
  gRoteiro: { en: "Planned recording", pt: "Gravação prevista" },
  g1Itens: {
    en: "Studies arrive in the queue and are prepared locally before review.|When preparation ends, the case is marked ready for review.|“Open review” opens the same case in the Viewer.|Back in the Hub, the case shows its review status: “Review pending”. Finalizing is the radiologist’s decision.",
    pt: "Os estudos chegam à fila e são preparados localmente antes da revisão.|Ao fim do preparo, o caso fica pronto para revisão.|“Abrir revisão” abre o mesmo caso no Viewer.|De volta ao Hub, o caso mostra o estado da revisão: “Revisão pendente”. Finalizar é decisão do radiologista.",
  },
  g2Texto: {
    en: "Axial, coronal and sagittal planes are navigated in sync, and the crosshair marks the same point. In comparison mode, T2 and ADC sit side by side, aligned to the same patient position.",
    pt: "Os planos axial, coronal e sagital são navegados em sincronia, e a mira marca o mesmo ponto. Na comparação, T2 e ADC ficam lado a lado, alinhados pela mesma posição do paciente.",
  },
  g3Texto: {
    en: "Measurements and the images marked during review go to the report preview.",
    pt: "As medições e as imagens marcadas durante a revisão vão para a prévia do relatório.",
  },
  reguaTitulo: { en: "Ruler", pt: "Régua" },
  reguaTexto: {
    en: "Measures in millimeters in patient space. The completed measurement M1 55.1 mm is demonstrative: its points were placed for this screenshot.",
    pt: "Mede em milímetros, no espaço do paciente. A medida concluída M1 55,1 mm é demonstrativa: os pontos foram posicionados para esta captura.",
  },
  relatorioTitulo: { en: "Key images and report preview", pt: "Imagens-chave e prévia do relatório" },
  relatorioTexto: {
    en: "Images marked during review are listed; “View report” opens the preview. It is a preview: nothing is issued or signed.",
    pt: "As imagens marcadas são listadas; “Visualizar relatório” abre a prévia. É uma prévia: nada é emitido nem assinado.",
  },
  demoRotulo: { en: "Optional", pt: "Opcional" },
  demoTexto: {
    en: "The same case in seven steps, from the Hub queue back to “Review pending”. It moves only when you choose the next step. Nothing on this page depends on it, and you can leave at any step.",
    pt: "O mesmo caso em sete etapas, da fila do Hub de volta a “Revisão pendente”. Só avança quando você escolhe a próxima etapa. Nada nesta página depende dela, e é possível sair em qualquer etapa.",
  },
  demoIniciar: { en: "Start the demonstration", pt: "Iniciar a demonstração" },
  demoSair: { en: "Exit", pt: "Sair" },
  demoAnterior: { en: "Previous step", pt: "Etapa anterior" },
  demoProxima: { en: "Next step", pt: "Próxima etapa" },
  demoEtapa: { en: "Step", pt: "Etapa" },
  demoDe: { en: "of", pt: "de" },
  demoSemJs: {
    en: "The step-by-step demonstration needs JavaScript. The same seven steps are listed below with their screenshots.",
    pt: "A demonstração passo a passo precisa de JavaScript. As mesmas sete etapas estão abaixo, com as capturas.",
  },
  roteiroRotulo: { en: "Planned recording", pt: "Gravação prevista" },
  roteiroTitulo: { en: "Start, action and result", pt: "Início, ação e resultado" },
  roteiroTexto: {
    en: "A recording of real use is planned and does not exist yet. Until then, these real screenshots show what it will cover. They are still images, not a video.",
    pt: "Uma gravação de uso real está prevista e ainda não existe. Até lá, estas capturas reais mostram o que ela vai cobrir. São imagens estáticas, não um vídeo.",
  },
  roteiroInicio: { en: "Start", pt: "Início" },
  roteiroAcao: { en: "Action", pt: "Ação" },
  roteiroResultado: { en: "Result", pt: "Resultado" },
  roteiroInicioTexto: { en: "The case is ready for review in the Hub queue.", pt: "O caso está pronto para revisão na fila do Hub." },
  roteiroAcaoTexto: { en: "In the Viewer, a ruler measurement is completed: M1 55.1 mm (demonstrative).", pt: "No Viewer, uma medida com a régua é concluída: M1 55,1 mm (demonstrativa)." },
  roteiroResultadoTexto: { en: "Back in the Hub, the case shows “Review pending”.", pt: "De volta ao Hub, o caso mostra “Revisão pendente”." },
  modelosRotulo: { en: "Analysis models", pt: "Modelos de análise" },
  modelosTitulo: { en: "Models are research work, evaluated separately.", pt: "Os modelos são trabalho de pesquisa, avaliados à parte." },
  modelosTexto: {
    en: "They are not part of the functions shown on this page.",
    pt: "Não fazem parte das funções mostradas nesta página.",
  },
  origemHub: { en: "Real screenshot · ARARAT Hub · ProstateX-0067 (PROSTATEx)", pt: "Captura real · ARARAT Hub · ProstateX-0067 (PROSTATEx)" },
  origemViewer: { en: "Real screenshot · ARARAT Viewer · ProstateX-0067 (PROSTATEx)", pt: "Captura real · ARARAT Viewer · ProstateX-0067 (PROSTATEx)" },
  aviso: {
    en: "Interface demonstration. The measurement shown is demonstrative and is not a clinical interpretation. Interface in Portuguese.",
    pt: "Demonstração da interface. A medida exibida é demonstrativa e não constitui interpretação clínica.",
  },
} satisfies Record<string, T>;

export const PESQUISA = {
  metaTitulo: { en: "Research | ARARAT", pt: "Pesquisa | ARARAT" },
  metaDescricao: {
    en: "ARARAT's published study on T2 radiomics for ISUP classification, ongoing work and the limits of what the research shows.",
    pt: "O estudo publicado do ARARAT sobre radiômica T2 para a classificação ISUP, o trabalho em andamento e os limites do que a pesquisa mostra.",
  },
  rotulo: { en: "Research", pt: "Pesquisa" },
  titulo: { en: "Research with its limits stated.", pt: "Pesquisa com os limites declarados." },
  subtitulo: {
    en: "One published study and ongoing work. Published results refer to the study protocol; they do not validate the ARARAT platform as a whole.",
    pt: "Um estudo publicado e trabalho em andamento. Os resultados publicados se referem ao protocolo do estudo; não validam a plataforma ARARAT como um todo.",
  },
  publicadoRotulo: { en: "Published · Clinical Radiology · 2026", pt: "Publicado · Clinical Radiology · 2026" },
  pergunta: { en: "Question", pt: "Pergunta" },
  dadosMetodo: { en: "Data and method", pt: "Dados e método" },
  dadosMetodoTexto: {
    en: "112 confirmed cancer lesions from the public PROSTATEx dataset. Axial T2 and a spherical 3D region with a 5 mm radius, centered on a previously identified lesion. Features extracted with PyRadiomics fed a Random Forest classifier; SHAP was used to analyze their contributions.",
    pt: "112 lesões com câncer confirmado da base pública PROSTATEx. T2 axial e uma região esférica 3D de 5 mm de raio, centrada numa lesão previamente identificada. Características extraídas com PyRadiomics alimentaram um classificador Random Forest; o SHAP foi usado na análise das contribuições.",
  },
  avaliacao: { en: "Type of evaluation", pt: "Tipo de avaliação" },
  avaliacaoTexto: {
    en: "The publication reports internal evaluation results. It is not an external validation and not a study of the ARARAT applications.",
    pt: "A publicação apresenta resultados de avaliação interna. Não é uma validação externa nem um estudo das aplicações ARARAT.",
  },
  referencia: { en: "Reference", pt: "Referência" },
  l1Titulo: { en: "Not a detection study", pt: "Não é um estudo de detecção" },
  l1Texto: {
    en: "Lesions were already identified and biopsy-confirmed; the study does not look for cancer in undiagnosed exams.",
    pt: "As lesões já estavam identificadas e confirmadas por biópsia; o estudo não procura câncer em exames sem diagnóstico.",
  },
  l2Titulo: { en: "Limited to its protocol", pt: "Limitado ao protocolo" },
  l2Texto: {
    en: "Results are limited to the population and protocol studied and cannot be attributed to another model or software version without demonstrating equivalence.",
    pt: "Os resultados se limitam à população e ao protocolo estudados e não podem ser atribuídos a outra versão de modelo ou software sem demonstrar equivalência.",
  },
  l3Titulo: { en: "Human review", pt: "Revisão humana" },
  l3Texto: {
    en: "SHAP supports interpretation; it does not prove that a result is correct. Human review remains essential.",
    pt: "O SHAP apoia a interpretação; não prova que um resultado está correto. A revisão humana permanece essencial.",
  },
  andamentoRotulo: { en: "Ongoing", pt: "Em andamento" },
  andamentoTitulo: { en: "Prostate and lesion segmentation", pt: "Segmentação da próstata e de lesões" },
  andamentoEstado: { en: "Not yet published", pt: "Ainda não publicado" },
  andamentoTexto: {
    en: "A separate study on delineating the prostate and lesions. It does not validate classifiers, scores or explainability. Details will be added when the work is published.",
    pt: "Um estudo separado sobre a delimitação da próstata e das lesões. Não valida classificadores, scores nem explicabilidade. Os detalhes entram quando o trabalho for publicado.",
  },
  naoMostraRotulo: { en: "What the research does not show", pt: "O que a pesquisa não mostra" },
  naoMostraTitulo: {
    en: "The studies do not validate a complete automated workflow or the platform as a whole.",
    pt: "Os estudos não validam um fluxo automático completo nem a plataforma como um todo.",
  },
  naoMostraTexto: {
    en: "The functions of ARARAT Hub and ARARAT Viewer are described, with real screenshots, on the Platform page.",
    pt: "As funções do ARARAT Hub e do ARARAT Viewer estão descritas, com capturas reais, na página Plataforma.",
  },
  principiosRotulo: { en: "Evaluation principles", pt: "Princípios de avaliação" },
} satisfies Record<string, T>;

export const PRINCIPIOS: Array<{ titulo: T; texto: T }> = [
  { titulo: { en: "Separation by patient", pt: "Separação por paciente" }, texto: { en: "Training and testing cannot share patients.", pt: "Treino e teste não podem compartilhar pacientes." } },
  { titulo: { en: "Appropriate metrics", pt: "Métricas adequadas" }, texto: { en: "Chosen for the clinical problem, not to favor the number.", pt: "Escolhidas para o problema clínico, não para favorecer o número." } },
  { titulo: { en: "Generalization", pt: "Generalização" }, texto: { en: "Attention to behavior outside the development data.", pt: "Atenção ao comportamento fora dos dados de desenvolvimento." } },
  { titulo: { en: "Traceability", pt: "Rastreabilidade" }, texto: { en: "Series, region, preprocessing, features and model version recorded.", pt: "Série, região, pré-processamento, características e versão do modelo registrados." } },
];

export const EMPRESA = {
  metaTitulo: { en: "Company | ARARAT", pt: "Empresa | ARARAT" },
  metaDescricao: {
    en: "ARARAT brings together software engineering, imaging research and radiology practice. Meet the team.",
    pt: "O ARARAT reúne engenharia de software, pesquisa em imagem e prática radiológica. Conheça a equipe.",
  },
  rotulo: { en: "Company", pt: "Empresa" },
  titulo: { en: "About ARARAT", pt: "Sobre o ARARAT" },
  subtitulo: {
    en: "A small team that brings together software engineering, imaging research and radiology practice.",
    pt: "Uma equipe pequena que reúne engenharia de software, pesquisa em imagem e prática radiológica.",
  },
  fFoco: { en: "Current focus", pt: "Foco atual" },
  fFocoV: { en: "Prostate MRI review", pt: "Revisão de RM de próstata" },
  fApps: { en: "Applications", pt: "Aplicações" },
  fPesquisa: { en: "Research", pt: "Pesquisa" },
  fPesquisaV: { en: "1 published study (2026)", pt: "1 estudo publicado (2026)" },
  fEquipe: { en: "Team", pt: "Equipe" },
  fEquipeV: { en: "5 people", pt: "5 pessoas" },
  equipeRotulo: { en: "Team", pt: "Equipe" },
  equipeTitulo: { en: "The people behind ARARAT", pt: "Quem constrói o ARARAT" },
  lerBio: { en: "Read biography", pt: "Ler biografia" },
  fecharBio: { en: "Close biography", pt: "Fechar biografia" },
  fechar: { en: "Close", pt: "Fechar" },
  voltarEquipe: { en: "Team", pt: "Equipe" },
  de: { en: "of", pt: "de" },
  nota: {
    en: "Roles and biographies provided by the team. The institutions mentioned are part of each member's background and do not imply partnership, sponsorship or endorsement of ARARAT.",
    pt: "Funções e currículos informados pela equipe. As instituições citadas fazem parte da trajetória de cada integrante e não indicam parceria, patrocínio ou endosso ao ARARAT.",
  },
} satisfies Record<string, T>;
