import type { en } from "./en";

/** Alarga os literais do inglês (fonte do formato) para string/number, mantendo chaves e tamanho das listas.
 *  Resultado: pt.ts e es.ts precisam ter exatamente as mesmas chaves e listas do mesmo tamanho; o typecheck
 *  do build falha se faltar uma chave em qualquer idioma. */
type Alargar<T> = T extends string ? string
  : T extends number ? number
  : T extends boolean ? boolean
  : T extends null ? null
  : T extends readonly [] ? readonly []
  : T extends readonly [infer A, ...infer R] ? readonly [Alargar<A>, ...{ [K in keyof R]: Alargar<R[K]> }]
  : T extends readonly (infer U)[] ? readonly Alargar<U>[]
  : { readonly [K in keyof T]: Alargar<T[K]> };

export type Conteudo = Alargar<typeof en>;
