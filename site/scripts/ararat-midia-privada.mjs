#!/usr/bin/env node
/**
 * Prepara a mídia da REVISÃO LOCAL PRIVADA do site ARARAT (permissão de exibição pública pendente).
 * Copia, a partir da cópia de revisão do Atlas clínico (fora do Git), para site/public/privado/ (ignorado pelo Git):
 *   - assets/cap/*.webp                        → public/privado/cap/
 *   - assets/pacotes/plataforma-fluxo-0.1.0/assets/* → public/privado/plataforma-fluxo-0.1.0/assets/
 * e grava public/privado/MANIFESTO.json (sha256 e tamanho de cada arquivo). Nunca publica nada.
 * Uso (de site/): node scripts/ararat-midia-privada.mjs [pasta-da-revisão]
 *   padrão: ../docs/review/atlas-clinico-acabamento-2026-10-13 (a partir da raiz do repositório principal)
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidatos = [process.argv[2], join(site, "..", "docs/review/atlas-clinico-acabamento-2026-10-13"), join(site, "../../..", "docs/review/atlas-clinico-acabamento-2026-10-13")].filter(Boolean);
const origem = candidatos.find((p) => existsSync(join(p, "assets", "cap")));
if (!origem) { console.error("Cópia de revisão não encontrada. Informe a pasta: node scripts/ararat-midia-privada.mjs <pasta>"); process.exit(1); }
const destino = join(site, "public", "privado");
const pares = [[join(origem, "assets", "cap"), join(destino, "cap")], [join(origem, "assets", "pacotes", "plataforma-fluxo-0.1.0", "assets"), join(destino, "plataforma-fluxo-0.1.0", "assets")]];
const manifesto = { origem, data: new Date().toISOString(), permissao: "pendente — só revisão local privada", arquivos: {} };
for (const [de, para] of pares) {
  mkdirSync(para, { recursive: true });
  for (const f of readdirSync(de)) {
    const a = join(de, f); if (!statSync(a).isFile()) continue;
    copyFileSync(a, join(para, f));
    manifesto.arquivos[join(para, f).slice(destino.length + 1).replaceAll("\\", "/")] = { bytes: statSync(a).size, sha256: createHash("sha256").update(readFileSync(a)).digest("hex") };
  }
}
writeFileSync(join(destino, "MANIFESTO.json"), JSON.stringify(manifesto, null, 1));
console.log(`mídia privada: ${Object.keys(manifesto.arquivos).length} arquivos em ${destino}`);
