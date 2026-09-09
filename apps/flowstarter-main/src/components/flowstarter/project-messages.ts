/**
 * The message shapes and normalisers shared by the thread UI and the server
 * pages that render the same rows. This module is intentionally free of
 * 'use client': importing it from a server component must never pull the
 * interactive thread in with it — doing exactly that 500'd the client
 * dashboard, because a client-module export cannot be called during server
 * rendering.
 */

export type ProjectMessageDirection = 'outbound' | 'inbound';
export type ProjectMessageKind =
  | 'asset_request'
  | 'clarification'
  | 'reminder'
  | 'client_reply';
export type ProjectMessageStatus = 'sent' | 'answered' | 'expired';

/**
 * One item a message asks for.
 *
 * `lib/flowstarter/sufficiency.ts` produces `{code, severity, message,
 * affects}`, so `message` is what a client should read. The other keys are
 * kept because the classifier owns this shape and has changed it once already;
 * `askLabel` reads whichever is populated rather than depending on one key.
 */
export interface ProjectAsk {
  id?: string;
  code?: string;
  message?: string;
  label?: string;
  title?: string;
  name?: string;
  description?: string;
  kind?: string;
  severity?: string;
  [key: string]: unknown;
}

export interface ProjectMessage {
  id: string;
  workspace_id: string;
  direction: ProjectMessageDirection;
  kind: ProjectMessageKind;
  body: string | null;
  asks: ProjectAsk[];
  status: ProjectMessageStatus;
  sent_at: string | null;
  answered_at: string | null;
  created_by: string | null;
  created_at: string;
}

export function askLabel(ask: ProjectAsk): string {
  const candidate =
    ask.message ??
    ask.label ??
    ask.title ??
    ask.name ??
    ask.description ??
    ask.kind;
  if (typeof candidate === 'string' && candidate.trim())
    return candidate.trim();
  return 'Something we asked for';
}

/**
 * One message, in one casing.
 *
 * Two sources feed this component and they disagree: a server component hands
 * it raw `project_messages` rows (snake_case), while
 * `GET /api/projects/[workspaceId]/messages` serialises the messaging
 * library's camelCase view. Normalising on the way in means the render path
 * and the sort have exactly one set of field names to know about.
 */
export function normalizeMessage(input: unknown): ProjectMessage | null {
  if (!input || typeof input !== 'object') return null;
  const row = input as Record<string, unknown>;
  const id = row.id;
  if (typeof id !== 'string' || !id) return null;

  const pick = (snake: string, camel: string): string | null => {
    const value = row[snake] ?? row[camel];
    return typeof value === 'string' && value ? value : null;
  };

  return {
    id,
    workspace_id: pick('workspace_id', 'workspaceId') ?? '',
    direction: row.direction === 'inbound' ? 'inbound' : 'outbound',
    kind: (row.kind as ProjectMessageKind) ?? 'clarification',
    body: typeof row.body === 'string' ? row.body : null,
    asks: Array.isArray(row.asks) ? (row.asks as ProjectAsk[]) : [],
    status: (row.status as ProjectMessageStatus) ?? 'sent',
    sent_at: pick('sent_at', 'sentAt'),
    answered_at: pick('answered_at', 'answeredAt'),
    created_by: pick('created_by', 'createdBy'),
    created_at: pick('created_at', 'createdAt') ?? '',
  };
}

/**
 * Accepts every reasonable envelope the messaging API might use — a bare
 * array, `{messages}` or `{data}` — so a shape change on the other side
 * degrades to an empty thread rather than a crash.
 */
export function messagesFromPayload(payload: unknown): ProjectMessage[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { messages?: unknown })?.messages)
    ? (payload as { messages: unknown[] }).messages
    : Array.isArray((payload as { data?: unknown })?.data)
    ? (payload as { data: unknown[] }).data
    : [];
  return list
    .map(normalizeMessage)
    .filter((message): message is ProjectMessage => message !== null);
}

export function messageFromPayload(payload: unknown): ProjectMessage | null {
  if (payload && typeof payload === 'object') {
    const wrapped = (payload as { message?: unknown }).message;
    if (wrapped && typeof wrapped === 'object' && 'id' in wrapped) {
      return wrapped as ProjectMessage;
    }
    if ('id' in (payload as Record<string, unknown>)) {
      return payload as ProjectMessage;
    }
  }
  return null;
}

export function formatWhen(message: ProjectMessage): string {
  const iso = message.sent_at ?? message.created_at;
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Who a message came from, in words, from the viewer's point of view. */
export function senderLabel(
  direction: ProjectMessageDirection,
  viewerSide: 'client' | 'operator'
): string {
  if (viewerSide === 'client') {
    return direction === 'outbound' ? 'Flowstarter' : 'You';
  }
  return direction === 'outbound' ? 'You' : 'Client';
}
