# ARARAT Sinal no site — terceira alternativa visual (`experiment/brand-sinal-v1`)

**Data:** 08/10/2026 · **Base funcional:** `3d55f7c963172a337f56ac9cb36f96506b4e0f15` (a mesma das outras alternativas)
**Situação:** implementação concluída e verificada tecnicamente. **Não houve aprovação estética, clínica ou
de marca.** O brand system Sinal v1.0 também ainda não foi validado com radiologistas, e a busca de
anterioridade do símbolo no INPI está pendente (`00_LEIAME.md`).

## 1. As três alternativas (mesma base, só a identidade muda)

| Alternativa | Branch | Commit de referência | Porta local |
|---|---|---|---|
| Atual | `main` | `3d55f7c963172a337f56ac9cb36f96506b4e0f15` | 3000 |
| Canônica (Fases 1/2A/2B) | `experiment/brand-canonical-v1` | `89468c171ec78f5052455f5be8ebdb8585657684` | 3010 |
| Sinal | `experiment/brand-sinal-v1` | ver `git log` da branch (commits listados na entrega) | 3020 |

`experiment/brand-canonical-motion-v1` (Motion) e as demais branches não foram tocadas.

## 2. Fontes lidas

- Brand book "ARARAT Sinal" (Design System no claude.ai, `README.md`: regras, voz, logo, cor, tipografia,
  linguagem gráfica, imagem, motion, iconografia, acessibilidade).
- Pacote local `C:\ARARAT-Website\brand-system-sinal\ARARAT_Sinal_Brand_System_v1.0`. A pasta é idêntica ao zip
  (123 arquivos; zip SHA-256 `8c6caf542ca414dfb299148b43201fe70227247a83c001601c4213344370190d`). Foram lidos
  `00_LEIAME.md`, `02_tokens` (CSS/JSON, `contraste.md`, `lint-sinal.mjs`), `01_logo/construcao.json` e os
  SVGs, `03_icones/README.md`, `05_fotografia/README.md`, `06_motion` (janelamento) e `07_aplicacoes`
  (mockups: só referência visual, não evidência de funcionalidade).

## 3. Ativos públicos usados — inventário

16 arquivos copiados **byte a byte** para `site/public/marca-sinal/v1.0/`. Origem, uso, tamanho e SHA-256 de
cada um estão em `MANIFESTO.json`; a conferência roda com `node tests/sinal-integridade.mjs` (16/16, também os
bytes servidos).

| Grupo | Arquivos | Uso |
|---|---|---|
| Logo | `ararat-lockup-horizontal-compacto-escuro.svg` · `ararat-lockup-horizontal-escuro.svg` | cabeçalho (compacto, 28 px; 24 px ≤ 400 px) · rodapé (full, 48 px; 40 px ≤ 380 px) |
| Favicon | `favicon.ico`, `ararat-favicon-16.svg`, `ararat-favicon-32.svg`, `ararat-app-icon-180px.png`, `ararat-app-icon-512px.png` | ícones da página (`/`, `/pt`, `/previa/refinada`) |
| Fontes | `Geist-Variable.woff2`, `GeistMono-Regular.woff2`, `GeistMono-Medium.woff2`, `Geist-OFL.txt` | Geist 400/500/600 · Geist Mono 400/500 |
| Ícones | `extracao-radiomica`, `segmentacao`, `revisao-clinica` | blocos da Ciência, em `currentColor` (máscara do SVG sem alteração) |
| Grafismos | `histograma-claro.svg`, `voxels-escuro.svg` | Ciência (rotulado "grafismo conceitual · não representa dados de pacientes") · faixa decorativa na base do Contato |

**Não usados:** Geist Pixel Square (é opcional), ícones de modelo, análise e SHAP/XAI (não correspondem
ao que a demonstração oferece), lockups de produto (a masterbrand aparece uma vez por tela), mockups de
`07_aplicacoes`. As quatro fotos de `05_fotografia` **não estão no pacote**: não foram tratadas como
entregues e nenhum substituto foi gerado.

## 4. Decisões

**Escopo.** Toda a camada nova fica sob `[data-marca="sinal"]` e está em
`components/preview/proposta/marca-sinal.css`, `components/marca/LogoSinal.*` e `lib/marca-sinal.ts`. Ela só
entra na refinada (`/`, `/pt`, `/previa/refinada`). As rotas de comparação (`/previa`, `/previa/a`,
`/previa/b`, `/previa/original`) continuam com a aparência anterior. Conteúdo, funcionalidades, demos,
idiomas e seletor estão preservados.

