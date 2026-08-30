/**
 * The info-agent step.
 *
 * The behaviours worth protecting are the product decisions, not the markup:
 *
 *   - the visitor is told what is missing in plain words, from the gate;
 *   - the step is skippable at any moment, and skipping still leaves a wizard
 *     state the preview can be generated from;
 *   - name suggestions happen only when the visitor asks for them;
 *   - the visitor can see the agent working, because it takes seconds.
 *
 * `fetch` is stubbed throughout: no model is called, here or anywhere else in
 * this suite.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_DISCOVERY, type DiscoveryData } from '../discovery.logic';
import { describeWithIntakeAnswers } from '../intake-chat.shared';
import { InfoAgentStep } from '../steps/InfoAgentStep';
import { MISSING_MESSAGES } from '@/lib/flowstarter/sufficiency';

const originalFetch = global.fetch;

const THIN: DiscoveryData = {
  ...EMPTY_DISCOVERY,
  businessName: 'Ionescu Dental',
  description: 'A dental clinic.',
};

/** A live wizard: the component's `setData` really does update the state. */
function harness(initial: DiscoveryData = THIN) {
  const state = { data: initial };
  const onSkip = vi.fn();
  const setData = (updater: (previous: DiscoveryData) => DiscoveryData) => {
    state.data = updater(state.data);
  };
  return { state, onSkip, setData };
}

function reply(body: unknown, delayMs = 0) {
  return () =>
    new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            ok: true,
            json: async () => body,
          }),
        delayMs
      )
    );
}

const ASK = {
  status: 'ask',
  question: 'What makes people pick you over the practice down the road?',
  missing: [
    {
      code: 'business_text_thin',
      severity: 'blocking',
      message: MISSING_MESSAGES.business_text_thin,
      affects: ['hero'],
    },
    {
      code: 'hero_image_missing',
      severity: 'blocking',
      message: MISSING_MESSAGES.hero_image_missing,
      affects: ['hero'],
    },
  ],
  asks: {
    conversational: ['business_text_thin'],
    assets: ['hero_image_missing'],
  },
  extracted: { answers: [] },
  documents: [],
  questionsAsked: 0,
  maxQuestions: 4,
};

beforeEach(() => {
  global.fetch = vi.fn(reply(ASK)) as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('what the visitor sees', () => {
  it('names what is missing in plain words, never in gate codes', async () => {
    const { state, setData, onSkip } = harness();
    render(
      <InfoAgentStep data={state.data} setData={setData} onSkip={onSkip} />
    );

    // The gate's own wording, straight through.
    expect(
      await screen.findByText(/what makes someone choose you over the place/i)
    ).toBeInTheDocument();
    // And no raw identifiers anywhere on screen.
    expect(screen.queryByText(/business_text_thin/)).toBeNull();
    expect(screen.queryByText(/hero_image_missing/)).toBeNull();
  });

  it('says out loud that photos cannot be typed into a chat', async () => {
    const { state, setData, onSkip } = harness();
    render(
      <InfoAgentStep data={state.data} setData={setData} onSkip={onSkip} />
    );
    expect(
      await screen.findByText(/not something you can type/i)
    ).toBeInTheDocument();
  });

  it('shows the agent working while the model thinks', async () => {
    global.fetch = vi.fn(reply(ASK, 50)) as unknown as typeof fetch;
    const { state, setData, onSkip } = harness();
    render(
      <InfoAgentStep data={state.data} setData={setData} onSkip={onSkip} />
    );

    expect(await screen.findByRole('status')).toHaveTextContent(/thinking/i);
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    );
  });

  it('asks the question the endpoint returned', async () => {
    const { state, setData, onSkip } = harness();
    render(
      <InfoAgentStep data={state.data} setData={setData} onSkip={onSkip} />
    );
    await waitFor(() =>
      expect(state.data.intakeChat).toEqual([
        { role: 'agent', text: ASK.question },
      ])
    );
  });
});

describe('skipping', () => {
  it('is always available, and leaves a state the preview can be built from', async () => {
    const { state, setData, onSkip } = harness();
    render(
      <InfoAgentStep data={state.data} setData={setData} onSkip={onSkip} />
    );

    const skip = await screen.findByRole('button', {
      name: /skip and show me the preview/i,
    });
    await userEvent.click(skip);

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(state.data.intakeChatStatus).toBe('skipped');
    // The preview generator still has something to build from: the form.
    expect(describeWithIntakeAnswers(state.data)).toBe('A dental clinic.');
  });

  it('warns, in plain words, what a skip will leave placeholdered', async () => {
    const { state, setData, onSkip } = harness();
    render(
      <InfoAgentStep data={state.data} setData={setData} onSkip={onSkip} />
    );
    expect(
      await screen.findByText(/we will build the preview with placeholder/i)
    ).toBeInTheDocument();
  });
});

describe('answering', () => {
  it('merges the extracted answers back into the wizard data', async () => {
    const { state, setData, onSkip } = harness();
    const { rerender } = render(
      <InfoAgentStep data={state.data} setData={setData} onSkip={onSkip} />
    );
    await waitFor(() => expect(state.data.intakeChat).toHaveLength(1));

    global.fetch = vi.fn(
      reply({
        ...ASK,
        status: 'complete',
        question: null,
        documents: [{ topic: 'services', text: 'Whitening, implants' }],
        extracted: {
          answers: ['We are the only practice open late.'],
          services: ['Whitening', 'implants'],
        },
      })
    ) as unknown as typeof fetch;

    rerender(
      <InfoAgentStep data={state.data} setData={setData} onSkip={onSkip} />
    );
    await userEvent.type(
      screen.getByLabelText(/your answer/i),
      'We are the only practice open late.'
    );
    await userEvent.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => {
      expect(state.data.intakeAnswers).toEqual([
        'We are the only practice open late.',
      ]);
      expect(state.data.services).toEqual(['Whitening', 'implants']);
      expect(state.data.intakeChatDocuments).toEqual([
        { topic: 'services', text: 'Whitening, implants' },
      ]);
    });

    // And the answer reaches the generator on the very next screen.
    expect(describeWithIntakeAnswers(state.data)).toContain(
      'only practice open late'
    );
  });
});

describe('business names', () => {
  it('suggests nothing until the visitor asks', async () => {
    const { state, setData, onSkip } = harness();
    render(
      <InfoAgentStep data={state.data} setData={setData} onSkip={onSkip} />
    );
    await screen.findByRole('button', { name: /suggest a few names/i });

    const calls = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock
      .calls;
    expect(
      calls.some((call) => String(call[0]).includes('business-names'))
    ).toBe(false);
  });

  it('asks for them only on the visitor’s click, and never auto-fills one', async () => {
    const { state, setData, onSkip } = harness();
    render(
      <InfoAgentStep data={state.data} setData={setData} onSkip={onSkip} />
    );
    const button = await screen.findByRole('button', {
      name: /suggest a few names/i,
    });

    global.fetch = vi.fn(
      reply({
        names: [{ name: 'Evening Dental', rationale: 'Names the hours.' }],
      })
    ) as unknown as typeof fetch;
    await userEvent.click(button);

    const suggestion = await screen.findByText('Evening Dental');
    // Offered, not applied.
    expect(state.data.businessName).toBe('Ionescu Dental');
    await userEvent.click(suggestion);
    expect(state.data.businessName).toBe('Evening Dental');

    const body = JSON.parse(
      String(
        (
          (global.fetch as unknown as ReturnType<typeof vi.fn>).mock
            .calls[0][1] as RequestInit
        ).body
      )
    );
    expect(body.requested).toBe(true);
  });
});
