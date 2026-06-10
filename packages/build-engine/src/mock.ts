// MockEngine — streams the prototype's BUILD_FEED with realistic delays and
// returns a static sample site. The app is fully testable end-to-end against it.
//
// Failure injection (for exercising the failure paths in dev):
//   description contains "[fail]"      → every attempt fails (terminal path: refund + apology)
//   description contains "[fail-once]" → first attempt fails, retry succeeds
//   description contains "[slow]"      → never completes (watchdog / >2h path)
import type {
  AgentId,
  BuildEngine,
  BuildOutputs,
  BuildRequest,
  EmitFn,
  SiteSpec,
} from './types';
import { mockSpecFromDescription } from './spec';
import { renderSiteHtml } from './site-html';

interface FeedLine {
  agent: AgentId;
  text: string;
  artifact?: string;
}

function feedScript(spec: SiteSpec): FeedLine[] {
  return [
    { agent: 'research', text: 'Pulling demand signals for your market…' },
    { agent: 'brand', text: 'Exploring names and identity directions…' },
    { agent: 'brand', text: `Landed on a direction: ${spec.brand.voice.map((v) => v.toLowerCase()).join(', ')}.`, artifact: 'brand' },
    { agent: 'research', text: `Positioning locked: “${spec.positioning}”`, artifact: 'positioning' },
    { agent: 'copy', text: 'Drafting a homepage hero that sells the feeling, not the features…' },
    { agent: 'copy', text: 'Hero + 3 sections written in your voice.', artifact: 'copy' },
    { agent: 'dev', text: 'Assembling pages, wiring nav and mobile layout…' },
    { agent: 'dev', text: 'Homepage assembled and responsive.', artifact: 'site' },
    { agent: 'dev', text: 'Connected the contact & booking flow.', artifact: 'booking' },
    { agent: 'dev', text: 'Everything is wired. Ready for your review.' },
  ];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface MockEngineOptions {
  /** Per-line delay range in ms (kept short in tests). */
  minDelayMs?: number;
  maxDelayMs?: number;
  /** Resolves preview URL for a finished build. */
  previewUrl?: (buildId: string) => string;
}

export class MockEngine implements BuildEngine {
  readonly kind = 'mock' as const;

  constructor(private opts: MockEngineOptions = {}) {}

  async run(req: BuildRequest, emit: EmitFn): Promise<BuildOutputs> {
    const min = this.opts.minDelayMs ?? 900;
    const max = this.opts.maxDelayMs ?? 2_200;
    const desc = req.businessDescription;

    if (/\[slow\]/.test(desc)) {
      // Simulate a stuck build: emit one line then hang far beyond any test window.
      await emit({ type: 'feed', ts: Date.now(), agent: 'research', text: 'Pulling demand signals…' });
      await sleep(2 ** 31 - 1);
    }

    const spec = req.demoSpec ?? mockSpecFromDescription(desc);
    const script = feedScript(spec);
    const failAt = /\[fail\]/.test(desc) || (/\[fail-once\]/.test(desc) && req.attempt === 0)
      ? Math.floor(script.length / 2)
      : -1;

    for (let i = 0; i < script.length; i++) {
      await sleep(min + Math.random() * (max - min));
      if (i === failAt) {
        throw new Error('Mock engine failure injected via description marker');
      }
      const line = script[i];
      await emit({ type: 'feed', ts: Date.now(), agent: line.agent, text: line.text, artifact: line.artifact });
      await emit({ type: 'progress', ts: Date.now(), progress: Math.round(((i + 1) / script.length) * 100) });
    }

    return {
      spec,
      siteHtml: renderSiteHtml(spec),
      previewUrl: this.opts.previewUrl ? this.opts.previewUrl(req.buildId) : `/site/${req.buildId}`,
    };
  }
}
