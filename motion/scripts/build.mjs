// Copia o módulo para deliverables/ e gera manifest.json com tamanhos reais.
import { copyFile, readFile, writeFile, stat, mkdir, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = join(root, 'deliverables');
const status = process.argv.includes('--ready') ? 'ready' : 'draft';
await mkdir(join(out, 'web'), { recursive: true });
await mkdir(join(out, 'assets'), { recursive: true });
// incorpora o mapa (mesma fonte de assets/mri-map.json) no módulo: uma requisição a menos em runtime
const mapText = await readFile(join(out, 'assets/mri-map.json'), 'utf8');
const mriMap = JSON.parse(mapText);
const srcJs = await readFile(join(root, 'src/journey.js'), 'utf8');
if (!srcJs.includes('/*__MRI_MAP__*/ null')) throw new Error('marcador do mapa ausente em src/journey.js');
await writeFile(join(out, 'web/journey.js'), srcJs.replace('/*__MRI_MAP__*/ null', JSON.stringify(mriMap)));
await copyFile(join(root, 'src/journey.css'), join(out, 'web/journey.css'));
await copyFile(join(root, 'src/hero-atmosphere.js'), join(out, 'web/hero-atmosphere.js'));
await copyFile(join(root, 'src/hero-atmosphere.css'), join(out, 'web/hero-atmosphere.css'));

function webpSize(buf) {
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (chunk === 'VP8L') { const b = buf.readUInt32LE(21); return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }; }
  throw new Error('webp desconhecido');
}

const files = [];
const add = async (path, role, extra = {}) => {
  const s = await stat(join(out, path));
  files.push({ path, role, sizeBytes: s.size, ...extra });
};
await add('web/journey.js', 'entry');
await add('web/journey.css', 'stylesheet');
await add('web/hero-atmosphere.js', 'hero-entry');
await add('web/hero-atmosphere.css', 'hero-stylesheet');
const assets = (await readdir(join(out, 'assets'))).filter((f) => f.endsWith('.webp')).sort();
await add('assets/mri-map.json', 'overlay-map', { width: mriMap.width, height: mriMap.height });
let posterDims = null;
for (const f of assets) {
  const dims = webpSize(await readFile(join(out, 'assets', f)));
  const role = f === 'journey-poster.webp' ? 'poster' : f === 'mri-base.webp' ? 'base-image' : f === 'hero-atmosphere-poster.webp' ? 'hero-poster' : 'pose-still';
  if (role === 'poster') posterDims = dims;
  const extra = { ...dims };
  const m = f.match(/journey-pose-(\d)/);
  if (m) extra.progress = [0, 1 / 3, 2 / 3, 1][Number(m[1])];
  await add('assets/' + f, role, extra);
}
if (!posterDims) throw new Error('assets/journey-poster.webp ausente — rode npm run capture antes do build final');
const heroPoster = files.find((f) => f.path === 'assets/hero-atmosphere-poster.webp');

const manifest = {
  schemaVersion: 1,
  name: 'ararat-journey',
  version: JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version,
  status,
  builtAt: new Date().toISOString(),
  entry: 'web/journey.js',
  stylesheet: 'web/journey.css',
  poster: 'assets/journey-poster.webp',
  posterWidth: posterDims.width,
  posterHeight: posterDims.height,
  implementation: 'svg',
  renderer: 'Imagem raster (mri-base.webp) com transformação CSS + SVG alinhado (segmentação, dados, conexões) + Canvas2D só para o plano elevado da glândula',
  baseImage: 'assets/mri-base.webp',
  overlayMap: 'assets/mri-map.json',
  poseStills: ['assets/journey-pose-0.webp', 'assets/journey-pose-1.webp', 'assets/journey-pose-2.webp', 'assets/journey-pose-3.webp'],
  exports: ['createJourneyScene'],
  capabilities: ['image-load-attribute-v1', 'journey-layout-event-v1'],
  layoutEvent: {
    name: 'ararat:journey-layout',
    target: 'container passado a createJourneyScene (bubbles: false)',
    ids: ['shape', 'texture', 'intensity'],
    anchor: 'x/y normalizados 0..1 do ponto central da BORDA INFERIOR do rótulo; Site usa translate(-50%,-100%); espaço reservado de 90×24 px CSS acima de cada traço',
    emphasis: 'texture durante o foco didático da Explicação (progress ≥ ~0,80); null nas demais poses. Ilustrativo, não é inferência.',
  },
  ...(heroPoster ? { hero: { entry: 'web/hero-atmosphere.js', stylesheet: 'web/hero-atmosphere.css', poster: 'assets/hero-atmosphere-poster.webp', posterWidth: heroPoster.width, posterHeight: heroPoster.height, exports: ['createHeroAtmosphere'] } } : {}),
  states: { imagem: 0, segmentacao: 1 / 3, dados: 2 / 3, explicacao: 1 },
  featureOrder: ['forma', 'textura', 'intensidade'],
  illustrative: true,
  demonstrative: true,
  notes: 'RM axial demonstrativa de origem a confirmar (licença/desidentificação pendentes). Máscaras derivadas da sobreposição demonstrativa fornecida; região = subregião central da segmentação, exemplo didático, não lesão. Histograma = valores 8-bit do PNG, ilustrativo. Contribuições ilustrativas, sem números. Nada disso é resultado do ARARAT ou validação clínica.',
  files,
};
await writeFile(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest ${status}:`, files.map((f) => `${f.path} ${f.sizeBytes}B`).join(', '));
