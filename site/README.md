# ARARAT MODEL — site (primeira entrega local)

Next.js (App Router) + TypeScript + CSS Modules sobre os tokens de marca.
Território do Claude Site. Status e decisões: `../docs/coordination/status-site.md`.

## Rodar

```bash
npm ci            # use npm ci também ao trocar de sistema operacional (binários nativos)
npm run dev       # http://localhost:3000
# ou
npm run build && npm start   # produção local em http://localhost:3000
```

## Motion (contrato v1)

```bash
npm run motion:sync          # copia ../motion/deliverables (somente status "ready") para public/motion
npm run build                # o build detecta public/motion/manifest.json
npm run motion:sync -- --clean   # remove o pacote e volta à cena estática
```

Sem pacote, a jornada usa a cena estática própria (`components/journey/JourneyMriScene.tsx`) sobre a RM
demonstrativa do site (`public/imaging/mri-axial-demo.webp`). Com pacote ready que traga
`assets/mri-base.webp` + `assets/mri-map.json`, hero, jornada e explicabilidade passam a usar essa base e
as máscaras do Motion (`lib/mri.ts`, `readMriSource()`): uma fonte, uma geometria.
O módulo é importado em tempo de execução (`import(/* webpackIgnore */ "/motion/web/journey.js")`),
só quando a seção se aproxima da viewport; falhas mantêm a cena estática.

## Testes funcionais

Requer Chromium do Playwright (`npx playwright install chromium`) e servidor em :3000.

```bash
MODE=absent npm run test:e2e                     # build normal; sonda o servidor e declara "pacote=presente|ausente"
# (pacote ausente de verdade: build de uma cópia do site sem public/motion — não apague public/motion)

npm run motion:sync -- --from tests/fixtures/mock-motion
ARARAT_HARNESS=1 npm run build && npm start      # habilita /teste/ponte (montar/desmontar)
MODE=fixture npm run test:e2e
npm run motion:sync -- --clean && npm run build  # volta ao build normal

npm run motion:sync -- --from tests/fixtures/mock-motion-mri   # mapa de teste (alinhamento)
npm run build && npm start
MODE=fixture-mri npm run test:e2e

npm run motion:sync -- --from tests/fixtures/mock-motion-v11  # rótulos por evento + atmosfera (adendo v1.1)
ARARAT_HARNESS=1 npm run build && npm start
MODE=v11 npm run test:e2e

# pacote real integrado (build com ARARAT_HARNESS=1):
node tests/motion-smoke.mjs
node tests/real-v11.mjs screenshots/<pasta>     # rótulos/atmosfera do pacote real em 1440/768/390
node tests/record-intro.mjs screenshots/<pasta> # vídeo .webm da abertura + scroll
# capturas comparáveis (VIEWPORTS=1440x900,768x900,390x844,360x780; BLOCK_MOTION=1 força a cena estática):
node tests/capture-review.mjs screenshots/<pasta>
SLOW=1 node tests/record-intro.mjs screenshots/<pasta>  # abertura em carga fria com rede lenta (CDP)

# build de produção (sem harness) em :3000:
node tests/load-timing.mjs slow|fast   # quando chegam título, logo e RM do hero (carga fria, rede limitada)
node tests/contrast.mjs                # contraste calculado das cores computadas (alfa composto sobre o fundo)
node tests/r06.mjs                     # rodada 06: cabeçalho 320/360/390, passagem, Plataforma sem mídia, leitura guiada, Ciência, Contato, hash, aviso da RM
HARNESS=1 node tests/r06.mjs           # + ProductDemo no harness (build e start com ARARAT_HARNESS=1)
node tests/capture-sections.mjs screenshots/<pasta>  # seções + cabeçalho 320/360/390
node tests/record-route.mjs screenshots/<pasta>      # vídeo do percurso Jornada → Contato
PATHNAME=/previa node tests/record-intro.mjs screenshots/<pasta>  # entrada + passagem da /previa (SLOW=1 = rede lenta)
```

Com `ARARAT_HARNESS=1` (no build **e** no `npm start`), `/teste/produto` mostra o `ProductDemo` com placas
neutras marcadas TESTE DE LAYOUT (`?falha=1` simula captura ausente). No site, a demonstração do Viewer só aparece quando
`lib/product-media.ts` tiver material real autorizado — ver `PRODUCT-MEDIA.md`.

`tests/fixtures/mock-motion*` são módulos falsos do site para testar a ponte; não são o pacote do Claude Motion.
O mapa de `mock-motion-mri` foi derivado aproximadamente de `references/imaging/mri-axial-segmentation.png` só para testes.

## Proposta experimental da home (`/previa`, para revisão — não aprovada)

