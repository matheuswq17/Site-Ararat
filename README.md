# Site ARARAT

Site institucional e prévia interativa do ARARAT, em Next.js e TypeScript.

## Desenvolvimento

```powershell
cd site
npm ci
npm run dev
```

Versão em revisão: `http://localhost:3000/previa/refinada`.

## Verificação

```powershell
cd site
npm run typecheck
npm run build
```

Para conferir o build sem disputar a pasta do servidor de desenvolvimento:

```powershell
$env:ARARAT_BUILD_DIR = '.next-verificacao'
npm run build
Remove-Item Env:ARARAT_BUILD_DIR
```

## Vercel

Importe `matheuswq17/Site-Ararat`, usando Root Directory `site` e framework Next.js. Comandos: `npm ci` e `npm run build`; saída padrão do framework. Para revisar o resultado, abra `/previa/refinada` no endereço do deployment. A rota `/` continua sendo a versão anterior.

O código inclui as mídias necessárias às demonstrações. O repositório não contém os manuscritos, documentos privados de coordenação, originais de retratos ou gravações de testes. A presença de uma mídia neste repositório não concede licença de reutilização a terceiros.

Leia `AGENTS.md` para o fluxo de commits locais e integração entre agentes.
