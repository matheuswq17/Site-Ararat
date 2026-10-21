# Como editar o site institucional e gerar uma Preview

Guia curto para quem mantém o conteúdo (inclusive o Vitão). Vale para a branch `institucional-site-v1`.
Não há CMS: o conteúdo fica em arquivos de texto do próprio site, e a Vercel gera a Preview a cada push.

## Onde fica cada coisa

| O que mudar | Arquivo | Como |
|---|---|---|
| Textos das páginas (Início, Plataforma, Pesquisa, Empresa, contato, rodapé) | `lib/institucional/textos.ts` | Cada texto tem `en` (inglês, idioma inicial) e `pt`. Troque só o que está entre aspas e mantenha as duas línguas com o mesmo sentido. |
| Equipe: nome, função, biografia, ordem | `lib/time-refinada.ts` | Texto em português. Para o inglês, acrescente ou ajuste a mesma frase como chave em `lib/locales/en.json` (`"frase em português": "English sentence"`). |
| Fotos da equipe | `public/refinada/time/` | Gere os derivados com `node scripts/derivar-time-refinada.mjs` (recorte 4:5). Não retoque retratos. |
| Funções da Plataforma e capturas | `lib/institucional/capturas.ts` e `components/institucional/Paginas.tsx` | Cada captura aponta para o arquivo de origem na entrega do produto (`evidencia`). Uma função sem captura real não entra. |
| Novos recortes de captura | `scripts/derivar-institucional.mjs` | Só recorte retangular, conferido pelo SHA-256 da entrega. Rode `node scripts/derivar-institucional.mjs <pasta da entrega>`. |
| Publicações | `lib/science-refinada.ts` (`PUBLICACAO`, `SCIENCE_EVIDENCE_REFINADA`) e `lib/institucional/textos.ts` (`PESQUISA`) | Título, autores, periódico, ano e DOI vêm do artigo. Nada de métricas sem revisão. |
| Contato | `lib/contact.ts` (`CONTACT_CHANNEL`) | Fica `null` até existir um canal real e confirmado pelo proprietário. |
| Rotas e navegação | `lib/institucional/rotas.ts` | Inglês em `/`, `/platform`, `/research`, `/company`; português em `/pt/…`. |
| Demonstração guiada | `lib/institucional/demo.ts` | Módulo do Motion e as paradas de cada etapa. Combine com o Motion antes de mudar. |
| Montanha da abertura | `lib/institucional/montanha.server.ts` | Pacote do Motion e posters. Combine com o Motion antes de mudar. |

**Regras de conteúdo** (valem para qualquer edição):
- Descreva o foco atual: revisão de RM de próstata.
- Não acrescente capacidades futuras como se existissem.
- Não afirme validação clínica nem status regulatório.
- Não cite parceiros sem confirmação do proprietário.
- Não invente canal de contato.

## Ver as mudanças no computador

```
cd site
npm ci            # só na primeira vez ou quando package-lock.json mudar
npm run dev       # abre em http://localhost:3000 (recarrega sozinho ao salvar)
```

Para conferir como em produção:

```
npm run build
npm start         # http://localhost:3000
```

**Endereços:**
- Inglês: `/`, `/platform`, `/research`, `/company`.
- Português: `/pt`, `/pt/plataforma`, `/pt/pesquisa`, `/pt/empresa`.
- Experiência anterior, para comparação: `/previa/refinada` (PT) e `/previa/refinada/en` (EN).

## Testes antes de enviar

Com o site rodando (`npm start`):

```
node tests/institucional.mjs http://localhost:3000
```

O script confere:
- rotas, idioma e links;
- menu, biografias e teclado;
- funcionamento sem JavaScript;
- pausa e movimento reduzido;
- falhas de mídia;
- teto de ampliação das capturas;
- integridade dos pacotes do Motion.

Ele não substitui olhar a página num navegador de verdade.

## Gerar a Preview

1. Faça o commit só dos arquivos alterados (`git status` → `git add <arquivos>` → `git commit -m "…"`). Não use `git add .` sem conferir a lista.
2. Envie a branch: `git push origin institucional-site-v1`.
3. A Vercel (Root Directory `site`) gera uma **Preview** com endereço próprio. O link aparece na página do projeto na Vercel e no GitHub.

Nada vai para produção sem um pedido explícito: não faça merge na `main` nem promova a Preview.
