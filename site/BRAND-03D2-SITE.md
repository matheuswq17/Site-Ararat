# ARARAT 03D2 no site — quarta alternativa visual (`codex/brand-03d2-v1`)

**Data:** 09/10/2026 · **Base:** Sinal integrada `0063ba3437722c0348b775e3b77f632f8bb75196`
**Situação:** implementação concluída e verificada tecnicamente. A apresentação é **INTERMEDIÁRIA** porque os
módulos do Motion servidos ainda são os pacotes **Sinal** (§7). **Não houve aprovação estética, clínica ou de marca.**

## 1. Alternativas preservadas (mesmo conteúdo, só a identidade muda)

| Alternativa | Branch | Commit | Porta local de comparação |
|---|---|---|---|
| Atual | `main` | `3d55f7c` | 3000 |
| Canônica | `experiment/brand-canonical-v1` | `89468c1` | 3010 |
| Sinal | `experiment/brand-sinal-v1` | `0063ba3` | 3020 |
| **03D2** | `codex/brand-03d2-v1` | ver `git log` (commits listados na entrega) | **3030** |

Nenhuma dessas branches foi alterada, nem `experiment/brand-canonical-motion-v1`, `experiment/brand-sinal-motion-v1` e
`codex/brand-03d2-motion-v1`. Os pacotes anteriores (montanha, topo-revisao, time-interativo, plataforma-fluxo,
`marca-sinal`) continuam no repositório, sem alteração.

## 2. Estado inicial e testes de referência (base `0063ba3`, build de produção, porta 3020)

| Suíte | Resultado na base |
|---|---|
| `e2e` / `navegacao` / `locales` / `plataforma-fluxo` | 29/29 · 17/17 · 6/6 · 10/10 |
| `previa` | 46/48 — "home aprovada em / intacta" e "versão e origem…" (as mesmas 2 da main) |
| `refinada` | 38/40 — "Time · enquadramento final" e "Ciência · continuação" |
| `sinal-integridade` / `-layout` / `-contraste` / `-cores` | 16/16 · ok · 0 reprovados · 0 cores com matiz |

Capturas "antes" (as mesmas posições das capturas "depois") ficam fora do repositório, na entrega.

## 3. Kit lido e conferido

- **Pasta:** `C:\ARARAT-Website\brand-system-ararat-03d2\ARARAT_Brand_System_03D2_v1.0`. Pasta e zip conferem
  325/325 contra `manifesto.json`; o SHA-256 do zip é `716d2738db1caa270768897a6fa96f95ac7dc6109774f472aea1d4ddc82dcc58`.
- **Lidos:**
  - `00_LEIAME.md` e o brand book (HTML), §1–17;
  - tokens: CSS, JSON e `contraste.md`;
  - componentes (`ararat-03d2-componentes.css`);
  - `06_grafismos/LEIAME.md`, `07_motion/LEIAME.md` e `05_icones/LEIAME.md`;
  - favicon (`head-snippet.html`, `site.webmanifest`);
  - fontes (`ararat-fontes.css`, `fontes.json`);
  - aplicações de cabeçalho/rodapé e primeira dobra (só como referência de composição);
  - `10_validacao/RELATORIO-DE-VALIDACAO.md`.

## 4. Ativos usados — 21 arquivos, cópias byte a byte

Os arquivos ficam em `public/marca-03d2/v1.0/`, **nos mesmos caminhos relativos do kit**. Uso, tamanho e SHA-256
de cada um estão em `MANIFESTO.json`.
- Conferência: `node tests/marca-03d2-integridade.mjs`, também com os bytes servidos.
- As pastas novas entram no `.gitattributes` com `-text`.

| Grupo | Arquivos | Uso |
|---|---|---|
| Assinatura | `07_motion/ararat-assinatura-animavel.svg` (mesmos 14 caminhos da horizontal, conferido por teste) · `01_logo/assinatura-horizontal/ararat-horizontal-negativo.svg` | cabeçalho (SVG no HTML) · rodapé (`<img>`) |
| Favicon | `favicon.ico`, `favicon.svg`, `apple-touch-icon-180.png`, `icon-192/512.png`, `icon-maskable-512.png`, `site.webmanifest` | `/`, `/pt`, `/previa/refinada` |
| Tokens | `02_tokens/ararat-03d2.tokens.css` | origem da camada de tokens do Site (gerada, §5) |
| Fontes | `Geist-Variable.woff2`, `GeistMono-Variable.woff2` + OFL | Geist 400/500/600 · Geist Mono 400/500 |
| Ícones | `documento`, `cortes`, `revisao` | blocos da Ciência (estudo publicado, segmentação, limites e revisão humana); "Alcance" sem ícone |
| Grafismos | `planos-tonais-escuro.svg` + `-retrato.svg`, `linha-de-estrato.svg` | recorte na faixa própria do Contato (uma vez) · divisor único no topo da Plataforma |
| Motion | `07_motion/ararat-revelacao.css` | revelação da marca, 900 ms (§5) |

