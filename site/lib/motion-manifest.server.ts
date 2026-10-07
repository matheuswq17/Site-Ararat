import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isSafeRelativePath, toHeroInfo, toPackageInfo, type HeroAtmosphereInfo, type MotionPackageInfo } from "./motion-contract";
import { normalizeMap, sourceFromMotion, SITE_MRI, type MriSource } from "./mri";

const MOTION_DIR = path.join(process.cwd(), "public", "motion");

function readManifest(): unknown {
  try {
    return JSON.parse(readFileSync(path.join(MOTION_DIR, "manifest.json"), "utf8"));
  } catch {
    return null;
  }
}

/**
 * Lê public/motion/manifest.json em tempo de build/requisição.
 * Se o pacote não foi sincronizado (npm run motion:sync), retorna null e a
 * página usa a cena estática própria — sem import estático de arquivo ausente.
 */
export function readMotionPackage(): MotionPackageInfo | null {
  return toPackageInfo(readManifest());
}

/** Atmosfera do hero (bloco opcional "hero" do manifest); null = fundo estático. */
export function readHeroAtmosphere(): HeroAtmosphereInfo | null {
  return toHeroInfo(readManifest());
}

/**
 * Fonte da RM para todas as cenas. Com pacote ready que traga
 * assets/mri-base.webp + assets/mri-map.json (revisão 02), usa a base e as
 * máscaras demonstrativas do Motion; caso contrário, a base do site sem máscaras.
 */
export function readMriSource(): MriSource {
  const manifest = readManifest() as { files?: Array<{ path?: string }>; version?: string } | null;
  const pkg = toPackageInfo(manifest);
  if (!pkg || !manifest?.files) return SITE_MRI;
  const listed = new Set(manifest.files.map((f) => f?.path));
  if (!listed.has("assets/mri-map.json")) return SITE_MRI;
  try {
    const raw = JSON.parse(readFileSync(path.join(MOTION_DIR, "assets", "mri-map.json"), "utf8"));
    const map = normalizeMap(raw);
    const image = typeof raw?.image === "string" ? raw.image.replace(/^\.?\//, "") : "assets/mri-base.webp";
    const rel = image.startsWith("assets/") ? image : `assets/${image}`;
    if (!map || !isSafeRelativePath(rel) || !listed.has(rel)) return SITE_MRI;
    return sourceFromMotion(`/motion/${rel}`, map, pkg.version);
  } catch {
    return SITE_MRI;
  }
}
