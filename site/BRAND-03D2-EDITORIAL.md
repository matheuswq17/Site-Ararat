# ARARAT 03D2: composição editorial (`codex/brand-03d2-editorial-v1`)

**Origem:** `codex/brand-03d2-v1` @ `9ed8ae998b302e5cb029a095669ee4a274131fbf`. Essa é a 03D2 com os pacotes do Motion
`8568d8f` integrados e conferidos: Montanha 1.0.0-03d2 com Jornada 0.4.3, Ciência 0.6.0-03d2, Time 0.5.0-03d2 e Fluxo
0.4.0-03d2.

**Preservado sem alteração:** a branch anterior (para comparação), `main`, Sinal, Canônica, as rotas de comparação e
os pacotes do Motion.

**Escopo do Site:** layout, tipografia, temas, textos de apresentação, acessibilidade e cálculo do progresso. Nenhum
módulo foi reimplementado.

**Estado: pronto para revisão visual. Não é aprovação estética:** as escolhas abaixo são uma primeira proposta.

## 1. Primeira dobra

- **Composição única a partir de 1200 px.** A área vira uma grade 5fr/7fr: texto à esquerda e montanha à direita, com
  os dois centralizados na mesma altura. O slot da arte mantém a proporção 5:3 (650–740 × 390–440).
  - A montanha aprovada não muda: é a mesma geometria e o mesmo módulo, que só recebe o novo `art`.
  - Abaixo de 1200 px o layout continua empilhado. O texto ficou mais compacto, e a montanha subiu 38–58 px no celular.
- **Hierarquia.** "Contrast is information. / We measure." ficam em h1. "You decide." / "Você decide." sobe para o
  tamanho display, peso 600, na cor primária. No celular, os tamanhos são limitados por `vw` para a frase não quebrar.
- **Ações.**
  - Principal: "Explore the image", botão preenchido.
  - Secundária: "Explore the platform", agora um link sublinhado com seta.
  - No celular, a principal ocupa a largura e a secundária fica alinhada à esquerda.
  - O foco visível por teclado continua nos dois.
- **Preservado:** kicker, subtítulo, o aviso "Platform undergoing scientific validation", a abertura de 900 ms do
  módulo e a revelação oficial da logo.
- **Telas baixas.** Com ≥ 1200 px, a montanha e o arco cabem inteiros na 1ª tela em 1200×600, 1280×600, 1366×640,
  1440×700 e 1920×900, com e sem movimento reduzido (checagem automática).
  - Em 390×640, os cumes e o arco aparecem; o sopé passa da dobra, como antes, mas 38 px mais alto.

## 2. Ritmo entre seções (tokens oficiais, só o escopo muda)

| Seção | Tema | Motivo |
|---|---|---|
| Primeira dobra, Jornada, Passagem | escuro | marca e imagem (padrão do kit: "o site usa o escuro") |
| **Plataforma** | **claro** | as capturas do Hub são claras; o fundo claro separa o capítulo do produto e evita três blocos escuros seguidos |
| Explicabilidade | escuro | leitura da RM: a imagem médica se lê melhor em fundo escuro |
| Ciência, Time | claro | texto longo, referência bibliográfica, fotos |
| FAQ | escuro | volta ao escuro antes do contato |
| **Contato** | **claro** | recorte das camadas na versão clara do kit (`ararat-planos-tonais-claro*.svg`, cópia byte a byte) |
| Rodapé | escuro | assinatura |

- **Transições:** cada troca de tema é uma borda reta de fundo, sem gradiente nem efeito. Os fios superiores
  redundantes (Contato e FAQ) foram removidos, porque a troca de fundo já marca a mudança.
- **Espaçamento:** o vertical continua o dos tokens de seção.
- **Tokens:** gerados de `ararat-03d2.tokens.css` (`tests/marca-03d2-tokens.mjs`). O escopo claro agora é
  `#plataforma, #ciencia, #time, #contato`.

## 3. Hub e Viewer

- O fundo claro dá às capturas o contraste do produto real.
- O palco continua do mesmo tamanho: testei uma coluna de legendas de 232 px, mas em 1280×600 as legendas passavam da
  altura do quadro fixo, e voltei para 280 px.
