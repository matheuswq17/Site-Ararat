// Servidor estático sem dependências para o harness. Raiz: motion/. Porta: PORT ou 3001 (tenta a seguinte se ocupada).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.md': 'text/markdown; charset=utf-8', '.mp4': 'video/mp4' };

export function startServer(port = Number(process.env.PORT) || 3001, tries = 10) {
  return new Promise((ok, fail) => {
    const server = http.createServer(async (req, res) => {
      try {
        let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        if (p === '/') { res.writeHead(302, { location: '/harness/' }); return res.end(); }
        let file = normalize(join(root, p));
        if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
        if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
        const body = await readFile(file);
        res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(body);
      } catch {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('404');
      }
    });
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE' && tries > 0) ok(startServer(port + 1, tries - 1));
      else fail(e);
    });
    server.listen(port, '127.0.0.1', () => ok({ server, port }));
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { port } = await startServer();
  console.log(`Harness ARARAT motion: http://localhost:${port}/harness/`);
  console.log(`Scroll demo:          http://localhost:${port}/harness/scroll.html`);
}
