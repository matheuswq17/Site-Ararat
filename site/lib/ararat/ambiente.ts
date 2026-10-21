/**
 * Variante de build do site ARARAT.
 *  - ARARAT_REVISAO_PRIVADA=1 → revisão LOCAL privada: mostra as capturas reais (public/privado/, fora do Git) e a
 *    demonstração guiada, e aceita os parâmetros de comparação/teste (?ritmo=atual, ?saidas=falha, ?io=0, …).
 *  - sem a variável (padrão, e qualquer Preview/produção na Vercel) → variante APTA A PUBLICAÇÃO: nenhuma mídia com
 *    permissão pendente é referenciada; cada captura vira uma descrição textual factual; sem parâmetros de teste.
 * As páginas são estáticas: a variante é decidida no build (ou a cada requisição no `next dev`).
 */
export const REVISAO_PRIVADA = process.env.ARARAT_REVISAO_PRIVADA === "1";

/** Domínio definitivo (ainda não confirmado). Sem ele não há canonical, og:url absoluto nem hreflang absoluto. */
export const SITE_URL = process.env.ARARAT_SITE_URL || "";

/**
 * Transição de 180 ms aprovada: padrão nas duas variantes. Comparações por query/sessão só na revisão privada.
 */
export const TRANSICOES = true;

/**
 * Títulos por linhas (GSAP + SplitText), ritmo aprovado pelo proprietário: padrão público e disponível na revisão.
 * ?texto=atual|gsap continua disponível apenas na revisão privada (base antiga preservada para comparação).
 * Mídia pendente não é promovida.
 */
export const TEXTOS = true;
