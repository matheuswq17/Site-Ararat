# ARARAT Sinal no site — terceira alternativa visual (`experiment/brand-sinal-v1`)

**Data:** 08/10/2026 · **Base funcional:** `3d55f7c963172a337f56ac9cb36f96506b4e0f15` (a mesma das outras alternativas)
**Situação:** implementação concluída, pacotes reais do Motion integrados (`99c91c8`) e verificada tecnicamente. **Não houve aprovação estética, clínica ou
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
O mesmo vale agora para o desenho do Motion (§4A).
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
- Time: cinco pessoas reais, mesma ordem, nomes e biografias. Os retratos aparecem em P&B só na exibição
  (`grayscale(1) contrast(1.04)`), sem filtro duplicado (§4A). É reversível: os arquivos dos retratos são
  byte a byte os do 0.2.0, e a identidade facial está intacta.

**Grafismos.** Histograma e voxels são conceituais, sempre rotulados ou decorativos e nunca sob texto (a
faixa de voxels tem espaço próprio). Não são apresentados como resultado do caso mostrado.

## 4A. Integração dos pacotes do Motion (Sinal)

**Origem.** Branch `experiment/brand-sinal-motion-v1`, commit `99c91c8`, pasta `motion/brand-sinal-v1/`,
contrato `CONTRATO-SITE.md`. Os arquivos foram extraídos com `git archive 99c91c8` (conteúdo dos blobs, LF).
Um tar da pasta do worktree do Motion **não** confere no Windows: o checkout converte texto para CRLF
(`* text=auto`), e a licença OFL, por exemplo, muda de hash. Por isso as pastas novas entraram no
`.gitattributes` com `-text` (como `marca-sinal`), e os bytes no repositório ficam iguais aos do manifesto.

| Pacote | Pasta no Site | Arquivos | `sync-manifest --check` |
|---|---|---|---|
| montanha 0.9.0-sinal (inclui jornada 0.4.2-sinal) | `public/previa/home-montanha-0.9.0-sinal/` | 71 | ok |
| topo-revisao 0.5.0-sinal (entradas clara e `-escuro`) | `public/refinada/topo-revisao-0.5.0-sinal/` | 5 | ok |
| time-interativo 0.4.0-sinal | `public/refinada/time-interativo-0.4.0-sinal/` | 12 | ok |
| plataforma-fluxo 0.3.0-sinal (assets continuam do 0.1.0) | `public/refinada/plataforma-fluxo-0.3.0-sinal/` | 1 | ok |

Os pacotes anteriores (0.7.0-draft, topo-revisao 0.3.0, time-interativo 0.2.0, plataforma-fluxo 0.1.0 e os
mais antigos) seguem no lugar, sem alteração. As rotas de comparação continuam usando-os.

**Apontamentos (`lib/`).** Aplicados conforme `integracao/exemplo-site.diff`: `home-preview.ts`
(`REFINADA_PACKAGE` → 0.9.0-sinal), `topo-paisagens.ts` (`paisagem050sinal`, padrão `0.5.0-sinal`),
`time-retrato.ts` (0.4.0-sinal), `plataforma-fluxo.ts` (`MODULO_FLUXO_PADRAO` = 0.3.0-sinal, assets do 0.1.0).

**Adaptações externas aos módulos (feitas no Site).**
- **Explicabilidade.** A RM e o recorte dourado vinham de filtros SVG no próprio Site (`ExplainMri`,
  `JourneyMriScene`). Um contexto novo (`lib/marca-tema.tsx`, `MarcaTemaProvider`) entrega as matrizes por
  tema. Só a refinada recebe `sinal`. No tema sinal, o contorno da região sai em `gray-90` e a "escala de
  cor" vira **curvas de mesma intensidade** (cinza → desfoque → 6 níveis discretos → borda). A RM de base
  não recebe filtro. No tema base, as matrizes douradas antigas ficam iguais.
- **Textos EN/PT.** "em dourado" → "em destaque" e "numa escala de cor" → "em curvas de mesma intensidade"
  (`ExplainabilityRefinada.tsx`). As chaves EN foram atualizadas (`en.json`) e há um padrão novo em
  `i18n.tsx` ("Grayscale values traced as lines of equal intensity, for comparison.").
- **Fallbacks.** Os do contrato continuam: 404 do módulo ou dos assets, movimento reduzido, pausa e aba
  oculta resultam em quadro final estático coerente. Isso vale também para o SVG estático do fechamento e para
  os posters da montanha (todos do pacote). Conferidos pelos verificadores do Motion e por `plataforma-fluxo.mjs`.