- `/` continua sendo a home aprovada (jornada 0.4.0 ready de `public/motion/`).
- `/previa`: home "Da imagem ao conhecimento." com o pacote experimental do Motion
  **home-v2 0.2.1-draft**, copiado sem alteração em `public/previa/home-v2-0.2.1/` (escultura,
  posters por largura de exibição em `<picture>`, jornada **0.4.1-exp** com `data-start-arc`).
  Conferência da cópia: `node motion/proposta/home-v2/scripts/sync-manifest.mjs <pasta> --check`.
  Lido por `lib/home-preview.server.ts`; usado só nesta rota (`MotionPackageInfo.baseUrl`).
  `public/previa/home-v2-0.2.0/` (versão anterior) não é mais lida.
- Links para `#jornada` na `/previa` (CTA, cabeçalho) navegam pelo próprio controlador: destino
  calculado (fim da passagem), rolagem que substitui outra em curso, conferência no `scrollend`
  e foco de chegada na seção — a âncora nativa perdia a rolagem com outra rolagem suave em curso.
- Passagem até a MESMA cena da jornada (variante `opening` de `Journey`), com uma só fonte de
  progresso. Ponte `setLayout({ art, target, ready, arc })` em `components/preview/HomeOpening.tsx`
  (o `previa-driver.js` do Motion vem no pacote só como referência; não é carregado).
- Grupos da jornada cobertos pela escultura ficam `inert` (sem foco, clique nem leitura) até a
  revelação efetiva; o ambiente da cena pausa enquanto o quadro está inteiramente coberto.
- Layout de abertura decidido antes da 1ª pintura (`OPENING_CSS` em `app/intro-script.ts`); sem JS,
  com movimento reduzido ou pausa salva: hero com poster + jornada em fluxo normal.
- Medidas e acordos com o Motion: `docs/coordination/INTEGRACAO-HOME-V2-SITE.md`.
- Reverter: apagar `app/previa/`, `components/preview/`, `lib/home-preview*.ts`, `public/previa/`,
  `OPENING_CSS` (e sua injeção) em `app/intro-script.ts`; as props `variant`/`onPassage`/`covered`/
  `sceneCovered` de `Journey` e `baseUrl` de `MotionPackageInfo` são opcionais e não afetam `/`.

- Propostas `/previa/a` (Space Grotesk + Source Sans 3) e `/previa/b` (Sora + IBM Plex Sans):
  mesma página (`components/preview/PreviewPage.tsx`) com tipografia (`components/preview/proposta/`,
  fontes WOFF2 locais + OFL em `public/previa/tipografia/fontes/`), barra de rolagem da marca e entrada
  na jornada com rolagem explícita de 1000 ms (`navMode="eased"`). A `/previa` segue como base.

- Versão conjunta `/previa/refinada` (escolha do usuário: tipografia A + montanha B): composição A
  em `components/preview/proposta/refinada.css` com pesos reais nos `@font-face` (500/600 · 400/600),
  `font-display: swap` + famílias de reserva com métricas ajustadas (Arial/Liberation/Arimo/Helvetica,
  sem arquivo novo) e larguras em em (não ch). Hero só com "Plataforma em validação científica";
  seta do Contato = `ArrowRight` de `components/icons.tsx` (`<Contact arrowIcon />`). Montanha B:
  pacote do Motion `ararat-home-montanha-exp` 0.5.0-draft (arco presente + luz ambiente) copiado sem
  alteração para `public/previa/home-montanha-0.5.0/` (manifest 71/71) e lido só por esta rota
  (`REFINADA_PACKAGE`; a 0.4.0 fica em `public/previa/home-montanha-0.4.0/`).
  Rodada integral (só refinada, por opções explícitas): cabeçalho MODEL ↔ PROSTATE
  (`SiteHeader brandWords` → `components/brand/BrandWordCycle.tsx`), Escape/foco do menu
  (`menuFocus`), cabeçalho opaco (`solid`), convite "Role para explorar" e "Como funciona" abaixo do
  cabeçalho (`HomeOpening scrollInvite/journeySafeIntro`), etapas compactas no celular
  (`journeyCompact`), e seções próprias em `components/refinada/` (Plataforma + Hub ampliado,
  Explicabilidade com exemplo único, Ciência em duas camadas, rodapé) e `Contact refinada`.