- As sete etapas, a atribuição, os avisos, a régua demonstrativa e o encerramento em "Revisão pendente" não mudam.
- Não há interface reconstruída nem ampliação além de 1:1 dos pixels @2x.
- **Legibilidade dos controles: depende do Motion.** As aproximações foram pedidas por etapa (o que mostrar e o que
  precisa ficar legível), com as medidas reais do palco em
  `C:\mvp_ararat_site\docs\coordination\BRAND-03D2-EDITORIAL-SITE.md`. Nesta proposta as capturas ainda aparecem
  inteiras.

## 4. Ciência

- **Publicação em composição editorial:**
  - fio superior de 2 px;
  - kicker em mono;
  - título bibliográfico no tamanho h2;
  - a **pergunta estudada** como citação em destaque, com rótulo mono;
  - referência completa (autoria, periódico, DOI) e **"Read the publication"** numa coluna à direita;
  - a nota de separação ("classification study, separate from the ongoing segmentation research") logo abaixo.
- Em ≤ 900 px, a publicação passa para uma coluna.
- **Preservados:** DOI, autoria, limites, a separação entre classificação publicada e segmentação em pesquisa, e o
  aviso de validação.
- A montanha animada continua como encerramento (Motion 0.6.0-03d2), sem mudança.
- Nenhum grafismo foi colocado perto dos resultados.

## 5. Time: comparação natural × P&B

- **Padrão:** P&B (`cor: "mono"`), como aprovado.
- **Alternativa para revisão:** `?retrato=natural` passa o módulo para `setCor("natural")` (a foto em repouso fica em
  cor natural) e tira o filtro do fallback estático.
- Nas duas versões, os pontos durante a troca são monocromáticos (`#303030`, do pacote 0.5.0-03d2).
- **Preservados:** fotos originais, biografias, ordem, acordeão, acessibilidade e o comportamento aprovado.
- **Não é decisão:** a URL de comparação não aparece na navegação.
- **Correção (bug que já existia na base `9ed8ae9` e no Sinal):**
  - *Problema:* depois de uma falha de retrato (404), o Site escondia o palco com `hidden`. O IntersectionObserver do
    módulo passava a ver o palco como invisível, o módulo não acordava e ficava preso em `falha`. Por isso o
    `locales.mjs` falhava de forma intermitente.
  - *Correção:* agora o palco é escondido com `visibility: hidden` (`data-oculto`). A troca seguinte se recupera em cerca
    de 1 s; o `locales` passou em 3/3 execuções seguidas e de novo na suíte completa.

## 6. Uso da marca

- **Grafismo das camadas (planos tonais):** aparece em um só momento, o recorte do Contato, como fechamento antes do
  rodapé.
  - Nunca fica sobre a RM, as capturas ou as fotos, e não compete com a montanha.
- **Logo:** só a oficial, sem redesenho, com a revelação oficial no cabeçalho e o `<img>` no rodapé.

## 7. Verificação (build de produção, porta 3030; base 3031 = `9ed8ae9`)

| Suíte | Editorial |
|---|---|
| marca-03d2 integridade / layout / contraste / cores | 23/23 · ✔ · ✔ · ✔ |
| e2e | 29/29 |
| navegacao | 17/17 |
| locales (EN/PT, sem JS, 6 larguras, falha de retrato) | 6/6 |
| plataforma-fluxo | 10/10 |
| refinada | 40/40 |
| previa | 46/48: as 2 falhas são da home `/` e já existiam (iguais na base) |
| Motion: Time / Fluxo / Ciência (`verificar.mjs` contra 3030) | 21/21 · 28/28 · 55/55 |
| Checagens editoriais (ver abaixo) | 46/46 |

**Checagens editoriais:**
- sem rolagem lateral em `/` e `/pt`, em 14 tamanhos de 320×568 a 2560×1440;
- montanha inteira e sem sobreposição em telas baixas, com e sem movimento reduzido;
- foco visível nas duas ações;
- resize igual a página nova;
- sem JS: título, 2 ações, poster e ritmo de fundos em EN e PT;
- Time P&B e natural sem erros.

Pausa e movimento reduzido: o contrato não muda, e eles são cobertos por `refinada`, `previa` e `plataforma-fluxo`.

## 8. Pendências (registradas, sem afrouxar testes)

