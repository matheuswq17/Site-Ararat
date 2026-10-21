import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaEvidencias } from "@/components/ararat/Evidencias";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("evidence", "en");
export default function Pagina() {
  return <Moldura idioma="en" pagina="evidence" modulos={[]}><PaginaEvidencias idioma="en" /></Moldura>;
}
