import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaEmpresa } from "@/components/ararat/Empresa";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("company", "es");
export default function Pagina() {
  return <Moldura idioma="es" pagina="company" modulos={["bio"]}><PaginaEmpresa idioma="es" /></Moldura>;
}