1. ~~Poster no slot menor~~ → resolvido na rodada 2 (§10: família editorial da montanha 1.1.0-03d2).
2. ~~Aproximações do fluxo por etapa~~ → entregues pelo Motion no fluxo 0.5.0-03d2 (§10), com uma ressalva de escala.
3. ~~Plataforma em 1280×600~~ → corrigido na rodada 2 (§10.4).
4. **`previa`, home `/`:** 2 falhas que já existiam (o teste espera a home aprovada antiga).

## 9. Capturas e gravações

Ficam fora do repositório:
- antes/depois nas mesmas posições: 390 e 1440 em EN/PT por seção; 320, 768, 1280, 1920 e 2560 no topo e no rodapé;
- telas baixas e movimento reduzido;
- publicação;
- Time P&B × natural;
- gravações em 1440 e 390.

## 10. Rodada 2: pacotes editoriais do Motion integrados

**Motion:** `codex/brand-03d2-editorial-motion-v1` @ `e340de16650bd912e80a6906f96bd5b57b006d28`, contrato
`motion/brand-03d2-editorial-v1/EDITORIAL-03D2-MOTION.md`.
**Base desta rodada:** `6cf4634`, que segue disponível para comparação.
**Resposta ao Motion:** `docs/coordination/BRAND-03D2-EDITORIAL-SITE-INTEGRACAO.md` (fora do Git).

### 10.1 Pacotes e integridade

| Pacote | Pasta servida | Conferência | Anterior preservado |
|---|---|---|---|
| Montanha 1.1.0-03d2 (Jornada 0.4.3) | `public/previa/home-montanha-1.1.0-03d2/` | `sync-manifest --check` 93/93 | 1.0.0-03d2 |
| Ciência 0.7.0-03d2 | `public/refinada/topo-revisao-0.7.0-03d2/` | 5/5 sha256 | 0.6.0-03d2 |
| Time 0.6.0-03d2 | `public/refinada/time-interativo-0.6.0-03d2/` | 12/12 sha256 | 0.5.0-03d2 |
| Fluxo 0.5.0-03d2 | `public/refinada/plataforma-fluxo-0.5.0-03d2/` (capturas do 0.1.0) | 1/1 sha256 | 0.4.0-03d2 |

- Os sha256 dos quatro manifestos batem com o `MANIFESTO.json` da rodada.
- Nenhum arquivo de pacote foi editado.
- **Pontes:** foram escritas no Site. Os trechos `TESTE`/`ESTUDO` do script de exemplo do Motion não foram usados.
- **Testes:** só as strings de versão e de caminho dos pacotes mudaram (`locales`, `refinada`, `plataforma-fluxo`).
  Nenhuma asserção foi afrouxada.

### 10.2 Contrato aplicado na primeira dobra

- **Composição central ≥ 1200 px:**
  - O CSS das duas colunas declara `--opening-composicao: centro` no slot, e a ponte (`HomeOpening.tsx`) passa
    `composicao: { alinhar: "centro" }` na criação e em cada `setLayout`.
  - Sem esse layout, o valor é `topo`, igual à 1.0.0.
  - O módulo confirma em `canvas[data-composicao]`.
- **Posters do slot editorial:**
  - A família `editorial` (w600–w760) é escolhida pela **função real do slot** de duas colunas, implementada em
    `editorialSlotWidth()`; as faixas `faixasPorLarguraDoSlot` do índice são aplicadas viewport a viewport.
  - Medido: 1200 → w600, 1280 → w640, 1440 → w720, 1920 → w736, 2560 → w720. O slot estreita um pouco acima de
    2086 px, porque o gap cresce até 64.
  - Abaixo de 1200 px continuam as famílias móvel e desktop. A última faixa desktop vai até 1199 px.
- **Celular baixo:**
  - `alturaUtil = innerHeight − topo do slot no documento`, só quando a dobra corta o desenho: visível < 75 % do
    slot, pela medida do Motion (sopé a ≈ 72 % em `topo`), e ao menos metade do slot visível.
  - 390×640 → `alturaUtil` 187: montanha e arco inteiros na 1ª tela.
  - 390×844 e 320×700 → `topo`, sem mudança.
- **Ações visíveis desde o 1º quadro:**
  - A entrada de opacidade das ações e da nota de estado foi retirada; o título e o subtítulo mantêm a entrada.
  - Medido: opacidade 1 já na primeira amostra (antes: 0 até ≈ 800 ms).

