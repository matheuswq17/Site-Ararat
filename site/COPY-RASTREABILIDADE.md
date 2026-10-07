# Rastreabilidade de copy — documento privado (não é servido pelo site)

Mapa afirmação → fonte → natureza → confirmação pendente, para as seções revistas na rodada 06
(Passagem, Plataforma, Explicabilidade, Ciência, Contato) e para as frases de produto que elas repetem.
Fonte principal: `references/produto/contexto-produto-fonte.md` (citada como **§n**). Essa fonte descreve
**intenção e produto**; não é prova de eficácia clínica nem de validação realizada.

**Natureza:** `produto` (o que a plataforma faz/oferece), `escopo` (o que cobre), `princípio` (requisito de
método — não resultado), `limite` (como não ler), `demonstração` (sobre o próprio site), `resultado`
(evidência obtida — **nenhuma afirmação do site está nesta categoria hoje**).

## Ciência (`lib/science.ts`)

| Afirmação no site | Fonte | Natureza | Confirmação pendente |
|---|---|---|---|
| Título "Construído sobre método, não sobre promessas." | §18.9 (título sugerido) | princípio | — |
| Escopo · Imagem: RM de próstata, com suas séries e planos | §1, §3.1 | escopo | — |
| Escopo · Finalidade: apoio à análise médica e à pesquisa em oncologia de próstata | §1, §2, §22 | escopo | — |
| Escopo · Uso: fluxo de revisão do Hub ao Viewer, conduzido por especialistas | §4, §5, §6, §8 | produto | — |
| Escopo · Situação: plataforma em validação | §18.9 | escopo | Estágio atual da validação (interna? prospectiva? concluída?) — confirmar com a equipe |
| Princípio · separação por paciente entre treino e teste; lesões do mesmo paciente inflam resultados | §14 ("ponto importante") | princípio | **Se** já foi aplicada nos modelos atuais e com qual conjunto — só então pode virar resultado |
| Princípio · métricas adequadas ao problema | §14, §17 (msg. 2: "métricas robustas") | princípio | Quais métricas e valores — nenhum número é publicado no site |
| Princípio · generalização | §18.9 ("cuidado com generalização") | princípio | Existência de avaliação externa/multicêntrica — **não afirmada** |
| Princípio · rastreabilidade DICOM → séries → segmentação → medidas → features → resultado | §3.4, §4 | princípio / produto | — |
| Princípio · explicabilidade: região, máscara de base, características de maior peso | §8 ("o que a explicabilidade pode mostrar") | princípio / produto | Forma real de cálculo da importância (SHAP ou outro) — o site **não** nomeia método |
| Limite · nenhuma estimativa é diagnóstico final | §8 (frase importante) | limite | — |
| Limite · não substitui profissionais; conduta permanece humana | §8, §10, §22 | limite | — |
| Limite · site não apresenta métricas, validação externa ou certificação regulatória | §15 (não dizer "aprovado pela ANVISA/FDA/CE" sem prova) + ausência de evidência no projeto | limite | Atualizar se houver publicação/registro |
| Limite · imagens, máscaras e contribuições do site são demonstrativas | estado do projeto (RM demonstrativa; procedência pendente) | demonstração | Procedência/licença da RM e das máscaras (hipótese PROSTATEx/TCIA, não verificada) |
| "O modelo sugere. O radiologista revisa. O médico contextualiza. A decisão permanece humana." | §8 (comunicação correta) | limite | — |
| Disclaimer "plataforma de apoio à análise médica e pesquisa…" | §22 | limite | — |
| Encaixe "Publicações e resultados" | — | resultado | **Vazio e oculto.** Preencher só com evidência específica (DOI/URL oficial) |

## Plataforma, Passagem (`lib/product-media.ts`, `components/Platform.tsx`, `components/Passage.tsx`)

| Afirmação | Fonte | Natureza | Confirmação pendente |
|---|---|---|---|
| Hub: estudos DICOM chegam, entram na fila, aparecem com status | §5 (funções do Hub) | produto | — |
| Abrir o caso: da fila, o caso pronto abre direto no Viewer | §5 ("abertura direta do caso no Viewer") | produto | — |
| Séries e máscaras: o especialista percorre séries e sobrepõe máscaras | §6 | produto | Confirmar com as novas capturas |
| Revisar a análise: medidas, análise e explicabilidade ao lado da imagem | §6 | produto | Confirmar com as novas capturas |
| Comentários a/b/c sobre a captura do Hub | conteúdo visível em `public/brand/ararat_hub.png` | produto | Autorização de uso público da captura (contém "HIAE" e identificadores ProstateX) |
| "Imagem, máscara e resultado no mesmo ambiente." + lista de recursos do Viewer | §6, §18.5 | produto | Sem captura do Viewer — mantido com "Capturas do Viewer em preparação" |
| Passagem: "a cena acima é demonstrativa… a mesma lógica acompanha cada exame, da chegada no Hub à revisão" | §4 (jornada ideal) | demonstração / produto | — (não afirma que a cena foi processada pelo produto) |

## Explicabilidade (`components/Explainability.tsx`)

| Afirmação | Fonte | Natureza | Confirmação pendente |
|---|---|---|---|
| "IA médica precisa mostrar suas razões." | §18.7 | princípio | — |
| Forma/Textura/Intensidade: o que cada uma descreve | §7 (exemplos radiômicos) | produto | — |
| "De onde vem" (contorno, recorte ampliado, tons mapeados) | o próprio site (visualizações derivadas dos pixels) | demonstração | — |
| Pesos relativos (Textura > Intensidade > Forma) | ilustrativo, igual à jornada | demonstração | Não é saída de modelo; não trocar por valores sem resultado real |

## Contato (`components/Contact.tsx`, `lib/contact.ts`)

| Afirmação | Fonte | Natureza | Confirmação pendente |
|---|---|---|---|
| Demonstração técnica: hospitais, clínicas de imagem, equipes de radiologia | §18.10, §21 | produto | — |
| Pesquisa e colaboração: grupos de pesquisa e parceiros institucionais | §18.10, §14 | produto | — |
| "O canal institucional… será publicado nesta seção. Esta versão do site não envia mensagens." | estado do projeto | demonstração | **Canal real** (e-mail ou página oficial) — `CONTACT_CHANNEL` vazio |

## Estado científico que ainda precisa de confirmação

1. Estágio da validação ("em validação" é a única afirmação feita).
2. Se a separação por paciente já foi aplicada aos modelos atuais e em que dados.
3. Métricas e conjuntos usados; existência de avaliação externa.
4. Método de explicabilidade efetivamente usado no produto.
5. Procedência, licença e atribuição da RM demonstrativa e das máscaras.
6. Publicações, preprints ou relatórios citáveis (encaixe pronto e oculto).
7. Situação regulatória (o site não afirma nenhuma).
