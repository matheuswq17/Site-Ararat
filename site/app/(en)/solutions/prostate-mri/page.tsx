import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaProstata } from "@/components/ararat/Solucoes";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("prostate", "en");
export default function Pagina() {
  return <Moldura idioma="en" pagina="prostate" modulos={["prostata"]}><PaginaProstata idioma="en" /></Moldura>;
}
