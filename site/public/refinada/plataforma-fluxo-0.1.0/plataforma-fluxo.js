/* ARARAT — Plataforma: percurso Hub → Viewer conduzido pela rolagem. Motion, 0.1.0-draft (rascunho).
 *
 * Demonstração sobre CAPTURAS REAIS dos produtos (Hub claro, Viewer escuro; caso público e desidentificado
 * ProstateX-0067, coleção PROSTATEx/TCIA, CC BY 3.0). Não é um aplicativo dentro do site nem um vídeo: cada quadro
 * é uma captura (ou recorte dela) e o avanço segue SÓ o progresso que o Site envia (setProgresso). Parou de rolar,
 * o quadro fica; subiu, volta aos mesmos estados. Sem relógio próprio, sem controlador de rolagem.
 *
 *   const f = createPlataformaFluxo(host, { palco, base, progresso: 'externo', paused, reducedMotion, onEstado })
 *   f.setProgresso(p) · f.setPaused(bool) · f.setReducedMotion(bool|null) · f.atualizar() · f.state · f.destroy()
 *   Evento 'fluxo:estado' no host quando etapa, modo ou carregamento mudam.
 *   host: data-fluxo-modo ('animado' | 'estatico'), data-fluxo-etapa (1–7), data-fluxo-layout, data-fluxo-carregado.
 *
 * Sem JS, com pausa, com movimento reduzido ou se o módulo/um asset falhar: o módulo não desenha nada e deixa
 * data-fluxo-modo="estatico" — o Site mostra o roteiro estático (HTML com as mesmas capturas-chave).
 * Regras de imagem: troca de quadro dentro de uma sequência é seca (como a roda do mouse no produto); entre cenas,
 * a placa escurece e reaparece — nunca mistura duas imagens médicas numa só.
 */
