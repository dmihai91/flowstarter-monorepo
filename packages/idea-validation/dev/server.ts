/**
 * Minimal dev server to try the idea-validation pipeline in a browser.
 * SSE streams the live think/act/observe/answer events; the final freeform
 * verdict prints at the end (structured synthesis is the next increment).
 *
 *   TAVILY_API_KEY=... OPENROUTER_API_KEY=... pnpm dev
 *   → open http://localhost:8787
 *
 * Reads keys from env only. Search works with just TAVILY_API_KEY; the agent
 * loop + extraction need OPENROUTER_API_KEY too.
 */
import { createServer } from 'node:http';

import { OpenRouterClient } from '../src/llm';
import { runIdeaValidation } from '../src/loop';
import { buildResearchTools } from '../src/researchTools';
import { TavilyClient } from '../src/search';

const PORT = Number(process.env.PORT ?? 8787);

const HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Idea Validation — dev</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 15px/1.5 ui-sans-serif, system-ui, sans-serif; max-width: 820px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 1.2rem; }
  textarea { width: 100%; box-sizing: border-box; padding: .6rem; font: inherit; }
  button { padding: .55rem 1.1rem; font: inherit; cursor: pointer; margin-top: .5rem; }
  #log { margin-top: 1rem; white-space: pre-wrap; font: 13px/1.5 ui-monospace, monospace; background: rgba(127,127,127,.08); padding: 1rem; border-radius: 8px; min-height: 4rem; }
  .answer { margin-top: 1rem; padding: 1rem; border-left: 3px solid currentColor; white-space: pre-wrap; }
  .row { color: #888; }
  .err { color: #c0392b; }
</style></head><body>
<h1>Idea Validation <span style="color:#888;font-weight:400">— dev harness</span></h1>
<textarea id="idea" rows="3" placeholder="Describe a business idea…">A subscription box for specialty single-origin coffee in Romania</textarea>
<button id="go">Validate</button>
<div id="log"></div>
<div id="answer" class="answer" hidden></div>
<script>
  const log = document.getElementById('log');
  const answer = document.getElementById('answer');
  const btn = document.getElementById('go');
  let es = null;
  function line(t, cls){ const d = document.createElement('div'); if(cls) d.className = cls; d.textContent = t; log.appendChild(d); }
  btn.onclick = () => {
    if (es) es.close();
    log.textContent = ''; answer.hidden = true; answer.textContent = '';
    const idea = document.getElementById('idea').value;
    es = new EventSource('/validate?idea=' + encodeURIComponent(idea));
    es.onmessage = (ev) => {
      const { type, data } = JSON.parse(ev.data);
      if (type === 'think') line('· thinking (step ' + data.iteration + ')', 'row');
      else if (type === 'act') line('→ ' + data.tool + '(' + JSON.stringify(data.arguments).slice(0,140) + ')', 'row');
      else if (type === 'observe') line('← ' + String(data.result).slice(0,220), 'row');
      else if (type === 'error') { line('! ' + data.message, 'err'); es.close(); }
      else if (type === 'done') { answer.hidden = false; answer.textContent = data.finalMessage || '(no answer)'; es.close(); }
      else if (type === 'start') line('starting…', 'row');
    };
    es.onerror = () => { line('connection closed', 'row'); es.close(); };
  };
</script></body></html>`;

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
    return;
  }

  if (url.pathname === '/validate') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    const send = (type: string, data: unknown): void => {
      res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    };
    const idea = (url.searchParams.get('idea') ?? '').trim();
    if (!idea) return void (send('error', { message: 'no idea provided' }), res.end());
    if (!process.env.TAVILY_API_KEY) return void (send('error', { message: 'TAVILY_API_KEY not set' }), res.end());
    if (!process.env.OPENROUTER_API_KEY) {
      return void (
        send('error', {
          message: 'OPENROUTER_API_KEY not set — Tavily search works, but the agent loop + extraction need it. Set it and restart.',
        }),
        res.end()
      );
    }
    try {
      const llm = new OpenRouterClient();
      const tools = buildResearchTools({ search: new TavilyClient(), llm });
      send('start', { idea });
      const result = await runIdeaValidation({ idea, llm, tools, maxIterations: 6, emit: (e, d) => send(e, d) });
      send('done', { finalMessage: result.finalMessage, iterations: result.iterations });
    } catch (e) {
      send('error', { message: e instanceof Error ? e.message : String(e) });
    }
    res.end();
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, () => console.log(`idea-validation dev server → http://localhost:${PORT}`));
