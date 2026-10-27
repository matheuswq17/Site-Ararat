/** ARARAT Brand System v2.0, 26/10/2026. Assets conferidos em marca-v2/integracao.json.
 * Assinatura compacta: moldura de 32–95 px; favicon usa a versão pequena. */
export const MARCA_BASE = "/ararat/marca-v2";
export const MARCA_HORIZONTAL = MARCA_BASE + "/assinatura-horizontal-compacta-negativo.svg";
// A proporção vem do viewBox dos SVG. Reservar largura e altura evita mudanças de layout ao carregar.
export const MARCAS_PRODUTO: Record<string, { src: string; width: number; height: number }> = {
  model: { src: MARCA_BASE + "/ararat-model-compacta-negativo.svg", width: 166.87, height: 32 },
  hub: { src: MARCA_BASE + "/ararat-hub-compacta-negativo.svg", width: 144.49, height: 32 },
  viewer: { src: MARCA_BASE + "/ararat-viewer-compacta-negativo.svg", width: 172.39, height: 32 },
};
