import { REVISAO_PRIVADA, TEXTOS, TRANSICOES } from "@/lib/ararat/ambiente";

/** Conteúdo comum do <head> dos três layouts do site (EN/PT/ES). */
const FONTES_JS = "window.ARARAT_FONTES=(document.fonts&&document.fonts.load)?Promise.race([Promise.all(['500 74px Lora','400 18px Inter','500 18px Inter','600 16px Inter'].map(function(f){return document.fonts.load(f)})).then(function(){return document.fonts.ready}),new Promise(function(r){setTimeout(r,3000)})]):Promise.resolve();document.documentElement.classList.add('js');";

/**
 * Transição aprovada (styles/ararat/transicoes.css e EntradaPagina.tsx); comparação só na revisão privada.
 * Script no <head>: modo da sessão para comparação, ?transicao=atual|candidata (sessionStorage), padrão "candidata".
 */
const TRANSICAO_JS = REVISAO_PRIVADA
  ? "(function(){var K='ararat:transicao',m='candidata';try{var q=new URLSearchParams(location.search).get('transicao');if(q==='atual'||q==='candidata')sessionStorage.setItem(K,q);m=sessionStorage.getItem(K)||'candidata'}catch(e){}document.documentElement.dataset.transicao=m})();"
  : "document.documentElement.dataset.transicao='candidata';";

/**
 * Títulos por linhas aprovados (lib/ararat/cliente/textos.ts). Script no <head>:
 * ?texto=atual|gsap (sessionStorage, padrão "atual"). No candidato, numa carga elegível (sem recarga, histórico,
 * âncora, pausa, movimento reduzido nem h1 já visto na aba), marca data-texto-entrada="h1": o CSS segura o h1 marcado
 * ANTES da 1ª pintura (sem aparecer e sumir), com um prazo de segurança só de CSS (2,5 s) se o JS não chegar.
 */
const TEXTO_JS = `(function(){var d=document.documentElement,m='${REVISAO_PRIVADA ? "atual" : "gsap"}';`
  + (REVISAO_PRIVADA ? "try{var K='ararat:texto-versao',q=new URLSearchParams(location.search).get('texto');if(q==='atual'||q==='gsap')sessionStorage.setItem(K,q);m=sessionStorage.getItem(K)||'atual'}catch(e){}" : "")
  + "d.dataset.texto=m;if(m!=='gsap')return;try{var n=performance.getEntriesByType('navigation')[0],t=n&&n.type;if(t==='reload'||t==='back_forward'||location.hash||matchMedia('(prefers-reduced-motion: reduce)').matches||sessionStorage.getItem('ararat:paused')==='1')return;var v=JSON.parse(sessionStorage.getItem('ararat:textos-vistos')||'[]');if(v.indexOf('h1:'+location.pathname)>=0)return;d.dataset.textoEntrada='h1'}catch(e){}})();";

export function CabecaArarat() {
  return (
    <>
      <link rel="preload" href="/ararat/fontes/Inter-latin-wght.woff2" as="font" type="font/woff2" crossOrigin="" />
      <link rel="preload" href="/ararat/fontes/Lora-latin-wght.woff2" as="font" type="font/woff2" crossOrigin="" />
      {/* A abertura só mede depois de Lora e Inter carregadas (teto de 3 s); a classe .js liga os estilos que dependem de script */}
      <script dangerouslySetInnerHTML={{ __html: FONTES_JS }} />
      {TRANSICOES ? <script dangerouslySetInnerHTML={{ __html: TRANSICAO_JS }} /> : null}
      {TEXTOS ? <script dangerouslySetInnerHTML={{ __html: TEXTO_JS }} /> : null}
    </>
  );
}
