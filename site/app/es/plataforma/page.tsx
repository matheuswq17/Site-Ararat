import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaPlataforma } from "@/components/ararat/Plataforma";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("platform", "es");
export default function Pagina() {
  return <Moldura idioma="es" pagina="platform" modulos={["demo"]}><PaginaPlataforma idioma="es" /></Moldura>;
}
