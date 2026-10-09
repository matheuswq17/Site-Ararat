// Gera (e confere) a camada de tokens do ARARAT 03D2 com escopo no Site, a partir do arquivo OFICIAL
// public/marca-03d2/v1.0/02_tokens/ararat-03d2.tokens.css (cópia byte a byte do kit).
//
//   node tests/marca-03d2-tokens.mjs           → confere: o arquivo do Site é idêntico ao gerado agora
//   node tests/marca-03d2-tokens.mjs --gerar   → regrava components/preview/proposta/marca-03d2.tokens.css
//
// Transformação (nenhum valor é digitado à mão; só os seletores mudam):
//   :root { escalas, tipo, espaço, raio, bordas, tempos, layout }  → escopo da marca (wrapper e <html>)
//   [data-theme="escuro"] { … }   → escopo da marca: o site é escuro por padrão (brand book: "o site e o
//                                   Viewer usam o escuro como padrão")
//   :root, [data-theme="claro"] { … } → seções claras do Site (Plataforma, Ciência, Time, Contato — editorial-v1)
//   @media (prefers-color-scheme: dark) → omitido (o tema do site não segue o sistema)
//   @media (max-width: 720px) e (prefers-reduced-motion) → mesmos valores, mesmo escopo
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..");
const OFICIAL = join(SITE, "public/marca-03d2/v1.0/02_tokens/ararat-03d2.tokens.css");
const DESTINO = join(SITE, "components/preview/proposta/marca-03d2.tokens.css");
const ESCOPO = '[data-marca="03d2"],\nhtml:has([data-marca="03d2"])';
const CLARO = '[data-marca="03d2"] :is(#plataforma, #ciencia, #time, #contato)';

/** Blocos de nível superior (seletor/at-rule + corpo), sem interpretar valores. */
function blocos(css) {
  const out = [];
  let i = 0;
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  while (i < css.length) {
    const a = css.indexOf("{", i);
    if (a < 0) break;
    const sel = css.slice(i, a).trim();
    let prof = 1, j = a + 1;
    while (prof && j < css.length) { if (css[j] === "{") prof++; else if (css[j] === "}") prof--; j++; }
    out.push({ sel, corpo: css.slice(a + 1, j - 1) });
    i = j;
  }
  return out;
}
const decl = (corpo) => corpo.split(";").map((d) => d.trim()).filter(Boolean).map((d) => "  " + d + ";").join("\n");

export function gerar() {
  const css = readFileSync(OFICIAL, "utf8");
  const b = blocos(css);
  const achar = (s) => { const x = b.find((y) => y.sel === s); if (!x) throw new Error("bloco ausente no arquivo oficial: " + s); return x; };
  const base = achar(":root");
  const escuro = achar('[data-theme="escuro"]');
  const claro = achar(':root, [data-theme="claro"]');
  const celular = achar("@media (max-width: 720px)");
  const reduzido = achar("@media (prefers-reduced-motion: reduce)");
  const interno = (bloco) => blocos(bloco.corpo)[0].corpo;
  return `/* GERADO por tests/marca-03d2-tokens.mjs a partir de public/marca-03d2/v1.0/02_tokens/ararat-03d2.tokens.css
   (cópia byte a byte do kit ARARAT 03D2 v1.0). Não editar à mão: rode "node tests/marca-03d2-tokens.mjs --gerar".
   Só os seletores mudam: escala e tema ESCURO no escopo da marca (o site é escuro por padrão); tema CLARO nas
   seções claras (#plataforma, #ciencia, #time, #contato). O bloco prefers-color-scheme do kit é omitido. */

/* :root do kit — escalas, tipografia, espaço, raio, bordas, tempos, layout */
${ESCOPO} {
${decl(base.corpo)}
}

/* [data-theme="escuro"] do kit — tema padrão do site */
${ESCOPO} {
${decl(escuro.corpo)}
}

/* :root, [data-theme="claro"] do kit — seções claras */
${CLARO} {
${decl(claro.corpo)}
}

/* @media (max-width: 720px) do kit */
@media (max-width: 720px) {
  ${ESCOPO.replace("\n", "\n  ")} {
${decl(interno(celular)).replace(/^/gm, "  ")}
  }
}

/* @media (prefers-reduced-motion: reduce) do kit */
@media (prefers-reduced-motion: reduce) {
  ${ESCOPO.replace("\n", "\n  ")} {
${decl(interno(reduzido)).replace(/^/gm, "  ")}
  }
}
`;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const novo = gerar();
  if (process.argv.includes("--gerar")) {
    writeFileSync(DESTINO, novo);
    console.log("gravado", DESTINO);
  } else {
    const atual = readFileSync(DESTINO, "utf8");
    if (atual !== novo) {
      console.error("✘ marca-03d2.tokens.css difere do gerado a partir do arquivo oficial");
      process.exit(1);
    }
    console.log("✔ tokens do Site = tokens oficiais do kit 03D2 (mesmos valores, só o escopo muda)");
  }
}
