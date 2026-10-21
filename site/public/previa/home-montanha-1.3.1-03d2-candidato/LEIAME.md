# home-montanha 1.3.1-03d2-candidato

Revisão da 1.3.0-03d2-candidato (Motion, 20/10/2026). **Não integrado; não publicar.**

- **Uma mudança**, aprovada pelo proprietário. No perfil `recomendado`, o repouso entre passagens é de **exatamente 5 s**. Ele é contado do fim completo de uma passagem, com a resposta do relevo incluída, até o início da próxima.
- **Arquivo alterado:** só `web/home-sculpture.js` (sha256 `014e0257…0a25`).
- **Sem mudança:** velocidade, duração (com a mesma variação por passagem), intensidade, cobre, relevo, percurso, momento da 1ª passagem e perfil `expressivo`.
- **Posters:** continuam os da 1.2.1-03d2.
- **Pacotes anteriores:** a 1.3.0-03d2-candidato e a 1.2.1-03d2 ficam intactas.
- **Parâmetro novo:** `repousoVisivel: 5000` no perfil. O módulo calcula o repouso da agenda assim: `5000 + atraso − 0,03·d`. Não é API para o Site, e o Site não usa `_passagem`.
- **Integração, identificação e verificação:** `docs/coordination/MONTANHA-1.3.1-REPOUSO-5S-MOTION-2026-10-20.md`.