**Cor.** Somente tokens oficiais. Seções escuras usam `bg #111111`, superfícies `#1B1B1B`/`#303030`, títulos
`#E2E2E2`, corpo `#C6C6C6` e secundário `#919191`. Fios: `#303030` decorativo, `#777777` essencial. Foco
`#E2E2E2`, 2 px. A ação primária usa `#E2E2E2` sobre `#111111`. O tema claro editorial (Ciência e Time) usa
`gray-97 #F6F6F6`, texto `#111111`, corpo `#303030`, secundário `#5E5E5E` e superfície elevada `#EDEDED`.
Não há navy, ouro, cobre, sage, degradês decorativos nem sombras: separação por superfícies e fios de 1 px.
O destaque do título da Plataforma e a 2ª frase do hero usam o tom secundário, e não uma cor.

**Tipografia.** Geist 500 em títulos (tracking negativo), 400 no corpo, 500/600 na interface. Geist Mono 500
em rótulos técnicos (11–12 px, caixa alta, 0,14 em) e Mono tabular em números e etapas. Reserva métrica
calibrada com fontTools (Geist ↔ Arial/Liberation Sans; Mono ↔ Courier/Liberation Mono). CLS medido ≤ 0,002.

**Logo.** SVGs oficiais, nunca redigitados; o afastamento símbolo ↔ nome é o do arquivo. Abaixo de 40 px
entra o lockup compacto (cabeçalho); com 40 px ou mais, o full (rodapé). A proporção do arquivo é conferida
por teste em todas as telas. Área de proteção: 2× o diâmetro do ponto (padding). Nada de gradiente,
sombra, brilho, ponto deslocado ou deformação. O ciclo MODEL/PROSTATE sai.

**Primeira dobra.** Composição editorial alinhada à esquerda: eyebrow mono, a mensagem do Sinal em três
linhas (a 2ª em tom secundário), a descrição factual existente sem alteração, as mesmas duas ações e o
estado "Plataforma em validação científica" em mono. A arte continua no slot da base (terreno do Motion).
- PT: "Contraste é informação. Nós medimos. Você decide." (frase do brand system).
- EN: "Contrast is information. We measure. You decide." — **adaptação editorial**, registrada em
  `lib/locales/en.json`.
- Não entraram: score 0,612, contribuições +0,28 etc., a frase sobre características que pesam no score,
  IDs, W/L ou números decorativos.

**Capturas, RM e Time.**
- Capturas reais do Hub e do Viewer: intactas, com cores clínicas e aparência original. Mudaram só a
  moldura (fio), os marcadores numerados (mono sobre `#E2E2E2`), as legendas e o fundo visto durante o
  carregamento.
- Imagens médicas: nenhum filtro, símbolo ou ponto dentro do viewport. Os avisos continuam.
- Time: cinco pessoas reais, mesma ordem, nomes e biografias. Os retratos estão em P&B por CSS
  (`filter: grayscale(1)`). É reversível: os originais estão intactos e a identidade facial também.

**Grafismos.** Histograma e voxels são conceituais, sempre rotulados ou decorativos e nunca sob texto (a
faixa de voxels tem espaço próprio). Não são apresentados como resultado do caso mostrado.

## 5. Exceções explícitas dos tokens (o kit original não foi reescrito)

1. `surface` do tema claro `#FFFFFF`: não é usado; superfícies claras institucionais em `gray-97` / `#EDEDED`.
2. `signal` (`#FFFFFF`/`#000000`): reservado ao ponto, que só existe dentro dos SVGs oficiais do logo e do
   favicon; não aparece no CSS do site.
3. `viewport canvas #000000` e as cores clínicas: só existem **dentro** das capturas e da RM originais.
4. Linhas desenhadas com `linear-gradient` de cor única (cantos do quadro da Jornada, régua): são técnica
   de traço de 1 px, não degradê.
5. O contêiner `.ararat-journey` do pacote do Motion recebe só o fundo `#111111` por CSS do Site, e a
   escultura recebe `coverColor: "#111111"` (parâmetro existente da API). O desenho dos módulos não muda.

## 6. Verificação (build de produção da branch)

