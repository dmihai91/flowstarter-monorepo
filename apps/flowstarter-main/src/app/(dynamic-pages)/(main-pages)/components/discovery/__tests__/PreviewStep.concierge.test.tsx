/**
 * The concierge stage as the visitor meets it: one conversation on the left,
 * the site assembling on the right, and an offer that is stated in words and
 * in euros before anyone is asked for anything.
 *
 * What is protected here is the product, not the markup:
 *
 *   - the site pane is a plainly-fake skeleton until there is a real site;
 *   - every pipeline phase arrives as a message, in order, signed by an agent,
 *     with the one in progress named in the always-visible "Now:" line;
 *   - "this is a preview of your full site, the deposit is €X" is said before
 *     the build starts and again when it finishes;
 *   - a failed build is admitted and the visitor chooses what happens next;
 *   - the offer button still claims the preview through the claim endpoint;
 *   - the panes stack status → site → conversation, which is the mobile order.
 */
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_DISCOVERY, type DiscoveryData } from '../discovery.logic';
import { PreviewStep } from '../steps/PreviewStep';

const auth = { isSignedIn: true, isLoaded: true };
const openSignIn = vi.fn();

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => auth,
  useClerk: () => ({ openSignIn }),
}));

type Listener = (event: { data: string }) => void;

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url: string;
  closed = false;
  onerror: ((event: Event) => void) | null = null;
  private listeners: Record<string, Listener[]> = {};

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, cb: Listener) {
    (this.listeners[type] ??= []).push(cb);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data: unknown) {
    for (const cb of this.listeners[type] ?? []) {
      cb({ data: JSON.stringify(data) });
    }
  }
}

/** A visitor who confirmed Starter: €799 build, €159.80 deposit, €639.20 due. */
const DATA: DiscoveryData = {
  ...EMPTY_DISCOVERY,
  businessName: 'Ionescu Dental',
  description: 'A dental clinic that stays open late.',
  selectedTier: 'starter',
  intakeChat: [
    { role: 'agent', text: 'What makes people pick you?' },
    { role: 'client', text: 'We are the only practice open late.' },
  ],
};

const t = (key: string) => key;

const originalEventSource = (globalThis as { EventSource?: unknown })
  .EventSource;
const originalFetch = global.fetch;

interface Calls {
  claim: RequestInit[];
  live: number;
}

function routedFetch(
  calls: Calls,
  handlers: { postLive?: (n: number) => unknown; claim?: () => unknown } = {}
) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    if (url.startsWith('/api/flowstarter/projects/claim')) {
      calls.claim.push(init ?? {});
      return {
        ok: false,
        json: async () =>
          handlers.claim?.() ?? { error: 'Stopped before navigating.' },
      };
    }
    if (url.startsWith('/api/discovery/preview/live') && method === 'POST') {
      calls.live += 1;
      return {
        ok: true,
        json: async () =>
          handlers.postLive?.(calls.live) ?? { demoId: 'demo-1' },
      };
    }
    if (url.startsWith('/api/discovery/preview') && method === 'POST') {
      return { ok: true, json: async () => ({ skip: true }) };
    }
    return { ok: true, json: async () => ({}) };
  }) as unknown as typeof fetch;
}

/** Renders and waits until the live build has a stream to report on. */
async function startBuild(data: DiscoveryData = DATA) {
  const view = render(<PreviewStep data={data} t={t} />);
  await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));
  return { view, source: FakeEventSource.instances[0]! };
}

const conversation = () => screen.getByRole('log');
const nowLine = () => screen.getByTestId('concierge-now');

/**
 * The deposit ask hides behind the two free changes; visitors who are already
 * sold pull it forward with this link. Tests that assert on the offer go
 * through the same door.
 */
async function revealOffer() {
  await userEvent.click(
    await screen.findByRole('button', {
      name: /show me how to reserve the full site/i,
    })
  );
}

