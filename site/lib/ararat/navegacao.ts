import { conteudo, type Idioma } from './conteudo';
import { href, type Pagina } from './rotas';
import { videoDisponivel } from './midia';

type Categoria = 'solutions' | 'platform' | 'evidence' | 'company';
type Atalho = { rotulo: string; href: string };
export type GrupoNavegacao = { chave: Categoria; rotulo: string; href: string; atalhos: Atalho[] };

/** Mesmos destinos no desktop e no celular; rótulos vêm do conteúdo das próprias páginas. */
export function gruposNavegacao(idioma: Idioma): GrupoNavegacao[] {
  const c = conteudo(idioma);
  const link = (pagina: Pagina, rotulo: string, ancora?: string): Atalho => ({ rotulo, href: href(pagina, idioma, ancora) });
  const atalhos: Record<Categoria, Atalho[]> = {
    solutions: [link('prostate', c.home.estagio[0][1]), link('thyroid', c.tireoide.titulo)],
    platform: [...(videoDisponivel() ? [link('platform', c.plataforma.video.atalho, 'video')] : []), ...c.plataforma.grupos.map(g => link('platform', g.titulo, g.id)), link('platform', c.plataforma.adocao_titulo, 'adocao')],
    evidence: [link('evidence', c.fichasTitulo, 'fichas'), link('evidence', c.extra.estudos, 'estudos')],
    company: [link('company', c.empresa.equipe, 'equipe'), link('company', c.contato, 'contato')],
  };
  return c.nav.map(([chave, rotulo]) => ({ chave: chave as Categoria, rotulo, href: href(chave as Categoria, idioma), atalhos: atalhos[chave as Categoria] }));
}
