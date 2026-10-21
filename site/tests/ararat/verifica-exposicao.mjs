#!/usr/bin/env node
/**
 * Fronteira de publicação contra o SERVIDOR em execução (acesso direto, não só referências).
 *   node tests/ararat/verifica-exposicao.mjs http://127.0.0.1:3190 --publico   (variante pública: bloqueio)
 *   node tests/ararat/verifica-exposicao.mjs http://127.0.0.1:3191 --privado   (revisão privada: tudo acessível)
 * Pede, um a um:
 *  - TODOS os arquivos de public/ (inclusive public/privado, quando existe, e as mídias anteriores versionadas);
 *  - TODAS as rotas do manifesto do build (rotas novas, /previa/*, /teste/*, com os parâmetros pré-gerados);
 *  - variações: maiúsculas, barra final, %2e%2e, //, /_next/image?url=…, ?_rsc, diretórios.
 * Na variante pública: liberado → 200 e o resto → 404 com x-ararat-bloqueio. Na privada: o que existe → 200.
 * Também segue os links e recursos das páginas liberadas: nenhum pode cair num bloqueio.
 * Saída: resumo no console e JSON em --saida=arquivo (opcional).
 */
import { readdirSync, statSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import { liberadoNoPublico, exposicao } from "../../lib/ararat/exposicao.mjs";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const base = process.argv[2];
const publico = process.argv.includes("--publico");
const dist = (process.argv.find((a) => a.startsWith("--dist=")) || "").slice(7) || (publico ? ".next-publico" : ".next-revisao");
const saida = (process.argv.find((a) => a.startsWith("--saida=")) || "").slice(8);
if (!base || (!publico && !process.argv.includes("--privado"))) { console.error("uso: verifica-exposicao.mjs <url> --publico|--privado [--dist=.next-x] [--saida=x.json]"); process.exit(2); }

// GET cru (sem normalizar o caminho), sem seguir redirecionamentos
const pedir = (caminho) => new Promise((ok) => {
  const u = new URL(base);
  const r = http.request({ host: u.hostname, port: u.port, path: caminho, method: "GET", headers: { "accept-encoding": "identity" } }, (res) => {
    const partes = []; res.on("data", (d) => partes.push(d)); res.on("end", () => ok({ status: res.statusCode, h: res.headers, corpo: Buffer.concat(partes) }));
  });
  r.on("error", (e) => ok({ status: 0, h: {}, corpo: Buffer.from(String(e)) })); r.end();
});
const enc = (p) => p.split("/").map((s) => encodeURIComponent(s)).join("/");

const arquivos = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? arquivos(p) : [p]; });
const pub = join(site, "public");
const doPublic = arquivos(pub).map((p) => "/" + relative(pub, p).split(sep).join("/"));

// rotas do build: manifesto de rotas + rotas pré-geradas (parâmetros)
const rotas = new Set();
const man = join(site, dist, "app-path-routes-manifest.json");
if (existsSync(man)) Object.values(JSON.parse(readFileSync(man, "utf8"))).forEach((r) => { if (!r.includes("[") && !r.startsWith("/_")) rotas.add(r); });
const pre = join(site, dist, "prerender-manifest.json");
if (existsSync(pre)) Object.keys(JSON.parse(readFileSync(pre, "utf8")).routes).forEach((r) => { if (!r.startsWith("/_")) rotas.add(r); });
if (!rotas.size) { console.error(`sem manifesto de rotas em ${dist}`); process.exit(2); }

const exemploPrivado = doPublic.find((u) => u.startsWith("/privado/cap/")) || "/privado/cap/seg-t2-com-mascaras-748.webp";
const exemploRefinada = doPublic.find((u) => u.startsWith("/refinada/") && u.endsWith(".webp")) || "/refinada/x.webp";
const variacoes = [
  exemploPrivado.replace("/privado/", "/Privado/"), exemploPrivado.replace("/privado/", "/PRIVADO/"),
  "/ararat/%2e%2e/privado/cap/seg-t2-com-mascaras-748.webp", "/ararat/../privado/cap/seg-t2-com-mascaras-748.webp",
  "//privado/cap/seg-t2-com-mascaras-748.webp", "/pt/%2e%2e/refinada/", "/privado", "/privado/", "/privado/MANIFESTO.json",
  `/_next/image?url=${encodeURIComponent(exemploPrivado)}&w=640&q=75`, `/_next/image?url=${encodeURIComponent(exemploRefinada)}&w=640&q=75`,
  `/_next/image?url=${encodeURIComponent("//privado/cap/x.webp")}&w=640&q=75`,
  "/previa", "/previa/", "/previa/refinada?_rsc=1", "/previa/institucional/pt/plataforma", "/teste/ponte", "/refinada", "/product/refinada",
  "/institucional/capturas-v1", "/motion/manifest.json", "/marca-03d2", "/brand/ararat_hub.png",
  "/PT", "/pt/", "/Pt/plataforma", "/pt/plataforma?_rsc=abc",
];

