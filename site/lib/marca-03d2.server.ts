import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Leitura no servidor dos arquivos OFICIAIS do kit 03D2 que precisam entrar no HTML (não como <img>):
 *  · a assinatura animável (07_motion/ararat-assinatura-animavel.svg) — inserida sem alteração no cabeçalho,
 *    para a logo estar completa no HTML e ter as camadas separadas para a revelação;
 *  · a revelação em CSS (07_motion/ararat-revelacao.css) — os mesmos tempos e curvas do kit; só o seletor
 *    ".ar-reveal.is-revealing" vira ".ar-reveal" porque o script de abertura injeta o <style> (sem tocar no
 *    markup do React) em vez de acrescentar a classe.
 */
function ler(arquivo: string): string | null {
  try {
    return readFileSync(join(process.cwd(), "public", "marca-03d2", "v1.0", "07_motion", arquivo), "utf8").trim();
  } catch {
    return null; // arquivo ausente: cabeçalho usa a assinatura horizontal como <img>, sem revelação
  }
}

/** null → o cabeçalho cai para o <img> da assinatura horizontal (mesmo desenho, sem camadas). */
export const SVG_ASSINATURA_ANIMAVEL = ler("ararat-assinatura-animavel.svg");

const CSS_REVELACAO = (ler("ararat-revelacao.css") ?? "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replaceAll(".ar-reveal.is-revealing", ".ar-reveal")
  .replace(/\s+/g, " ")
  .trim();

/**
 * Revelação da marca (900 ms; uma vez por aba). Síncrono, colocado ANTES do cabeçalho no HTML: decide antes
 * de a logo ser pintada e não altera nada do markup do React. Não toca com pausa salva (mesma chave da pausa
 * global) nem numa 2ª página da mesma aba. Movimento reduzido: o próprio CSS do kit troca por esmaecimento de
 * 140 ms. O <style> sai em 1,1 s (quadro final = logo parada, igual ao HTML). Nada espera por ele: links e
 * rolagem ficam livres o tempo todo. Sem JavaScript, a logo aparece completa e parada.
 */
export const SCRIPT_REVELACAO = !SVG_ASSINATURA_ANIMAVEL || !CSS_REVELACAO ? null : `(function(){try{var s=sessionStorage;if(s.getItem("ararat:paused")==="1"||s.getItem("ararat:revelacao")==="1")return;s.setItem("ararat:revelacao","1");var e=document.createElement("style");e.id="ararat-revelacao";e.textContent=${JSON.stringify(
  CSS_REVELACAO + ' html[data-motion="paused"] .ar-reveal, html[data-motion="paused"] .ar-reveal * { animation: none !important; }',
)};document.head.appendChild(e);setTimeout(function(){e.remove()},1100)}catch(_){}})();`;
