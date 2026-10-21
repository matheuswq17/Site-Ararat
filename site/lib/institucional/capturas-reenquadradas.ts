/**
 * Metadados de layout da versão institucional anterior. Preservam as dimensões documentadas sem depender
 * de arquivos da revisão privada. As imagens não acompanham este módulo e continuam bloqueadas no público.
 */
const REENQ = {
  arquivos: {
    "hub-caso-revisao-pendente": {
      fonte: "capturas/07a_hub_estado_real_da_revisao.png", medica: false,
      arquivo: { src: "/institucional/capturas-v1/hub-caso-revisao-pendente-900.webp", w: 900, h: 96 },
    },
    "hub-etapa-revisao-pendente": {
      fonte: "capturas/07a_hub_estado_real_da_revisao.png", medica: false,
      arquivo: { src: "/institucional/capturas-v1/hub-etapa-revisao-pendente-220.webp", w: 220, h: 96 },
    },
    "viewer-visualizar-relatorio": {
      fonte: "capturas/06e_painel_imagens_do_relatorio.png", medica: false,
      arquivo: { src: "/institucional/capturas-v1/viewer-visualizar-relatorio-778.webp", w: 778, h: 184 },
    },
    "viewer-medida-m1": {
      fonte: "capturas/05e_axial_com_regua.png", medica: true,
      arquivo: { src: "/institucional/capturas-v1/viewer-medida-m1-404.webp", w: 404, h: 108 },
    },
  },
} as const;

export default REENQ;
