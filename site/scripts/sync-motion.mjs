#!/usr/bin/env node
/**
 * Sincroniza o pacote do Claude Motion para site/public/motion/ (contrato v1).
 *
 *   npm run motion:sync                 # lê ../motion/deliverables
 *   npm run motion:sync -- --from <dir> # outra origem (ex.: fixture de teste)
 *   npm run motion:sync -- --clean      # remove public/motion (volta ao fallback)
 *
 * Regras: só copia pacote com schemaVersion 1 e status "ready"; copia apenas
 * os arquivos listados em manifest.files (+ manifest.json); valida existência,
 * caminho relativo seguro e sizeBytes. Nunca altera a origem.
 * Ausência do pacote não é erro: o site usa a cena estática própria.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(siteDir, "public", "motion");
const args = process.argv.slice(2);
const fromIdx = args.indexOf("--from");
const source = path.resolve(
  siteDir,
  fromIdx >= 0 ? args[fromIdx + 1] : path.join("..", "motion", "deliverables"),
);

if (args.includes("--clean")) {
  rmSync(target, { recursive: true, force: true });
  console.log("public/motion removido. O site usará a cena estática.");
  process.exit(0);
}

const manifestPath = path.join(source, "manifest.json");
if (!existsSync(manifestPath)) {
  console.log(`Pacote de motion ausente (${manifestPath}). Nada copiado; fallback estático mantido.`);
  process.exit(0);
}

/**
 * Tamanho do arquivo sem blocos de credenciais de conteúdo (C2PA) que a ponte
 * de arquivos do computador pode acrescentar a WebP/PNG depois da geração do
 * manifest. Os pixels não mudam; só esse bloco de metadados é descontado.
 */
function sizeWithoutC2pa(buf) {
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    let size = buf.length;
    for (let i = 12; i + 8 <= buf.length; ) {
      const tag = buf.toString("ascii", i, i + 4);
      const len = buf.readUInt32LE(i + 4);
      const total = 8 + len + (len & 1);
      if (tag === "C2PA") size -= total;
      i += total;
    }
    return size;
  }
  if (buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47) {
    let size = buf.length;
    for (let i = 8; i + 12 <= buf.length; ) {
      const len = buf.readUInt32BE(i);
      const tag = buf.toString("ascii", i + 4, i + 8);
      if (tag === "caBX") size -= 12 + len;
      i += 12 + len;
    }
    return size;
  }
  return buf.length;
}

const fail = (msg) => {
  console.error(`motion:sync recusado — ${msg}`);
  process.exit(1);
};

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (e) {
  fail(`manifest.json inválido: ${e.message}`);
}

if (manifest.schemaVersion !== 1) fail(`schemaVersion ${manifest.schemaVersion} (esperado 1)`);
if (manifest.status !== "ready") {
  console.log(`Pacote com status "${manifest.status}". Só "ready" é integrado; fallback mantido.`);
  process.exit(0);
}
if (!Array.isArray(manifest.files) || manifest.files.length === 0) fail("files ausente ou vazio");

const safe = /^(?!\/)(?!.*\.\.)(?!.*:)[A-Za-z0-9._\-/]+$/;
const listed = new Set();
const c2paNotes = [];
for (const f of manifest.files) {
  if (!f || !safe.test(f.path ?? "")) fail(`caminho inválido em files: ${JSON.stringify(f)}`);
  const abs = path.join(source, f.path);
  if (!existsSync(abs)) fail(`arquivo listado inexistente: ${f.path}`);
  const size = statSync(abs).size;
  if (typeof f.sizeBytes === "number" && f.sizeBytes !== size) {
    const stripped = sizeWithoutC2pa(readFileSync(abs));
    if (stripped !== f.sizeBytes) fail(`sizeBytes divergente em ${f.path}: manifest ${f.sizeBytes}, real ${size}`);
    c2paNotes.push(`${f.path} (+${size - f.sizeBytes} B de C2PA)`);
  }
  listed.add(f.path);
}
for (const key of ["entry", "stylesheet", "poster"]) {
  if (!listed.has(manifest[key])) fail(`${key} (${manifest[key]}) não está em files`);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
for (const rel of listed) {
  const dest = path.join(target, rel);
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(path.join(source, rel), dest);
}
writeFileSync(path.join(target, "manifest.json"), JSON.stringify(manifest, null, 2));

if (c2paNotes.length) {
  console.log(`Aviso: bloco C2PA acrescentado após o manifest (tamanho conferido sem ele): ${c2paNotes.join(", ")}`);
}
console.log(
  `Pacote de motion ${manifest.version ?? "(sem versão)"} integrado: ${listed.size} arquivo(s) em public/motion. Rode "npm run build".`,
);
