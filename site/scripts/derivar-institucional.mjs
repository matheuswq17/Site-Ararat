/**
 * Reenquadramentos ESTÁTICOS do institucional (Plataforma e roteiro da gravação futura).
 *
 * Fonte INTACTA: C:\ARARAT\SiteDemo\entrega_site_demo_20261007 (capturas reais do ARARAT Hub e do ARARAT Viewer,
 * commit da6430c, 07/10/2026; caso público desidentificado ProstateX-0067, coleção PROSTATEx/TCIA, CC BY 3.0).
 * Cada captura é conferida pelo SHA-256 do manifesto.json da entrega antes de recortar; o script falha se a fonte
 * mudou. Nada é escrito na pasta da fonte.
 *
 * Tratamento: SÓ recorte retangular na resolução da captura (sem redimensionar para cima, sem filtro, sem nitidez,
 * sem recolorir). O recorte serve para aproximar o estado que importa ("Revisão pendente", "Visualizar relatório",
 * medida completa "M1 55,1 mm") quando a captura atual basta. Nada de score, segmentação, data do estudo ou DWI.
 *
 *   node scripts/derivar-institucional.mjs <pasta-da-entrega>
 * Saída: public/institucional/capturas-v1/*.webp + derivados.json
 */
import sharp from "sharp";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2];
if (!SRC) throw new Error("uso: node scripts/derivar-institucional.mjs <pasta-da-entrega>");
const OUT = "public/institucional/capturas-v1";
mkdirSync(OUT, { recursive: true });
const manifesto = JSON.parse(readFileSync(join(SRC, "manifesto.json"), "utf8"));
const norm = (a) => a.replaceAll("\\", "/");
const shaDe = new Map(manifesto.capturas.map((x) => [norm(x.arquivo), x.sha256]));

/** Recortes em px do ARQUIVO da captura. `medica`: a placa contém pixels de RM (teto de ampliação 1,75). */
const DERIVADOS = {
  // Hub, retorno: linha do caso até a coluna Etapa ("Revisão pendente"). Termina antes da coluna Score.
  "hub-caso-revisao-pendente": {
    fonte: "capturas/07a_hub_estado_real_da_revisao.png",
    recorte: { left: 150, top: 592, width: 900, height: 96 },
    medica: false,
  },
  // Hub, retorno: só a célula Etapa, para o celular (o nome do caso vai na legenda).
  "hub-etapa-revisao-pendente": {
    fonte: "capturas/07a_hub_estado_real_da_revisao.png",
    recorte: { left: 846, top: 592, width: 220, height: 96 },
    medica: false,
  },
  // Viewer, galeria do relatório: os dois botões do pé ("Organizar imagens", "Visualizar relatório").
  "viewer-visualizar-relatorio": {
    fonte: "capturas/06e_painel_imagens_do_relatorio.png",
    recorte: { left: 0, top: 1092, width: 778, height: 184 },
    medica: false,
  },
  // Viewer, régua concluída: a medida inteira (dois pontos, traço e rótulo "M1 55,1 mm"), com pixels de RM.
  "viewer-medida-m1": {
    fonte: "capturas/05e_axial_com_regua.png",
    recorte: { left: 220, top: 326, width: 404, height: 108 },
    medica: true,
  },
};

const saida = { fonte: "entrega_site_demo_20261007", gerado: new Date().toISOString(), tratamento: "recorte retangular, sem redimensionar", arquivos: {} };
for (const [nome, d] of Object.entries(DERIVADOS)) {
  const caminho = join(SRC, d.fonte);
  const buf = readFileSync(caminho);
  const sha = createHash("sha256").update(buf).digest("hex");
  const esperado = shaDe.get(norm(d.fonte));
  if (!esperado) throw new Error(`fonte fora do manifesto: ${d.fonte}`);
  if (sha !== esperado) throw new Error(`SHA-256 diferente do manifesto: ${d.fonte}`);
  const meta = await sharp(buf).metadata();
  const r = d.recorte;
  if (r.left + r.width > meta.width || r.top + r.height > meta.height) throw new Error(`recorte fora da captura: ${nome}`);
  const arq = `${nome}-${r.width}.webp`;
  await sharp(buf).extract(r).webp({ quality: 92, effort: 6 }).toFile(join(OUT, arq));
  saida.arquivos[nome] = {
    fonte: d.fonte,
    sha256Origem: sha,
    dimensoesOrigem: { w: meta.width, h: meta.height },
    recorte: r,
    medica: d.medica,
    arquivo: { src: `/institucional/capturas-v1/${arq}`, w: r.width, h: r.height, bytes: statSync(join(OUT, arq)).size },
  };
  console.log("ok", nome, r.width, "x", r.height);
}
writeFileSync(join(OUT, "derivados.json"), JSON.stringify(saida, null, 2) + "\n");
