/**
 * Live smoke test — hits the REAL Tavily + OpenRouter APIs. Reads keys from env;
 * never hardcode secrets here.
 *
 *   TAVILY_API_KEY=... OPENROUTER_API_KEY=... pnpm test:live "<your idea>"
 *
 * With only TAVILY_API_KEY set, it verifies search and skips the LLM pipeline.
 */
import { OpenRouterClient } from '../src/llm';
import { runIdeaValidation } from '../src/loop';
import { buildResearchTools } from '../src/researchTools';
import { TavilyClient } from '../src/search';

async function main(): Promise<void> {
  const idea = process.argv[2] ?? 'A subscription box for specialty single-origin coffee in Romania';
  const hasTavily = !!process.env.TAVILY_API_KEY;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  console.log(`keys: tavily=${hasTavily ? 'yes' : 'NO'} openrouter=${hasOpenRouter ? 'yes' : 'NO'}`);

  // 1) Tavily search (needs only TAVILY_API_KEY)
  if (hasTavily) {
    const resp = await new TavilyClient().search('specialty coffee subscription market size', { maxResults: 3 });
    console.log(`\n[tavily] ok=${resp.ok} results=${resp.results.length}${resp.error ? ` error=${resp.error}` : ''}`);
    for (const r of resp.results) console.log(`  - ${r.domain}  ${r.title}`);
  } else {
    console.log('\n[tavily] skipped — no TAVILY_API_KEY');
  }

  // 2) Full pipeline (needs OPENROUTER_API_KEY too)
  if (hasTavily && hasOpenRouter) {
    const llm = new OpenRouterClient();
    const tools = buildResearchTools({ search: new TavilyClient(), llm });
    console.log(`\n[loop] idea: ${idea}\n`);
    const res = await runIdeaValidation({
      idea,
      llm,
      tools,
      maxIterations: 6,
      emit: (e, d) => {
        if (e === 'act') console.log(`  → ${d.tool}(${JSON.stringify(d.arguments).slice(0, 120)})`);
        else if (e === 'observe') console.log(`  ← ${String(d.result).slice(0, 160)}`);
        else if (e === 'think') console.log(`  · think (step ${d.iteration})`);
        else if (e === 'error') console.log(`  ! error: ${d.message}`);
      },
    });
    console.log('\n=== VERDICT (freeform — structured synthesis is the next increment) ===\n');
    console.log(res.finalMessage ?? '(no answer)');
    console.log(`\niterations=${res.iterations}`);
  } else {
    console.log('\n[loop] skipped — set OPENROUTER_API_KEY to run the full pipeline');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
