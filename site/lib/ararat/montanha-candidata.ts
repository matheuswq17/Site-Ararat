import "server-only";
import { REVISAO_PRIVADA } from "./ambiente";
import { MONTANHA_ESTAVEL, type Montanha } from "./midia";

/**
 * Montanha CANDIDATA do Motion — só na revisão privada (ARARAT_REVISAO_PRIVADA=1, no build).
 *  - candidata (atual): 1.3.1-03d2-candidato, 20/10/2026 — igual à 1.3.0 com repouso de exatamente 5 s entre o fim
 *    completo de uma passagem de luz (relevo incluído) e o início da próxima. Acordo:
 *    docs/coordination/MONTANHA-1.3.1-REPOUSO-5S-MOTION-2026-10-20.md (módulo sha256 014e0257…0a25, sem alteração).
 *  - candidata ANTERIOR: 1.3.0-03d2-candidato (repouso de ~9 s ± 15 % contado do fim do arco), mantida só para a
 *    comparação privada (?montanha=anterior). Acordo: ACORDO-INTEGRACAO-MONTANHA-1.3.0-SITE-2026-10-14.md.
 * As duas trazem só o módulo; posters da estável, luz 'passagem' no perfil 'recomendado' (o Site não usa _passagem).
 * Módulo só do servidor: a Home grava a configuração no herói (data-montanha-candidata[-anterior]) apenas na revisão
 * privada; na variante pública o valor é null e nem o caminho dos candidatos vai para o HTML ou o JS.
 */
export const MONTANHA_CANDIDATA: Montanha | null = REVISAO_PRIVADA
  ? { versao: "1.3.1-03d2-candidato", base: "/previa/home-montanha-1.3.1-03d2-candidato/", posters: MONTANHA_ESTAVEL.posters,
      ambiente: "passagem", ambientPerfil: "recomendado", sha256: "014e0257dc8df118ec57f3da419d3d243b66d73e71560284917fce24386c0a25" }
  : null;

export const MONTANHA_CANDIDATA_ANTERIOR: Montanha | null = REVISAO_PRIVADA
  ? { versao: "1.3.0-03d2-candidato", base: "/previa/home-montanha-1.3.0-03d2-candidato/", posters: MONTANHA_ESTAVEL.posters,
      ambiente: "passagem", ambientPerfil: "recomendado", sha256: "1ef10fb2659ff48196e2d39341568fa379b8bfdc5028dca9eb2e03d961447ff6" }
  : null;
