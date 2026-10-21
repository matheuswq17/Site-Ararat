import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaTireoide } from "@/components/ararat/Solucoes";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("thyroid", "pt");
export default function Pagina() {
  return <Moldura idioma="pt" pagina="thyroid" modulos={[]}><PaginaTireoide idioma="pt" /></Moldura>;
}
