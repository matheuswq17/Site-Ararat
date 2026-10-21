import type { ReactNode } from "react";
import "@/styles/ararat/site.css";
import "@/styles/ararat/integracao.css";
import "@/styles/ararat/transicoes.css";
import { CabecaArarat } from "@/components/ararat/Cabeca";
import { REVISAO_PRIVADA, TRANSICOES } from "@/lib/ararat/ambiente";
import { viewportArarat } from "@/lib/ararat/metadados";

/** Layout raiz do site ARARAT em es (um por idioma: <html lang> estático, páginas estáticas). Navegar para as
 *  rotas preservadas de /previa, que têm outro layout raiz, recarrega a página — os estilos não se misturam. */
export const viewport = viewportArarat;

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-revisao={REVISAO_PRIVADA ? "1" : undefined} data-transicao={TRANSICOES ? "candidata" : undefined} suppressHydrationWarning>
      <head><CabecaArarat /></head>
      <body className="atlas">{children}</body>
    </html>
  );
}
