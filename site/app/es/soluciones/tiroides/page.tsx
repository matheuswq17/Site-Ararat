import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaTireoide } from "@/components/ararat/Solucoes";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("thyroid", "es");
export default function Pagina() {
  return <Moldura idioma="es" pagina="thyroid" modulos={[]}><PaginaTireoide idioma="es" /></Moldura>;
}
