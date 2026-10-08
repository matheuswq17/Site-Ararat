// Plataforma · fluxo Hub → Viewer — coreografia (0.1.0-draft). Fonte legível; scripts/gerar-modulo.mjs a embute no módulo.
//
// Unidades: o "palco" tem W × H unidades (desktop 1100 × 800; celular 360 × 600) e é escalado para caber na área que o Site
// reserva. Cada PLACA é um recorte retangular do palco que mostra um ESPAÇO de captura (H = janela do Hub em px lógicos;
// V = área central do Viewer; P = painel direito do Viewer; G = galeria isolada; R = prévia do relatório; S = barra de status)
// através de uma câmera (cx, cy = canto superior esquerdo visível no espaço; z = unidades do palco por px lógico).
// Toda propriedade pode ser um número ou chaves [[p, valor], …] (p = progresso do Site, 0–1).
// Marcas: 'realce' = contorno dourado discreto sobre um controle REAL da captura; 'toque' = anel que marca um clique
// documentado na captura (nunca um cursor de mouse, para não competir com o da pessoa).

const fade = (a, b, c, d, v = 1) => (c == null ? [[a, 0], [b, v]] : [[a, 0], [b, v], [c, v], [d, 0]]);
const toque = (c, p, dur = 0.018) => ({ t: 'toque', c, u: [[p, 0], [p + dur, 1]] });
const realce = (r, o, raio) => ({ t: 'realce', r, o, ...(raio ? { raio } : {}) });
/** troca seca de quadro: [[p, índice], …] → chaves em degrau */
const passos = (lista) => lista.flatMap(([p, i], n) => (n === 0 ? [[p, i]] : [[p - 0.0001, lista[n - 1][1]], [p, i]]));
const troca = (a0, a1, b0, b1) => ({ fim: [[0, 1], [a0, 1], [a1, 0]], ini: b1 == null ? [[a0, 0], [a1, 1]] : [[a0, 0], [a1, 1], [b0, 1], [b1, 0]] });

const FUNDO = { hub: '#F6F4EF', viewer: '#0B0C0F', painel: '#081316', previa: '#14181D', status: '#11161B' };
const AXIAL = Array.from({ length: 13 }, (_, i) => `viewer-axial-${String(i + 7).padStart(2, '0')}`); // fatias 7 → 19
const MPR = Array.from({ length: 7 }, (_, i) => `viewer-mpr-${i}`);
const COMP = Array.from({ length: 9 }, (_, i) => `viewer-comp-${i}`);
const REGUA = ['viewer-regua-05a', 'viewer-regua-05c', 'viewer-regua-05d33', 'viewer-regua-05d66', 'viewer-regua-05e', 'viewer-chave-axial-06b', 'viewer-chave-axial-06c'];
const ADC = ['viewer-chave-adc-06b', 'viewer-chave-adc-06c'];

// trocas de estado da fila do Hub (interface, não imagem médica): transição curta
const FILA = [
  ['01a', [[0, 1], [0.075, 1], [0.081, 0]]],
  ['01c02', [[0.075, 0], [0.081, 1], [0.1, 1], [0.106, 0]]],
  ['01c03', [[0.1, 0], [0.106, 1], [0.125, 1], [0.131, 0]]],
  ['01d', [[0.125, 0], [0.131, 1]]],
];
// linha do caso ProstateX-0067 e células (coordenadas do espaço H)
const LINHA = [50, 294, 588, 52], CELULA_ETAPA = [423, 294, 217, 52], NOME = [170, 320];
const BOTAO_ABRIR = [1176, 528, 248, 38], BOTAO_ABRIR_C = [1300, 547];
// sequências do Viewer (comuns aos dois enquadramentos)
const seqViewer = () => [
  { a: AXIAL, o: [[0.334, 0], [0.335, 1], [0.43, 1], [0.4301, 0]], i: [[0.335, 4], [0.4, 12], [0.425, 6]] },       // 11 → 19 → 13
  { a: MPR, o: [[0.43, 0], [0.4301, 1], [0.47, 1], [0.478, 0]], i: [[0.445, 0], [0.468, 6]] },                      // mira; roda no coronal
  { a: COMP, o: [[0.478, 0], [0.488, 1], [0.6, 1], [0.607, 0]], i: [[0.495, 0], [0.555, 8]] },                       // T2 11→15 / ADC 10→14
  { a: REGUA, o: [[0.607, 0], [0.615, 1], [0.775, 1], [0.782, 0]], i: passos([[0.6, 0], [0.635, 1], [0.645, 2], [0.655, 3], [0.666, 4], [0.735, 5], [0.756, 6]]) },
  { a: ADC, o: [[0.782, 0], [0.792, 1]], i: passos([[0.78, 0], [0.8, 1]]) },
];
const marcasViewer = () => [
  toque([180, 200], 0.428),                              // clique com "Mira" no axial
  realce([383, 742, 150, 20], fade(0.556, 0.566, 0.598, 0.605), 4), // "Sincronização segura"
  toque([134, 199], 0.626),                              // régua: 1º ponto
  toque([292, 199], 0.66),                               // régua: 2º ponto
  toque([27, 357], 0.744),                               // chave no axial
  toque([406, 715], 0.793),                              // chave no painel ADC
];
const etapas = [
  { etapa: 1, nome: 'fila', ate: 0.17 },
  { etapa: 2, nome: 'abrir', ate: 0.3 },
  { etapa: 3, nome: 'cortes', ate: 0.47 },
  { etapa: 4, nome: 'comparar', ate: 0.6 },
  { etapa: 5, nome: 'medir', ate: 0.73 },
  { etapa: 6, nome: 'documentar', ate: 0.88 },
  { etapa: 7, nome: 'retorno', ate: 1.01 },
];

