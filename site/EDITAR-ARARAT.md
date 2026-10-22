# Guia de edição — site ARARAT integrado (branch `portfolio-site-v1`)

App Next.js em `site/`. A experiência nova ocupa `/` (inglês, principal), `/pt` e `/es`. As versões de comparação continuam em `/previa/…`.

## Onde fica cada coisa

| Quero mudar… | Arquivo |
|---|---|
| Um texto (qualquer página) | `site/lib/ararat/conteudo/en.ts`, `pt.ts`, `es.ts` — mesmas chaves nos três |
| Endereço de uma página | `site/lib/ararat/rotas.ts` (e a pasta da rota em `site/app/(en)`, `site/app/pt`, `site/app/es`) |
| Uma captura (Hub, Viewer, camadas) | `site/lib/ararat/midia.ts` (manifesto: tamanho, tipo, permissão) |
| Foto da equipe | `site/public/ararat/time/` + `FOTOS` em `midia.ts` + `equipe` no conteúdo |
| Estilo comum | `site/styles/ararat/site.css` (base do Atlas) e `integracao.css` (páginas internas) |
| Tipografia | Source Sans 3: títulos Light 300; leitura e controles Regular 400. Arquivos locais e licença em `site/public/ararat/fontes/`; preload/sincronismo em `Cabeca.tsx` |
| Estrutura de uma página | `site/components/ararat/` (`Home`, `Plataforma`, `Solucoes`, `Evidencias`, `Empresa`) |
| Comportamento (montanha, camadas, palco, demonstração, biografia) | `site/lib/ararat/cliente/` |
| Título, descrição e Open Graph | `meta` no conteúdo (todas as páginas, inclusive a Home: `meta.home`); montagem em `site/lib/ararat/metadados.ts` |

## Regras que o próprio build confere

- **Idiomas:** `pt.ts` e `es.ts` têm o tipo do `en.ts`. Faltou uma chave, ou uma lista mudou de tamanho num idioma só? O `npm run build` (typecheck) falha e diz onde.
- **Mídia:** toda captura real está como `permissao: "pendente"` e fica em `public/privado/`, fora do Git. Enquanto houver captura pendente, a variante pública usa uma composição própria para texto (`comCapturas()` em `midia.ts`; textos em `semMidia` nos três idiomas): sem demonstração, sem descrições de tela, sem avisos de régua e sem frases como "mostrado nesta página".
- **Fronteira de publicação:** `lib/ararat/exposicao.json` lista o que a variante pública serve (páginas novas, `/ararat/`, a montanha 1.2.1-03d2 e `/_next/`) e classifica cada pasta de `public/`. O `proxy.ts` responde 404 (`x-ararat-bloqueio: fora-da-publicacao`) a todo o resto: `/privado`, `/previa/*`, `/teste/*`, `/refinada`, `/product`, `/institucional`, `/brand`, `/marca-*`, `/motion`, `/imaging`, também com maiúsculas trocadas, `..` ou via `/_next/image`. Nada foi apagado; na revisão privada tudo responde.
  - Depois do build, `scripts/ararat-verificar-midia.mjs` falha se qualquer saída referenciar `/privado/`, se uma página liberada usar caminho bloqueado ou se surgir pasta nova em `public/` sem classificação.
  - Contra o servidor: `node tests/ararat/verifica-exposicao.mjs http://127.0.0.1:PORTA --publico` pede cada arquivo de `public/` e cada rota do build.
  - Para expor uma versão anterior de propósito: incluir o prefixo em `publico.prefixosArquivos` (ou `paginas`) do `exposicao.json` e mudar a classificação da pasta — decisão do responsável.

## Tarefas comuns

1. **Trocar um texto:** editar a chave nos três arquivos de conteúdo. O espanhol ainda não teve revisão nativa.
2. **Mudar um estágio:**
   - editar o valor em `estagio`, `prostata.componentes[…].estagio` ou nas `fichas`, sempre com a fonte;
   - não promover "desenvolvido" a "validado";
   - a validação externa é dita só no nível da frente de próstata.
3. **Liberar uma captura** depois da permissão por escrito:
   - em `midia.ts`, mudar `permissao` para `"publica"`;
   - mover o arquivo para `site/public/ararat/capturas/` e versionar.
