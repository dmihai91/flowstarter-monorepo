/** Static server for the generated Romanian fitness-coach demo site. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = new URL('../../artifacts/fitness-ro', import.meta.url).pathname;
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.webp':'image/webp',
  '.woff2':'font/woff2', '.ico':'image/x-icon', '.txt':'text/plain', '.xml':'application/xml' };

createServer((req, res) => {
  void (async () => {
    let path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
    if (path.includes('..')) { res.writeHead(400).end(); return; }
    let file = join(ROOT, path);
    try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); }
    catch { file = extname(file) ? file : file + '/index.html'; }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
        'cache-control': extname(file) === '.html' ? 'public, max-age=300' : 'public, max-age=86400' });
      res.end(body);
    } catch {
      try {
        const nf = await readFile(join(ROOT, '404.html'));
        res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }); res.end(nf);
      } catch { res.writeHead(404).end('not found'); }
    }
  })();
}).listen(8902, '127.0.0.1', () => console.log('fitness-ro on :8902'));
