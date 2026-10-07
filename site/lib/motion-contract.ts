/**
 * Tipos do contrato de integração de movimento — v1
 * (docs/coordination/CONTRATO-MOTION.md). O site possui progress, controles e
 * textos; o módulo de motion apenas desenha a cena dentro do container.
 */

export const MOTION_BASE_URL = "/motion/";
export const MOTION_SCHEMA_VERSION = 1;

/** Os quatro estados da jornada: Imagem, Segmentação, Dados, Explicação. */
export const JOURNEY_STOPS = [0, 1 / 3, 2 / 3, 1] as const;

export type JourneySceneOptions = {
  baseUrl: string;
  reducedMotion: boolean;
  paused: boolean;
};

export type JourneySceneController = {
  setProgress(progress: number): void;
  setReducedMotion(enabled: boolean): void;
  setPaused(paused: boolean): void;
  destroy(): void;
};

export type CreateJourneyScene = (
  container: HTMLElement,
  options: JourneySceneOptions,
) => JourneySceneController;

export type MotionManifestFile = {
  path: string;
  sizeBytes: number;
  [key: string]: unknown;
};

export type MotionManifest = {
  schemaVersion: number;
  status: "draft" | "ready";
  version?: string;
  entry: string;
  stylesheet: string;
  poster: string;
  implementation: "svg" | "canvas2d" | "webgl";
  files: MotionManifestFile[];
  [key: string]: unknown;
};

/** Subconjunto do manifest repassado ao cliente quando o pacote está pronto. */
export type MotionPackageInfo = {
  version: string | null;
  entry: string;
  stylesheet: string;
  poster: string;
  implementation: MotionManifest["implementation"];
  /** Base do pacote. Ausente = MOTION_BASE_URL ("/motion/"). Só a /previa usa outra base
   *  (pacote experimental versionado em public/previa/…); a home "/" nunca a define. */
  baseUrl?: string;
};

/** Clamp em [0,1]; valor não finito mantém o anterior (regra do contrato). */
export function normalizeProgress(value: number, previous: number): number {
  if (!Number.isFinite(value)) return previous;
  return Math.min(1, Math.max(0, value));
}

/** Índice textual ativo: Math.round(progress * 3). */
export function stepIndexFromProgress(progress: number): number {
  return Math.round(progress * 3);
}

const SAFE_RELATIVE = /^(?!\/)(?!.*\.\.)(?!.*:)[A-Za-z0-9._\-/]+$/;

export function isSafeRelativePath(p: unknown): p is string {
  return typeof p === "string" && SAFE_RELATIVE.test(p);
}

/**
 * Valida o manifest e devolve as informações necessárias ao cliente, ou null
 * se o pacote não estiver pronto/compatível. Nunca lança.
 */
export function toPackageInfo(raw: unknown): MotionPackageInfo | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Partial<MotionManifest>;
  if (m.schemaVersion !== MOTION_SCHEMA_VERSION) return null;
  if (m.status !== "ready") return null;
  if (![m.entry, m.stylesheet, m.poster].every(isSafeRelativePath)) return null;
  if (!Array.isArray(m.files)) return null;
  const listed = new Set(m.files.map((f) => f?.path));
  if (!listed.has(m.entry!) || !listed.has(m.stylesheet!)) return null;
  if (!["svg", "canvas2d", "webgl"].includes(String(m.implementation))) return null;
  return {
    version: typeof m.version === "string" ? m.version : null,
    entry: m.entry!,
    stylesheet: m.stylesheet!,
    poster: m.poster!,
    implementation: m.implementation!,
  };
}

/* ───────────── Adendo v1.1 (DIRECAO-04), compatível com v1 ───────────── */

export const JOURNEY_LAYOUT_EVENT = "ararat:journey-layout";
export const LABEL_IDS = ["shape", "texture", "intensity"] as const;
export type LabelId = (typeof LABEL_IDS)[number];
export const LABEL_TEXT: Record<LabelId, string> = {
  shape: "Forma",
  texture: "Textura",
  intensity: "Intensidade",
};

export type JourneyLabel = { id: LabelId; x: number; y: number; visible: boolean };
export type JourneyLayout = { progress: number; labels: JourneyLabel[]; emphasis: LabelId | null };

const isLabelId = (v: unknown): v is LabelId => typeof v === "string" && (LABEL_IDS as readonly string[]).includes(v);
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Valida o detail do CustomEvent "ararat:journey-layout". Retorna null para
 * payload inválido/versão desconhecida (o site mantém a legenda estática).
 * ids desconhecidos são ignorados; ids repetidos ficam com a 1ª ocorrência;
 * coordenadas sofrem clamp em [0,1].
 */
export function parseJourneyLayout(detail: unknown): JourneyLayout | null {
  if (!detail || typeof detail !== "object") return null;
  const d = detail as Record<string, unknown>;
  if (d.schemaVersion !== 1 || !Array.isArray(d.labels)) return null;
  const seen = new Set<LabelId>();
  const labels: JourneyLabel[] = [];
  for (const raw of d.labels) {
    if (!raw || typeof raw !== "object") continue;
    const l = raw as Record<string, unknown>;
    const x = Number(l.x);
    const y = Number(l.y);
    if (!isLabelId(l.id) || seen.has(l.id) || !Number.isFinite(x) || !Number.isFinite(y)) continue;
    seen.add(l.id);
    labels.push({ id: l.id, x: clamp(x), y: clamp(y), visible: l.visible === true });
  }
  const p = Number(d.progress);
  return {
    progress: Number.isFinite(p) ? clamp(p) : 0,
    labels,
    emphasis: isLabelId(d.emphasis) ? d.emphasis : null,
  };
}

/** Bloco opcional "hero" do manifest: atmosfera independente da jornada. */
export type HeroAtmosphereInfo = { entry: string; stylesheet: string; poster: string };

export type HeroAtmosphereController = {
  setPaused(paused: boolean): void;
  setReducedMotion(enabled: boolean): void;
  destroy(): void;
};

export type CreateHeroAtmosphere = (
  container: HTMLElement,
  options: { baseUrl: string; paused: boolean; reducedMotion: boolean },
) => HeroAtmosphereController;

export function toHeroInfo(raw: unknown): HeroAtmosphereInfo | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Partial<MotionManifest> & { hero?: Record<string, unknown> };
  if (!toPackageInfo(raw) || !m.hero || typeof m.hero !== "object") return null;
  const { entry, stylesheet, poster } = m.hero;
  if (![entry, stylesheet, poster].every(isSafeRelativePath)) return null;
  const listed = new Set((m.files ?? []).map((f) => f?.path));
  if (![entry, stylesheet, poster].every((p) => listed.has(p as string))) return null;
  return { entry: entry as string, stylesheet: stylesheet as string, poster: poster as string };
}
