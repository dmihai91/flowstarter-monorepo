/**
 * The intake, as the visitor experiences it.
 *
 * The wizard is rendered whole rather than the conversation alone, because the
 * behaviours worth protecting are the ones that span both: the step the wizard
 * thinks it is on follows the question on screen, the draft it autosaves is
 * still a plain `DiscoveryData`, and the escape hatch really does reach the
 * preview.
 *
 * The preview and the info agent are stubbed — they talk to the network and
 * they are not what is under test here. No model is called anywhere in this
 * file, and the one `fetch` that survives (the recommendation refinement) is
 * answered with a refusal, which is the case the deterministic recommendation
 * is supposed to survive.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import en from '@/locales/en';
import type { DiscoveryData } from '../discovery.logic';
import { DiscoveryWizard } from '../DiscoveryWizard';

vi.mock('../steps/PreviewStep', () => ({
  PreviewStep: () => <div data-testid="preview-stub">preview</div>,
}));

vi.mock('../steps/InfoAgentStep', () => ({
  InfoAgentStep: () => <div data-testid="info-agent-stub">info agent</div>,
}));

const t = (key: string): string =>
  (en as unknown as Record<string, string>)[key] ?? key;

/** A prompt as the visitor sees it, with the tokens the agent fills in. */
const said = (key: string, values: Record<string, string> = {}): string =>
  t(key).replace(
    /\{(\w+)\}/g,
    (whole, token: string) => values[token] ?? whole
  );

const originalFetch = global.fetch;

function draft(): DiscoveryData | null {
  const raw = window.sessionStorage.getItem('fs-discovery-draft-v1');
  return raw ? (JSON.parse(raw) as { data: DiscoveryData }).data : null;
}

function renderWizard() {
  const onComplete = vi.fn();
  render(<DiscoveryWizard source="test" onComplete={onComplete} t={t} />);
  return { onComplete, user: userEvent.setup() };
}

type User = ReturnType<typeof userEvent.setup>;

/** Types an answer into the composer and sends it, the way a visitor would. */
async function say(user: User, text: string) {
  const composer = screen.getByLabelText(
    t('landing.discovery.chat.composerLabel')
  );
  await user.clear(composer);
  await user.type(composer, text);
  await user.click(
    screen.getByRole('button', { name: t('landing.discovery.chat.send') })
  );
}

/** Taps a quick reply. */
async function tap(user: User, label: string | RegExp) {
  await user.click(screen.getByRole('button', { name: label }));
}

