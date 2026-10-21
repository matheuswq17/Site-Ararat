// Composição panorâmica CANDIDATA da abertura (rodada de portfólio). NÃO é layout aprovado: as medidas reais
// (cabeçalho, margens, escala de texto) virão do Construction depois da escolha da direção.
//
// Princípio: adaptar a composição do módulo existente (montanha 1.2.1-03d2), sem mudar relevo, câmera, arco, luz,
// API ou material. O host do módulo é a FAIXA inteira (largura total da tela). `art` é um sub-retângulo da faixa
// com as MESMAS proporções das famílias de poster que já existem no pacote 1.2.1-03d2:
//   - desktop (wide, alinhar 'topo', 5:3, larguras 600…1100);
//   - movel (narrow, alinhar 'topo', 5:4, larguras 320…590);
//   - movel-util (narrow, 5:4, alturaUtil em degraus de 10 px, larguras 320…430).
// Assim, poster e canvas coincidem no mesmo retângulo, e nenhuma família nova de poster é necessária para estudar.
//
// Regras do módulo usadas aqui (home-sculpture.js 1.2.1-03d2, homeCompositionFor):
//   wide   arcR = min(0,28·w, 0,5·hU, 340); topo do arco = pad = max(6, 0,03·arcR); altura do desenho = 1,565·arcR
//   narrow arcR = min(0,37·w, 0,56·hU);     idem pad;                          altura do desenho = 1,52·arcR
// O teto de 340 px do raio limita o desenho a ~1044 × 532 px CSS, em qualquer tela larga.

export const FAMILIAS = {
  desktop: [600, 630, 660, 690, 720, 750, 785, 820, 860, 900, 940, 980, 1020, 1060, 1100],
  movel: [320, 335, 350, 365, 380, 390, 395, 410, 430, 450, 475, 500, 530, 560, 590],
  movelUtil: [320, 335, 350, 365, 380, 390, 395, 410, 430],
};
export const PASSO_UTIL = 10;
const BOUNDS_H = { wide: 1.565, narrow: 1.52 };
// extensão horizontal do desenho em relação ao centro do arco (cx), em arcR — medida nos JSON da família editorial
// 1.2.1-03d2 (wide): o pico secundário puxa o desenho para a esquerda (cx − 1,711·R … cx + 1,359·R)
const ESQ = 1.711, DIR = 1.359;

export function raio(art, alturaUtil) {
  const narrow = art.w < 600;
  const hU = alturaUtil ? Math.min(art.h, alturaUtil) : art.h;
  const arcR = narrow ? Math.min(art.w * 0.37, hU * 0.56) : Math.min(art.w * 0.28, hU * 0.5, 340);
  const pad = Math.max(6, arcR * 0.03);
  return { narrow, arcR, pad, desenhoH: arcR * (narrow ? BOUNDS_H.narrow : BOUNDS_H.wide), desenhoW: arcR * (ESQ + DIR), esq: arcR * ESQ, dir: arcR * DIR };
}

/**
 * @param {object} o
 * @param {number} o.vw, o.vh   viewport CSS
 * @param {number} o.header     altura do cabeçalho do Site (candidato: 72 / 56)
 * @param {'horizonte'|'lateral'} o.variante  só desktop; no celular há uma só composição
 * @param {number} o.textoH     altura medida do bloco de texto (título + descrição + ações) do Site
 * @param {number} o.textoW     largura máxima do bloco de texto (desktop lateral)
 * @param {number} o.gutter     margem lateral do Site
 * @returns {{faixa, art, composicao, poster, texto, medidas}}
 */
