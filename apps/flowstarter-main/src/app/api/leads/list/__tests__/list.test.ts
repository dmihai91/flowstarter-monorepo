/**
 * Tests for GET /api/leads/list and PATCH /api/leads/list
 * Covers: Zod validation, query params coercion, status enum, empty-update guard
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

vi.mock('server-only', () => ({}));

// Mirror schemas from the route
const GetLeadsSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const PatchLeadSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  status: z.enum(['new', 'contacted', 'qualified', 'closed', 'spam']).optional(),
  notes: z.string().max(5000).optional(),
});

// ── Mock Supabase ────────────────────────────────────────────────────────────
const storedLeads: Record<string, unknown>[] = [];
let queryError: { message: string } | null = null;
let updateError: { message: string } | null = null;

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === 'leads') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                neq: vi.fn(() => Promise.resolve({ data: storedLeads, error: queryError })),
                eq: vi.fn(() => Promise.resolve({ data: storedLeads, error: queryError })),
              })),
            })),
          })),
        })),
        update: vi.fn((vals: Record<string, unknown>) => ({
          eq: vi.fn(() => Promise.resolve({ error: updateError, data: [{ ...storedLeads[0], ...vals }] })),
        })),
      };
    }
    return {};
  }),
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  rpc: vi.fn((_fn: string, _args?: any) => Promise.resolve({ data: [], error: null })),
} as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

// Simulate GET handler
async function simulateGet(params: Record<string, string>) {
  const result = GetLeadsSchema.safeParse(params);
  if (!result.success) {
    return { status: 400, error: result.error.errors[0].message };
  }

  const { projectId, status, limit } = result.data;

  let query = mockSupabase
    .from('leads')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') {
    (query as any).eq('status', status);
  } else {
    (query as any).neq('status', 'spam');
  }

  const { data, error } = await (query as any).neq('status', 'spam');
  if (error) return { status: 500, error: error.message };

  const { data: counts } = await mockSupabase.rpc('get_lead_counts', { p_project_id: projectId });
  return { status: 200, leads: data || [], counts: counts || [] };
}

// Simulate PATCH handler
async function simulatePatch(body: unknown) {
  const result = PatchLeadSchema.safeParse(body);
  if (!result.success) {
    return { status: 400, error: result.error.errors[0].message };
  }

  const { leadId, status, notes } = result.data;
  const update: Record<string, unknown> = {};
  if (status !== undefined) update.status = status;
  if (notes !== undefined) update.notes = notes;

  if (Object.keys(update).length === 0) {
    return { status: 400, error: 'Nothing to update' };
  }

  const { error } = await mockSupabase.from('leads').update(update).eq('id', leadId);
  if (error) return { status: 500, error: error.message };
  return { status: 200, success: true };
}

// ── GET tests ────────────────────────────────────────────────────────────────

describe('GET /api/leads/list — validation', () => {
  beforeEach(() => {
    storedLeads.length = 0;
    queryError = null;
    vi.clearAllMocks();
  });

  it('accepts valid projectId UUID', async () => {
    const result = await simulateGet({ projectId: '123e4567-e89b-12d3-a456-426614174000' });
    expect(result.status).toBe(200);
  });

  it('rejects non-UUID projectId', async () => {
    const result = await simulateGet({ projectId: 'not-a-uuid' });
    expect(result.status).toBe(400);
    expect(result.error).toContain('Invalid project ID');
  });

  it('rejects missing projectId', async () => {
    const result = await simulateGet({});
    expect(result.status).toBe(400);
  });

  it('coerces limit from string to number', async () => {
    const schema = GetLeadsSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      limit: '25',
    });
    expect(schema.success).toBe(true);
    if (schema.success) expect(schema.data.limit).toBe(25);
  });

  it('defaults limit to 50 when not provided', async () => {
    const schema = GetLeadsSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(schema.success).toBe(true);
    if (schema.success) expect(schema.data.limit).toBe(50);
  });

  it('rejects limit of 0', async () => {
    const schema = GetLeadsSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      limit: '0',
    });
    expect(schema.success).toBe(false);
  });

  it('rejects limit over 200', async () => {
    const schema = GetLeadsSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      limit: '201',
    });
    expect(schema.success).toBe(false);
  });

  it('accepts limit of exactly 200', async () => {
    const schema = GetLeadsSchema.safeParse({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      limit: '200',
    });
    expect(schema.success).toBe(true);
  });

  it('accepts optional status filter', async () => {
    const result = await simulateGet({
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'new',
    });
    expect(result.status).toBe(200);
  });

  it('returns 500 when Supabase query fails', async () => {
    queryError = { message: 'Connection timeout' };
    const result = await simulateGet({ projectId: '123e4567-e89b-12d3-a456-426614174000' });
    expect(result.status).toBe(500);
    expect(result.error).toContain('Connection timeout');
  });
});

// ── PATCH tests ───────────────────────────────────────────────────────────────

describe('PATCH /api/leads/list — validation', () => {
  beforeEach(() => {
    updateError = null;
    vi.clearAllMocks();
  });

  it('accepts valid leadId with status update', async () => {
    const result = await simulatePatch({
      leadId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'contacted',
    });
    expect(result.status).toBe(200);
  });

  it('accepts valid leadId with notes update', async () => {
    const result = await simulatePatch({
      leadId: '123e4567-e89b-12d3-a456-426614174000',
      notes: 'Called client, left voicemail.',
    });
    expect(result.status).toBe(200);
  });

  it('accepts both status and notes together', async () => {
    const result = await simulatePatch({
      leadId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'qualified',
      notes: 'Interested in premium plan.',
    });
    expect(result.status).toBe(200);
  });

  it('rejects missing leadId', async () => {
    const result = await simulatePatch({ status: 'contacted' });
    expect(result.status).toBe(400);
  });

  it('rejects non-UUID leadId', async () => {
    const result = await simulatePatch({ leadId: 'not-a-uuid', status: 'contacted' });
    expect(result.status).toBe(400);
    expect(result.error).toContain('Invalid lead ID');
  });

  it('rejects invalid status value', async () => {
    const result = await simulatePatch({
      leadId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'deleted', // not in enum
    });
    expect(result.status).toBe(400);
  });

  it('accepts all valid status enum values', async () => {
    const validStatuses = ['new', 'contacted', 'qualified', 'closed', 'spam'];
    for (const status of validStatuses) {
      const result = await simulatePatch({
        leadId: '123e4567-e89b-12d3-a456-426614174000',
        status,
      });
      expect(result.status).toBe(200);
    }
  });

  it('returns 400 when body has neither status nor notes', async () => {
    const result = await simulatePatch({
      leadId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.status).toBe(400);
    expect(result.error).toBe('Nothing to update');
  });

  it('rejects notes over 5000 characters', async () => {
    const result = await simulatePatch({
      leadId: '123e4567-e89b-12d3-a456-426614174000',
      notes: 'A'.repeat(5001),
    });
    expect(result.status).toBe(400);
  });

  it('returns 500 when Supabase update fails', async () => {
    updateError = { message: 'Row not found' };
    const result = await simulatePatch({
      leadId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'contacted',
    });
    expect(result.status).toBe(500);
  });
});
