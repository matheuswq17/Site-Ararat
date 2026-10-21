import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaSolucoes } from "@/components/ararat/Solucoes";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("solutions", "pt");
export default function Pagina() {
  return <Moldura idioma="pt" pagina="solutions" modulos={[]}><PaginaSolucoes idioma="pt" /></Moldura>;
}