export function compor({ vw, vh, header, variante = 'horizonte', textoH, textoW = 420, gutter }) {
  const faixa = { w: vw, h: Math.max(vh - header, 0) };
  const g = gutter ?? (vw < 600 ? 16 : Math.round(Math.min(72, Math.max(20, vw * 0.05))));
  if (vw < 600) {
    // celular: largura da família movel ≤ tela, centrada; texto sob o sopé. Se não couber, alturaUtil em degraus.
    const W = [...FAMILIAS.movel].reverse().find((w) => w <= vw) ?? FAMILIAS.movel[0];
    const art = { x: Math.round((vw - W) / 2), y: 0, w: W, h: Math.round(W * 0.8) };
    const GAP = 12, BASE = 20;
    let util = null, r = raio(art);
    const cabe = (rr) => rr.pad + rr.desenhoH + GAP + textoH + BASE <= faixa.h;
    if (!cabe(r) && FAMILIAS.movelUtil.includes(W)) {
      const livre = faixa.h - textoH - GAP - BASE; // altura disponível para o desenho
      // hU tal que pad + 1,52·0,56·hU ≤ livre (quando o raio é limitado pela altura)
      util = Math.max(120, Math.floor(livre / (0.56 * BOUNDS_H.narrow * 1.02) / PASSO_UTIL) * PASSO_UTIL);
      r = raio(art, util);
    }
    const textoY = Math.round(r.pad + r.desenhoH + GAP);
    return {
      faixa, art, composicao: { alinhar: 'topo', ...(util ? { alturaUtil: util } : {}) },
      poster: util ? `arte-escultura-movel-util-w${W}-a${util}` : W === 390 ? 'arte-escultura-movel' : `arte-escultura-movel-w${W}`,
      texto: { x: g, y: textoY, w: vw - 2 * g },
      medidas: { ...r, gutter: g, cabe: cabe(r), sobraInferior: Math.round(faixa.h - (textoY + textoH)) },
    };
  }
  if (variante === 'lateral') {
    // montanha à direita (borda direita do DESENHO na margem do Site), texto à esquerda com a última linha no sopé.
    // Escolhe a maior largura da família desktop em que o texto ainda tem ≥ textoMin de coluna.
    const textoMin = 400, GAP_COL = 40;
    let esc = null;
    for (const W of FAMILIAS.desktop) {
      const h = W * 0.6; if (h > faixa.h - 32) break;
      const r = raio({ w: W, h });
      const cx = vw - g - r.dir; const x = Math.round(cx - W / 2);
      const tw = Math.round(cx - r.esq - GAP_COL - g);
      if (tw >= textoMin) esc = { W, r, x, tw };
    }
    if (!esc) { const W = 600, r = raio({ w: W, h: 360 }); const cx = vw - g - r.dir; esc = { W, r, x: Math.round(cx - W / 2), tw: Math.round(cx - r.esq - GAP_COL - g) }; }
    const { W, r } = esc;
    const art = { x: esc.x, y: Math.round(Math.max(16, (faixa.h - W * 0.6) / 2)), w: W, h: Math.round(W * 0.6) };
    const sopeY = art.y + r.pad + r.desenhoH;
    const tw = Math.min(textoW, esc.tw);
    return {
      faixa, art, composicao: { alinhar: 'topo' }, poster: `arte-escultura-desktop-w${W}`,
      texto: { x: g, y: Math.round(Math.max(24, sopeY - textoH)), w: tw },
      medidas: { ...r, gutter: g, sopeY: Math.round(sopeY), desenhoX0: Math.round(art.x + W / 2 - r.esq), cabe: tw >= textoMin },
    };
  }
  // horizonte: montanha centrada no alto da faixa, texto sob o sopé, alinhado à margem esquerda
  const GAP = 28, BASE = 32, TOPO = 8;
  let W = 600;
  for (const w of FAMILIAS.desktop) {
    if (w > vw - 2 * g) break;
    const r = raio({ w, h: w * 0.6 });
    if (TOPO + r.pad + r.desenhoH + GAP + textoH + BASE <= faixa.h) W = w;
  }
  const art = { x: Math.round((vw - W) / 2), y: TOPO, w: W, h: Math.round(W * 0.6) };
  const r = raio(art);
  const textoY = Math.round(art.y + r.pad + r.desenhoH + GAP);
  return {
    faixa, art, composicao: { alinhar: 'topo' }, poster: `arte-escultura-desktop-w${W}`,
    texto: { x: g, y: textoY, w: Math.min(vw - 2 * g, 1100) },
    medidas: { ...r, gutter: g, cabe: textoY + textoH + BASE <= faixa.h, sobraInferior: Math.round(faixa.h - (textoY + textoH)) },
  };
}
