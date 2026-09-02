/**
 * The intake conversation's rules.
 *
 * This is the file that decides what the agent asks, in what order, what it
 * will accept, and when it stops asking. None of that is allowed to become a
 * model's opinion, so the whole of it is tested without rendering anything and
 * without a network in sight.
 *
 * The invariant worth naming: the script's `required` questions must line up
 * exactly with `canProceed`. If they drift, the conversation either walks past
 * a step the wizard would have blocked (and the preview is built from nothing)
 * or blocks on something the old form let through (and the funnel loses people
 * for no reason).
 */
import { describe, expect, it } from 'vitest';
import en from '@/locales/en';
import {
  type DiscoveryData,
  type Step,
  EMPTY_DISCOVERY,
  canProceed,
} from '../discovery.logic';
import {
  CONVERSATION_LAST_STEP,
  INTAKE_SCRIPT,
  answerText,
  answeredQuestions,
  applicableQuestions,
  conversationProgress,
  essentialRemaining,
  interpolate,
  matchOption,
  nextQuestion,
  promptText,
  questionById,
  stepForConversation,
} from '../intake-script';

const t = (key: string): string =>
  (en as unknown as Record<string, string>)[key] ?? key;

/** Answers a question the way the component would, and hands back both halves. */
function answer(
  data: DiscoveryData,
  answered: string[],
  id: string,
  raw: string
): { data: DiscoveryData; answered: string[] } {
  const question = questionById(id);
  if (!question) throw new Error(`no such question: ${id}`);
  return {
    data: question.apply(data, raw),
    answered: answered.includes(id) ? answered : [...answered, id],
  };
}

/** Walks the whole script, answering everything, collecting the order asked. */
function walk(
  answers: Record<string, string>,
  start: DiscoveryData = EMPTY_DISCOVERY
): { data: DiscoveryData; asked: string[]; steps: Step[] } {
  let data = start;
  let answered: string[] = [];
  const asked: string[] = [];
  const steps: Step[] = [];
  for (let guard = 0; guard < INTAKE_SCRIPT.length + 2; guard += 1) {
    const question = nextQuestion(data, answered);
    if (!question) break;
    asked.push(question.id);
    steps.push(question.step);
    const applied = answer(
      data,
      answered,
      question.id,
      answers[question.id] ?? ''
    );
    data = applied.data;
    answered = applied.answered;
  }
  return { data, asked, steps };
}

const FULL_ANSWERS: Record<string, string> = {
  fullName: 'Maria Ionescu',
  email: 'maria@example.com',
  businessName: 'Ionescu Dental',
  description: 'A boutique dental clinic in Cluj doing cosmetic work.',
  industry: 'Therapy & wellness',
  targetAudience: 'Adults in Cluj who avoided the dentist for a decade.',
  links: 'instagram.com/ionescudental',
  goal: 'Take bookings or appointments',
  brandTone: 'Calm, Trustworthy',
  pageCount: '5-7',
  timeline: 'asap',
  commerceMode: 'none',
  calComUrl: 'https://cal.com/ionescu-dental/intro',
  customIntegrations: 'Mailchimp for newsletters',
  selectedTier: 'starter',
  subscription: 'pro',
};

describe('the script itself', () => {
  it('asks one question at a time, in a fixed order, across steps 1 to 6', () => {
    const { asked, steps } = walk(FULL_ANSWERS);

    expect(asked).toEqual([
      'fullName',
      'email',
      'businessName',
      'description',
      'industry',
      'targetAudience',
      'links',
      'goal',
      'brandTone',
      'pageCount',
      'timeline',
      'commerceMode',
      // no catalogSize: this business sells nothing
      'calComUrl',
      'customIntegrations',
      'selectedTier',
      'subscription',
    ]);
    // Never goes backwards, and never past the conversation's last step.
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(Math.max(...steps)).toBe(CONVERSATION_LAST_STEP);
  });

  it('is over — and only then — when every applicable question is answered', () => {
    const { data, asked } = walk(FULL_ANSWERS);
    expect(nextQuestion(data, asked)).toBeNull();
    expect(nextQuestion(data, asked.slice(0, -1))).not.toBeNull();
  });

  it('hands the wizard on to the info agent when it runs out of questions', () => {
    const { data, asked } = walk(FULL_ANSWERS);
    expect(stepForConversation(data, [], 7)).toBe(1);
    expect(stepForConversation(data, asked, 7)).toBe(7);
  });

  it('every question it can ask has copy in the catalogue', () => {
    INTAKE_SCRIPT.forEach((question) => {
      expect(t(question.promptKey)).not.toBe(question.promptKey);
      if (question.placeholderKey) {
        expect(t(question.placeholderKey)).not.toBe(question.placeholderKey);
      }
      (question.options ?? []).forEach((option) => {
        if (option.labelKey)
          expect(t(option.labelKey)).not.toBe(option.labelKey);
      });
    });
  });
});

