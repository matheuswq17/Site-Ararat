/**
 * Preferência ÚNICA de movimento do site (pausa global), guardada na sessão ('ararat:paused', a mesma chave do
 * institucional e da refinada). Animações autônomas (luz da montanha, transições da demonstração, fade das camadas na
 * experiência anterior) se registram aqui; o botão [data-pausa] aparece onde houver animação registrada, ou enquanto
 * o site estiver pausado (para poder retomar). Singleton do lado do cliente: sobrevive à navegação entre páginas.
 */
type Fn = (pausado: boolean) => void;
const KEY = "ararat:paused";
const animacoes = new Map<string, Fn>();
let pausado = false;
let iniciado = false;
let rotulos: [string, string] = ["Pause animations", "Resume animations"];

const ler = () => { try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; } };

export function atualizarBotoes() {
  const n = animacoes.size;
  document.querySelectorAll<HTMLButtonElement>("[data-pausa]").forEach((b) => {
    b.hidden = !(n > 0 || pausado);
    b.setAttribute("aria-pressed", String(pausado));
    b.setAttribute("aria-label", pausado ? rotulos[1] : rotulos[0]);
    b.title = pausado ? rotulos[1] : rotulos[0];
    b.dataset.estado = pausado ? "pausado" : "ativo";
  });
  document.documentElement.dataset.movimento = pausado ? "pausado" : "ativo";
}

export const movimento = {
  pausado: () => pausado,
  registrar(nome: string, fn: Fn) { animacoes.set(nome, fn); atualizarBotoes(); },
  remover(nome: string) { animacoes.delete(nome); atualizarBotoes(); },
  semAnimacao(nome: string) { animacoes.delete(nome); atualizarBotoes(); },
  definir(p: boolean) {
    pausado = !!p;
    try { sessionStorage.setItem(KEY, pausado ? "1" : "0"); } catch { /* sem armazenamento */ }
    animacoes.forEach((fn) => { try { fn(pausado); } catch { /* módulo já destruído */ } });
    atualizarBotoes();
  },
};
export type Movimento = typeof movimento;

/** Liga o singleton (uma vez por carregamento) e atualiza os rótulos do idioma da página. */
export function iniciarMovimento(r: [string, string]) {
  rotulos = r;
  if (!iniciado) {
    iniciado = true;
    pausado = ler();
    document.addEventListener("click", (e) => {
      const b = (e.target as Element | null)?.closest?.("[data-pausa]");
      if (b) movimento.definir(!pausado);
    });
    (window as unknown as { ARARAT_MOVIMENTO: Movimento }).ARARAT_MOVIMENTO = movimento; // inspeção nos testes
  }
  atualizarBotoes();
}
