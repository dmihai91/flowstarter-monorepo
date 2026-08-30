/**
 * POST /api/discovery/intake-chat.
 *
 * The property under test is the division of labour: the deterministic gate
 * decides what is missing and the model only phrases it. So these cases pin
 *   - a complete intake asks nothing and spends nothing,
 *   - the asks handed to the model are exactly the gate's conversational
 *     gaps, in the gate's order, with no image asks smuggled in,
 *   - every spend door (turn cap, size cap, budget kill-switch, rate limit)
 *     closes before the model is reached,
 *   - the answers come back in a shape the wizard can merge.
 *
 * The Pi agent is mocked throughout: `PI_API_KEY` is not configured on this
 * machine and a test must never make a real model call.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
// Static imports: vi.mock is hoisted above them, and this app's tsconfig does
// not allow top-level await in tests.
import { POST } from '../route';
import { mergeExtractedAnswers } from '@/app/(dynamic-pages)/(main-pages)/components/discovery/intake-chat.shared';
import { EMPTY_DISCOVERY } from '@/app/(dynamic-pages)/(main-pages)/components/discovery/discovery.logic';

vi.mock('server-only', () => ({}));

const interviewIntake = vi.fn();
const constructedWith: unknown[] = [];

vi.mock('@flowstarter/agentic-codegen', () => ({
  PiSdkFlowstarterAgents: class {
    constructor(options: unknown) {
      constructedWith.push(options);
    }
    interviewIntake(input: unknown) {
      return interviewIntake(input);
    }
  },
}));

const recordLlmUsage = vi.fn();
vi.mock('@/lib/ai/llm', () => ({
  recordLlmUsage: (record: unknown) => recordLlmUsage(record),
  llmActionConfig: () => ({
    maxTokens: 8_000,
    maxOutputTokens: 800,
    model: 'test-model',
  }),
}));

const budgetState = { state: 'ok' as 'ok' | 'degrade' | 'blocked' };
vi.mock('@/lib/ai/funnel-cost', () => ({
  funnelBudgetState: async () => ({ state: budgetState.state }),
}));

const moderation = { isProhibited: false };
const aiModerateContent = vi.fn();
vi.mock('@/lib/ai/moderate', () => ({
  aiModerateContent: (input: unknown) => {
    aiModerateContent(input);
    return Promise.resolve({ isProhibited: moderation.isProhibited });
  },
}));

/** Enough prose, three named services and an email: nothing left to ask. */
const COMPLETE_ANSWERS = {
  businessName: 'Ionescu Dental',
  description:
    'A two-chair dental practice in Cluj that has been open for eleven years. ' +
    'We do cosmetic work, whitening and routine check-ups, mostly for families ' +
    'who have been coming to us since the practice opened. We are the only ' +
    'practice in the neighbourhood with evening appointments.',
  industry: 'Dentistry',
  targetAudience: 'Families in Cluj',
  goal: 'bookings',
  email: 'maria@example.com',
  services: ['Cosmetic work', 'Whitening', 'Routine check-ups'],
};

/** No prose, no services, no contact: three conversational gaps. */
const THIN_ANSWERS = {
  businessName: 'Ionescu Dental',
  description: 'A dental clinic.',
  industry: 'Dentistry',
  goal: 'bookings',
};

let ipCounter = 0;

function request(body: unknown, ip?: string): NextRequest {
  ipCounter += 1;
  return new NextRequest('http://localhost/api/discovery/intake-chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      // A fresh IP per case, so the shared rate limiter cannot make one test
      // depend on how many requests another one made.
      'x-forwarded-for': ip ?? `10.0.0.${ipCounter}`,
    },
  });
}

beforeEach(() => {
  interviewIntake.mockReset();
  recordLlmUsage.mockReset();
  aiModerateContent.mockReset();
  constructedWith.length = 0;
  budgetState.state = 'ok';
  moderation.isProhibited = false;
  process.env.PI_API_KEY = 'test-key';
  interviewIntake.mockResolvedValue({
    status: 'ask',
    question: 'What makes people pick you over the practice down the road?',
  });
});