| Conferência | Resultado |
|---|---|
| `npm run typecheck` / `npm run build` | sem erros |
| `tests/sinal-integridade.mjs` | 16/16 arquivos oficiais íntegros, também os bytes servidos |
| `tests/sinal-layout.mjs` (EN+PT × 320, 390, 768, 1280, 1440, 1920, 2560 + 1280×600 e 390×640) | 18/18: sem rolagem lateral, Geist/Geist Mono reais, só Geist 400/500/600 · Mono 400/500, lockup compacto < 40 px e full ≥ 40 px sem corte nem deformação, favicon, mensagem, CLS ≤ 0,002, sem erros de console |
| `tests/sinal-contraste.mjs` (todo texto visível, `<details>` abertos, EN+PT × 7 larguras) | 0 reprovados; menor razão 5,47:1 |
| `tests/sinal-cores.mjs` (cores computadas fora de imagens/canvas) | 0 cores com matiz na camada do Site; 5 no desenho do Motion (pendente, ver §7) |
| `lint-sinal.mjs` sobre a camada Sinal | ✓ regras ok |
| `lint-sinal.mjs` sobre o site inteiro | 99 achados, todos nos arquivos das versões antigas (`styles/tokens.css`, módulos e rotas de comparação). Na refinada eles são sobrepostos pela camada Sinal (a busca na interface renderizada confirma). As cores antigas **não** foram removidas |
| Foco por teclado | contorno de 2 px `#E2E2E2` em todos os controles do cabeçalho e do hero (capturas `foco-*.png`) |
| `tests/locales.mjs` | 6/6 |
| `tests/plataforma-fluxo.mjs` (incl. 404 do módulo, asset ausente, atraso) | 10/10 |
| `tests/navegacao.mjs` | 17/17 |
| `tests/e2e.mjs` | 29/29 (igual à main) |
| `tests/previa.mjs` | 46/48 — as **mesmas 2 falhas da main** (preexistentes) |
| `tests/refinada.mjs` | rodada completa: 38/40. As 2 falhas foram a tagline do rodapé (corrigida de 11 para 12 px e reconferida no grupo cabeçalho/rodapé, 7/7) e o Time (abaixo) |

**Falhas preexistentes × regressões**
- Preexistentes (falham igual na main): `previa.mjs` "home aprovada em / intacta" e "versão e origem…".
  A "luz ambiente da montanha" (`refinada.mjs`) é intermitente e já falhou na main.
- Regressão encontrada e corrigida: o contraste do título das etapas inativas da Jornada (2,6:1 → ≈ 4,4:1).
- Regressão encontrada e corrigida: o lockup do rodapé estava achatado por um seletor genérico.
- Regressão encontrada e corrigida: a tagline do rodapé estava com 11 px.
- **Regressão aberta:** "Time [módulo real] seleções rápidas … enquadramento idêntico à foto estática" reprova
  com 7,5 % dos canais diferentes (limite 0,1 %, mantido). A diferença é de bordas (meio pixel) entre o
  quadro final do módulo e a foto estática. Não depende do P&B (reprova igual sem o filtro) e reprova
  também na alternativa canônica. Na main passa, mas reprova se a seção for deslocada 0,2 px. Foi
  encaminhada ao Motion: alinhar o quadro final ao pixel no módulo do Time.

Os 52 pares do kit não substituem estas medições: todos os números acima foram medidos no site renderizado.

## 7. Pendências

1. **Pacotes do Motion (Sinal):** ainda não existe `motion/brand-sinal-v1/` nem a branch
   `experiment/brand-sinal-motion-v1`, então **nenhum pacote novo foi integrado**. Os pacotes atuais
   (montanha 0.7.0-draft, topo-revisao 0.3.0, plataforma-fluxo 0.1.0, time-interativo 0.2.0) seguem em uso,
   íntegros e sem alteração, e são o fallback. Por isso ainda aparecem: arco e luz dourados do hero,
   contornos dourados e vinheta navy na Jornada, traço dourado e linhas azuladas no fechamento da Ciência,
   realces dourados no fluxo Hub → Viewer e pontos navy na transição do Time. Briefing com medidas,
   fundos, áreas de texto e contratos: `MOTION-SINAL-BRIEF.md`.
2. Fotos P&B de `05_fotografia`: ausentes no pacote.
3. Sinal v1.0: validação com radiologistas e busca de anterioridade no INPI.
4. Teste do Time (§6).
5. Worktree `C:\mvp_ararat_brand_sinal_site`, push e Preview na Vercel: dependem do Git deste computador.

## 8. Distinção explícita

- **Implementação concluída:** a identidade Sinal está aplicada, medida e versionada na branch, sem merge.
- **Aprovação estética: não houve.** Também não houve aprovação clínica, regulatória ou de marca. A escolha
  entre as três identidades fica para depois da comparação.
