import 'server-only';
/**
 * The project thread.
 *
 * GET  — the whole conversation, oldest first.
 * POST — one message. **Direction is never read from the body.** It is derived
 *        from the caller's role as `requireWorkspaceAccess` resolved it:
 *        `via: 'membership'` is the client, so the message is inbound;
 *        `via: 'team'` is an operator, so it is outbound. A client who posts
 *        `{"direction":"outbound"}` gets an inbound message, because the field
 *        is not in the schema and never reaches the writer.
 *
 * Every handler authorizes against the workspace id in the path before it
 * touches a service-role query — those bypass RLS, so this check is the only
 * thing between a member of workspace A and workspace B's thread.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireWorkspaceAccess } from '@/lib/api-auth';
import {
  MAX_MESSAGE_BODY_CHARS,
  MessagingError,
  listProjectMessages,
  recordClientReply,
  sendProjectMessage,
} from '@/lib/flowstarter/messaging';

/**
 * `direction` is intentionally absent. `.strict()` would 400 a client that
 * sends one; instead the field is silently ignored, which is the behaviour a
 * forged request deserves and which the tests assert on.
 */
const PostSchema = z.object({
  body: z.string().trim().min(1).max(MAX_MESSAGE_BODY_CHARS),
  /** Operators only; a client's message is always a `client_reply`. */
  kind: z.enum(['clarification', 'reminder']).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const access = await requireWorkspaceAccess(workspaceId);
  if (!access.authorized) return access.response;

  try {
    const messages = await listProjectMessages(access.workspaceId);
    return NextResponse.json({ messages });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const access = await requireWorkspaceAccess(workspaceId);
  if (!access.authorized) return access.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  try {
    if (access.via === 'team') {
      const result = await sendProjectMessage({
        workspaceId: access.workspaceId,
        kind: parsed.data.kind ?? 'clarification',
        body: parsed.data.body,
        createdBy: access.userId,
      });
      return NextResponse.json(
        {
          messageId: result.messageId,
          direction: 'outbound',
          emailed: result.emailed,
        },
        { status: 201 }
      );
    }

    const result = await recordClientReply({
      workspaceId: access.workspaceId,
      body: parsed.data.body,
      clerkUserId: access.userId,
    });
    return NextResponse.json(
      {
        messageId: result.messageId,
        direction: 'inbound',
        answeredMessageId: result.answeredMessageId,
        sourceId: result.document.sourceId,
      },
      { status: 201 }
    );
  } catch (error) {
    return failure(error);
  }
}

/**
 * A `MessagingError` is a caller's fault and safe to name. Anything else is
 * ours, and its text may carry a connection string or a provider payload, so
 * only the shape of the failure crosses the wire.
 */
function failure(error: unknown): NextResponse {
  if (error instanceof MessagingError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error('[api/projects/messages] failed', error);
  return NextResponse.json({ error: 'Request failed' }, { status: 500 });
}
