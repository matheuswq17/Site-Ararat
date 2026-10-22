#!/usr/bin/env node
// Promoção dos movimentos aprovados, mantendo capturas e comparações fora da variante pública.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:3290";
const resultados = [];
const browser = await chromium.launch();
const check = (nome, teste, detalhe) => {
  resultados.push({ nome, ok: !!teste, detalhe });
  console.log(`${teste ? "ok" : "FALHA"}: ${nome}`);
};
try {
  // A troca de fonte deve preservar a composição publicada nas mesmas janelas: a métrica "ch" não pode
  // estreitar o título e trocar a montanha superior por uma coluna lateral em um desktop alto.
  for (const [width, height, variante, arteW] of [
    [1920, 1030, "horizonte", 1100], [1920, 1080, "horizonte", 1100], [1440, 900, "horizonte", 860],
    [1366, 768, "lateral", 860], [1280, 720, "lateral", 750], [1280, 600, "lateral", 750],
    [390, 844, "celular", 390],
  ]) for (const rota of ["/pt", "/", "/es"]) {
    const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await p.goto(base + rota);
    await p.waitForFunction(() => document.querySelector("[data-hero]")?.hasAttribute("data-composta"));
    const r = await p.evaluate(() => {
      const hero = document.querySelector("[data-hero]"), arte = hero.querySelector("[data-arte]").getBoundingClientRect();
      const texto = hero.querySelector("[data-txt]").getBoundingClientRect();
      return { variante: hero.dataset.variante, arteW: arte.width, arteFundo: arte.bottom, textoTopo: texto.top,
        centro: arte.left + arte.width / 2, largura: innerWidth };
    });
    check(`${rota} ${width}x${height}: composição e enquadramento preservados na troca de fonte`,
      r.variante === variante && r.arteW === arteW && (variante === "lateral" ||
        (r.arteFundo <= r.textoTopo && Math.abs(r.centro - r.largura / 2) < 1)), r);
    await ctx.close();
  }
  for (const largura of [1366, 390]) for (const rota of ["/pt", "/", "/es"]) {
    const ctx = await browser.newContext({ viewport: { width: largura, height: 844 } });
    await ctx.addInitScript(() => {
      // Preferências de comparação antigas não podem desligar os movimentos públicos.
      sessionStorage.setItem("ararat:texto-versao", "atual");
      sessionStorage.setItem("ararat:transicao", "atual");
      sessionStorage.setItem("ararat:montanha-versao", "estavel");
      window.__promocao = { linhas: false, transicao: false };
      new MutationObserver(() => {
        window.__promocao.linhas ||= !!document.querySelector(".texto-linha");
        window.__promocao.transicao ||= !!document.querySelector(".pagina-entra");
      }).observe(document, { subtree: true, childList: true, attributes: true });
    });
    const p = await ctx.newPage();
    const requisicoes = []; const erros = [];
    p.on("request", r => requisicoes.push(new URL(r.url()).pathname));
    p.on("pageerror", e => erros.push(e.message));
    await p.goto(base + rota + "?texto=atual&montanha=estavel&transicao=atual");
    await p.waitForFunction(() => document.querySelector("[data-hero]")?.dataset.montanha === "canvas");
    await p.waitForTimeout(1800);
    const r = await p.evaluate(() => ({
      ...window.__promocao, texto: document.documentElement.dataset.texto,
      transicaoModo: document.documentElement.dataset.transicao,
      privada: document.documentElement.dataset.revisao,
      versao: document.querySelector("[data-hero]").dataset.montanhaVersao,
      controle: !!document.querySelector(".texto-revisao"),
      completo: getComputedStyle(document.querySelector("h1")).opacity === "1" && !document.documentElement.dataset.textoEntrada,
      noindex: document.querySelector('meta[name="robots"]')?.content.includes("noindex"),
    }));
    check(`${rota} ${largura}: GSAP por padrão, comparação ignorada, título completo`, r.linhas && r.texto === "gsap" && r.completo, r);
    check(`${rota} ${largura}: 1.3.1 sem revisão privada nem mídia pendente`, r.versao === "1.3.1-03d2-candidato" && !r.privada && !r.controle && !requisicoes.some(u => u.startsWith("/privado/")), r);
    check(`${rota} ${largura}: noindex preservado e nenhum erro de página`, r.noindex && !erros.length, erros);
    const pausa = p.locator("[data-pausa]:visible").first();
    await pausa.click();
    check(`${rota} ${largura}: pausa continua funcional`, await pausa.getAttribute("aria-pressed") === "true");
    if (largura === 1366) {
      await pausa.click();
      await p.locator("header .nav a").first().click();
      await p.waitForTimeout(1500);
      check(`${rota}: transição aprovada e navegação sem recarga`, await p.evaluate(() => window.__promocao.transicao && document.documentElement.dataset.transicao === "candidata"));
    }
    await ctx.close();
  }
  for (const modo of ["reduzido", "sem-js"]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 },
      ...(modo === "reduzido" ? { reducedMotion: "reduce" } : { javaScriptEnabled: false }) });
    const p = await ctx.newPage();
    await p.goto(base + "/pt"); await p.waitForTimeout(1800);
    const r = await p.evaluate(() => ({ linhas: document.querySelectorAll(".texto-linha").length,
      op: getComputedStyle(document.querySelector("h1")).opacity,
      ent: document.documentElement.dataset.textoEntrada,
      poster: document.querySelector("[data-poster-montanha]").complete }));
    check(`${modo}: título inteiro e poster disponível`, !r.linhas && r.op === "1" && !r.ent && r.poster, r);
    await ctx.close();
  }
  const pacote = await fetch(base + "/previa/home-montanha-1.3.1-03d2-candidato/web/home-sculpture.js");
  const hash = createHash("sha256").update(Buffer.from(await pacote.arrayBuffer())).digest("hex");
  check("pacote aprovado íntegro", pacote.ok && hash === "014e0257dc8df118ec57f3da419d3d243b66d73e71560284917fce24386c0a25", hash);
  for (const path of ["/privado/cap/seg-t2-com-mascaras-748.webp", "/previa/home-montanha-1.3.0-03d2-candidato/web/home-sculpture.js", "/institucional/capturas-v1/hub-caso-revisao-pendente-900.webp", "/previa/refinada"]) {
    const r = await fetch(base + path);
    check(`bloqueio preservado: ${path}`, r.status === 404);
  }
} finally {
  await browser.close();
  if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(resultados, null, 2));
}
assert.equal(resultados.filter(r => !r.ok).length, 0, "verificações reprovadas");
console.log(`${resultados.length} verificações aprovadas.`);
