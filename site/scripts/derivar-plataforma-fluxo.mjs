/**
 * Derivados ESTÁTICOS da demonstração "Plataforma · fluxo Hub → Viewer" da /previa/refinada.
 * Usados pela apresentação estática (sem JS, movimento reduzido, pausa e falha do módulo) e por
 * celular. O módulo animado e os quadros dele vêm do pacote do Motion (motion/proposta/plataforma-fluxo/).
 *
 * Fonte INTACTA: C:\ARARAT\SiteDemo\entrega_site_demo_20261007 (capturas reais do ARARAT Hub 1.0.0 e do
 * Viewer, commit da6430c; caso público desidentificado ProstateX-0067, coleção PROSTATEx/TCIA, CC BY 3.0).
 * Cada arquivo é conferido pelo SHA-256 do manifesto.json do pacote antes de derivar; o script falha se a
 * fonte mudou. Nada é escrito na pasta da fonte.
 *
 * Tratamentos (registrados na atribuição da seção): recortes retangulares e redimensionamento para WebP.
 * Os recortes do Viewer começam ABAIXO da faixa de título dos viewports, que exibe a data do estudo
 * (06/12/2011, data dos DICOM públicos) — ela não é necessária à demonstração. A data não é substituída.
 * Só recortes SEM score (manifesto → recortes_sugeridos ou capturas sem score). Nada de segmentação.
 *
 *   node scripts/derivar-plataforma-fluxo.mjs <pasta-da-entrega>
 * Saída: public/refinada/plataforma-fluxo-estatico-v1/*.webp + derivados.json
 */
import sharp from "sharp";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2];
if (!SRC) throw new Error("uso: node scripts/derivar-plataforma-fluxo.mjs <pasta-da-entrega>");
const OUT = "public/refinada/plataforma-fluxo-estatico-v1";
mkdirSync(OUT, { recursive: true });
const manifesto = JSON.parse(readFileSync(join(SRC, "manifesto.json"), "utf8"));
const norm = (a) => a.replaceAll("\\", "/");
const shaDe = new Map(manifesto.capturas.map((x) => [norm(x.arquivo), x.sha256]));
// Recortes sugeridos não têm SHA próprio: derivamos da CAPTURA de origem (conferida) pelo retângulo do
// manifesto (retangulo_px = x0, y0, x1, y1) e conferimos que o resultado é idêntico, pixel a pixel, ao recorte.
const recorteDe = new Map(manifesto.recortes_sugeridos.map((r) => [norm(r.arquivo), r]));

