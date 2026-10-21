import { NextResponse, type NextRequest } from "next/server";
import { liberadoNoPublico } from "./lib/ararat/exposicao.mjs";

/**
 * 1) FRONTEIRA DE PUBLICAÇÃO (desde 14/10/2026). Na variante pública (ARARAT_REVISAO_PRIVADA diferente de 1), só
 *    respondem as páginas do site novo e os arquivos que elas usam (lib/ararat/exposicao.json). Rotas e arquivos
 *    anteriores (/previa/*, /teste/*, /refinada, /product, /institucional, /brand, /marca-*, /motion, /imaging) e a
 *    mídia com permissão pendente (/privado) recebem 404 com o cabeçalho x-ararat-bloqueio. Nada é apagado.
 *    Na revisão privada local (ARARAT_REVISAO_PRIVADA=1) tudo continua acessível, inclusive as comparações.
 * 2) Idioma das rotas PRESERVADAS de comparação (cabeçalho x-ararat-locale, lido pelo layout de app/(anteriores) e
 *    pela refinada). O site novo ocupa "/", "/pt" e "/es" com layouts próprios, que não dependem do cabeçalho.
 *    Inglês: /previa/refinada/en e o institucional anterior em /previa/institucional (EN); português: o resto.
 */
const PRIVADA = process.env.ARARAT_REVISAO_PRIVADA === "1";
const INGLES = /^\/previa\/(?:refinada\/en|institucional(?:\/(?:platform|research|company(?:\/team\/[^/]+)?))?)\/?$/;

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (!PRIVADA && !liberadoNoPublico(pathname, searchParams)) {
    return new NextResponse("Not found\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "x-ararat-bloqueio": "fora-da-publicacao", "x-robots-tag": "noindex", "cache-control": "no-store" },
    });
  }
  if (pathname.startsWith("/previa/") || pathname === "/previa" || pathname.startsWith("/teste/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-ararat-locale", INGLES.test(pathname) ? "en" : "pt");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  return NextResponse.next();
}

export const config = {
  // Todas as rotas e arquivos de public/, exceto o código estático do Next (que só contém o próprio build).
  matcher: ["/((?!_next/static/).*)"],
};
