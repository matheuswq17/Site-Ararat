/* Camadas reais do caso (glândula+zonas × T2) — módulo saidas-caso 0.1.0-candidato do Motion, SEM alteração.
 * O Site controla abas, foco, legendas e aviso. Sem JS ou com falha do módulo: as duas figuras ficam uma abaixo da
 * outra, cada uma com legenda e aviso.
 *  - corte seco quando o bloco pede (`data-troca-imediata`, caso da Home), com movimento reduzido OU pausa global;
 *    fora disso (experiência anterior) o fade de 200 ms do módulo continua;
 *  - um registro de pausa e um destroy() por bloco (`saidas-0`, `saidas-1`…).
 * Integração 14/10 — pausa ligada NO MEIO de um fade (contrato R3 §3-1 do Motion): o adaptador conclui a troca na hora
 * com a API existente — setReducedMotion(true); mostrar(anterior); mostrar(alvo). Sem quadro animado depois da pausa,
 * estado final = alvo. O módulo emite 'ararat:saida' para a camada anterior nesse passo intermediário; o adaptador
 * suprime ESSE evento (só o do alvo segue), para não haver consequência duplicada. Sem versão nova do módulo. */
import { importarExterno, parametro } from "./externo";
import type { Movimento } from "./movimento";

type Saidas = { mostrar(id: string): void; atual(): string; setReducedMotion(b: boolean): void; destroy(): void };
type Modulo = { createSaidasCaso(host: HTMLElement, o: unknown): Saidas };
export type InstanciaCamadas = { nome: string; bloco: HTMLElement; modulo: Saidas; mostrar(id: string): void; destroy(): void };
const DUR = 200;

export function montarCamadas(blocos: HTMLElement[], { pref, url }: { pref: Movimento; url: string }): () => void {
  const instancias: InstanciaCamadas[] = [];
  let destruido = false, desistiu = false;
  // Enquanto o módulo não responde, o bloco já tem a geometria do módulo montado (1ª camada, abas reservadas, aviso e
  // legenda: ver "pendente" em site.css). Se ele não montar em PRAZO, o bloco passa ao modo estático (as duas figuras,
  // a mesma alternativa da falha) e uma resposta tardia é ignorada — a 2ª camada nunca fica inacessível e a geometria
  // muda no máximo uma vez. Não mexe na rolagem.
  const PRAZO = 4000;
  const estatico = () => blocos.forEach((b) => { if (!b.dataset.saidasModo) b.dataset.saidasModo = "estatico"; });
  const prazo = window.setTimeout(() => { desistiu = true; estatico(); }, PRAZO);
  (window as unknown as { __saidasBlocos: InstanciaCamadas[] }).__saidasBlocos = instancias;

  (async () => {
    let M: Modulo;
    try {
      if (parametro("saidas") === "falha") throw new Error("falha simulada");
      M = await importarExterno<Modulo>(url);
    } catch { clearTimeout(prazo); blocos.forEach((b) => { b.dataset.saidasModo = "estatico"; }); return; }
    clearTimeout(prazo);
    if (destruido || desistiu) return;
    const red = matchMedia("(prefers-reduced-motion: reduce)");
    blocos.forEach((bloco, i) => {
      const host = bloco.querySelector<HTMLElement>("[data-saidas-host]");
      const figs = [...bloco.querySelectorAll<HTMLElement>("[data-camada]")];
      const tl = bloco.querySelector<HTMLElement>("[role=tablist]");
      if (!host || !tl || figs.length < 2) return;
      const camadas = figs.map((f) => { const im = f.querySelector("img")!; return { id: f.dataset.camada!, src: im.currentSrc || im.src, alt: im.alt, logico: { w: +f.dataset.w!, h: +f.dataset.h! } }; });
      const imediata = bloco.hasAttribute("data-troca-imediata");
      const semFade = () => imediata || red.matches || pref.pausado();
      const inicial = tl.querySelector<HTMLElement>("[aria-selected=true]")?.dataset.vista || camadas[0].id;
      let s: Saidas;
      try { s = M.createSaidasCaso(host, { camadas, inicial, reducedMotion: semFade() }); }
      catch { bloco.dataset.saidasModo = "estatico"; return; }
      bloco.dataset.saidasModo = "modulo";
      tl.hidden = false;
      const nome = "saidas-" + i;
      // troca com fade em curso: de onde veio e até quando (DUR + a folga de 30 ms do módulo)
      let anterior: string | null = null, emTroca = 0, suprimir: string | null = null;
      const onSaida = (e: Event) => {
        const id = (e as CustomEvent<{ id: string }>).detail?.id;
        if (suprimir !== null && id === suprimir) { e.stopImmediatePropagation(); suprimir = null; }
      };
      host.addEventListener("ararat:saida", onSaida, true);
      const atualizar = () => {
        const r = semFade();
        s.setReducedMotion(r);
        if (r && emTroca && anterior !== null) { // concluir AGORA a troca em curso
          const alvo = s.atual();
          clearTimeout(emTroca); emTroca = 0;
          if (anterior !== alvo) { suprimir = anterior; s.mostrar(anterior); s.mostrar(alvo); }
          suprimir = null; anterior = null;
        }
      };
      const red2 = () => atualizar();
      red.addEventListener?.("change", red2);
      if (!imediata) pref.registrar(nome, atualizar); // no caso da Home (corte seco) não há o que pausar
      const legendas = [...bloco.querySelectorAll<HTMLElement>("[data-legenda]")];
      const mostrar = (id: string) => {
        atualizar();
        const de = s.atual();
        s.mostrar(id);
        if (de !== id && !semFade()) { anterior = de; clearTimeout(emTroca); emTroca = window.setTimeout(() => { emTroca = 0; anterior = null; }, DUR + 30); }
        legendas.forEach((l) => { l.hidden = l.dataset.legenda !== id; });
      };
      mostrar(inicial);
      const onAba = (e: Event) => mostrar((e as CustomEvent<{ vista: string }>).detail.vista);
      tl.addEventListener("aba", onAba);
      instancias.push({
        nome, bloco, modulo: s, mostrar,
        destroy() {
          clearTimeout(emTroca);
          red.removeEventListener?.("change", red2);
          tl.removeEventListener("aba", onAba);
          host.removeEventListener("ararat:saida", onSaida, true);
          if (!imediata) pref.remover(nome);
          s.destroy(); bloco.dataset.saidasModo = "destruido"; tl.hidden = true;
          legendas.forEach((l) => { l.hidden = false; });
        },
      });
    });
  })();

  return () => { destruido = true; clearTimeout(prazo); instancias.splice(0).forEach((x) => x.destroy()); };
}