// ------------------------------------------------------------------ desktop (palco 1100 × 800)
const D_BOTAO = { x: 700 + (1176 - 1162) * 1.4, y: 200 + (528 - 348) * 1.4, w: 248 * 1.4, h: 38 * 1.4 };
const D_VIS = { x: 660 + 14 * 1.05, y: 64 + 596 * 1.05, w: 380 * 1.05, h: 32 * 1.05 };
const desktop = {
  W: 1100, H: 800,
  placas: [
    // cartões: só nos momentos em que foram capturados (01a antes do processamento; 01d com o caso pronto)
    { id: 'hub-cartoes', tema: 'hub', fundo: FUNDO.hub, x: 47, y: 70, w: 1094 * 0.92, h: 116 * 0.92, cx: 56, cy: 52, z: 0.92, o: [[0, 1], [0.072, 1], [0.078, 0], [0.125, 0], [0.135, 1], [0.245, 1], [0.27, 0]],
      camadas: [{ a: 'hub-cartoes-01a', o: [[0, 1], [0.078, 1], [0.0781, 0]] }, { a: 'hub-cartoes-01d', o: [[0.0781, 0], [0.0782, 1]] }],
      marcas: [realce([60, 56, 258, 108], fade(0.135, 0.15, 0.2, 0.215))] },
    { id: 'hub-fila', tema: 'hub', fundo: FUNDO.hub, x: [[0.17, 106], [0.2, 30]], y: 200, w: [[0.17, 592 * 1.5], [0.2, 592 * 1.12]], h: [[0.17, 282 * 1.5], [0.2, 282 * 1.12]], cx: 48, cy: 172, z: [[0.17, 1.5], [0.2, 1.12]], o: [[0, 1], [0.245, 1], [0.27, 0]],
      camadas: FILA.map(([n, o]) => ({ a: `hub-fila-${n}`, o })),
      marcas: [realce(LINHA, fade(0.035, 0.05, 0.25, 0.265)), toque(NOME, 0.042)] },
    { id: 'hub-painel', tema: 'hub', fundo: FUNDO.hub, x: [[0.17, 730], [0.2, 700]], y: 200, w: 278 * 1.4, h: 222 * 1.4, cx: 1162, cy: 348, z: 1.4, o: fade(0.17, 0.2, 0.245, 0.27),
      camadas: [{ a: 'hub-painel-02a' }],
      marcas: [realce(BOTAO_ABRIR, fade(0.2, 0.21, 0.235, 0.245)), toque(BOTAO_ABRIR_C, 0.212)] },
    { id: 'viewer', tema: 'viewer', fundo: FUNDO.viewer,
      x: [[0.235, D_BOTAO.x], [0.275, 172.5], [0.68, 172.5], [0.7, 30], [0.775, 30], [0.79, 110]],
      y: [[0.235, D_BOTAO.y], [0.275, 18], [0.68, 18], [0.7, 96], [0.775, 96], [0.79, 18]],
      w: [[0.235, D_BOTAO.w], [0.275, 755], [0.68, 755], [0.7, 600], [0.775, 600], [0.79, 422]],
      h: [[0.235, D_BOTAO.h], [0.275, 764], [0.68, 764], [0.7, 608], [0.775, 608], [0.79, 764]],
      z: [[0.235, D_BOTAO.w / 755], [0.275, 1], [0.3, 1], [0.33, 1.95], [0.425, 1.95], [0.445, 1], [0.6069, 1], [0.607, 1.95], [0.68, 1.95], [0.7, 1.6], [0.775, 1.6], [0.79, 1.144]],
      cx: [[0.3, 0], [0.33, -5.6], [0.425, -5.6], [0.445, 0], [0.6069, 0], [0.607, -5.6], [0.68, -5.6], [0.7, 0.5], [0.775, 0.5], [0.79, 381]],
      cy: [[0.3, 0], [0.33, -5], [0.425, -5], [0.445, 0], [0.6069, 0], [0.607, -5], [0.68, -5], [0.7, 1], [0.775, 1], [0.79, 74]],
      o: [[0.2349, 0], [0.235, 1], [0.845, 1], [0.855, 0.25], [0.876, 0.25], [0.885, 0]],
      camadas: [{ a: 'viewer-area-02c', o: [[0.235, 1], [0.335, 1], [0.3351, 0]] }],
      seqs: seqViewer(), marcas: marcasViewer() },
    { id: 'painel-direito', tema: 'viewer', fundo: FUNDO.painel, x: [[0.69, 700], [0.71, 660]], y: 64, w: 407 * 1.05, h: 640 * 1.05, cx: 0, cy: 0, z: 1.05,
      o: [[0.69, 0], [0.71, 1], [0.845, 1], [0.855, 0.25], [0.876, 0.25], [0.885, 0]],
      camadas: [{ a: 'viewer-medicoes-05f', o: [[0, 1], [0.81, 1], [0.816, 0]] }, { a: 'viewer-galeria-06d', o: [[0.81, 0], [0.816, 1]] }],
      marcas: [realce([20, 92, 367, 88], fade(0.71, 0.72, 0.8, 0.81)), realce([14, 10, 280, 44], fade(0.82, 0.83, 0.85, 0.855)), toque([203, 612], 0.842)] },
    // a prévia "abre" a partir do botão Visualizar relatório (placa opaca crescendo; nunca translúcida sobre outra imagem)
    { id: 'previa', tema: 'viewer', fundo: FUNDO.previa, x: [[0.855, D_VIS.x], [0.872, 150]], y: [[0.855, D_VIS.y], [0.872, 68]], w: [[0.855, D_VIS.w], [0.872, 800]], h: [[0.855, D_VIS.h], [0.872, 531 * 1.25]],
      cx: 0, cy: 0, z: [[0.855, D_VIS.w / 640], [0.872, 1.25]], o: [[0.8549, 0], [0.855, 1], [0.888, 1], [0.9, 0]],
      camadas: [{ a: 'viewer-previa-06f' }] },
    { id: 'status', tema: 'viewer', fundo: FUNDO.status, x: 150, y: 700, w: 800, h: 33 * 1.6, cx: 0, cy: 0, z: 1.6, raio: 6, o: fade(0.898, 0.906, 0.925, 0.935),
      camadas: [{ a: 'viewer-status-07c' }] },
    { id: 'hub-volta', tema: 'hub', fundo: FUNDO.hub, x: (1100 - 592 * 1.5) / 2, y: 190, w: 592 * 1.5, h: 282 * 1.5, cx: 48, cy: 172, z: 1.5, o: [[0.918, 0], [0.94, 1]],
      camadas: [{ a: 'hub-fila-07a' }],
      marcas: [realce(CELULA_ETAPA, [[0.945, 0], [0.96, 1]])] },
  ],
};

