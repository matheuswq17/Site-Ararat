/**
 * Canal institucional de contato — VAZIO até o usuário informar um canal real.
 *
 * Enquanto `CONTACT_CHANNEL` for null, o Contato oferece só ações honestas
 * (ir à Plataforma, ir à Ciência) e mantém a nota "canal em preparação". Nenhum
 * formulário, backend, e-mail fictício ou confirmação de envio existe no site.
 *
 * Para ativar: preencher com o canal REAL fornecido pela equipe, por exemplo
 *   { kind: "email", address: "contato@dominio-real", label: "E-mail institucional" }
 *   { kind: "url", href: "https://pagina-oficial-de-agendamento", label: "Página de contato" }
 * As ações "Solicitar demonstração técnica" e "Propor colaboração" passam a abrir
 * esse canal (mailto com assunto pré-preenchido, ou o link). Nada é enviado pelo site.
 */
export type ContactChannel =
  | { kind: "email"; address: string; label: string }
  | { kind: "url"; href: string; label: string };

export const CONTACT_CHANNEL: ContactChannel | null = null;

/** Link real para uma intenção, ou null se o canal não está configurado/é inválido. */
export function channelHref(channel: ContactChannel | null, subject: string): string | null {
  if (!channel) return null;
  if (channel.kind === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(channel.address)) return null;
    return `mailto:${channel.address}?subject=${encodeURIComponent(subject)}`;
  }
  return /^https:\/\//.test(channel.href) ? channel.href : null;
}
