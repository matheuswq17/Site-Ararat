"use client";

import { useTranslation } from "@/lib/i18n";

import Image from "next/image";
import { RevealWords } from "./text/RevealWords";
import { CONTACT_CHANNEL, channelHref } from "@/lib/contact";
import { ArrowRight } from "./icons";
import styles from "./Contact.module.css";

/** Duas intenções; ações de agora levam a conteúdo útil do próprio site. */
const PATHS = [
  {
    id: "demonstracao",
    title: "Demonstração técnica",
    who: "Hospitais, clínicas de imagem e equipes de radiologia.",
    look: "Como o Hub organiza a fila, como um caso abre no Viewer e onde imagem, máscaras e explicação ficam juntas.",
    now: { label: "Explorar o fluxo", href: "#plataforma" },
    request: {
      label: "Solicitar demonstração técnica",
      subject: "ARARAT MODEL — demonstração técnica",
    },
  },
  {
    id: "pesquisa",
    title: "Pesquisa e colaboração",
    who: "Grupos de pesquisa e parceiros institucionais.",
    look: "O escopo do projeto, os princípios de avaliação — separação por paciente, métricas, generalização — e os limites de interpretação.",
    now: { label: "Conhecer os princípios", href: "#ciencia" },
    request: {
      label: "Propor colaboração",
      subject: "ARARAT MODEL — pesquisa e colaboração",
    },
  },
] as const;

/** arrowIcon: seta do sistema de ícones (ArrowRight, mesmo SVG dos botões) em vez do caractere
 *  "→" — só na /previa/refinada; "/" e as demais prévias seguem com o caractere. */
/** refinada (/previa/refinada): sem canal real, os cartões não terminam em links de volta para
 *  seções já vistas (Plataforma/Ciência) — só "para quem / o que observar" e uma nota curta do canal
 *  pendente; com CONTACT_CHANNEL preenchido, os dois pedidos aparecem como ação principal. */
export function Contact({
  arrowIcon = false,
  refinada = false,
  marcaSinal = false,
}: { arrowIcon?: boolean; refinada?: boolean; marcaSinal?: boolean } = {}) {
  const { t } = useTranslation();
  return (
    <section
      id="contato"
      className={styles.section}
      aria-labelledby="contato-title"
    >
      {marcaSinal ? (
        // ARARAT Sinal: campo de voxels oficial (04_grafismos, sem alteração) como fundo decorativo —
        // relevo quantizado em cinza, não é imagem médica nem dado. A montanha antiga ampliada sai.
        <div className="sinal-voxels" aria-hidden="true" />
      ) : (
        <div className={styles.arc} aria-hidden="true">
          <Image
            src="/brand/ararat_icone_transparente.png"
            alt={t("")}
            width={768}
            height={464}
            className={styles.mountain}
          />
        </div>
      )}

      <div className={`wrap ${styles.inner}`}>
        <p className="eyebrow">{t("Contato")}</p>
        <h2 id="contato-title" className={styles.title} data-reveal="title">
          <RevealWords text={t("Explore o ARARAT com sua equipe.")} />
        </h2>

        <div className={styles.paths}>
          {PATHS.map((p) => {
            const request = channelHref(CONTACT_CHANNEL, p.request.subject);
            return (
              <article
                key={p.id}
                className={styles.path}
                aria-labelledby={`contato-${p.id}`}
              >
                <h3 id={`contato-${p.id}`} className={styles.pathTitle}>
                  {t(p.title)}
                </h3>
                <dl className={styles.facts}>
                  <div>
                    <dt>{t("Para quem")}</dt>
                    <dd>{t(p.who)}</dd>
                  </div>
                  <div>
                    <dt>{t("O que observar")}</dt>
                    <dd>{t(refinada && p.id === "demonstracao"
                      ? "Como o Hub organiza a fila e abre um caso no Viewer, e quais ferramentas de revisão estão disponíveis na versão demonstrada."
                      : p.look)}</dd>
                  </div>
                </dl>
                {refinada && !request && (
                  // Ação preparada, sem destino: texto (não link nem botão) até haver canal real.
                  <p className={styles.pending} data-acao={p.id}>
                    <span className={styles.pendingLabel}>{t(p.request.label)}</span>
                    <span className={styles.pendingState}>{t("canal em preparação")}</span>
                  </p>
                )}
                {(!refinada || request) && (
                  <div className={styles.actions}>
                    {!refinada && (
                      <a href={p.now.href} className={styles.action}>
                        {t(p.now.label)}
                        {arrowIcon ? (
                          <span
                            aria-hidden="true"
                            className={`${styles.arrow} ${styles.arrowIcon}`}
                          >
                            <ArrowRight />
                          </span>
                        ) : (
                          <span aria-hidden="true" className={styles.arrow}>
                            {t("→")}</span>
                        )}
                      </a>
                    )}
                    {request && (
                      <a
                        href={request}
                        className={`${styles.action} ${styles.primary}`}
                        {...(CONTACT_CHANNEL?.kind === "url"
                          ? { rel: "noopener", target: "_blank" }
                          : {})}
                      >
                        {t(p.request.label)}
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {CONTACT_CHANNEL ? (
          <p className={styles.channel}>
            {t(CONTACT_CHANNEL.label)}{t(". O site apenas abre o canal; nenhuma mensagem é enviada por ele.")}</p>
        ) : (
          <p className={styles.channel} role="note">
            <span className={styles.channelDot} aria-hidden="true" />
            {t(refinada
              ? "Canal de contato em preparação — os pedidos de demonstração e de colaboração serão abertos aqui. Esta versão não envia mensagens."
              : "O canal institucional para solicitações será publicado nesta seção. Esta versão do site não envia mensagens.")}
          </p>
        )}
      </div>
    </section>
  );
}