- **Peso da frase final (Ciência).** O módulo pinta as frases 1–3 em `#474747` e a 4ª em `#111111` a 600. O
  CSS do Site foi combinado com esses valores (frases `gray-30` a 500, decisão a 600 fixo, sem reflow) em vez
  de sobrepor cores.
- **P&B do Time sem filtro duplicado.** O módulo aplica `cor: 'mono'` (`grayscale(1) contrast(1.04)`) em
  `img.rp-foto`. O CSS do Site deixou de filtrar `[data-shown]` e as imagens inline e agora cobre só as
  imagens que o módulo não controla (`#time img:not(.rp-foto)`, ex.: acordeão do celular), com o mesmo
  filtro. Conferido pelo verificador do Time: um único filtro por imagem.
- **Luz ambiente.** O contrato muda o padrão para `ambient: false` ("em repouso nada se redesenha"). O Site
  não liga a luz.
- **Logo "ponto acende".** Não foi adotado no cabeçalho: o logo segue `<img>` do SVG oficial, com o ponto sempre
  aceso (quadro final válido do janelamento).

## 5. Exceções explícitas dos tokens (o kit original não foi reescrito)

1. `surface` do tema claro `#FFFFFF`: não é usado; superfícies claras institucionais em `gray-97` / `#EDEDED`.
2. `signal` (`#FFFFFF`/`#000000`): reservado ao ponto, que só existe dentro dos SVGs oficiais do logo e do
   favicon; não aparece no CSS do site.
3. `viewport canvas #000000` e as cores clínicas: só existem **dentro** das capturas e da RM originais.
4. Linhas desenhadas com `linear-gradient` de cor única (cantos do quadro da Jornada, régua): são técnica
   de traço de 1 px, não degradê.
5. O contêiner `.ararat-journey` do pacote do Motion recebe só o fundo `#111111` por CSS do Site, e a
   escultura recebe `coverColor: "#111111"` (parâmetro existente da API). O desenho dos módulos não muda.
6. Dados embutidos nos pacotes do Motion (§4A): `topo-revisao.js` mantém as coreografias antigas com ouro
   (só as entradas `-sinal` são usadas), e `plataforma-fluxo.js` mantém os fundos das placas das capturas
   (`#F6F4EF`, `#081316` etc.). O `lint-sinal` acusa esses literais; a varredura das cores renderizadas
   não encontra nenhuma com matiz. Os pacotes não foram editados, porque os hashes são do Motion.

## 6. Verificação (página integrada, pacotes `99c91c8`)

| Conferência | Resultado |
|---|---|
| `npm run typecheck` / `npm run build` | sem erros |
| `sync-manifest.mjs --check` nos 4 pacotes copiados | ok (tamanho + SHA-256 de cada arquivo) |
| `tests/sinal-integridade.mjs` | 16/16 arquivos oficiais íntegros, também os bytes servidos |
| `tests/sinal-layout.mjs` (EN+PT × 320, 390, 768, 1280, 1440, 1920, 2560 + 1280×600 e 390×640) | ok: sem rolagem lateral, Geist/Geist Mono reais, lockups sem corte nem deformação, favicon, mensagem, CLS ≤ 0,002, sem erros de console |
| `tests/sinal-contraste.mjs` (todo texto visível, EN+PT × 7 larguras) | 0 reprovados |
| `tests/sinal-cores.mjs` (cores computadas fora de imagens/canvas) | **0** cores com matiz na camada do Site **e 0 no desenho do Motion** (antes: 5) |
| `lint-sinal.mjs` sobre a camada Sinal (incl. `marca-tema.tsx`) | ✓ regras ok |
| `lint-sinal.mjs` sobre os pacotes | acusa só dados embutidos (§5, item 6) |
| Verificador do Motion `ciencia/scripts/verificar.mjs` contra a página integrada | 54/54 |
| Verificador do Motion `time/scripts/verificar.mjs` | 20/20 (inclui pontos `#303030`, 1 filtro P&B, retratos = 0.2.0) |
| Verificador do Motion `fluxo/scripts/verificar.mjs` | 28/28 (capturas servidas = 0.1.0, 114 arquivos por SHA-256) |
| `tests/locales.mjs` | 6/6 |
| `tests/plataforma-fluxo.mjs` (404 do módulo, asset ausente, atraso) | 10/10 |
| `tests/navegacao.mjs` | 17/17 |
| `tests/e2e.mjs` | 29/29 (igual à main) |
| `tests/previa.mjs` | 46/48 — as **mesmas 2 falhas da main** |
| `tests/refinada.mjs` | 38/40 (detalhe abaixo) |

