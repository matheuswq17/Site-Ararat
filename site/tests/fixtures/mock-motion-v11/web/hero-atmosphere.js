// FIXTURE DE TESTE do site — atmosfera mínima para testar a integração.
export function createHeroAtmosphere(container, options) {
  const log = (window.__heroLog ??= []);
  log.push(["create", options.baseUrl, options.paused, options.reducedMotion]);
  const el = document.createElement("div");
  el.className = "mock-hero-atmosphere";
  el.dataset.paused = String(options.paused);
  container.appendChild(el);
  let destroyed = false;
  return {
    setPaused(v) { if (destroyed) return; log.push(["paused", v]); el.dataset.paused = String(v); },
    setReducedMotion(v) { if (destroyed) return; log.push(["reduced", v]); el.dataset.reduced = String(v); },
    destroy() { if (destroyed) return; destroyed = true; log.push(["destroy"]); el.remove(); },
  };
}
