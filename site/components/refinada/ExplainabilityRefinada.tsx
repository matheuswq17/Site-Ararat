"use client";

import { useState } from "react";
import type { MriSource } from "@/lib/mri";
import { ExplainMri, type FeatureKey } from "../art/ExplainMri";
import { RevealWords } from "../text/RevealWords";
import styles from "../Explainability.module.css";
import extra from "./ExplainabilityRefinada.module.css";

/**
 * Explicabilidade da /previa/refinada. Tarefa própria (a Jornada já mostra como o dado é
 * produzido): conferir, na imagem, de onde vem uma característica e quanto ela pesou no exemplo.
 *
 * DEFINIÇÃO ÚNICA DO EXEMPLO: `EXEMPLO` é a única fonte das contribuições ilustrativas. A ordem,
 * o texto de leitura ("maior / intermediária / menor") e o comprimento das barras são DERIVADOS
 * dela — não há como o texto e a barra discordarem.
 *
 * Alinhado à Jornada aprovada: a cena do Motion (journey 0.4.1-exp, web/journey.js
 * `CONTRIB = [0.36, 0.92, 0.6]` na ordem forma/textura/intensidade) é a referência; aqui os
 * mesmos valores normalizados pela maior. Resultado: Textura > Intensidade > Forma. (A ordem
 * Textura > Forma > Intensidade da rodada anterior veio de um prompt, não de decisão científica.)
 * Pesos relativos ilustrativos, sem número exibido; não são saída do modelo nem valores clínicos.
 * Rodada 5: Forma/Textura/Intensidade apresentadas como FAMÍLIAS de características ilustrativas;
 * Forma lida como contorno e distribuição espacial no corte 2D (sem sugerir volume medido).
 */
/** Contribuições ilustrativas da cena da Jornada (journey 0.4.1-exp), sem alteração. */
const CONTRIB_JORNADA: Record<FeatureKey, number> = { forma: 0.36, textura: 0.92, intensidade: 0.6 };
const MAX = Math.max(...Object.values(CONTRIB_JORNADA));
export const EXEMPLO: Record<FeatureKey, number> = {
  forma: CONTRIB_JORNADA.forma / MAX,
  textura: CONTRIB_JORNADA.textura / MAX,
  intensidade: CONTRIB_JORNADA.intensidade / MAX,
};

const RANK_TEXT = [
  "Maior contribuição relativa neste exemplo: é a primeira família a conferir na imagem.",
  "Contribuição intermediária neste exemplo didático: a ordem foi definida para a demonstração.",
  "Menor contribuição relativa neste exemplo didático: não é uma importância calculada pelo modelo.",
];

type Feature = { key: FeatureKey; name: string; origin: (hasMap: boolean) => string; aspect: string };

/** Botões na ordem fixa Forma · Textura · Intensidade (a leitura não depende da ordem dos botões). */
const FEATURES: Feature[] = [
  {
    key: "forma",
    name: "Forma",
    origin: (m) =>
      m
        ? "O contorno da região segmentada, em dourado: a silhueta que a forma descreve."
        : "A silhueta da janela central, com as bordas da própria imagem suavemente realçadas.",
    aspect: "Contorno e distribuição espacial da região neste corte.",
  },
  {
    key: "textura",
    name: "Textura",
    origin: () => "Um recorte de dentro da região (quadrado tracejado), ampliado no canto superior direito.",
    aspect: "Heterogeneidade dos padrões de sinal dentro da região.",
  },
  {
    key: "intensidade",
    name: "Intensidade",
    origin: (m) => `Os tons de cinza ${m ? "da região" : "da janela central"} numa escala de cor, para ficarem comparáveis.`,
    aspect: "Distribuição dos valores de sinal na região.",
  },
];

/** Ordem por contribuição (maior → menor), derivada de EXEMPLO. */
const BY_RANK = [...FEATURES].sort((a, b) => EXEMPLO[b.key] - EXEMPLO[a.key]);
const rankOf = (k: FeatureKey) => BY_RANK.findIndex((f) => f.key === k);

export function ExplainabilityRefinada({ mri }: { mri: MriSource }) {
  const [selected, setSelected] = useState<FeatureKey>(BY_RANK[0].key);
  const feature = FEATURES.find((f) => f.key === selected)!;
  const hasMap = Boolean(mri.map);

  return (
    <section id="explicabilidade" className={styles.section} aria-labelledby="xai-title" data-exemplo={BY_RANK.map((f) => f.key).join(">")}>
      <div className="wrap">
        <header className={styles.header}>
          <p className="eyebrow">Explicabilidade</p>
          <h2 id="xai-title" className={styles.title} data-reveal="title">
            <RevealWords text="IA médica precisa mostrar suas razões." />
          </h2>
          <p className={styles.lead} data-reveal="text">
            Escolha uma família de características e confira na imagem de onde ela vem e quanto pesou neste exemplo.
          </p>
        </header>

        <div className={styles.explorer}>
          <div className={styles.artWrap}>
            <ExplainMri source={mri} selected={feature.key} formaSoft />
            <span className={styles.badge}>Exemplo ilustrativo</span>
          </div>

          <div className={styles.panel}>
            <div className={styles.choices} role="group" aria-label="Escolher família de características do exemplo">
              {FEATURES.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={styles.choice}
                  aria-pressed={selected === f.key}
                  aria-controls="xai-reading"
                  onClick={() => setSelected(f.key)}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <ol id="xai-reading" className={`${styles.reading} ${extra.reading}`} aria-label={`Leitura da família ${feature.name}`}>
              <li>
                <h3 className={styles.stepLabel}>De onde vem</h3>
                <p>{feature.origin(hasMap)}</p>
                <p className={extra.aspect}>
                  <strong>{feature.name}:</strong> {feature.aspect.charAt(0).toLowerCase() + feature.aspect.slice(1)}
                </p>
              </li>
              <li>
                <h3 className={styles.stepLabel}>Quanto pesou</h3>
                <p data-reading={feature.key}>{RANK_TEXT[rankOf(feature.key)]}</p>
                <ul className={styles.bars} aria-label="Contribuição relativa ilustrativa, da maior para a menor, sem valores">
                  {BY_RANK.map((f) => (
                    <li key={f.key} data-active={selected === f.key || undefined} data-feature={f.key}>
                      <span className={styles.barName}>{f.name}</span>
                      <span className={styles.barTrack} aria-hidden="true">
                        <span className={styles.barFill} style={{ width: `${EXEMPLO[f.key] * 100}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            </ol>

            {/* Aviso essencial visível junto da demonstração; detalhes em expansão (rodada 6). */}
            <p className={styles.disclaimer}>
              Nesta demonstração, os pesos são ilustrativos e não representam uma saída do modelo, valores SHAP nem uma
              estimativa de risco.
            </p>
            <details className={extra.more}>
              <summary className={extra.moreSummary}>Sobre este exemplo e o SHAP</summary>
              <p className={styles.disclaimer}>
                Forma, textura e intensidade são famílias de características, representadas aqui de forma ilustrativa,
                sobre uma imagem demonstrativa. A ordem das barras é ilustrativa.
              </p>
              <p className={styles.disclaimer}>
                SHAP foi usado no estudo publicado para analisar contribuições por característica, que podem favorecer ou
                contrariar uma classe. O painel XAI do Viewer mostrado ainda não está disponível nesta versão.
              </p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