export const VERSION = '0.1.0-draft';
const NS_DADOS = {"versao":"0.1.0-draft","etapas":[{"etapa":1,"nome":"fila","ate":0.17},{"etapa":2,"nome":"abrir","ate":0.3},{"etapa":3,"nome":"cortes","ate":0.47},{"etapa":4,"nome":"comparar","ate":0.6},{"etapa":5,"nome":"medir","ate":0.73},{"etapa":6,"nome":"documentar","ate":0.88},{"etapa":7,"nome":"retorno","ate":1.01}],"layouts":{"desktop":{"W":1100,"H":800,"placas":[{"id":"hub-cartoes","tema":"hub","fundo":"#F6F4EF","x":47,"y":70,"w":1006.48,"h":106.72,"cx":56,"cy":52,"z":0.92,"o":[[0,1],[0.072,1],[0.078,0],[0.125,0],[0.135,1],[0.245,1],[0.27,0]],"camadas":[{"a":"hub-cartoes-01a","o":[[0,1],[0.078,1],[0.0781,0]]},{"a":"hub-cartoes-01d","o":[[0.0781,0],[0.0782,1]]}],"marcas":[{"t":"realce","r":[60,56,258,108],"o":[[0.135,0],[0.15,1],[0.2,1],[0.215,0]]}]},{"id":"hub-fila","tema":"hub","fundo":"#F6F4EF","x":[[0.17,106],[0.2,30]],"y":200,"w":[[0.17,888],[0.2,663.0400000000001]],"h":[[0.17,423],[0.2,315.84000000000003]],"cx":48,"cy":172,"z":[[0.17,1.5],[0.2,1.12]],"o":[[0,1],[0.245,1],[0.27,0]],"camadas":[{"a":"hub-fila-01a","o":[[0,1],[0.075,1],[0.081,0]]},{"a":"hub-fila-01c02","o":[[0.075,0],[0.081,1],[0.1,1],[0.106,0]]},{"a":"hub-fila-01c03","o":[[0.1,0],[0.106,1],[0.125,1],[0.131,0]]},{"a":"hub-fila-01d","o":[[0.125,0],[0.131,1]]}],"marcas":[{"t":"realce","r":[50,294,588,52],"o":[[0.035,0],[0.05,1],[0.25,1],[0.265,0]]},{"t":"toque","c":[170,320],"u":[[0.042,0],[0.06,1]]}]},{"id":"hub-painel","tema":"hub","fundo":"#F6F4EF","x":[[0.17,730],[0.2,700]],"y":200,"w":389.2,"h":310.79999999999995,"cx":1162,"cy":348,"z":1.4,"o":[[0.17,0],[0.2,1],[0.245,1],[0.27,0]],"camadas":[{"a":"hub-painel-02a"}],"marcas":[{"t":"realce","r":[1176,528,248,38],"o":[[0.2,0],[0.21,1],[0.235,1],[0.245,0]]},{"t":"toque","c":[1300,547],"u":[[0.212,0],[0.22999999999999998,1]]}]},{"id":"viewer","tema":"viewer","fundo":"#0B0C0F","x":[[0.235,719.6],[0.275,172.5],[0.68,172.5],[0.7,30],[0.775,30],[0.79,110]],"y":[[0.235,452],[0.275,18],[0.68,18],[0.7,96],[0.775,96],[0.79,18]],"w":[[0.235,347.2],[0.275,755],[0.68,755],[0.7,600],[0.775,600],[0.79,422]],"h":[[0.235,53.199999999999996],[0.275,764],[0.68,764],[0.7,608],[0.775,608],[0.79,764]],"z":[[0.235,0.45986754966887416],[0.275,1],[0.3,1],[0.33,1.95],[0.425,1.95],[0.445,1],[0.6069,1],[0.607,1.95],[0.68,1.95],[0.7,1.6],[0.775,1.6],[0.79,1.144]],"cx":[[0.3,0],[0.33,-5.6],[0.425,-5.6],[0.445,0],[0.6069,0],[0.607,-5.6],[0.68,-5.6],[0.7,0.5],[0.775,0.5],[0.79,381]],"cy":[[0.3,0],[0.33,-5],[0.425,-5],[0.445,0],[0.6069,0],[0.607,-5],[0.68,-5],[0.7,1],[0.775,1],[0.79,74]],"o":[[0.2349,0],[0.235,1],[0.845,1],[0.855,0.25],[0.876,0.25],[0.885,0]],"camadas":[{"a":"viewer-area-02c","o":[[0.235,1],[0.335,1],[0.3351,0]]}],"seqs":[{"a":["viewer-axial-07","viewer-axial-08","viewer-axial-09","viewer-axial-10","viewer-axial-11","viewer-axial-12","viewer-axial-13","viewer-axial-14","viewer-axial-15","viewer-axial-16","viewer-axial-17","viewer-axial-18","viewer-axial-19"],"o":[[0.334,0],[0.335,1],[0.43,1],[0.4301,0]],"i":[[0.335,4],[0.4,12],[0.425,6]]},{"a":["viewer-mpr-0","viewer-mpr-1","viewer-mpr-2","viewer-mpr-3","viewer-mpr-4","viewer-mpr-5","viewer-mpr-6"],"o":[[0.43,0],[0.4301,1],[0.47,1],[0.478,0]],"i":[[0.445,0],[0.468,6]]},{"a":["viewer-comp-0","viewer-comp-1","viewer-comp-2","viewer-comp-3","viewer-comp-4","viewer-comp-5","viewer-comp-6","viewer-comp-7","viewer-comp-8"],"o":[[0.478,0],[0.488,1],[0.6,1],[0.607,0]],"i":[[0.495,0],[0.555,8]]},{"a":["viewer-regua-05a","viewer-regua-05c","viewer-regua-05d33","viewer-regua-05d66","viewer-regua-05e","viewer-chave-axial-06b","viewer-chave-axial-06c"],"o":[[0.607,0],[0.615,1],[0.775,1],[0.782,0]],"i":[[0.6,0],[0.6349,0],[0.635,1],[0.6449,1],[0.645,2],[0.6549,2],[0.655,3],[0.6659,3],[0.666,4],[0.7349,4],[0.735,5],[0.7559,5],[0.756,6]]},{"a":["viewer-chave-adc-06b","viewer-chave-adc-06c"],"o":[[0.782,0],[0.792,1]],"i":[[0.78,0],[0.7999,0],[0.8,1]]}],"marcas":[{"t":"toque","c":[180,200],"u":[[0.428,0],[0.446,1]]},{"t":"realce","r":[383,742,150,20],"o":[[0.556,0],[0.566,1],[0.598,1],[0.605,0]],"raio":4},{"t":"toque","c":[134,199],"u":[[0.626,0],[0.644,1]]},{"t":"toque","c":[292,199],"u":[[0.66,0],[0.678,1]]},{"t":"toque","c":[27,357],"u":[[0.744,0],[0.762,1]]},{"t":"toque","c":[406,715],"u":[[0.793,0],[0.811,1]]}]},{"id":"painel-direito","tema":"viewer","fundo":"#081316","x":[[0.69,700],[0.71,660]],"y":64,"w":427.35,"h":672,"cx":0,"cy":0,"z":1.05,"o":[[0.69,0],[0.71,1],[0.845,1],[0.855,0.25],[0.876,0.25],[0.885,0]],"camadas":[{"a":"viewer-medicoes-05f","o":[[0,1],[0.81,1],[0.816,0]]},{"a":"viewer-galeria-06d","o":[[0.81,0],[0.816,1]]}],"marcas":[{"t":"realce","r":[20,92,367,88],"o":[[0.71,0],[0.72,1],[0.8,1],[0.81,0]]},{"t":"realce","r":[14,10,280,44],"o":[[0.82,0],[0.83,1],[0.85,1],[0.855,0]]},{"t":"toque","c":[203,612],"u":[[0.842,0],[0.86,1]]}]},{"id":"previa","tema":"viewer","fundo":"#14181D","x":[[0.855,674.7],[0.872,150]],"y":[[0.855,689.8000000000001],[0.872,68]],"w":[[0.855,399],[0.872,800]],"h":[[0.855,33.6],[0.872,663.75]],"cx":0,"cy":0,"z":[[0.855,0.6234375],[0.872,1.25]],"o":[[0.8549,0],[0.855,1],[0.888,1],[0.9,0]],"camadas":[{"a":"viewer-previa-06f"}]},{"id":"status","tema":"viewer","fundo":"#11161B","x":150,"y":700,"w":800,"h":52.800000000000004,"cx":0,"cy":0,"z":1.6,"raio":6,"o":[[0.898,0],[0.906,1],[0.925,1],[0.935,0]],"camadas":[{"a":"viewer-status-07c"}]},{"id":"hub-volta","tema":"hub","fundo":"#F6F4EF","x":106,"y":190,"w":888,"h":423,"cx":48,"cy":172,"z":1.5,"o":[[0.918,0],[0.94,1]],"camadas":[{"a":"hub-fila-07a"}],"marcas":[{"t":"realce","r":[423,294,217,52],"o":[[0.945,0],[0.96,1]]}]}]},"celular":{"W":360,"H":600,"placas":[{"id":"hub-linha","tema":"hub","fundo":"#F6F4EF","x":0,"y":[[0.17,200],[0.2,40]],"w":360,"h":82.8,"cx":[[0.065,48],[0.095,240]],"cy":262,"z":0.9,"o":[[0,1],[0.245,1],[0.27,0]],"camadas":[{"a":"hub-linha-01a","o":[[0,1],[0.075,1],[0.081,0]]},{"a":"hub-linha-01c02","o":[[0.075,0],[0.081,1],[0.1,1],[0.106,0]]},{"a":"hub-linha-01c03","o":[[0.1,0],[0.106,1],[0.125,1],[0.131,0]]},{"a":"hub-linha-01d","o":[[0.125,0],[0.131,1]]}],"marcas":[{"t":"realce","r":[50,294,588,52],"o":[[0.035,0],[0.05,1],[0.25,1],[0.265,0]]},{"t":"toque","c":[170,320],"u":[[0.042,0],[0.06,1]]}]},{"id":"hub-painel","tema":"hub","fundo":"#F6F4EF","x":[[0.17,40],[0.2,13]],"y":170,"w":333.59999999999997,"h":266.4,"cx":1162,"cy":348,"z":1.2,"o":[[0.17,0],[0.2,1],[0.245,1],[0.27,0]],"camadas":[{"a":"hub-painel-02a"}],"marcas":[{"t":"realce","r":[1176,528,248,38],"o":[[0.2,0],[0.21,1],[0.235,1],[0.245,0]]},{"t":"toque","c":[1300,547],"u":[[0.212,0],[0.22999999999999998,1]]}]},{"id":"viewer","tema":"viewer","fundo":"#0B0C0F","x":[[0.235,29.8],[0.275,2],[0.775,2],[0.79,20]],"y":[[0.235,386],[0.275,119],[0.775,119],[0.79,10]],"w":[[0.235,297.59999999999997],[0.275,356],[0.775,356],[0.79,320]],"h":[[0.235,45.6],[0.275,362],[0.775,362],[0.79,580]],"z":[[0.235,0.7942353883106484],[0.275,0.95],[0.425,0.95],[0.445,0.47152317880794703],[0.556,0.47152317880794703],[0.572,0.8],[0.6069,0.8],[0.607,0.95],[0.775,0.95],[0.79,0.868]],"cx":[[0.275,0.6],[0.425,0.6],[0.445,0],[0.556,0],[0.572,154.5],[0.6069,154.5],[0.607,0.6],[0.775,0.6],[0.79,381]],"cy":[[0.275,0.5],[0.425,0.5],[0.445,0],[0.556,0],[0.572,311.5],[0.6069,311.5],[0.607,0.5],[0.775,0.5],[0.79,74]],"o":[[0.2349,0],[0.235,1],[0.685,1],[0.695,0],[0.735,0],[0.745,1],[0.805,1],[0.812,0]],"camadas":[{"a":"viewer-area-02c","o":[[0.235,1],[0.335,1],[0.3351,0]]}],"seqs":[{"a":["viewer-axial-07","viewer-axial-08","viewer-axial-09","viewer-axial-10","viewer-axial-11","viewer-axial-12","viewer-axial-13","viewer-axial-14","viewer-axial-15","viewer-axial-16","viewer-axial-17","viewer-axial-18","viewer-axial-19"],"o":[[0.334,0],[0.335,1],[0.43,1],[0.4301,0]],"i":[[0.335,4],[0.4,12],[0.425,6]]},{"a":["viewer-mpr-0","viewer-mpr-1","viewer-mpr-2","viewer-mpr-3","viewer-mpr-4","viewer-mpr-5","viewer-mpr-6"],"o":[[0.43,0],[0.4301,1],[0.47,1],[0.478,0]],"i":[[0.445,0],[0.468,6]]},{"a":["viewer-comp-0","viewer-comp-1","viewer-comp-2","viewer-comp-3","viewer-comp-4","viewer-comp-5","viewer-comp-6","viewer-comp-7","viewer-comp-8"],"o":[[0.478,0],[0.488,1],[0.6,1],[0.607,0]],"i":[[0.495,0],[0.555,8]]},{"a":["viewer-regua-05a","viewer-regua-05c","viewer-regua-05d33","viewer-regua-05d66","viewer-regua-05e","viewer-chave-axial-06b","viewer-chave-axial-06c"],"o":[[0.607,0],[0.615,1],[0.775,1],[0.782,0]],"i":[[0.6,0],[0.6349,0],[0.635,1],[0.6449,1],[0.645,2],[0.6549,2],[0.655,3],[0.6659,3],[0.666,4],[0.7349,4],[0.735,5],[0.7559,5],[0.756,6]]},{"a":["viewer-chave-adc-06b","viewer-chave-adc-06c"],"o":[[0.782,0],[0.792,1]],"i":[[0.78,0],[0.7999,0],[0.8,1]]}],"marcas":[{"t":"toque","c":[180,200],"u":[[0.428,0],[0.446,1]]},{"t":"realce","r":[383,742,150,20],"o":[[0.556,0],[0.566,1],[0.598,1],[0.605,0]],"raio":4},{"t":"toque","c":[134,199],"u":[[0.626,0],[0.644,1]]},{"t":"toque","c":[292,199],"u":[[0.66,0],[0.678,1]]},{"t":"toque","c":[27,357],"u":[[0.744,0],[0.762,1]]},{"t":"toque","c":[406,715],"u":[[0.793,0],[0.811,1]]}]},{"id":"medicoes","tema":"viewer","fundo":"#081316","x":5,"y":25,"w":350.02,"h":550.4,"cx":0,"cy":0,"z":0.86,"o":[[0.69,0],[0.705,1],[0.725,1],[0.735,0]],"camadas":[{"a":"viewer-medicoes-05f"}],"marcas":[{"t":"realce","r":[20,92,367,88],"o":[[0.705,0],[0.712,1],[0.72,1],[0.728,0]]}]},{"id":"galeria","tema":"viewer","fundo":"#081316","x":5,"y":13,"w":350.1,"h":574.2,"cx":0,"cy":0,"z":0.9,"o":[[0.812,0],[0.822,1],[0.845,1],[0.855,0.25],[0.876,0.25],[0.885,0]],"camadas":[{"a":"viewer-galeria-06e"}],"marcas":[{"t":"realce","r":[8,8,272,44],"o":[[0.822,0],[0.832,1],[0.85,1],[0.855,0]]},{"t":"toque","c":[194,610],"u":[[0.842,0],[0.86,1]]}]},{"id":"previa","tema":"viewer","fundo":"#14181D","x":[[0.855,15.8],[0.872,1]],"y":[[0.855,547.6],[0.872,151]],"w":[[0.855,328.5],[0.872,358]],"h":[[0.855,28.8],[0.872,297.028125]],"cx":0,"cy":0,"z":[[0.855,0.51328125],[0.872,0.559375]],"o":[[0.8549,0],[0.855,1],[0.888,1],[0.9,0]],"camadas":[{"a":"viewer-previa-06f"}]},{"id":"status","tema":"viewer","fundo":"#11161B","x":5,"y":470,"w":350,"h":23.099999999999998,"cx":0,"cy":0,"z":0.7,"raio":4,"o":[[0.898,0],[0.906,1],[0.925,1],[0.935,0]],"camadas":[{"a":"viewer-status-07c"}]},{"id":"hub-volta","tema":"hub","fundo":"#F6F4EF","x":0,"y":258,"w":360,"h":82.8,"cx":240,"cy":262,"z":0.9,"o":[[0.918,0],[0.94,1]],"camadas":[{"a":"hub-linha-07a"}],"marcas":[{"t":"realce","r":[423,294,217,52],"o":[[0.945,0],[0.96,1]]}]}]}},"assets":{"hub-fila-01a":{"w":592,"h":282,"pos":[48,172],"esp":"H","f1":"hub-fila-01a@1x.webp","f2":"hub-fila-01a@2x.webp"},"hub-fila-01c02":{"w":592,"h":282,"pos":[48,172],"esp":"H","f1":"hub-fila-01c02@1x.webp","f2":"hub-fila-01c02@2x.webp"},"hub-fila-01c03":{"w":592,"h":282,"pos":[48,172],"esp":"H","f1":"hub-fila-01c03@1x.webp","f2":"hub-fila-01c03@2x.webp"},"hub-fila-01d":{"w":592,"h":282,"pos":[48,172],"esp":"H","f1":"hub-fila-01d@1x.webp","f2":"hub-fila-01d@2x.webp"},"hub-fila-07a":{"w":592,"h":282,"pos":[48,172],"esp":"H","f1":"hub-fila-07a@1x.webp","f2":"hub-fila-07a@2x.webp"},"hub-cartoes-01a":{"w":1094,"h":116,"pos":[56,52],"esp":"H","f1":"hub-cartoes-01a@1x.webp","f2":"hub-cartoes-01a@2x.webp"},"hub-cartoes-01d":{"w":1094,"h":116,"pos":[56,52],"esp":"H","f1":"hub-cartoes-01d@1x.webp","f2":"hub-cartoes-01d@2x.webp"},"hub-linha-01a":{"w":592,"h":92,"pos":[48,262],"esp":"H","f1":"hub-linha-01a@1x.webp","f2":"hub-linha-01a@2x.webp"},"hub-linha-01c02":{"w":592,"h":92,"pos":[48,262],"esp":"H","f1":"hub-linha-01c02@1x.webp","f2":"hub-linha-01c02@2x.webp"},"hub-linha-01c03":{"w":592,"h":92,"pos":[48,262],"esp":"H","f1":"hub-linha-01c03@1x.webp","f2":"hub-linha-01c03@2x.webp"},"hub-linha-01d":{"w":592,"h":92,"pos":[48,262],"esp":"H","f1":"hub-linha-01d@1x.webp","f2":"hub-linha-01d@2x.webp"},"hub-linha-07a":{"w":592,"h":92,"pos":[48,262],"esp":"H","f1":"hub-linha-07a@1x.webp","f2":"hub-linha-07a@2x.webp"},"hub-painel-02a":{"w":278,"h":222,"pos":[1162,348],"esp":"H","f1":"hub-painel-02a@1x.webp","f2":"hub-painel-02a@2x.webp"},"viewer-area-02c":{"w":755,"h":764,"pos":[0,0],"esp":"V","f1":"viewer-area-02c@1x.webp","f2":"viewer-area-02c@2x.webp"},"viewer-axial-07":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-07@1x.webp","f2":"viewer-axial-07@2x.webp"},"viewer-axial-08":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-08@1x.webp","f2":"viewer-axial-08@2x.webp"},"viewer-axial-09":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-09@1x.webp","f2":"viewer-axial-09@2x.webp"},"viewer-axial-10":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-10@1x.webp","f2":"viewer-axial-10@2x.webp"},"viewer-axial-11":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-11@1x.webp","f2":"viewer-axial-11@2x.webp"},"viewer-axial-12":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-12@1x.webp","f2":"viewer-axial-12@2x.webp"},"viewer-axial-13":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-13@1x.webp","f2":"viewer-axial-13@2x.webp"},"viewer-axial-14":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-14@1x.webp","f2":"viewer-axial-14@2x.webp"},"viewer-axial-15":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-15@1x.webp","f2":"viewer-axial-15@2x.webp"},"viewer-axial-16":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-16@1x.webp","f2":"viewer-axial-16@2x.webp"},"viewer-axial-17":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-17@1x.webp","f2":"viewer-axial-17@2x.webp"},"viewer-axial-18":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-18@1x.webp","f2":"viewer-axial-18@2x.webp"},"viewer-axial-19":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-19@1x.webp","f2":"viewer-axial-19@2x.webp"},"viewer-mpr-0":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-0@1x.webp","f2":"viewer-mpr-0@2x.webp"},"viewer-mpr-1":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-1@1x.webp","f2":"viewer-mpr-1@2x.webp"},"viewer-mpr-2":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-2@1x.webp","f2":"viewer-mpr-2@2x.webp"},"viewer-mpr-3":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-3@1x.webp","f2":"viewer-mpr-3@2x.webp"},"viewer-mpr-4":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-4@1x.webp","f2":"viewer-mpr-4@2x.webp"},"viewer-mpr-5":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-5@1x.webp","f2":"viewer-mpr-5@2x.webp"},"viewer-mpr-6":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-6@1x.webp","f2":"viewer-mpr-6@2x.webp"},"viewer-comp-0":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-0@1x.webp","f2":"viewer-comp-0@2x.webp"},"viewer-comp-1":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-1@1x.webp","f2":"viewer-comp-1@2x.webp"},"viewer-comp-2":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-2@1x.webp","f2":"viewer-comp-2@2x.webp"},"viewer-comp-3":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-3@1x.webp","f2":"viewer-comp-3@2x.webp"},"viewer-comp-4":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-4@1x.webp","f2":"viewer-comp-4@2x.webp"},"viewer-comp-5":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-5@1x.webp","f2":"viewer-comp-5@2x.webp"},"viewer-comp-6":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-6@1x.webp","f2":"viewer-comp-6@2x.webp"},"viewer-comp-7":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-7@1x.webp","f2":"viewer-comp-7@2x.webp"},"viewer-comp-8":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-8@1x.webp","f2":"viewer-comp-8@2x.webp"},"viewer-regua-05a":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-regua-05a@1x.webp","f2":"viewer-regua-05a@2x.webp"},"viewer-regua-05c":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-regua-05c@1x.webp","f2":"viewer-regua-05c@2x.webp"},"viewer-regua-05d33":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-regua-05d33@1x.webp","f2":"viewer-regua-05d33@2x.webp"},"viewer-regua-05d66":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-regua-05d66@1x.webp","f2":"viewer-regua-05d66@2x.webp"},"viewer-regua-05e":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-regua-05e@1x.webp","f2":"viewer-regua-05e@2x.webp"},"viewer-chave-axial-06b":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-chave-axial-06b@1x.webp","f2":"viewer-chave-axial-06b@2x.webp"},"viewer-chave-axial-06c":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-chave-axial-06c@1x.webp","f2":"viewer-chave-axial-06c@2x.webp"},"viewer-chave-adc-06b":{"w":369,"h":668,"pos":[381,74],"esp":"V","f1":"viewer-chave-adc-06b@1x.webp","f2":"viewer-chave-adc-06b@2x.webp"},"viewer-chave-adc-06c":{"w":369,"h":668,"pos":[381,74],"esp":"V","f1":"viewer-chave-adc-06c@1x.webp","f2":"viewer-chave-adc-06c@2x.webp"},"viewer-medicoes-05f":{"w":407,"h":640,"pos":[0,0],"esp":"P","f1":"viewer-medicoes-05f@1x.webp","f2":"viewer-medicoes-05f@2x.webp"},"viewer-galeria-06d":{"w":407,"h":640,"pos":[0,0],"esp":"P","f1":"viewer-galeria-06d@1x.webp","f2":"viewer-galeria-06d@2x.webp"},"viewer-galeria-06e":{"w":389,"h":638,"pos":[0,0],"esp":"G","f1":"viewer-galeria-06e@1x.webp","f2":"viewer-galeria-06e@2x.webp"},"viewer-previa-06f":{"w":640,"h":531,"pos":[0,0],"esp":"R","f1":"viewer-previa-06f@1x.webp","f2":"viewer-previa-06f@2x.webp"},"viewer-status-07c":{"w":500,"h":33,"pos":[0,0],"esp":"S","f1":"viewer-status-07c@1x.webp","f2":"viewer-status-07c@2x.webp"}}};
export const DADOS = NS_DADOS;
export const ETAPAS = NS_DADOS.etapas || [];

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sstep = (t) => t * t * (3 - 2 * t);
/** valor de uma trilha de chaves [[p, v], …] em p (suave entre chaves; constante fora). */
export function trilha(k, p, linear = false) {
  if (k == null) return undefined;
  if (typeof k === 'number') return k;
  const n = k.length;
  if (p <= k[0][0]) return k[0][1];
  if (p >= k[n - 1][0]) return k[n - 1][1];
  let i = 0; while (p > k[i + 1][0]) i++;
  const [p0, v0] = k[i], [p1, v1] = k[i + 1];
  const t = p1 > p0 ? (p - p0) / (p1 - p0) : 1;
  return v0 + (v1 - v0) * (linear ? t : sstep(t));
}
export function etapaDe(p) { for (const e of ETAPAS) if (p < e.ate) return e.etapa; return ETAPAS.length ? ETAPAS[ETAPAS.length - 1].etapa : 0; }

