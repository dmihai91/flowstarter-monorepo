// The brain — planning + validation with a strong model (never the cheap demo
// model). OpenRouter-backed; deterministic fallback when no key is configured
// so the orchestrator stays runnable in dev. Mirrors gretly's brain seam.

export interface BrainResult {
  text: string;
}

const BRAIN_MODEL = () => process.env.BUILD_BRAIN_MODEL ?? 'anthropic/claude-sonnet-4.6';

export async function callBrain(system: string, user: string): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: BRAIN_MODEL(),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) {
    console.error('[orchestrator brain] call failed', res.status, await res.text().catch(() => ''));
    return null;
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? null;
}

/** Parse a JSON object out of a model response (tolerates code fences). */
export function parseJson<T>(raw: string): T | null {
  try {
    const cleaned = raw.replace(/^[\s\S]*?```(?:json)?/m, '').replace(/```[\s\S]*$/m, '').trim();
    return JSON.parse(cleaned.startsWith('{') || cleaned.startsWith('[') ? cleaned : raw) as T;
  } catch {
    try {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1)) as T;
    } catch {}
    return null;
  }
}
