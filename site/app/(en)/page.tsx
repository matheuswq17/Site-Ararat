import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaHome } from "@/components/ararat/Home";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("home", "en");
export default function Pagina() {
  return <Moldura idioma="en" pagina="home" modulos={["abertura", "prostata", "caso", "e2"]}><PaginaHome idioma="en" /></Moldura>;
}
