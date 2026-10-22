"use client";

import { useEffect, useLayoutEffect } from "react";
import { conteudo, type Idioma } from "@/lib/ararat/conteudo";
import { MONTANHA_APROVADA, MONTANHA_ESTAVEL, PACOTES, type Montanha } from "@/lib/ararat/midia";
import { iniciarMovimento, movimento } from "@/lib/ararat/cliente/movimento";
import { montarAbas, montarAncoraDeLeitura, montarE2, montarIdiomas, montarMenu } from "@/lib/ararat/cliente/comum";
import { montarAbertura } from "@/lib/ararat/cliente/abertura";
import { montarCamadas } from "@/lib/ararat/cliente/camadas";
import { acompanharDensidade, ancoraDaCarga, espiarRestauracao, montarCaso, reposicionarAncora } from "@/lib/ararat/cliente/caso";
import { montarEntradas } from "@/lib/ararat/cliente/entradas";
import { montarControleRevisao, montarTextos, prepararEntrada } from "@/lib/ararat/cliente/textos";
import { montarDemo } from "@/lib/ararat/cliente/demo";
import { montarNavegacao } from "@/lib/ararat/cliente/navegacao";
import { montarBios } from "@/lib/ararat/cliente/bio";
import { parametro } from "@/lib/ararat/cliente/externo";

type Modulo = "abertura" | "prostata" | "caso" | "demo" | "bio" | "e2";

/**
 * Liga o comportamento do lado do cliente de UMA página e devolve tudo no desmonte (navegação entre páginas,
 * Fast Refresh, StrictMode): cada controlador tem destroy(), e nenhum observador, ouvinte, timer, rAF ou registro de
 * pausa sobrevive à página. Os módulos do Motion são carregados de public/ sem alteração.
 */
export function Controladores({ idioma, modulos }: { idioma: Idioma; modulos: Modulo[]; revisao: boolean }) {
  const chave = modulos.join(",");
  // títulos por linhas (candidato privado): na navegação no app, segura o h1 antes da 1ª pintura da página nova, como
  // o <head> faz na carga do documento (textos.ts)
  useLayoutEffect(() => { prepararEntrada({ pref: movimento, restaurando: espiarRestauracao() }); }, [idioma, chave]);
  useEffect(() => {
    const x = conteudo(idioma).extra;
    // restauração (voltar/avançar, recarga, travessia no app): lida ANTES de o palco consumir o sinal
    const restaurando = espiarRestauracao();
    // âncora que o navegador já posicionou: a montagem abaixo pode deslocá-la; reposicionada no fim (ver caso.ts)
    const ancora = ancoraDaCarga();
    iniciarMovimento([x.pausar, x.retomar]);
    const desfazer: Array<() => void> = [montarMenu(), montarNavegacao(), montarIdiomas(), acompanharDensidade(), montarAncoraDeLeitura()];
    const tem = (m: Modulo) => chave.split(",").includes(m);

    // revisão privada, só para teste do adaptador: ?camadas=fade usa o caminho com fade da experiência anterior;
    // ?camadas=duplo põe um 2º bloco igual na página (duas instâncias independentes)
    const blocos = [...document.querySelectorAll<HTMLElement>("main [data-saidas]")];
    const modoTeste = parametro("camadas");
    if (blocos.length && (modoTeste === "fade" || modoTeste === "duplo")) {
      blocos.forEach((b) => b.removeAttribute("data-troca-imediata"));
      if (modoTeste === "duplo") {
        const c = blocos[0].cloneNode(true) as HTMLElement;
        c.dataset.clone = "1";
        c.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
        blocos[0].after(c); blocos.push(c);
        desfazer.push(() => c.remove());
      }
    }

    desfazer.push(montarAbas(document.querySelector("main") ?? document));
    if (tem("prostata") && blocos.length) desfazer.push(montarCamadas(blocos, { pref: movimento, url: PACOTES.saidasCaso }));
    const grade = document.querySelector<HTMLElement>("[data-atlas]");
    if (tem("caso") && grade) desfazer.push(montarCaso(grade));
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    if (tem("abertura") && hero) {
      // montanha: estável (padrão), candidata do Motion (1.3.1, repouso de 5 s) ou a candidata anterior (1.3.0) — só na
      // revisão privada (?montanha=estavel|candidata|anterior, guardado na aba para valer também na volta à Home). Na
      // pública ignora comparações e usa o ritmo aprovado.
      let escolha = parametro("montanha");
      try {
        if (escolha === "estavel" || escolha === "candidata" || escolha === "anterior") sessionStorage.setItem("ararat:montanha-versao", escolha);
        else if (document.documentElement.dataset.revisao === "1") escolha = sessionStorage.getItem("ararat:montanha-versao");
      } catch { /* sem armazenamento */ }
      // a candidata só existe se o servidor a gravou no herói (revisão privada); a pública nem tem o atributo
      const ler = (v?: string): Montanha | null => { try { return v ? (JSON.parse(v) as Montanha) : null; } catch { return null; } };
      const candidata = ler(hero.dataset.montanhaCandidata), anterior = ler(hero.dataset.montanhaCandidataAnterior);
      const m = (escolha === "estavel" && MONTANHA_ESTAVEL) || (escolha === "candidata" && candidata)
        || (escolha === "anterior" && anterior)
        || (document.documentElement.dataset.revisao === "1" ? MONTANHA_ESTAVEL : MONTANHA_APROVADA);
      hero.dataset.montanhaVersao = m.versao;
      desfazer.push(montarAbertura(hero, { pref: movimento, pkg: m.base, posters: m.posters, ambiente: m.ambiente, ambientPerfil: m.ambientPerfil, composicao: PACOTES.composicao }));
    }
    const demo = document.querySelector<HTMLElement>("[data-demo-raiz]");
    if (tem("demo") && demo && demo.querySelector("dialog")) desfazer.push(montarDemo(demo, { pref: movimento }));
    if (tem("bio")) desfazer.push(montarBios());
    // movimento editorial: atual (padrão) ou candidato da rodada de 16/10 — só na revisão privada
    // (?editorial=atual|candidato, guardado na aba). Na pública parametro() é null e fica o atual.
    let editorial = parametro("editorial");
    try {
      if (editorial === "atual" || editorial === "candidato") sessionStorage.setItem("ararat:editorial-versao", editorial);
      else if (document.documentElement.dataset.revisao === "1") editorial = sessionStorage.getItem("ararat:editorial-versao");
    } catch { /* sem armazenamento */ }
    if (document.documentElement.dataset.texto === "gsap") {
      // títulos por linhas (candidato privado ?texto=gsap): substitui as entradas editoriais e a E2 nos mesmos títulos
      let parar = montarTextos({ pref: movimento, restaurando });
      const repetir = () => {
        parar(); scrollTo({ top: 0, behavior: "instant" });
        document.documentElement.dataset.textoEntrada = "h1";
        requestAnimationFrame(() => { parar = montarTextos({ pref: movimento, restaurando: false, forcar: true }); });
      };
      desfazer.push(() => parar(), montarControleRevisao(repetir));
    } else if (tem("abertura") && editorial === "candidato") desfazer.push(montarEntradas({ pref: movimento, restaurando }));
    else if (tem("e2")) desfazer.push(montarE2()); // E2 e o candidato animam o mesmo título: nunca juntos
    reposicionarAncora(ancora);

    return () => { desfazer.splice(0).reverse().forEach((f) => { try { f(); } catch { /* já desfeito */ } }); };
  }, [idioma, chave]);
  return null;
}
