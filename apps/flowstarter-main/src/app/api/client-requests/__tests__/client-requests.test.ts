/**
 * Tests for POST/GET /api/client-requests.
 * Covers: auth, role gating, validation, successful insert.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

// ── Mock Clerk ───────────────────────────────────────────────────────────────
const authMock = vi.fn();
const currentUserMock = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => authMock(...args),
  currentUser: (...args: unknown[]) => currentUserMock(...args),
}));

// ── Mock Supabase service role client ────────────────────────────────────────
let projectLookupResult: { data: unknown; error: unknown } = {
  data: { id: 'project-1', user_id: 'user_123' },
  error: null,
};
let insertResult: { data: unknown; error: unknown } = {
  data: { id: 'req-1', created_at: '2026-04-17T00:00:00Z' },
  error: null,
};
let listResult: { data: unknown; error: unknown } = { data: [], error: null };

function makeProjectsChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(projectLookupResult));
  return chain;
}

function makeClientRequestsChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.or = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(insertResult));
  // Terminal: awaiting the chain returns listResult for GET paths.
  chain.then = (
    resolve: (v: typeof listResult) => void,
    reject?: (e: unknown) => void
  ) => {
    try {
      resolve(listResult);
    } catch (err) {
      reject?.(err);
    }
  };
  return chain;
}

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === 'projects') return makeProjectsChain();
    if (table === 'client_requests') return makeClientRequestsChain();
    return {};
  }),
};

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

// Import routes after mocks are set up.
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

function makeJsonRequest(method: 'POST' | 'GET', body?: unknown) {
  return new NextRequest('http://localhost/api/client-requests', {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
  });
}

describe('POST /api/client-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectLookupResult = {
      data: { id: 'project-1', user_id: 'user_123' },
      error: null,
    };
    insertResult = {
      data: { id: 'req-1', created_at: '2026-04-17T00:00:00Z' },
      error: null,
    };
  });

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue({ userId: null });
    const res = await POST(makeJsonRequest('POST', {}));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid payload', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' });
    const res = await POST(makeJsonRequest('POST', { title: 'x' }));
    expect(res.status).toBe(400);
  });

  it('returns 403 when project does not belong to user', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' });
    projectLookupResult = { data: null, error: { message: 'not found' } };
    const res = await POST(
      makeJsonRequest('POST', {
        projectId: '00000000-0000-0000-0000-000000000001',
        title: 'Add a contact form',
        description:
          'I need a contact form on the homepage with name, email, and message.',
      })
    );
    expect(res.status).toBe(403);
  });

  it('returns 201 on valid payload with matching project', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' });
    const res = await POST(
      makeJsonRequest('POST', {
        projectId: '00000000-0000-0000-0000-000000000001',
        title: 'Add a contact form',
        description:
          'I need a contact form on the homepage with name, email, and message.',
        originalPrompt: 'add contact form',
        editorContext: {
          capabilityReason: 'Form logic requires backend integration',
        },
        priority: 'normal',
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ id: 'req-1' });
  });
});

describe('GET /api/client-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listResult = { data: [], error: null };
  });

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue({ userId: null, sessionClaims: null });
    const res = await GET(makeJsonRequest('GET'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-team users', async () => {
    authMock.mockResolvedValue({
      userId: 'user_123',
      sessionClaims: { metadata: { role: 'client' } },
    });
    currentUserMock.mockResolvedValue({ publicMetadata: { role: 'client' } });
    const res = await GET(makeJsonRequest('GET'));
    expect(res.status).toBe(403);
  });

  it('returns 200 for team users via sessionClaims', async () => {
    authMock.mockResolvedValue({
      userId: 'user_123',
      sessionClaims: { metadata: { role: 'team' } },
    });
    const res = await GET(makeJsonRequest('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ requests: [] });
  });

  it('returns 403 when role is missing from both sessionClaims and currentUser', async () => {
    authMock.mockResolvedValue({ userId: 'user_123', sessionClaims: {} });
    currentUserMock.mockResolvedValue({ publicMetadata: {} });
    const res = await GET(makeJsonRequest('GET'));
    expect(res.status).toBe(403);
  });

  it('falls back to currentUser publicMetadata.role when sessionClaims lack a role', async () => {
    authMock.mockResolvedValue({ userId: 'user_123', sessionClaims: {} });
    currentUserMock.mockResolvedValue({ publicMetadata: { role: 'admin' } });
    const res = await GET(makeJsonRequest('GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ requests: [] });
  });
});
