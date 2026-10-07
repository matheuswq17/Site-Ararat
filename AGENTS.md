# Trabalho no Site ARARAT

## Git e autoria — preferência expressa do proprietário

- Use o Git local no terminal deste computador para commits e push em `https://github.com/matheuswq17/Site-Ararat.git`.
- Preserve a identidade configurada no Git. Não altere autor, committer ou datas; não use autoria fictícia nem inclua coautoria automática.
- Ao terminar uma alteração solicitada, valide o que for pertinente, revise o diff e faça um commit descritivo com apenas os arquivos dessa alteração. Faça push quando houver autorização na sessão; o proprietário autorizou neste projeto o envio das alterações concluídas.
- Não faça `git add .` sem revisar a lista. Não inclua alterações de outro agente que ainda está trabalhando. Combine a integração antes de registrar um pacote recebido.
- Não faça force-push, não reescreva histórico e não apague trabalho de terceiros.
- Se o agente trabalha numa cópia em nuvem, sincronize e confira os arquivos antes do commit local. Não diga que houve commit/push neste computador se isso não aconteceu.
- Originais, papers, documentos privados, credenciais, pastas de transferência, gravações e capturas de revisão ficam fora do repositório público. Respeite o `.gitignore`; não use `git add -f` para contorná-lo.
- Fonte de animação selecionada fica em `motion/`; os pacotes efetivamente servidos ficam em `site/public/`. Ao atualizar um pacote, registre a integração e confira sua integridade.

## Aplicação e publicação

- O aplicativo Next.js fica em `site/`; a versão em revisão é `/previa/refinada`.
- Preserve as outras rotas e versões de comparação salvo pedido explícito.
- Na Vercel, configure Root Directory como `site`, framework Next.js, install `npm ci` e build `npm run build`.
- Prefira Preview; promover para produção exige pedido explícito. Um push pode acionar deploy automático se o repositório estiver conectado.
- Não mude o canal de contato ou invente credenciais, validação clínica, aprovação regulatória ou permissões de imagens.
- Para regras adicionais do framework, leia `site/AGENTS.md`.
