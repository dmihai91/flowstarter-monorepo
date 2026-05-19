/**
 * Render a built site in a real browser and save screenshots.
 *   node packages/agentic-codegen/test/shoot.mjs <distDir> [outPrefix]
 * Produces desktop + mobile, light + dark PNGs. Serves dist over a static
 * http server (so /_astro assets + client JS like the theme toggle work).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { chromium } from 'playwright';

const distDir = resolve(process.argv[2] ?? '');
const outPrefix = process.argv[3] ?? '/tmp/cg-shot';

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let fp = join(distDir, p);
    try { if ((await stat(fp)).isDirectory()) fp = join(fp, 'index.html'); } catch {}
    const body = await readFile(fp);
    res.writeHead(200, { 'content-type': MIME[extname(fp)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = `http://localhost:${port}/`;

const browser = await chromium.launch();
const shots = [];
for (const [name, viewport] of [
  ['desktop', { width: 1280, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const out = `${outPrefix}-${name}-${scheme}.png`;
    await page.screenshot({ path: out, fullPage: name === 'desktop' });
    shots.push(out);
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(JSON.stringify({ url, shots }, null, 2));
