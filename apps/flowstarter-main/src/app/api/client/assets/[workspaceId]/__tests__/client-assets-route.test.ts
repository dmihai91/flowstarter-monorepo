// @vitest-environment node
/**
 * The client upload loop, through the REAL route handlers.
 *
 * Four things are being defended here, and each of them has already been a
 * real bug in something:
 *
 *  1. TENANCY. These handlers query and upload with the service role, which
 *     bypasses RLS and bucket policies alike. `requireWorkspaceAccess` running
 *     first is the entire boundary, so the cross-tenant case asserts not only
 *     the 404 but that `storage.upload` was never called — a 404 that still
 *     wrote an object into another tenant's prefix would be a green test and a
 *     live leak.
 *  2. FILE TYPE. An SVG is XML that can carry script, and these files end up
 *     on the client's own website. The test sends one named `logo.png` with a
 *     spoofed `image/png` type, because that is exactly what an attacker sends.
 *  3. DEDUPE. `assets` has a partial unique index on (workspace_id, sha256).
 *     The route inserts and handles 23505 rather than checking first, so the
 *     fake raises 23505 for real and the same photograph twice must yield one
 *     row, not an error and not two.
 *  4. RIGHTS. Confirmation is over a named set. Stamping a neighbouring asset,
 *     or recording a confirmer taken from the body rather than the session,
 *     would make the evidence table worthless — so both are asserted.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
// Static imports: vi.mock is hoisted above them, and the app's tsconfig does
// not allow top-level await in tests.
import { GET, POST } from '../route';
import { POST as CONFIRM_RIGHTS } from '../rights/route';
import { createFakeAssetSupabase, type Row } from './fake-asset-supabase';

vi.mock('server-only', () => ({}));

const WORKSPACE_A = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const WORKSPACE_B = '7c2a91b4-3d5e-4a17-9f88-1b2c3d4e5f60';

// Asset ids are real UUIDs because the rights endpoint validates them as such
// before it queries — a readable string like 'asset-chosen' would be rejected
// by the schema and the test would pass for the wrong reason.
const ASSET_CHOSEN = '11111111-1111-4111-8111-111111111111';
const ASSET_UNTOUCHED = '22222222-2222-4222-8222-222222222222';
const ASSET_OTHER_TENANT = '33333333-3333-4333-8333-333333333333';
const ASSET_CONFIRMED = '44444444-4444-4444-8444-444444444444';
const ASSET_UNCONFIRMED = '55555555-5555-4555-8555-555555555555';

// ── Clerk ──────────────────────────────────────────────────────────────────
// Mirrors src/lib/__tests__/workspace-access.test.ts.
const authState: { userId: string | null; role: string | undefined } = {
  userId: 'user_client_a',
  role: undefined,
};

vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({
    userId: authState.userId,
    sessionClaims: { metadata: { role: authState.role } },
    getToken: async () => 'test-token',
  }),
  clerkClient: async () => ({
    users: {
      getUser: async () => ({
        publicMetadata: { role: authState.role },
        emailAddresses: [],
        primaryEmailAddressId: null,
      }),
    },
  }),
  currentUser: async () => null,
}));

// One client backs the membership lookup, the routes' own queries and storage —
// same module, same import, in production and here.
const db = createFakeAssetSupabase();
vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => db.client,
}));

/**
 * Only the non-asset half of the sufficiency input is faked. The images are
 * read back out of the fake database so the gate sees exactly what the route
 * decided to hand it — which is the whole point of the "unconfirmed rights do
 * not count" case. `evaluateSufficiency` itself is the real, pure module.
 */
