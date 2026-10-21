import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaEvidencias } from "@/components/ararat/Evidencias";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("evidence", "es");
export default function Pagina() {
  return <Moldura idioma="es" pagina="evidence" modulos={[]}><PaginaEvidencias idioma="es" /></Moldura>;
}
