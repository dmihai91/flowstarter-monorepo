// Mock agent adapter — instant, deterministic task outputs so the full
// orchestrator pipeline (plan → waves → validate → outputs) runs without the
// Cursor CLI or any API key. Implement tasks write real files to the
// workspace (sandbox-as-truth), exactly like the real adapter would.
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mockSpecFromDescription, renderSiteHtml } from '@flowstarter/build-engine';
import type { AgentAdapter, AgentRunContext, Task } from '../types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MockAgentAdapter implements AgentAdapter {
  readonly name = 'mock-agent';

  async run(task: Task, ctx: AgentRunContext): Promise<string> {
    await sleep(600 + Math.random() * 1200);
    const spec = mockSpecFromDescription(ctx.goal);

    switch (task.capability) {
      case 'research':
        return `Positioning: ${spec.positioning}\n- Audience: local customers searching for exactly this\n- Wedge: ${spec.brand.tagline}\n- Risk: differentiation depends on owning the wedge in all copy`;
      case 'branding':
        return JSON.stringify(spec.brand);
      case 'copywriting':
        return JSON.stringify(spec.copy);
      case 'implement': {
        const file = join(ctx.workspaceDir, 'index.html');
        if (task.artifact === 'site') {
          await writeFile(file, renderSiteHtml(spec), 'utf8');
          return 'Wrote index.html (complete responsive single-file site).';
        }
        // booking polish task: verify the file exists and has a CTA anchor
        const html = await readFile(file, 'utf8').catch(() => null);
        if (!html) throw new Error('index.html missing — site task did not produce it');
        return 'Verified contact/booking section and nav anchors in index.html.';
      }
      case 'review':
        return 'Reviewed index.html against the spec — consistent.';
    }
  }
}
