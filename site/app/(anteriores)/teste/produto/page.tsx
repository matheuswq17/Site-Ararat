import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDemo } from "@/components/ProductDemo";
import { checkProductDemo, type ProductDemo as Demo } from "@/lib/product-media";

export const metadata: Metadata = { title: "TESTE DE LAYOUT — encaixe de demonstração", robots: { index: false } };

/**
 * Harness do encaixe de demonstração (ARARAT_HARNESS=1; 404 fora dele).
 * TESTE DE LAYOUT: placas neutras geradas aqui (SVG em data: URI), sem anatomia e sem
 * reaproveitar a captura do Hub. Servem só para exercitar sticky, troca por rolagem e
 * clique, contorno e falha de imagem. Nada disto é captura do produto nem vai à home.
 *   /teste/produto           → 2 placas para 4 etapas (mesma placa sustenta 2 comentários)
 *   /teste/produto?falha=1   → a 2ª placa aponta para um arquivo inexistente
 */
function plate(label: string, w: number, h: number, tint: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${tint}"/><g fill="none" stroke="#3a4b60" stroke-width="2"><rect x="40" y="40" width="${w * 0.22}" height="${h - 80}"/><rect x="${w * 0.27}" y="40" width="${w * 0.69}" height="${h * 0.45}"/><rect x="${w * 0.27}" y="${h * 0.55}" width="${w * 0.69}" height="${h * 0.4}"/></g><text x="50%" y="50%" fill="#8a97a6" font-family="sans-serif" font-size="${Math.round(w / 22)}" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function fixture(fail: boolean): Demo {
  return {
    authorization: "TESTE DE LAYOUT — não publicar",
    deidentified: true,
    softwareVersion: "teste",
    testLabel: "placas neutras, não são capturas do ARARAT",
    media: [
      { id: "placa-a", src: plate("TESTE DE LAYOUT · placa A", 1600, 1000, "#101c2b"), width: 1600, height: 1000, alt: "Placa neutra A de teste de layout" },
      {
        id: "placa-b",
        src: fail ? "/product/arquivo-inexistente.webp" : plate("TESTE DE LAYOUT · placa B", 1600, 900, "#13202f"),
        width: 1600,
        height: 900,
        alt: "Placa neutra B de teste de layout",
      },
    ],
    steps: [
      { event: "hub", mediaId: "placa-a", caption: "TESTE 1 — comentário sobre a área esquerda da placa A.", focus: { x: 2, y: 4, w: 24, h: 92 } },
      { event: "caso", mediaId: "placa-a", caption: "TESTE 2 — mesma placa A, outra área comentada.", focus: { x: 27, y: 4, w: 70, h: 46 } },
      { event: "viewer", mediaId: "placa-b", caption: "TESTE 3 — troca para a placa B." },
      { event: "revisao", mediaId: "placa-b", caption: "TESTE 4 — placa B, área inferior.", focus: { x: 27, y: 55, w: 70, h: 40 } },
    ],
  };
}

export default async function ProductHarness({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (process.env.ARARAT_HARNESS !== "1") notFound();
  const sp = await searchParams;
  const demo = fixture(sp.falha === "1");
  const problems = checkProductDemo(demo);
  return (
    <main style={{ paddingTop: 96 }}>
      <div className="wrap" style={{ minHeight: "60vh" }}>
        <p className="eyebrow">TESTE DE LAYOUT</p>
        <p style={{ marginTop: 12, color: "var(--gray-300)" }}>Antes do capítulo (para testar o limite do quadro sticky).</p>
        {problems.length > 0 && <pre data-problems>{problems.join("\n")}</pre>}
      </div>
      <section id="plataforma-teste" style={{ background: "var(--navy-800)", paddingBlock: 64 }}>
        <div className="wrap">
          <ProductDemo demo={demo} />
        </div>
      </section>
      <div className="wrap" style={{ minHeight: "120vh", paddingTop: 48 }}>
        <p style={{ color: "var(--gray-300)" }} data-after>
          Depois do capítulo.
        </p>
      </div>
    </main>
  );
}