describe('the required-answer gate', () => {
  it("matches canProceed exactly — the conversation cannot outrun the wizard's own gate", () => {
    let data = EMPTY_DISCOVERY;
    let answered: string[] = [];

    for (let guard = 0; guard < INTAKE_SCRIPT.length + 2; guard += 1) {
      const question = nextQuestion(data, answered);
      if (!question) break;
      const leaving = question.step;
      const applied = answer(
        data,
        answered,
        question.id,
        FULL_ANSWERS[question.id] ?? ''
      );
      data = applied.data;
      answered = applied.answered;
      const arriving = nextQuestion(data, answered)?.step ?? 7;
      // The moment the conversation leaves a step behind, that step must be
      // one the wizard would have let the visitor walk past.
      if (arriving > leaving) expect(canProceed(leaving, data)).toBe(true);
    }
  });

  it('will not accept an empty or malformed answer to a required question', () => {
    expect(questionById('fullName')?.validate?.('M')).toBe(
      'landing.discovery.chat.errors.fullName'
    );
    expect(questionById('fullName')?.validate?.('Maria')).toBeNull();
    expect(questionById('email')?.validate?.('maria at example')).toBe(
      'landing.discovery.chat.errors.email'
    );
    expect(questionById('email')?.validate?.('maria@example.com')).toBeNull();
    expect(questionById('description')?.validate?.('dentist')).toBe(
      'landing.discovery.chat.errors.description'
    );
    expect(
      questionById('description')?.validate?.('A dental clinic in Cluj.')
    ).toBeNull();
  });

  it('treats the two commercial panels as skippable, and the five form answers as not', () => {
    expect(essentialRemaining(EMPTY_DISCOVERY, []).map((q) => q.id)).toEqual([
      'fullName',
      'email',
      'description',
      'goal',
      'commerceMode',
    ]);
  });

  it('asks a visitor who skipped ahead nothing but the essentials, in the same order', () => {
    let data = EMPTY_DISCOVERY;
    let answered: string[] = [];
    const asked: string[] = [];
    for (let guard = 0; guard < INTAKE_SCRIPT.length + 2; guard += 1) {
      const question = nextQuestion(data, answered, true);
      if (!question) break;
      asked.push(question.id);
      const applied = answer(
        data,
        answered,
        question.id,
        FULL_ANSWERS[question.id] ?? ''
      );
      data = applied.data;
      answered = applied.answered;
    }
    expect(asked).toEqual([
      'fullName',
      'email',
      'description',
      'goal',
      'commerceMode',
    ]);
    // Never re-opens: a question that only became relevant along the way (a
    // catalog size, after they said they sell physical products) stays shut.
    const selling = questionById('commerceMode')!.apply(data, 'physical');
    expect(nextQuestion(selling, answered, true)).toBeNull();
    expect(nextQuestion(selling, answered, false)?.id).toBe('businessName');
  });

  it('counts progress against the essentials once the visitor has skipped ahead', () => {
    expect(conversationProgress(EMPTY_DISCOVERY, [], true).total).toBe(5);
    expect(conversationProgress(EMPTY_DISCOVERY, [], false).total).toBe(
      INTAKE_SCRIPT.length - 1
    );
  });
});