4. **Ver localmente:** `docs/review/atlas-integracao-2026-10-14/abrir-revisao.cmd` serve as duas variantes em 127.0.0.1 (revisão privada e variante pública) e confere a fronteira.
5. **Preview na Vercel:**
   - Root Directory `site`, install `npm ci`, build `npm run build`;
   - nunca definir `ARARAT_REVISAO_PRIVADA` num ambiente aberto;
   - promover para produção só por pedido explícito.
6. **Domínio definitivo:** quando houver, definir `ARARAT_SITE_URL`. Isso ativa canonical, `og:url` e hreflang absolutos. Retirar `noindex` só na publicação aprovada (`metadados.ts`).

## Tipografia (22/10/2026)

- Source Sans 3 substitui Lora/Inter no site novo: Light 300 nos títulos editoriais e Regular 400 em leitura e controles. Ênfases e rótulos pequenos mantêm pesos reais de 500 a 700.
- WOFF2 variável latino (28.872 bytes) e latino estendido (60.088 bytes), hospedados no próprio site, licença SIL OFL. Origem e referências em `public/ararat/fontes/README-SourceSans3.md`. Sem Adobe Fonts ou CDN em execução.
- O `<head>` espera a família/pesos novos antes das medidas da abertura e do SplitText. O ritmo das animações, os pacotes e a marca SVG não mudam.
- O token histórico `--serif` continua como alias dos títulos, agora apontando para a família sans-serif escolhida. Lora e Inter permanecem em disco para preservar as versões anteriores; não são preloaded no site novo.
- Na abertura, os limites de largura do título e da descrição usam `10em` e `28em`, equivalentes às larguras anteriores. Não voltar aos `16ch`/`44ch` da fonte antiga: o glifo zero é mais estreito nesta família e mudava a composição da montanha. O teste de movimento público confere a mesma composição da produção em 7 janelas, nos três idiomas.
- Ao trocar fontes, conferir quebras, máscaras, acentos, idiomas, zoom e restauração no navegador. Não copiar quebras de linha da fonte anterior nem compensar a rolagem por script.

## Textos e SEO (21/10/2026)

- Cada página tem uma intenção própria em `meta` (título e descrição): Home = empresa e foco; Soluções = frentes
  clínicas; Próstata = segmentação prostática, lesões suspeitas e PI-RADS; Plataforma = preparação do caso e revisão
  pelo radiologista; Evidências = o que cada estudo avaliou. Não repetir o mesmo texto entre páginas.
- `extra.tituloHome` saiu: a Home usa `meta.home`, como as demais (antes o título vinha de `extra.tituloHome` e a
  descrição de `abertura.sub`).
- Próstata: `prostata.pesquisa` é uma linha de pesquisa (imagem + dados clínicos), separada dos quatro componentes e da
  categoria PI-RADS; estágio `investigacao`, sem números. Em Evidências, a ficha `risco` e o campo "Aplica-se a" de
  cada estudo.
- Estágio `novo` = "Em aprimoramento" (classificador PI-RADS: primeira versão treinada, sendo refeita).
- Não publicar números de desempenho, nem como disponíveis: PI-RADS funcional, justificativa por componente, risco
  calibrado, recomendação de biópsia, laudo pronto para assinatura ou tempo de processamento.
- `noindex` continua em todas as páginas; canonical/hreflang absolutos e sitemap dependem de `ARARAT_SITE_URL`.

## Movimento: transição entre páginas e montanha (revisão privada, 14/10/2026)

- **Transição entre páginas (candidata):** `components/ararat/EntradaPagina.tsx` + `styles/ararat/transicoes.css`.
  - Na navegação no app, o conteúdo de cada seção entra em 180 ms (opacidade e 6 px); o fundo das seções aparece inteiro.
  - Voltar/avançar: só opacidade. Carga direta, idioma, âncora na mesma página, reduzido e pausa: sem entrada.
  - Aprovada e ativada também na variante pública; `?transicao=atual|candidata` compara apenas na revisão privada.
- **Montanha:** pública usa `MONTANHA_APROVADA` (1.3.1, repouso de 5 s); a revisão mantém a 1.2.1 como base de comparação.
  - A candidata do Motion `1.3.1-03d2-candidato` (20/10: repouso de 5 s entre passagens de luz, contado do fim
    completo da passagem; o resto igual à 1.3.0) fica em `lib/ararat/montanha-candidata.ts`, que só o servidor importa
    e que vale só na revisão privada. A anterior `1.3.0-03d2-candidato` fica no mesmo arquivo só para comparação.
  - Escolha com `?montanha=estavel|candidata|anterior`, guardada na aba.
  - Pacotes em `public/previa/home-montanha-1.3.1-03d2-candidato/` (módulo `014e0257…`, manifest `798b37d0…`) e
    `public/previa/home-montanha-1.3.0-03d2-candidato/` (`1ef10fb2…`): sem alteração; os posters vêm da estável.
  - A 1.3.1 está liberada na pública, com os bytes originais intactos. A 1.3.0 permanece bloqueada; capturas e rotas anteriores também.
  - Comparação do repouso: `tests/ararat/verifica-montanha-repouso.mjs`.