**Não usados:**
- a assinatura compacta e o símbolo micro em assinaturas (o micro fica só no favicon);
- a vertical, as assinaturas de produto e a régua;
- a moldura `.ar-frame` com cantos e metadados, porque desenharia sobre as capturas; só o fundo preto e o fio
  foram adotados;
- os mockups do Hub e do Viewer, áreas reservadas, dados de exemplo, a legenda do post e o texto do rodapé do kit.

## 5. Decisões

**Escopo.**
- Tudo fica sob `[data-marca="03d2"]` e vale só na refinada: `/`, `/pt` e `/previa/refinada`.
- Arquivos: `components/preview/proposta/marca-03d2.tokens.css` (gerado), `marca-03d2.css`, `components/marca/Marca03d2.*`,
  `lib/marca-03d2.ts` e `lib/marca-03d2.server.ts`.
- `lib/marca-tema.tsx` passa a aceitar o tema `"03d2"`.
- As rotas de comparação ficam como estavam.
- O Sinal continua selecionável no código (`marca="sinal"`); `marca-sinal.css` não é carregado nessas rotas.

**Tokens.**
- `tests/marca-03d2-tokens.mjs` gera a camada a partir do arquivo oficial: só os seletores mudam, nenhum valor é
  digitado.
- O site é escuro por padrão (brand book §7: "o site e o Viewer usam o escuro"). Ciência e Time recebem o tema
  **claro** completo.
- O bloco `prefers-color-scheme` do kit foi omitido: o tema não segue o sistema.
- `marca-03d2.css` usa só **nomes por função** (`--ararat-text-secondary` etc.). As variáveis antigas do site são
  redirecionadas por papel e redeclaradas nas seções claras.

**Cor.**
- Escuro: canvas `#111111`, superfícies `#1B1B1B`/`#242424`, selecionado `#303030`; texto `#EDEDED`/`#C6C6C6`/`#ABABAB`;
  bordas `#303030`/`#474747`/`#919191`; foco `#EDEDED` 2 px afastado 2 px; primário `#EDEDED` sobre `#111111`, com
  hover `#C6C6C6` e pressionado `#FFFFFF`.
- Claro: canvas `#F6F6F6`, cartões `#FFFFFF`; texto `#111111`/`#474747`/`#5E5E5E`; bordas `#E2E2E2`/`#C6C6C6`/`#777777`.
- O **branco puro** aparece onde o kit permite (cartão claro e primário pressionado). A regra do ponto do Sinal
  não foi carregada.
- Sem matiz, gradientes ou sombras. Matiz só nas cores clínicas dentro das capturas e da RM.

**Tipografia.**
- Geist variável para títulos (500, tracking do token), corpo (400) e interface (500); 600 só em ênfase e na frase
  de decisão. Geist Mono em label (11/16, 0,14 em, caixa alta) e dados (tabular).
- Escala do kit: display 64/68 no hero (40/44 no celular), h1 44/48 → 32/36 nos títulos de seção, body-lg 18/28
  nas aberturas, body 16/26.
- Os rótulos de seção da Plataforma e da Explicabilidade, antes ampliados (18 px), voltam ao label de 11 px.
- A frase do rodapé deixa de ser rótulo e vira body-sm.
- A reserva métrica é a do kit (`Geist Fallback` / `Geist Mono Fallback`).
- **Fonte realmente carregada:** o teste confere a família com status `loaded` **e** o download dos dois WOFF2
  do kit (Resource Timing), sem nenhuma fonte do Sinal nem da tipografia A.

**Assinatura.**
- Sempre o **símbolo mestre** + nome em curvas, sem redigitar nada. Só a largura vem do CSS, e a proporção é a do
  arquivo.
- **Cabeçalho:** 192 px no desktop (tinta com cerca de 22 px de altura e símbolo de cerca de 65 px), 168 px no
  celular e 160 px abaixo de 360 px. Sempre ≥ 160 px.
- **Rodapé:** 232 px, ou 200 px no celular.
- **Área de proteção de 1 a** (altura das maiúsculas, 16–19 px) até o próximo controle, conferida em 320–1440 px.
  - Para caber em 320–379 px sem trocar para a compacta, primeiro foi ajustado o espaço da navegação: margem
    lateral de 16 px (gutter-mobile do kit), menu com 44 px e seletor "EN / PT" mais justo.
  - Nessa faixa a logo fica a 16 px da borda e o texto a 20 px (diferença de 4 px).