/** Derivados: fonte (relativa à entrega), recorte opcional em px do arquivo, larguras de saída. */
const DERIVADOS = {
  // 1 · Hub: fila com o caso pronto para revisão ("Revisão pendente"), sem a coluna Score
  "hub-fila-pronto": { fonte: "recortes_sugeridos/01d_hub_caso_pronto_para_revisao__hub_fila_sem_score.png", larguras: [592, 1184] },
  "hub-cartoes-pronto": { fonte: "recortes_sugeridos/01d_hub_caso_pronto_para_revisao__hub_cartoes.png", larguras: [1094, 2188] },
  "hub-linha-pronto": { fonte: "recortes_sugeridos/01d_hub_caso_pronto_para_revisao__hub_mobile_linha.png", larguras: [592, 1184] },
  // 2 · Hub: painel do caso com checagens, miniaturas e "Abrir revisão" (sem score) → Viewer: séries T2/ADC
  "hub-painel-abrir": { fonte: "recortes_sugeridos/02a_hub_abrir_revisao_antes__hub_painel_caso_sem_score.png", larguras: [278, 556] },
  // árvore de séries até a miniatura ADC — sem o bloco de informações (que traz a data do exame)
  "viewer-series": { fonte: "capturas/02d_viewer_arvore_de_series.png", recorte: { left: 0, top: 0, width: 460, height: 1085 }, larguras: [230, 460] },
  // 3 · axial + coronal com a mira (planos sincronizados), abaixo da faixa de título
  "viewer-planos-mira": { fonte: "recortes_sugeridos/03b_viewer_mira_planos_sincronizados__viewer_area_central.png", recorte: { left: 0, top: 46, width: 1510, height: 720 }, larguras: [755, 1510] },
  // 4 · comparação T2 | ADC, cada painel abaixo da faixa de título (rodapés "referência"/"Sincronização segura" preservados)
  "viewer-comparar-t2": { fonte: "recortes_sugeridos/04b_area_comparacao__painel_esquerdo.png", recorte: { left: 0, top: 186, width: 752, height: 1340 }, larguras: [376, 752] },
  "viewer-comparar-adc": { fonte: "recortes_sugeridos/04b_area_comparacao__painel_direito.png", recorte: { left: 0, top: 186, width: 750, height: 1340 }, larguras: [375, 750] },
  // 5 · régua demonstrativa M1 55,1 mm no axial + cartão da aba Medições
  "viewer-regua": { fonte: "capturas/05e_axial_com_regua.png", recorte: { left: 0, top: 46, width: 748, height: 714 }, larguras: [374, 748] },
  "viewer-medicoes": { fonte: "recortes_sugeridos/05f_viewer_regua_e_aba_medicoes__viewer_painel_direito.png", recorte: { left: 0, top: 0, width: 814, height: 400 }, larguras: [407, 814] },
  // 6 · imagens-chave: lista "Imagens do relatório" e a prévia (sem PDF final)
  "viewer-imagens-relatorio": { fonte: "capturas/06e_painel_imagens_do_relatorio.png", recorte: { left: 0, top: 0, width: 778, height: 520 }, larguras: [389, 778] },
  "viewer-previa-relatorio": { fonte: "capturas/06f_previa_do_relatorio.png", larguras: [640, 1280] },
  // 7 · de volta ao Hub: o caso em "Revisão pendente" (estado real lido do registro clínico)
  "hub-fila-pendente": { fonte: "recortes_sugeridos/07a_hub_estado_real_da_revisao__hub_fila_sem_score.png", larguras: [592, 1184] },
  "viewer-voltar-hub": { fonte: "recortes_sugeridos/07c_viewer_voltar_ao_hub__viewer_status_direita.png", larguras: [500, 1000] },
  "hub-linha-pendente": { fonte: "recortes_sugeridos/07a_hub_estado_real_da_revisao__hub_mobile_linha.png", larguras: [592, 1184] },
};
const WEBP = { quality: 88, smartSubsample: true, effort: 6 };
const out = { fonte: SRC, gerado: new Date().toISOString(), arquivos: {} };

for (const [nome, d] of Object.entries(DERIVADOS)) {
  let origem = d.fonte;
  let pre = null; // retângulo do recorte sugerido dentro da captura
  const rs = recorteDe.get(d.fonte);
  if (rs) {
    origem = norm(rs.origem);
    const [x0, y0, x1, y1] = rs.retangulo_px;
    pre = { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
  }
  const buf = readFileSync(join(SRC, origem));
  const sha = createHash("sha256").update(buf).digest("hex");
  const esperado = shaDe.get(origem);
  if (!esperado) throw new Error(`${origem}: sem SHA-256 no manifesto`);
  if (sha !== esperado) throw new Error(`${origem}: SHA-256 difere do manifesto (fonte alterada?)`);
  let img = buf;
  if (pre) {
    img = await sharp(buf).extract(pre).png().toBuffer();
    const a = await sharp(img).raw().toBuffer();
    const b = await sharp(readFileSync(join(SRC, d.fonte))).removeAlpha().raw().toBuffer();
    const a3 = await sharp(img).removeAlpha().raw().toBuffer();
    if (Buffer.compare(a3, b) !== 0 && a.length) throw new Error(`${d.fonte}: recorte do manifesto não confere com a captura de origem`);
  }
  const meta = await sharp(img).metadata();
  const r = d.recorte ?? { left: 0, top: 0, width: meta.width, height: meta.height };
  const base = sharp(img).extract(r);
  const arquivos = [];
  for (const w of d.larguras) {
    const f = `${nome}-${w}.webp`;
    const info = await base.clone().resize({ width: Math.min(w, r.width) }).webp(WEBP).toFile(join(OUT, f));
    arquivos.push({ src: `/refinada/plataforma-fluxo-estatico-v1/${f}`, w: info.width, h: info.height, bytes: statSync(join(OUT, f)).size });
  }
  out.arquivos[nome] = { fonte: d.fonte, origem, sha256Origem: sha, recorteNaOrigem: pre, recorte: r, arquivos };
}
writeFileSync(join(OUT, "derivados.json"), JSON.stringify(out, null, 1));
console.log(Object.entries(out.arquivos).map(([n, a]) => `${n}: ${a.arquivos.map((x) => `${x.w}×${x.h} ${(x.bytes / 1024).toFixed(0)} KB`).join(", ")}`).join("\n"));
