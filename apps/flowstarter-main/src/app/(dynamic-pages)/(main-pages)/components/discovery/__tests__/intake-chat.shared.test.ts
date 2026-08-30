/**
 * The deterministic half of the info agent.
 *
 * Everything here runs identically in the browser and on the server, which is
 * the point: the checklist a visitor reads and the asks the model is given are
 * produced by the same functions over the same gate output, so they cannot
 * drift apart. No model is involved in any of it.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_DISCOVERY } from '../discovery.logic';
import {
  CONVERSATIONAL_GAP_CODES,
  GAP_LABELS,
  assetGaps,
  claimIntakeChatPayload,
  conversationalGaps,
  describeWithIntakeAnswers,
  extractIntakeAnswers,
  gapsForDiscovery,
  mergeExtractedAnswers,
  placeholderedIfSkipped,
} from '../intake-chat.shared';
import { MISSING_MESSAGES } from '@/lib/flowstarter/sufficiency';

const THIN = {
  ...EMPTY_DISCOVERY,
  businessName: 'Ionescu Dental',
  description: 'A dental clinic.',
};

const ANSWERED = {
  ...THIN,
  email: 'maria@example.com',
  services: ['Whitening', 'Implants', 'Check-ups'],
  intakeAnswers: [
    'We have been on the same street for eleven years and most of our ' +
      'patients came to us because a neighbour sent them. We are the only ' +
      'practice around here open in the evening, which is the whole reason ' +
      'families pick us over the clinic on the main road.',
  ],
};

describe('what the visitor is shown', () => {
  it('reports the gate’s own wording, never its codes', () => {
    const gaps = gapsForDiscovery(THIN);
    const text = gaps.find((gap) => gap.code === 'business_text_thin');
    expect(text?.message).toBe(MISSING_MESSAGES.business_text_thin);
    // Every code the gate can emit has a short human label for the checklist.
    for (const gap of gaps) expect(GAP_LABELS[gap.code]).toBeTruthy();
  });

  it('splits the gaps a conversation can close from the ones it cannot', () => {
    const gaps = gapsForDiscovery(THIN);
    expect(conversationalGaps(gaps).map((gap) => gap.code)).toEqual([
      'business_text_thin',
      'contact_signal_missing',
      'services_missing',
    ]);
    // Photos and logos are shown as notes; nobody uploads a 1600px hero into
    // a chat window.
    expect(assetGaps(gaps).map((gap) => gap.code)).toContain(
      'hero_image_missing'
    );
    for (const gap of assetGaps(gaps)) {
      expect(CONVERSATIONAL_GAP_CODES).not.toContain(gap.code);
    }
  });

  it('closes the conversational gaps once the chat has answers', () => {
    expect(conversationalGaps(gapsForDiscovery(ANSWERED))).toEqual([]);
    // The image gaps remain — honestly, since nothing has been uploaded — and
    // they are exactly what a skip leaves placeholdered.
    expect(
      placeholderedIfSkipped(gapsForDiscovery(ANSWERED)).map((gap) => gap.code)
    ).toEqual(['hero_image_missing']);
  });
});

describe('extraction', () => {
  it('takes answers from the client’s turns and never from the agent’s', () => {
    const extracted = extractIntakeAnswers({
      transcript: [
        { role: 'agent', text: 'What makes people choose you?' },
        { role: 'client', text: 'We are open in the evenings.' },
      ],
    });
    expect(extracted.answers).toEqual(['We are open in the evenings.']);
  });

  it('reads services and a phone number out of the filed documents', () => {
    const extracted = extractIntakeAnswers({
      transcript: [{ role: 'client', text: 'see below' }],
      documents: [
        { topic: 'services', text: 'Whitening; implants; check-ups' },
        { topic: 'contact', text: 'Ring 0722 111 222 any weekday' },
      ],
    });
    expect(extracted.services).toEqual(['Whitening', 'implants', 'check-ups']);
    expect(extracted.phone).toBe('0722 111 222');
  });

  it('is idempotent: re-reading the same transcript adds nothing', () => {
    const transcript = [
      { role: 'client' as const, text: 'Whitening, implants' },
    ];
    const documents = [{ topic: 'services', text: 'Whitening, implants' }];
    const once = extractIntakeAnswers({ transcript, documents });
    const twice = extractIntakeAnswers({ transcript, documents });
    expect(twice).toEqual(once);
    expect(once.services).toEqual(['Whitening', 'implants']);
  });

  it('leaves a form answer alone and only fills holes', () => {
    const merged = mergeExtractedAnswers(
      { ...THIN, phone: '+40 700 000 000', services: ['Existing'] },
      { answers: ['a'], phone: '0722 111 222', services: ['Whitening'] }
    );
    expect(merged.phone).toBe('+40 700 000 000');
    // Services the chat named are richer than the form's, so they win — the
    // form has no services field at all.
    expect(merged.services).toEqual(['Whitening']);
  });
});

describe('reaching the generator', () => {
  it('folds the chat answers into the description the preview is built from', () => {
    const description = describeWithIntakeAnswers(ANSWERED);
    expect(description).toContain('A dental clinic.');
    expect(description).toContain('What they sell, in their words');
    expect(description).toContain('Whitening');
    expect(description).toContain('open in the evening');
    expect(description.length).toBeLessThanOrEqual(5_000);
  });

  it('sends nothing to the claim when the visitor never spoke', () => {
    expect(claimIntakeChatPayload(EMPTY_DISCOVERY)).toBeUndefined();
  });

  it('carries the transcript, documents and answers to the claim', () => {
    const payload = claimIntakeChatPayload({
      ...ANSWERED,
      intakeChat: [
        { role: 'agent', text: 'What makes people choose you?' },
        { role: 'client', text: 'Evening appointments.' },
      ],
      intakeChatDocuments: [
        { topic: 'differentiator', text: 'Evening appointments.' },
      ],
    });
    expect(payload?.transcript).toHaveLength(2);
    expect(payload?.documents).toHaveLength(1);
    expect(payload?.answers).toHaveLength(1);
    expect(payload?.services).toEqual(['Whitening', 'Implants', 'Check-ups']);
  });
});

describe('skipping', () => {
  it('a skipped chat still produces a description the preview can be built from', () => {
    const skipped = { ...THIN, intakeChatStatus: 'skipped' as const };
    // Nothing was answered, so the description is exactly the form's — which
    // is enough: the preview is generated either way.
    expect(describeWithIntakeAnswers(skipped)).toBe('A dental clinic.');
    // And the blocking gaps left behind are the ones the UI names as
    // placeholdered, rather than a reason to stop.
    expect(
      placeholderedIfSkipped(gapsForDiscovery(skipped)).map((gap) => gap.code)
    ).toEqual([
      'hero_image_missing',
      'business_text_thin',
      'contact_signal_missing',
      'services_missing',
    ]);
  });
});