- A compacta não foi necessária no celular. A prancha 16/24/32 px está em `comparacoes/` na entrega.
- O SVG animável está no HTML: sem JS, a logo aparece completa.

**Favicon.** ICO 16/32/48 + SVG (troca de tinta com o tema do sistema), ícone iOS 180 e manifesto com ícones de
192/512 e maskable. O desenho é a redução. `theme-color` `#111111`.

**Revelação de 900 ms** (`07_motion`).
- Um script síncrono colocado antes do cabeçalho decide antes de a logo ser pintada:
  - toca uma vez por aba;
  - não toca com a pausa salva;
  - não altera o markup do React: só injeta um `<style>` com o CSS do kit e o remove em 1,1 s.
- Movimento reduzido: o próprio CSS do kit troca por esmaecimento de 140 ms. Pausa durante a revelação: quadro
  final.
- Nada espera pela revelação, e a abertura da montanha segue seu próprio prazo.
- Medido: 4 animações na 1ª carga; nenhuma na 2ª página da aba; nenhuma com pausa salva; 1 esmaecimento no modo
  reduzido.

**Cabeçalho.**
- Fundo canvas e fio subtle quando rolado; links ui 14/20 em secundário → primário, sublinhado de 2 px.
- Seletor "EN / PT" (ar-lang): o idioma atual em primário sublinhado. Continua sendo **um** link para o outro idioma,
  com o mesmo destino, o mesmo nome acessível e a busca e a âncora preservadas.
- Pausa e menu: quadrados de raio 4 com borda forte.

**Controles e cartões.** Botões do kit (raio 4, primário/secundário por token, transições `fast`). Aviso da
demonstração Hub → Viewer = `ar-notice--demo` (tracejado, raio 6). Publicação da Ciência = `ar-card`. Canal de
contato pendente: estado por forma (círculo vazio).

**Grafismos, com moderação.**
- **Recorte das camadas:** uma vez, numa faixa própria na base do Contato, nunca sob texto. No celular usa o arquivo
  em retrato para manter o cume.
- **Linha de estrato:** uma vez, como divisor no topo da Plataforma.
- O símbolo não vira padrão nem marca-d'água.
- **Nada sobre imagens médicas.** A montanha e a Jornada aprovadas continuam no hero; o recorte não as substitui.

**Conteúdo e imagens preservados.**
- Textos aprovados (EN principal em `/`, PT em `/pt`), DOI, biografias, atribuições e canal de contato (em preparação).
- Capturas reais do Hub e do Viewer intactas, com as cores clínicas originais. Só a moldura mudou: fundo preto e
  fio, sem raio, para não recortar a imagem.
- A RM continua sem filtro. Na Explicabilidade, as anotações do Site ficam em `#EDEDED` (contorno e curvas de
  iso-intensidade).
- Percurso de 7 etapas terminando em "Revisão pendente", sem score, segmentação, XAI ou finalização.
- Time: cinco pessoas reais, P&B só na exibição (`cor: "mono"` no módulo + CSS só em `img:not(.rp-foto)`, um único
  filtro por imagem).

## 6. Diferenças explícitas (o kit não foi reescrito)

1. O `prefers-color-scheme` do kit não é seguido. O site fica escuro, com Ciência e Time claras.
2. A moldura das capturas usa o fundo preto e o fio do kit, sem cantos, metadados nem raio.
3. O backdrop do diálogo de captura é `#111111` a 92 %.
4. Barras da Explicabilidade: o kit não tem tokens de dados; usa texto secundário e borda forte.
5. Nas larguras < 380 px o gutter do cabeçalho é 16 px, e o conteúdo segue com 20 px.
6. Nos módulos Sinal ainda servidos, o desenho do Motion usa `#E2E2E2` (onde o 03D2 usaria `#EDEDED`) e `#777777`
   no arco. Ver `docs/coordination/BRAND-03D2-SITE.md` §6.

## 7. Motion — apresentação intermediária

- `codex/brand-03d2-motion-v1` existe, mas está em `0063ba3`, sem pacotes 03D2. **Nenhum pacote 03D2 foi integrado.**
- Servidos (os mesmos da base Sinal): montanha `0.9.0-sinal`, topo-revisao `0.5.0-sinal`, time-interativo
  `0.4.0-sinal` e plataforma-fluxo `0.3.0-sinal`, com manifestos íntegros.
- O briefing com medidas, fundos, zonas, contratos, caminhos e diferenças de token está em
  `docs/coordination/BRAND-03D2-SITE.md`, na pasta de coordenação do repositório principal
  (`C:\mvp_ararat_site`). Como os demais documentos de coordenação, ela fica fora do Git pelo `.gitignore`.
- A entrega final deve ser conferida de novo com os módulos 03D2 integrados.

