# Entradas editoriais de títulos e links — quatro alternativas

**Pedido:** animações discretas nos títulos e links das quatro alternativas (Original, Canônica, Sinal e 03D2 editorial
com luz ambiente), para dar ritmo à leitura sem tirar o protagonismo da montanha e das demonstrações.

**Branches de trabalho** (uma por alternativa). As de comparação ficam intactas:

| Alternativa | Branch de trabalho | Origem |
|---|---|---|
| Original | `codex/titulos-movimento-original-v1` | `main` @ `3d55f7c` |
| Canônica | `codex/titulos-movimento-canonica-v1` | `experiment/brand-canonical-v1` @ `89468c1` |
| Sinal | `codex/titulos-movimento-sinal-v1` | `experiment/brand-sinal-v1` @ `0063ba3` |
| 03D2 | `codex/titulos-movimento-03d2-v1` | `codex/brand-03d2-editorial-ambient-v1` @ `c082851` |

## 1. O que foi feito

**Um só sistema.** O site já tinha um sistema de revelação, o `TextReveal`. Ele animava os títulos **palavra por
palavra** e o primeiro parágrafo de algumas seções. Em vez de criar um segundo sistema, ganhou um modo `editorial`,
ligado só na refinada (`"/"`, `"/pt"`, `/previa/refinada`). As outras rotas, como `/previa/original`, ficam como
estavam.

**Arquivos compartilhados** (idênticos nas quatro branches): `components/motion/TextReveal.tsx`,
`components/motion/entrada-editorial.css` e a linha que liga o modo em `PreviewPage.tsx`.

**Por identidade:** só os valores e o que existe naquela identidade.
- Original: `refinada.css`;
- Canônica: `marca-canonica.css`;
- Sinal: `marca-sinal.css`;
- 03D2: `marca-03d2.css`.

| Efeito | Comportamento |
|---|---|
| Títulos de seção | Passagem, Plataforma, Explicabilidade, Ciência, Time, FAQ e Contato. Entram como **bloco**: 12 px + opacidade, 450 ms, curva de saída da identidade, sem overshoot. Uma vez por carregamento. As palavras (`.rw`) ficam paradas |
| Rótulos pequenos | Os 6 rótulos de seção ("Platform", "Science", "Team"…) entram primeiro; o título entra 70 ms depois. Os dois têm um só gatilho. O parágrafo de abertura mantém a entrada que já tinha; nenhum outro parágrafo entra em sequência |
| "You decide." / "Você decide." | Só no **Sinal** e na **03D2**, onde a frase existe. A linha é revelada uma vez, de baixo para cima, por `clip-path`, durante a abertura (uma vez por aba). Esta animação **substitui** a entrada da linha, sem se somar a ela. Não ocupa espaço e não corta letras. As ações e a nota ficam visíveis desde o 1º quadro (no Sinal isso passou a valer também) |
| Pergunta estudada (Ciência) | O **filete que a identidade já desenha** junto ao bloco se desenha de cima para baixo: na 03D2, o filete da própria pergunta; no cartão da publicação, ouro na Original, cobre na Canônica e 1 px na Sinal. Largura e cor vêm do estilo calculado. O estado final é **idêntico pixel a pixel** ao atual. Publicação, DOI, avisos e as quatro frases com a montanha não mudam |
| Links principais | Os dois links textuais do FAQ, nas quatro, e o link com seta da 1ª dobra, só na 03D2 (nas outras é um botão). O sublinhado vai de 1 px para 2 px e a seta avança 3 px, com cursor **ou** foco de teclado, em 160–200 ms. O anel de foco da identidade não muda. Navegação, rodapé, créditos e controles das demonstrações ficam de fora |

**Valores por identidade:**

| Identidade | Curva | Links |
|---|---|---|
| Original | `--ease-out` | 180 ms |
| Canônica | `--ease-out` | 180 ms |
| Sinal | `--ararat-ease-out` | `--ararat-dur-product` (160 ms) |
| 03D2 | `--ararat-easing-enter` | `--ararat-duration-base` (200 ms) |

## 2. Regras de movimento e acessibilidade

- **O HTML do servidor não esconde nada.** As marcas são postas no cliente, e só em blocos que ainda estão **abaixo**
  da tela.
- **Sem JS ou falha na inicialização:** tudo visível.
- **Pausa geral e movimento reduzido:** estado final imediato.
- **Pausa no meio de uma entrada:** completa a apresentação na hora.
- **Âncoras:** hash ao carregar, clique em link interno ou `hashchange` deixam a seção de destino pronta, sem esperar a
  entrada.
- **Foco:** um elemento que recebe foco fica visível na hora.
- **Efeitos fora:** sem blur, máquina de escrever, letras ou palavras separadas, movimento contínuo, efeitos ligados
  ao cursor ou captura da rolagem.
- **Sem laço:** só animações de uma vez; nenhuma fica rodando em repouso.
- **Módulos intactos:** montanha, Jornada, Ciência, Time e Hub/Viewer não foram tocados.

## 3. Validação (build de produção, Chromium headless)

**Checagem própria das entradas: 18/18 em cada alternativa.** Cobre:
- HTML inicial sem marcas;
- sem JS;
- 7 títulos em bloco, 6 rótulos e 1 fio;
- entrada e assentamento;
- retorno sem repetir;
- repouso sem animação;
- pausa no meio da entrada, pausa, reduzido;
- `/#ciencia`, clique no menu, foco e cursor no link;
- EN/PT, desktop e celular (títulos de 1 e 2 linhas), sem rolagem lateral.

**Deslocamento de layout:** CLS da rolagem igual ao de cada base (0,0015–0,0016, que já existia).

**Fio da pergunta:** 0 pixel diferente no estado final, nas quatro.

**Curvas medidas na 03D2:** o rótulo sai de 12 px e opacidade 0; o título começa cerca de 70 ms depois; os dois
assentam em cerca de 450 ms, sem overshoot.

**Suítes existentes, comparadas com cada base:**
- Rodadas sozinhas, sem outra suíte em paralelo, dão o mesmo resultado da base. Exemplos: `navegacao` 17/17 nas oito
  execuções; `refinada` Original 42/42; `e2e` 29/29.
- As falhas que sobram existem igual na base:
  - `previa`: home `/`;
  - Time e Ciência nas branches antigas;
  - `locales` da Original e da Canônica para no retrato do Time com 404, igual na base. É o bug do palco oculto,
    corrigido só na linha editorial. O `contrast.mjs` da Original tem a porta 3000 fixa e não foi rodado;
  - na 03D2, só as 2 falhas antigas da `previa`.
- Rodadas em paralelo, várias medições de tempo por quadro falharam também na base. **Não foram afrouxadas.**

## 4. Pendências

- **Revisão em navegador visível e monitor real:** o ritmo e a discrição precisam de olho humano.
- As pendências da 03D2 (poster da montanha no celular baixo e ampliação das capturas do fluxo) continuam como
  estavam. Não fazem parte desta rodada.
