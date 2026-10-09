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

1. **Poster no slot menor.** No modo estático (movimento reduzido, pausa, sem JS), o poster de 1100×660 aparece reduzido
   para cerca de 736×442, e o traço fica mais fino. Pedido ao Motion: uma variante do poster para esse slot.
2. **Aproximações do fluxo por etapa:** pedidas ao Motion. Até chegarem, os controles pequenos continuam pequenos.
3. **Plataforma em 1280×600:** a lista de 7 legendas é mais alta que o quadro fixo (601 vs 484 px). Já acontecia na
   base.
4. **`previa`, home `/`:** 2 falhas que já existiam (o teste espera a home aprovada antiga).

## 9. Capturas e gravações

Ficam fora do repositório:
- antes/depois nas mesmas posições: 390 e 1440 em EN/PT por seção; 320, 768, 1280, 1920 e 2560 no topo e no rodapé;
- telas baixas e movimento reduzido;
- publicação;
- Time P&B × natural;
- gravações em 1440 e 390.
