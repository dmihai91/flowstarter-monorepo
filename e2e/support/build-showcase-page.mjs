/** Assembles the recorded clips into one page. */
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'artifacts/showcase';
const deposit = existsSync('/tmp/deposit-run.txt')
  ? readFileSync('/tmp/deposit-run.txt', 'utf8').trim() : '';
const sites = JSON.parse(process.argv[2] ?? '[]');

const esc = (v) => String(v ?? '').replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const clip = (name, title, note) => existsSync(join(OUT, 'video', `${name}.webm`)) ? `
  <figure class="clip">
    <video src="video/${name}.webm" autoplay muted loop playsinline preload="metadata"></video>
    <figcaption><strong>${esc(title)}</strong> ${esc(note)}</figcaption>
  </figure>` : '';

writeFileSync(join(OUT, 'index.html'), `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Flowstarter — the pipeline, running</title>
<style>
  :root { color-scheme: dark; --bg:#0b0f1a; --panel:#121829; --line:#1f2740;
          --ink:#e8ecf6; --dim:#94a0bd; --accent:#7c8cff; --ok:#6ee7a8 }
  * { box-sizing:border-box }
  body { margin:0; background:var(--bg); color:var(--ink);
         font:15px/1.65 ui-sans-serif,system-ui,-apple-system,sans-serif }
  .wrap { max-width:960px; margin:0 auto; padding:56px 20px 96px }
  h1 { font-size:clamp(1.9rem,4vw,2.7rem); line-height:1.14; margin:0 0 14px; letter-spacing:-.02em }
  .lede { color:var(--dim); max-width:64ch; margin:0 0 36px }
  h2 { font-size:1.15rem; margin:44px 0 14px }
  .clip { margin:0 0 22px; background:var(--panel); border:1px solid var(--line);
          border-radius:14px; overflow:hidden }
  .clip video { width:100%; display:block; background:#000 }
  figcaption { padding:12px 16px; color:var(--dim); font-size:13.5px; border-top:1px solid var(--line) }
  figcaption strong { color:var(--ink); font-weight:600 }
  .grid { display:grid; gap:12px; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)) }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px 16px }
  .card .k { color:var(--dim); font-size:12px; text-transform:uppercase; letter-spacing:.08em }
  .card .v { font-size:1.05rem; margin-top:4px }
  pre { background:#0d1322; border:1px solid var(--line); border-radius:12px; padding:16px;
        overflow-x:auto; font:12.5px/1.6 ui-monospace,Menlo,monospace; color:#c7d0e8 }
  a { color:var(--accent) }
  ul.sites { list-style:none; padding:0; margin:0; display:grid; gap:10px }
  ul.sites li { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:12px 16px }
  footer { color:var(--dim); font-size:13px; margin-top:56px; border-top:1px solid var(--line); padding-top:18px }
</style></head><body><div class="wrap">

<h1>The pipeline, running</h1>
<p class="lede">Two sites generated from nothing but a written brief, and a deposit taken through the
same webhook Stripe calls in production. Every frame below is the running system on a local
stack — no mockups, and the failures it caught along the way are in the commit history rather
than edited out.</p>

<div class="grid">
  <div class="card"><div class="k">Brief to live preview</div><div class="v">~5 min</div></div>
  <div class="card"><div class="k">Human input</div><div class="v">One form</div></div>
  <div class="card"><div class="k">Deposit</div><div class="v">Signed webhook</div></div>
  <div class="card"><div class="k">Build job</div><div class="v">Queued on payment</div></div>
</div>

<h2>The sites it produced</h2>
${clip('sites', 'Two finished sites', '— a counselling practice and an operations consultancy, both from a brief alone.')}
<ul class="sites">${sites.map((s) => `<li><strong>${esc(s.name)}</strong> — <a href="${esc(s.url)}">${esc(s.url)}</a></li>`).join('')}</ul>

<h2>On a phone</h2>
${clip('mobile', 'Mobile, including the menu', '— the panel sizes to the visible viewport and scrolls, so the call to action is always reachable.')}

<h2>Taking the deposit</h2>
${clip('deposit', 'A deposit, end to end', '— quote, 20/80 split, signed webhook, lifecycle move, build queued. Then a redelivery that must not build twice, and a forged event that is refused.')}
${deposit ? `<pre>${esc(deposit)}</pre>` : ''}

<footer>Recorded on one machine against a local Supabase and Stripe test keys. Timings are from
these runs, not a benchmark.</footer>
</div></body></html>`);
console.log('wrote', join(OUT, 'index.html'));
