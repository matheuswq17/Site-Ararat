/*
 * ARARAT MODEL — escultura topográfica da home (“Da imagem ao conhecimento”)
 * EXPERIMENTAL / DRAFT 0.2.0 — uso autorizado somente na rota /previa. Não faz parte do pacote
 * motion/deliverables (journey 0.4.0 ready) e não altera o contrato v1/v1.1.
 *
 * Representação conceitual: curvas de nível de um relevo abstrato (assinatura topográfica da
 * marca). Não é anatomia, reconstrução volumétrica, corte de RM nem resultado clínico.
 *
 * Integração “B”: o Site informa, em px do container (normalmente uma camada fixa do tamanho da
 * janela, abaixo do texto):
 *   art     — área disponível para a arte, abaixo do conteúdo real do hero;
 *   target  — retângulo REAL do quadro da jornada (que fica por baixo, no estado Imagem);
 *   ready   — a cena da jornada tem conteúdo real (imagem + mapa) e pode ser revelada;
 *   arc     — geometria real do arco inicial da jornada (scene.getStartArc() / data-start-arc,
 *             extensão start-arc-v1 do journey 0.4.1-exp), no sistema do quadro.
 * O módulo desenha a escultura, a cobertura do quadro e a transição. Sem `ready`, o quadro
 * continua coberto (nunca revela um quadro vazio). Sem `arc`, não há coincidência de arco.
 *
 * ESM sem dependências; Canvas 2D; sem rede; sem listeners globais.
 */

