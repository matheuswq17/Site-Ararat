# Demonstração real do produto — encaixe preparado (rodada 06)

**Estado:** `PRODUCT_DEMO = null` em `lib/product-media.ts`. Não há captura nova do Hub nem do Viewer no
projeto. A Plataforma mostra a faixa de etapas, a captura real atual do Hub (`public/brand/ararat_hub.png`,
v1.0) e o aviso "Capturas do Viewer em preparação". Nada simulado é exibido e nenhum arquivo inexistente é
requisitado. As imagens de `references/imaging/` são RM demonstrativas, **não** telas do produto.

O CTA do topo continua "Explorar a jornada". Só trocar para "Ver demonstração" depois que a demonstração
existir de fato.

## O que o usuário precisa fornecer

Quatro **acontecimentos**, não necessariamente quatro arquivos. Uma mesma captura pode sustentar mais de
um comentário, **desde que** o que o comentário descreve esteja visível nela. Uma captura estática nunca
é usada para sugerir um clique ou um movimento que não foi gravado.

| Acontecimento (`event`) | O que deve estar visível | Arquivo sugerido em `site/public/product/` |
|---|---|---|
| `hub` — Hub | fila de casos com status, indicadores | `01-hub-fila.webp` |
| `caso` — Abrir o caso | o caso selecionado e a ação de abrir/revisar (pode ser a mesma tela do Hub) | `01-hub-fila.webp` ou `02-hub-caso.webp` |
| `viewer` — Séries e máscaras | Viewer com séries/planos e máscara(s) sobrepostas | `03-viewer-series.webp` |
| `revisao` — Revisar a análise | painel de análise, medidas e/ou explicabilidade | `03-viewer-series.webp` ou `04-viewer-analise.webp` |

**Formato:** WebP (ou PNG), 16:9 ou 16:10, **≥ 1600 px de largura** (ideal 1920×1080 ou 1920×1200), janela
inteira do aplicativo, sem barra de tarefas do sistema. Tamanho ideal ≤ 400 KB por arquivo.

**Por material:** dimensões reais, texto alternativo (o que está visível), versão do software, autorização
(quem autorizou e quando, como o usuário informar) e confirmação de casos anonimizados — sem nome, data de
nascimento, ID real ou instituição não autorizada visível.

**Gravação (opcional):** `percurso.mp4` (H.264) e/ou `percurso.webm` (VP9), 20–40 s, sem áudio, 1920×1080
ou 1600×900, ≤ 8 MB, e `percurso-poster.webp` (primeiro quadro). A demonstração funciona só com imagens.

## Como ativar (sem redesenho)

1. Copiar os arquivos para `site/public/product/`.
2. Em `lib/product-media.ts`, preencher `PRODUCT_DEMO`:

```ts
export const PRODUCT_DEMO: ProductDemo | null = {
  authorization: "<quem autorizou, quando>",
  deidentified: true,
  softwareVersion: "<versão mostrada nas telas>",
  media: [
    { id: "hub", src: "/product/01-hub-fila.webp", width: 1920, height: 1080, alt: "<o que está visível>" },
    { id: "viewer", src: "/product/03-viewer-series.webp", width: 1920, height: 1080, alt: "<o que está visível>" },
  ],
  steps: [
    { event: "hub", mediaId: "hub", caption: "<só o que aparece>", focus: { x: 4, y: 18, w: 70, h: 60 } },
    { event: "caso", mediaId: "hub", caption: "<só o que aparece>", focus: { x: 78, y: 70, w: 18, h: 10 } },
    { event: "viewer", mediaId: "viewer", caption: "<só o que aparece>" },
    { event: "revisao", mediaId: "viewer", caption: "<só o que aparece>", focus: { x: 72, y: 8, w: 26, h: 84 } },
  ],
  // video: { ... } — opcional
};
```

- `focus` (opcional) é um contorno estático da área comentada, em **% da captura** (x, y, largura, altura).
- Etapas sem captura podem ser omitidas; a ordem segue `hub → caso → viewer → revisao`.
- `checkProductDemo()` aponta referências quebradas, ordem errada, `focus` fora da imagem, `alt` ou legenda
  vazios.
3. `npm run build`. Com `PRODUCT_DEMO` preenchido, a Plataforma troca a faixa estática + paradas pelo
   `ProductDemo`; sem ele, volta sozinha ao estado atual.

## Comportamento do `ProductDemo` (já implementado e testado no harness)

- **Desktop (≥ 960 px):** quadro sticky limitado ao capítulo (não acompanha a página fora dele) + coluna de
  comentários. A etapa ativa segue a **rolagem normal** (comentário que cruza o centro da tela).
- **Regra clique × rolagem:** o clique seleciona na hora e leva o comentário ao centro; durante essa rolagem a
  seleção por rolagem fica suspensa e volta quando a rolagem para por 160 ms (teto 1,4 s). A seleção clicada
  não se desfaz no caminho.
- **Móvel:** quadro → botões (2×2) → resumo da etapa ativa. Sem sticky, sem rolagem capturada.
- Troca de captura com fade de 220 ms e contorno com transição de 260 ms; em pausa global ou movimento
  reduzido, troca direta. Falha de imagem: aviso local "Captura indisponível no momento."
- Vídeo (se houver): mudo, com controles, só toca visível e nunca com pausa/movimento reduzido.

**Harness:** `ARARAT_HARNESS=1 npm run build && ARARAT_HARNESS=1 npm start`, depois `/teste/produto`
(e `?falha=1`). Usa placas neutras geradas em código, marcadas **TESTE DE LAYOUT**; sem anatomia e sem a
captura do Hub. Fora do harness a rota responde 404.
