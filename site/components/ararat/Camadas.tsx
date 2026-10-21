import { conteudo, type Idioma } from "@/lib/ararat/conteudo";
import { exibivel, type ArquivoCaptura } from "@/lib/ararat/midia";
import { AvisoP, CapturaTexto, ImgCaptura, Aviso } from "./base";

/**
 * As duas camadas reais da MESMA fatia (glândula+zonas × T2), trocadas pelo visitante. Com JS, o módulo saidas-caso
 * do Motion empilha as camadas (corte seco quando `imediata`). Sem JS ou falha: as duas figuras em sequência, cada uma
 * com o aviso M1 e a legenda. Variante apta a publicação: a descrição textual das duas camadas, sem o módulo.
 */
export function Camadas({ idioma, imediata }: { idioma: Idioma; imediata?: boolean }) {
  const P = conteudo(idioma).prostata;
  const midia = P.midia.map((v) => ({ ...v, img: v.img as ArquivoCaptura }));
  if (!midia.every((v) => exibivel(v.img))) {
    return (
      <div className="midia midia-texto">
        {midia.map((v) => (
          <div key={v.id} className="camada-texto"><CapturaTexto idioma={idioma} alt={v.alt} /><p className="legenda">{v.aba} — {v.legenda}</p></div>
        ))}
        <AvisoP className="aviso-colado">{P.aviso_regua}</AvisoP>
        <p className="legenda caso">{P.caso}</p>
      </div>
    );
  }
  return (
    <div className="midia" data-saidas="" data-troca-imediata={imediata ? "" : undefined}>
      <div className="abas" role="tablist" hidden aria-label={P.midia_rotulo}>
        {midia.map((v, j) => (
          <button key={v.id} role="tab" id={`t-${v.id}`} data-vista={v.id} aria-controls="painel-midia" aria-selected={j === 0 ? "true" : "false"} tabIndex={j === 0 ? undefined : -1}>{v.aba}</button>
        ))}
      </div>
      <div className="palco-saidas" id="painel-midia" role="tabpanel" aria-label={P.midia_rotulo}>
        <div className="saidas-host" data-saidas-host="" />
        {midia.map((v, j) => (
          <figure key={v.id} className="camada" data-camada={v.id} data-w="374" data-h="380">
            <ImgCaptura arquivo={v.img} alt={v.alt} eager={j === 0} />
            <figcaption className="legenda sem-js"><Aviso colado>{P.aviso_regua}</Aviso>{v.aba} — {v.legenda}</figcaption>
          </figure>
        ))}
      </div>
      <AvisoP className="aviso-colado so-modulo">{P.aviso_regua}</AvisoP>
      {midia.map((v) => <p key={v.id} className="legenda leg-camada" data-legenda={v.id}>{v.legenda}</p>)}
      <p className="legenda caso">{P.caso}</p>
    </div>
  );
}
