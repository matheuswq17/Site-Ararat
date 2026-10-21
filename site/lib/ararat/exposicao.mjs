import exposicao from "./exposicao.json" with { type: "json" };

/**
 * Caminho liberado na variante PÚBLICA? Lista de permissão (exposicao.json): o que não está listado não responde.
 * Fonte única da regra: usada pelo proxy (bloqueio em execução) e pelos verificadores (build e HTTP).
 * A comparação é exata (maiúsculas contam), então /Privado/… também fica fora, mesmo em disco que ignora maiúsculas.
 * @param {string} caminho pathname já decodificado pelo servidor
 * @param {URLSearchParams} [busca]
 * @returns {boolean}
 */
export function liberadoNoPublico(caminho, busca) {
  const P = exposicao.publico;
  const c = caminho.length > 1 ? caminho.replace(/\/+$/, "") : caminho;
  if (c === "/_next/image") {
    const u = (busca && busca.get("url")) || "";
    return u.startsWith("/") && !u.startsWith("//") && liberadoNoPublico(new URL(u, "http://x").pathname);
  }
  if (c.startsWith("/_next/")) return true;
  if (P.paginas.includes(c)) return true;
  if (P.prefixosPaginas.some((p) => c.startsWith(p))) return true;
  return P.prefixosArquivos.some((p) => c.startsWith(p));
}

export { exposicao };