vi.mock('@/lib/flowstarter/messaging', () => ({
  collectSufficiencyInput: async (workspaceId: string) => ({
    slots: [],
    images: db
      .rows('assets')
      .filter((row) => row.workspace_id === workspaceId && row.kind !== 'logo')
      .map((row) => ({
        id: row.id as string,
        width: row.width as number | null,
        height: row.height as number | null,
        usableFor: (row.usable_for as string[]) ?? [],
        isPlaceholder: false,
        kind: row.kind as string | null,
      })),
    logo: null,
    businessText: 'A real description of the business. '.repeat(20),
    contact: { email: 'a@example.com', phone: null, bookingUrl: null },
    services: ['One', 'Two', 'Three'],
  }),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

/**
 * A PNG whose header is real and whose body is not. Both `assertSafeUploadedImage`
 * (magic bytes) and `probeImageSize` (IHDR) read only the header, so this is a
 * genuine exercise of the validator without checking a binary into the repo.
 * `salt` changes the bytes, and therefore the sha256, without changing the shape.
 */
function pngBytes(width = 1600, height = 900, salt = 0): Buffer {
  const bytes = Buffer.alloc(64, 0);
  bytes.writeUInt32BE(0x89504e47, 0); // \x89PNG
  bytes.writeUInt32BE(0x0d0a1a0a, 4);
  bytes.writeUInt32BE(13, 8); // IHDR chunk length
  bytes.write('IHDR', 12, 'ascii');
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  bytes[63] = salt;
  return bytes;
}

/** An SVG. Never acceptable as an upload, whatever it claims to be. */
const SVG_BYTES = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>fetch("/steal")</script></svg>',
  'utf8'
);

function upload(
  workspaceId: string,
  files: Array<{ name: string; type: string; bytes: Buffer }>,
  fields: Record<string, string> = {}
): NextRequest {
  const form = new FormData();
  for (const file of files) {
    form.append(
      'files',
      new File([new Uint8Array(file.bytes)], file.name, { type: file.type })
    );
  }
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return new NextRequest(`http://localhost/api/client/assets/${workspaceId}`, {
    method: 'POST',
    body: form,
  });
}

function confirm(workspaceId: string, body: unknown): NextRequest {
  return new NextRequest(
    `http://localhost/api/client/assets/${workspaceId}/rights`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.7, 10.0.0.1',
        'user-agent': 'TestBrowser/1.0',
      },
      body: JSON.stringify(body),
    }
  );
}

function params(workspaceId: string) {
  return { params: Promise.resolve({ workspaceId }) };
}

function assetsIn(workspaceId: string): Row[] {
  return db.rows('assets').filter((row) => row.workspace_id === workspaceId);
}

beforeEach(() => {
  db.reset();
  authState.userId = 'user_client_a';
  authState.role = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  db.seed('workspace_memberships', [
    { workspace_id: WORKSPACE_A, clerk_user_id: 'user_client_a' },
  ]);
});

// ───────────────────────────────────────────────────────────────────────────