```bash
node tests/previa.mjs                            # verificações da /previa (+ "/" intacta); ONLY=regex filtra; ROUTE=/previa/a|b|refinada
node tests/fontes-carregamento.mjs               # refinada: fontes normais, atrasadas 4 s, 404 e rede lenta (texto pintado, linhas, CLS)
node tests/calibrar-reserva.mjs                  # calibra size-adjust da reserva (quebras de linha preservadas)
node tests/capture-fontes.mjs screenshots/<p>     # prova visual: block × swap+reserva a 1,5 s; 404 × normal
python3 tests/montagem-comparacao.py             # montagens base × A × refinada (após capture-tipografia com ROUTES=…)
python3 tests/grafico-trajetorias.py <pasta>     # gráfico das trajetórias gravadas × 3t²−2t³
python3 tests/montagem-fontes.py                 # montagem da prova visual das fontes
node tests/refinada.mjs                          # refinada: cabeçalho, XAI, menu, chegada, seções, convite, luz ambiente
node tests/capture-pagina.mjs screenshots/<p>     # página inteira + seções (VPS) + 1ª tela (FIRST); ROUTE=…
python3 tests/montagem-antes-depois.py <a> <d> <s> # montagens antes × depois
node tests/record-refinada.mjs screenshots/<p>    # gravações: cabeçalho/arco ~16 s, CTA por clique e teclado
node tests/pesos-fontes.mjs                      # refinada: nenhum texto com peso fora dos arquivos (500/600 · 400/600)
node tests/medir-cumes.mjs                       # refinada: cume/secundário na 1ª tela (variante real + objeto do Motion)
ROUTE=/previa/a node tests/navegacao.mjs         # entrada de 1000 ms: duração, curva, repetição, interrupções, espera, falhas
node tests/capture-tipografia.mjs screenshots/<p> # base × A × B (ROUTES=nome:/rota,…): hero, Plataforma, Explicabilidade + medidas
node tests/capture-barra.mjs screenshots/<p>      # barra de rolagem (base, proposta, forced-colors)
node tests/record-entrada.mjs screenshots/<p>     # gravação do ritmo da entrada + trajetórias (ROUTES=…)
python3 tests/glifos.py <texto.txt>               # cobertura de glifos das fontes das propostas
node tests/measure-opening.mjs                   # medidas reais (slot da arte, composição, quadro, pista)
node tests/capture-opening.mjs screenshots/<p>   # composição, passagem, pose, estático, foco, carregamento
node tests/record-opening.mjs screenshots/<p>    # rolagem natural (VIEWPORTS=1440x900,…; ROUTE=/previa/refinada)
node tests/record-keyboard.mjs screenshots/<p>   # teclado (Tab/Shift+Tab/Enter) e RM tardia
node tests/capture-loading.mjs screenshots/<p>   # RM tardia: "esperando" × "disponível" (5 viewports) e falha da RM
node tests/poster-canvas.mjs screenshots/<p>     # poster → canvas por largura e DPR (ROUTE=/previa/refinada) (variante, Δ, traço, extensão, resize)
BASE=… LABEL=… node tests/capture-cta.mjs <p>     # CTA por teclado, inclusive com outra rolagem suave em curso
```

## Estrutura

- `app/` — layout (metadados, fontes), página, rotas de teste `/teste/ponte` e `/teste/produto` (404 fora do harness)
- `components/` — `SiteHeader`, `Hero`, `journey/*`, `Platform`, `Explainability`, `Science`, `Contact`, `SiteFooter`
- `components/art/` — `MriFigure` (RM + camadas no mesmo viewBox), `ExplainMri`, paisagem topográfica
- `components/motion/` — ponte do contrato (`useJourneyMotion`, rótulos v1.1), `HeroAtmosphere`, `TextReveal`, preferências
- `app/intro-script.ts` — decide a abertura antes da 1ª pintura (sessão, hash, pausa, movimento reduzido) e segura a RM até o arquivo terminar (sem pintura parcial)
- `components/ProductDemo.tsx`, `lib/product-media.ts`, `PRODUCT-MEDIA.md` — percurso do produto e encaixe da demonstração real (vazio até haver material autorizado)
- `components/Passage.tsx` — passagem "Da explicação à revisão." entre Jornada e Plataforma
- `lib/science.ts` (escopo, princípios, limites, evidências — vazio) e `COPY-RASTREABILIDADE.md` (privado: afirmação → fonte → natureza)
- `lib/contact.ts` — canal institucional configurável (vazio)
- `lib/motion-prefs.ts` — pausa global de animações (header + jornada)
- `lib/` — contrato de motion, leitura do manifest no servidor, conteúdo e navegação
- `styles/tokens.css` — cópia de `references/brand/tokens-fonte.css`; `styles/site.css` — extensões
- `public/brand/` — cópias dos arquivos originais de marca e da captura do Hub
- `public/imaging/` — RM demonstrativa (de `references/imaging/mri-axial-demo.png`; procedência pendente)
