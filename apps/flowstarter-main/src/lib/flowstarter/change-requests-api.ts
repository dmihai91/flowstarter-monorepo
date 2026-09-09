/**
 * The operator side of change requests, once, for both `/api/admin/*` and
 * `/api/team/*` (the route files re-export these handlers).
 *
 * List what the client asked for with the rule table's suggested price;
 * write the quote the client will see; decline; mark done once the work has
 * shipped. Every move is a compare-and-set in change-requests.ts, so the
 * operator and the client cannot race a request past its payment.
 */
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireTeamAuth } from '@/lib/api-auth';
import type { Json } from '@/lib/database.types';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import {
  ChangeRequestError,
  MAX_CHANGE_QUOTE_MINOR,
  completeChangeRequest,
  declineChangeRequest,
  getChangeRequest,
  listChangeRequests,
  quoteChangeRequest,
  toChangeRequestView,
} from './change-requests';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Ctx = { params: Promise<{ id: string }> };
type ChangeCtx = { params: Promise<{ id: string; changeId: string }> };

function fail(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

async function operator(ctx: Ctx | ChangeCtx) {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return { ok: false as const, response: auth.response };
  const params = await ctx.params;
  if (!UUID.test(params.id)) {
    return {
      ok: false as const,
      response: fail('Invalid workspace id', 'BAD_REQUEST', 400),
    };
  }
  const changeId = 'changeId' in params ? params.changeId : null;
  if (changeId !== null && !UUID.test(changeId)) {
    return {
      ok: false as const,
      response: fail('Invalid change request id', 'BAD_REQUEST', 400),
    };
  }
  return {
    ok: true as const,
    userId: auth.userId,
    workspaceId: params.id,
    changeId,
    db: createSupabaseServiceRoleClient(),
  };
}

function handle(error: unknown): NextResponse {
  if (error instanceof ChangeRequestError) {
    return fail(error.message, error.code, error.status);
  }
  console.error('[change-requests] request failed:', error);
  return fail('Could not update the change request', 'DB_ERROR', 500);
}

async function recordEvent(
  db: ReturnType<typeof createSupabaseServiceRoleClient>,
  row: { workspaceId: string; kind: string; actor: string; payload: Json }
) {
  const { error } = await db.from('project_events').insert({
    workspace_id: row.workspaceId,
    kind: row.kind,
    actor: row.actor,
    payload: row.payload,
  });
  if (error)
    console.error(`[change-requests] could not write ${row.kind}:`, error);
}

// ─── GET /projects/[id]/changes ─────────────────────────────────────────────

export async function listChangeRequestsHandler(
  _req: NextRequest,
  ctx: Ctx
): Promise<NextResponse> {
  const op = await operator(ctx);
  if (!op.ok) return op.response;
  try {
    const rows = await listChangeRequests(op.db, op.workspaceId);
    return NextResponse.json(
      {
        requests: rows.map((row) =>
          toChangeRequestView(row, { forOperator: true })
        ),
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return handle(error);
  }
}

// ─── POST /projects/[id]/changes/[changeId]/quote ───────────────────────────

const quoteSchema = z.object({
  amountMinor: z.number().int().min(0).max(MAX_CHANGE_QUOTE_MINOR),
  note: z.string().trim().max(1_000).optional().default(''),
});

export async function quoteChangeRequestHandler(
  req: NextRequest,
  ctx: ChangeCtx
): Promise<NextResponse> {
  const op = await operator(ctx);
  if (!op.ok) return op.response;
  const parsed = quoteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail(
      'Send a whole amount in minor units and an optional note.',
      'INVALID_BODY',
      400
    );
  }
  try {
    const row = await getChangeRequest(op.db, op.workspaceId, op.changeId!);
    if (!row) return fail('Change request not found', 'NOT_FOUND', 404);
    const quoted = await quoteChangeRequest(op.db, row, {
      amountMinor: parsed.data.amountMinor,
      note: parsed.data.note || null,
      quotedBy: op.userId,
    });
    await recordEvent(op.db, {
      workspaceId: op.workspaceId,
      kind: 'change_request_quoted',
      actor: op.userId,
      payload: {
        changeRequestId: row.id,
        amountMinor: parsed.data.amountMinor,
        currency: row.currency,
        requoted: row.status === 'quoted',
      },
    });
    return NextResponse.json({
      request: toChangeRequestView(quoted, { forOperator: true }),
    });
  } catch (error) {
    return handle(error);
  }
}

// ─── POST /projects/[id]/changes/[changeId]/status ──────────────────────────

const statusSchema = z.object({
  status: z.enum(['declined', 'done']),
  reason: z.string().trim().max(500).optional().default(''),
});

export async function setChangeRequestStatusHandler(
  req: NextRequest,
  ctx: ChangeCtx
): Promise<NextResponse> {
  const op = await operator(ctx);
  if (!op.ok) return op.response;
  const parsed = statusSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return fail('status must be declined or done', 'INVALID_BODY', 400);
  try {
    const row = await getChangeRequest(op.db, op.workspaceId, op.changeId!);
    if (!row) return fail('Change request not found', 'NOT_FOUND', 404);
    const moved =
      parsed.data.status === 'done'
        ? await completeChangeRequest(op.db, row)
        : await declineChangeRequest(op.db, row, 'operator');
    await recordEvent(op.db, {
      workspaceId: op.workspaceId,
      kind:
        parsed.data.status === 'done'
          ? 'change_request_done'
          : 'change_request_declined',
      actor: op.userId,
      payload: {
        changeRequestId: row.id,
        by: 'operator',
        ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
      },
    });
    return NextResponse.json({
      request: toChangeRequestView(moved, { forOperator: true }),
    });
  } catch (error) {
    return handle(error);
  }
}
