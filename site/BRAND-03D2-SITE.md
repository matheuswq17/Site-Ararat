# ARARAT 03D2 no site — quarta alternativa visual (`codex/brand-03d2-v1`)

**Data:** 09/10/2026 · **Base:** Sinal integrada `0063ba3437722c0348b775e3b77f632f8bb75196`
**Situação:** implementação concluída e verificada tecnicamente, **com os pacotes 03D2 do Motion integrados**
(`codex/brand-03d2-motion-v1` @ `8568d8f`, §7). **Não houve aprovação estética, clínica ou de marca.**

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
6. Montanha 1.0.0-03d2: o material do relevo continua com teto `#E2E2E2` (sombreado, não traço — decisão do
   Motion); o destaque da Jornada e as anotações do Site usam `#EDEDED`; arco `#919191`.

## 7. Motion — pacotes 03D2 integrados

**Origem.** `codex/brand-03d2-motion-v1` @ `8568d8f`, pasta `motion/brand-03d2-v1/`, contrato
`BRAND-03D2-MOTION.md`. Extraídos com `git archive 8568d8f` (bytes dos blobs).

| Composição | Pacote | Pasta no Site | `sync-manifest --check` | SHA-256 do `manifest.json` = `MANIFESTO.json` da rodada |
|---|---|---|---|---|
| Montanha + Jornada 0.4.3-03d2 | 1.0.0-03d2 | `public/previa/home-montanha-1.0.0-03d2/` | 71/71 | sim |
| Fechamento da Ciência | 0.6.0-03d2 (claro e `-escuro`) | `public/refinada/topo-revisao-0.6.0-03d2/` | 5/5 | sim |
| Time | 0.5.0-03d2 | `public/refinada/time-interativo-0.5.0-03d2/` | 12/12 | sim |
| Fluxo Hub → Viewer | 0.4.0-03d2 (assets do 0.1.0) | `public/refinada/plataforma-fluxo-0.4.0-03d2/` | 1/1 | sim |

- As pastas novas entram no `.gitattributes` com `-text`.
- Todos os pacotes anteriores ficam no lugar, sem alteração: `0.9.0-sinal`, `0.5.0-sinal`, `0.4.0-sinal`,
  `0.3.0-sinal` e mais antigos. As rotas de comparação seguem com os delas.
- O pacote opcional de revelação da marca (`marca/1.0.0-03d2`) **não** foi integrado. O Site mantém a revelação
  oficial do kit (CSS) já em uso, sem duplicar a animação.
- Pontes em `lib/`:
  - `REFINADA_PACKAGE` → 1.0.0-03d2;
  - `PAISAGENS["0.6.0-03d2"]` e `["0.6.0-03d2-escuro"]`, com `VERSAO_PADRAO` = 0.6.0-03d2;
  - `TIME_RETRATO_PACKAGE` → 0.5.0-03d2, com a opção `fundo` tipada;
  - `MODULOS_FLUXO["0.4.0-03d2"]` como padrão.