beforeEach(() => {
  FakeEventSource.instances = [];
  (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
  window.sessionStorage.clear();
  auth.isSignedIn = true;
  auth.isLoaded = true;
  // jsdom has no scrollIntoView, and the conversation scrolls on every turn.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  (globalThis as { EventSource?: unknown }).EventSource = originalEventSource;
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('the site pane', () => {
  it('is an obvious skeleton until there is a real site, then the site', async () => {
    global.fetch = routedFetch({ claim: [], live: 0 });
    const { source } = await startBuild();

    const sitePane = screen.getByTestId('concierge-site-pane');
    expect(
      within(sitePane).getByTestId('concierge-skeleton')
    ).toBeInTheDocument();
    expect(screen.queryByTitle('Live site preview')).toBeNull();

    act(() =>
      source.emit('ready', {
        previewUrl: 'https://acme.preview.example',
        personalized: true,
      })
    );

    expect(await screen.findByTitle('Live site preview')).toBeInTheDocument();
  });
});

describe('the conversation', () => {
  it('carries the info agent’s questions and the visitor’s answers into it', async () => {
    global.fetch = routedFetch({ claim: [], live: 0 });
    await startBuild();

    expect(
      within(conversation()).getByText('What makes people pick you?')
    ).toBeInTheDocument();
    expect(
      within(conversation()).getByText('We are the only practice open late.')
    ).toBeInTheDocument();
  });

  it('reports each phase as a message, in order, signed by the agent that owns it', async () => {
    global.fetch = routedFetch({ claim: [], live: 0 });
    const { source } = await startBuild();

    act(() =>
      source.emit('phase', {
        phase: 'Learning your voice and visual direction',
        at: 3,
      })
    );
    act(() =>
      source.emit('phase', {
        phase: 'Choosing the best starting design',
        at: 11,
      })
    );

    const log = conversation();
    expect(
      await within(log).findByText(/Learning your voice and visual direction/)
    ).toBeInTheDocument();
    // The phase text is the server's, and the byline is the landing page's.
    expect(within(log).getByText('Brand analyst')).toBeInTheDocument();
    expect(within(log).getByText('Design matcher')).toBeInTheDocument();

    const text = log.textContent ?? '';
    expect(text.indexOf('Learning your voice')).toBeLessThan(
      text.indexOf('Choosing the best starting design')
    );
  });

  it('keeps the phase in progress named in the always-visible Now line', async () => {
    global.fetch = routedFetch({ claim: [], live: 0 });
    const { source } = await startBuild();

    expect(nowLine()).toHaveTextContent(/getting your build started/i);

    act(() =>
      source.emit('phase', { phase: 'Placing your own photos', at: 40 })
    );
    await waitFor(() =>
      expect(nowLine()).toHaveTextContent(/Placing your own photos/)
    );

    act(() =>
      source.emit('phase', { phase: 'Publishing your live preview', at: 96 })
    );
    await waitFor(() =>
      expect(nowLine()).toHaveTextContent(/Publishing your live preview/)
    );
    // The one it moved on from is still in the log, just no longer "Now".
    expect(
      within(conversation()).getByText(/Placing your own photos/)
    ).toBeInTheDocument();
  });
});

describe('what the visitor is told this is', () => {
  it('says it is a preview of the full site, with the deposit, before any phase runs', async () => {
    global.fetch = routedFetch({ claim: [], live: 0 });
    await startBuild();

    const log = conversation();
    expect(
      within(log).getByText(/preview of your full site/i)
    ).toBeInTheDocument();
    expect(
      within(log).getByText(/20% deposit of €159\.80/)
    ).toBeInTheDocument();
    expect(within(log).getByText(/€639\.20 balance/)).toBeInTheDocument();
  });

  it('quotes the tier the visitor actually confirmed', async () => {
    global.fetch = routedFetch({ claim: [], live: 0 });
    await startBuild({ ...DATA, selectedTier: 'commerce' });

    expect(
      within(conversation()).getByText(/20% deposit of €299\.80/)
    ).toBeInTheDocument();
  });

  it('says it again when the preview is ready, next to the button', async () => {
    global.fetch = routedFetch({ claim: [], live: 0 });
    const { source } = await startBuild();

    act(() =>
      source.emit('ready', {
        previewUrl: 'https://acme.preview.example',
        personalized: true,
      })
    );
    await revealOffer();

    const log = conversation();
    expect(
      await within(log).findByText(/not the whole site/i)
    ).toBeInTheDocument();
    expect(
      within(log).getByText(/20% deposit is €159\.80/)
    ).toBeInTheDocument();
    expect(
      within(log).getByRole('button', {
        name: 'Reserve my full site — pay the €159.80 deposit',
      })
    ).toBeInTheDocument();
    // And the quieter way past it, always.
    expect(
      within(log).getByRole('button', { name: /keep exploring the preview/i })
    ).toBeInTheDocument();
  });

  it('lets the visitor put the offer aside without losing it', async () => {
    global.fetch = routedFetch({ claim: [], live: 0 });
    const { source } = await startBuild();
    act(() =>
      source.emit('ready', {
        previewUrl: 'https://acme.preview.example',
        personalized: true,
      })
    );
    await revealOffer();
    const later = await screen.findByRole('button', {
      name: /keep exploring the preview/i,
    });

    await userEvent.click(later);
    expect(
      screen.queryByRole('button', { name: /pay the €159\.80 deposit/ })
    ).toBeNull();

    await userEvent.click(
      screen.getByRole('button', { name: /show me the deposit again/i })
    );
    expect(
      screen.getByRole('button', { name: /pay the €159\.80 deposit/ })
    ).toBeInTheDocument();
  });
});

describe('the deposit ask waits its turn', () => {
  it('invites the two changes first and holds the deposit button back', async () => {
    global.fetch = routedFetch({ claim: [], live: 0 });
    const { source } = await startBuild();
    act(() =>
      source.emit('ready', {
        previewUrl: 'https://acme.preview.example',
        personalized: true,
      })
    );

    const log = conversation();
    expect(await within(log).findByText(/up to 2 changes/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /pay the €159\.80 deposit/ })
    ).toBeNull();

    await revealOffer();
    expect(
      screen.getByRole('button', { name: /pay the €159\.80 deposit/ })
    ).toBeInTheDocument();
  });
});

describe('the offer button', () => {
  it('still claims the preview through the claim endpoint', async () => {
    const calls: Calls = { claim: [], live: 0 };
    global.fetch = routedFetch(calls);
    const { source } = await startBuild();
    act(() =>
      source.emit('ready', {
        previewUrl: 'https://acme.preview.example',
        personalized: true,
      })
    );
    await revealOffer();

    await userEvent.click(
      await screen.findByRole('button', { name: /pay the €159\.80 deposit/ })
    );

    await waitFor(() => expect(calls.claim).toHaveLength(1));
    const body = JSON.parse(String(calls.claim[0]!.body));
    expect(body.previewId).toBe('demo-1');
    expect(body.tier).toBe('starter');
    // The conversation the info agent had rides along as evidence.
    expect(body.intakeChat).toBeTruthy();
  });

  it('sends a signed-out visitor through the sign-in modal first', async () => {
    auth.isSignedIn = false;
    const calls: Calls = { claim: [], live: 0 };
    global.fetch = routedFetch(calls);
    const { source } = await startBuild();
    act(() =>
      source.emit('ready', {
        previewUrl: 'https://acme.preview.example',
        personalized: true,
      })
    );
    await revealOffer();

    await userEvent.click(
      await screen.findByRole('button', { name: /pay the €159\.80 deposit/ })
    );

    expect(openSignIn).toHaveBeenCalledTimes(1);
    expect(calls.claim).toHaveLength(0);
  });
});

describe('when the build fails', () => {
  it('says so and offers the choice, instead of falling back silently', async () => {
    global.fetch = routedFetch({ claim: [], live: 0 });
    const { source } = await startBuild();

    act(() => source.emit('failed', { error: 'the sandbox ran out of time' }));

    const log = conversation();
    expect(
      await within(log).findByText(/that build did not finish/i)
    ).toBeInTheDocument();
    expect(
      within(log).getByText(/the sandbox ran out of time/)
    ).toBeInTheDocument();
    expect(
      within(log).getByRole('button', { name: /try the build again/i })
    ).toBeInTheDocument();
    expect(
      within(log).getByRole('button', { name: /simpler preview instead/i })
    ).toBeInTheDocument();
    // Nothing pretended the preview arrived.
    expect(screen.queryByTitle('Live site preview')).toBeNull();
    expect(nowLine()).toHaveTextContent(/the build stopped/i);
  });

  it('starts a genuinely new build when the visitor asks to try again', async () => {
    const calls: Calls = { claim: [], live: 0 };
    global.fetch = routedFetch(calls, {
      postLive: (n) => ({ demoId: `demo-${n}` }),
    });
    const { source } = await startBuild();
    expect(calls.live).toBe(1);

    act(() => source.emit('failed', { error: 'the sandbox ran out of time' }));
    await userEvent.click(
      await screen.findByRole('button', { name: /try the build again/i })
    );

    await waitFor(() => expect(calls.live).toBe(2));
    // A second job means a second stream, and the failure notice is gone.
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(2));
    expect(screen.queryByText(/that build did not finish/i)).toBeNull();
  });
});

describe('the layout', () => {
  it('stacks status, then the site, then the conversation — the mobile order', async () => {
    global.fetch = routedFetch({ claim: [], live: 0 });
    await startBuild();

    const panes = screen.getByTestId('concierge-panes');
    const order = Array.from(panes.children);
    expect(order).toHaveLength(3);
    expect(order[0]!.contains(nowLine())).toBe(true);
    expect(order[1]).toBe(screen.getByTestId('concierge-site-pane'));
    expect(order[2]).toBe(screen.getByTestId('concierge-conversation-pane'));
    // The status line rides at the top of the stack rather than scrolling off.
    expect(order[0]!.className).toContain('sticky');
  });
});
