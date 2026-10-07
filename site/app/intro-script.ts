/**
 * Script síncrono no <head>, executado antes da primeira pintura. Decide se a
 * abertura do hero toca SEM alterar nenhum elemento renderizado pelo React
 * (nada de atributos em <html>/<body>, portanto sem divergência de hidratação):
 * quando toca, injeta <style id="ararat-intro"> com as variáveis --intro-*,
 * que nomeiam keyframes globais (styles/site.css). Remover o <style> leva tudo
 * ao estado final imediatamente.
 *  - uma vez por aba (sessionStorage protegido por try/catch);
 *  - pula com hash profundo, prefers-reduced-motion ou pausa do usuário;
 *  - scroll, roda, toque, clique ou tecla concluem a abertura sem bloquear a ação;
 *  - resize/troca de breakpoint durante a entrada conclui direto no estado final;
 *  - encerra sozinha em 1400 ms (composição assentada em ~1200 ms).
 * Sem JS, nada é injetado e o conteúdo aparece em estado final.
 *
 * Portão da RM (independe da abertura): com JS, a RM fica invisível enquanto o
 * arquivo não terminou (evita pintura parcial, de cima para baixo, em rede lenta
 * antes da hidratação). Liberado no load/error do <image data-mri-image>, no load
 * da página ou em 8 s. Depois da hidratação, data-mri-state assume o controle.
 * O mesmo <style> mostra o aviso local "Carregando imagem de RM…" (texto que já vem
 * no HTML, oculto) durante essa espera — entra após 450 ms, só se a RM ainda não chegou.
 */
/**
 * Layout de ABERTURA da rota experimental /previa (só nela; nunca em "/"). Aplicado antes da
 * 1ª pintura quando há JS, sem movimento reduzido e sem pausa salva — senão vale o layout
 * estático de components/preview/HomeOpening.module.css (hero com poster + jornada em fluxo).
 * A jornada começa no topo; o hero vira uma camada sobre a trilha; a pista (--runway) dá a
 * passagem; --opening-p (0–1) é escrito pelo controlador a partir da MESMA medida da jornada.
 */
export const OPENING_CSS = [
  "[data-opening=root]{--runway:74vh}",
  "@media (max-width:959.98px){[data-opening=root]{--runway:62vh}}",
  "[data-opening=layer]{position:absolute;top:0;left:0;right:0;height:calc(var(--runway) + 100vh);z-index:3;pointer-events:none;overflow:visible;background:none}",
  "[data-opening=sticky]{display:block;position:sticky;top:0;height:100vh;margin-bottom:-100vh;overflow:hidden}",
  "[data-opening=backdrop]{opacity:calc((1 - var(--opening-p,0)) / 0.14)}",
  // Com o canvas (home-v2 ≥ 0.2.0): o módulo cobre o próprio quadro (e só o revela com a cena pronta);
  // fora do quadro, um fundo com “janela” no contorno do quadro cobre a jornada até p 0,86–1.
  "[data-opening=root][data-sculpture=canvas] [data-opening=backdrop]{opacity:0}",
  "[data-opening=root][data-sculpture=canvas] [data-opening=surround]{display:block;position:absolute;left:var(--frame-x,0);top:var(--frame-y,0);width:var(--frame-w,0);height:var(--frame-h,0);border-radius:var(--frame-r,12px);box-shadow:0 0 0 200vmax var(--navy-900);opacity:calc((1 - var(--opening-p,0)) / 0.14)}",
  "[data-opening=content]{opacity:calc(1 - var(--opening-p,0) * 4)}",
  // Antes da hidratação (sem estado de cobertura ainda), os grupos cobertos ficam fora do foco.
  "[data-opening=root]:not([data-cover]) :is([data-opening=stage-col],[data-opening=steps-col]){visibility:hidden}",
  "[data-opening=root] [data-opening=poster]{opacity:calc((0.8 - var(--opening-p,0)) * 2.5)}",
  "[data-opening=root][data-sculpture=canvas] [data-opening=poster]{opacity:0}",
  "[data-opening=root] #jornada{padding-top:0;scroll-margin-top:calc((var(--runway) + var(--header-h)) * -1);background:linear-gradient(180deg,var(--navy-900) 0%,var(--navy-900) 85%,#0b1724 100%)}",
  "[data-opening=runway-desktop],[data-opening=runway-mobile]{height:var(--runway)}",
  // Foco de chegada dos links para #jornada (programático, tabindex -1): a rolagem já mostra o destino.
  "[data-opening=root] #jornada:focus{outline:none}",
  "@media (max-width:959.98px){[data-opening=stage-col]{position:sticky;top:calc(var(--header-h) + 8px);z-index:1}[data-opening=root] #jornada{scroll-margin-top:calc((var(--runway) - 8px) * -1)}}",
].join("");

