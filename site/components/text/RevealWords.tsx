import { Fragment, type CSSProperties } from "react";

/**
 * Divide um título em palavras para animação (spans inline-block). Os espaços
 * continuam como nós de texto reais entre as palavras: a frase lida por
 * tecnologias assistivas e a seleção de texto permanecem idênticas.
 * Quebras de linha intencionais: use "\n" no texto.
 * Markup determinístico (sem window/tempo): SSR e cliente iguais.
 */
export function RevealWords({ text, className = "rw", start = 0 }: { text: string; className?: string; start?: number }) {
  let i = start;
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line
            .split(" ")
            .filter(Boolean)
            .map((word, wi) => (
              <Fragment key={wi}>
                {wi > 0 && " "}
                <span className={className} style={{ "--i": i++ } as CSSProperties}>
                  {word}
                </span>
              </Fragment>
            ))}
        </Fragment>
      ))}
    </>
  );
}
