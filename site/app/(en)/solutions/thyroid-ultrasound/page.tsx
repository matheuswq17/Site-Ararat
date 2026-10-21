import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaTireoide } from "@/components/ararat/Solucoes";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("thyroid", "en");
export default function Pagina() {
  return <Moldura idioma="en" pagina="thyroid" modulos={[]}><PaginaTireoide idioma="en" /></Moldura>;
}
