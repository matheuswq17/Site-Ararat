import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaProstata } from "@/components/ararat/Solucoes";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("prostate", "es");
export default function Pagina() {
  return <Moldura idioma="es" pagina="prostate" modulos={["prostata"]}><PaginaProstata idioma="es" /></Moldura>;
}
