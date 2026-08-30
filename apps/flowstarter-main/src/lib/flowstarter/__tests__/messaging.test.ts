/**
 * The concierge conversation.
 *
 * The two behaviours worth protecting are the ones that are easy to get wrong
 * and expensive to discover late: a message must survive its email failing,
 * and a client's answer must come back as something the generator can cite.
 * Everything else here is guarding the direction and status bookkeeping that
 * the client UI reads.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
// Static imports: vi.mock is hoisted above them, and the app's tsconfig does
// not allow top-level await in tests.
import {
  MAX_MESSAGE_BODY_CHARS,
  MessagingError,
  buildAssetRequestBody,
  clientReplyToCorpusDocument,
  listProjectMessages,
  readClientReplyCorpus,
  recordClientReply,
  requestMissingAssets,
  sendProjectMessage,
} from '../messaging';
import { evaluateSufficiency } from '../sufficiency';
import { createFakeSupabase } from './fake-supabase';

vi.mock('server-only', () => ({}));

const db = createFakeSupabase();
vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => db.client,
}));

const emails: Array<{ to: string | string[]; subject: string; html: string }> =
  [];
const emailBehaviour: { mode: 'ok' | 'refused' | 'throws' } = { mode: 'ok' };
vi.mock('@/lib/email', () => ({
  sendEmail: async (options: {
    to: string | string[];
    subject: string;
    html: string;
  }) => {
    if (emailBehaviour.mode === 'throws') throw new Error('resend exploded');
    emails.push(options);
    return emailBehaviour.mode === 'ok'
      ? { success: true, id: 'email_1' }
      : { success: false, error: 'Domain not verified' };
  },
}));

const WORKSPACE = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const OTHER = '7c2a91b4-3d5e-4a17-9f88-1b2c3d4e5f60';

beforeEach(() => {
  db.reset();
  emails.length = 0;
  emailBehaviour.mode = 'ok';
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  db.seed('workspaces', [
    {
      id: WORKSPACE,
      name: 'Galway Physio',
      client_email: 'owner@galwayphysio.ie',
      client_name: 'Aoife Brennan',
      client_phone: null,
    },
    { id: OTHER, name: 'Other', client_email: 'other@example.com' },
  ]);
});

function messages(): Record<string, unknown>[] {
  return db.rows('project_messages');
}

describe('sendProjectMessage', () => {
  it('writes an outbound row and emails the client', async () => {
    const result = await sendProjectMessage({
      workspaceId: WORKSPACE,
      kind: 'clarification',
      body: 'Do you still take same-day appointments?',
      createdBy: 'user_operator',
    });

    expect(result.emailed).toBe(true);
    expect(messages()).toHaveLength(1);
    expect(messages()[0]).toMatchObject({
      workspace_id: WORKSPACE,
      direction: 'outbound',
      kind: 'clarification',
      status: 'sent',
      created_by: 'user_operator',
    });
    expect(emails[0]?.to).toBe('owner@galwayphysio.ie');
    // The deep link is how a client answers on-platform instead of by email.
    expect(emails[0]?.html).toContain(`/dashboard/projects/${WORKSPACE}`);
  });

  it('records an event naming the ask codes', async () => {
    await sendProjectMessage({
      workspaceId: WORKSPACE,
      kind: 'asset_request',
      body: 'We need a photo.',
      asks: [
        {
          code: 'hero_image_missing',
          severity: 'blocking',
          message: 'One wide landscape photo…',
          affects: ['hero'],
        },
      ],
    });
    expect(db.rows('project_events')[0]).toMatchObject({
      workspace_id: WORKSPACE,
      kind: 'project_message_sent',
      actor: 'system',
    });
    expect(
      (db.rows('project_events')[0]?.payload as { ask_codes: string[] })
        .ask_codes
    ).toEqual(['hero_image_missing']);
  });

  it('keeps the message when Resend refuses it', async () => {
    emailBehaviour.mode = 'refused';
    const result = await sendProjectMessage({
      workspaceId: WORKSPACE,
      kind: 'reminder',
      body: 'Still waiting on those photos.',
    });

    // The thread is the source of truth; the email is a rendering of it.
    expect(messages()).toHaveLength(1);
    expect(result.emailed).toBe(false);
    expect(result.emailError).toBe('Domain not verified');
    expect(
      (db.rows('project_events')[0]?.payload as { email_failed: boolean })
        .email_failed
    ).toBe(true);
  });

  it('keeps the message when the email transport throws', async () => {
    emailBehaviour.mode = 'throws';
    const result = await sendProjectMessage({
      workspaceId: WORKSPACE,
      kind: 'reminder',
      body: 'Still waiting on those photos.',
    });
    expect(messages()).toHaveLength(1);
    expect(result.emailed).toBe(false);
  });

  it('keeps the message when the workspace has no client address', async () => {
    db.rows('workspaces')[0].client_email = null;
    const result = await sendProjectMessage({
      workspaceId: WORKSPACE,
      kind: 'clarification',
      body: 'Which of these two logos is current?',
    });
    expect(messages()).toHaveLength(1);
    expect(result.emailed).toBe(false);
    expect(emails).toHaveLength(0);
  });

  it('survives the audit trail being unavailable', async () => {
    db.failing.add('project_events');
    const result = await sendProjectMessage({
      workspaceId: WORKSPACE,
      kind: 'clarification',
      body: 'Which of these two logos is current?',
    });
    expect(result.emailed).toBe(true);
    expect(messages()).toHaveLength(1);
  });

  it('refuses an unknown workspace, an empty body, and an oversized one', async () => {
    await expect(
      sendProjectMessage({
        workspaceId: '11111111-1111-4111-8111-111111111111',
        kind: 'clarification',
        body: 'hello',
      })
    ).rejects.toBeInstanceOf(MessagingError);

    await expect(
      sendProjectMessage({
        workspaceId: WORKSPACE,
        kind: 'clarification',
        body: '   ',
      })
    ).rejects.toBeInstanceOf(MessagingError);

    await expect(
      sendProjectMessage({
        workspaceId: WORKSPACE,
        kind: 'clarification',
        body: 'x'.repeat(MAX_MESSAGE_BODY_CHARS + 1),
      })
    ).rejects.toBeInstanceOf(MessagingError);
  });
});

describe('requestMissingAssets', () => {
  it('turns the gate output into exactly one asset request', async () => {
    const { missing } = evaluateSufficiency({});
    const result = await requestMissingAssets({
      workspaceId: WORKSPACE,
      missing,
      createdBy: 'user_operator',
    });

    expect(result.sent).toBe(true);
    expect(messages()).toHaveLength(1);
    expect(messages()[0]).toMatchObject({ kind: 'asset_request' });
    const asks = messages()[0].asks as Array<{ code: string }>;
    expect(asks.map((ask) => ask.code)).toEqual([
      'business_text_thin',
      'contact_signal_missing',
      'hero_image_missing',
      'services_missing',
      'logo_missing',
      'section_images_missing',
    ]);
  });

  it('produces the same copy for the same gap, every time', async () => {
    const { missing } = evaluateSufficiency({});
    const first = buildAssetRequestBody(missing);
    const second = buildAssetRequestBody([...missing].reverse());
    // Ordering the caller happened to hand us must not change the ask.
    expect(first).toBe(second);
    expect(first).toContain('at least 1600 pixels across');
    expect(first).not.toContain('send us photos');
  });

  it('sends nothing when the gate found nothing', async () => {
    const result = await requestMissingAssets({
      workspaceId: WORKSPACE,
      missing: [],
    });
    expect(result).toEqual({ sent: false, reason: 'nothing_missing' });
    expect(messages()).toHaveLength(0);
  });
});

describe('recordClientReply', () => {
  beforeEach(() => {
    db.seed('flowstarter_project_artifacts', [
      { workspace_id: WORKSPACE, client_reply_corpus: [] },
    ]);
  });

  async function twoOpenAsks() {
    await sendProjectMessage({
      workspaceId: WORKSPACE,
      kind: 'asset_request',
      body: 'First ask.',
    });
    await sendProjectMessage({
      workspaceId: WORKSPACE,
      kind: 'clarification',
      body: 'Second ask.',
    });
  }

  it('closes the newest open ask and leaves the older one alone', async () => {
    await twoOpenAsks();
    const newest = messages()[1].id as string;

    const result = await recordClientReply({
      workspaceId: WORKSPACE,
      body: 'We have been trading since 2009 and we do not do commercial work.',
      clerkUserId: 'user_client',
    });

    expect(result.answeredMessageId).toBe(newest);
    expect(messages()[0]).toMatchObject({ status: 'sent' });
    expect(messages()[1]).toMatchObject({ status: 'answered' });
  });

  it('forces the row inbound and attributes it to the caller', async () => {
    const result = await recordClientReply({
      workspaceId: WORKSPACE,
      body: 'Here is the logo.',
      clerkUserId: 'user_client',
    });
    const row = messages().find((message) => message.id === result.messageId);
    expect(row).toMatchObject({
      direction: 'inbound',
      kind: 'client_reply',
      created_by: 'user_client',
      // Nobody is waiting on a reply, so it is never an open thread item.
      status: 'answered',
    });
    expect(result.answeredMessageId).toBeNull();
  });

  it('files the reply as citable corpus evidence with a stable sourceId', async () => {
    const result = await recordClientReply({
      workspaceId: WORKSPACE,
      body: '  We have been trading since 2009.  ',
      clerkUserId: 'user_client',
    });

    expect(result.persistedToCorpus).toBe(true);
    expect(result.document).toMatchObject({
      sourceId: `client_reply:${result.messageId}`,
      platform: 'intake',
      kind: 'intake_answer',
      text: 'We have been trading since 2009.',
    });

    const corpus = await readClientReplyCorpus(WORKSPACE);
    expect(corpus.map((doc) => doc.sourceId)).toEqual([
      `client_reply:${result.messageId}`,
    ]);
  });

  it('appends rather than replaces, and never cites the same reply twice', async () => {
    const first = await recordClientReply({
      workspaceId: WORKSPACE,
      body: 'We opened in 2009.',
      clerkUserId: 'user_client',
    });
    const second = await recordClientReply({
      workspaceId: WORKSPACE,
      body: 'We do not do commercial work.',
      clerkUserId: 'user_client',
    });

    const corpus = await readClientReplyCorpus(WORKSPACE);
    expect(corpus.map((doc) => doc.sourceId)).toEqual([
      `client_reply:${first.messageId}`,
      `client_reply:${second.messageId}`,
    ]);

    // A retried write must not double-count the evidence.
    const { appendClientReplyToCorpus } = await import('../messaging');
    await appendClientReplyToCorpus(
      WORKSPACE,
      clientReplyToCorpusDocument({ messageId: first.messageId, body: 'x' })
    );
    expect(await readClientReplyCorpus(WORKSPACE)).toHaveLength(2);
  });

  it('still records the reply when there is no artifacts row to attach it to', async () => {
    db.rows('flowstarter_project_artifacts').length = 0;
    const result = await recordClientReply({
      workspaceId: WORKSPACE,
      body: 'Photos attached.',
      clerkUserId: 'user_client',
    });
    expect(result.persistedToCorpus).toBe(false);
    expect(messages()).toHaveLength(1);
  });

  it('refuses an unattributed reply', async () => {
    await expect(
      recordClientReply({ workspaceId: WORKSPACE, body: 'hi', clerkUserId: '' })
    ).rejects.toBeInstanceOf(MessagingError);
  });
});

describe('listProjectMessages', () => {
  it('returns one workspace’s thread, oldest first', async () => {
    await sendProjectMessage({
      workspaceId: WORKSPACE,
      kind: 'asset_request',
      body: 'First.',
    });
    await sendProjectMessage({
      workspaceId: OTHER,
      kind: 'reminder',
      body: 'Theirs.',
    });
    await sendProjectMessage({
      workspaceId: WORKSPACE,
      kind: 'reminder',
      body: 'Second.',
    });

    const thread = await listProjectMessages(WORKSPACE);
    expect(thread.map((message) => message.body)).toEqual([
      'First.',
      'Second.',
    ]);
    expect(thread.every((message) => message.workspaceId === WORKSPACE)).toBe(
      true
    );
  });

  it('rejects a malformed workspace id before it reaches a query', async () => {
    await expect(listProjectMessages("' OR 1=1 --")).rejects.toBeInstanceOf(
      MessagingError
    );
  });
});
