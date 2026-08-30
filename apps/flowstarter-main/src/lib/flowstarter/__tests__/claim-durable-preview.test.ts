/**
 * The claim, on an instance that never saw the preview.
 *
 * The funnel used to keep a generated preview in one process-local Map. That
 * made the conversion a coin flip the moment there was more than one worker:
 * the visitor who generated on instance A and signed in against instance B got
 * a workspace with no artifacts behind it — an owned project that can take a
 * deposit and has nothing to build from — and a restart between "look at this"
 * and "make it mine" did exactly the same.
 *
 * These cases run the claim with the in-process cache EMPTY, which is the
 * fresh-process case, and pin the two rules that make the durable record
 * trustworthy:
 *
 *   - a preview persisted by one process is claimable by another;
 *   - an EXPIRED preview is not. Its hosted site has been (or is about to be)
 *     torn down, so handing its manifest to a claim would mint a workspace
 *     pointing at a site that no longer exists.
 *
 * Static imports: vi.mock is hoisted above them, and the app's tsconfig does
 * not allow top-level await in tests.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeHostingSupabase } from '@/lib/hosting/__tests__/fake-hosting-supabase';

vi.mock('server-only', () => ({}));

const db = createFakeHostingSupabase();
vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => db.client,
}));

vi.mock('../membership', () => ({
  ensureClientMembership: vi.fn(async () => ({ created: true })),
}));
vi.mock('../messaging', () => ({
  appendClientReplyToCorpus: vi.fn(async () => true),
}));
vi.mock('../intake-submission', () => ({
  recordIntakeSubmission: vi.fn(async () => ({})),
}));

const savedArtifacts: Array<Record<string, unknown>> = [];
vi.mock('../preview-artifacts', () => ({
  savePreviewArtifacts: vi.fn(async (input: Record<string, unknown>) => {
    savedArtifacts.push(input);
    return { advanced: true };
  }),
  PreviewArtifactError: class extends Error {},
}));

import {
  claimPreview,
  clearClaimablePreviews,
  getClaimablePreview,
  rememberClaimablePreview,
} from '../claim';

const PREVIEW_ID = 'a1b2c3d4-1111-4111-8111-111111111111';

const FILES = [
  { path: 'index.html', content: '<h1>Calm Path</h1>', type: 'file' as const },
];

function previewInput() {
  return {
    previewId: PREVIEW_ID,
    intake: {
      projectId: PREVIEW_ID,
      business: { name: 'Calm Path', niche: 'Therapy' },
      socialMedia: [],
      locale: 'en',
      submittedAt: new Date().toISOString(),
      consent: { publicProfileAnalysis: false, acceptedAt: '' },
    },
    brandConfig: { schemaVersion: '1.0' },
    template: { slug: 'wellness-therapy', reason: 'fits' },
    files: FILES,
    previewUrl: 'https://sandbox.example.com',
  } as never;
}

/** What a second instance sees: a row in the table and an empty Map. */
function simulateFreshProcess() {
  clearClaimablePreviews();
}

beforeEach(() => {
  db.reset();
  savedArtifacts.length = 0;
  clearClaimablePreviews();
  vi.clearAllMocks();
});

describe('rememberClaimablePreview', () => {
  it('writes a durable row, not just a Map entry', async () => {
    await rememberClaimablePreview(previewInput());
    const row = db.rows('funnel_previews')[0];
    expect(row.preview_id).toBe(PREVIEW_ID);
    expect(row.template_slug).toBe('wellness-therapy');
    expect(row.expires_at).toBeTypeOf('string');
    expect((row.manifest as { files: unknown[] }).files).toHaveLength(1);
  });

  it('ignores an id that is not a uuid', async () => {
    await rememberClaimablePreview({
      ...(previewInput() as unknown as Record<string, unknown>),
      previewId: 'not-a-uuid',
    } as never);
    expect(db.rows('funnel_previews')).toHaveLength(0);
  });

  it('does not throw when the row cannot be written', async () => {
    db.failing.add('funnel_previews');
    await expect(
      rememberClaimablePreview(previewInput())
    ).resolves.toBeUndefined();
    // The cache still has it, so the same-process claim still works.
    expect(await getClaimablePreview(PREVIEW_ID)).toBeTruthy();
  });
});

