// FIXTURE DE TESTE do site — não é o pacote do Claude Motion.
// Implementa a interface do contrato v1 e registra chamadas em window.__motionLog.
export function createJourneyScene(container, options) {
  const log = (window.__motionLog ??= []);
  log.push(["create", options.baseUrl, options.reducedMotion, options.paused]);
  const el = document.createElement("div");
  el.className = "mock-journey";
  el.dataset.mock = "journey";
  container.appendChild(el);
  let progress = 0;
  let destroyed = false;
  const render = () => {
    el.dataset.progress = progress.toFixed(4);
    el.style.setProperty("--p", String(progress));
  };
  render();
  return {
    setProgress(p) {
      if (!Number.isFinite(p)) return;
      progress = Math.min(1, Math.max(0, p));
      log.push(["progress", progress]);
      render();
    },
    setReducedMotion(v) { log.push(["reduced", v]); el.dataset.reduced = String(v); },
    setPaused(v) { log.push(["paused", v]); el.dataset.paused = String(v); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      log.push(["destroy"]);
      el.remove();
    },
  };
}
