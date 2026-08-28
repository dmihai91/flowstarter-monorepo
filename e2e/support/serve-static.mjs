/** Serves one built template at a root path: `node serve-static.mjs <dir> <port>`. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, resolve } from 'node:path';

const ROOT = resolve(process.argv[2]);
const PORT = Number(process.argv[3]);
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml',
  '.webp':'image/webp', '.woff2':'font/woff2', '.ico':'image/x-icon', '.xml':'application/xml' };

createServer((req, res) => {
  void (async () => {
    const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
    if (path.includes('..')) { res.writeHead(400).end(); return; }
    let file = join(ROOT, path);
    try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); }
    catch { file = extname(file) ? file : `${file}/index.html`; }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-store' });
      res.end(body);
    } catch {
      try { res.writeHead(404, {'content-type':'text/html; charset=utf-8'});
            res.end(await readFile(join(ROOT, '404.html'))); }
      catch { res.writeHead(404).end('not found'); }
    }
  })();
}).listen(PORT, '127.0.0.1', () => console.log(`${ROOT} on :${PORT}`));