### 10.3 Ciência, Time e Fluxo

- **Ciência 0.7.0-03d2:** destaque em traço único, sem halo, e crista mais clara. A geometria e o contrato não mudam.
- **Time 0.6.0-03d2:**
  - P&B continua o padrão; `?retrato=natural` segue para revisão;
  - o filtro estático do Site é o mesmo `FILTRO_MONO` do módulo;
  - os pontos ficam `#303030` nos dois modos.
- **Fluxo 0.5.0-03d2:** aproximações nos controles por etapa, hierarquia de movimento e enquadramentos de celular. As 7
  etapas, a atribuição, os avisos, a régua demonstrativa e "Revisão pendente" não mudam.

### 10.4 Lista das etapas em telas baixas (correção do Site)

- **Problema:** em 1280×600 a lista com os 7 textos tinha 601 px para 484 px úteis.
- **Correção**, para largura ≥ 901 px e altura ≤ 820 px:
  - número e título das 7 etapas;
  - o texto da etapa ativa numa área reservada logo abaixo da lista;
  - trocar de etapa não desloca nada (CLS 0);
  - os textos inativos ficam transparentes, mas continuam no DOM.
- Cabe em todo o percurso em 1024×600, 1200×600, 1280×600, 1280×720, 1366×768, 1440×900 e 1920×1080, em EN e PT.
- Uma primeira versão, que expandia o texto dentro da lista, deu CLS 0,0076 em 1280 no `plataforma-fluxo.mjs`. Foi
  refeita: o teste não foi afrouxado.

### 10.5 Limitações que exigem novas capturas (registradas à parte; nada reconstruído)

O Site não simula nem redesenha nenhum desses estados.

1. **Etapa 4 (T2/ADC) no celular:**
   - Lado a lado, as duas séries ocupam a largura inteira do Viewer (755 px lógicos em ≈ 356 px de palco). Os rótulos
     ficam em ≈ 5 px enquanto as séries passam, e só depois são aproximados (≈ 16 px).
   - **Precisa de captura do Viewer em largura de celular** com "Comparar séries", se o produto tiver esse layout.
2. **Clique em "Comparar séries":** falta o estado antes e depois do botão. Hoje a etapa 4 entra direto na comparação.
3. **Prévia do relatório inteira,** com o carimbo de prévia e os avisos no mesmo quadro. A captura 06f mostra só a
   parte de cima.
4. **Cartões do Hub no retorno (etapa 7):** sem essa captura, a etapa 7 mostra só a fila.

### 10.6 Outras ressalvas (sem nova captura)

1. **Escala das capturas no fluxo 0.5.0.** Medida em pixels do dispositivo por pixel da fonte, no pior quadro de 101
   posições:
   - régua 05e: 2,66× em 1440@2x e 2,97× em 390@3x;
   - imagens médicas (comp-8, axial): 1,8–2,2×;
   - na 0.4.0, o máximo era 1,73×.
   - A interface continua legível, com o texto mole nos picos.
   - **Pedido ao Motion:** um teto de escala no módulo e o mesmo cálculo no verificador. Até lá, a 0.5.0 fica como
     padrão para revisão, **com essa ressalva**.
2. **Poster do celular baixo:** com movimento reduzido, pausa ou sem JS, 390×640 mostra o poster `topo`, com o sopé
   cortado, porque não há poster para `alturaUtil`. Pedido ao Motion.
3. **Verificador da montanha (`verify.mjs`):** depende de pastas de trabalho do Motion fora do Git
   (`motion/deliverables`) e não roda fora do ambiente deles. A integridade do pacote servido foi conferida por
   `sync-manifest --check` (93/93); o Motion reporta 83/83.

### 10.7 Verificação da página integrada (build de produção, porta 3030; antes = `6cf4634` na porta 3031)

