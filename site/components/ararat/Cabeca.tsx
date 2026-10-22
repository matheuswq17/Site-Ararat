import { REVISAO_PRIVADA, TEXTOS, TRANSICOES } from "@/lib/ararat/ambiente";

/** Conteúdo comum do <head> dos três layouts do site (EN/PT/ES). */
const FONTES_JS = `window.ARARAT_FONTES=(document.fonts&&document.fonts.load)?Promise.race([Promise.all(['300 74px "Source Sans 3"','400 18px "Source Sans 3"','500 18px "Source Sans 3"','600 16px "Source Sans 3"'].map(function(f){return document.fonts.load(f)})).then(function(){return document.fonts.ready}).catch(function(){return document.fonts.ready}),new Promise(function(r){setTimeout(r,3000)})]):Promise.resolve();document.documentElement.classList.add('js');`;

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
      <link rel="preload" href="/ararat/fontes/SourceSans3-latin-wght.woff2" as="font" type="font/woff2" crossOrigin="" />
      {/* Abertura e SplitText esperam a fonte (teto de 3 s); em falha, seguem com a fonte de apoio. Latin-ext sob demanda. */}
      <script dangerouslySetInnerHTML={{ __html: FONTES_JS }} />
      {TRANSICOES ? <script dangerouslySetInnerHTML={{ __html: TRANSICAO_JS }} /> : null}
      {TEXTOS ? <script dangerouslySetInnerHTML={{ __html: TEXTO_JS }} /> : null}
    </>
  );
}
