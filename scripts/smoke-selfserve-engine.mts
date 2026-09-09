import { createOrchestratorEngine } from '../packages/build-orchestrator/src/index.ts';
import { MockEngine } from '../packages/build-engine/src/index.ts';

const events: string[] = [];
const emit = (e: any) => { if (e.type === 'feed') events.push(`${e.agent}: ${e.text}${e.artifact ? ` [${e.artifact}]` : ''}`); };

const engine = createOrchestratorEngine({ onTaskUpdate: () => {} });
const out = await engine.run({ buildId: 'smoke-1', projectId: 'p1', businessDescription: 'A weekend pottery studio for total beginners — drop-in classes', refinements: [], demoSpec: null, attempt: 0 }, emit);
console.log('orchestrator feed lines:', events.length);
console.log(events.map((l) => '  ' + l).join('\n'));
console.log('spec brand:', out.spec.brand.name, '| html has brand:', out.siteHtml.includes(out.spec.brand.name), '| previewUrl:', out.previewUrl);

const mock = new MockEngine({ minDelayMs: 1, maxDelayMs: 2 });
const out2 = await mock.run({ buildId: 'smoke-2', projectId: 'p2', businessDescription: 'A neighborhood sourdough bakery', refinements: [], demoSpec: null, attempt: 0 }, async () => {});
console.log('mock engine ok:', out2.spec.brand.name);
let failed = false;
try { await mock.run({ buildId: 'smoke-3', projectId: 'p3', businessDescription: 'x [fail] y pottery', refinements: [], demoSpec: null, attempt: 0 }, async () => {}); } catch { failed = true; }
console.log('failure injection throws:', failed);
