/**
 * Alternativa codex/brand-03d2-v1 — integridade das cópias oficiais do kit ARARAT 03D2 em
 * public/marca-03d2/v1.0/ (mesmos caminhos relativos do kit) e fidelidade da assinatura no HTML.
 *
 *   node tests/marca-03d2-integridade.mjs                                # arquivos × MANIFESTO.json
 *   BASE=http://localhost:3030 node tests/marca-03d2-integridade.mjs     # + bytes SERVIDOS + HTML
 *
 * Os hashes do MANIFESTO.json são os do manifesto.json do kit (pasta e zip conferidos: 325/325; zip
 * SHA-256 716d2738db1caa270768897a6fa96f95ac7dc6109774f472aea1d4ddc82dcc58).
 * Confere também:
 *  · tokens do Site = tokens oficiais (marca-03d2.tokens.css gerado do arquivo do kit, tests/marca-03d2-tokens.mjs);
 *  · a assinatura animável tem os MESMOS caminhos da horizontal oficial (nome em curvas, nada redigitado);
 *  · com BASE: o SVG inserido no cabeçalho de "/" e "/pt" é o arquivo animável sem alteração (mesmo markup),
 *    sem <text> nem wordmark tipografado, e o rodapé usa o arquivo horizontal negativo.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gerar } from "./marca-03d2-tokens.mjs";

const RAIZ = new URL("../public/marca-03d2/v1.0/", import.meta.url).pathname;
const TOKENS_SITE = new URL("../components/preview/proposta/marca-03d2.tokens.css", import.meta.url).pathname;
const m = JSON.parse(readFileSync(join(RAIZ, "MANIFESTO.json"), "utf8"));
const sha = (b) => createHash("sha256").update(b).digest("hex");
let falhas = 0;
const falha = (msg) => { falhas++; console.log("✘ " + msg); };

const listados = new Set(m.arquivos.map((a) => a.caminho));
const todos = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? todos(join(d, f)) : [join(d, f)]));
for (const f of todos(RAIZ).map((p) => p.slice(RAIZ.length)).filter((p) => p !== "MANIFESTO.json"))
  if (!listados.has(f)) falha(`fora do manifesto: ${f}`);
for (const a of m.arquivos) {
  const b = readFileSync(join(RAIZ, a.caminho));
  const ok = b.length === a.bytes && sha(b) === a.sha256;
  let srv = "";
  if (process.env.BASE) {
    const r = await fetch(`${process.env.BASE}/marca-03d2/v1.0/${a.caminho.split("/").map(encodeURIComponent).join("/")}`);
    const sb = Buffer.from(await r.arrayBuffer());
    srv = r.ok && sha(sb) === a.sha256 ? " · servido idêntico" : ` · SERVIDO DIFERE (${r.status})`;
    if (!srv.includes("idêntico")) falhas++;
  }
  if (!ok) falhas++;
  console.log(`${ok ? "✔" : "✘"} ${a.caminho} ${a.bytes} B ${a.sha256.slice(0, 16)}…${srv}`);
}

// Tokens: o arquivo do Site é exatamente o gerado agora a partir do arquivo oficial.
if (readFileSync(TOKENS_SITE, "utf8") !== gerar()) falha("marca-03d2.tokens.css difere do gerado a partir do arquivo oficial");
else console.log("✔ tokens do Site = tokens oficiais (mesmos valores, só o escopo muda)");

// Assinatura animável = horizontal (mesmos caminhos).
const caminhos = (svg) => [...svg.matchAll(/ d="([^"]+)"/g)].flatMap((x) => x[1].split(/(?=M)/).map((s) => s.trim()).filter(Boolean)).sort();
const animavel = readFileSync(join(RAIZ, "07_motion/ararat-assinatura-animavel.svg"), "utf8");
const horizontal = readFileSync(join(RAIZ, "01_logo/assinatura-horizontal/ararat-horizontal-negativo.svg"), "utf8");
const [ca, ch] = [caminhos(animavel), caminhos(horizontal)];
if (ca.length !== 14 || JSON.stringify(ca) !== JSON.stringify(ch)) falha(`assinatura animável ≠ horizontal (${ca.length} × ${ch.length} caminhos)`);
else console.log("✔ assinatura animável: os mesmos 14 caminhos da horizontal oficial");
if (/<text[\s>]/.test(animavel + horizontal)) falha("assinatura com <text>");

if (process.env.BASE) {
  for (const path of ["/", "/pt", "/previa/refinada"]) {
    const html = await (await fetch(process.env.BASE + path)).text();
    const cab = html.match(/<header[\s\S]*?<\/header>/)?.[0] ?? "";
    const temSvg = cab.includes(animavel.trim());
    const rod = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? "";
    const rodOk = rod.includes("/marca-03d2/v1.0/01_logo/assinatura-horizontal/ararat-horizontal-negativo.svg");
    const semTexto = !/data-word|ARARAT<\/span>\s*<span[^>]*>MODEL/.test(cab);
    if (!temSvg) falha(`${path}: cabeçalho sem o SVG animável oficial idêntico`);
    if (!rodOk) falha(`${path}: rodapé sem a assinatura horizontal oficial`);
    if (!semTexto) falha(`${path}: wordmark tipografado/ciclo no cabeçalho`);
    if (temSvg && rodOk && semTexto) console.log(`✔ ${path}: cabeçalho com o SVG oficial no HTML (idêntico), rodapé com a horizontal oficial`);
  }
}
console.log(falhas ? `\n✘ ${falhas} falha(s)` : `\n✔ ${m.arquivos.length}/${m.arquivos.length} arquivos oficiais do 03D2 íntegros; assinatura e tokens fiéis ao kit`);
process.exit(falhas ? 1 : 0);
