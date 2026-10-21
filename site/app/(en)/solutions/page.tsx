import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaSolucoes } from "@/components/ararat/Solucoes";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("solutions", "en");
export default function Pagina() {
  return <Moldura idioma="en" pagina="solutions" modulos={[]}><PaginaSolucoes idioma="en" /></Moldura>;
}