- Nova versão do Motion: novo acordo em `docs/coordination`, cópia do commit dele, conferência do sha256 do módulo e do manifesto, e atualização de `montanha-candidata.ts`.

## Cabeçalho, foco e bloco de saídas (15/10/2026)

- **Cabeçalho:** `.cab` é `position: fixed` sobre `.cab-lugar`, que reserva a altura `--head`.
  - Não volte a `sticky`: com `scroll-padding-top` no `html`, o foco num controle do cabeçalho sticky faz o Chromium
    rolar a página ~460 px.
  - Conferido por `tests/ararat/verifica-foco-saidas.mjs`.
- **Bloco de saídas (Model):** com JS e o módulo ainda pendente, mostra a 1ª camada no tamanho do módulo, com as abas
  reservadas, o aviso e a legenda.
  - Sem JS, com falha ou passados 4 s (`camadas.ts`): as duas figuras em sequência.
  - Se mudar o módulo ou o tamanho lógico (374×380), mude também as regras "pendente" em `site.css`.
- **Palco do caso:**
  - restauração pelo histórico sem troca cruzada e sem a transição do indicador;
  - `#cap-*` na carga é respeitado;
  - a âncora sai do endereço quando o visitante rola para outro capítulo.
- **Âncora de leitura (todas as páginas, `montarAncoraDeLeitura` em `comum.ts`):** depois que o próprio visitante rola
  mais de 48 px (roda, toque, teclas), a `#âncora` sai da entrada atual do histórico (replaceState; path, query e
  history.state ficam). Assim, voltar/avançar devolve a posição de leitura, e não a âncora. Carga direta, links para
  seções, idioma sem leitura e hash sem alvo não mudam. Conferido por `tests/ararat/verifica-ancora-historico.mjs`.
  - Também conta como leitura apertar o botão na barra de rolagem da página (Chromium/Edge: `pointerdown` no `<html>`
    fora da área do documento) e o botão do meio. Barras sobrepostas (macOS, celular) só por roda, toque e teclado.
- **Abertura (Home) na volta pelo histórico:** `abertura.ts` guarda o decisor de composição (puro, por URL do módulo
  de composição) e o aplica NA MONTAGEM quando já existe; a medida é sempre nova (janela, cabeçalho, texto do idioma).
  Assim a abertura nasce na altura final antes de o navegador devolver a rolagem. Conferido por
  `tests/ararat/verifica-home-restauracao.mjs` (inclui o rodapé de cada variante).
- **Documento novo (recarga, volta vinda de outro site sem bfcache):** não há decisor em memória, e o navegador
  devolve a rolagem antes de o JS montar. Por isso a geometria INICIAL já é a final, sem guardar nada:
  - abertura (desktop ≥ 900): antes da composição, `site.css` limita a altura à faixa e o poster ocupa o espaço que
    sobra ao texto (`.hero:not([data-composta])`; `aplicar()` marca `data-composta`). Nada é recortado;
  - Viewer: com JS, só a 1ª vista aparece até as abas montarem (`.vistas:not([data-abas])`);
  - marcas dos capítulos com `width`/`height` (a largura da marca SVG mudava o cabeçalho de 1 para 2 linhas);
  - palco (≥ 1024×820): `data-palco="pendente"` no servidor quando há o bloco de saídas; os capítulos já ficam na
    geometria do palco e cada mídia fica visível ao lado do seu capítulo até ir para o palco. `caso.ts` troca por
    `ativo` ou retira (tela menor, bloqueio, falha).
  - Se mudar a altura da abertura, as abas do Viewer, as marcas ou a grade do palco, mude também essas regras.
  - Conferido por `tests/ararat/verifica-home-documento-novo.mjs`, contra uma cópia estática do DOM final: o desvio
    que sobra é o da própria restauração do Chromium (registrado à parte, aparece também sem nenhum script).
