# Site ARARAT

Site institucional e prévia interativa do ARARAT, em Next.js e TypeScript.

## Desenvolvimento

```powershell
cd site
npm ci
npm run dev
```

A página inicial `/` usa a refinada em inglês. `/pt` apresenta a mesma página em português; o seletor EN/PT preserva a seção e os parâmetros na troca. `/previa/refinada` permanece em português para revisão, e `/previa`, `/previa/a` e `/previa/b` continuam disponíveis para comparação. A home anterior fica em `/previa/original`.

Os textos são traduzidos no HTML inicial e nos controles, avisos e nomes acessíveis. As capturas do Hub e do Viewer preservam a interface original em português, com legendas no idioma da página. As traduções estão em `site/lib/locales/en.json`; novos textos precisam de uma entrada correspondente. As animações e os arquivos do Motion não são traduzidos nem modificados.

## Verificação

```powershell
cd site
npm run typecheck
npm run build
node tests/locales.mjs
```

`tests/locales.mjs` verifica a home atual em inglês e português, navegação entre idiomas, acessibilidade textual, seis larguras e a apresentação sem JavaScript. `tests/e2e.mjs` mantém os testes da home anterior em `/previa/original`; `tests/refinada.mjs` e `tests/plataforma-fluxo.mjs` cobrem as interações da refinada.

Para conferir o build sem disputar a pasta do servidor de desenvolvimento:

```powershell
$env:ARARAT_BUILD_DIR = '.next-verificacao'
npm run build
Remove-Item Env:ARARAT_BUILD_DIR
```

## Vercel

Importe `matheuswq17/Site-Ararat`, usando Root Directory `site` e framework Next.js. Comandos: `npm ci` e `npm run build`; saída padrão do framework. A página principal é `/` (inglês); a versão portuguesa está em `/pt`. A indexação continua desativada enquanto a revisão de publicação estiver pendente.

O código inclui as mídias necessárias às demonstrações. O repositório não contém os manuscritos, documentos privados de coordenação, originais de retratos ou gravações de testes. A presença de uma mídia neste repositório não concede licença de reutilização a terceiros.

Leia `AGENTS.md` para o fluxo de commits locais e integração entre agentes.