export const VERSION = '0.2.1-draft';
const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const INTRO_MS = 1200;
const READY_MS = 450;
const RGB = {
  navy: [13, 27, 42],
  navyHi: [24, 44, 66],
  navyLo: [8, 15, 24],
  slate: [65, 90, 119],
  white: [245, 247, 250],
  gold: [212, 175, 55],
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (v, a, b) => clamp01((v - a) / (b - a));
const smooth = (a, b, v) => { const t = seg(v, a, b); return t * t * (3 - 2 * t); };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp01(a).toFixed(3)})`;
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const isRect = (r) => r && [r.x, r.y, r.w, r.h].every(Number.isFinite) && r.w > 0 && r.h > 0;

/* ---------- forma (coordenadas do corpo: θ ângulo, t altura 0..1) ---------- */
// Feições coerentes entre curvas vizinhas: esporões (+) e ravinas (−) que descem do cume
// e se curvam levemente com a altura. Valores fixos: a peça é determinística.
const FEATURES = [
  { th: 1.95, amp: 0.075, w: 0.24, twist: 0.35 }, // esporão frontal-esquerdo
  { th: 2.62, amp: -0.06, w: 0.15, twist: 0.3 }, // ravina à esquerda
  { th: 0.95, amp: 0.05, w: 0.28, twist: -0.25 }, // esporão frontal-direito
  { th: 1.42, amp: -0.035, w: 0.12, twist: 0.1 }, // ravina frontal discreta
  { th: -2.35, amp: 0.06, w: 0.32, twist: 0.2 }, // contraforte posterior-esquerdo
];
const SHOULDER = { th: -0.6, w: 0.58, amp: 0.36 }; // ombro: patamar à direita/fundo
const T_MAX = 0.965;

function ringShape(th, t, ph) {
  // ombro: patamar entre ~0,1 e ~0,58 da altura, só no setor do ombro
  const sh = SHOULDER.amp * smooth(0.06, 0.26, t) * (1 - smooth(0.44, 0.6, t));
  let f = 1 + sh * Math.exp(-(angDiff(th, SHOULDER.th) ** 2) / (2 * SHOULDER.w * SHOULDER.w));
  const fall = Math.pow(1 - t, 0.7); // feições mais marcadas na base, suaves no cume
  for (const F of FEATURES) {
    const c = F.th + F.twist * t;
    f += F.amp * fall * Math.exp(-(angDiff(th, c) ** 2) / (2 * F.w * F.w));
  }
  // ondulação de baixa frequência com fase que varia suavemente com a altura (vizinhas parecidas)
  f += 0.016 * Math.sin(3 * th + 1.1 + 1.7 * t + ph * 0.9) + 0.01 * Math.sin(5 * th - 0.4 + 2.3 * t - ph * 0.7);
  return f;
}
// perfil: base larga que se abre suavemente, encosta firme, cume arredondado (não é cone)
const profile = (t) => Math.pow(1 - Math.pow(t, 0.85), 0.6) * (1 + 0.14 * Math.pow(1 - t, 5));

/**
 * Composição dentro da área de arte informada pelo Site (px do container).
 * O arco começa no topo da área; a base pode sangrar pela borda inferior da área.
 */
export function homeComposition(art) {
  const narrow = art.w < 600;
  const arcR = narrow ? Math.min(art.w * 0.46, art.h * 0.56) : Math.min(art.w * 0.34, art.h * 0.56, 400);
  const R0 = arcR / 1.1;
  const pad = Math.max(6, arcR * 0.03);
  const cx = art.x + art.w / 2;
  const cy = art.y + pad + arcR;
  const e0 = 27 * DEG;
  const lite = narrow || art.h < 300;
  const half = Math.max(arcR, R0 * 1.36) + 3;
  return {
    layout: narrow ? 'narrow' : 'wide',
    lite,
    cx, cy, R0, arcR, e0,
    // limites visuais do objeto (arco + relevo) dentro da área; o relevo pode passar da base da área
    bounds: { x: cx - half, y: cy - arcR - 3, w: half * 2, h: arcR + 3 + R0 * 0.62 },
  };
}

export function createHomeSculpture(container, options = {}) {
  if (!container || typeof container.appendChild !== 'function') throw new TypeError('createHomeSculpture: container inválido');
  let reduced = !!options.reducedMotion;
  let paused = !!options.paused;
  const quality = options.quality || 'auto'; // 'auto' | 'full' | 'lite'
  // densidade fixa do canvas (só para gerar posters nítidos em 1x/2x); padrão: a da tela, limitada a 2
  const fixedRatio = Number.isFinite(options.pixelRatio) && options.pixelRatio > 0 ? Math.min(options.pixelRatio, 4) : null;
  // cor da cobertura: a do fundo da seção onde o quadro está (assim o quadro coberto não vira uma “caixa vazia”)
  // aceita uma cor ou [topo, base] (gradiente vertical, quando o fundo da seção é um degradê)
  const coverStops = Array.isArray(options.coverColor) && typeof options.coverColor[0] === 'string'
    ? options.coverColor.map(parseColor).filter(Boolean)
    : [parseColor(options.coverColor) || RGB.navy];
  const coverBleed = Number.isFinite(options.coverBleed) ? options.coverBleed : 2;
  let art = null, target = null, ready = false, arcT = null;
  let passage = 0;
  let amb = 0;
  let readyK = 0; // 0..1 — transição curta quando o conteúdo real do quadro fica disponível
  let introStart = null, introOverride = null, introDone = true;
  let raf = 0, lastNow = 0, visible = true, destroyed = false, frames = 0, drawMs = 0, lastArc = null;
  let W = 0, H = 0, dpr = 1, C = null;

  const canvas = document.createElement('canvas');
  canvas.className = 'ararat-sculpture';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.dataset.renderer = ctx ? 'canvas2d' : 'none'; // 'none' → o Site mostra o poster
  canvas.dataset.version = VERSION;

  function measure() {
    const r = container.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    const a = isRect(art) ? art : { x: 0, y: 0, w: W, h: H };
    const comp = homeComposition(a);
    const lite = quality === 'lite' || (quality === 'auto' && comp.lite);
    // 0.2.1: teto 2 também no modo simplificado (antes 1,5) — o canvas fica tão nítido quanto o poster 2x
    const nextDpr = fixedRatio ?? Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(W * nextDpr) || canvas.height !== Math.round(H * nextDpr)) {
      dpr = nextDpr;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    C = {
      ...comp,
      art: a,
      lite,
      N: lite ? 17 : 27,
      M: lite ? 96 : 144,
      line: lite ? 0.95 : 1.05,
      arcW: comp.layout === 'narrow' ? 1.5 : 1.75,
      gold: lite ? [[1, 0.25]] : [[1, 0.25], [0.42, 2.0], [0.62, 0.85]],
    };
    canvas.dataset.layout = comp.layout + (lite ? '-lite' : '');
  }

  function introT(now) {
    if (introDone) return INTRO_MS;
    if (introOverride != null) return introOverride;
    if (introStart == null) return 0;
    return now - introStart;
  }

  /* ---------- arco: hero → (lid | entrega à jornada) ---------- */
  function arcHero() {
    return { cx: C.cx, cy: C.cy, r: C.arcR, a0: 172, span: 196, opacity: 0.92, width: C.arcW };
  }
  function arcDest() {
    const lid = { cx: target.x + target.w / 2, cy: target.y + target.h / 2, r: Math.min(target.w, target.h) * 0.45, a0: 180, span: 180, opacity: 0.85, width: C.arcW };
    if (!arcT) return { arc: lid, handoff: false };
    const hand = { cx: target.x + arcT.cx, cy: target.y + arcT.cy, r: arcT.r, a0: arcT.a0 + 360, span: arcT.span, opacity: arcT.opacity ?? 0.5, width: arcT.width ?? 1.5 };
    if (hand.a0 > 300) hand.a0 -= 360; // mantém o ângulo inicial perto do herói (172°)
    if (Math.abs(hand.a0 - 172) > 180) hand.a0 += hand.a0 < 172 ? 360 : -360;
    const k = readyK;
    return {
      arc: { cx: lerp(lid.cx, hand.cx, k), cy: lerp(lid.cy, hand.cy, k), r: lerp(lid.r, hand.r, k), a0: lerp(lid.a0, hand.a0, k), span: lerp(lid.span, hand.span, k), opacity: lerp(lid.opacity, hand.opacity, k), width: lerp(lid.width, hand.width, k) },
      handoff: k > 0.999,
    };
  }

  function draw(now) {
    if (!ctx || !C) return;
    const t0 = performance.now();
    frames++;
    const passageOn = !reduced && isRect(target);
    const p = passageOn ? passage : 0;
    const tI = clamp(introT(now), 0, INTRO_MS);
    const ph = reduced ? 0 : amb;
    const { cx, cy, R0, N, M, e0 } = C;

    // destino real (centro da glândula no quadro, se houver arco) ou centro do quadro
    const dest = passageOn ? arcDest() : null;
    const gcx = dest ? (arcT ? lerp(target.x + target.w / 2, target.x + arcT.cx, readyK) : target.x + target.w / 2) : cx;
    const gcy = dest ? (arcT ? lerp(target.y + target.h / 2, target.y + arcT.cy, readyK) : target.y + target.h / 2) : cy;
    const a = passageOn ? ease(seg(p, 0, 0.45)) : 0;
    const R1 = passageOn ? 0.5 * Math.hypot(target.w, target.h) * 0.6 : R0;
    const bx = lerp(cx, gcx, a), by = lerp(cy, gcy, a);
    const sc = Math.exp(lerp(0, Math.log(R1 / R0), a));
    const elev = lerp(e0, 90 * DEG, a);
    const sinE = Math.sin(elev), cosE = Math.cos(elev);
    const Rcover = passageOn ? Math.max(...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v]) => Math.hypot(target.x + u * target.w - gcx, target.y + v * target.h - gcy))) : 0;
    const open = passageOn ? ease(seg(p, 0.26, 0.8)) * readyK : 0;
    const wr = open * Rcover;
    const ringA = (1 - ease(seg(p, 0.5, 0.92)) * readyK) * (1 - 0.3 * Math.sin(Math.PI * a)); // recua ao cruzar o texto
    const coverA = passageOn ? 1 - seg(p, 0.86, 1) * readyK : 0;
    const fillK = 1 - seg(a, 0.15, 0.45);

    const yaw = 0.045 * Math.sin((ph / 26000) * TAU);
    const breathe = 1 + 0.012 * Math.sin((ph / 11000) * TAU);
    const drift = ph / 9000;
    const wave = ph > 0 ? ((ph / 9000) % 1) * 1.4 - 0.2 : -1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);

    // cobertura do quadro da jornada (nunca revela um quadro vazio)
    if (coverA > 0.001) {
      const b = coverBleed; // cobre também o fio de 1 px da borda do quadro
      roundRect(ctx, target.x - b, target.y - b, target.w + 2 * b, target.h + 2 * b, (target.r ?? 12) + b);
      if (coverStops.length > 1) {
        const cg = ctx.createLinearGradient(0, target.y, 0, target.y + target.h);
        coverStops.forEach((c, i) => cg.addColorStop(i / (coverStops.length - 1), rgba(c, coverA)));
        ctx.fillStyle = cg;
      } else ctx.fillStyle = rgba(coverStops[0], coverA);
      ctx.fill();
    }
    // luz discreta sob a base (vinda de cima/esquerda)
    const glowR = R0 * sc * 1.5;
    const gl = ctx.createRadialGradient(bx - R0 * sc * 0.25, by - R0 * sc * 0.1, 0, bx, by, glowR);
    gl.addColorStop(0, rgba(RGB.slate, 0.17 * ringA));
    gl.addColorStop(1, rgba(RGB.slate, 0));
    ctx.fillStyle = gl;
    ctx.fillRect(bx - glowR, by - glowR, glowR * 2, glowR * 2);

    const ptsX = new Float32Array(M), ptsY = new Float32Array(M);
    const farCorner = Math.max(Math.hypot(bx, by), Math.hypot(W - bx, by), Math.hypot(bx, H - by), Math.hypot(W - bx, H - by));
    const goldPts = [];
    const lightDX = -0.62, lightDY = 0.78; // luz da esquerda/frente
    for (let k = 0; k < N; k++) {
      const f = k / (N - 1);
      const t = T_MAX * f;
      // abertura: as camadas se empilham da base ao cume, cada uma já na sua altura (assenta 8 px)
      const dK = 140 + 620 * f;
      const u = introDone ? 1 : easeOut(seg(tI, dK, dK + 380));
      if (u <= 0) continue;
      const baseR = R0 * profile(t);
      const rMin = baseR * 0.85 * sc * (1 + 0.5 * open) + wr * 1.03;
      if (open > 0 && rMin > farCorner + 4) continue; // fora do quadro
      const z = 0.94 * R0 * t * breathe - (1 - u) * 8 / Math.max(0.2, sc);
      const offX = -0.14 * R0 * Math.pow(t, 1.6), offY = -0.1 * R0 * t; // cume para trás/esquerda
      const cyw = Math.cos(yaw), syw = Math.sin(yaw);
      const ox = (offX * cyw - offY * syw) * sc * (1 - open), oy = (offX * syw + offY * cyw) * sc * (1 - open);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < M; i++) {
        const th = (i / M) * TAU;
        let r = baseR * ringShape(th, t, drift) * sc;
        if (open > 0) r = r * (1 + 0.5 * open) + wr * 1.03; // as curvas se afastam e abrem a janela
        const thw = th + yaw;
        const x = bx + ox + r * Math.cos(thw);
        const y = by + (oy + r * Math.sin(thw)) * sinE - z * sc * cosE;
        ptsX[i] = x; ptsY[i] = y;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      ctx.beginPath();
      ctx.moveTo(ptsX[0], ptsY[0]);
      for (let i = 1; i < M; i++) ctx.lineTo(ptsX[i], ptsY[i]);
      ctx.closePath();
      // terraço: oculta o que está atrás; mais claro no alto, lábio frontal mais escuro
      if (fillK > 0.01 && ringA > 0) {
        const fa = 0.95 * u * fillK * ringA * (0.5 + 0.5 * smooth(0, 0.3, t)); // base mais leve: sem massa escura
        const fg = ctx.createLinearGradient(0, minY, 0, maxY);
        fg.addColorStop(0, rgba(mix(RGB.navy, RGB.navyHi, 0.3 + 0.7 * f), fa));
        fg.addColorStop(1, rgba(mix(RGB.navyLo, RGB.navy, 0.55 + 0.45 * f), fa));
        ctx.fillStyle = fg;
        ctx.fill();
      }
      // linhas: curvas-mestras conduzem; secundárias discretas; base mais apagada
      const index = (N - 1 - k) % 5 === 0;
      const baseFade = 0.5 + 0.5 * smooth(0, 0.16, t);
      const boost = wave > -1 ? 0.4 * Math.exp(-((t - wave) ** 2) / (2 * 0.05 ** 2)) : 0;
      const lit = mix(RGB.slate, RGB.white, clamp01(0.18 + 0.7 * Math.pow(f, 0.85) + (index ? 0.12 : 0) + boost));
      const shade = mix(RGB.slate, RGB.navyHi, 0.25);
      const al = u * ringA * baseFade * (index ? 1 : 0.62);
      const gx0 = lerp(minX, maxX, 0.5) + lightDX * (maxX - minX) * 0.5, gy0 = lerp(minY, maxY, 0.5) + lightDY * (maxY - minY) * 0.5;
      const gx1 = lerp(minX, maxX, 0.5) - lightDX * (maxX - minX) * 0.5, gy1 = lerp(minY, maxY, 0.5) - lightDY * (maxY - minY) * 0.5;
      const gr = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
      gr.addColorStop(0, rgba(lit, 0.95 * al));
      gr.addColorStop(0.5, rgba(mix(lit, shade, 0.45), 0.72 * al));
      gr.addColorStop(1, rgba(shade, 0.4 * al));
      ctx.strokeStyle = gr;
      ctx.lineWidth = index ? C.line * 1.6 : C.line;
      ctx.lineJoin = 'round';
      if (al > 0.002) ctx.stroke();
      for (const [gf, gth] of C.gold) {
        if (Math.round(gf * (N - 1)) !== k) continue;
        const i = Math.round(((((gth % TAU) + TAU) % TAU) / TAU) * M) % M;
        goldPts.push([ptsX[i], ptsY[i]]);
      }
    }
    const goldA = (introDone ? 1 : easeOut(seg(tI, 950, INTRO_MS))) * ringA;
    if (goldA > 0.002) {
      ctx.fillStyle = rgba(RGB.gold, 0.95 * goldA);
      for (const [x, y] of goldPts) { ctx.beginPath(); ctx.arc(x, y, C.lite ? 2.1 : 2.5, 0, TAU); ctx.fill(); }
    }

    // janela: recorta a cobertura e as curvas sobre o quadro real da jornada
    if (passageOn && open > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      roundRect(ctx, target.x, target.y, target.w, target.h, target.r ?? 12);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(gcx, gcy, wr, 0, TAU);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
    }

    // arco: nasce compacto, envolve a escultura; na passagem, enquadra o quadro e entrega à jornada
    let A = arcHero();
    if (!introDone) {
      const d01 = easeOut(seg(tI, 0, 700));
      const grow = ease(seg(tI, 250, 1000));
      const r0 = R0 * 0.16;
      const span = 196 * d01;
      A = { cx, cy: lerp(cy - R0 * 0.55, cy, grow), r: r0 * Math.pow(C.arcR / r0, grow), a0: 270 - span / 2, span, opacity: 0.92 * easeOut(seg(tI, 0, 250)), width: lerp(C.arcW * 1.3, C.arcW, grow) };
    }
    if (dest && p > 0) {
      const s = ease(seg(p, 0.05, 0.42));
      const E = dest.arc;
      const fadeOut = arcT ? seg(p, 0.56, 0.72) * readyK : seg(p, 0.5, 0.72) * readyK; // a jornada assume o arco
      A = {
        cx: lerp(A.cx, E.cx, s), cy: lerp(A.cy, E.cy, s),
        r: Math.exp(lerp(Math.log(A.r), Math.log(E.r), s)),
        a0: lerp(A.a0, E.a0, s), span: lerp(A.span, E.span, s),
        opacity: lerp(A.opacity, E.opacity, seg(p, 0.36, 0.56)) * (1 - fadeOut),
        width: lerp(A.width, E.width, s),
      };
    }
    lastArc = A;
    if (A.opacity > 0.002 && A.span > 0.2) {
      ctx.beginPath();
      ctx.arc(A.cx, A.cy, A.r, A.a0 * DEG, (A.a0 + A.span) * DEG);
      ctx.strokeStyle = rgba(RGB.gold, A.opacity);
      ctx.lineWidth = A.width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    canvas.dataset.passage = p.toFixed(3);
    canvas.dataset.reveal = passageOn ? (readyK > 0.999 ? 'ready' : readyK > 0 ? 'opening' : 'covered') : 'off';
    drawMs = performance.now() - t0;
  }

  // nada a animar quando a arte e o quadro estão fora da área visível do container
  function onScreen() {
    if (!C) return false;
    const vis = (r) => r && r.x < W && r.y < H && r.x + r.w > 0 && r.y + r.h > 0;
    return vis(C.bounds) || (!reduced && isRect(target) && passage > 0 && (passage < 1 || readyK < 1) && vis(target));
  }
  function loopWanted() {
    if (destroyed || !visible || !onScreen()) return false;
    const introRunning = !introDone && introOverride == null && introStart != null;
    const readyAnim = !reduced && !paused && Math.abs(readyK - (ready ? 1 : 0)) > 1e-4;
    return introRunning || readyAnim || (introDone && !paused && !reduced);
  }
  function tick(now) {
    raf = 0;
    const dt = lastNow ? Math.min(50, now - lastNow) : 0;
    lastNow = now;
    if (!introDone && introOverride == null && introStart != null && now - introStart >= INTRO_MS) finishIntro();
    if (introDone && !paused && !reduced) amb += dt;
    const goal = ready ? 1 : 0;
    if (reduced || paused) readyK = goal;
    else if (readyK !== goal) readyK = goal > readyK ? Math.min(1, readyK + dt / READY_MS) : Math.max(0, readyK - dt / READY_MS);
    draw(now);
    if (loopWanted()) raf = requestAnimationFrame(tick);
    else lastNow = 0;
  }
  function kick() {
    if (destroyed || raf) return;
    raf = requestAnimationFrame(tick);
  }
  function finishIntro() {
    introDone = true; introStart = null; introOverride = null;
    canvas.dataset.intro = 'done';
  }

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { measure(); kick(); }) : null;
  if (ro) ro.observe(container);
  const io = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible) kick(); })
    : null;
  if (io) io.observe(container);

  function applyLayout(l) {
    if (!l) return;
    if ('art' in l) art = isRect(l.art) ? { ...l.art } : null;
    if ('target' in l) target = isRect(l.target) ? { ...l.target } : null;
    if ('ready' in l) ready = !!l.ready;
    if ('arc' in l) arcT = l.arc && [l.arc.cx, l.arc.cy, l.arc.r].every(Number.isFinite) ? { ...l.arc } : null;
    if (reduced || paused) readyK = ready ? 1 : 0;
  }
  applyLayout(options);
  readyK = ready ? 1 : 0;
  canvas.dataset.intro = 'done';
  measure();
  if (options.intro && !reduced && !paused) { introDone = false; introStart = performance.now(); canvas.dataset.intro = 'playing'; }
  draw(performance.now()); // primeira pintura síncrona: nada espera rede
  kick();

  return {
    /** Abertura (~1,2 s). Em pausa ou movimento reduzido: estado final direto. */
    playIntro() {
      if (destroyed) return;
      if (reduced || paused) { finishIntro(); kick(); return; }
      introDone = false; introOverride = null; introStart = performance.now();
      canvas.dataset.intro = 'playing';
      kick();
    },
    /** Quadro fixo da abertura (ms, 0–1200) para revisão; null encerra no estado final. */
    setIntroTime(ms) {
      if (destroyed) return;
      if (ms == null || !Number.isFinite(ms) || ms >= INTRO_MS || paused || reduced) { finishIntro(); kick(); return; }
      introDone = false; introStart = null; introOverride = clamp(ms, 0, INTRO_MS);
      canvas.dataset.intro = 'scrub';
      kick();
    },
    /** Passagem 0..1 (o Site deriva da rolagem). Determinística e reversível. Não finito: mantém. */
    setPassage(v) {
      if (destroyed || !Number.isFinite(v)) return;
      passage = clamp01(v);
      if (passage > 0.001 && !introDone && introOverride == null) finishIntro();
      kick();
    },
    /** {art?, target?, ready?, arc?} em px do container; campos ausentes não mudam. */
    setLayout(l) {
      if (destroyed) return;
      const before = !!C && C.art;
      applyLayout(l);
      if (l && 'art' in l && (!before || !isRect(art) || before.w !== art.w || before.h !== art.h || before.x !== art.x || before.y !== art.y)) measure();
      kick();
    },
    /** Pausa geral: encerra a abertura no estado assentado e congela o ambiente; passagem continua. */
    setPaused(v) {
      paused = !!v;
      if (paused) { finishIntro(); readyK = ready ? 1 : 0; }
      lastNow = 0;
      kick();
    },
    /** Movimento reduzido: escultura estática na área da arte; sem cobertura nem transformação. */
    setReducedMotion(v) {
      reduced = !!v;
      if (reduced) { finishIntro(); readyK = ready ? 1 : 0; }
      kick();
    },
    getComposition() { return C ? { layout: C.layout, lite: C.lite, art: C.art, cx: C.cx, cy: C.cy, R0: C.R0, arcR: C.arcR, bounds: C.bounds } : null; },
    /** Só para harness/testes. */
    _debug() { return { drawMs, arc: lastArc, frames, amb, passage, readyK, intro: canvas.dataset.intro, raf: !!raf, N: C && C.N, dpr }; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      canvas.remove();
    },
  };
}

function parseColor(c) {
  if (Array.isArray(c) && c.length >= 3) return c;
  if (typeof c === 'string' && /^#?[0-9a-f]{6}$/i.test(c)) { const h = c.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
  return null;
}
function roundRect(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
