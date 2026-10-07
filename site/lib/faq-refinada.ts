/**
 * FAQ curta da /previa/refinada (rodada 6), junto do Contato. Fontes: as mesmas já verificadas
 * na página (Plataforma, Ciência — auditoria factual de 06/10/2026) e o estado do contato
 * (lib/contact.ts: canal ainda não publicado). Não repete a Ciência: só aponta para ela.
 */
export type Pergunta = { id: string; q: string; a: string; link?: { href: string; label: string } };

export const FAQ_REFINADA: Pergunta[] = [
  {
    id: "faq-publico",
    q: "Para quem é o ARARAT?",
    a: "Para equipes de radiologia e grupos de pesquisa que trabalham com ressonância magnética de próstata.",
  },
  {
    id: "faq-hoje",
    q: "O que a plataforma faz hoje?",
    a: "O Hub organiza a fila de estudos e abre o caso no Viewer, onde o especialista revisa as séries, marca regiões e documenta a revisão. Segmentação, detecção e predição são módulos com configurações e estágios próprios.",
    link: { href: "#plataforma", label: "Ver o percurso na Plataforma" },
  },
  {
    id: "faq-estagio",
    q: "Em que estágio está e quais são os limites?",
    a: "Em validação científica. Há um estudo de classificação publicado e uma pesquisa de segmentação em andamento; nenhum deles valida a plataforma como um todo. Não há certificação regulatória, e a decisão clínica permanece humana.",
    link: { href: "#ciencia", label: "Detalhes em Ciência" },
  },
  {
    id: "faq-demonstracao",
    q: "Como solicitar uma demonstração?",
    a: "O canal de contato ainda está em preparação. Quando for publicado, os pedidos de demonstração técnica e de colaboração em pesquisa serão abertos na seção Contato; esta versão do site não envia mensagens.",
  },
];