// ------------------------------------------------------------------ celular (palco 360 × 600)
const M_BOTAO = { x: 13 + 14 * 1.2, y: 170 + 180 * 1.2, w: 248 * 1.2, h: 38 * 1.2 };
const M_AX = { z: 0.95, cx: 0.6, cy: 0.5 }, M_TUDO = { z: 356 / 755, cx: 0, cy: 0 };
const M_VIS = { x: 5 + 12 * 0.9, y: 13 + 594 * 0.9, w: 365 * 0.9, h: 32 * 0.9 };
const celular = {
  W: 360, H: 600,
  placas: [
    { id: 'hub-linha', tema: 'hub', fundo: FUNDO.hub, x: 0, y: [[0.17, 200], [0.2, 40]], w: 360, h: 92 * 0.9, cx: [[0.065, 48], [0.095, 240]], cy: 262, z: 0.9, o: [[0, 1], [0.245, 1], [0.27, 0]],
      camadas: FILA.map(([n, o]) => ({ a: `hub-linha-${n}`, o })),
      marcas: [realce(LINHA, fade(0.035, 0.05, 0.25, 0.265)), toque(NOME, 0.042)] },
    { id: 'hub-painel', tema: 'hub', fundo: FUNDO.hub, x: [[0.17, 40], [0.2, 13]], y: 170, w: 278 * 1.2, h: 222 * 1.2, cx: 1162, cy: 348, z: 1.2, o: fade(0.17, 0.2, 0.245, 0.27),
      camadas: [{ a: 'hub-painel-02a' }],
      marcas: [realce(BOTAO_ABRIR, fade(0.2, 0.21, 0.235, 0.245)), toque(BOTAO_ABRIR_C, 0.212)] },
    { id: 'viewer', tema: 'viewer', fundo: FUNDO.viewer,
      x: [[0.235, M_BOTAO.x], [0.275, 2], [0.775, 2], [0.79, 20]],
      y: [[0.235, M_BOTAO.y], [0.275, 119], [0.775, 119], [0.79, 10]],
      w: [[0.235, M_BOTAO.w], [0.275, 356], [0.775, 356], [0.79, 320]],
      h: [[0.235, M_BOTAO.h], [0.275, 362], [0.775, 362], [0.79, 580]],
      z: [[0.235, M_BOTAO.w / 374.7], [0.275, M_AX.z], [0.425, M_AX.z], [0.445, M_TUDO.z], [0.556, M_TUDO.z], [0.572, 0.8], [0.6069, 0.8], [0.607, M_AX.z], [0.775, M_AX.z], [0.79, 0.868]],
      cx: [[0.275, M_AX.cx], [0.425, M_AX.cx], [0.445, 0], [0.556, 0], [0.572, 154.5], [0.6069, 154.5], [0.607, M_AX.cx], [0.775, M_AX.cx], [0.79, 381]],
      cy: [[0.275, M_AX.cy], [0.425, M_AX.cy], [0.445, 0], [0.556, 0], [0.572, 311.5], [0.6069, 311.5], [0.607, M_AX.cy], [0.775, M_AX.cy], [0.79, 74]],
      o: [[0.2349, 0], [0.235, 1], [0.685, 1], [0.695, 0], [0.735, 0], [0.745, 1], [0.805, 1], [0.812, 0]],
      camadas: [{ a: 'viewer-area-02c', o: [[0.235, 1], [0.335, 1], [0.3351, 0]] }],
      seqs: seqViewer(), marcas: marcasViewer() },
    { id: 'medicoes', tema: 'viewer', fundo: FUNDO.painel, x: 5, y: 25, w: 407 * 0.86, h: 640 * 0.86, cx: 0, cy: 0, z: 0.86, o: fade(0.69, 0.705, 0.725, 0.735),
      camadas: [{ a: 'viewer-medicoes-05f' }], marcas: [realce([20, 92, 367, 88], fade(0.705, 0.712, 0.72, 0.728))] },
    { id: 'galeria', tema: 'viewer', fundo: FUNDO.painel, x: 5, y: 13, w: 389 * 0.9, h: 638 * 0.9, cx: 0, cy: 0, z: 0.9, o: [[0.812, 0], [0.822, 1], [0.845, 1], [0.855, 0.25], [0.876, 0.25], [0.885, 0]],
      camadas: [{ a: 'viewer-galeria-06e' }], marcas: [realce([8, 8, 272, 44], fade(0.822, 0.832, 0.85, 0.855)), toque([194, 610], 0.842)] },
    { id: 'previa', tema: 'viewer', fundo: FUNDO.previa, x: [[0.855, M_VIS.x], [0.872, 1]], y: [[0.855, M_VIS.y], [0.872, 151]], w: [[0.855, M_VIS.w], [0.872, 358]], h: [[0.855, M_VIS.h], [0.872, 531 * (358 / 640)]],
      cx: 0, cy: 0, z: [[0.855, M_VIS.w / 640], [0.872, 358 / 640]], o: [[0.8549, 0], [0.855, 1], [0.888, 1], [0.9, 0]],
      camadas: [{ a: 'viewer-previa-06f' }] },
    { id: 'status', tema: 'viewer', fundo: FUNDO.status, x: 5, y: 470, w: 350, h: 33 * 0.7, cx: 0, cy: 0, z: 0.7, raio: 4, o: fade(0.898, 0.906, 0.925, 0.935),
      camadas: [{ a: 'viewer-status-07c' }] },
    { id: 'hub-volta', tema: 'hub', fundo: FUNDO.hub, x: 0, y: 258, w: 360, h: 92 * 0.9, cx: 240, cy: 262, z: 0.9, o: [[0.918, 0], [0.94, 1]],
      camadas: [{ a: 'hub-linha-07a' }], marcas: [realce(CELULA_ETAPA, [[0.945, 0], [0.96, 1]])] },
  ],
};

export default { versao: '0.1.0-draft', etapas, layouts: { desktop, celular } };
