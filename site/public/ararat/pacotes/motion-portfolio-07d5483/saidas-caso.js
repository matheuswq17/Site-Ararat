/**
 * ARARAT · saídas reais de um mesmo caso (bloco Próstata) — CANDIDATO 0.1.0 (portfolio-motion-v1). Não integrado,
 * sem aprovação estética.
 *
 * Divisão de responsabilidades:
 *   - Site: controles (botões/abas), foco, rótulos, textos, avisos, origem/versão/estágio, idioma. Chama mostrar(id).
 *   - Motion (este módulo): só o tratamento da mídia — camadas empilhadas do MESMO quadro e a transição entre elas.
 *
 * Regras (do pedido do proprietário):
 *   - troca SÓ por ação da pessoa (mostrar), nunca por tempo: sem laço, sem autoavanço, sem barra de progresso,
 *     sem varredura nem "pintura" da máscara — nada que pareça uma inferência rodando;
 *   - as imagens são capturas reais, exibidas como estão: sem filtro, sem recolorir, sem desenho sobre os pixels,
 *     sem ampliar além do tamanho lógico da captura (largura máxima = `logico.w` px CSS);
 *   - as camadas precisam ser registradas (mesma fatia, mesmo enquadramento); o Site confere isso no manifesto da mídia.
 *   - transição: só opacidade entre a camada atual e a nova, 200 ms (03D2 `base`), curva `standard`
 *     cubic-bezier(0.2,0,0,1). Movimento reduzido ou pausado: troca imediata.
 *   - sem JS: o Site mostra a camada inicial como <img> comum (é a mesma que o módulo usa).
 *
 * API:
 *   createSaidasCaso(host, { camadas: [{ id, src, srcset?, alt, logico: {w, h} }], inicial, reducedMotion })
 *     → { mostrar(id), atual(), setReducedMotion(b), destroy() }
 *   host: elemento vazio do Site. Eventos: 'ararat:saida' (detail { id }) no host ao fim de cada troca.
 */
export const VERSION = '0.1.0-candidato';
const DUR = 200, EASE = 'cubic-bezier(0.2,0,0,1)';

export function createSaidasCaso(host, opts = {}) {
  const camadas = opts.camadas || [];
  if (!camadas.length) throw new Error('saidas-caso: sem camadas');
  const L = camadas[0].logico;
  if (camadas.some((c) => c.logico.w !== L.w || c.logico.h !== L.h)) throw new Error('saidas-caso: camadas com tamanhos diferentes não são o mesmo quadro');
  let reduced = !!opts.reducedMotion, atual = opts.inicial || camadas[0].id, destroyed = false;
  const box = document.createElement('div');
  box.className = 'ararat-saidas';
  box.dataset.version = VERSION;
  box.style.cssText = `position:relative;width:100%;max-width:${L.w}px;aspect-ratio:${L.w}/${L.h};`;
  const imgs = new Map();
  for (const c of camadas) {
    const i = document.createElement('img');
    i.src = c.src; if (c.srcset) i.srcset = c.srcset;
    i.sizes = `(max-width: ${L.w}px) 100vw, ${L.w}px`;
    i.alt = c.alt || ''; i.width = L.w; i.height = L.h; i.decoding = 'async'; i.draggable = false;
    i.style.cssText = `position:absolute;inset:0;width:100%;height:100%;display:block;opacity:${c.id === atual ? 1 : 0};transition:none;`;
    if (c.id !== atual) i.setAttribute('aria-hidden', 'true');
    i.dataset.camada = c.id;
    box.append(i); imgs.set(c.id, i);
  }
  host.append(box);
  box.dataset.camada = atual;
  let fim = 0;
  function mostrar(id) {
    if (destroyed || !imgs.has(id) || id === atual) return;
    const de = imgs.get(atual), para = imgs.get(id);
    clearTimeout(fim);
    for (const [k, i] of imgs) if (k !== atual && k !== id) { i.style.transition = 'none'; i.style.opacity = 0; }
    const t = reduced ? 'none' : `opacity ${DUR}ms ${EASE}`;
    // a nova camada sobe POR CIMA da atual (a atual fica plena até o fim): nunca há quadro meio vazio
    para.style.zIndex = 2; de.style.zIndex = 1;
    para.style.transition = t; para.style.opacity = 1;
    para.removeAttribute('aria-hidden'); de.setAttribute('aria-hidden', 'true');
    const anterior = atual; atual = id; box.dataset.camada = id;
    const concluir = () => { const d = imgs.get(anterior); if (d && anterior !== atual) { d.style.transition = 'none'; d.style.opacity = 0; } host.dispatchEvent(new CustomEvent('ararat:saida', { detail: { id } })); };
    if (reduced) concluir(); else fim = setTimeout(concluir, DUR + 30);
  }
  return {
    mostrar, atual: () => atual,
    setReducedMotion(b) { reduced = !!b; },
    destroy() { destroyed = true; clearTimeout(fim); box.remove(); imgs.clear(); },
  };
}