O verificador da montanha (`montanha/scripts/verify.mjs`) testa o pacote isolado, no servidor do próprio Motion.
No Site, a montanha integrada é coberta por `refinada.mjs` (repouso, abertura, pausa, aba oculta, passagem
e resize).

**Testes ajustados ao contrato novo (sem relaxar limites).**
- `refinada.mjs`: os dois testes de luz ambiente foram trocados pelos equivalentes do contrato 0.9.0-sinal.
  Em repouso, sem luz ambiente: duas capturas do slot com 1,5 s de intervalo são idênticas, e pausa, aba oculta e
  passagem continuam desligadas. A abertura assenta sem ligar a luz, e o resize iguala uma página nova. Também mudaram
  a cor esperada das frases da Ciência (`#474747`) e os caminhos do pacote/retratos (regex `[\w.-]+`).
- `locales.mjs`: versões esperadas `0.9.0-sinal` / `0.3.0-sinal` e rota do retrato do Victor no 0.4.0-sinal.
- `plataforma-fluxo.mjs`: aceita módulo 0.3.0-sinal com assets do 0.1.0.

**Falhas preexistentes × regressões**
- **Preexistentes** (falham igual na main): `previa.mjs` "home aprovada em / intacta" e "versão e origem…".
- **Regressões corrigidas** (rodada anterior): contraste das etapas inativas da Jornada, lockup do rodapé
  achatado, tagline do rodapé com 11 px.
- **Regressão aberta 1 — Time · enquadramento final** ("seleções rápidas … enquadramento idêntico à foto
  estática", limite 0,1 % **mantido**). Investigação:
  - O teste compara duas cargas da página: modo normal (quadro final do módulo) e modo reduzido (foto estática).
    A posição y do retrato no documento tem parte fracionária diferente entre os modos, porque a altura do hero/Jornada muda
    com o modo. Sinal: 0,266 × 0,938 px. Canônica: 0,219 × 0,594. Main: 0,156 × 0,375 — na main as duas
    frações ficam abaixo de 0,5 e arredondam igual, **e por isso ela passa por coincidência**.
  - Alinhando B à mesma fase de A, a diferença cai de 7,6 % para 1,66 %. Alinhando as duas a 0, cai para 0,015 %,
    mas aí a altura renderizada fica 550 × 551.
  - Conclusão: é reamostragem subpixel entre duas cargas, e o conteúdo é o mesmo. Não depende do P&B. Não é
    defeito visível, mas o teste está certo em exigir o mesmo quadro.
  - Correção proposta, sem mexer no limite: alinhar ao pixel o quadro final no módulo (Motion), ou fixar a fase
    da coluna do retrato no Site. Não foi implementada nesta integração.
- **Regressão aberta 2 — Ciência · continuação** ("a montanha continua mudando a cada etapa"). O teste pede
  mudança > 0,05 % da imagem em ≥ 6 de 8 passos. A main muda 0,12–0,55 % por passo, e a Sinal muda 0,02–0,34 %
  (os três primeiros: 0,02 %, 0,02 % e 0,05 %). Causa: a coreografia 0.5.0-sinal desenha a crista inteira desde
  e = 0 (não há mais a luz dourada percorrendo), e só o arco cresce. É escolha de coreografia do Motion. O
  verificador dele aprova (54/54), mas o teste do Site não foi afrouxado. **Encaminhada ao Motion.**

Os 52 pares do kit não substituem estas medições: todos os números acima foram medidos no site renderizado.

**Gravações e capturas.** `sinal-integrada-1440-rolagem-e-time.webm` e `sinal-integrada-390-rolagem-e-time.webm`
(rolagem completa + trocas no Time). Ficam fora do repositório, como as anteriores.

## 7. Pendências

1. Motion: as duas regressões abertas (§6).
2. Fotos P&B de `05_fotografia`: ausentes no pacote.
3. Sinal v1.0: validação com radiologistas e busca de anterioridade no INPI.
4. Push da branch (feito do Windows) e Preview na Vercel (Root Directory `site`, sem promoção).

## 8. Distinção explícita

- **Implementação concluída:** a identidade Sinal e os pacotes reais do Motion estão aplicados, medidos e
  versionados na branch, sem merge.
- **Aprovação estética: não houve.** Também não houve aprovação clínica, regulatória ou de marca. A escolha
  entre as três identidades fica para depois da comparação.
