/**
 * Carrying the info-agent conversation across the claim.
 *
 * The answers a visitor types into the funnel chat are the best evidence the
 * generator will ever get about their business — better than the form, because
 * they are prose in the client's own words. Before this they lived in browser
 * state and died there. These cases pin the two things that make them useful:
 *
 *   - they are stored where the generator already looks
 *     (`flowstarter_project_artifacts.client_reply_corpus`, the same column
 *     `messaging.ts` files client replies into), in the same
 *     `ScrapedTextDocument` shape, so nothing downstream has to learn a new
 *     case;
 *   - their `sourceId`s are stable, so an honesty pass can cite one and a
 *     retried claim cannot cite the same sentence twice.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
// Static imports: vi.mock is hoisted above them, and the app's tsconfig does
// not allow top-level await in tests.
import {
  INTAKE_CHAT_SOURCE_PREFIX,
  claimPreview,
  intakeChatCorpusDocuments,
} from '../claim';
import { createFakeSupabase } from './fake-supabase';

vi.mock('server-only', () => ({}));

const db = createFakeSupabase();
vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => db.client,
}));

const filed: Array<{ workspaceId: string; sourceId: string; text: string }> =
  [];
const corpus: { accepts: boolean } = { accepts: true };
vi.mock('../messaging', () => ({
  appendClientReplyToCorpus: async (
    workspaceId: string,
    document: { sourceId: string; text: string }
  ) => {
    if (!corpus.accepts) return false;
    filed.push({
      workspaceId,
      sourceId: document.sourceId,
      text: document.text,
    });
    return true;
  },
}));

vi.mock('../membership', () => ({
  ensureClientMembership: async () => ({ created: true }),
}));

vi.mock('../preview-artifacts', () => ({
  savePreviewArtifacts: async () => ({ advanced: true }),
}));

vi.mock('../intake-submission', () => ({
  recordIntakeSubmission: async () => ({ id: 'submission-1' }),
}));

const PREVIEW_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const CHAT = {
  transcript: [
    { role: 'agent' as const, text: 'What makes people choose you?' },
    { role: 'client' as const, text: 'We are the only practice open late.' },
  ],
  documents: [
    { topic: 'differentiator', text: 'We are the only practice open late.' },
    { topic: 'services', text: 'Whitening, implants, check-ups' },
  ],
  answers: ['We are the only practice open late.'],
  services: ['Whitening', 'Implants', 'Check-ups'],
  phone: '0722 111 222',
};

beforeEach(() => {
  db.reset();
  filed.length = 0;
  corpus.accepts = true;
});

describe('intakeChatCorpusDocuments', () => {
  it('files the client’s answers in the corpus shape the generator consumes', () => {
    const documents = intakeChatCorpusDocuments({
      previewId: PREVIEW_ID,
      chat: CHAT,
    });

    for (const document of documents) {
      expect(document.platform).toBe('intake');
      expect(document.kind).toBe('intake_answer');
      expect(
        document.sourceId.startsWith(`${INTAKE_CHAT_SOURCE_PREFIX}:`)
      ).toBe(true);
    }
    expect(documents.map((document) => document.sourceId)).toEqual([
      `intake_chat:${PREVIEW_ID}:differentiator`,
      `intake_chat:${PREVIEW_ID}:services`,
      `intake_chat:${PREVIEW_ID}:services-2`,
    ]);
  });

  it('never files a question we asked as something the business said', () => {
    const documents = intakeChatCorpusDocuments({
      previewId: PREVIEW_ID,
      chat: CHAT,
    });
    expect(
      documents.some((document) =>
        document.text.includes('What makes people choose you?')
      )
    ).toBe(false);
  });

  it('falls back to the raw answers when the interview never completed', () => {
    const documents = intakeChatCorpusDocuments({
      previewId: PREVIEW_ID,
      chat: { answers: ['Open late.', 'Family run since 2014.'] },
    });
    expect(documents.map((document) => document.sourceId)).toEqual([
      `intake_chat:${PREVIEW_ID}:answer-1`,
      `intake_chat:${PREVIEW_ID}:answer-2`,
    ]);
  });

  it('is stable across calls, so a retried claim cites nothing twice', () => {
    const first = intakeChatCorpusDocuments({
      previewId: PREVIEW_ID,
      chat: CHAT,
    });
    const second = intakeChatCorpusDocuments({
      previewId: PREVIEW_ID,
      chat: CHAT,
    });
    expect(second).toEqual(first);
  });

  it('files nothing at all for a skipped chat', () => {
    expect(
      intakeChatCorpusDocuments({ previewId: PREVIEW_ID, chat: {} })
    ).toEqual([]);
  });
});

describe('claimPreview', () => {
  it('files the conversation against the new workspace', async () => {
    const result = await claimPreview({
      previewId: PREVIEW_ID,
      clerkUserId: 'user_1',
      businessName: 'Ionescu Dental',
      tier: 'starter',
      intakeChat: CHAT,
    });

    expect(result.intakeChatDocuments).toBe(3);
    expect(filed.map((entry) => entry.sourceId)).toEqual([
      `intake_chat:${PREVIEW_ID}:differentiator`,
      `intake_chat:${PREVIEW_ID}:services`,
      `intake_chat:${PREVIEW_ID}:services-2`,
    ]);
    for (const entry of filed) {
      expect(entry.workspaceId).toBe(result.workspaceId);
    }
  });

  it('still claims the workspace when the evidence cannot be filed', async () => {
    // No artifacts row yet — `appendClientReplyToCorpus` declines rather than
    // inventing one. A lost citation must never cost the client the project.
    corpus.accepts = false;
    const result = await claimPreview({
      previewId: PREVIEW_ID,
      clerkUserId: 'user_1',
      intakeChat: CHAT,
    });

    expect(result.workspaceId).toBeTruthy();
    expect(result.intakeChatDocuments).toBe(0);
  });

  it('claims exactly as before when there was no conversation', async () => {
    const result = await claimPreview({
      previewId: PREVIEW_ID,
      clerkUserId: 'user_1',
    });
    expect(result.intakeChatDocuments).toBe(0);
    expect(filed).toEqual([]);
  });
});