const res = { base, variante: publico ? "publica" : "privada", dist, arquivos: 0, rotas: 0, variacoes: 0, links: 0, falhas: [], amostras: {} };
const falha = (tipo, caminho, obtido, esperado) => res.falhas.push({ tipo, caminho, obtido, esperado });
const bloqueado = (r) => r.status === 404 && r.h["x-ararat-bloqueio"] === "fora-da-publicacao";

async function conferir(tipo, caminho, { existe = true } = {}) {
  const r = await pedir(caminho);
  const decod = (() => { try { return new URL(caminho, "http://x").pathname; } catch { return caminho; } })();
  const q = (() => { try { return new URL(caminho, "http://x").searchParams; } catch { return undefined; } })();
  if (publico) {
    const lib = liberadoNoPublico(decod, q);
    if (lib) { if (existe && !(r.status === 200 || (r.status >= 300 && r.status < 400))) falha(tipo, caminho, r.status, "200 (liberado)"); }
    else if (r.status === 200) falha(tipo, caminho, r.status, "404 bloqueado");
    else if (!bloqueado(r) && r.status !== 404 && !(r.status >= 300 && r.status < 400) && r.status !== 400) falha(tipo, caminho, r.status, "404");
  } else if (existe && r.status !== 200 && !(r.status >= 300 && r.status < 400)) falha(tipo, caminho, r.status, "200 (revisão privada)");
  return r;
}

async function lote(lista, f, n = 12) { for (let i = 0; i < lista.length; i += n) await Promise.all(lista.slice(i, i + n).map(f)); }

await lote(doPublic, async (u) => { res.arquivos++; await conferir("arquivo", enc(u)); });
// /teste/* só existe em build com ARARAT_HARNESS=1 (responde 404 nos demais, por desenho anterior a esta rodada)
const HARNESS = process.env.ARARAT_HARNESS === "1";
await lote([...rotas], async (u) => { res.rotas++; await conferir("rota", enc(u), { existe: HARNESS || !u.startsWith("/teste/") }); });
// segue até 3 redirecionamentos (ex.: //privado/x → 308 → /privado/x) e confere o destino final
async function final(v) { let c = v, r = await pedir(c), n = 0; while (r.status >= 300 && r.status < 400 && r.h.location && n++ < 3) { c = new URL(r.h.location, base).pathname + new URL(r.h.location, base).search; r = await pedir(c); } return { r, c }; }
for (const v of variacoes) { res.variacoes++; const r0 = await pedir(v); const { r, c } = await final(v);
  res.amostras[v] = { status: r0.status, final: c !== v ? { caminho: c, status: r.status, bloqueio: r.h["x-ararat-bloqueio"] || null } : null, bloqueio: r0.h["x-ararat-bloqueio"] || null, tipo: r.h["content-type"] || null, bytes: r.corpo.length };
  const u = new URL(v.replace(/^\/\//, "/"), "http://x");
  const uf = new URL(c, "http://x");
  if (publico && r.status === 200 && !(liberadoNoPublico(u.pathname, u.searchParams) && liberadoNoPublico(uf.pathname, uf.searchParams))) falha("variacao", `${v} → ${c}`, 200, "não 200"); }

// links e recursos das páginas liberadas
if (publico) {
  const paginas = [...rotas].filter((r) => liberadoNoPublico(r));
  const refs = new Set();
  for (const p of paginas) {
    const r = await pedir(enc(p)); const t = r.corpo.toString("utf8");
    for (const m of t.matchAll(/(?:src|href|srcset|srcSet)="([^"]+)"/g)) for (const parte of m[1].split(",")) {
      const x = parte.trim().split(" ")[0]; if (x.startsWith("/") && !x.startsWith("//")) refs.add(x.split("#")[0]);
    }
  }
  await lote([...refs].filter(Boolean), async (x) => { res.links++; const r = await pedir(x); if (bloqueado(r) || r.status >= 400) falha("link-de-pagina-liberada", x, r.status, "200"); });
}

res.porGrupo = {};
for (const u of doPublic) { const k = Object.keys(exposicao.pastasPublic).filter((k) => u.startsWith("/" + k + "/")).sort((a, b) => b.length - a.length)[0] || "?"; const g = (res.porGrupo[k] ||= { arquivos: 0, liberados: 0 }); g.arquivos++; if (liberadoNoPublico(u)) g.liberados++; }
if (saida) writeFileSync(saida, JSON.stringify(res, null, 2));
console.log(`${res.variante}: ${res.arquivos} arquivos de public/, ${res.rotas} rotas, ${res.variacoes} variações, ${res.links} links/recursos — ${res.falhas.length} falhas`);
res.falhas.slice(0, 25).forEach((f) => console.log(`  FALHA ${f.tipo} ${f.caminho} → ${f.obtido} (esperado ${f.esperado})`));
process.exit(res.falhas.length ? 1 : 0);