beforeEach(() => {
  window.sessionStorage.clear();
  // The recommendation route is the only thing left that would reach out.
  global.fetch = vi.fn(async () => ({
    ok: false,
    json: async () => ({}),
  })) as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('the intake conversation', () => {
  it('opens as a conversation, not a form', async () => {
    renderWizard();

    expect(
      screen.getByText(t('landing.discovery.chat.intro'))
    ).toBeInTheDocument();
    expect(
      screen.getByText(t('landing.discovery.chat.q.fullName.prompt'))
    ).toBeInTheDocument();
    // One question on screen, not four labelled inputs.
    expect(
      screen.queryByText(t('landing.discovery.chat.q.email.prompt'))
    ).toBeNull();
    // And no Continue button competing with the composer.
    expect(
      screen.queryByRole('button', {
        name: t('landing.discovery.nav.continue'),
      })
    ).toBeNull();
  });

  it('asks one thing at a time and keeps every answer in the transcript', async () => {
    const { user } = renderWizard();

    await say(user, 'Maria Ionescu');
    expect(
      await screen.findByText(/Good to meet you, Maria/)
    ).toBeInTheDocument();

    await say(user, 'maria@example.com');
    await screen.findByText(t('landing.discovery.chat.q.businessName.prompt'));

    // Everything already said is still on screen, in order.
    const log = screen.getByRole('log');
    expect(within(log).getByText('Maria Ionescu')).toBeInTheDocument();
    expect(within(log).getByText('maria@example.com')).toBeInTheDocument();
    expect(draft()).toMatchObject({
      fullName: 'Maria Ionescu',
      email: 'maria@example.com',
    });
  });

  it('refuses a malformed required answer in the agent’s own words, and does not move on', async () => {
    const { user } = renderWizard();
    await say(user, 'Maria Ionescu');

    await say(user, 'maria at example dot com');
    expect(
      await screen.findByText(t('landing.discovery.chat.errors.email'))
    ).toBeInTheDocument();
    // Still on the same question, and nothing bad was written to the draft.
    expect(screen.getByText(/Good to meet you, Maria/)).toBeInTheDocument();
    expect(draft()?.email).toBe('');

    await say(user, 'maria@example.com');
    await screen.findByText(t('landing.discovery.chat.q.businessName.prompt'));
  });

  it('sends a tapped quick reply as a message, and files the value the preview reads', async () => {
    const { user } = renderWizard();
    await say(user, 'Maria Ionescu');
    await say(user, 'maria@example.com');
    await tap(user, t('landing.discovery.chat.skip')); // no business name yet
    await say(user, 'A boutique dental clinic in Cluj doing cosmetic work.');

    // The industry chips.
    await screen.findByText(t('landing.discovery.chat.q.industry.prompt'));
    await tap(user, 'Therapy & wellness');

    expect(draft()).toMatchObject({
      businessName: '',
      description: 'A boutique dental clinic in Cluj doing cosmetic work.',
      industry: 'Therapy & wellness',
    });
    const log = screen.getByRole('log');
    expect(within(log).getByText('Therapy & wellness')).toBeInTheDocument();
    // A skipped question says so rather than leaving a hole.
    expect(
      within(log).getByText(t('landing.discovery.chat.skipped'))
    ).toBeInTheDocument();
  });

  it('lets the visitor correct an earlier answer, rewriting it in place', async () => {
    const { user } = renderWizard();
    await say(user, 'Maria Ionescu');
    await say(user, 'maria@example.com');
    await screen.findByText(t('landing.discovery.chat.q.businessName.prompt'));

    await user.click(
      screen.getByRole('button', {
        name: `${t('landing.discovery.chat.edit')}: ${said(
          'landing.discovery.chat.q.email.prompt',
          { name: 'Maria' }
        )}`,
      })
    );
    // The old answer is waiting in the composer.
    const composer = screen.getByLabelText(
      t('landing.discovery.chat.composerLabel')
    );
    expect(composer).toHaveValue('maria@example.com');

    await say(user, 'maria@ionescudental.ro');

    const log = screen.getByRole('log');
    expect(within(log).getByText('maria@ionescudental.ro')).toBeInTheDocument();
    // Rewritten, not appended: there is one email in the transcript.
    expect(within(log).queryByText('maria@example.com')).toBeNull();
    expect(draft()?.email).toBe('maria@ionescudental.ro');
    // And the conversation picks up where it left off.
    expect(
      screen.getByText(t('landing.discovery.chat.q.businessName.prompt'))
    ).toBeInTheDocument();
  });

  it('undoes the last thing said when the visitor goes back', async () => {
    const { user } = renderWizard();
    await say(user, 'Maria Ionescu');
    await screen.findByText(/Good to meet you, Maria/);

    await user.click(
      screen.getByRole('button', { name: t('landing.discovery.nav.back') })
    );
    expect(
      await screen.findByText(t('landing.discovery.chat.q.fullName.prompt'))
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(t('landing.discovery.chat.composerLabel'))
    ).toHaveValue('Maria Ionescu');
  });
});

describe('the escape hatch', () => {
  it('is on screen from the first question', () => {
    renderWizard();
    expect(
      screen.getByRole('button', {
        name: t('landing.discovery.chat.skipRest'),
      })
    ).toBeEnabled();
  });

  it('drops everything optional and asks only what the wizard has always required', async () => {
    const { user } = renderWizard();

    await tap(user, t('landing.discovery.chat.skipRest'));

    expect(
      await screen.findByText(
        said('landing.discovery.chat.stillNeeded', { count: '5' })
      )
    ).toBeInTheDocument();

    await say(user, 'Maria Ionescu');
    await say(user, 'maria@example.com');
    // Straight past the business name, industry, audience and links.
    await screen.findByText(
      said('landing.discovery.chat.q.description.prompt', {
        business: 'your business',
      })
    );
    await say(user, 'A boutique dental clinic in Cluj doing cosmetic work.');

    // Goals: a multi-select, still one question.
    await screen.findByText(t('landing.discovery.chat.q.goal.prompt'));
    await tap(user, 'Take bookings or appointments');
    await tap(user, t('landing.discovery.chat.done'));

    await screen.findByText(t('landing.discovery.chat.q.commerceMode.prompt'));
    await tap(user, t('landing.discovery.options.commerce.none.label'));

    // Last required answer given: the preview, with no plan panels in between.
    expect(await screen.findByTestId('preview-stub')).toBeInTheDocument();
    // The build package fell back to the deterministic recommendation rather
    // than being left blank or guessed by a model.
    await waitFor(() =>
      expect(draft()).toMatchObject({
        goal: 'Take bookings or appointments',
        commerceMode: 'none',
        selectedTier: 'starter',
      })
    );
  });
});

describe('the commercial panels', () => {
  it('are the last two turns of the same conversation, and the wizard still gates them', async () => {
    const { user } = renderWizard();

    await say(user, 'Maria Ionescu');
    await say(user, 'maria@example.com');
    await say(user, 'Ionescu Dental');
    await say(user, 'A boutique dental clinic in Cluj doing cosmetic work.');
    await tap(user, 'Therapy & wellness');
    await tap(user, t('landing.discovery.chat.skip')); // audience
    await tap(user, t('landing.discovery.chat.skip')); // links
    await tap(user, 'Take bookings or appointments');
    await tap(user, t('landing.discovery.chat.done'));
    await tap(user, t('landing.discovery.chat.skip')); // tone
    await tap(user, t('landing.discovery.chat.skip')); // page count
    await tap(user, t('landing.discovery.chat.skip')); // timeline
    await tap(user, t('landing.discovery.options.commerce.none.label'));
    await tap(user, t('landing.discovery.chat.skip')); // cal.com booking link
    await tap(user, t('landing.discovery.chat.skip')); // integrations

    // The build package, introduced by the agent and shown as its own message.
    expect(
      await screen.findByText(t('landing.discovery.chat.q.selectedTier.prompt'))
    ).toBeInTheDocument();
    await waitFor(() => expect(draft()?.selectedTier).toBe('starter'));
    await tap(user, t('landing.discovery.chat.confirm'));

    // The monthly plan is a separate decision, and confirming is blocked until
    // one is picked — `canProceed` is still the gate, not the conversation.
    await screen.findByText(t('landing.discovery.chat.q.subscription.prompt'));
    expect(
      screen.getByRole('button', { name: t('landing.discovery.chat.confirm') })
    ).toBeDisabled();

    await tap(user, /Pro/);
    await tap(user, t('landing.discovery.chat.confirm'));

    // Conversation spent — the info agent takes over the same screen.
    expect(await screen.findByTestId('info-agent-stub')).toBeInTheDocument();
    expect(draft()).toMatchObject({
      selectedTier: 'starter',
      subscription: 'pro',
    });
  });
});