**Time (contrato do Motion §3).**
- Com o módulo ativo, o quadro (`.portrait[data-motor="modulo"]`) e a coluna (`.portraitCol`) ficam transparentes.
- O plano tonal passa a ser pintado **pelo módulo** (`fundo`), alinhado ao pixel inteiro junto com a foto.
- A cor vem do token `--ararat-bg-sunken` da seção (#EDEDED no claro), não de um valor fixo.
- Sem módulo (estático, celular, sem JS), o quadro mantém o `bg/sunken` do Site.
- `cor: "mono"` continua: um único filtro por imagem.

**Abertura (900 ms do módulo).**
- O script de abertura do Site encerra o estilo da abertura em 1400 ms após a navegação e agora registra o motivo
  (`window.__araratIntroFim` = `tempo` ou `interacao`).
- Na refinada (`introModuloMs: 900`), o fim **por tempo** não corta mais a montanha: ela completa os próprios
  900 ms, contados de quando o módulo começa.
- O Site chama `setIntroTime(null)` no fim desse prazo, só como rede de segurança.
- Rolagem, roda, toque, tecla, pausa, resize e movimento reduzido continuam concluindo na hora.
- As rotas de comparação seguem como antes.
- Medido com o módulo atrasado de 0, 500 e 800 ms: `data-intro=done` cerca de 900 ms depois do início do módulo, em
  todos os casos (antes, o fim fixo de 1400 ms cortava a subida quando o módulo chegava depois de ~500 ms).

**Revelação da logo.** A mesma de antes: a do kit, no cabeçalho, uma vez por aba. Ela é independente da montanha e
nenhuma das duas espera a outra.

## 8. Verificação (build de produção, porta 3030, página integrada)

| Conferência | Intermediária (`7409bf3`, pacotes Sinal) | **Integrada (pacotes 03D2)** |
|---|---|---|
| `typecheck` / `build` | ok | ok |
| `marca-03d2-integridade` | 21/21 + tokens + assinatura | 21/21 + tokens + assinatura |
| `marca-03d2-layout` (22 combinações EN/PT × 11 telas) | 22/22 | **22/22 em 3 execuções seguidas** (§8.1) |
| `marca-03d2-contraste` / `-cores` | 0 reprovados / 0 matiz | 0 reprovados / 0 matiz (inclusive no desenho do Motion) |
| `e2e` · `navegacao` · `locales` · `plataforma-fluxo` | 29/29 · 17/17 · 6/6 · 10/10 | 29/29 · 17/17 · 6/6 · 10/10 |
| `previa` | 46/48 | 46/48 — as mesmas 2 da base e da `main` |
| `refinada` | 39/40 | **40/40** |
| Verificadores do Motion (Ciência · Time · Fluxo) | 54/54 · 20/20 · 22/28 | **55/55 · 21/21 · 28/28** |

Os testes do Site só tiveram trocadas as **strings de versão e os caminhos dos pacotes** (`locales.mjs`,
`refinada.mjs`, `plataforma-fluxo.mjs`). Nenhum limite foi relaxado.

**As duas regressões herdadas do Sinal, agora:**
- **Ciência · continuação** (> 0,05 % em ≥ 6 de 8 passos): **0,05 · 0,10 · 0,08 · 0,18 · 0,30 · 0,27 · 0,14 ·
  0,09 %** (8/8). Ida e volta iguais, 0 mutações parado. Antes: 0,02 · 0,03 · 0,05 … ✘.
- **Time · enquadramento final** (normal × reduzido, limite 0,1 %): **0,000 %** dos canais diferem, com retratos de
  440×551 nos dois modos. Agora isso vale por construção (`alinhar()` do módulo + quadro e coluna transparentes),
  e não pela coincidência de frações registrada na versão intermediária.

### 8.1 Assinatura do rodapé

- O Motion registrou falhas instáveis de "assinatura do rodapé" no `marca-03d2-layout`, em telas diferentes a cada
  execução.
- **Causa encontrada:** o `<img>` do rodapé é lazy. Antes de carregar, a caixa usava os atributos inteiros
  232 × 27, ou seja 8,59 : 1 em vez de 8,658 : 1 do arquivo, e o teste (tolerância 0,05) às vezes media antes do
  carregamento.
- **Correção no produto, não no teste:** `aspect-ratio: 1021.65 / 118` na assinatura do rodapé e no `<img>` de
  reserva do cabeçalho. A caixa tem a proporção exata desde o início, sem deslocamento quando a imagem chega.
- Resultado: 22/22 em três execuções seguidas.

**Falhas restantes:** só `previa.mjs` (2): "home aprovada em / intacta" e "versão e origem…". Falham igual na base
Sinal, na versão intermediária e na `main`; são **preexistentes**.

## 9. Navegador visível × headless

- Tudo o que está no §8 rodou em **Chromium headless** (Playwright).
- Observação visual pelas capturas headless (§10): primeira dobra, cabeçalho, seções claras e escuras, recorte,
  linha de estrato, Time, Explicabilidade e rodapé.
- A conferência em navegador **visível** fica para a Vercel Preview (o servidor local desta cópia não é acessível
  daí). O que for visto lá está registrado na entrega, separado deste relatório.

## 10. Capturas e gravações (fora do repositório)

- "Antes" (base Sinal) e "depois" nas mesmas posições: EN/PT × 390/1440 por seção, e 320/768/1280/1920/2560
  no topo e no rodapé.
- Página **integrada** (pacotes 03D2) nas mesmas posições, com montagens intermediária × integrada.
- Prancha das reduções em 16/24/32 px e da assinatura do celular.
- Gravações em desktop e celular (rolagem completa + Time).

## 11. Pendências

1. Pendências visuais do Motion (`BRAND-03D2-MOTION.md` §6):
   - peso da crista da Ciência (`#777777`, mais leve que no Sinal);
   - filete do brilho;
   - borda reta do recorte na subida da montanha (~200 ms);
   - arco `#919191`.
2. Time: P&B de exibição (`mono`) é escolha do Site, para revisão. A captura por elemento em DPR 1,5/2 ainda difere
   ≤ 1 px CSS entre normal e reduzido (medido pelo Motion, fora do teste do Site, que é em DPR 1).
3. Revelação da marca: o pacote JS do Motion fica disponível, mas não foi integrado; vale o CSS do kit.
4. Pontos em aberto do próprio kit: favicon de 16 px, texto EN, pesquisa de marca e registro, imagens clínicas reais
   nas peças.
5. Revisão visual humana na página integrada e escolha entre as quatro identidades.

## 12. Distinção explícita

- **Implementação concluída:** a identidade 03D2 está aplicada, medida e versionada na branch, sem merge.
- **Aprovação estética: não houve**, nem clínica, regulatória ou de marca.