## 8. Verificação (build de produção, porta 3030)

| Conferência | Resultado |
|---|---|
| `typecheck` / `build` | sem erros |
| `marca-03d2-integridade` (arquivos, bytes servidos, tokens = kit, assinatura no HTML idêntica ao arquivo) | 21/21 + tokens + assinatura em `/`, `/pt`, `/previa/refinada` |
| `marca-03d2-layout` (EN+PT × 320, 390, 768, 1280, 1440, 1920, 2560 + 1280×600, 390×640, 360×780, 375×667) | 22/22 combinações. Verificados: rolagem lateral, Geist/Mono baixadas e carregadas, só 400/500/600 · Mono 400/500, assinatura ≥ 160 px na proporção do arquivo com 1 a de proteção, rodapé, favicon e manifesto, mensagem e CLS ≤ 0,002 |
| `marca-03d2-contraste` (todo texto visível, EN+PT × 7 larguras) | 0 reprovados; menor razão 5,89:1 |
| `marca-03d2-cores` | 0 cores com matiz na camada do Site e 0 no desenho do Motion |
| `e2e` · `navegacao` · `locales` · `plataforma-fluxo` | 29/29 · 17/17 · 6/6 · 10/10 |
| `previa` | 46/48 — as mesmas 2 falhas da base e da main |
| `refinada` | **39/40** |
| Verificadores do Motion (pacotes Sinal) na página 03D2 | Time 20/20 · Ciência 54/54 · Fluxo 22/28 (ver abaixo) |

Os testes de cabeçalho e rodapé de `refinada.mjs` foram reescritos para o 03D2 com a mesma força, e passaram a
exigir também 1 a de proteção. Nenhum limite foi relaxado.

**Falhas: preexistentes × regressões (comparadas com a base `0063ba3`, não classificadas automaticamente).**
- `previa.mjs` (2): falham igual na base `0063ba3` e na main. Preexistentes; não foram tocadas.
- **Ciência · continuação** (limite > 0,05 % em ≥ 6 de 8 passos, mantido). Falha igual na base `0063ba3`: os
  três primeiros passos mudam 0,02 %, 0,03 % e 0,05 % (base: 0,02, 0,02, 0,05). É **preexistente em relação ao
  Sinal** e **regressão em relação à main**. A causa é a coreografia `0.5.0-sinal` (crista completa desde e = 0).
  Pedido ao Motion no §7 do briefing.
- **Time · enquadramento final** passa aqui, mas **por coincidência, não por correção**. A fração subpixel do
  retrato é 0,141 no modo normal e 0,016 no reduzido (base: 0,266 × 0,938). Com as duas abaixo de 0,5 a
  reamostragem coincide, como na main. A causa continua; o pedido de alinhar ao pixel segue no briefing.
- **Verificador do Fluxo do Motion, 6 falhas:** a etapa animada espera a legenda ativa em `#E2E2E2` (tema do
  Sinal); no 03D2 ela é `#EDEDED` (text/primary). Sequência, assets e erros estão corretos. É diferença de tema
  esperada, não regressão do Site. O verificador precisa do tema 03D2.

## 9. Navegador visível × headless

- Tudo o que está no §8 rodou em **Chromium headless** (Playwright).
- Observação visual pelas capturas headless (§10): primeira dobra, cabeçalho, seções claras e escuras, recorte,
  linha de estrato, Time, Explicabilidade e rodapé.
- A conferência em navegador **visível** fica para a Vercel Preview (o servidor local desta cópia não é acessível
  daí). O que for visto lá está registrado na entrega, separado deste relatório.

## 10. Capturas e gravações (fora do repositório)

- "Antes" (base Sinal) e "depois" nas mesmas posições: EN/PT × 390/1440 por seção, e 320/768/1280/1920/2560
  no topo e no rodapé.
- Prancha das reduções em 16/24/32 px e da assinatura do celular.
- Gravações em desktop e celular (rolagem completa + Time).

## 11. Pendências

1. Pacotes 03D2 do Motion (cores do §6 e gesto do kit) → integração e reconferência. Até lá, apresentação intermediária.
2. Ciência · continuação e Time · enquadramento: pedidos ao Motion (limites mantidos).
3. Verificadores do Motion precisam do tema 03D2.
4. Pontos em aberto do próprio kit: favicon de 16 px, texto EN, pesquisa de marca e registro, imagens clínicas reais
   nas peças.
5. Revisão visual humana na página integrada e escolha entre as quatro identidades.

## 12. Distinção explícita

- **Implementação concluída:** a identidade 03D2 está aplicada, medida e versionada na branch, sem merge.
- **Aprovação estética: não houve**, nem clínica, regulatória ou de marca.
