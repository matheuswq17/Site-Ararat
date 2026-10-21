import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PessoaInstitucional } from "@/components/institucional/Paginas";
import { IDS_EQUIPE, equipe } from "@/lib/institucional/equipe";
import { ICONES_03D2, MANIFESTO_WEB_03D2, VIEWPORT_03D2 } from "@/lib/marca-03d2";

/** Destino individual de cada pessoa da equipe (usado sem JavaScript pelos cartões da grade). */
export const dynamicParams = false;
export function generateStaticParams() {
  return IDS_EQUIPE.map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = equipe("pt").find((x) => x.id === id);
  return {
    title: p ? `${p.nome} | ARARAT` : "ARARAT",
    description: p?.funcao,
    robots: { index: false, follow: false },
    alternates: { languages: { en: `/previa/institucional/company/team/${id}` } },
    icons: ICONES_03D2,
    manifest: MANIFESTO_WEB_03D2,
  };
}
export const viewport = VIEWPORT_03D2;

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = equipe("pt").find((x) => x.id === id);
  if (!p) notFound();
  return <PessoaInstitucional idioma="pt" pessoa={p} />;
}
