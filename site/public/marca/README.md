# Identidade canônica ARARAT — cópias para o site (experimento `experiment/brand-canonical-v1`)

Arquivos copiados **sem alteração** dos pacotes canônicos em `C:\ARARAT-Website\canonical`
(originais preservados lá). Tamanhos e SHA-256 em `MANIFESTO.json`; conferência:
`node tests/marca-integridade.mjs` (com `BASE=…` confere também os bytes servidos).

| Pasta | Pacote | Status de aprovação |
|---|---|---|
| `fase1-v1.0.1/` | Phase 1 v1.0.1 — lockup horizontal negativo da masterbrand; favicon de 16 px (SVG e PNG) | aprovada |
| `fase2a-v1.1.1/fontes/` | Phase 2A v1.1.1 — Lora[wght].ttf e Inter[opsz,wght].ttf (binários oficiais) + licenças OFL | aprovada |
| `fase2b-v1.2.1/icones/` | Phase 2B v1.2.1 — ícones `radiomic-extraction`, `segmentation`, `clinical-review` (variante principal, 24 px) | **aguardando aprovação humana** |

- As fontes não foram convertidas para WOFF2 nem reduzidas a subconjunto: a licença da Lora tem
  *Reserved Font Name* ("Lora"), e uma versão modificada precisaria de outro nome. As licenças OFL
  acompanham os binários nesta pasta.
- O wordmark ARARAT é sempre o SVG em curvas; nunca é tipografado em Lora.
- Nada aqui autoriza mudanças em Viewer, Hub, modelos, relatórios clínicos ou outros repositórios,
  nem constitui aprovação clínica ou aprovação final desta alternativa visual.