| Suíte | Resultado |
|---|---|
| marca-03d2: integridade / layout / contraste / cores / tokens | 23/23 · ✔ · ✔ · ✔ · ✔ |
| e2e | 29/29 |
| navegacao | 17/17 |
| locales (EN/PT, sem JS, 6 larguras, falha de retrato com 0.6.0) | 6/6 |
| plataforma-fluxo (CLS 0 nas 6 larguras) | 10/10 (3 execuções após a correção) |
| refinada | 40/40 |
| previa | 46/48: as mesmas 2 falhas da home `/` que já existiam |
| Motion: Fluxo 0.5.0 / Ciência 0.7.0 / Time 0.6.0 P&B / Time 0.6.0 natural (`verificar.mjs` contra 3030) | 34/34 · 55/55 · 23/23 · 23/23 |
| Checagens editoriais, ver abaixo | 63/63 + legendas PT 7/7 |

**Checagens editoriais:**
- sem rolagem lateral em `/` e `/pt`, em 14 tamanhos de 320×568 a 2560×1440;
- 1ª dobra com a arte inteira e sem sobreposição em telas baixas, com e sem movimento reduzido;
- foco visível nas ações;
- resize igual a página nova;
- sem JS em EN e PT;
- Time P&B e natural;
- composição e poster corretos em 8 tamanhos;
- ações com opacidade 1 no 1º quadro;
- as 7 legendas do fluxo dentro do quadro fixo em todo o percurso, em 7 tamanhos.

### 10.8 Capturas e gravações (fora do repositório)

- Antes/depois nas mesmas posições:
  - 390 e 1440 em EN/PT por seção;
  - 320, 768, 1280, 1920 e 2560 no topo e no rodapé;
  - telas baixas e movimento reduzido;
  - o fluxo em 7 posições em 1440, 1280×600 e 390.
- Time P&B × natural.
- Gravações da página integrada em 1440×900, 1280×600 e 390×844.
- Em quadros parados no meio de uma troca de cena do fluxo aparece o véu da transição, como na base.

**Estado:** pronto para revisão visual em navegador visível. Não é aprovação estética dos enquadramentos do Motion nem
da composição do Site.

## 11. Rodada 3: luz ambiente da montanha na 1ª dobra (montanha 1.2.0-03d2)

**Pedido do proprietário:** uma única melhoria. Recuperar o movimento ambiente da montanha enquanto a pessoa não rola,
com iluminação suave e só monocromática. Layout, textos e enquadramentos aprovados ficam como estão.

**Motion:** `codex/brand-03d2-editorial-motion-v1` @ `e4bed14e57a4e097c7c499120bb8f8fe9d695a85` (pacote em
`fe31932`), contrato `docs/coordination/AMBIENTE-1A-DOBRA-MOTION.md`, em resposta a `BRAND-03D2-AMBIENTE-SITE.md`.

### 11.1 Pacote e integridade

- **Cópia:** `public/previa/home-montanha-1.2.0-03d2/`, copiada sem alteração.
- **Conferência:**
  - `sync-manifest --check` dá **93/93** (tamanho e sha256);
  - o sha256 do `manifest.json` é igual ao do `MANIFESTO.json` da rodada.
- **Diferença para a 1.1.0-03d2:** só `web/home-sculpture.js` (e o próprio manifesto). Os outros 92 arquivos (posters,
  Jornada, RM, mapa, índices) são byte a byte iguais.
- **Preservadas:** a 1.1.0-03d2, a 1.0.0-03d2 e as anteriores continuam em `public/previa/`.

### 11.2 Integração (só a ponte)

- `REFINADA_PACKAGE` aponta para a 1.2.0-03d2 com `ambient: true`.
- **Uma propriedade nova:** `ambient` do pacote, que chega à configuração da página. Com ela, `HomeOpening.tsx`
  passa `ambient: true` a `createHomeSculpture`.
- **Sem ela, a opção não é passada:** as outras rotas (`/previa`, `/previa/a`, `/previa/b`) e os pacotes de
  comparação mantêm o próprio padrão.
- **O que não mudou:** progresso (`setPassage`), pausa (`setPaused`), movimento reduzido (`setReducedMotion`) e a
  abertura de 900 ms. Aba oculta e saída da tela ficam no próprio módulo.
- **Nada novo no Site:** nenhuma animação em CSS, nenhum contêiner animado e nenhuma mudança de layout, texto,
  enquadramento, poster ou outra animação.

### 11.3 Comportamento (medido na página integrada)

Build de produção. `rAF/s` = quadros pedidos **pelo módulo da montanha** (pilha da chamada).

