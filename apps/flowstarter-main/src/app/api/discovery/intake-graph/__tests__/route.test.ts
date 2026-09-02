/**
 * POST /api/discovery/intake-graph — smoke the route doors without a model.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

const startIntakeGraph = vi.fn();
const resumeIntakeGraph = vi.fn();
const setIntakeGraphDeps = vi.fn();
const resetIntakeGraphDeps = vi.fn();

vi.mock('@/lib/flowstarter/intake-graph', () => ({
  startIntakeGraph: (input: unknown) => startIntakeGraph(input),
  resumeIntakeGraph: (input: unknown) => resumeIntakeGraph(input),
  setIntakeGraphDeps: (input: unknown) => setIntakeGraphDeps(input),
  resetIntakeGraphDeps: () => resetIntakeGraphDeps(),
}));

const budgetState = { state: 'ok' as 'ok' | 'degrade' | 'blocked' };
vi.mock('@/lib/ai/funnel-cost', () => ({
  funnelBudgetState: async () => ({ state: budgetState.state }),
}));

vi.mock('@/lib/ai/moderate', () => ({
  aiModerateContent: async () => ({ isProhibited: false }),
}));

import { POST } from '../route';

let ipCounter = 0;

function request(body: unknown): NextRequest {
  ipCounter += 1;
  return new NextRequest('http://localhost/api/discovery/intake-graph', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': `10.1.0.${ipCounter}`,
    },
  });
}

describe('POST /api/discovery/intake-graph', () => {
  beforeEach(() => {
    startIntakeGraph.mockReset();
    resumeIntakeGraph.mockReset();
    setIntakeGraphDeps.mockReset();
    resetIntakeGraphDeps.mockReset();
    budgetState.state = 'ok';
    startIntakeGraph.mockResolvedValue({
      threadId: '11111111-1111-1111-1111-111111111111',
      status: 'ask',
      ask: {
        type: 'ask',
        questionId: 'fullName',
        kind: 'text',
        prompt: 'What should we call you?',
        required: true,
      },
      data: {},
      answered: [],
      progress: { done: 0, total: 10 },
    });
  });

  it('starts a thread', async () => {
    const response = await POST(request({ action: 'start', locale: 'en' }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ask');
    expect(body.ask.questionId).toBe('fullName');
    expect(startIntakeGraph).toHaveBeenCalledOnce();
  });

  it('rejects a malformed body', async () => {
    const response = await POST(request({ action: 'resume' }));
    expect(response.status).toBe(400);
  });

  it('fails open when the funnel budget is blocked', async () => {
    budgetState.state = 'blocked';
    const response = await POST(request({ action: 'start' }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe('budget');
    expect(setIntakeGraphDeps).toHaveBeenCalled();
    expect(resetIntakeGraphDeps).toHaveBeenCalled();
  });

  it('resumes an existing thread', async () => {
    resumeIntakeGraph.mockResolvedValue({
      threadId: '11111111-1111-1111-1111-111111111111',
      status: 'ask',
      ask: {
        type: 'ask',
        questionId: 'email',
        kind: 'text',
        prompt: 'And your email?',
        required: true,
      },
      data: { fullName: 'Maria' },
      answered: ['fullName'],
      progress: { done: 1, total: 10 },
    });

    const response = await POST(
      request({
        action: 'resume',
        threadId: '11111111-1111-1111-1111-111111111111',
        resume: { kind: 'text', text: 'Maria Ionescu' },
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ask.questionId).toBe('email');
    expect(resumeIntakeGraph).toHaveBeenCalledOnce();
  });
});
