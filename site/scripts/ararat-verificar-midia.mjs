#!/usr/bin/env node
/**
 * Verificação da FRONTEIRA DE PUBLICAÇÃO no artefato do build (roda dentro de `npm run build`).
 * Na revisão privada (ARARAT_REVISAO_PRIVADA=1) só registra o inventário. Na variante pública falha quando:
 *  1. alguma saída do build — páginas de todas as rotas, inclusive as anteriores, e o código em static/ — referencia
 *     mídia com permissão pendente (/privado/);
 *  2. uma página liberada referencia um caminho local que a variante pública bloqueia (link quebrado ou dependência
 *     de arquivo não liberado);
 *  3. existe em public/ uma pasta sem classificação em lib/ararat/exposicao.json (nova pasta = decisão explícita);
 *  4. a regra do proxy libera algum arquivo classificado como bloqueado;
 *  5. alguma saída cita o caminho de uma pasta "candidato-privado" (ex.: a montanha candidata do Motion).
 * O acesso HTTP direto (cada arquivo de public/, cada rota do manifesto, variações) é conferido por
 * tests/ararat/verifica-exposicao.mjs contra o servidor em execução.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { liberadoNoPublico, exposicao } from "../lib/ararat/exposicao.mjs";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(site, process.env.ARARAT_BUILD_DIR || ".next");
const PRIVADA = process.env.ARARAT_REVISAO_PRIVADA === "1";
const erros = [];
const arquivos = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? arquivos(p) : [p]; });
const url = (p) => "/" + relative(join(site, "public"), p).split(sep).join("/");

// 3/4) inventário de public/
const pastas = exposicao.pastasPublic;
const classe = (u) => { const k = Object.keys(pastas).filter((k) => u.startsWith("/" + k + "/")).sort((a, b) => b.length - a.length)[0]; return k ? [k, pastas[k]] : [null, null]; };
const inventario = {};
for (const p of arquivos(join(site, "public"))) {
  const u = url(p); const [k, c] = classe(u);
  if (!k) { erros.push(`public sem classificação em exposicao.json: ${u}`); continue; }
  const lib = liberadoNoPublico(u);
  (inventario[k] ||= { classe: c.classe, exposicao: c.exposicao, git: c.git, arquivos: 0, liberados: 0 }).arquivos++;
  if (lib) inventario[k].liberados++;
  if (lib && c.exposicao !== "publica") erros.push(`regra libera arquivo bloqueado: ${u}`);
  if (!lib && c.exposicao === "publica") erros.push(`arquivo do site novo não liberado: ${u}`);
}

if (PRIVADA) {
  console.log("verificar-midia: revisão privada — mídia pendente e versões anteriores acessíveis (não publicar este build).");
  if (erros.length) { console.error("verificar-midia: inventário incompleto:\n  " + erros.join("\n  ")); process.exit(1); }
  process.exit(0);
}
if (!existsSync(join(dist, "server", "app"))) { console.error(`verificar-midia: ${dist} sem server/app`); process.exit(1); }

// 1) /privado/ em qualquer saída (server/app + static)
const saidas = [...arquivos(join(dist, "server", "app")), ...arquivos(join(dist, "static"))].filter((f) => /\.(html|rsc|body|meta|json|js|css|txt)$/.test(f));
// candidatos privados (ex.: montanha do Motion em avaliação): nem o caminho pode aparecer no build público
const candidatos = Object.entries(pastas).filter(([, c]) => c.classe === "candidato-privado").map(([k]) => "/" + k + "/");
for (const f of saidas) {
  const t = readFileSync(f, "utf8");
  if (t.includes("/privado/")) erros.push(`referência a /privado/: ${relative(site, f)}`);
  // .nft.json = rastreamento de arquivos do servidor (lista o que o build empacota de public/), não conteúdo servido
  if (!f.endsWith(".nft.json")) for (const c of candidatos) if (t.includes(c)) erros.push(`candidato privado ${c} citado no build público: ${relative(site, f)}`);
}

// 2) páginas liberadas: todo caminho local referenciado precisa estar liberado
const app = join(dist, "server", "app");
const paginas = arquivos(app).filter((f) => /\.(html|rsc)$/.test(f)).map((f) => {
  let r = "/" + relative(app, f).split(sep).join("/").replace(/\.(html|rsc)$/, "");
  if (r === "/index") r = "/"; return [r, f];
}).filter(([r]) => !r.startsWith("/_") && liberadoNoPublico(r));
const REF = /(?:src|href|srcSet|srcset|poster|content|data-[a-z-]+)=\\?"(\/[^"\\\s]*)|url\((\/[^)'"\s]+)\)|"(\/(?:ararat|previa|privado|refinada|product|institucional|brand|marca-[a-z0-9]+|motion|imaging|teste)\/[^"\\\s]*)/g;
const vistos = new Set();
for (const [r, f] of paginas) {
  const t = readFileSync(f, "utf8");
  for (const m of t.matchAll(REF)) {
    const ref = (m[1] || m[2] || m[3]).split(/[?#]/)[0].split(",")[0].trim().split(" ")[0];
    if (!ref || ref.startsWith("//")) continue;
    vistos.add(ref);
    if (!liberadoNoPublico(ref)) erros.push(`${r} referencia caminho bloqueado: ${ref}`);
  }
}
const resumo = { variante: "publica", paginasLiberadas: paginas.length, saidasVerificadas: saidas.length, referenciasLocais: vistos.size, inventario, erros };
writeFileSync(join(dist, "ARARAT-EXPOSICAO.json"), JSON.stringify(resumo, null, 2));
if (erros.length) { console.error("verificar-midia: fronteira de publicação violada:\n  " + [...new Set(erros)].slice(0, 30).join("\n  ")); process.exit(1); }
console.log(`verificar-midia: ${paginas.length} saídas de páginas liberadas, ${vistos.size} caminhos locais referenciados, todos liberados; nenhuma referência a /privado/ em ${saidas.length} saídas; public/ classificado (${Object.keys(inventario).length} grupos).`);
