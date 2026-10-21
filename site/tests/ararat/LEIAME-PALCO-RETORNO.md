# Palco do caso na volta pelo histórico — notas de teste

`verifica-palco-retorno.mjs` confere o palco (Model · Hub · Viewer) da Home quando o visitante volta ou avança pelo
histórico. Roda contra a revisão privada, porque o palco precisa da mídia.

## Como a saída da Home é feita nos testes

A saída usa um **clique real de mouse** nas coordenadas do link do cabeçalho.

- O clique do Playwright por seletor (`page.click("header .nav a…")`) rola o link para a vista antes de clicar.
- O cabeçalho é `position: sticky`, e `html` tem `scroll-padding-top: 80px`. Nesse caso o Chromium move a página
  **para cima, cerca de 458 px em 1440×900**, sem alcançar o link, porque o cabeçalho acompanha a rolagem.
- A Home sai, portanto, de outra posição, e a volta restaura essa posição. Daí vinha a diferença 2327 → 1869
  registrada no fechamento anterior.

O mesmo deslocamento acontece quando um controle do cabeçalho **recebe foco**:
- Tab no teclado;
- `focus()`;
- toque emulado no botão do menu no celular (cerca de 434 px em 390×844).

Isso foi medido no Chromium 141 headless e confirmado no Windows em navegador renderizado (−459 px; auditoria de
15/10). O clique real de mouse no desktop não move a página.

**Corrigido em 15/10** (`verifica-foco-saidas.mjs`): o cabeçalho passou a ser `position: fixed` sobre um lugar
reservado (`.cab-lugar`). Elemento fixo não rola a página ao receber foco, e o `scroll-padding-top` do `html`
continua valendo para âncoras e foco no conteúdo. Margens negativas de `scroll-margin` não resolviam: o Chromium
centraliza o controle do cabeçalho sticky de qualquer forma.

## Registros do fechamento anterior, e o que mudou em 15/10

- **Desktop baixo e celular, sem palco (corrigido):** a volta terminava abaixo ou acima da saída.
  - Na saída: foco no cabeçalho ou toque no menu (−434 px).
  - Na volta: o bloco de saídas pendente (duas figuras, 1026–1536 px) encolhia quando o módulo montava (571–588 px).
  - Agora o bloco pendente já tem a geometria do módulo montado, e a posição é a mesma nos 4 momentos.
- **Carga direta em `/pt#cap-hub` (corrigido):** a montagem do palco mudava a altura dos capítulos e a faixa caía no
  Viewer. Agora há uma correção única e síncrona na montagem, só se o visitante ainda não mexeu.
- **Endereço com `#cap-*` (corrigido):** quando a rolagem do visitante leva a outro capítulo, a âncora antiga sai do
  endereço. A volta respeita a posição de saída.
- **Âncora antiga fora do Atlas (corrigido na 3ª rodada de 15/10):** `/pt/pesquisa#fichas`, leitura até 2171, Empresa,
  voltar → voltava a 457, a âncora. Agora a regra é compartilhada (`montarAncoraDeLeitura`, `comum.ts`): a âncora sai
  do endereço quando o visitante rola mais de 48 px. Conferido por `verifica-ancora-historico.mjs`.
- **Indicador pintado (corrigido):** `verifica-palco-retorno` confere cor, fundo e borda calculados dos links, não só
  `aria-current`. Antes, 3–5 quadros mostravam a transição de 120 ms.
- **Falha do módulo de saídas:** o palco monta e desmonta no 1º quadro. Continua igual.
- **Barra de rolagem (fechamento técnico, 15/10):** arrastar o polegar ou usar seta/trilho da barra da página passa a
  contar como leitura (Chromium/Edge). Testado com um Chromium de barras visíveis (`ignoreDefaultArgs:
  ["--hide-scrollbars"]`). Barras sobrepostas (macOS, celular) não são detectáveis por evento.
- **Home em notebooks (fechamento técnico, 15/10):** 1280×600, saída em 4062, volta em 3963 (−99 px): a abertura
  nascia com a geometria do servidor (635 px) e só depois recebia a composição (536 px). Corrigido em `abertura.ts`;
  conferido por `verifica-home-restauracao.mjs` em 1280×600, 1280×720, 1366×768 e 1536×864 (navegação no app).
- **Correção do registro anterior (fechamento da restauração, 15/10):** o que estava escrito aqui — "na carga de um
  documento novo a posição final é a certa" — estava **errado**. Valia para 1280×600; em 1280×720 e 1366×768 a recarga
  terminava 53 e 19 px acima, às vezes acumulando de uma recarga para a outra (Codex, Windows; Motion; e aqui).
  Causas, todas de geometria inicial diferente da final: abertura do servidor mais alta que a faixa; as três vistas do
  Viewer empilhadas até as abas montarem (−1262 px em 1280×720); a marca SVG do Viewer sem largura até carregar
  (+34 px: era o caso sem causa do protótipo do Motion); e, em tela de palco, os capítulos na sequência até o palco
  montar (salto visível de 24–280 px ao recarregar no meio dos capítulos em 1536×864). Corrigido na origem (ver
  `EDITAR-ARARAT.md`, "Documento novo"); conferido por `verifica-home-documento-novo.mjs`.
- **Restauração do próprio Chromium (não é da página):** numa cópia estática do DOM final, sem nenhum script nem fonte
  carregada, a recarga também termina alguns px fora em certas posições: em 1536×864, 4062 → 4066; em 1366×768,
  1500 → 1482, 2700 → 2682 e 3600 → 3582; ±1–4 px em outras. O mesmo acontece em `/pt/pesquisa`. A suíte compara a
  página viva com essa cópia e registra o desvio à parte. A ancoragem de rolagem continua ligada.
