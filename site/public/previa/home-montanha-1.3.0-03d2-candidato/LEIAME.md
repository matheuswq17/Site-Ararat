# home-montanha 1.3.0-03d2-candidato

Candidato da rodada "evolução do movimento" (Motion, 14/10/2026). **Não integrado; não publicar.**

- Muda só `web/home-sculpture.js` (sha256 `1ef10fb2…447ff6`) em relação à 1.2.1-03d2. Os demais arquivos (posters, journey, driver) são herdados sem mudança da 1.2.1-03d2, que continua intacta como versão estável.
- Novo modo opt-in `ambient: 'passagem'` + `ambientPerfil: 'recomendado' | 'expressivo'`: passagens espaçadas de luz no arco com resposta no relevo, no lugar da respiração (`ambient: true`, mantida sem mudança).
- Repouso entre passagens sem quadros; quadro de repouso = 1.2.1 com `ambient: false` (= poster).
- Parâmetros, API, integração e critérios de aceite: `docs/coordination/MONTANHA-LUZ-E-TRANSICOES-MOTION-2026-10-14.md`.
- Prévia executável e testes (privados): `docs/review/montanha-luz-motion-2026-10-14/`.
