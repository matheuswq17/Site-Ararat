import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaEmpresa } from "@/components/ararat/Empresa";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("company", "en");
export default function Pagina() {
  return <Moldura idioma="en" pagina="company" modulos={["bio"]}><PaginaEmpresa idioma="en" /></Moldura>;
}