- **Entradas editoriais (candidato; `lib/ararat/cliente/entradas.ts`):** só na revisão privada, com
  `?editorial=candidato` (guardado na aba; `?editorial=atual` volta ao padrão). Dois momentos da Home: fio cobre e
  título do caso (sobe 8 px, 4 no celular); fio e título da evidência (só aparece). CSS puro (`@keyframes` em
  `site.css`, bloco "Entradas editoriais"); o módulo só marca `data-entrada` (espera/entra) num grupo ainda abaixo da
  janela. Sem biblioteca. Os conectores do esquema ficam parados. Nada escondido por padrão; nunca na restauração,
  com âncora, pausa ou movimento reduzido; uma vez por aba; prazo de 1,5 s se o IntersectionObserver não responder.
  Conferido por `tests/ararat/verifica-entradas-editoriais.mjs`.
- **Montanha: poster OU canvas (19/10/2026):** `site.css` esconde o `picture` do poster com `data-montanha=canvas` e o
  `.hero-host` com `data-montanha=poster` (`visibility`, nunca `display:none`: a composição mede `.hero-arte`). O
  servidor entrega `poster`; `abertura.ts` marca `canvas` dois quadros depois de criar o módulo (o canvas já tem o
  quadro completo) e volta a `poster` na falha e no `destroy`. Sem JS ou em falha, só o poster. Pacotes intactos.
  - 20/10: o módulo monta com `intro: false` (o poster completo já está pintado; com ele oculto, a abertura fazia a
    montanha completa sumir e recomeçar). Abertura visível = decisão do proprietário/Motion.
  - A troca de arquivo do poster para a composição decidida só acontece depois de o novo arquivo estar decodificado
    (antes, alguns quadros ficavam sem arte). Conferido por `tests/ararat/verifica-montanha-sequencia.mjs`.
- **Títulos por linhas (`lib/ararat/cliente/textos.ts`, GSAP 3.15.0 core + SplitText):** padrão na variante pública.
  Na revisão privada, `?texto=gsap` compara com `?texto=atual` (guardado na aba; padrão privado preservado). Substitui
  as entradas editoriais e a E2 nesses títulos.
  - Alvos marcados com `data-texto`: `h1` (Home, Plataforma, Soluções, Próstata, Tireoide, Evidências, Empresa) e
    `titulo` (Home: caso e evidência). Nada mais se move. Novo alvo = acrescentar o atributo (e rever o teste).
  - Valores em `PARAMETROS` (textos.ts): h1 780 ms/linha, 105 ms entre linhas; títulos 680/85; celular (< 900 px)
    700/90 e 620/75; yPercent 108 → 0 mais uma folga de .3em (nada aparece pela margem da máscara antes da subida), opacidade .15 → 1, `power3.out`.
  - O `<head>` (`Cabeca.tsx`) segura o h1 numa carga elegível; prazo só de CSS de 2,5 s (`site.css`, bloco "Títulos por
    linhas"). Divide depois das fontes, da composição e, na Home, da montanha; resize, fonte tardia, recomposição,
    pausa, reduzido, âncora e saída terminam completos e desfazem a divisão.
  - Revisão: caixa fixa "Rever entrada" / "Ver atual". Teste: `tests/ararat/verifica-textos-linhas.mjs`.
  - Ativação pública preparada em 21/10 após aprovação do ritmo. Sem promoção de mídia, sem retirar noindex e sem autorização de deploy implícita.
- **Rodapé:** o crédito "Imagens: coleção PROSTATEx…" só aparece se alguma captura pode ser exibida na variante
  (`rodape.aviso`); sem capturas, `rodape.avisoSemImagens` (só a frase da revisão pelo radiologista).

## Variáveis de ambiente

| Variável | Efeito |
|---|---|
| `ARARAT_REVISAO_PRIVADA=1` | Revisão local: capturas reais, demonstração e parâmetros de teste (`?ritmo=atual`, `?saidas=falha`, `?io=0`, `?demo=falha`, `?montanha=falha\|estavel\|candidata\|anterior`, `?camadas=fade/duplo`, `?e2=1`, `?editorial=`, `?texto=atual\|gsap`). **Nunca em Preview aberto.** |
| `ARARAT_SITE_URL` | Domínio confirmado (ainda não existe) |
| `ARARAT_BUILD_DIR` | Pasta do build (o abridor usa `.next-revisao` e `.next-publico`) |
| `ARARAT_RAIZ_DEPENDENCIAS` | Raiz do Turbopack quando `node_modules` é junção/link para outro checkout (o abridor define, ex.: `C:\mvp_ararat_site`). Sem a variável, nada muda |
