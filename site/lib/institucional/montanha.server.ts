import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Montanha da abertura institucional — pacote do Motion 1.2.1-03d2 (candidato; institucional-motion-v1 @ 4b47a39),
 * copiado SEM ALTERAÇÃO para public/previa/home-montanha-1.2.1-03d2/ e conferido com o script do Motion
 * (sync-manifest --check 246/246, tamanho e sha256). A /previa/refinada continua lendo a 1.2.0-03d2.
 *
 * Contrato (docs/coordination/PROPOSTA-INSTITUCIONAL-MOTION.md §3): o host é o próprio slot da arte, em fluxo normal;
 * sem passagem (target null, sem setPassage); luz ambiente só com o slot na tela; pausa = estática; reduzido = estática;
 * falha = poster. Composição: "centro" em duas colunas (≥ 1200 px, slot 5:3), "topo" no resto (slot = largura da tela,
 * 5:4 abaixo de 600 px, 5:3 de 600 a 1199). No celular baixo, alturaUtil = parte visível do slot na 1ª tela.
 *
 * Posters (sem JS, movimento reduzido antes do módulo, falha): as próprias tabelas do pacote
 *  · ≥ 1200: assets/arte-escultura-editorial-variantes.json → pictureEditorialExemplo (o layout usa as mesmas medidas
 *    da frente editorial: conteúdo 1320, margem clamp(20, 5vw, 72), colunas 5fr/7fr, vão clamp(24, 3vw, 64));
 *  · < 1200: assets/arte-escultura-variantes.json → pictureSlotSite (slot = largura da tela);
 *  · celular baixo (< 600 e altura curta): assets/arte-escultura-movel-util-variantes.json, escolhida por media
 *    queries de largura E altura com o topo do slot MEDIDO no layout (TOPO_SLOT_CELULAR), arredondando para baixo.
 */
export const PACOTE_MONTANHA = {
  versao: "1.2.1-03d2",
  baseUrl: "/previa/home-montanha-1.2.1-03d2/",
  modulo: "/previa/home-montanha-1.2.1-03d2/web/home-sculpture.js",
} as const;

export type FontePoster = { media: string; srcSet: string };

/**
 * Topo do slot da arte no documento (px CSS), medido na página com a fonte carregada, por largura da tela, no
 * celular (< 600). Depende só do layout (texto e cabeçalho), não da rolagem. Atualizar com
 * `node tests/institucional.mjs <url> <saída.json>` (medidas.slots) quando o texto da abertura mudar. Vazia no layout
 * atual: a montanha cabe inteira na 1ª tela em todas as telas medidas (390×640 e 320×568 inclusive), então a família
 * movel-util não é usada (registro: docs/coordination/INSTITUCIONAL-MEDIDAS-SITE.md, fora do Git).
 */
export const TOPO_SLOT_CELULAR: Record<number, number> = {};

const dir = join(process.cwd(), "public", "previa", "home-montanha-1.2.1-03d2", "assets");
const ler = (f: string) => JSON.parse(readFileSync(join(dir, f), "utf8"));
const url = (rel: string) => PACOTE_MONTANHA.baseUrl + rel;
const srcset = (s: string) => s.split(",").map((p) => { const [u, d] = p.trim().split(/\s+/); return `${url(u)} ${d}`; }).join(", ");

type Util = { areaCss: { w: number; h: number }; alturaUtil: number; arquivos: { "1x": string; "2x": string } };

function lerFontes(): { fontes: FontePoster[]; padrao: { src: string; w: number; h: number } } {
  try {
    const ed = ler("arte-escultura-editorial-variantes.json");
    const base = ler("arte-escultura-variantes.json");
    const util = ler("arte-escultura-movel-util-variantes.json").variantes as Util[];
    const fontes: FontePoster[] = [];
    // celular baixo primeiro (mais específico): para cada faixa de largura da família movel, a altura útil pela altura
    for (const f of base.pictureSlotSite as Array<{ media: string; srcset: string }>) {
      const m = /movel-w(\d+)@/.exec(f.srcset);
      if (!m) continue;
      const w = Number(m[1]);
      const topo = TOPO_SLOT_CELULAR[w];
      if (!topo) continue;
      const h = Math.round(w * 0.8);
      for (const v of util.filter((u) => u.areaCss.w === w).sort((a, b) => a.alturaUtil - b.alturaUtil)) {
        // visível = altura da tela − topo; vale a variante a se a ≤ visível < a + 10, com 0,5·h ≤ visível < 0,75·h
        const min = topo + v.alturaUtil, max = topo + v.alturaUtil + 9.98;
        if (v.alturaUtil < 0.5 * h || v.alturaUtil >= 0.75 * h) continue;
        fontes.push({ media: `${f.media} and (min-height: ${min}px) and (max-height: ${max}px)`, srcSet: `${url(v.arquivos["1x"])} 1x, ${url(v.arquivos["2x"])} 2x` });
      }
    }
    for (const f of ed.pictureEditorialExemplo as Array<{ media: string; srcset: string }>) fontes.push({ media: f.media, srcSet: srcset(f.srcset) });
    for (const f of base.pictureSlotSite as Array<{ media: string; srcset: string }>) fontes.push({ media: f.media, srcSet: srcset(f.srcset) });
    return { fontes, padrao: { src: url("assets/arte-escultura-editorial-w736@2x.webp"), w: 736, h: 442 } };
  } catch {
    return { fontes: [], padrao: { src: url("assets/arte-escultura-editorial-w736@2x.webp"), w: 736, h: 442 } };
  }
}

export const POSTERS_MONTANHA = lerFontes();
