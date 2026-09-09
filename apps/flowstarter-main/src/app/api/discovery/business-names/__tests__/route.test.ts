/**
 * POST /api/discovery/business-names.
 *
 * The product decision this route encodes is "offered only when the visitor
 * asks", so the case that matters most is the refusal: without an explicit
 * `requested: true` the naming agent is never reached, no matter how complete
 * the rest of the body is. The rest of the cases are the same spend doors the
 * intake chat has.
 *
 * The Pi agent is mocked: `PI_API_KEY` is not configured on this machine.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

vi.mock('server-only', () => ({}));

const proposeBusinessNames = vi.fn();
vi.mock('@flowstarter/agentic-codegen', () => ({
  PiSdkFlowstarterAgents: class {
    constructor(_options: unknown) {}
    proposeBusinessNames(input: unknown) {
      return proposeBusinessNames(input);
    }
  },
}));

vi.mock('@/lib/ai/llm', () => ({
  recordLlmUsage: vi.fn(),
  llmActionConfig: () => ({
    maxTokens: 6_000,
    maxOutputTokens: 600,
    model: 'test-model',
  }),
}));

const budgetState = { state: 'ok' as 'ok' | 'degrade' | 'blocked' };
vi.mock('@/lib/ai/funnel-cost', () => ({
  funnelBudgetState: async () => ({ state: budgetState.state }),
}));

const moderation = { isProhibited: false };
vi.mock('@/lib/ai/moderate', () => ({
  aiModerateContent: async () => ({ isProhibited: moderation.isProhibited }),
}));

let ipCounter = 0;

function request(body: unknown): NextRequest {
  ipCounter += 1;
  return new NextRequest('http://localhost/api/discovery/business-names', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': `10.1.0.${ipCounter}`,
    },
  });
}

beforeEach(() => {
  proposeBusinessNames.mockReset();
  budgetState.state = 'ok';
  moderation.isProhibited = false;
  process.env.PI_API_KEY = 'test-key';
  proposeBusinessNames.mockResolvedValue([
    { name: 'Bright Cluj Dental', rationale: 'Names the trade and the city.' },
  ]);
});

describe('POST /api/discovery/business-names', () => {
  it('refuses to suggest anything unless the visitor explicitly asked', async () => {
    const response = await POST(
      request({ niche: 'Dentistry', description: 'A dental clinic in Cluj' })
    );

    expect(response.status).toBe(400);
    expect(proposeBusinessNames).not.toHaveBeenCalled();
  });

  it('refuses `requested: false` just as firmly', async () => {
    const response = await POST(
      request({ requested: false, niche: 'Dentistry' })
    );
    expect(response.status).toBe(400);
    expect(proposeBusinessNames).not.toHaveBeenCalled();
  });

  it('returns names when the visitor asked for them', async () => {
    const response = await POST(
      request({
        requested: true,
        niche: 'Dentistry',
        location: 'Cluj',
        description: 'A two-chair practice',
        avoid: ['Ionescu Dental'],
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.names).toEqual([
      {
        name: 'Bright Cluj Dental',
        rationale: 'Names the trade and the city.',
      },
    ]);
    expect(proposeBusinessNames).toHaveBeenCalledWith(
      expect.objectContaining({
        niche: 'Dentistry',
        location: 'Cluj',
        avoid: ['Ionescu Dental'],
      })
    );
  });

  it('spends nothing while the funnel budget kill-switch is thrown', async () => {
    budgetState.state = 'blocked';
    const response = await POST(
      request({ requested: true, niche: 'Dentistry' })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.names).toEqual([]);
    expect(proposeBusinessNames).not.toHaveBeenCalled();
  });

  it('will not name a business it would not build a site for', async () => {
    moderation.isProhibited = true;
    const response = await POST(
      request({ requested: true, niche: 'adult chat', description: 'cam site' })
    );

    expect(response.status).toBe(422);
    expect(proposeBusinessNames).not.toHaveBeenCalled();
  });

  it('fails open to an empty list when the agent errors', async () => {
    proposeBusinessNames.mockRejectedValue(new Error('model unavailable'));
    const response = await POST(
      request({ requested: true, niche: 'Dentistry' })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.names).toEqual([]);
  });
});
