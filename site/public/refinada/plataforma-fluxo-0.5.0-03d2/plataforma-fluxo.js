/* ARARAT — Plataforma: percurso Hub → Viewer conduzido pela rolagem. 0.5.0-03d2 — rodada editorial 03D2 (experimental).
 * 0.5.0-03d2: telas maiores (uma cena por vez, aproximando o controle que importa), hierarquia de movimento em janelas
 * que não se sobrepõem (cena · enquadramento · ação · conteúdo, ver DADOS.momentos), nunca duas imagens médicas visíveis
 * ao mesmo tempo, enquadramentos próprios no celular, placas retas com fio de 1 px (sem sombra, sem raio) e marcas com
 * os tokens de foco do 03D2. Mesmos assets reais da 0.1.0 (sha256), mesmas 7 etapas, contrato e API iguais.
 * Base: 0.1.0-draft / 0.4.0-03d2.
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
export const VERSION = '0.5.0-03d2';
// marcas com os tokens de foco do 03D2, pela luminância do fundo da placa: [anel, halo]
const corMarca = (fundo) => { const m = /^#([0-9a-f]{6})$/i.exec(fundo || ''); if (!m) return ['#EDEDED', '#111111']; const n = parseInt(m[1], 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] > 0.5 ? ['#111111', '#F6F6F6'] : ['#EDEDED', '#111111']; };
const NS_DADOS = {"versao":"0.5.0-03d2","etapas":[{"etapa":1,"nome":"fila","ate":0.17},{"etapa":2,"nome":"abrir","ate":0.3},{"etapa":3,"nome":"cortes","ate":0.47},{"etapa":4,"nome":"comparar","ate":0.6},{"etapa":5,"nome":"medir","ate":0.73},{"etapa":6,"nome":"documentar","ate":0.89},{"etapa":7,"nome":"retorno","ate":1.01}],"momentos":[[0.025,0.035,"acao","contorno na linha do caso ProstateX-0067"],[0.04,0.054,"acao","toque no nome do caso"],[0.056,0.07,"enquadramento","celular: panorâmica do nome para a coluna Etapa (desktop: parado)"],[0.073,0.127,"conteudo","estados reais da fila: Rodando AutoSeg → Preprocessando → Revisão pendente"],[0.153,0.161,"acao","contorno da linha sai"],[0.163,0.17,"cena","fila sai"],[0.172,0.179,"cena","painel do caso entra (miniaturas + \"Abrir revisão\")"],[0.19,0.204,"enquadramento","máscara fecha sobre o botão \"Abrir revisão\" (miniaturas ficam de fora)"],[0.207,0.236,"acao","contorno e toque em \"Abrir revisão\""],[0.236,0.268,"cena","o Viewer abre a partir do botão (placa opaca; o painel some no mesmo instante)"],[0.3,0.325,"enquadramento","aproxima o viewport axial"],[0.335,0.425,"conteudo","fatias pela rolagem: 11 → 19 → 13"],[0.426,0.438,"acao","toque com a mira no axial"],[0.439,0.439,"conteudo","mira ativa: planos sincronizados (troca seca para a sequência MPR)"],[0.441,0.452,"enquadramento","afasta para as 4 vistas"],[0.455,0.468,"conteudo","roda no coronal move a linha no axial"],[0.47,0.476,"cena","MPR sai"],[0.478,0.484,"cena","\"Comparar séries\": T2 + ADC entra"],[0.49,0.548,"conteudo","T2 11→15 / ADC 10→14, sincronizados"],[0.551,0.5585,"enquadramento","aproxima os rótulos (celular: primeiro \"Série principal\", no T2)"],[0.5585,0.566,"enquadramento","chega a \"Sincronização segura\" (celular: panorâmica do T2 para o ADC)"],[0.569,0.598,"acao","contorno em \"Sincronização segura\""],[0.6,0.606,"cena","comparação sai"],[0.608,0.614,"cena","axial entra (régua)"],[0.618,0.632,"acao","toque: 1º ponto da régua"],[0.636,0.648,"conteudo","régua: 1º ponto, prévia ao vivo"],[0.652,0.666,"acao","toque: 2º ponto"],[0.67,0.67,"conteudo","régua concluída: \"M1 55,1 mm\""],[0.674,0.688,"enquadramento","aproxima a medida \"M1 55,1 mm\""],[0.692,0.698,"cena","axial sai"],[0.7,0.706,"cena","aba Medições entra"],[0.709,0.729,"acao","contorno no cartão M1 (55,1 mm)"],[0.729,0.735,"cena","Medições sai"],[0.736,0.742,"cena","axial entra (chave)"],[0.745,0.759,"acao","toque na chave do axial"],[0.761,0.761,"conteudo","\"Adicionada ao relatório\""],[0.764,0.776,"enquadramento","aproxima o aviso \"Adicionada ao relatório\""],[0.78,0.785,"cena","axial sai"],[0.787,0.792,"cena","painel ADC entra"],[0.795,0.809,"acao","toque na chave do painel ADC"],[0.811,0.811,"conteudo","chave do ADC confirmada"],[0.815,0.82,"cena","ADC sai"],[0.822,0.828,"cena","galeria entra (\"2 imagens selecionadas\")"],[0.83,0.843,"acao","contorno no cabeçalho da galeria"],[0.845,0.853,"enquadramento","máscara fecha sobre \"Visualizar relatório\" (miniaturas ficam de fora)"],[0.855,0.865,"acao","toque em \"Visualizar relatório\""],[0.866,0.878,"cena","a prévia abre a partir do botão (placa opaca; a galeria some no mesmo instante)"],[0.89,0.896,"cena","prévia sai"],[0.899,0.905,"cena","\"Abrindo o ARARAT Hub…\" entra"],[0.925,0.931,"cena","status sai"],[0.934,0.94,"cena","fila do Hub entra (estado real)"],[0.948,0.956,"acao","contorno na célula Etapa: \"Revisão pendente\""]],"medicas":["hub-painel-02a","viewer-area-02c","viewer-galeria-06d","viewer-galeria-06e","viewer-previa-06f","viewer-axial-07","viewer-axial-08","viewer-axial-09","viewer-axial-10","viewer-axial-11","viewer-axial-12","viewer-axial-13","viewer-axial-14","viewer-axial-15","viewer-axial-16","viewer-axial-17","viewer-axial-18","viewer-axial-19","viewer-mpr-0","viewer-mpr-1","viewer-mpr-2","viewer-mpr-3","viewer-mpr-4","viewer-mpr-5","viewer-mpr-6","viewer-comp-0","viewer-comp-1","viewer-comp-2","viewer-comp-3","viewer-comp-4","viewer-comp-5","viewer-comp-6","viewer-comp-7","viewer-comp-8","viewer-regua-05a","viewer-regua-05c","viewer-regua-05d33","viewer-regua-05d66","viewer-regua-05e","viewer-chave-axial-06b","viewer-chave-axial-06c","viewer-chave-adc-06b","viewer-chave-adc-06c"],"layouts":{"desktop":{"W":1100,"H":800,"placas":[{"borda":"#474747","raio":0,"id":"hub-fila","tema":"hub","fundo":"#F6F4EF","x":17,"y":38.19999999999999,"w":1066,"h":723.6,"z":1.8,"cx":48,"cy":52,"o":[[0,1],[0.163,1],[0.17,0]],"camadas":[{"a":"hub-cartoes-01a","o":[[0,1],[0.1269,1],[0.127,0]]},{"a":"hub-cartoes-01d","o":[[0.1269,0],[0.127,1]]},{"a":"hub-fila-01a","o":[[0,1],[0.07289999999999999,1],[0.073,0]]},{"a":"hub-fila-01c02","o":[[0.07289999999999999,0],[0.073,1],[0.0999,1],[0.1,0]]},{"a":"hub-fila-01c03","o":[[0.0999,0],[0.1,1],[0.1269,1],[0.127,0]]},{"a":"hub-fila-01d","o":[[0.1269,0],[0.127,1]]}],"marcas":[{"t":"realce","r":[50,294,588,52],"o":[[0.025,0],[0.035,1],[0.153,1],[0.161,0]]},{"t":"toque","c":[170,320],"u":[[0.04,0],[0.054,1]]}]},{"borda":"#474747","raio":0,"id":"hub-painel","tema":"hub","fundo":"#F6F4EF","x":[[0.172,188.6],[0.19,188.6],[0.204,209.4]],"y":[[0.172,111.4],[0.19,111.4],[0.204,558.6]],"w":[[0.172,722.8],[0.19,722.8],[0.204,676]],"h":[[0.172,577.2],[0.19,577.2],[0.204,140.4]],"z":2.6,"cx":[[0.172,1162],[0.19,1162],[0.204,1170]],"cy":[[0.172,348],[0.19,348],[0.204,520]],"o":[[0.172,0],[0.179,1],[0.2359,1],[0.236,0]],"camadas":[{"a":"hub-painel-02a"}],"marcas":[{"t":"realce","r":[1176,528,248,38],"o":[[0.207,0],[0.213,1],[0.232,1],[0.236,0]]},{"t":"toque","c":[1300,547],"u":[[0.216,0],[0.23,1]]}]},{"borda":"#474747","raio":0,"id":"viewer","tema":"viewer","fundo":"#0B0C0F","x":[[0.236,225],[0.268,165],[0.3,165],[0.325,165],[0.441,165],[0.452,165],[0.551,165],[0.566,165],[0.6069,165],[0.607,165],[0.674,165],[0.688,165],[0.7359,165],[0.736,165],[0.764,165],[0.776,165],[0.7859,165],[0.786,165]],"y":[[0.236,579.4],[0.268,10],[0.3,10],[0.325,10],[0.441,10],[0.452,10],[0.551,10],[0.566,10],[0.6069,10],[0.607,10],[0.674,10],[0.688,10],[0.7359,10],[0.736,10],[0.764,10],[0.776,10],[0.7859,10],[0.786,10]],"w":[[0.236,644.8],[0.268,770],[0.3,770],[0.325,770],[0.441,770],[0.452,770],[0.551,770],[0.566,770],[0.6069,770],[0.607,770],[0.674,770],[0.688,770],[0.7359,770],[0.736,770],[0.764,770],[0.776,770],[0.7859,770],[0.786,770]],"h":[[0.236,98.8],[0.268,780],[0.3,780],[0.325,780],[0.441,780],[0.452,780],[0.551,780],[0.566,780],[0.6069,780],[0.607,780],[0.674,780],[0.688,780],[0.7359,780],[0.736,780],[0.764,780],[0.776,780],[0.7859,780],[0.786,780]],"z":[[0.236,0.854],[0.268,1.02],[0.3,1.02],[0.325,2.053],[0.441,2.053],[0.452,1.02],[0.551,1.02],[0.566,2.075],[0.6069,2.075],[0.607,2.053],[0.674,2.053],[0.688,3],[0.7359,3],[0.736,2.053],[0.764,2.053],[0.776,2.6],[0.7859,2.6],[0.786,1.168]],"cx":[[0.236,0],[0.268,0],[0.3,0],[0.325,0.436],[0.441,0.436],[0.452,0],[0.551,0],[0.566,381],[0.6069,381],[0.607,0.436],[0.674,0.436],[0.688,131.667],[0.7359,131.667],[0.736,0.436],[0.764,0.436],[0.776,-43.077],[0.7859,-43.077],[0.786,235.782]],"cy":[[0.236,0],[0.268,-0.403],[0.3,-0.403],[0.325,1],[0.441,1],[0.452,-0.403],[0.551,-0.403],[0.566,389.091],[0.6069,389.091],[0.607,1],[0.674,1],[0.688,59],[0.7359,59],[0.736,1],[0.764,1],[0.776,201],[0.7859,201],[0.786,74]],"o":[[0.2359,0],[0.236,1],[0.692,1],[0.698,0],[0.736,0],[0.742,1],[0.78,1],[0.785,0],[0.787,0],[0.792,1],[0.815,1],[0.82,0]],"camadas":[{"a":"viewer-area-02c","o":[[0.236,1],[0.33490000000000003,1],[0.335,0]]}],"seqs":[{"a":["viewer-axial-07","viewer-axial-08","viewer-axial-09","viewer-axial-10","viewer-axial-11","viewer-axial-12","viewer-axial-13","viewer-axial-14","viewer-axial-15","viewer-axial-16","viewer-axial-17","viewer-axial-18","viewer-axial-19"],"o":[[0.33490000000000003,0],[0.335,1],[0.4389,1],[0.439,0]],"i":[[0.335,4],[0.4,12],[0.425,6]]},{"a":["viewer-mpr-0","viewer-mpr-1","viewer-mpr-2","viewer-mpr-3","viewer-mpr-4","viewer-mpr-5","viewer-mpr-6"],"o":[[0.4389,0],[0.439,1],[0.47,1],[0.476,0]],"i":[[0.455,0],[0.468,6]]},{"a":["viewer-comp-0","viewer-comp-1","viewer-comp-2","viewer-comp-3","viewer-comp-4","viewer-comp-5","viewer-comp-6","viewer-comp-7","viewer-comp-8"],"o":[[0.478,0],[0.484,1],[0.6,1],[0.606,0]],"i":[[0.49,0],[0.548,8]]},{"a":["viewer-regua-05a","viewer-regua-05c","viewer-regua-05d33","viewer-regua-05d66","viewer-regua-05e","viewer-chave-axial-06b","viewer-chave-axial-06c"],"o":[[0.608,0],[0.614,1],[0.692,1],[0.698,0],[0.736,0],[0.742,1],[0.78,1],[0.785,0]],"i":[[0.6,0],[0.6359,0],[0.636,1],[0.6419,1],[0.642,2],[0.6479,2],[0.648,3],[0.6699,3],[0.67,4],[0.7199,4],[0.72,5],[0.7609,5],[0.761,6]]},{"a":["viewer-chave-adc-06b","viewer-chave-adc-06c"],"o":[[0.787,0],[0.792,1],[0.815,1],[0.82,0]],"i":[[0.78,0],[0.8109000000000001,0],[0.811,1]]}],"marcas":[{"t":"toque","c":[180,200],"u":[[0.426,0],[0.438,1]]},{"t":"realce","r":[383,744,142,20],"o":[[0.569,0],[0.575,1],[0.594,1],[0.598,0]],"raio":4},{"t":"toque","c":[134,199],"u":[[0.618,0],[0.632,1]]},{"t":"toque","c":[223,199],"u":[[0.652,0],[0.666,1]]},{"t":"toque","c":[27,357],"u":[[0.745,0],[0.759,1]]},{"t":"toque","c":[406,715],"u":[[0.795,0],[0.809,1]]}]},{"borda":"#474747","raio":0,"id":"medicoes","tema":"viewer","fundo":"#081316","x":305.8,"y":16,"w":488.4,"h":768,"z":1.2,"cx":0,"cy":0,"o":[[0.7,0],[0.706,1],[0.729,1],[0.735,0]],"camadas":[{"a":"viewer-medicoes-05f"}],"marcas":[{"t":"realce","r":[20,95,367,85],"o":[[0.709,0],[0.715,1],[0.725,1],[0.729,0]]}]},{"borda":"#474747","raio":0,"id":"galeria","tema":"viewer","fundo":"#081316","x":[[0.822,305.8],[0.845,305.8],[0.853,322.6]],"y":[[0.822,16],[0.845,16],[0.853,721.6]],"w":[[0.822,488.4],[0.845,488.4],[0.853,454.8]],"h":[[0.822,768],[0.845,768],[0.853,55.2]],"z":1.2,"cx":[[0.822,0],[0.845,0],[0.853,14]],"cy":[[0.822,0],[0.845,0],[0.853,588]],"o":[[0.822,0],[0.828,1],[0.8659,1],[0.866,0]],"camadas":[{"a":"viewer-galeria-06d"}],"marcas":[{"t":"realce","r":[16,12,164,42],"o":[[0.83,0],[0.835,1],[0.84,1],[0.843,0]]},{"t":"toque","c":[203,612],"u":[[0.855,0],[0.865,1]]}]},{"borda":"#474747","raio":0,"id":"previa","tema":"viewer","fundo":"#14181D","x":[[0.866,331],[0.878,150]],"y":[[0.866,730],[0.878,68.125]],"w":[[0.866,438],[0.878,800]],"h":[[0.866,38.4],[0.878,663.75]],"z":[[0.866,0.684],[0.878,1.25]],"cx":0,"cy":0,"o":[[0.8659,0],[0.866,1],[0.89,1],[0.896,0]],"camadas":[{"a":"viewer-previa-06f"}]},{"borda":"#474747","raio":0,"id":"status","tema":"viewer","fundo":"#11161B","x":230,"y":351,"w":640,"h":78.22220999999999,"z":2.37037,"cx":230,"cy":0,"o":[[0.899,0],[0.905,1],[0.925,1],[0.931,0]],"camadas":[{"a":"viewer-status-07c"}]},{"borda":"#474747","raio":0,"id":"hub-volta","tema":"hub","fundo":"#F6F4EF","x":17,"y":146,"w":1066,"h":508,"z":1.8,"cx":48,"cy":172,"o":[[0.934,0],[0.94,1]],"camadas":[{"a":"hub-fila-07a"}],"marcas":[{"t":"realce","r":[423,294,217,52],"o":[[0.948,0],[0.956,1]]}]}]},"celular":{"W":360,"H":600,"placas":[{"borda":"#474747","raio":0,"id":"hub-linha","tema":"hub","fundo":"#F6F4EF","x":0,"y":245,"w":360,"h":110.4,"z":1.2,"cx":[[0,48],[0.056,48],[0.07,340]],"cy":262,"o":[[0,1],[0.163,1],[0.17,0]],"camadas":[{"a":"hub-linha-01a","o":[[0,1],[0.07289999999999999,1],[0.073,0]]},{"a":"hub-linha-01c02","o":[[0.07289999999999999,0],[0.073,1],[0.0999,1],[0.1,0]]},{"a":"hub-linha-01c03","o":[[0.0999,0],[0.1,1],[0.1269,1],[0.127,0]]},{"a":"hub-linha-01d","o":[[0.1269,0],[0.127,1]]}],"marcas":[{"t":"realce","r":[50,294,588,52],"o":[[0.025,0],[0.035,1],[0.153,1],[0.161,0]]},{"t":"toque","c":[170,320],"u":[[0.04,0],[0.054,1]]}]},{"borda":"#474747","raio":0,"id":"hub-painel","tema":"hub","fundo":"#F6F4EF","x":[[0.172,2],[0.19,2],[0.204,12.245]],"y":[[0.172,158],[0.19,158],[0.204,378.259]],"w":[[0.172,356],[0.19,356],[0.204,332.95]],"h":[[0.172,284.288],[0.19,284.288],[0.204,69.151]],"z":1.281,"cx":[[0.172,1162],[0.19,1162],[0.204,1170]],"cy":[[0.172,348],[0.19,348],[0.204,520]],"o":[[0.172,0],[0.179,1],[0.2359,1],[0.236,0]],"camadas":[{"a":"hub-painel-02a"}],"marcas":[{"t":"realce","r":[1176,528,248,38],"o":[[0.207,0],[0.213,1],[0.232,1],[0.236,0]]},{"t":"toque","c":[1300,547],"u":[[0.216,0],[0.23,1]]}]},{"borda":"#474747","raio":0,"id":"viewer","tema":"viewer","fundo":"#0B0C0F","x":[[0.236,19.928],[0.268,2],[0.439,2],[0.441,2],[0.452,2],[0.551,2],[0.5585,2],[0.566,2],[0.6069,2],[0.607,2],[0.674,2],[0.688,2],[0.7359,2],[0.736,2],[0.764,2],[0.776,2],[0.7859,2],[0.786,20]],"y":[[0.236,388.504],[0.268,112],[0.439,112],[0.441,112],[0.452,112],[0.551,112],[0.5585,112],[0.566,112],[0.6069,112],[0.607,112],[0.674,112],[0.688,112],[0.7359,112],[0.736,112],[0.764,112],[0.776,112],[0.7859,112],[0.786,10]],"w":[[0.236,317.583],[0.268,356],[0.439,356],[0.441,356],[0.452,356],[0.551,356],[0.5585,356],[0.566,356],[0.6069,356],[0.607,356],[0.674,356],[0.688,356],[0.7359,356],[0.736,356],[0.764,356],[0.776,356],[0.7859,356],[0.786,320]],"h":[[0.236,48.662],[0.268,362],[0.439,362],[0.441,362],[0.452,362],[0.551,362],[0.5585,362],[0.566,362],[0.6069,362],[0.607,362],[0.674,362],[0.688,362],[0.7359,362],[0.736,362],[0.764,362],[0.776,362],[0.7859,362],[0.786,580]],"z":[[0.236,0.421],[0.268,0.952],[0.439,0.952],[0.441,0.952],[0.452,0.472],[0.551,0.472],[0.5585,1.079],[0.566,1.483],[0.6069,1.483],[0.607,0.952],[0.674,0.952],[0.688,2.034],[0.7359,2.034],[0.736,0.952],[0.764,0.952],[0.776,1.78],[0.7859,1.78],[0.786,0.867]],"cx":[[0.236,0],[0.268,1],[0.439,1],[0.441,1],[0.452,0],[0.551,0],[0.5585,0],[0.566,383],[0.6069,383],[0.607,1],[0.674,1],[0.688,130],[0.7359,130],[0.736,1],[0.764,1],[0.776,5],[0.7859,5],[0.786,381]],"cy":[[0.236,0],[0.268,0.848],[0.439,0.848],[0.441,0.848],[0.452,-1.862],[0.551,-1.862],[0.5585,430.219],[0.566,569.978],[0.6069,569.978],[0.607,0.848],[0.674,0.848],[0.688,101.025],[0.7359,101.025],[0.736,0.848],[0.764,0.848],[0.776,249.315],[0.7859,249.315],[0.786,73.594]],"o":[[0.2359,0],[0.236,1],[0.692,1],[0.698,0],[0.736,0],[0.742,1],[0.78,1],[0.785,0],[0.787,0],[0.792,1],[0.815,1],[0.82,0]],"camadas":[{"a":"viewer-area-02c","o":[[0.236,1],[0.33490000000000003,1],[0.335,0]]}],"seqs":[{"a":["viewer-axial-07","viewer-axial-08","viewer-axial-09","viewer-axial-10","viewer-axial-11","viewer-axial-12","viewer-axial-13","viewer-axial-14","viewer-axial-15","viewer-axial-16","viewer-axial-17","viewer-axial-18","viewer-axial-19"],"o":[[0.33490000000000003,0],[0.335,1],[0.4389,1],[0.439,0]],"i":[[0.335,4],[0.4,12],[0.425,6]]},{"a":["viewer-mpr-0","viewer-mpr-1","viewer-mpr-2","viewer-mpr-3","viewer-mpr-4","viewer-mpr-5","viewer-mpr-6"],"o":[[0.4389,0],[0.439,1],[0.47,1],[0.476,0]],"i":[[0.455,0],[0.468,6]]},{"a":["viewer-comp-0","viewer-comp-1","viewer-comp-2","viewer-comp-3","viewer-comp-4","viewer-comp-5","viewer-comp-6","viewer-comp-7","viewer-comp-8"],"o":[[0.478,0],[0.484,1],[0.6,1],[0.606,0]],"i":[[0.49,0],[0.548,8]]},{"a":["viewer-regua-05a","viewer-regua-05c","viewer-regua-05d33","viewer-regua-05d66","viewer-regua-05e","viewer-chave-axial-06b","viewer-chave-axial-06c"],"o":[[0.608,0],[0.614,1],[0.692,1],[0.698,0],[0.736,0],[0.742,1],[0.78,1],[0.785,0]],"i":[[0.6,0],[0.6359,0],[0.636,1],[0.6419,1],[0.642,2],[0.6479,2],[0.648,3],[0.6699,3],[0.67,4],[0.7199,4],[0.72,5],[0.7609,5],[0.761,6]]},{"a":["viewer-chave-adc-06b","viewer-chave-adc-06c"],"o":[[0.787,0],[0.792,1],[0.815,1],[0.82,0]],"i":[[0.78,0],[0.8109000000000001,0],[0.811,1]]}],"marcas":[{"t":"toque","c":[180,200],"u":[[0.426,0],[0.438,1]]},{"t":"realce","r":[383,744,142,20],"o":[[0.569,0],[0.575,1],[0.594,1],[0.598,0]],"raio":4},{"t":"toque","c":[134,199],"u":[[0.618,0],[0.632,1]]},{"t":"toque","c":[223,199],"u":[[0.652,0],[0.666,1]]},{"t":"toque","c":[27,357],"u":[[0.745,0],[0.759,1]]},{"t":"toque","c":[406,715],"u":[[0.795,0],[0.809,1]]}]},{"borda":"#474747","raio":0,"id":"medicoes","tema":"viewer","fundo":"#081316","x":2,"y":20,"w":356,"h":559.8034398034398,"z":0.8746928746928747,"cx":0,"cy":0,"o":[[0.7,0],[0.706,1],[0.729,1],[0.735,0]],"camadas":[{"a":"viewer-medicoes-05f"}],"marcas":[{"t":"realce","r":[20,95,367,85],"o":[[0.709,0],[0.715,1],[0.725,1],[0.729,0]]}]},{"borda":"#474747","raio":0,"id":"galeria","tema":"viewer","fundo":"#081316","x":[[0.822,3.182],[0.845,3.182],[0.853,10.455]],"y":[[0.822,10],[0.845,10],[0.853,546.364]],"w":[[0.822,353.636],[0.845,353.636],[0.853,339.091]],"h":[[0.822,580],[0.845,580],[0.853,36.364]],"z":0.909,"cx":[[0.822,0],[0.845,0],[0.853,8]],"cy":[[0.822,0],[0.845,0],[0.853,590]],"o":[[0.822,0],[0.828,1],[0.8659,1],[0.866,0]],"camadas":[{"a":"viewer-galeria-06e"}],"marcas":[{"t":"realce","r":[8,8,272,44],"o":[[0.83,0],[0.835,1],[0.84,1],[0.843,0]]},{"t":"toque","c":[194,610],"u":[[0.855,0],[0.865,1]]}]},{"borda":"#474747","raio":0,"id":"previa","tema":"viewer","fundo":"#14181D","x":[[0.866,14.091],[0.878,2]],"y":[[0.866,548.182],[0.878,152]],"w":[[0.866,331.818],[0.878,356]],"h":[[0.866,29.091],[0.878,295.369]],"z":[[0.866,0.518],[0.878,0.556]],"cx":0,"cy":0,"o":[[0.8659,0],[0.866,1],[0.89,1],[0.896,0]],"camadas":[{"a":"viewer-previa-06f"}]},{"borda":"#474747","raio":0,"id":"status","tema":"viewer","fundo":"#11161B","x":2,"y":278,"w":356,"z":1.31852,"cx":230,"cy":0,"h":43.51116,"o":[[0.899,0],[0.905,1],[0.925,1],[0.931,0]],"camadas":[{"a":"viewer-status-07c"}]},{"borda":"#474747","raio":0,"id":"hub-volta","tema":"hub","fundo":"#F6F4EF","x":0,"y":245,"w":360,"h":110.39999999999999,"z":1.2,"cy":262,"cx":340,"o":[[0.934,0],[0.94,1]],"camadas":[{"a":"hub-linha-07a"}],"marcas":[{"t":"realce","r":[423,294,217,52],"o":[[0.948,0],[0.956,1]]}]}]}},"assets":{"hub-fila-01a":{"w":592,"h":282,"pos":[48,172],"esp":"H","f1":"hub-fila-01a@1x.webp","f2":"hub-fila-01a@2x.webp"},"hub-fila-01c02":{"w":592,"h":282,"pos":[48,172],"esp":"H","f1":"hub-fila-01c02@1x.webp","f2":"hub-fila-01c02@2x.webp"},"hub-fila-01c03":{"w":592,"h":282,"pos":[48,172],"esp":"H","f1":"hub-fila-01c03@1x.webp","f2":"hub-fila-01c03@2x.webp"},"hub-fila-01d":{"w":592,"h":282,"pos":[48,172],"esp":"H","f1":"hub-fila-01d@1x.webp","f2":"hub-fila-01d@2x.webp"},"hub-fila-07a":{"w":592,"h":282,"pos":[48,172],"esp":"H","f1":"hub-fila-07a@1x.webp","f2":"hub-fila-07a@2x.webp"},"hub-cartoes-01a":{"w":1094,"h":116,"pos":[56,52],"esp":"H","f1":"hub-cartoes-01a@1x.webp","f2":"hub-cartoes-01a@2x.webp"},"hub-cartoes-01d":{"w":1094,"h":116,"pos":[56,52],"esp":"H","f1":"hub-cartoes-01d@1x.webp","f2":"hub-cartoes-01d@2x.webp"},"hub-linha-01a":{"w":592,"h":92,"pos":[48,262],"esp":"H","f1":"hub-linha-01a@1x.webp","f2":"hub-linha-01a@2x.webp"},"hub-linha-01c02":{"w":592,"h":92,"pos":[48,262],"esp":"H","f1":"hub-linha-01c02@1x.webp","f2":"hub-linha-01c02@2x.webp"},"hub-linha-01c03":{"w":592,"h":92,"pos":[48,262],"esp":"H","f1":"hub-linha-01c03@1x.webp","f2":"hub-linha-01c03@2x.webp"},"hub-linha-01d":{"w":592,"h":92,"pos":[48,262],"esp":"H","f1":"hub-linha-01d@1x.webp","f2":"hub-linha-01d@2x.webp"},"hub-linha-07a":{"w":592,"h":92,"pos":[48,262],"esp":"H","f1":"hub-linha-07a@1x.webp","f2":"hub-linha-07a@2x.webp"},"hub-painel-02a":{"w":278,"h":222,"pos":[1162,348],"esp":"H","f1":"hub-painel-02a@1x.webp","f2":"hub-painel-02a@2x.webp"},"viewer-area-02c":{"w":755,"h":764,"pos":[0,0],"esp":"V","f1":"viewer-area-02c@1x.webp","f2":"viewer-area-02c@2x.webp"},"viewer-axial-07":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-07@1x.webp","f2":"viewer-axial-07@2x.webp"},"viewer-axial-08":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-08@1x.webp","f2":"viewer-axial-08@2x.webp"},"viewer-axial-09":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-09@1x.webp","f2":"viewer-axial-09@2x.webp"},"viewer-axial-10":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-10@1x.webp","f2":"viewer-axial-10@2x.webp"},"viewer-axial-11":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-11@1x.webp","f2":"viewer-axial-11@2x.webp"},"viewer-axial-12":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-12@1x.webp","f2":"viewer-axial-12@2x.webp"},"viewer-axial-13":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-13@1x.webp","f2":"viewer-axial-13@2x.webp"},"viewer-axial-14":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-14@1x.webp","f2":"viewer-axial-14@2x.webp"},"viewer-axial-15":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-15@1x.webp","f2":"viewer-axial-15@2x.webp"},"viewer-axial-16":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-16@1x.webp","f2":"viewer-axial-16@2x.webp"},"viewer-axial-17":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-17@1x.webp","f2":"viewer-axial-17@2x.webp"},"viewer-axial-18":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-18@1x.webp","f2":"viewer-axial-18@2x.webp"},"viewer-axial-19":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-axial-19@1x.webp","f2":"viewer-axial-19@2x.webp"},"viewer-mpr-0":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-0@1x.webp","f2":"viewer-mpr-0@2x.webp"},"viewer-mpr-1":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-1@1x.webp","f2":"viewer-mpr-1@2x.webp"},"viewer-mpr-2":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-2@1x.webp","f2":"viewer-mpr-2@2x.webp"},"viewer-mpr-3":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-3@1x.webp","f2":"viewer-mpr-3@2x.webp"},"viewer-mpr-4":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-4@1x.webp","f2":"viewer-mpr-4@2x.webp"},"viewer-mpr-5":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-5@1x.webp","f2":"viewer-mpr-5@2x.webp"},"viewer-mpr-6":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-mpr-6@1x.webp","f2":"viewer-mpr-6@2x.webp"},"viewer-comp-0":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-0@1x.webp","f2":"viewer-comp-0@2x.webp"},"viewer-comp-1":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-1@1x.webp","f2":"viewer-comp-1@2x.webp"},"viewer-comp-2":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-2@1x.webp","f2":"viewer-comp-2@2x.webp"},"viewer-comp-3":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-3@1x.webp","f2":"viewer-comp-3@2x.webp"},"viewer-comp-4":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-4@1x.webp","f2":"viewer-comp-4@2x.webp"},"viewer-comp-5":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-5@1x.webp","f2":"viewer-comp-5@2x.webp"},"viewer-comp-6":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-6@1x.webp","f2":"viewer-comp-6@2x.webp"},"viewer-comp-7":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-7@1x.webp","f2":"viewer-comp-7@2x.webp"},"viewer-comp-8":{"w":751,"h":763,"pos":[1,1],"esp":"V","f1":"viewer-comp-8@1x.webp","f2":"viewer-comp-8@2x.webp"},"viewer-regua-05a":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-regua-05a@1x.webp","f2":"viewer-regua-05a@2x.webp"},"viewer-regua-05c":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-regua-05c@1x.webp","f2":"viewer-regua-05c@2x.webp"},"viewer-regua-05d33":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-regua-05d33@1x.webp","f2":"viewer-regua-05d33@2x.webp"},"viewer-regua-05d66":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-regua-05d66@1x.webp","f2":"viewer-regua-05d66@2x.webp"},"viewer-regua-05e":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-regua-05e@1x.webp","f2":"viewer-regua-05e@2x.webp"},"viewer-chave-axial-06b":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-chave-axial-06b@1x.webp","f2":"viewer-chave-axial-06b@2x.webp"},"viewer-chave-axial-06c":{"w":374,"h":380,"pos":[1,1],"esp":"V","f1":"viewer-chave-axial-06c@1x.webp","f2":"viewer-chave-axial-06c@2x.webp"},"viewer-chave-adc-06b":{"w":369,"h":668,"pos":[381,74],"esp":"V","f1":"viewer-chave-adc-06b@1x.webp","f2":"viewer-chave-adc-06b@2x.webp"},"viewer-chave-adc-06c":{"w":369,"h":668,"pos":[381,74],"esp":"V","f1":"viewer-chave-adc-06c@1x.webp","f2":"viewer-chave-adc-06c@2x.webp"},"viewer-medicoes-05f":{"w":407,"h":640,"pos":[0,0],"esp":"P","f1":"viewer-medicoes-05f@1x.webp","f2":"viewer-medicoes-05f@2x.webp"},"viewer-galeria-06d":{"w":407,"h":640,"pos":[0,0],"esp":"P","f1":"viewer-galeria-06d@1x.webp","f2":"viewer-galeria-06d@2x.webp"},"viewer-galeria-06e":{"w":389,"h":638,"pos":[0,0],"esp":"G","f1":"viewer-galeria-06e@1x.webp","f2":"viewer-galeria-06e@2x.webp"},"viewer-previa-06f":{"w":640,"h":531,"pos":[0,0],"esp":"R","f1":"viewer-previa-06f@1x.webp","f2":"viewer-previa-06f@2x.webp"},"viewer-status-07c":{"w":500,"h":33,"pos":[0,0],"esp":"S","f1":"viewer-status-07c@1x.webp","f2":"viewer-status-07c@2x.webp"}}};
export const DADOS = NS_DADOS;
export const ETAPAS = NS_DADOS.etapas || [];
export const MOMENTOS = NS_DADOS.momentos || [];

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
      Object.assign(el.style, { position: 'absolute', left: '0', top: '0', overflow: 'hidden', borderRadius: (pl.raio ?? 0) + 'px', background: pl.fundo, boxShadow: pl.borda ? '0 0 0 1px ' + pl.borda : 'none', visibility: 'hidden', willChange: 'transform, opacity', contain: 'layout paint' });
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
      const cm = corMarca(pl.fundo);
      const marcas = (pl.marcas || []).map((m) => {
        const d = document.createElement('div'); d.className = m.t === 'toque' ? 'pf-toque' : 'pf-realce';
        if (m.t === 'toque') Object.assign(d.style, { position: 'absolute', left: '0', top: '0', width: '56px', height: '56px', marginLeft: '-28px', marginTop: '-28px', borderRadius: '50%', border: '2.5px solid ' + cm[0], boxShadow: '0 0 0 1px ' + cm[1], visibility: 'hidden' });
        else Object.assign(d.style, { position: 'absolute', left: '0', top: '0', borderRadius: (m.raio ?? 6) + 'px', border: '2px solid ' + cm[0], boxShadow: '0 0 0 1px ' + cm[1], visibility: 'hidden' });
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
