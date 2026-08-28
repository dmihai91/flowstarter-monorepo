/** Static server for the generated run report (artifacts/run-report). */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = new URL('../../artifacts/run-report', import.meta.url).pathname;
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.webp':'image/webp' };

createServer((req, res) => {
  void (async () => {
    let path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
    if (path.includes('..')) { res.writeHead(400).end(); return; }
    let file = join(ROOT, path);
    try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); }
    catch { file = extname(file) ? file : join(ROOT, 'index.html'); }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-store' });
      res.end(body);
    } catch { res.writeHead(404).end('not found'); }
  })();
}).listen(8903, '127.0.0.1', () => console.log('run report on :8903'));
