// @vitest-environment node
/**
 * The client site editor, through the REAL route handlers.
 *
 * Five things are defended here, and each has already been a real bug in
 * something:
 *
 *  1. TENANCY. Every handler queries with the service role, which bypasses
 *     RLS. `requireWorkspaceAccess` running first is the entire boundary, so
 *     the cross-tenant cases assert not only the 404 but that no query other
 *     than the membership lookup ever ran — a 404 that still read another
 *     tenant's manifest would be a green test and a live leak.
 *  2. POLICY. The panel only offers content blocks, but the panel is not the
 *     authorization. A request naming a component is classified server-side
 *     and refused with the policy's own words, and the agent is never called.
 *  3. CONCURRENCY. An apply carries the original it was shown beside. If the
 *     site moved on, the apply must lose rather than overwrite a version its
 *     author never saw.
 *  4. RIGHTS. An asset without `rights_confirmed_at` cannot reach a site, and
 *     the refusal happens before the object is downloaded.
 *  5. COST. Each proposal spends the tenant's tokens, so the daily cap has to
 *     hold on the N+1th request rather than on the N+1th *successful* one.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
// Static imports: vi.mock is hoisted above them, and the app's tsconfig does
// not allow top-level await in tests.
import { GET as GET_STATE } from '../route';
import { POST as EDIT } from '../edit/route';
import { POST as APPLY } from '../apply/route';
import { GET as LIST_IMAGES, POST as SWAP_IMAGE } from '../images/route';
import { POST as REVERT } from '../revert/route';
import { POST as PUBLISH } from '../publish/route';
import { POST as ESCALATE } from '../escalate/route';
import { GET as PREVIEW } from '../preview/[[...path]]/route';
import { createFakeSiteSupabase, type Row } from './fake-site-supabase';

vi.mock('server-only', () => ({}));

const WORKSPACE_A = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const WORKSPACE_B = '7c2a91b4-3d5e-4a17-9f88-1b2c3d4e5f60';
const ASSET_CONFIRMED = '11111111-1111-4111-8111-111111111111';
const ASSET_UNCONFIRMED = '22222222-2222-4222-8222-222222222222';

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

const db = createFakeSiteSupabase();
vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => db.client,
}));

// The ledger is not what these cases are about, and the real module reaches
// for a Supabase client of its own.
vi.mock('@/lib/ai/llm', () => ({
  llmActionConfig: () => ({ maxTokens: 30_000, maxOutputTokens: 8_000 }),
  recordLlmUsage: async () => {},
}));

// The nudge to the build worker is an HTTP call to a process that is not
// running here. The row in the ledger is the commitment and is asserted for
// real; this only records that the nudge was attempted.
const dispatched: string[] = [];
vi.mock('@/lib/flowstarter/pipeline/dispatch', () => ({
  DispatchError: class extends Error {},
  dispatchAgentJob: async (jobId: string) => {
    dispatched.push(jobId);
  },
}));

/**
 * The real Pi model is not configured in this environment (no PI_API_KEY that
 * reaches a provider), so the agent is stood in for. What is NOT stubbed is
 * the thing worth testing: the route decides whether the agent may be called
 * at all, and `inlineEdit.calls` is asserted to be empty on every refusal.
 */
const inlineEdit = {
  calls: [] as Array<Record<string, unknown>>,
  reply: 'Operations and strategy consultancy',
};

