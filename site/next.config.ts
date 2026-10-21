import type { NextConfig } from "next";

// Quando o node_modules desta pasta é uma junção/link para o de outro checkout (ex.: worktree em tmp/ apontando
// para C:\mvp_ararat_site\site\node_modules), o Turbopack recusa o link porque ele sai da raiz do projeto.
// ARARAT_RAIZ_DEPENDENCIAS = pasta que contém os dois (ex.: C:\mvp_ararat_site). Sem a variável, nada muda.
const raizDependencias = process.env.ARARAT_RAIZ_DEPENDENCIAS;

const nextConfig: NextConfig = {
  // Permite verificar produção em outra pasta sem interromper o next dev local.
  distDir: process.env.ARARAT_BUILD_DIR || ".next",
  ...(raizDependencias ? { turbopack: { root: raizDependencias }, outputFileTracingRoot: raizDependencias } : {}),
};

export default nextConfig;
