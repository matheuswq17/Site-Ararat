# Site ARARAT

Site institucional monocromático em Next.js, com inglês em `/`, português em `/pt` e espanhol em `/es`.

## Desenvolvimento

Na pasta `site`, execute `npm ci` e `npm run dev`. Para verificar: `npm run build` e `npm run typecheck`.

O guia de conteúdo, rotas e movimento fica em [site/EDITAR-ARARAT.md](site/EDITAR-ARARAT.md).

## Versão principal

Usa os movimentos aprovados: títulos por linhas com GSAP, transição de 180 ms e montanha 1.3.1 com repouso de 5 s. Os pacotes originais e as versões de comparação foram preservados.

A variante padrão usa composição sem capturas com permissão pendente e mantém `noindex`. Não definir `ARARAT_REVISAO_PRIVADA=1` em ambiente aberto: essa opção é apenas para revisão local, com mídia fornecida separadamente. As quatro capturas adicionais do institucional anterior não fazem parte desta integração nem do histórico novo enviado.

A branch local `portfolio-site-v1` mantém a entrega completa e os commits intermediários. Esta integração incorpora o estado validado em um commit sobre a main anterior, sem reescrever ou apagar o histórico existente.

## Publicação

Vercel: Root Directory `site`, framework Next.js, install `npm ci`, build `npm run build`.

O deploy automático da branch `main` fica desativado em `vercel.json` (também em `site/vercel.json` para o Root Directory configurado). Enviar código ao GitHub não é autorização para publicar o site. Preview e produção continuam dependendo da decisão do proprietário e das pendências institucionais.

As capturas históricas que já existiam na main permanecem no histórico anterior; o bloqueio HTTP das versões antigas não remove arquivos do GitHub.
