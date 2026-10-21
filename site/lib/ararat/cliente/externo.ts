/** Importa um módulo ES servido de public/ (pacotes do Motion), sem passar pelo empacotador. */
export function importarExterno<T = Record<string, unknown>>(url: string): Promise<T> {
  return import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url) as Promise<T>;
}

/** Parâmetros de comparação/teste: só valem na revisão privada (<html data-revisao>). */
export function parametro(nome: string): string | null {
  if (document.documentElement.dataset.revisao !== "1") return null;
  return new URLSearchParams(location.search).get(nome);
}
