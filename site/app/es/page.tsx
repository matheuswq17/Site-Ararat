import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaHome } from "@/components/ararat/Home";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("home", "es");
export default function Pagina() {
  return <Moldura idioma="es" pagina="home" modulos={["abertura", "prostata", "caso", "e2"]}><PaginaHome idioma="es" /></Moldura>;
}
