#!/usr/bin/env node
// FlowStarter Template Preview Server
// Serves pre-built static template files from preview-dist/

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PREVIEW_PORT || 4100;
const DIST = path.join(__dirname, 'preview-dist');

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css',
  '.js':    'application/javascript',
  '.mjs':   'application/javascript',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.webp':  'image/webp',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.map':   'application/json',
};

http.createServer((req, res) => {
  // Strip query string
  const urlPath = req.url.split('?')[0].replace(/\.\./g, '');
  let filePath = path.join(DIST, urlPath);

  // Directory → try index.html
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
  } catch {
    // File doesn't exist — try appending index.html
    if (!path.extname(urlPath)) filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`Not found: ${urlPath}`);
    return;
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);

  res.writeHead(200, {
    'Content-Type':  mime,
    'Content-Length': stat.size,
    'Cache-Control':  'no-cache',
    'Access-Control-Allow-Origin': '*',
  });

  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`FlowStarter preview server → http://localhost:${PORT}`);
  console.log(`Serving from: ${DIST}`);
});
