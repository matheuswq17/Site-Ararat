# Para o Motion — animações do site na identidade ARARAT Sinal (`experiment/brand-sinal-v1`)

**De:** Site · **Base funcional:** `3d55f7c` · **Data:** 08/10/2026
**Branch do Motion:** `experiment/brand-sinal-motion-v1` · **Entrega:** pacotes novos em `motion/brand-sinal-v1/`.
Cada pacote deve ter versão própria, manifesto (tamanho + SHA-256) e uma nota do que mudou só na aparência.
Não sobrescreva `home-montanha-0.7.0-draft`, `topo-revisao-0.3.0`, `plataforma-fluxo-0.1.0` nem
`time-interativo-0.2.0`. O Site integra só pacotes reais, copiando para pastas novas e conferindo os hashes.
Um stub nunca será apresentado como resultado final.

## Referência visual (somente referência)
- Pacote `ARARAT_Sinal_Brand_System_v1.0` (zip `8c6caf54…0190d`): `00_LEIAME.md`, `02_tokens/`,
  `06_motion/janelamento-*.html|mp4` (assinatura animada) e o brand book "ARARAT Sinal".
- Os mockups de `07_aplicacoes` não são evidência de funcionalidade e não devem ser copiados (score 0,612,
  contribuições +0,28, IDs, W/L).

## Regras do Sinal que valem para as animações
1. **Só cinza.** Escala `gray-5 #111111 … gray-97 #F6F6F6` em passos iguais de L*. Sem navy, ouro, cobre,
   sage, gradiente ou brilho decorativo. Matiz só nas cores clínicas, dentro do produto.
2. **O sinal é o ponto.** O branco puro (`#FFFFFF` no escuro) só no ponto do símbolo e no "acender" do
   janelamento. O símbolo e o ponto **nunca** entram no viewport nem sobre a RM.
3. **Motion de marca:** janelamento de contraste. Abertura em 1,4 s com `cubic-bezier(0.65, 0, 0.35, 1)`.
   No produto: 120–200 ms, sem brilho. Movimento reduzido = quadro final.
4. **A montanha do hero reutiliza o terreno existente** (montanha B, mesmo relevo, mesma API), adaptado a
   tons de cinza e à ideia de janela/nível: abrir o contraste em vez de luz dourada. Não pode virar cones,
   triângulos ou foto. O arco dourado de foco precisa de uma solução em cinza, ou sair.

## Fundos e tokens
| Papel | Valor |
|---|---|
| Fundo das seções escuras (hero, Jornada, Plataforma, Explicabilidade, FAQ, Contato) | `#111111` (gray-5, bg) |
| Superfícies / elevada | `#1B1B1B` (gray-10) / `#303030` (gray-20) |
| Fio decorativo / essencial | `#303030` / `#777777` (gray-50, ≥ 3:1) |
| Títulos / corpo / secundário | `#E2E2E2` / `#C6C6C6` / `#919191` |
| Dado positivo / negativo / eixo | `#C6C6C6` / `#777777` / `#777777` |
| Seções claras (Ciência, Time) | fundo `#F6F6F6` (gray-97), texto `#111111`, corpo `#303030`, secundário `#5E5E5E` |
| Fonte para rótulos desenhados | Geist Mono 500, 11 px, caixa alta, tracking 0,14 em, numerais tabulares |

## Onde ainda há ouro/navy (fixo nos pacotes atuais, sem alteração pelo Site)
- `home-montanha-0.7.0-draft`: `home-sculpture.js` (arco e luz dourados, `#EAD28A`, `#F5F7FA`) e `journey.js`
  (`COLORS.navy`, `navy950`, `gold`, `gold400`: vinheta navy em volta da RM, contornos/ROI dourados);
  `journey.css` (fundo `.ararat-journey` navy; `__topo` `#B0B8C1`).
- `topo-revisao-0.3.0`: traço "ouro" da decisão (`#D4AF37`, `#D9B23A`). O Site já pinta a frase da decisão
  em gray-5 (antes estava em gray-40).
- `plataforma-fluxo-0.1.0`: realces da medida e cursor em ouro e navy translúcido. As capturas reais NÃO
  mudam (cores clínicas originais preservadas).
