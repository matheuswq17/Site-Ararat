import { Moldura } from "@/components/ararat/Estrutura";
import { PaginaEmpresa } from "@/components/ararat/Empresa";
import { metadados } from "@/lib/ararat/metadados";

export const metadata = metadados("company", "pt");
export default function Pagina() {
  return <Moldura idioma="pt" pagina="company" modulos={["bio"]}><PaginaEmpresa idioma="pt" /></Moldura>;
}
