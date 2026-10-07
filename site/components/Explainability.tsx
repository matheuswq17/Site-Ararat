"use client";

import { useState } from "react";
import type { MriSource } from "@/lib/mri";
import { ExplainMri, type FeatureKey } from "./art/ExplainMri";
import { RevealWords } from "./text/RevealWords";
import styles from "./Explainability.module.css";

type Feature = {
  key: FeatureKey;
  name: string;
  /** 1 · de onde vem: o que a imagem destaca (equivalente textual do destaque). */
  origin: (hasMap: boolean) => string;
  /** 2 · que aspecto descreve. */
  aspect: string;
  /** 3 · como ler o destaque neste exemplo (relativo, sem números). */
  reading: string;
  /** Comprimento relativo ilustrativo (mesma ordem da jornada). Sem valor numérico exibido. */
  len: number;
};

const FEATURES: Feature[] = [
  {
    key: "forma",
    name: "Forma",
    origin: (m) =>
      m
        ? "O contorno da região segmentada, em dourado, com as bordas internas da própria imagem realçadas."
        : "As bordas da própria imagem realçadas dentro da janela central.",
    aspect: "Contorno, compacidade e volume da região.",
    reading: "Contribuição intermediária neste exemplo: pesou, mas não foi o principal apoio da estimativa.",
    len: 0.5,
  },
  {
    key: "textura",
    name: "Textura",
    origin: () =>
      "Um recorte de dentro da região (quadrado tracejado), mostrado ampliado na janela do canto superior direito.",
    aspect: "Heterogeneidade dos padrões de sinal dentro da região.",
    reading: "Maior contribuição relativa neste exemplo: é a primeira característica a conferir na imagem.",
    len: 1,
  },
  {
    key: "intensidade",
    name: "Intensidade",
    origin: (m) =>
      `Os tons de cinza ${m ? "da região" : "da janela central"} mapeados em uma escala de cor, para ficarem comparáveis.`,
    aspect: "Distribuição dos valores de sinal na região.",
    reading: "Contribuição relativa menor neste exemplo: apoia pouco a estimativa e não a sustenta sozinha.",
    len: 0.7,
  },
];

/**
 * Explicabilidade como leitura guiada de UMA característica: origem na imagem →
 * aspecto descrito → leitura da contribuição ilustrativa. Mesma RM e mesmo mapa da
 * jornada; nenhum valor, SHAP, probabilidade ou lesão. Sem aria-live: o texto muda
 * junto do botão escolhido (aria-pressed) e é lido ao percorrer o painel.
 */
export function Explainability({ mri }: { mri: MriSource }) {
  const [selected, setSelected] = useState(1);
  const feature = FEATURES[selected];
  const hasMap = Boolean(mri.map);

  return (
    <section id="explicabilidade" className={styles.section} aria-labelledby="xai-title">
      <div className="wrap">
        <header className={styles.header}>
          <p className="eyebrow">Explicabilidade</p>
          <h2 id="xai-title" className={styles.title} data-reveal="title">
            <RevealWords text="IA médica precisa mostrar suas razões." />
          </h2>
          <p className={styles.lead} data-reveal="text">
            Como ler uma explicação: escolha uma característica e siga três perguntas — de onde vem, o que
            descreve, quanto pesou em relação às outras.
          </p>
        </header>

        <div className={styles.explorer}>
          <div className={styles.artWrap}>
            <ExplainMri source={mri} selected={feature.key} />
            <span className={styles.badge}>Exemplo ilustrativo</span>
          </div>

          <div className={styles.panel}>
            <div className={styles.choices} role="group" aria-label="Escolher característica do exemplo">
              {FEATURES.map((f, i) => (
                <button
                  key={f.key}
                  type="button"
                  className={styles.choice}
                  aria-pressed={selected === i}
                  aria-controls="xai-reading"
                  onClick={() => setSelected(i)}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <ol id="xai-reading" className={styles.reading} aria-label={`Leitura da característica ${feature.name}`}>
              <li>
                <h3 className={styles.stepLabel}>De onde vem</h3>
                <p>{feature.origin(hasMap)}</p>
              </li>
              <li>
                <h3 className={styles.stepLabel}>O que descreve</h3>
                <p>
                  <strong>{feature.name}:</strong> {feature.aspect.charAt(0).toLowerCase() + feature.aspect.slice(1)}
                </p>
              </li>
              <li>
                <h3 className={styles.stepLabel}>Como ler a contribuição</h3>
                <p>{feature.reading}</p>
                <ul className={styles.bars} aria-label="Contribuição relativa ilustrativa, sem valores">
                  {FEATURES.map((f, i) => (
                    <li key={f.key} data-active={selected === i || undefined}>
                      <span className={styles.barName}>{f.name}</span>
                      <span className={styles.barTrack} aria-hidden="true">
                        <span className={styles.barFill} style={{ width: `${f.len * 100}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            </ol>

            <p className={styles.disclaimer}>
              Imagem demonstrativa de RM; destaques e pesos são ilustrativos e comparam as três características
              entre si. Não são features radiômicas calculadas, resultado clínico nem saída real do modelo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