- `time-interativo-0.2.0`: pontos `#0D1B2A`. O Site aplica P&B por CSS (`filter: grayscale(1)`) no
  retrato, de forma reversível. Se preferirem, os pontos podem vir por `opts.pontos.cor` (`#111111`/`#303030`).

## O que o Site já faz sem tocar nos pacotes (enquadramento provisório)
- `coverColor: "#111111"` na criação da escultura (parâmetro existente).
- Fundo do contêiner `.ararat-journey` = `#111111` por CSS do Site, só no contêiner.
- Nenhum arquivo de pacote foi alterado; os manifestos continuam válidos.

## Medidas reais na identidade Sinal (rota "/")
| Tela | Bloco de texto do hero (y, altura) | Slot da arte (x,y · w×h) | Quadro da Jornada | Palco da Plataforma | Fechamento da Ciência | Retrato do Time |
|---|---|---|---|---|---|---|
| 320×700 | 86 · 367 | 0,469 · 320×256 | 280×350 | 280×509 | 320×180 | acordeão |
| 390×844 | 98 · 453 | 0,575 · 390×312 | 350×438 | 350×674 | 390×206 | acordeão |
| 768×1024 | 161 · 355 | 0,563 · 768×461 | 691×576 | 691×874 | 768×276 | acordeão |
| 1280×800 | 136 · 420 | 90,596 · 1100×660 | 646×538 | 834×684 | 1280×384 | 440×550 |
| 1440×900 | 144 · 459 | 170,643 · 1100×660 | 766×638 | 976×784 | 1440×432 | 440×550 |
| 1920×1080 | 158 · 473 | 410,672 · 1100×660 | 868×723 | 1000×964 | 1920×576 | 440×550 |
| 2560×1440 | 221 · 473 | 730,780 · 1100×660 | 868×723 | 1000×1324 | 2560×768 | 440×550 |

O texto do hero agora é **alinhado à esquerda**, com a mensagem em três linhas ("Contrast is information. /
We measure. / You decide."). O arco e os cumes não podem ficar sob as linhas de texto. Cabeçalho fixo: 72 px.

## Contratos que não mudam
- O progresso vem do Site (rolagem): a mesma posição dá o mesmo estado, e o movimento é reversível. O Site
  continua dono do cálculo, do teclado e das âncoras.
- Pausa global (`html[data-motion=paused]` / `setPaused`), movimento reduzido (quadro final), aba oculta e
  fora da tela param; nada é redesenhado em repouso (0 mutações).
- Carregamento e falha: 404 do módulo ou dos assets → estático coerente, sem erro de console.
- Plataforma: 7 etapas, T2 + ADC, medida demonstrativa, "Revisão pendente". Nada de score, máscara, XAI,
  validação clínica ou exportação.
- A RM e as capturas não recebem filtro, símbolo nem ponto.

## Observação herdada (rodada canônica)
O teste "Time · enquadramento final" é sensível à posição subpixel do retrato (na main ele reprova se a
seção estiver deslocada 0,2 px). Vale alinhar o quadro final ao pixel no módulo.

## Retorno da integração (`99c91c8`, 08/10/2026)
Pacotes integrados sem alteração: montanha 0.9.0-sinal, topo-revisao 0.5.0-sinal, time-interativo 0.4.0-sinal,
plataforma-fluxo 0.3.0-sinal. Os manifestos conferem, e os verificadores de Ciência (54/54), Time (20/20) e
Fluxo (28/28) aprovam contra a página integrada. Dois testes do Site seguem reprovando, com os limites mantidos:
1. **Time · enquadramento final** (0,1 %): a posição y fracionária do retrato difere entre o modo normal e o
   reduzido (0,266 × 0,938 px), e a reamostragem subpixel gera ≈ 7,6 % de canais diferentes. O conteúdo é igual.
   Pedido: alinhar ao pixel inteiro o quadro final do módulo (ou expor uma opção para isso).
2. **Ciência · continuação** (> 0,05 % por passo em ≥ 6 de 8): na 0.5.0-sinal a crista está completa desde
   e = 0, e os três primeiros passos mudam só 0,02–0,05 %. Pedido: avaliar se a abertura de contraste pode
   progredir ao longo das etapas (por exemplo, o nível/janela da crista) para que a continuação seja perceptível.