/** Estado puro de uma placa em p (usado também nos testes). */
export function avaliarPlaca(pl, p) {
  const o = clamp01(trilha(pl.o, p) ?? 1);
  const r = { o, x: trilha(pl.x, p), y: trilha(pl.y, p), w: trilha(pl.w, p), h: trilha(pl.h, p), cx: trilha(pl.cx, p), cy: trilha(pl.cy, p), z: trilha(pl.z, p) };
  r.camadas = (pl.camadas || []).map((c) => clamp01(trilha(c.o, p) ?? 1));
  r.seqs = (pl.seqs || []).map((s) => ({ i: Math.round(trilha(s.i, p, true)), o: clamp01(trilha(s.o, p) ?? 1) }));
  r.marcas = (pl.marcas || []).map((m) => (m.t === 'toque' ? { u: clamp01(trilha(m.u, p) ?? 0) } : { o: clamp01(trilha(m.o, p) ?? 0) }));
  return r;
}

export function createPlataformaFluxo(host, opts = {}) {
  const O = {
    palco: null,          // elemento onde o módulo desenha (padrão: [data-fluxo-palco] dentro do host)
    base: null,           // URL da pasta dos assets (padrão: ./assets/ ao lado deste arquivo)
    progresso: 'externo', // o Site envia setProgresso(p); o módulo não lê a rolagem
    paused: false,
    reducedMotion: 'auto',
    layout: 'auto',       // 'auto' (celular quando o palco tem < 600 px de largura) | 'desktop' | 'celular'
    suavizar: 120,        // ms: acompanha saltos grandes de rolagem com suavização curta
    onEstado: null,
    raf: (f) => requestAnimationFrame(f), caf: (h) => cancelAnimationFrame(h), agora: () => performance.now(),
    ...opts,
  };
  const palco = O.palco || host.querySelector('[data-fluxo-palco]') || host;
  const base = String(O.base || new URL('./assets/', import.meta.url));
  const mqRed = matchMedia('(prefers-reduced-motion: reduce)');
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  let paused = !!O.paused, redForcado = O.reducedMotion === 'auto' ? null : !!O.reducedMotion;
  let alvo = 0, atual = -1, handle = 0, ultimo = 0, visivel = false, destruido = false, falhou = false;
  let layout = null, L = null, k = 1, assinatura = '', carregados = 0, precisos = 0;
  const stats = { n: 0, ms: 0, max: 0 };
  const imgs = new Map();   // asset id → { el, usada: [pMin, pMax], arquivo }
  let mundo = null, placas = [];

  const reduzido = () => (redForcado != null ? redForcado : mqRed.matches);
  const estatico = () => paused || reduzido() || falhou || !NS_DADOS.layouts;
  const sty = (el, k2, v) => { if (el.style[k2] !== v) el.style[k2] = v; };
  const setVis = (el, o) => { const v = o > 0.004 ? 'visible' : 'hidden'; if (el.style.visibility !== v) el.style.visibility = v; sty(el, 'opacity', o >= 0.999 ? '1' : String(+o.toFixed(3))); };

  function escolherLayout() {
    if (O.layout !== 'auto') return O.layout;
    const w = palco.clientWidth || host.clientWidth || innerWidth;
    return w < 600 ? 'celular' : 'desktop';
  }
  function medir() {
    const W = palco.clientWidth, H = palco.clientHeight;
    if (!L || !W || !H) return;
    k = Math.min(W / L.W, H / L.H);
    const ox = (W - L.W * k) / 2, oy = (H - L.H * k) / 2;
    sty(mundo, 'transform', `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px) scale(${k.toFixed(5)})`);
  }
  function construir() {
    desmontarDom();
    layout = escolherLayout(); L = NS_DADOS.layouts[layout];
    mundo = document.createElement('div');
    mundo.className = 'pf-mundo'; mundo.setAttribute('aria-hidden', 'true');
    Object.assign(mundo.style, { position: 'absolute', left: '0', top: '0', width: L.W + 'px', height: L.H + 'px', transformOrigin: '0 0', pointerEvents: 'none' });
    // escala de cada asset (px de tela por px lógico) → 1× ou 2×
    k = Math.min((palco.clientWidth || L.W) / L.W, (palco.clientHeight || L.H) / L.H);
    const zmax = new Map(), uso = new Map();
    const usar = (id, z, keys) => {
      zmax.set(id, Math.max(zmax.get(id) || 0, z));
      const ps = (keys && typeof keys !== 'number' ? keys.filter((kk) => kk[1] > 0).map((kk) => kk[0]) : [0, 1]);
      const u = uso.get(id) || [1, 0]; uso.set(id, [Math.min(u[0], ...ps, 1), Math.max(u[1], ...ps, 0)]);
    };
    for (const pl of L.placas) {
      const zz = typeof pl.z === 'number' ? pl.z : Math.max(...pl.z.map((q) => q[1]));
      const vis = pl.o;
      (pl.camadas || []).forEach((c) => usar(c.a, zz, c.o ?? vis));
      (pl.seqs || []).forEach((s) => s.a.forEach((a) => usar(a, zz, s.o ?? vis)));
    }
    placas = L.placas.map((pl) => {
      const el = document.createElement('div'); el.className = 'pf-placa'; el.dataset.placa = pl.id; el.dataset.tema = pl.tema;
      Object.assign(el.style, { position: 'absolute', left: '0', top: '0', overflow: 'hidden', borderRadius: (pl.raio ?? 10) + 'px', background: pl.fundo, boxShadow: pl.sombra || '0 18px 48px rgba(3,8,14,0.45)', visibility: 'hidden', willChange: 'transform, opacity', contain: 'layout paint' });
      const cam = document.createElement('div'); cam.className = 'pf-cam';
      Object.assign(cam.style, { position: 'absolute', left: '0', top: '0', transformOrigin: '0 0' });
      el.append(cam);
      const novaImg = (id) => {
        const a = NS_DADOS.assets[id]; if (!a) throw new Error('asset ausente: ' + id);
        let reg = imgs.get(id);
        const im = document.createElement('img');
        im.alt = ''; im.decoding = 'async'; im.draggable = false;
        Object.assign(im.style, { position: 'absolute', left: a.pos[0] + 'px', top: a.pos[1] + 'px', width: a.w + 'px', height: a.h + 'px', maxWidth: 'none', visibility: 'hidden', opacity: '0', userSelect: 'none' });
        const fator = (zmax.get(id) || 1) * k * dpr();
        const arq = fator > 1.1 ? a.f2 : a.f1;
        if (!reg) { reg = { els: [], usada: uso.get(id) || [0, 1], arquivo: arq, pronta: false }; imgs.set(id, reg); precisos++; }
        reg.els.push(im);
        im.addEventListener('load', () => { if (!reg.pronta) { reg.pronta = true; carregados++; emitir(); } }, { once: true });
        im.addEventListener('error', () => { falhou = true; host.dataset.fluxoFalha = id; aplicar(); }, { once: true });
        cam.append(im); return im;
      };
      const camadas = (pl.camadas || []).map((c) => novaImg(c.a));
      const seqs = (pl.seqs || []).map((s) => s.a.map(novaImg));
      const marcas = (pl.marcas || []).map((m) => {
        const d = document.createElement('div'); d.className = m.t === 'toque' ? 'pf-toque' : 'pf-realce';
        if (m.t === 'toque') Object.assign(d.style, { position: 'absolute', left: '0', top: '0', width: '56px', height: '56px', marginLeft: '-28px', marginTop: '-28px', borderRadius: '50%', border: '2.5px solid #D4AF37', boxShadow: '0 0 0 1px rgba(13,27,42,0.35), 0 0 18px rgba(212,175,55,0.45)', visibility: 'hidden' });
        else Object.assign(d.style, { position: 'absolute', left: '0', top: '0', borderRadius: (m.raio ?? 6) + 'px', border: '2px solid #D4AF37', boxShadow: '0 0 0 3px rgba(212,175,55,0.16)', visibility: 'hidden' });
        el.append(d); return d;
      });
      mundo.append(el);
      return { pl, el, cam, camadas, seqs, marcas, ass: '' };
    });
    palco.append(mundo);
    host.dataset.fluxoLayout = layout;
    medir();
  }
  function desmontarDom() {
    mundo?.remove(); mundo = null; placas = []; imgs.clear(); carregados = 0; precisos = 0;
  }
  // carrega só o que está perto de p (janela adiante e atrás), para não baixar o percurso inteiro de uma vez
  function carregarPerto(p) {
    for (const [, reg] of imgs) {
      if (reg.pedida) continue;
      if (p >= reg.usada[0] - 0.14 && p <= reg.usada[1] + 0.08) { reg.pedida = true; reg.els.forEach((im) => { im.src = base + reg.arquivo; }); }
    }
  }
  function desenhar(p) {
    carregarPerto(p);
    for (const P of placas) {
      const r = avaliarPlaca(P.pl, p);
      setVis(P.el, r.o);
      if (r.o <= 0.004) continue;
      sty(P.el, 'transform', `translate(${r.x.toFixed(2)}px, ${r.y.toFixed(2)}px)`);
      sty(P.el, 'width', r.w.toFixed(2) + 'px'); sty(P.el, 'height', r.h.toFixed(2) + 'px');
      sty(P.cam, 'transform', `scale(${r.z.toFixed(5)}) translate(${(-r.cx).toFixed(2)}px, ${(-r.cy).toFixed(2)}px)`);
      P.camadas.forEach((im, i) => setVis(im, r.camadas[i]));
      P.seqs.forEach((fr, i) => { const s = r.seqs[i]; const idx = Math.max(0, Math.min(fr.length - 1, s.i)); fr.forEach((im, j) => setVis(im, j === idx ? s.o : 0)); });
      P.marcas.forEach((d, i) => {
        const m = P.pl.marcas[i], v = r.marcas[i];
        if (m.t === 'toque') {
          const u = v.u, o = u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
          setVis(d, o * 0.95);
          if (o > 0) sty(d, 'transform', `translate(${((m.c[0] - r.cx) * r.z).toFixed(2)}px, ${((m.c[1] - r.cy) * r.z).toFixed(2)}px) scale(${(0.32 + 0.68 * u).toFixed(3)})`);
        } else {
          setVis(d, v.o);
          if (v.o > 0) {
            sty(d, 'transform', `translate(${((m.r[0] - r.cx) * r.z - 3).toFixed(2)}px, ${((m.r[1] - r.cy) * r.z - 3).toFixed(2)}px)`);
            sty(d, 'width', (m.r[2] * r.z + 6).toFixed(2) + 'px'); sty(d, 'height', (m.r[3] * r.z + 6).toFixed(2) + 'px');
          }
        }
      });
    }
  }

  function emitir() {
    const modo = estatico() ? 'estatico' : 'animado';
    const p = Math.max(0, atual);
    const etapa = modo === 'estatico' ? 0 : etapaDe(p);
    const carregado = precisos ? (carregados >= precisos ? 'tudo' : 'parcial') : 'nada';
    const d = host.dataset;
    if (d.fluxoModo !== modo) d.fluxoModo = modo;
    if (d.fluxoEtapa !== String(etapa)) d.fluxoEtapa = String(etapa);
    if (d.fluxoCarregado !== carregado) d.fluxoCarregado = carregado;
    const ass = modo + etapa + carregado + layout;
    if (ass === assinatura) return;
    assinatura = ass;
    const det = { modo, etapa, nome: etapa ? ETAPAS[etapa - 1].nome : '', progresso: +p.toFixed(3), layout, carregado, falha: host.dataset.fluxoFalha || null };
    host.dispatchEvent(new CustomEvent('fluxo:estado', { detail: det }));
    O.onEstado?.(det);
  }
  function aplicar(p = alvo) {
    if (estatico()) { if (mundo) mundo.style.visibility = 'hidden'; atual = -1; emitir(); return; }
    if (!visivel && !mundo) { emitir(); return; } // longe da tela: nada é montado nem baixado (só o modo é anunciado)
    if (!mundo) construir();
    mundo.style.visibility = '';
    if (p === atual) return;
    atual = p; const t0 = performance.now(); desenhar(p); const ms = performance.now() - t0; stats.n++; stats.ms += ms; if (ms > stats.max) stats.max = ms;
    emitir();
  }
  function tick(now) {
    handle = 0;
    if (destruido || estatico()) return;
    const dt = Math.min(64, Math.max(0, now - ultimo)); ultimo = now;
    let p = alvo;
    if (atual >= 0) { const dif = alvo - atual, passo = Math.max(Math.abs(dif) * (1 - Math.exp(-dt / O.suavizar)), Math.min(Math.abs(dif), dt / 500)); p = atual + Math.sign(dif) * passo; }
    if (Math.abs(alvo - p) < 0.0004) p = alvo;
    aplicar(p);
    if (p !== alvo && visivel && !document.hidden) handle = O.raf(tick);
  }
  function acordar() {
    if (destruido) return;
    if (estatico()) { if (handle) { O.caf(handle); handle = 0; } aplicar(); return; }
    if (handle || !visivel || document.hidden) return;
    ultimo = O.agora(); handle = O.raf(tick);
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    visivel = es.some((e) => e.isIntersecting);
    if (visivel) { if (!mundo && !estatico()) { atual = -1; aplicar(alvo); } acordar(); } else if (handle) { O.caf(handle); handle = 0; }
  }, { rootMargin: '20% 0px 20% 0px' }) : null;
  if (io) io.observe(host); else visivel = true;
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => {
    if (destruido || !mundo) return;
    if (escolherLayout() !== layout) { construir(); atual = -1; aplicar(alvo); return; }
    medir();
  }) : null;
  ro?.observe(palco);
  const onVis = () => { if (!document.hidden) acordar(); };
  document.addEventListener('visibilitychange', onVis);
  const onMq = () => { atual = -1; acordar(); };
  mqRed.addEventListener?.('change', onMq);

  host.dataset.fluxoVersao = VERSION;
  aplicar(alvo);

  return {
    VERSION,
    setProgresso(p) { alvo = clamp01(+p || 0); if (estatico()) return; if (!visivel) { atual = -1; emitir(); return; } acordar(); }, // longe da tela: guarda o alvo, não desenha
    setPaused(v) { paused = !!v; atual = -1; if (!estatico()) aplicar(alvo); else aplicar(); acordar(); },
    setReducedMotion(v) { redForcado = v == null ? null : !!v; atual = -1; if (!estatico()) aplicar(alvo); else aplicar(); acordar(); },
    atualizar() { if (mundo) { if (escolherLayout() !== layout) construir(); else medir(); } atual = -1; aplicar(alvo); },
    get state() { const modo = estatico() ? 'estatico' : 'animado'; const p = Math.max(0, atual); return { modo, etapa: modo === 'estatico' ? 0 : etapaDe(p), progresso: +p.toFixed(4), alvo: +alvo.toFixed(4), animando: !!handle, layout, carregados, precisos, falha: host.dataset.fluxoFalha || null }; },
    _stats: () => ({ atualizacoes: stats.n, msMedio: stats.n ? +(stats.ms / stats.n).toFixed(3) : 0, msMax: +stats.max.toFixed(3) }),
    destroy() {
      destruido = true; if (handle) O.caf(handle); handle = 0;
      io?.disconnect(); ro?.disconnect(); document.removeEventListener('visibilitychange', onVis); mqRed.removeEventListener?.('change', onMq);
      desmontarDom();
      for (const k2 of ['fluxoModo', 'fluxoEtapa', 'fluxoLayout', 'fluxoCarregado', 'fluxoFalha', 'fluxoVersao']) delete host.dataset[k2];
    },
  };
}
