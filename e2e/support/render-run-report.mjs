/**
 * Renders the JSON captured by record-run.mjs into a single static HTML page.
 *
 * The point is inspectability: every agent pass, the exact feedback a trusted
 * guard sent back, and the artwork decisions are all shown. A run that needed
 * three repair passes should read as a run that needed three repair passes.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const record = JSON.parse(readFileSync(process.argv[2] || '/tmp/run-record.json', 'utf8'));
const outDir = process.argv[3] || 'artifacts/run-report';
mkdirSync(outDir, { recursive: true });

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const GUARDS = [
  { match: 'without modifying any file', name: 'Personalization check', why: 'The session ended without writing anything.' },
  { match: 'does not appear in any', name: 'Personalization check', why: "The client's business name was missing from every changed file." },
  { match: "client's own photos", name: 'Client media check', why: "The client's photos existed but none appeared on the site." },
  { match: 'heroEligible', name: 'Hero eligibility gate', why: 'A photo not vouched for as hero-grade was placed in the hero.' },
  { match: 'hero image is empty', name: 'Hero eligibility gate', why: 'A hero-ready photo existed but the hero was left on placeholder art.' },
  { match: 'Quality sweep', name: 'Quality sweep', why: 'Second pass: first-person voice, nothing invented, length discipline.' },
  { match: 'Automated validation', name: 'Build validation', why: 'The site failed to build; the error was handed back for repair.' },
];
const classify = (trigger) => {
  if (!trigger) return { name: 'Initial personalization', why: 'First pass over the scaffolded template.' };
  return GUARDS.find((g) => trigger.includes(g.match))
    ?? { name: 'Repair pass', why: 'Trusted feedback returned to the agent.' };
};

const passRows = record.passes.map((p, i) => {
  const g = classify(p.trigger);
  return `<li class="pass">
    <div class="pass-head">
      <span class="pass-n">${i + 1}</span>
      <span class="pass-name">${esc(g.name)}</span>
      <span class="pass-meta">t+${esc(p.at)}s · took ${esc(p.seconds)}s · ${p.changed.length} file${p.changed.length === 1 ? '' : 's'} changed</span>
    </div>
    <p class="pass-why">${esc(g.why)}</p>
    ${p.trigger ? `<details><summary>Feedback sent to the agent</summary><pre>${esc(p.trigger)}</pre></details>` : ''}
    ${p.summary ? `<details><summary>Agent's own summary</summary><pre>${esc(p.summary)}</pre></details>` : ''}
    ${p.changed.length ? `<div class="files">${p.changed.map(f => `<code>${esc(f)}</code>`).join('')}</div>` : ''}
  </li>`;
}).join('');

const phaseRows = record.events.map((e) =>
  `<li><span class="t">t+${esc(e.at)}s</span><span>${esc(e.phase)}</span></li>`).join('');

const d = record.decisions;
const brand = record.brand ?? {};
const colors = brand.colors ?? {};
const swatches = Object.entries(colors).filter(([, v]) => /^#[0-9a-f]{6}$/i.test(String(v)))
  .map(([k, v]) => `<div class="sw"><span style="background:${esc(v)}"></span><code>${esc(k)}</code><code>${esc(v)}</code></div>`).join('');

const shot = existsSync('/tmp/run-shot.png');
if (shot) copyFileSync('/tmp/run-shot.png', join(outDir, 'result.png'));

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Flowstarter — one preview generation, start to finish</title>
<style>
  :root { color-scheme: dark; --bg:#0b0f1a; --panel:#121829; --line:#1f2740; --ink:#e8ecf6; --dim:#94a0bd; --accent:#7c8cff; }
  * { box-sizing:border-box }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.6 ui-sans-serif,system-ui,-apple-system,sans-serif; }
  .wrap { max-width:920px; margin:0 auto; padding:56px 20px 96px }
  h1 { font-size:clamp(1.8rem,4vw,2.6rem); line-height:1.15; margin:0 0 12px; letter-spacing:-0.02em }
  .lede { color:var(--dim); max-width:62ch; margin:0 0 32px }
  h2 { font-size:1.15rem; margin:44px 0 14px; letter-spacing:-0.01em }
  .grid { display:grid; gap:12px; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); margin-bottom:8px }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px 16px }
  .card .k { color:var(--dim); font-size:12px; text-transform:uppercase; letter-spacing:.08em }
  .card .v { font-size:1.05rem; margin-top:4px; word-break:break-word }
  ol.phases { list-style:none; padding:0; margin:0; border-left:2px solid var(--line) }
  ol.phases li { display:flex; gap:14px; padding:7px 0 7px 18px; position:relative }
  ol.phases li::before { content:''; position:absolute; left:-5px; top:15px; width:8px; height:8px; border-radius:50%; background:var(--accent) }
  .t { color:var(--dim); font-variant-numeric:tabular-nums; min-width:64px }
  ul.passes { list-style:none; padding:0; margin:0; display:grid; gap:12px }
  .pass { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px 16px }
  .pass-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap }
  .pass-n { background:var(--accent); color:#0b0f1a; font-weight:700; width:22px; height:22px; border-radius:50%; display:grid; place-items:center; font-size:12px }
  .pass-name { font-weight:650 }
  .pass-meta { color:var(--dim); font-size:12.5px }
  .pass-why { color:var(--dim); margin:8px 0 0 }
  details { margin-top:10px } summary { cursor:pointer; color:var(--accent); font-size:13.5px }
  pre { white-space:pre-wrap; background:#0d1322; border:1px solid var(--line); border-radius:8px; padding:12px; font-size:12.5px; color:#c7d0e8; overflow-x:auto }
  .files { margin-top:10px; display:flex; gap:6px; flex-wrap:wrap }
  code { background:#0d1322; border:1px solid var(--line); border-radius:6px; padding:2px 7px; font-size:12px }
  .sw { display:flex; align-items:center; gap:8px; margin:4px 0 }
  .sw span { width:20px; height:20px; border-radius:5px; border:1px solid var(--line) }
  .imgs { display:flex; gap:8px; flex-wrap:wrap }
  .imgs code { font-size:11.5px }
  img.shot { width:100%; border:1px solid var(--line); border-radius:12px; margin-top:8px }
  footer { color:var(--dim); font-size:13px; margin-top:56px; border-top:1px solid var(--line); padding-top:18px }
  a { color:var(--accent) }
</style></head><body><div class="wrap">
<h1>One preview, generated end to end</h1>
<p class="lede">A single unedited run of the Flowstarter preview pipeline: what each agent pass did, what the trusted guards sent back when a pass got something wrong, and the decisions that ended up in the published site. Repair passes are shown rather than hidden — they are how the pipeline holds a quality line without a human in the loop.</p>

<div class="grid">
  <div class="card"><div class="k">Template chosen</div><div class="v">${esc(record.template?.slug)}</div></div>
  <div class="card"><div class="k">Selected by</div><div class="v">${esc(String(record.template?.reason ?? '').startsWith('sigma') ? 'sigma classifier' : 'model')}</div></div>
  <div class="card"><div class="k">Agent passes</div><div class="v">${record.passes.length}</div></div>
  <div class="card"><div class="k">Total time</div><div class="v">${esc(record.totalSeconds)}s</div></div>
</div>
<div class="card" style="margin-top:12px"><div class="k">Why this template</div><div class="v" style="font-size:.95rem">${esc(record.template?.reason)}</div></div>

<h2>Phases</h2>
<ol class="phases">${phaseRows}</ol>

<h2>Agent passes and what triggered them</h2>
<ul class="passes">${passRows}</ul>

<h2>Brand read from the client's own evidence</h2>
<div class="grid">
  <div class="card"><div class="k">Headline</div><div class="v" style="font-size:.98rem">${esc(brand.voice?.sampleHeadline)}</div></div>
  <div class="card"><div class="k">Voice</div><div class="v" style="font-size:.98rem">${esc((brand.voice?.adjectives ?? []).join(', '))}</div></div>
  <div class="card"><div class="k">Typography</div><div class="v" style="font-size:.98rem">${esc(brand.typography?.headingFont)} / ${esc(brand.typography?.bodyFont)}</div></div>
  <div class="card"><div class="k">Evidence cited</div><div class="v" style="font-size:.9rem">${esc((brand.evidence?.textSourceIds ?? []).join(', '))}</div></div>
</div>
<div class="card" style="margin-top:12px">${swatches}</div>

<h2>What the agent decided about images</h2>
<div class="grid">
  <div class="card"><div class="k">Hero photo</div><div class="v" style="font-size:.9rem">${esc(d.heroImage || '(template art panel)')}</div></div>
  <div class="card"><div class="k">Hero framing</div><div class="v">${esc(d.heroPosition || '(default)')}</div></div>
  <div class="card"><div class="k">Monogram</div><div class="v">${esc(d.artMark || '—')}</div></div>
</div>
<div class="card" style="margin-top:12px"><div class="k">Images placed</div><div class="imgs" style="margin-top:8px">${d.cards.map(c=>`<code>${esc(c)}</code>`).join('')}</div></div>
${d.socials?.length ? `<div class="card" style="margin-top:12px"><div class="k">Real profile links used</div><div class="imgs" style="margin-top:8px">${d.socials.map(c=>`<code>${esc(c)}</code>`).join('')}</div></div>` : ''}

${shot ? `<h2>The result</h2><img class="shot" src="result.png" alt="The generated site">` : ''}

<footer>Run ${esc(record.projectId)} · recorded ${esc(record.startedAt)} · generated by <code>e2e/support/record-run.mjs</code>. Timings come from one real run on one machine and are not a benchmark.</footer>
</div></body></html>`;

writeFileSync(join(outDir, 'index.html'), html, 'utf8');
console.log(`wrote ${join(outDir, 'index.html')} (${record.passes.length} passes, ${record.events.length} phases)`);
