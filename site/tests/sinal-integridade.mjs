/**
 * Experimento brand-sinal-v1 — integridade das cópias oficiais do ARARAT Sinal em public/marca-sinal/v1.0/.
 *   node tests/sinal-integridade.mjs                 # confere tamanho e SHA-256 contra MANIFESTO.json
 *   BASE=http://localhost:3020 node tests/sinal-integridade.mjs   # também confere os bytes SERVIDOS
 * Os hashes do manifesto foram conferidos contra os arquivos do pacote ARARAT_Sinal_Brand_System_v1.0
 * (pasta local = zip, SHA-256 do zip 8c6caf542ca414dfb299148b43201fe70227247a83c001601c4213344370190d).
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const RAIZ = new URL("../public/marca-sinal/v1.0/", import.meta.url).pathname;
const m = JSON.parse(readFileSync(join(RAIZ, "MANIFESTO.json"), "utf8"));
const sha = (b) => createHash("sha256").update(b).digest("hex");
let falhas = 0;
const listados = new Set(m.arquivos.map((a) => a.caminho));
const todos = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? todos(join(d, f)) : [join(d, f)]));
for (const f of todos(RAIZ).map((p) => p.slice(RAIZ.length)).filter((p) => !/^(MANIFESTO\.json|README\.md)$/.test(p)))
  if (!listados.has(f)) { falhas++; console.log(`✘ fora do manifesto: ${f}`); }
for (const a of m.arquivos) {
  const b = readFileSync(join(RAIZ, a.caminho));
  const ok = b.length === a.bytes && sha(b) === a.sha256;
  let srv = "";
  if (process.env.BASE) {
    const r = await fetch(`${process.env.BASE}/marca-sinal/v1.0/${a.caminho.split("/").map(encodeURIComponent).join("/")}`);
    const sb = Buffer.from(await r.arrayBuffer());
    srv = r.ok && sha(sb) === a.sha256 ? " · servido idêntico" : ` · SERVIDO DIFERE (${r.status})`;
    if (!srv.includes("idêntico")) falhas++;
  }
  if (!ok) falhas++;
  console.log(`${ok ? "✔" : "✘"} ${a.caminho} ${a.bytes} B ${a.sha256.slice(0, 16)}…${srv}`);
}
console.log(falhas ? `\n✘ ${falhas} falha(s)` : `\n✔ ${m.arquivos.length}/${m.arquivos.length} arquivos oficiais do Sinal íntegros`);
process.exit(falhas ? 1 : 0);
