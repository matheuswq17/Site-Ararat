import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaEvidencias } from "@/components/ararat/Evidencias";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("evidence", "pt");
export default function Pagina() {
  return <Moldura idioma="pt" pagina="evidence" modulos={[]}><PaginaEvidencias idioma="pt" /></Moldura>;
}
