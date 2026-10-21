import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaPlataforma } from "@/components/ararat/Plataforma";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("platform", "en");
export default function Pagina() {
  return <Moldura idioma="en" pagina="platform" modulos={["demo"]}><PaginaPlataforma idioma="en" /></Moldura>;
}
