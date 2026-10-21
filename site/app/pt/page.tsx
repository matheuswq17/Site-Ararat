import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaHome } from "@/components/ararat/Home";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("home", "pt");
export default function Pagina() {
  return <Moldura idioma="pt" pagina="home" modulos={["abertura", "prostata", "caso", "e2"]}><PaginaHome idioma="pt" /></Moldura>;
}