vi.mock('@flowstarter/agentic-codegen', () => ({
  PiSdkFlowstarterAgents: class {
    constructor(readonly options: unknown) {}
    async editInline(request: Record<string, unknown>) {
      inlineEdit.calls.push(request);
      return {
        targetId: request['targetId'],
        originalContent: request['originalContent'],
        replacementContent: inlineEdit.reply,
      };
    }
  },
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

const CONTENT = `---
siteMeta:
  title: "Halden & Roe"
  description: "An independent consultancy."

hero:
  label: "Operations consultancy"
  title: "Decisions that hold"
  text: |
    We are Halden and Roe.

    No deck-and-leave.
  image: "/images/hero.jpg"
  imageAlt: "A meeting room"
  actions:
    - label: "Book a session"
      href: "/book"
---
`;

const LABEL_TARGET = 'src/content/site-labels.md#7';
const IMAGE_SLOT = 'src/content/site-labels.md#13';

function manifest() {
  return {
    files: [
      { path: 'src/content/site-labels.md', content: CONTENT },
      {
        path: 'src/components/Hero.astro',
        content: '<section class="hero"><slot /></section>\n',
      },
      {
        path: 'public/styles/site.css',
        content: ':root { --ink: #101014; }\n',
      },
    ],
  };
}

/**
 * A PNG whose header is real and whose body is not. `assertSafeUploadedImage`
 * (magic bytes) and `probeImageSize` (IHDR) read only the header, so this is a
 * genuine exercise of the validator without a binary in the repo.
 */
function pngBytes(width = 1600, height = 900): Buffer {
  const bytes = Buffer.alloc(64, 0);
  bytes.writeUInt32BE(0x89504e47, 0);
  bytes.writeUInt32BE(0x0d0a1a0a, 4);
  bytes.writeUInt32BE(13, 8);
  bytes.write('IHDR', 12, 'ascii');
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function seedWorkspace(subscriptionStatus = 'active'): void {
  db.seed('workspaces', [
    {
      id: WORKSPACE_A,
      name: 'Halden & Roe',
      slug: 'halden-roe',
      subscription_status: subscriptionStatus,
      hosting_server_id: null,
      deploy_status: 'none',
    },
    {
      id: WORKSPACE_B,
      name: 'Someone else',
      slug: 'someone-else',
      subscription_status: 'active',
      hosting_server_id: null,
      deploy_status: 'none',
    },
  ]);
  db.seed('workspace_memberships', [
    { workspace_id: WORKSPACE_A, clerk_user_id: 'user_client_a' },
  ]);
  db.seed('flowstarter_project_artifacts', [
    {
      workspace_id: WORKSPACE_A,
      preview_manifest: manifest(),
      template_slug: 'professional-services',
      template_version: '1.0.0',
    },
    {
      workspace_id: WORKSPACE_B,
      preview_manifest: manifest(),
      template_slug: 'professional-services',
      template_version: '1.0.0',
    },
  ]);
}

function seedAssets(): void {
  const path = `tenant/${WORKSPACE_A}/assets/abc.png`;
  db.objects.set(path, pngBytes());
  db.seed('assets', [
    {
      id: ASSET_CONFIRMED,
      workspace_id: WORKSPACE_A,
      source: 'upload',
      kind: 'section',
      mime: 'image/png',
      width: 1600,
      height: 900,
      usable_for: ['section'],
      selected: true,
      storage_path: path,
      rights_confirmed_at: '2026-08-01T00:00:00.000Z',
      created_at: '2026-08-01T00:00:00.000Z',
    },
    {
      id: ASSET_UNCONFIRMED,
      workspace_id: WORKSPACE_A,
      source: 'upload',
      kind: 'section',
      mime: 'image/png',
      width: 1600,
      height: 900,
      usable_for: ['section'],
      selected: false,
      storage_path: `tenant/${WORKSPACE_A}/assets/def.png`,
      rights_confirmed_at: null,
      created_at: '2026-08-02T00:00:00.000Z',
    },
  ]);
  db.objects.set(`tenant/${WORKSPACE_A}/assets/def.png`, pngBytes());
}

function post(url: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    ...(body === undefined
      ? {}
      : {
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        }),
  });
}

function get(url: string): NextRequest {
  return new NextRequest(`http://localhost${url}`);
}

function params(workspaceId: string, path?: string[]) {
  return {
    params: Promise.resolve({ workspaceId, ...(path ? { path } : {}) }),
  };
}

/** Everything the handlers read that is not the membership check itself. */
function dataQueries() {
  return db.queries.filter((query) => query.table !== 'workspace_memberships');
}

function manifestOf(workspaceId: string): { files: Array<Row> } {
  const versions = db
    .rows('site_versions')
    .filter((row) => row.workspace_id === workspaceId)
    .sort((a, b) => (a.version as number) - (b.version as number));
  const latest = versions[versions.length - 1];
  if (latest) return latest.manifest as { files: Array<Row> };
  const artifact = db
    .rows('flowstarter_project_artifacts')
    .find((row) => row.workspace_id === workspaceId);
  return artifact?.preview_manifest as { files: Array<Row> };
}

function contentOf(workspaceId: string): string {
  const file = manifestOf(workspaceId).files.find(
    (entry) => entry.path === 'src/content/site-labels.md'
  );
  return String(file?.content ?? '');
}

beforeEach(() => {
  db.reset();
  authState.userId = 'user_client_a';
  authState.role = undefined;
  inlineEdit.calls.length = 0;
  dispatched.length = 0;
  inlineEdit.reply = 'Operations and strategy consultancy';
  process.env.PI_API_KEY = 'test-key';
  seedWorkspace();
});

// ── 1. Tenancy ─────────────────────────────────────────────────────────────

describe('a workspace that is not yours', () => {
  it('is 404 on every route, and nothing of it is read', async () => {
    // Thunks, not promises: each call has to start *after* the query log is
    // cleared, or the log would already hold the previous case's queries and
    // the "nothing was read" assertion would be measuring the wrong request.
    const cases: Array<[string, () => Promise<Response>]> = [
      ['state', () => GET_STATE(get('/x'), params(WORKSPACE_B))],
      [
        'edit',
        () =>
          EDIT(
            post('/x', { targetId: LABEL_TARGET, instruction: 'warmer' }),
            params(WORKSPACE_B)
          ),
      ],
      [
        'apply',
        () =>
          APPLY(
            post('/x', {
              targetId: LABEL_TARGET,
              originalContent: 'Operations consultancy',
              replacementContent: 'Anything at all',
            }),
            params(WORKSPACE_B)
          ),
      ],
      ['images:list', () => LIST_IMAGES(get('/x'), params(WORKSPACE_B))],
      [
        'images:swap',
        () =>
          SWAP_IMAGE(
            post('/x', { slotId: IMAGE_SLOT, assetId: ASSET_CONFIRMED }),
            params(WORKSPACE_B)
          ),
      ],
      ['revert', () => REVERT(post('/x', { version: 1 }), params(WORKSPACE_B))],
      ['publish', () => PUBLISH(post('/x'), params(WORKSPACE_B))],
      [
        'preview',
        () => PREVIEW(get('/x'), params(WORKSPACE_B, ['index.html'])),
      ],
    ];

    for (const [name, call] of cases) {
      db.queries.length = 0;
      const response = await call();
      expect(response.status, name).toBe(404);
      expect(dataQueries(), name).toEqual([]);
    }
    expect(inlineEdit.calls).toHaveLength(0);
    expect(db.downloads).toEqual([]);
    expect(db.rows('site_versions')).toEqual([]);
  });

  it('asks a signed-out caller to sign in rather than pretending it is missing', async () => {
    authState.userId = null;
    const response = await GET_STATE(get('/x'), params(WORKSPACE_A));
    expect(response.status).toBe(401);
    expect(dataQueries()).toEqual([]);
  });
});

// ── 2. State ───────────────────────────────────────────────────────────────

describe('GET the editor state', () => {
  it('returns the editable blocks and the policy that governs them', async () => {
    const response = await GET_STATE(get('/x'), params(WORKSPACE_A));
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.site.templateSlug).toBe('professional-services');
    expect(body.site.rendersBuiltHtml).toBe(false);
    expect(body.policy.content.action).toBe('inline_content_agent');
    expect(body.policy.image.action).toBe('client_media_upload');
    expect(body.allowance).toMatchObject({ used: 0, cap: 25 });

    const ids = body.targets.map((target: { id: string }) => target.id);
    expect(ids).toContain(LABEL_TARGET);
    // The href line and the picture path are not on offer.
    expect(ids).not.toContain('src/content/site-labels.md#17');
    expect(ids).not.toContain(IMAGE_SLOT);
  });
});

// ── 3. Policy ──────────────────────────────────────────────────────────────

describe('policy, decided on the server', () => {
  it('refuses a structural target even though the UI never offered one', async () => {
    const response = await EDIT(
      post('/x', {
        targetId: 'src/components/Hero.astro#1',
        instruction: 'make the hero taller',
      }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.policy.action).toBe('maintenance_request');
    expect(body.error).toMatch(/require Flowstarter review/);
    // The model was never asked, so the tenant was never billed for it.
    expect(inlineEdit.calls).toHaveLength(0);
    expect(db.rows('project_events')).toEqual([]);
  });

  it('refuses a structural target on apply too, not only on propose', async () => {
    const response = await APPLY(
      post('/x', {
        targetId: 'public/styles/site.css#1',
        originalContent: ':root { --ink: #101014; }',
        replacementContent: 'a warmer ink',
      }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(403);
    expect(db.rows('site_versions')).toEqual([]);
  });

  it('stops editing when the subscription has lapsed', async () => {
    db.reset();
    seedWorkspace('past_due');
    const response = await EDIT(
      post('/x', { targetId: LABEL_TARGET, instruction: 'warmer' }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(402);
    const body = await response.json();
    expect(body.error).toMatch(/active care subscription/);
    expect(inlineEdit.calls).toHaveLength(0);
  });
});

// ── 4. Propose and apply ───────────────────────────────────────────────────

describe('proposing a change', () => {
  it('returns the replacement without touching the site', async () => {
    const response = await EDIT(
      post('/x', {
        targetId: LABEL_TARGET,
        instruction: 'name the strategy work too',
      }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.originalContent).toBe('Operations consultancy');
    expect(body.replacementContent).toBe('Operations and strategy consultancy');
    expect(body.allowance).toMatchObject({ used: 1, cap: 25 });

    // Nothing was written to the site.
    expect(db.rows('site_versions')).toEqual([]);
    expect(contentOf(WORKSPACE_A)).toContain('label: "Operations consultancy"');

    // The audit row carries a hash, never the client's words.
    const event = db.rows('project_events')[0];
    expect(event?.kind).toBe('site_edit_proposed');
    expect(event?.actor).toBe('user_client_a');
    const payload = event?.payload as Record<string, unknown>;
    expect(payload['instructionSha256']).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(payload)).not.toContain('strategy work');
  });

  it('refuses the request after the daily cap, before spending a token', async () => {
    db.seed(
      'project_events',
      Array.from({ length: 25 }, (_, index) => ({
        id: `event-${index}`,
        workspace_id: WORKSPACE_A,
        kind: 'site_edit_proposed',
        actor: 'user_client_a',
        payload: {},
        created_at: new Date().toISOString(),
      }))
    );

    const response = await EDIT(
      post('/x', { targetId: LABEL_TARGET, instruction: 'one more' }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.code).toBe('DAILY_CAP');
    expect(inlineEdit.calls).toHaveLength(0);
    // And no 26th proposal row was written.
    expect(
      db
        .rows('project_events')
        .filter((row) => row.kind === 'site_edit_proposed')
    ).toHaveLength(25);
  });

  it('refuses an instruction longer than the cap', async () => {
    const response = await EDIT(
      post('/x', { targetId: LABEL_TARGET, instruction: 'x'.repeat(5_000) }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(400);
    expect(inlineEdit.calls).toHaveLength(0);
  });
});

describe('applying a change', () => {
  it('snapshots the delivered site first, then the change', async () => {
    const response = await APPLY(
      post('/x', {
        targetId: LABEL_TARGET,
        originalContent: 'Operations consultancy',
        replacementContent: 'Operations and strategy consultancy',
      }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(200);
    expect((await response.json()).version).toBe(2);

    const versions = db
      .rows('site_versions')
      .filter((row) => row.workspace_id === WORKSPACE_A);
    expect(versions.map((row) => row.version)).toEqual([1, 2]);
    expect(versions[0]?.created_by).toBe('system');
    expect(versions[1]?.created_by).toBe('user_client_a');

    // The artifact row — what the worker builds and the deploy path ships —
    // now mirrors the new version.
    expect(contentOf(WORKSPACE_A)).toContain(
      'label: "Operations and strategy consultancy"'
    );

    const audit = db
      .rows('project_events')
      .find((row) => row.kind === 'site_edited');
    expect(audit?.payload).toMatchObject({
      targetId: LABEL_TARGET,
      changedPaths: ['src/content/site-labels.md'],
      version: 2,
    });
  });

  it('refuses when the original no longer matches the site', async () => {
    await APPLY(
      post('/x', {
        targetId: LABEL_TARGET,
        originalContent: 'Operations consultancy',
        replacementContent: 'Operations and strategy consultancy',
      }),
      params(WORKSPACE_A)
    );

    // A second tab still holding the text from before the first apply.
    const response = await APPLY(
      post('/x', {
        targetId: LABEL_TARGET,
        originalContent: 'Operations consultancy',
        replacementContent: 'Something entirely different',
      }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/changed since you started/);
    // The losing write did not land.
    expect(contentOf(WORKSPACE_A)).toContain(
      'label: "Operations and strategy consultancy"'
    );
    expect(db.rows('site_versions')).toHaveLength(2);
  });

  it('refuses markup posted straight at the apply route', async () => {
    const response = await APPLY(
      post('/x', {
        targetId: LABEL_TARGET,
        originalContent: 'Operations consultancy',
        replacementContent: '<img src=x onerror=alert(1)>',
      }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(400);
    expect(db.rows('site_versions')).toEqual([]);
  });
});

// ── 5. Revert ──────────────────────────────────────────────────────────────

describe('reverting', () => {
  it('brings the earlier wording back as a new version', async () => {
    await APPLY(
      post('/x', {
        targetId: LABEL_TARGET,
        originalContent: 'Operations consultancy',
        replacementContent: 'Operations and strategy consultancy',
      }),
      params(WORKSPACE_A)
    );
    expect(contentOf(WORKSPACE_A)).toContain(
      'label: "Operations and strategy consultancy"'
    );

    const response = await REVERT(
      post('/x', { version: 1 }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ version: 3, revertedTo: 1 });

    // Back to exactly what was delivered — and the change is still in the
    // record rather than deleted from it.
    expect(contentOf(WORKSPACE_A)).toBe(CONTENT);
    expect(db.rows('site_versions').map((row) => row.version)).toEqual([
      1, 2, 3,
    ]);
  });

  it('refuses a version that is not this workspace’s', async () => {
    db.seed('site_versions', [
      {
        id: 'foreign',
        workspace_id: WORKSPACE_B,
        version: 9,
        manifest: manifest(),
        created_by: 'user_other',
        created_at: '2026-08-01T00:00:00.000Z',
        published_at: null,
        summary: null,
      },
    ]);
    const response = await REVERT(
      post('/x', { version: 9 }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(404);
  });
});

// ── 6. Images ──────────────────────────────────────────────────────────────

describe('swapping a picture', () => {
  beforeEach(() => {
    seedAssets();
  });

  it('lists the slots and every file, with rights intact', async () => {
    const response = await LIST_IMAGES(get('/x'), params(WORKSPACE_A));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.slots.map((slot: { id: string }) => slot.id)).toEqual([
      IMAGE_SLOT,
    ]);
    expect(body.slots[0]).toMatchObject({
      currentPath: '/images/hero.jpg',
      alt: 'A meeting room',
    });
    const usable = body.assets.map((asset: { id: string; usable: boolean }) => [
      asset.id,
      asset.usable,
    ]);
    expect(usable).toContainEqual([ASSET_CONFIRMED, true]);
    expect(usable).toContainEqual([ASSET_UNCONFIRMED, false]);
  });

  it('refuses a file whose rights were never confirmed, before downloading it', async () => {
    db.downloads.length = 0;
    const response = await SWAP_IMAGE(
      post('/x', { slotId: IMAGE_SLOT, assetId: ASSET_UNCONFIRMED }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('RIGHTS_NOT_CONFIRMED');
    expect(db.downloads).toEqual([]);
    expect(db.rows('site_versions')).toEqual([]);
  });

  it('refuses a file belonging to another workspace', async () => {
    db.seed('assets', [
      {
        id: '33333333-3333-4333-8333-333333333333',
        workspace_id: WORKSPACE_B,
        source: 'upload',
        storage_path: `tenant/${WORKSPACE_B}/assets/ghi.png`,
        rights_confirmed_at: '2026-08-01T00:00:00.000Z',
        created_at: '2026-08-01T00:00:00.000Z',
      },
    ]);
    const response = await SWAP_IMAGE(
      post('/x', {
        slotId: IMAGE_SLOT,
        assetId: '33333333-3333-4333-8333-333333333333',
      }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(404);
    expect(db.downloads).toEqual([]);
  });

  it('puts a confirmed picture into the slot and versions the result', async () => {
    const response = await SWAP_IMAGE(
      post('/x', { slotId: IMAGE_SLOT, assetId: ASSET_CONFIRMED }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.previousPath).toBe('/images/hero.jpg');
    expect(body.publicPath).toBe('/flowstarter-media/hero-13.png');
    expect(body.version).toBe(2);

    expect(contentOf(WORKSPACE_A)).toContain(
      'image: "/flowstarter-media/hero-13.png"'
    );
    const files = manifestOf(WORKSPACE_A).files;
    const media = files.find(
      (file) => file.path === 'public/flowstarter-media/hero-13.png'
    );
    expect(media?.encoding).toBe('base64');
    expect(
      db
        .rows('project_events')
        .some((row) => row.kind === 'site_image_replaced')
    ).toBe(true);
  });
});

// ── 7. Serving the site ────────────────────────────────────────────────────

describe('serving the site into the frame', () => {
  it('refuses to walk out of the manifest', async () => {
    for (const path of [
      ['..', '..', '.env'],
      ['styles', '..', '..', 'src', 'components', 'Hero.astro'],
      ['..'],
    ]) {
      const response = await PREVIEW(get('/x'), params(WORKSPACE_A, path));
      expect(response.status, path.join('/')).toBe(404);
    }
  });

  it('serves a stored asset with the right content type', async () => {
    const response = await PREVIEW(
      get('/x'),
      params(WORKSPACE_A, ['styles', 'site.css'])
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'text/css; charset=utf-8'
    );
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await response.text()).toContain('--ink');
  });

  it('renders the content view with a clickable id on every block', async () => {
    const response = await PREVIEW(get('/x'), params(WORKSPACE_A, []));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'text/html; charset=utf-8'
    );
    // Sandboxed into an opaque origin: the frame cannot touch the dashboard.
    expect(response.headers.get('content-security-policy')).toContain(
      'sandbox allow-scripts'
    );
    const html = await response.text();
    expect(html).toContain(`data-flowstarter-id="${LABEL_TARGET}"`);
    expect(html).toContain('Operations consultancy');
  });

  it('does not serve a file that is not in the manifest', async () => {
    const response = await PREVIEW(
      get('/x'),
      params(WORKSPACE_A, ['not-a-file.txt'])
    );
    expect(response.status).toBe(404);
  });
});

// ── 8. Publish ─────────────────────────────────────────────────────────────

describe('publishing', () => {
  /**
   * A project with a server allocated. Publishing from here is the case the
   * rebuild exists for; the default fixture has no server at all.
   */
  function hostThePublishedSite(): void {
    db.seed('hosting_servers', [
      { id: 'host-1', deploy_agent_url: 'https://agent.test' },
    ]);
    const workspace = db
      .rows('workspaces')
      .find((row) => row.id === WORKSPACE_A);
    if (workspace) workspace['hosting_server_id'] = 'host-1';
  }

  /** The manifest already carries a previous build's output. */
  function withAPreviousBuild(): void {
    const artifact = db
      .rows('flowstarter_project_artifacts')
      .find((row) => row.workspace_id === WORKSPACE_A);
    (artifact?.['preview_manifest'] as { files: Row[] }).files.push({
      path: 'dist/index.html',
      content: '<html></html>',
    });
  }

  it('marks a version and says what still has to happen', async () => {
    const response = await PUBLISH(post('/x'), params(WORKSPACE_A));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.version).toBe(1);
    // No server allocated in this fixture, and that is what the client is told.
    expect(body.deploy.mode).toBe('no_host');
    expect(body.deploy.detail).toMatch(/marked to publish/);
    // Nothing to rebuild onto, so nothing is queued and nothing is nudged.
    expect(body.rebuildJobId).toBeNull();
    expect(db.rows('flowstarter_agent_jobs')).toEqual([]);
    expect(dispatched).toEqual([]);

    const published = db.rows('site_versions').find((row) => row.version === 1);
    expect(published?.published_at).toBeTruthy();
    expect(
      db
        .rows('project_events')
        .some((row) => row.kind === 'site_publish_requested')
    ).toBe(true);
  });

  it('queues the rebuild that puts the edit live, and nudges the worker', async () => {
    hostThePublishedSite();

    const response = await PUBLISH(post('/x'), params(WORKSPACE_A));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.deploy.mode).toBe('rebuild_queued');
    expect(body.deploy.detail).toMatch(/being rebuilt/);

    const jobs = db.rows('flowstarter_agent_jobs');
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      workspace_id: WORKSPACE_A,
      kind: 'SITE_REBUILD',
      status: 'queued',
    });
    expect(jobs[0]['payload']).toMatchObject({
      trigger: 'client_publish',
      version: body.version,
      publishedBy: 'user_client_a',
    });
    expect(body.rebuildJobId).toBe(jobs[0]['id']);
    expect(dispatched).toEqual([jobs[0]['id']]);
  });

  it('joins the rebuild already in flight rather than starting a second one', async () => {
    hostThePublishedSite();

    const first = await (await PUBLISH(post('/x'), params(WORKSPACE_A))).json();
    dispatched.length = 0;
    const second = await (
      await PUBLISH(post('/x'), params(WORKSPACE_A))
    ).json();

    // Two rebuilds of one workspace would race for the same worktree, and the
    // loser would deploy stale files over the winner.
    expect(db.rows('flowstarter_agent_jobs')).toHaveLength(1);
    expect(second.rebuildJobId).toBe(first.rebuildJobId);
    expect(second.deploy.mode).toBe('rebuild_queued');
    // Still nudged: the first nudge may have been the one that was lost.
    expect(dispatched).toEqual([first.rebuildJobId]);
  });

  it('queues a rebuild for a site that is already built and hosted too', async () => {
    // The other branch: a live host with a deploy agent behind it. The
    // previous build is exactly what must not be re-published as-is, so this
    // still queues rather than deploying what is already there.
    hostThePublishedSite();
    withAPreviousBuild();
    process.env.DEPLOY_AGENT_SHARED_SECRET = 'x'.repeat(40);
    try {
      const body = await (
        await PUBLISH(post('/x'), params(WORKSPACE_A))
      ).json();
      expect(body.deploy.mode).toBe('rebuild_queued');
      expect(body.deploy.hasBuild).toBe(true);
      expect(db.rows('flowstarter_agent_jobs')).toHaveLength(1);
    } finally {
      delete process.env.DEPLOY_AGENT_SHARED_SECRET;
    }
  });

  it('queues a fresh rebuild when the only one on the ledger has finished', async () => {
    hostThePublishedSite();
    db.seed('flowstarter_agent_jobs', [
      {
        id: 'done-1',
        workspace_id: WORKSPACE_A,
        kind: 'SITE_REBUILD',
        status: 'succeeded',
        payload: {},
      },
    ]);

    const body = await (await PUBLISH(post('/x'), params(WORKSPACE_A))).json();
    expect(body.rebuildJobId).not.toBe('done-1');
    expect(db.rows('flowstarter_agent_jobs')).toHaveLength(2);
  });

  it('queues a second rebuild behind one that is already running, instead of joining it', async () => {
    // The worker freezes the manifest at claim time, so a `running` job is
    // already building the OLD manifest. Joining it would silently drop this
    // publish's edit, so it has to get its own `queued` job that waits behind
    // the running one.
    hostThePublishedSite();
    db.seed('flowstarter_agent_jobs', [
      {
        id: 'running-1',
        workspace_id: WORKSPACE_A,
        kind: 'SITE_REBUILD',
        status: 'running',
        payload: {},
      },
    ]);

    const body = await (await PUBLISH(post('/x'), params(WORKSPACE_A))).json();
    expect(body.deploy.mode).toBe('rebuild_queued');
    expect(body.rebuildJobId).not.toBe('running-1');

    const jobs = db.rows('flowstarter_agent_jobs');
    expect(jobs).toHaveLength(2);
    const queued = jobs.find((row) => row.id === body.rebuildJobId);
    expect(queued).toMatchObject({ status: 'queued', kind: 'SITE_REBUILD' });
    const running = jobs.find((row) => row.id === 'running-1');
    expect(running?.status).toBe('running');
  });

  it('joins a queued rebuild even while a different one is already running', async () => {
    // Confirms the join rule reads status, not just "something in flight":
    // a queued job's manifest is not frozen yet, so it is safe to join even
    // though a running job also exists for the same workspace.
    hostThePublishedSite();
    db.seed('flowstarter_agent_jobs', [
      {
        id: 'running-1',
        workspace_id: WORKSPACE_A,
        kind: 'SITE_REBUILD',
        status: 'running',
        payload: {},
      },
      {
        id: 'queued-1',
        workspace_id: WORKSPACE_A,
        kind: 'SITE_REBUILD',
        status: 'queued',
        payload: {},
      },
    ]);

    const body = await (await PUBLISH(post('/x'), params(WORKSPACE_A))).json();
    expect(body.rebuildJobId).toBe('queued-1');
    expect(db.rows('flowstarter_agent_jobs')).toHaveLength(2);
  });
});

// ── 8. Bigger changes: escalation with rule-based classification ───────────

describe('escalating a bigger change', () => {
  it('files a structural request into the thread as a change_request', async () => {
    const response = await ESCALATE(
      post('/x', {
        request: 'Add a page for group workshops with a booking calendar',
      }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.classification).toBe('structural');
    expect(body.escalated).toBe(true);

    const message = db
      .rows('project_messages')
      .find((row) => row.kind === 'change_request');
    expect(message).toBeTruthy();
    expect(message?.direction).toBe('inbound');
    expect(message?.status).toBe('sent');
    expect(String(message?.body)).toContain('group workshops');
  });

  it('points a wording request back at the editor without filing anything', async () => {
    const response = await ESCALATE(
      post('/x', { request: 'Fix the typo in the about paragraph please' }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.classification).toBe('content');
    expect(body.escalated).toBe(false);
    expect(
      db.rows('project_messages').some((row) => row.kind === 'change_request')
    ).toBe(false);
  });

  it('files anyway when the client insists', async () => {
    const response = await ESCALATE(
      post('/x', {
        request: 'Fix the typo in the about paragraph please',
        force: true,
      }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(201);
    expect((await response.json()).escalated).toBe(true);
    expect(
      db.rows('project_messages').some((row) => row.kind === 'change_request')
    ).toBe(true);
  });

  it('is 404 on a workspace that is not yours, and files nothing', async () => {
    const response = await ESCALATE(
      post('/x', { request: 'Add a booking page to this site' }),
      params(WORKSPACE_B)
    );
    expect(response.status).toBe(404);
    expect(db.rows('project_messages')).toHaveLength(0);
  });

  it('refuses when the subscription has lapsed, in the policy’s own words', async () => {
    db.reset();
    seedWorkspace('past_due');
    const response = await ESCALATE(
      post('/x', { request: 'Add a booking page to this site' }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(402);
    const body = await response.json();
    expect(body.policy?.action).toBe('deny');
    expect(db.rows('project_messages')).toHaveLength(0);
  });
});
