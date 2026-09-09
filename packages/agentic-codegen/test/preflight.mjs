/**
 * Cheap OpenRouter preflight: confirms OPENROUTER_API_KEY is found and that
 * both pipeline models (Sonnet brain + Kimi K2.6 implementer) are reachable on
 * this account, with a 1-token call each. No key is printed.
 *
 *   node packages/agentic-codegen/test/preflight.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '../../..');
function loadKey() {
  if (process.env.OPENROUTER_API_KEY) return;
  for (const f of ['apps/flowstarter-main/.env', 'apps/flowstarter-main/.env.local', '.env.shared']) {
    const p = join(REPO, f);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, 'utf8').match(/^OPENROUTER_API_KEY=(.+)$/m);
    if (m?.[1]) { process.env.OPENROUTER_API_KEY = m[1].trim().replace(/^["']|["']$/g, ''); return; }
  }
}

loadKey();
const key = process.env.OPENROUTER_API_KEY;
if (!key) { console.error('✗ no OPENROUTER_API_KEY found in env files'); process.exit(2); }
console.log('✓ key found');

async function ping(model) {
  const t0 = Date.now();
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
        max_tokens: 5,
        usage: { include: true },
      }),
    });
    const j = await res.json();
    if (!res.ok) { console.log(`✗ ${model} → HTTP ${res.status}: ${JSON.stringify(j).slice(0, 200)}`); return false; }
    const text = (j.choices?.[0]?.message?.content ?? '').trim();
    const cost = j.usage?.cost;
    console.log(`✓ ${model} → "${text}" (${Date.now() - t0}ms${typeof cost === 'number' ? `, $${cost.toFixed(5)}` : ''})`);
    return true;
  } catch (e) {
    console.log(`✗ ${model} → ${e.message}`);
    return false;
  }
}

const ok = (await Promise.all([
  ping('anthropic/claude-sonnet-4'),
  ping('moonshotai/kimi-k2.6'),
])).every(Boolean);
process.exit(ok ? 0 : 1);
