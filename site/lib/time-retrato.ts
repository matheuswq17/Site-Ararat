/**
 * Retrato do Time (/previa/refinada) — ponte entre o Site e o módulo do Motion.
 *
 * Pacote: motion/proposta/time-interativo/ 0.2.0-draft (direção de 07/10: foto natural em repouso;
 * pontos SÓ durante a troca de integrante), copiado SEM ALTERAÇÃO para
 * public/refinada/time-interativo-0.2.0/ (src/retrato-pontilhado.js + retratos/*.webp e retratos.json,
 * inalterados desde a 0.1.0; hashes conferidos). A 0.1.0 fica em time-interativo-0.1.0/ só como histórico.
 *
 * Contrato 0.2.0 (README do pacote):
 *   createStipplePortrait(raiz, { pessoas: [{ id, recorte, foto, alt }], inicial, interativo, paused,
 *                                 reducedMotion, cor, onEstado })
 *   → { select(id): Promise<boolean>, preload(id), setPaused(b), setReducedMotion(b|null), setCor(c),
 *       state, pronto, destroy() }   (setVisao/setHover existem sem efeito; o Site não os usa)
 *   Fases: carregando · desfazendo · transformando · recompondo · foto · foto-estatica · falha.
 *   O evento sai quando fase, ativo ou pedido mudam. O módulo carrega e decodifica antes de assumir,
 *   mantém a última seleção, ignora o cursor, faz o fallback de 404 e para fora da tela / aba oculta.
 *   O Site cuida da seleção (fonte única: `sel`), do quadro 4:5 e da pausa global (setPaused).
 */
import { TIME } from "./time-refinada";

/** Fases do módulo 0.2.0 (o repouso normal no desktop é `foto`). */
export type FaseRetrato = "carregando" | "desfazendo" | "transformando" | "recompondo" | "foto" | "foto-estatica" | "falha";

export type EstadoRetrato = {
  fase: FaseRetrato;
  ativo: string | null;
  pedido: string;
  visao: "auto" | "foto" | "pontos";
  modo: "interativo" | "foto";
  revelado: number;
  animando: boolean;
};

export type PessoaRetrato = { id: string; recorte: string; foto: string; alt: string };

export type RetratoOpts = {
  pessoas: PessoaRetrato[];
  inicial: string;
  interativo?: "auto" | boolean;
  paused?: boolean;
  reducedMotion?: "auto" | boolean;
  cor?: "natural" | "mono";
  onEstado?: (e: EstadoRetrato) => void;
};

export type RetratoPontilhado = {
  VERSION: string;
  pronto: Promise<void>;
  select(id: string): Promise<boolean>;
  preload(id: string): Promise<unknown>;
  setPaused(v: boolean): void;
  setReducedMotion(v: boolean | null): void;
  setCor(c: "natural" | "mono"): void;
  readonly state: EstadoRetrato;
  destroy(): void;
};

export type CreateStipplePortrait = (raiz: HTMLElement, opts: RetratoOpts) => RetratoPontilhado;

export const TIME_RETRATO_PACKAGE = {
  baseUrl: "/refinada/time-interativo-0.2.0/",
  modulo: "/refinada/time-interativo-0.2.0/src/retrato-pontilhado.js",
  version: "0.2.0-draft",
  exportName: "createStipplePortrait",
} as const;

/** Pessoas na ordem da lista, com os recortes RGBA e as fotos de fallback do Motion. */
export const PESSOAS_RETRATO: PessoaRetrato[] = TIME.map((m) => ({
  id: m.id,
  recorte: `${TIME_RETRATO_PACKAGE.baseUrl}retratos/${m.id}-recorte.webp`,
  foto: `${TIME_RETRATO_PACKAGE.baseUrl}retratos/${m.id}-foto.webp`,
  alt: m.alt,
}));

/** Gancho só para testes: troca a URL do módulo (ex.: STUB DE CONTRATO ou URL inexistente para
 *  simular módulo ausente). Nunca usado pela página normal. */
declare global {
  interface Window {
    __TIME_RETRATO_TESTE__?: { url: string; exportName?: string };
  }
}

export async function carregarRetrato(): Promise<CreateStipplePortrait> {
  const teste = typeof window !== "undefined" ? window.__TIME_RETRATO_TESTE__ : undefined;
  const url = teste?.url ?? TIME_RETRATO_PACKAGE.modulo;
  const nome = teste?.exportName ?? TIME_RETRATO_PACKAGE.exportName;
  const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
  const f = mod[nome];
  if (typeof f !== "function") throw new Error(`${nome} ausente em ${url}`);
  return f as CreateStipplePortrait;
}
