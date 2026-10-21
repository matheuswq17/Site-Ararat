import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaProstata } from "@/components/ararat/Solucoes";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("prostate", "pt");
export default function Pagina() {
  return <Moldura idioma="pt" pagina="prostate" modulos={["prostata"]}><PaginaProstata idioma="pt" /></Moldura>;
}