| Estado | `data-ambient` / quadro | rAF/s do módulo |
|---|---|---|
| Revelação (uma vez por sessão) | sem luz até `data-intro=done`; recarregar na mesma aba não repete a revelação | — |
| 1ª dobra parada (p = 0) | light / light; a luz anda | 60–61 |
| Pausa geral (cabeçalho; menu no celular) | off / none, quadro parado | **0** |
| Retomada | light, com a entrada própria | 60 |
| Aba oculta | off | **0** |
| Entrada da rolagem (p ≈ 0,02) | luz congelada, saindo pelo progresso; ida = volta no mesmo quadro | **0** |
| Passagem (p ≈ 0,66), Jornada, Plataforma (arte fora da tela) | off / none | **0** |
| Retorno ao topo | light de novo, `intro` continua `done`, sem estilo de abertura | 60 |
| Movimento reduzido | poster, sem canvas | **0** |

- **Fora da 1ª dobra:** os rAF que sobram são de outras animações (Jornada), não da montanha.
- **Celular** (390×844 e 390×640) e **1280×600:** mesma regra.

### 11.4 Testes

| Suíte | Resultado |
|---|---|
| refinada, com os 2 testes do contrato antigo substituídos | **40/40** |
| e2e · navegacao · locales · plataforma-fluxo | 29/29 · 17/17 · 6/6 · 10/10 |
| marca-03d2: integridade / layout / contraste / cores | 23/23 · ✔ · ✔ · ✔ |
| previa | 46/48: as mesmas 2 falhas da home `/`, que já existiam |
| Motion `verify-ambiente.mjs` (módulo) | 25/25 |
| Motion `site-ambiente.mjs` na página integrada | **15/15** em `/pt` |

**Nota sobre o `site-ambiente.mjs` em `/`:** lá ele dá 14/15. O script procura o botão pelo rótulo em português
("Pausar animações"), que não existe na página em inglês, e por isso a pausa não é acionada. Conferi em `/` à parte:
a pausa leva a off/none e 0 rAF, e a retomada volta a light com 60 rAF.

**Os 2 testes substituídos em `refinada.mjs`:**
1. **Antes:** "sem luz ambiente em repouso". **Agora:** "luz ambiente só na 1ª dobra parada".
   - Exige `light` e laço do módulo (≥ 15 rAF/s) em p = 0, e a arte mudando.
   - Exige **0 rAF do módulo** e nenhuma luz em:
     - pausa, com o quadro parado;
     - aba oculta;
     - entrada da rolagem (p < 0,04);
     - passagem, Jornada e Plataforma;
     - movimento reduzido.
   - Exige a retomada e o retorno ao topo com luz e sem repetir a abertura.
2. **Antes:** "abertura sem ligar luz ambiente". **Agora:** "revelação uma vez e a luz só depois dela".
   - Nenhuma luz antes de `data-intro=done`.
   - A luz liga depois.
   - Recarregar na mesma sessão não repete a revelação.
   - O resize mantém a composição.

### 11.5 Gravações (fora do repositório)

- **Página integrada em 1440×900 e 390×844:**
  - revelação;
  - 1ª dobra parada com a luz;
  - entrada da rolagem;
  - passagem;
  - volta ao topo;
  - pausa e retomada.
- **Recorte 2× da montanha em 1440:** a luz é discreta de propósito.
- **Antes × depois da 1ª dobra:** 1.1.0 em `a87ed3d` × 1.2.0.
- A presença da luz (discreta o bastante? perceptível?) ainda precisa de **revisão humana em navegador visível e
  monitor real**. O custo em aparelho físico também não foi medido. O Motion mediu em headless sem GPU: ≈ 0,3 ms
  por quadro, 30 q/s de desenho.

### 11.6 Pendências que continuam abertas (separadas, não resolvidas por esta rodada)

1. **Poster da montanha no celular baixo:** é a mesma do §10.6.2. Com movimento reduzido, pausa ou sem JS, 390×640
   mostra o poster `topo` com o sopé cortado, porque não há poster para `alturaUtil`. Pedido ao Motion para uma rodada
   própria.
2. **Ampliação das capturas do fluxo 0.5.0:** é a mesma do §10.6.1. O pico medido foi 2,66× em 1440@2x e 2,97× em
   390@3x. Pedido ao Motion um teto de escala (≤ 2,0 na interface, ≤ 1,75 na imagem médica).
