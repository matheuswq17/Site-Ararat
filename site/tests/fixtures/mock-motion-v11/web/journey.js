// FIXTURE DE TESTE do site (adendo v1.1) — não é o pacote do Claude Motion.
// Emite "ararat:journey-layout" no container e expõe data-loaded.
export function createJourneyScene(container, options) {
  const log = (window.__motionLog ??= []);
  log.push(["create", options.baseUrl, options.reducedMotion, options.paused]);
  const root = document.createElement("div");
  root.className = "ararat-journey mock-journey";
  root.dataset.loaded = "false";
  container.appendChild(root);
  let progress = 0, destroyed = false, last = "";
  const emit = () => {
    if (destroyed) return;
    const show = progress >= 0.3;
    const final = progress >= 0.95;
    // Em "Explicação" a ordem visual muda (textura no topo); os ids acompanham.
    const ys = final ? { texture: 0.3, intensity: 0.5, shape: 0.7 } : { shape: 0.3, texture: 0.5, intensity: 0.7 };
    const detail = {
      schemaVersion: 1,
      progress,
      labels: ["intensity", "shape", "texture"].map((id) => ({ id, x: 0.8, y: ys[id], visible: show })),
      emphasis: final ? "texture" : null,
    };
    const key = JSON.stringify(detail);
    if (key === last) return;
    last = key;
    log.push(["layout", progress]);
    container.dispatchEvent(new CustomEvent("ararat:journey-layout", { detail, bubbles: false }));
  };
  const t = setTimeout(() => {
    if (destroyed) return;
    root.dataset.loaded = window.__failMockImage ? "error" : "true";
    emit();
  }, 50);
  return {
    setProgress(p) {
      if (!Number.isFinite(p)) return;
      progress = Math.min(1, Math.max(0, p));
      root.dataset.progress = progress.toFixed(4);
      if (root.dataset.loaded === "true") emit();
    },
    setReducedMotion(v) { root.dataset.reduced = String(v); },
    setPaused(v) { log.push(["paused", v]); root.dataset.paused = String(v); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearTimeout(t);
      log.push(["destroy"]);
      root.remove();
    },
  };
}
