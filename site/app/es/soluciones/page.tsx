import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaSolucoes } from "@/components/ararat/Solucoes";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("solutions", "es");
export default function Pagina() {
  return <Moldura idioma="es" pagina="solutions" modulos={[]}><PaginaSolucoes idioma="es" /></Moldura>;
}