export const INTRO_SCRIPT = `(function(){var OPENING_CSS=${JSON.stringify(OPENING_CSS)};try{
var gs=document.createElement("style");gs.id="ararat-mri-gate";
gs.textContent='svg[data-mri-state="initial"] image[data-mri-image]{opacity:0}svg[data-mri-state="initial"] [data-mri-wait]{visibility:visible;animation:ararat-fade-in 240ms ease-out 450ms both}@media (prefers-reduced-motion: reduce){svg[data-mri-state="initial"] [data-mri-wait]{animation:none}}';
document.head.appendChild(gs);
function og(){var n=document.getElementById("ararat-mri-gate");if(n&&n.parentNode){n.parentNode.removeChild(n)}
document.removeEventListener("load",lg,true);document.removeEventListener("error",lg,true)}
function lg(e){var t=e.target;if(t&&t.hasAttribute&&t.hasAttribute("data-mri-image")){og()}}
document.addEventListener("load",lg,true);document.addEventListener("error",lg,true);
addEventListener("load",og);setTimeout(og,8000);
}catch(e){}
try{
var s=null;try{s=window.sessionStorage}catch(e){}
function g(k){try{return s&&s.getItem(k)}catch(e){return null}}
var rm=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if(!rm&&g("ararat:paused")!=="1"&&/^\\/previa(\\/(a|b|refinada))?\\/?$/.test(location.pathname)){
var os=document.createElement("style");os.id="ararat-opening";os.textContent=OPENING_CSS;document.head.appendChild(os)}
var h=location.hash;var deep=h&&h!=="#"&&h!=="#inicio";
if(rm||deep||g("ararat:intro")==="1"||g("ararat:paused")==="1"){return}
try{s&&s.setItem("ararat:intro","1")}catch(e){}
var st=document.createElement("style");st.id="ararat-intro";
st.textContent=":root{--intro-word:ararat-word-in;--intro-line:ararat-line-in;--intro-fade:ararat-fade-in;--intro-arc:ararat-arc-draw;--intro-focus:ararat-focus-in;--intro-poster:0}[data-opening=root] [data-opening=poster]{opacity:0!important}";
document.head.appendChild(st);
var ev=["wheel","touchstart","pointerdown","keydown"],y=window.scrollY||0,vw=window.innerWidth;
function end(){var n=document.getElementById("ararat-intro");if(n&&n.parentNode){n.parentNode.removeChild(n)}
for(var i=0;i<ev.length;i++){removeEventListener(ev[i],end,true)}removeEventListener("scroll",sc,true);removeEventListener("resize",rz)}
function sc(){if(Math.abs((window.scrollY||0)-y)>4){end()}}
function rz(){if(window.innerWidth!==vw){end()}}
for(var i=0;i<ev.length;i++){addEventListener(ev[i],end,{capture:true,passive:true})}
addEventListener("scroll",sc,{capture:true,passive:true});addEventListener("resize",rz);setTimeout(end,1400);
}catch(e){}})();`;
