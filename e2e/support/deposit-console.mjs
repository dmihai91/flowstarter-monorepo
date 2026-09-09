/** Renders a recorded simulate-deposit run as a terminal, for filming. */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const raw = readFileSync(process.argv[2] ?? '/tmp/deposit-run.txt', 'utf8');
const lines = raw.split('\n');
const html = `<!doctype html><meta charset="utf-8">
<title>Deposit — signed Stripe webhook</title>
<style>
  :root { color-scheme: dark }
  body { margin:0; background:#0b0f1a; color:#e8ecf6;
         font:15px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace; }
  .wrap { padding:34px 40px }
  h1 { font:600 15px/1 ui-sans-serif,system-ui; color:#94a0bd; letter-spacing:.14em;
       text-transform:uppercase; margin:0 0 22px }
  pre { margin:0; white-space:pre-wrap }
  .l { opacity:0; transition:opacity .18s ease }
  .l.on { opacity:1 }
  .step { color:#7c8cff; font-weight:600 }
  .ok { color:#6ee7a8 } .warn { color:#ffcc7a }
</style>
<div class="wrap">
  <h1>Deposit · signed Stripe webhook · local stack</h1>
  <pre id="out">${lines.map((l, i) => {
    const cls = /^\d\./.test(l) ? 'step'
      : /200 OK|expected 1|expected 401|DEPOSIT_PAID|FULL_SITE_BUILD|paid/.test(l) ? 'ok'
      : /401|forged/.test(l) ? 'warn' : '';
    const esc = l.replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    return `<span class="l ${cls}" data-i="${i}">${esc || ' '}</span>`;
  }).join('\n')}</pre>
</div>
<script>
  const els = [...document.querySelectorAll('.l')];
  window.__playLog = () => els.forEach((el, i) => setTimeout(() => el.classList.add('on'), i * 260));
</script>`;

createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(html);
}).listen(8951, '127.0.0.1', () => console.log('deposit console on :8951'));