describe('getClaimablePreview on a fresh process', () => {
  it('reads the preview back out of the durable row', async () => {
    await rememberClaimablePreview(previewInput());
    simulateFreshProcess();

    const found = await getClaimablePreview(PREVIEW_ID);
    expect(found).toBeTruthy();
    expect(found?.template.slug).toBe('wellness-therapy');
    expect(found?.files).toHaveLength(1);
    expect(found?.intake.projectId).toBe(PREVIEW_ID);
    expect(found?.previewUrl).toBe('https://sandbox.example.com');
  });

  it('returns nothing for an expired preview', async () => {
    await rememberClaimablePreview(previewInput());
    db.rows('funnel_previews')[0].expires_at = new Date(
      Date.now() - 1000
    ).toISOString();
    simulateFreshProcess();

    expect(await getClaimablePreview(PREVIEW_ID)).toBeUndefined();
  });

  it('returns nothing for a preview that was never persisted', async () => {
    simulateFreshProcess();
    expect(await getClaimablePreview(PREVIEW_ID)).toBeUndefined();
  });
});

describe('claimPreview on a fresh process', () => {
  it('still builds the workspace from the site the visitor saw', async () => {
    await rememberClaimablePreview(previewInput());
    simulateFreshProcess();

    const result = await claimPreview({
      previewId: PREVIEW_ID,
      clerkUserId: 'user_visitor',
      tier: 'pro',
      businessName: 'Calm Path',
    });

    expect(result.previewReady).toBe(true);
    expect(savedArtifacts).toHaveLength(1);
    // Re-pointed at its new home, which is what the build worker asserts on.
    expect((savedArtifacts[0].intake as { projectId: string }).projectId).toBe(
      result.workspaceId
    );
    expect(savedArtifacts[0].template).toMatchObject({
      slug: 'wellness-therapy',
    });
  });

  it('marks the preview claimed and pushes its TTL out of the reaper', async () => {
    await rememberClaimablePreview(previewInput());
    const beforeExpiry = Date.parse(
      String(db.rows('funnel_previews')[0].expires_at)
    );
    simulateFreshProcess();

    const result = await claimPreview({
      previewId: PREVIEW_ID,
      clerkUserId: 'user_visitor',
      tier: 'pro',
    });

    const row = db.rows('funnel_previews')[0];
    expect(row.claimed_workspace_id).toBe(result.workspaceId);
    expect(Date.parse(String(row.expires_at))).toBeGreaterThan(beforeExpiry);
  });

  it('copies the artifact under the workspace tenant prefix', async () => {
    await rememberClaimablePreview(previewInput());
    // As the publisher would have left it.
    db.rows(
      'funnel_previews'
    )[0].artifact_path = `funnel/${PREVIEW_ID}/site.tar.gz`;
    db.objects.set(`funnel/${PREVIEW_ID}/site.tar.gz`, {
      bytes: new Uint8Array([1, 2, 3]),
    });
    simulateFreshProcess();

    const result = await claimPreview({
      previewId: PREVIEW_ID,
      clerkUserId: 'user_visitor',
      tier: 'pro',
    });

    const tenantPath = `tenant/${result.workspaceId}/previews/${PREVIEW_ID}/site.tar.gz`;
    expect(db.objects.has(tenantPath)).toBe(true);
    // A copy, not a move: the hosted preview is still serving from the funnel
    // object until it is torn down.
    expect(db.objects.has(`funnel/${PREVIEW_ID}/site.tar.gz`)).toBe(true);
  });

  it('refuses to build from an expired preview but still gives a workspace', async () => {
    await rememberClaimablePreview(previewInput());
    db.rows('funnel_previews')[0].expires_at = new Date(
      Date.now() - 1000
    ).toISOString();
    simulateFreshProcess();

    const result = await claimPreview({
      previewId: PREVIEW_ID,
      clerkUserId: 'user_visitor',
      tier: 'pro',
    });

    // The client owns a project — losing the preview must not lose them that —
    // but nothing was built from a site that no longer exists.
    expect(result.workspaceId).toBeTruthy();
    expect(result.previewReady).toBe(false);
    expect(savedArtifacts).toHaveLength(0);
  });
});
