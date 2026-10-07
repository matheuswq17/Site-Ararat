/* STUB DE CONTRATO — só para testes do Site (injetado pelo Playwright via window.__TIME_RETRATO_TESTE__).
 * NÃO é o efeito do Motion. Implementa a FORMA do contrato real (createStipplePortrait, 0.1.0) sem desenho,
 * para provar só a fiação do Site: quais métodos são chamados, com que argumentos e em que ordem.
 * Registra tudo em window.__retratoLog. */
export function createStipplePortrait(raiz, opts) {
  const log = (window.__retratoLog ??= []);
  log.push(["create", opts.inicial, opts.visao, !!opts.paused, opts.pessoas.map((p) => p.id).join(",")]);
  let ativo = opts.inicial, pedido = opts.inicial, visao = opts.visao, paused = !!opts.paused;
  const st = () => ({ fase: paused ? "foto-estatica" : visao === "foto" ? "foto" : "pontos", ativo, pedido, visao, modo: paused ? "foto" : "interativo", revelado: 0, animando: false });
  const emitir = () => opts.onEstado?.(st());
  queueMicrotask(emitir);
  return {
    VERSION: "stub",
    pronto: Promise.resolve(),
    select(id) { log.push(["select", id]); pedido = id; ativo = id; emitir(); return Promise.resolve(true); },
    preload(id) { log.push(["preload", id]); return Promise.resolve("pronto"); },
    setVisao(v) { log.push(["setVisao", v]); visao = v; emitir(); },
    setHover(v) { log.push(["setHover", v]); },
    setPaused(v) { log.push(["setPaused", v]); paused = !!v; emitir(); },
    setReducedMotion(v) { log.push(["setReducedMotion", v]); },
    setCor(c) { log.push(["setCor", c]); },
    get state() { return st(); },
    destroy() { log.push(["destroy", ativo]); },
  };
}
