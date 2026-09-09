/**
 * The full log of one build: everything the agents narrated, every tool call
 * they made, and every line the machine printed while validating and
 * publishing.
 *
 * The build conversation (`jobEventsHandler`) is the readable summary — the
 * phases, the agents' closing words, the operators' notes. This is the raw
 * material underneath it, flattened back into lines. The build worker writes
 * that material in batches (one `log` event per ~25 lines, tagged
 * `payload.stream`), so reading it back means splitting bodies on newlines and
 * carrying each batch's source down onto its lines.
 *
 * Operator-only, via the same `requireTeamAuth` + workspace + job resolution
 * the rest of the pipeline API uses. The helpers are copied rather than
 * shared: this file is additive, and `api.ts` is not worth reopening for it.
 */
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireTeamAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Batches read per job. Each one carries up to ~25 lines. */
const LOG_EVENT_LIMIT = 5_000;

/** Lines returned per job, after flattening. */
const LOG_LINE_LIMIT = 20_000;

const LOG_EVENT_COLUMNS = 'id, kind, body, payload, created_at';

type JobCtx = { params: Promise<{ id: string; jobId: string }> };

interface LogEventRow {
  id: string;
  kind: string;
  body: string;
  payload: unknown;
  created_at: string;
}

interface LogLine {
  at: string;
  source: string;
  text: string;
}

function badRequest(message: string, code = 'BAD_REQUEST', status = 400) {
  return NextResponse.json({ error: message, code }, { status });
}

function dbError(message: string) {
  return NextResponse.json(
    { error: message, code: 'DB_ERROR' },
    { status: 500 }
  );
}

/**
 * Operator auth, a valid workspace id, and the job under it. Anything short of
 * all three comes back as the response to hand straight to the client.
 */
async function resolveJob(
  ctx: JobCtx
): Promise<
  | { ok: true; job: { id: string; kind: string; status: string } }
  | { ok: false; response: NextResponse }
> {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return { ok: false, response: auth.response };

  const { id, jobId } = await ctx.params;
  if (!UUID.test(id)) {
    return { ok: false, response: badRequest('Invalid workspace id') };
  }
  if (!UUID.test(jobId)) {
    return { ok: false, response: badRequest('Invalid job id') };
  }

  const db = createSupabaseServiceRoleClient();
  const { data: workspace, error: workspaceError } = await db
    .from('workspaces')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (workspaceError) {
    console.error('[pipeline] workspace lookup failed:', workspaceError);
    return { ok: false, response: dbError('Could not load the workspace') };
  }
  if (!workspace) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Workspace not found', code: 'NOT_FOUND' },
        { status: 404 }
      ),
    };
  }

  // Scoped to the workspace, so a job id alone cannot read another tenant's
  // build even though this client is service-role.
  const { data: job, error: jobError } = await db
    .from('flowstarter_agent_jobs')
    .select('id, kind, status')
    .eq('id', jobId)
    .eq('workspace_id', id)
    .maybeSingle();
  if (jobError) {
    console.error('[pipeline] job lookup failed:', jobError);
    return { ok: false, response: dbError('Could not load the job') };
  }
  if (!job) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Job not found', code: 'NOT_FOUND' },
        { status: 404 }
      ),
    };
  }

  return {
    ok: true,
    job: job as unknown as { id: string; kind: string; status: string },
  };
}

/**
 * A stream batch's source, from the payload the worker stamped it with. A row
 * that is not a stream batch is labelled by its kind instead, so a downloaded
 * log reads as one record of the build: the phases and the agents' replies in
 * their place among the lines they bracket.
 */
function lineSource(row: LogEventRow): string {
  const payload = row.payload;
  if (typeof payload === 'object' && payload !== null) {
    const source = (payload as { source?: unknown; stream?: unknown }).source;
    if ((payload as { stream?: unknown }).stream === true) {
      return typeof source === 'string' && source.length > 0
        ? source
        : 'machine';
    }
  }
  return row.kind;
}

function flatten(rows: LogEventRow[]): LogLine[] {
  const lines: LogLine[] = [];
  for (const row of rows) {
    const source = lineSource(row);
    for (const text of String(row.body ?? '').split('\n')) {
      if (text.trim().length === 0) continue;
      if (lines.length >= LOG_LINE_LIMIT) return lines;
      lines.push({ at: row.created_at, source, text });
    }
  }
  return lines;
}

/** `HH:MM:SS` in UTC, which is what the rows are stamped in. */
function clock(at: string): string {
  const parsed = Date.parse(at);
  return Number.isNaN(parsed)
    ? '--:--:--'
    : new Date(parsed).toISOString().slice(11, 19);
}

/**
 * GET /projects/[id]/pipeline/jobs/[jobId]/log — every line of one build,
 * oldest first. `?format=text` returns it as a plain-text file instead, one
 * `HH:MM:SS [source] text` line each, for downloading and grepping.
 */
export async function jobLogHandler(
  req: NextRequest,
  ctx: JobCtx
): Promise<NextResponse> {
  const resolved = await resolveJob(ctx);
  if (!resolved.ok) return resolved.response;
  const { job } = resolved;

  const db = createSupabaseServiceRoleClient();
  const { data, error } = await db
    .from('flowstarter_agent_job_events')
    .select(LOG_EVENT_COLUMNS)
    .eq('job_id', job.id)
    .order('created_at', { ascending: true })
    .limit(LOG_EVENT_LIMIT);
  if (error) {
    console.error('[pipeline] job log query failed:', error);
    return dbError('Could not load the build log');
  }

  const lines = flatten((data ?? []) as unknown as LogEventRow[]);

  if (req.nextUrl?.searchParams.get('format') === 'text') {
    const body = lines
      .map((line) => `${clock(line.at)} [${line.source}] ${line.text}`)
      .join('\n');
    return new NextResponse(`${body}\n`, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="build-${job.id}.log"`,
        'Cache-Control': 'private, no-store',
      },
    }) as NextResponse;
  }

  return NextResponse.json(
    { job: { id: job.id, kind: job.kind, status: job.status }, lines },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