describe('the gate decides what is asked', () => {
  it('asks nothing, and calls no model, when the intake is already complete', async () => {
    const response = await POST(request({ answers: COMPLETE_ANSWERS }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('complete');
    expect(body.question).toBeNull();
    expect(body.asks.conversational).toEqual([]);
    expect(interviewIntake).not.toHaveBeenCalled();
  });

  it('hands the model exactly the gate-found conversational gaps', async () => {
    const response = await POST(request({ answers: THIN_ANSWERS }));
    const body = await response.json();

    expect(body.status).toBe('ask');
    expect(body.question).toContain('practice down the road');

    expect(interviewIntake).toHaveBeenCalledTimes(1);
    const known = interviewIntake.mock.calls[0][0].known as {
      stillMissing: Array<{ code: string; weNeed: string }>;
    };
    // Exactly the gate's conversational codes, in the gate's order.
    expect(known.stillMissing.map((ask) => ask.code)).toEqual([
      'business_text_thin',
      'contact_signal_missing',
      'services_missing',
    ]);
    // The ask handed over is the gate's own wording, not the model's idea.
    expect(known.stillMissing[0].weNeed).toContain('in your own words');
  });

  it('never asks a chat window for a photograph or a logo', async () => {
    const response = await POST(request({ answers: THIN_ANSWERS }));
    const body = await response.json();

    // The gate found them — they are reported to the visitor as notes …
    expect(body.asks.assets).toContain('hero_image_missing');
    expect(body.asks.assets).toContain('logo_missing');
    // … but they are never handed to the interviewer.
    const known = interviewIntake.mock.calls[0][0].known as {
      stillMissing: Array<{ code: string }>;
    };
    expect(known.stillMissing.map((ask) => ask.code)).not.toContain(
      'hero_image_missing'
    );
  });

  it('stops asking once an answer has closed the gap', async () => {
    // The same thin form, but the visitor has since typed three paragraphs,
    // named their services and left a phone number.
    const response = await POST(
      request({
        answers: {
          ...THIN_ANSWERS,
          services: ['Whitening', 'Implants', 'Check-ups'],
          phone: '+40 722 111 222',
          intakeAnswers: [COMPLETE_ANSWERS.description],
        },
      })
    );
    const body = await response.json();

    expect(body.status).toBe('complete');
    expect(interviewIntake).not.toHaveBeenCalled();
  });
});

describe('extracted answers reach the wizard', () => {
  it('returns the client turns, services and phone, and they merge into the wizard data', async () => {
    interviewIntake.mockResolvedValue({
      status: 'complete',
      documents: [
        { topic: 'services', text: 'Whitening, implants, routine check-ups' },
        { topic: 'contact', text: 'Best number is 0722 111 222' },
      ],
    });

    const response = await POST(
      request({
        answers: THIN_ANSWERS,
        transcript: [
          { role: 'agent', text: 'What do you actually do day to day?' },
          {
            role: 'client',
            text: 'Whitening, implants and check-ups. Ring 0722 111 222.',
          },
        ],
      })
    );
    const body = await response.json();

    expect(body.status).toBe('complete');
    expect(body.extracted.answers).toEqual([
      'Whitening, implants and check-ups. Ring 0722 111 222.',
    ]);
    expect(body.extracted.services).toEqual([
      'Whitening',
      'implants',
      'routine check-ups',
    ]);
    expect(body.extracted.phone).toBe('0722 111 222');

    const merged = mergeExtractedAnswers(EMPTY_DISCOVERY, body.extracted);
    expect(merged.services).toEqual([
      'Whitening',
      'implants',
      'routine check-ups',
    ]);
    expect(merged.phone).toBe('0722 111 222');
    expect(merged.intakeAnswers).toHaveLength(1);
  });

  it('does not overwrite an answer the visitor typed into the form', async () => {
    const merged = mergeExtractedAnswers(
      { ...EMPTY_DISCOVERY, phone: '+40 700 000 000' },
      { answers: [], phone: '0722 111 222' }
    );
    expect(merged.phone).toBe('+40 700 000 000');
  });
});

describe('spend doors', () => {
  it('refuses a conversation with too many turns', async () => {
    const response = await POST(
      request({
        answers: THIN_ANSWERS,
        transcript: Array.from({ length: 13 }, (_, index) => ({
          role: index % 2 === 0 ? 'agent' : 'client',
          text: 'x',
        })),
      })
    );
    expect(response.status).toBe(400);
    expect(interviewIntake).not.toHaveBeenCalled();
  });

  it('refuses an oversized body', async () => {
    const response = await POST(
      request({
        answers: {
          ...THIN_ANSWERS,
          description: 'x'.repeat(5_000),
          intakeAnswers: Array.from({ length: 8 }, () => 'y'.repeat(1_000)),
        },
      })
    );
    expect(response.status).toBe(413);
    expect(interviewIntake).not.toHaveBeenCalled();
  });

  it('stops asking once the question cap is spent', async () => {
    const response = await POST(
      request({
        answers: THIN_ANSWERS,
        transcript: Array.from({ length: 8 }, (_, index) => ({
          role: index % 2 === 0 ? 'agent' : 'client',
          text: 'a turn',
        })),
      })
    );
    const body = await response.json();
    expect(body.status).toBe('complete');
    expect(body.questionsAsked).toBe(4);
    expect(interviewIntake).not.toHaveBeenCalled();
  });

  it('the funnel budget kill-switch blocks the call', async () => {
    budgetState.state = 'blocked';
    const response = await POST(request({ answers: THIN_ANSWERS }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('complete');
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe('budget');
    // The point of the switch: no tokens are spent while it is thrown.
    expect(interviewIntake).not.toHaveBeenCalled();
  });

  it('bows out rather than dead-ending when Pi is not configured', async () => {
    delete process.env.PI_API_KEY;
    const openRouter = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      const response = await POST(request({ answers: THIN_ANSWERS }));
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.skipped).toBe(true);
      expect(body.reason).toBe('unconfigured');
    } finally {
      if (openRouter) process.env.OPENROUTER_API_KEY = openRouter;
    }
  });

  it('rate-limits one IP', async () => {
    let last = 200;
    for (let attempt = 0; attempt < 14; attempt++) {
      const response = await POST(
        request({ answers: COMPLETE_ANSWERS }, '203.0.113.9')
      );
      last = response.status;
    }
    expect(last).toBe(429);
  });

  it('screens the visitor’s own words before they reach the model', async () => {
    moderation.isProhibited = true;
    const response = await POST(
      request({
        answers: THIN_ANSWERS,
        transcript: [
          { role: 'agent', text: 'What do you do?' },
          { role: 'client', text: 'adult chat with fans' },
        ],
      })
    );
    const body = await response.json();

    expect(aiModerateContent).toHaveBeenCalled();
    expect(interviewIntake).not.toHaveBeenCalled();
    expect(body.status).toBe('complete');
  });
});

describe('metering', () => {
  it('wires a usage sink into the Pi agents so anonymous turns are still on the ledger', async () => {
    await POST(request({ answers: THIN_ANSWERS }));
    const options = constructedWith[0] as {
      usageSink: (usage: unknown) => void;
      maxRunTokens: number;
      roles: { intake: unknown };
    };
    expect(options.maxRunTokens).toBe(8_000);
    expect(options.roles.intake).toBeTruthy();

    options.usageSink({
      action: 'intake_interview',
      model: 'test-model',
      tokensIn: 100,
      tokensOut: 20,
      cachedTokens: 0,
    });
    expect(recordLlmUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'intake_interview',
        workspaceId: null,
        projectId: null,
      })
    );
  });
});
