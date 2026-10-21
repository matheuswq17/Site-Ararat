import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaPlataforma } from "@/components/ararat/Plataforma";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("platform", "pt");
export default function Pagina() {
  return <Moldura idioma="pt" pagina="platform" modulos={["demo"]}><PaginaPlataforma idioma="pt" /></Moldura>;
}