describe('answers landing in DiscoveryData', () => {
  it('keeps the DiscoveryData shape the preview already reads', () => {
    const { data } = walk(FULL_ANSWERS);
    expect(data).toMatchObject({
      fullName: 'Maria Ionescu',
      email: 'maria@example.com',
      businessName: 'Ionescu Dental',
      industry: 'Therapy & wellness',
      goal: 'Take bookings or appointments',
      brandTone: 'Calm, Trustworthy',
      pageCount: '5-7',
      timeline: 'asap',
      commerceMode: 'none',
      catalogSize: 'na',
      calComUrl: 'https://cal.com/ionescu-dental/intro',
      customIntegrations: 'Mailchimp for newsletters',
    });
    expect(Object.keys(data).sort()).toEqual(
      Object.keys(EMPTY_DISCOVERY).sort()
    );
  });

  it('matches a typed answer to a chip, however it was capitalised', () => {
    const commerce = questionById('commerceMode');
    expect(matchOption(commerce?.options, 'digital products')).toBe('digital');
    expect(matchOption(commerce?.options, '  Physical Products ')).toBe(
      'physical'
    );
    expect(matchOption(commerce?.options, 'whatever')).toBeNull();
    expect(commerce?.validate?.('whatever')).toBe(
      'landing.discovery.chat.errors.choice'
    );
  });

  it('takes an industry the chips do not cover, verbatim', () => {
    const industry = questionById('industry');
    expect(industry?.apply(EMPTY_DISCOVERY, 'Falconry').industry).toBe(
      'Falconry'
    );
    expect(industry?.validate).toBeUndefined();
  });

  it('pulls both profile links out of one answer', () => {
    const links = questionById('links');
    const data = links?.apply(
      EMPTY_DISCOVERY,
      'here you go: instagram.com/ionescudental and https://www.linkedin.com/company/ionescu'
    );
    expect(data?.instagramUrl).toBe('https://instagram.com/ionescudental');
    expect(data?.linkedinUrl).toBe('https://www.linkedin.com/company/ionescu');
  });

  it('asks about catalog size only of a business that sells, and clears it when they stop', () => {
    const commerce = questionById('commerceMode');
    const selling = commerce?.apply(EMPTY_DISCOVERY, 'physical');
    expect(selling?.catalogSize).toBe('1-5');
    expect(
      applicableQuestions(selling as DiscoveryData).map((q) => q.id)
    ).toContain('catalogSize');

    const sized = questionById('catalogSize')?.apply(
      selling as DiscoveryData,
      '26-100'
    );
    expect(sized?.catalogSize).toBe('26-100');

    // Changed their mind: the catalog size goes with it, and the question
    // leaves the transcript rather than lingering as a wrong answer.
    const reversed = commerce?.apply(sized as DiscoveryData, 'none');
    expect(reversed?.catalogSize).toBe('na');
    expect(
      applicableQuestions(reversed as DiscoveryData).map((q) => q.id)
    ).not.toContain('catalogSize');
    expect(
      answeredQuestions(reversed as DiscoveryData, [
        'commerceMode',
        'catalogSize',
      ]).map((q) => q.id)
    ).toEqual(['commerceMode']);
  });
});

describe('what the visitor sees', () => {
  it('says their own name back to them, without asking a model to', () => {
    const data: DiscoveryData = {
      ...EMPTY_DISCOVERY,
      fullName: 'Maria Ionescu',
      businessName: 'Ionescu Dental',
    };
    expect(promptText(questionById('email')!, data, t)).toContain('Maria');
    expect(promptText(questionById('email')!, data, t)).not.toContain(
      'Ionescu D'
    );
    expect(promptText(questionById('description')!, data, t)).toContain(
      'Ionescu Dental'
    );
    // Nothing typed yet: a stand-in, never a raw {token}.
    const blank = promptText(questionById('description')!, EMPTY_DISCOVERY, t);
    expect(blank).toContain('your business');
    expect(blank).not.toContain('{');
  });

  it('leaves an unknown token alone rather than printing "undefined"', () => {
    expect(interpolate('a {known} and a {mystery}', { known: 'cat' })).toBe(
      'a cat and a {mystery}'
    );
  });

  it("draws the visitor's bubble from the catalogue's words, not the stored code", () => {
    const data: DiscoveryData = {
      ...EMPTY_DISCOVERY,
      commerceMode: 'few-services',
      selectedTier: 'commerce',
    };
    expect(answerText(questionById('commerceMode')!, data, t)).toBe(
      'A few paid offers'
    );
    // A Commerce build has no plan to choose — it has the store plan.
    expect(answerText(questionById('subscription')!, data, t)).toBe('Commerce');
    // A skipped question has no bubble text; the caller says "skipped".
    expect(answerText(questionById('brandTone')!, EMPTY_DISCOVERY, t)).toBe('');
  });

  it('counts progress over the questions this visitor is actually asked', () => {
    const start = conversationProgress(EMPTY_DISCOVERY, []);
    expect(start.done).toBe(0);
    expect(start.total).toBe(INTAKE_SCRIPT.length - 1); // no catalogSize yet

    const { data, asked } = walk(FULL_ANSWERS);
    const end = conversationProgress(data, asked);
    expect(end.done).toBe(end.total);
  });
});
