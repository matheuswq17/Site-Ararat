import type { Metadata } from "next";
import { Moldura } from "@/components/ararat/Estrutura";
import { idsEquipe, PaginaPessoa, pessoa } from "@/components/ararat/Empresa";
import { metadados } from "@/lib/ararat/metadados";

/** Página individual de cada pessoa da equipe: destino sem JavaScript dos cartões da Empresa. */
export const dynamicParams = false;
export function generateStaticParams() { return idsEquipe().map((id) => ({ id })); }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = pessoa("en", id)!;
  return metadados(`pessoa:${id}`, "en", `${p[1]} | ARARAT`, `${p[1]} — ${p[3]}. ${p[4][0]}`);
}

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Moldura idioma="en" pagina={`pessoa:${id}`}><PaginaPessoa idioma="en" id={id} /></Moldura>;
}
