/** Serves one built template at a root path: `node serve-static.mjs <dir> <port>`. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, resolve } from 'node:path';

const ROOT = resolve(process.argv[2]);
const PORT = Number(process.argv[3]);
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml',
  '.webp':'image/webp', '.woff2':'font/woff2', '.ico':'image/x-icon', '.xml':'application/xml', '.webm':'video/webm', '.mp4':'video/mp4' };

createServer((req, res) => {
  void (async () => {
    const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
    if (path.includes('..')) { res.writeHead(400).end(); return; }
    let file = join(ROOT, path);
    try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); }
    catch { file = extname(file) ? file : `${file}/index.html`; }
    try {
      const body = await readFile(file);
      const type = TYPES[extname(file)] ?? 'application/octet-stream';
      // Range support, so a page of videos is seekable rather than
      // download-then-play. Without it Chrome will not scrub a webm served
      // over a tunnel, and every clip has to be watched from the top.
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
      if (range && body.length) {
        const start = range[1] ? Number(range[1]) : 0;
        const end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
        if (start > end || start >= body.length) {
          res.writeHead(416, { 'content-range': `bytes */${body.length}` }).end();
          return;
        }
        res.writeHead(206, {
          'content-type': type,
          'content-range': `bytes ${start}-${end}/${body.length}`,
          'accept-ranges': 'bytes',
          'content-length': end - start + 1,
          'cache-control': 'no-store',
        });
        res.end(body.subarray(start, end + 1));
        return;
      }
      res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes',
        'content-length': body.length, 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      // A client that aborts mid-stream makes res.end throw AFTER headers
      // went out; writing a 404 head on top of that throws
      // ERR_HTTP_HEADERS_SENT inside the catch, escapes the async IIFE, and
      // Node kills the whole process -- one impatient viewer took the
      // showcase down for everyone (the tunnel then answers 502).
      if (res.headersSent) { res.destroy(); return; }
      try { res.writeHead(404, {'content-type':'text/html; charset=utf-8'});
            res.end(await readFile(join(ROOT, '404.html'))); }
      catch { if (!res.headersSent) res.writeHead(404); res.end('not found'); }
    }
  })();
}).listen(PORT, '127.0.0.1', () => console.log(`${ROOT} on :${PORT}`));

// A single bad socket must never take the server down with it.
process.on('uncaughtException', (e) => console.error('[serve-static]', e?.message ?? e));
process.on('unhandledRejection', (e) => console.error('[serve-static]', e?.message ?? e));