describe('cross-tenant uploads', () => {
  it('refuses another tenant, and never reaches storage', async () => {
    const response = await POST(
      upload(WORKSPACE_B, [
        { name: 'photo.png', type: 'image/png', bytes: pngBytes() },
      ]),
      params(WORKSPACE_B)
    );

    // 404, not 403: a 403 would confirm the workspace is real.
    expect(response.status).toBe(404);
    // The assertion that actually matters.
    expect(db.uploads).toHaveLength(0);
    expect(assetsIn(WORKSPACE_B)).toHaveLength(0);
    expect(db.rows('assets')).toHaveLength(0);
  });

  it('refuses another tenant on read, and signs nothing', async () => {
    const response = await GET(
      new NextRequest(`http://localhost/api/client/assets/${WORKSPACE_B}`),
      params(WORKSPACE_B)
    );
    expect(response.status).toBe(404);
    expect(db.signed).toHaveLength(0);
  });

  it('refuses a signed-out caller', async () => {
    authState.userId = null;
    const response = await POST(
      upload(WORKSPACE_A, [
        { name: 'photo.png', type: 'image/png', bytes: pngBytes() },
      ]),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(401);
    expect(db.uploads).toHaveLength(0);
  });
});

describe('what counts as an image', () => {
  it('rejects an SVG renamed .png with a spoofed content type', async () => {
    const response = await POST(
      upload(WORKSPACE_A, [
        { name: 'logo.png', type: 'image/png', bytes: SVG_BYTES },
      ]),
      params(WORKSPACE_A)
    );

    expect(response.status).toBe(400);
    // Nothing was stored and nothing was recorded: the bytes lost, not the name.
    expect(db.uploads).toHaveLength(0);
    expect(assetsIn(WORKSPACE_A)).toHaveLength(0);
  });

  it('refuses a file over the per-file cap', async () => {
    const oversized = Buffer.concat([
      pngBytes(),
      Buffer.alloc(9 * 1024 * 1024, 0),
    ]);
    const response = await POST(
      upload(WORKSPACE_A, [
        { name: 'huge.png', type: 'image/png', bytes: oversized },
      ]),
      params(WORKSPACE_A)
    );

    expect(response.status).toBe(413);
    expect(db.uploads).toHaveLength(0);
  });

  it('refuses a body that is not multipart at all', async () => {
    const response = await POST(
      new NextRequest(`http://localhost/api/client/assets/${WORKSPACE_A}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ files: [] }),
      }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(400);
    expect(db.uploads).toHaveLength(0);
  });
});

describe('storing an upload', () => {
  it('stores under the tenant prefix and records the row', async () => {
    const response = await POST(
      upload(
        WORKSPACE_A,
        [{ name: 'hero.png', type: 'image/png', bytes: pngBytes() }],
        { slot: 'hero' }
      ),
      params(WORKSPACE_A)
    );

    expect(response.status).toBe(201);
    expect(db.uploads).toHaveLength(1);
    expect(db.uploads[0]?.bucket).toBe('tenant-assets');
    expect(db.uploads[0]?.path).toMatch(
      new RegExp(`^tenant/${WORKSPACE_A}/assets/[0-9a-f]{64}\\.png$`)
    );
    // The content type comes from the verified bytes, not the upload's claim.
    expect(db.uploads[0]?.contentType).toBe('image/png');

    const [row] = assetsIn(WORKSPACE_A);
    expect(row).toMatchObject({
      workspace_id: WORKSPACE_A,
      source: 'upload',
      mime: 'image/png',
      width: 1600,
      height: 900,
      usable_for: ['hero'],
      rights_confirmed_at: null,
    });

    const events = db
      .rows('project_events')
      .filter((event) => event.kind === 'asset_uploaded');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      workspace_id: WORKSPACE_A,
      actor: 'user_client_a',
    });
  });

  it('is idempotent: the same file twice yields one asset row', async () => {
    const bytes = pngBytes();
    const first = await POST(
      upload(WORKSPACE_A, [{ name: 'photo.png', type: 'image/png', bytes }]),
      params(WORKSPACE_A)
    );
    const second = await POST(
      // A different filename, deliberately: dedupe is on content, not name.
      upload(WORKSPACE_A, [
        { name: 'photo-copy.png', type: 'image/png', bytes },
      ]),
      params(WORKSPACE_A)
    );

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(assetsIn(WORKSPACE_A)).toHaveLength(1);

    const firstBody = (await first.json()) as {
      uploaded: Array<{ id: string; deduplicated: boolean }>;
    };
    const secondBody = (await second.json()) as {
      uploaded: Array<{ id: string; deduplicated: boolean }>;
    };
    // Same row, and the second call says so rather than pretending it was new.
    expect(secondBody.uploaded[0]?.id).toBe(firstBody.uploaded[0]?.id);
    expect(firstBody.uploaded[0]?.deduplicated).toBe(false);
    expect(secondBody.uploaded[0]?.deduplicated).toBe(true);
  });

  it('keeps two different files apart', async () => {
    await POST(
      upload(WORKSPACE_A, [
        { name: 'a.png', type: 'image/png', bytes: pngBytes(1600, 900, 1) },
      ]),
      params(WORKSPACE_A)
    );
    await POST(
      upload(WORKSPACE_A, [
        { name: 'b.png', type: 'image/png', bytes: pngBytes(1600, 900, 2) },
      ]),
      params(WORKSPACE_A)
    );
    expect(assetsIn(WORKSPACE_A)).toHaveLength(2);
  });
});

describe('rights confirmation', () => {
  beforeEach(() => {
    db.seed('assets', [
      {
        id: ASSET_CHOSEN,
        workspace_id: WORKSPACE_A,
        source: 'upload',
        kind: null,
        storage_path: `tenant/${WORKSPACE_A}/assets/${'a'.repeat(64)}.png`,
        sha256: 'a'.repeat(64),
        mime: 'image/png',
        width: 1600,
        height: 900,
        usable_for: [],
        selected: false,
        rights_confirmed_at: null,
        created_at: '2026-08-30T10:00:00.000Z',
      },
      {
        id: ASSET_UNTOUCHED,
        workspace_id: WORKSPACE_A,
        source: 'upload',
        kind: null,
        storage_path: `tenant/${WORKSPACE_A}/assets/${'b'.repeat(64)}.png`,
        sha256: 'b'.repeat(64),
        mime: 'image/png',
        width: 1600,
        height: 900,
        usable_for: [],
        selected: false,
        rights_confirmed_at: null,
        created_at: '2026-08-30T11:00:00.000Z',
      },
      {
        id: ASSET_OTHER_TENANT,
        workspace_id: WORKSPACE_B,
        source: 'upload',
        kind: null,
        storage_path: `tenant/${WORKSPACE_B}/assets/${'c'.repeat(64)}.png`,
        sha256: 'c'.repeat(64),
        mime: 'image/png',
        width: 1600,
        height: 900,
        usable_for: [],
        selected: false,
        rights_confirmed_at: null,
        created_at: '2026-08-30T12:00:00.000Z',
      },
    ]);
  });

  it('stamps only the listed assets, and records who confirmed', async () => {
    const response = await CONFIRM_RIGHTS(
      confirm(WORKSPACE_A, {
        assetIds: [ASSET_CHOSEN],
        statementVersion: '2026-08-30',
      }),
      params(WORKSPACE_A)
    );

    expect(response.status).toBe(201);

    const chosen = db
      .rows('assets')
      .find((row) => row.id === ASSET_CHOSEN) as Row;
    const untouched = db
      .rows('assets')
      .find((row) => row.id === ASSET_UNTOUCHED) as Row;
    expect(chosen.rights_confirmed_at).toEqual(expect.any(String));
    expect(chosen.selected).toBe(true);
    // The neighbour was not swept up.
    expect(untouched.rights_confirmed_at).toBeNull();
    expect(untouched.selected).toBe(false);

    const [record] = db.rows('asset_rights_confirmations');
    expect(record).toMatchObject({
      workspace_id: WORKSPACE_A,
      asset_ids: [ASSET_CHOSEN],
      // From the session, never from the body.
      confirmed_by: 'user_client_a',
      statement_version: '2026-08-30',
      user_agent: 'TestBrowser/1.0',
    });
    // First hop of the proxy chain only.
    expect(record?.ip).toBe('203.0.113.7');
  });

  it('ignores a confirmer supplied in the body', async () => {
    await CONFIRM_RIGHTS(
      confirm(WORKSPACE_A, {
        assetIds: [ASSET_CHOSEN],
        confirmedBy: 'user_someone_else',
      }),
      params(WORKSPACE_A)
    );
    expect(db.rows('asset_rights_confirmations')[0]?.confirmed_by).toBe(
      'user_client_a'
    );
  });

  it('will not confirm another tenant’s asset, even alongside its own', async () => {
    const response = await CONFIRM_RIGHTS(
      confirm(WORKSPACE_A, {
        assetIds: [ASSET_CHOSEN, ASSET_OTHER_TENANT],
      }),
      params(WORKSPACE_A)
    );

    expect(response.status).toBe(404);
    // All-or-nothing: the caller's own asset is not quietly confirmed either.
    expect(
      db.rows('assets').find((row) => row.id === ASSET_CHOSEN)
        ?.rights_confirmed_at
    ).toBeNull();
    expect(db.rows('asset_rights_confirmations')).toHaveLength(0);
  });

  it('refuses a statement version it does not know', async () => {
    const response = await CONFIRM_RIGHTS(
      confirm(WORKSPACE_A, {
        assetIds: [ASSET_CHOSEN],
        statementVersion: '1999-01-01',
      }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(400);
    expect(db.rows('asset_rights_confirmations')).toHaveLength(0);
  });

  it('refuses a non-member outright', async () => {
    const response = await CONFIRM_RIGHTS(
      confirm(WORKSPACE_B, { assetIds: [ASSET_OTHER_TENANT] }),
      params(WORKSPACE_B)
    );
    expect(response.status).toBe(404);
    expect(db.rows('asset_rights_confirmations')).toHaveLength(0);
  });
});

describe('reading assets back', () => {
  beforeEach(() => {
    db.seed('assets', [
      {
        id: ASSET_CONFIRMED,
        workspace_id: WORKSPACE_A,
        source: 'upload',
        kind: null,
        storage_path: `tenant/${WORKSPACE_A}/assets/${'a'.repeat(64)}.png`,
        sha256: 'a'.repeat(64),
        mime: 'image/png',
        width: 1600,
        height: 900,
        usable_for: [],
        selected: true,
        rights_confirmed_at: '2026-08-30T09:00:00.000Z',
        created_at: '2026-08-30T09:00:00.000Z',
      },
      {
        id: ASSET_UNCONFIRMED,
        workspace_id: WORKSPACE_A,
        source: 'upload',
        kind: null,
        storage_path: `tenant/${WORKSPACE_A}/assets/${'b'.repeat(64)}.png`,
        sha256: 'b'.repeat(64),
        mime: 'image/png',
        width: 1600,
        height: 900,
        usable_for: [],
        selected: false,
        rights_confirmed_at: null,
        created_at: '2026-08-30T10:00:00.000Z',
      },
    ]);
  });

  it('never reports an unconfirmed asset as usable', async () => {
    const response = await GET(
      new NextRequest(`http://localhost/api/client/assets/${WORKSPACE_A}`),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      assets: Array<{ id: string; usable: boolean; url: string | null }>;
      usableAssetIds: string[];
    };

    expect(body.assets).toHaveLength(2);
    expect(body.usableAssetIds).toEqual([ASSET_CONFIRMED]);
    expect(
      body.assets.find((asset) => asset.id === ASSET_UNCONFIRMED)?.usable
    ).toBe(false);
  });

  it('hands out signed URLs, never raw storage paths', async () => {
    const response = await GET(
      new NextRequest(`http://localhost/api/client/assets/${WORKSPACE_A}`),
      params(WORKSPACE_A)
    );
    const raw = await response.text();

    expect(raw).not.toContain('storage_path');
    expect(raw).not.toContain('storagePath');
    for (const call of db.signed) {
      expect(call.bucket).toBe('tenant-assets');
      expect(call.path.startsWith(`tenant/${WORKSPACE_A}/`)).toBe(true);
      // Short-lived: a leaked URL stops working in minutes, not forever.
      expect(call.ttl).toBeLessThanOrEqual(600);
    }
    const body = JSON.parse(raw) as { assets: Array<{ url: string | null }> };
    for (const asset of body.assets) {
      expect(asset.url).toContain('token=signed');
    }
  });

  it('does not let an unconfirmed asset make a project look ready', async () => {
    // Only the unconfirmed asset exists, so nothing may be counted.
    db.tables['assets'] = db
      .rows('assets')
      .filter((row) => row.id === ASSET_UNCONFIRMED);

    const withoutRights = (await (
      await GET(
        new NextRequest(`http://localhost/api/client/assets/${WORKSPACE_A}`),
        params(WORKSPACE_A)
      )
    ).json()) as {
      sufficiency: { ready: boolean; missing: Array<{ code: string }> } | null;
    };
    expect(withoutRights.sufficiency?.ready).toBe(false);
    expect(
      withoutRights.sufficiency?.missing.map((item) => item.code)
    ).toContain('hero_image_missing');

    // Confirm it, and the same picture now counts.
    await CONFIRM_RIGHTS(
      confirm(WORKSPACE_A, { assetIds: [ASSET_UNCONFIRMED] }),
      params(WORKSPACE_A)
    );

    const withRights = (await (
      await GET(
        new NextRequest(`http://localhost/api/client/assets/${WORKSPACE_A}`),
        params(WORKSPACE_A)
      )
    ).json()) as {
      sufficiency: { ready: boolean; missing: Array<{ code: string }> } | null;
    };
    expect(
      withRights.sufficiency?.missing.map((item) => item.code)
    ).not.toContain('hero_image_missing');
  });
});
