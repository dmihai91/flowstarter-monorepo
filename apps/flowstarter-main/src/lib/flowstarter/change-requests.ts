/**
 * A change request as priced work.
 *
 * The editor's escalation files the client's ask into the project thread;
 * this is the same ask with a quote, an acceptance and a payment attached,
 * moving requested → quoted → accepted → paid → done, or to declined by
 * either side. The transitions are a table, not a model, and every write
 * checks the row's current status so two clicks cannot race a quote past
 * its payment.
 *
 * Money is minor units in the workspace's currency, the way every other
 * amount in this repo is stored. The suggested quote is a rule table over the
 * classifier's own labels: it pre-fills the operator's form and nothing else;
 * a human writes the number the client sees.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/database.types';
import {
  classifyChangeRequest,
  type ChangeRequestClassification,
} from './change-request';

type Db = SupabaseClient<Database>;

export const CHANGE_REQUEST_STATUSES = [
  'requested',
  'quoted',
  'accepted',
  'paid',
  'declined',
  'done',
] as const;
export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

/** Who may move a request from one status to the next. */
export const CHANGE_REQUEST_TRANSITIONS: ReadonlyArray<{
  from: ChangeRequestStatus;
  to: ChangeRequestStatus;
  by: 'operator' | 'client' | 'stripe';
}> = [
  { from: 'requested', to: 'quoted', by: 'operator' },
  { from: 'quoted', to: 'quoted', by: 'operator' }, // re-quote
  { from: 'requested', to: 'declined', by: 'operator' },
  { from: 'quoted', to: 'declined', by: 'operator' },
  { from: 'quoted', to: 'declined', by: 'client' },
  { from: 'quoted', to: 'accepted', by: 'client' },
  { from: 'accepted', to: 'accepted', by: 'client' }, // a fresh checkout
  { from: 'quoted', to: 'paid', by: 'client' }, // a zero quote: nothing to pay
  { from: 'accepted', to: 'paid', by: 'stripe' },
  { from: 'paid', to: 'done', by: 'operator' },
];

export function canTransition(
  from: string,
  to: ChangeRequestStatus,
  by: 'operator' | 'client' | 'stripe'
): boolean {
  return CHANGE_REQUEST_TRANSITIONS.some(
    (t) => t.from === from && t.to === to && t.by === by
  );
}

/** Largest quote the form accepts: €100,000, same ceiling as the project quote. */
export const MAX_CHANGE_QUOTE_MINOR = 100_000_00;

/**
 * A starting number for the operator, from the labels the classifier fired.
 * The highest matching rule wins; an unclassified structural request gets
 * the base rate. Minor units, EUR.
 */
const SUGGESTED_QUOTE_MINOR: ReadonlyArray<{ label: string; minor: number }> = [
  { label: 'structural:platform', minor: 24_000 },
  { label: 'structural:new-thing', minor: 19_000 },
  { label: 'structural:relayout', minor: 12_000 },
  { label: 'structural:theme', minor: 9_000 },
  { label: 'structural:behaviour', minor: 4_000 },
  { label: 'image:media-swap', minor: 3_000 },
];
const BASE_QUOTE_MINOR = 9_000;

export function suggestQuoteMinor(matched: readonly string[]): number {
  const hits = SUGGESTED_QUOTE_MINOR.filter((rule) =>
    matched.includes(rule.label)
  );
  if (hits.length === 0) return BASE_QUOTE_MINOR;
  return Math.max(...hits.map((rule) => rule.minor));
}

export interface ChangeRequestRow {
  id: string;
  workspace_id: string;
  message_id: string | null;
  request: string;
  classification: string;
  matched_rules: unknown;
  status: string;
  quote_minor: number | null;
  currency: string;
  quote_note: string | null;
  quoted_by: string | null;
  quoted_at: string | null;
  responded_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const CHANGE_REQUEST_COLUMNS =
  'id, workspace_id, message_id, request, classification, matched_rules, status, ' +
  'quote_minor, currency, quote_note, quoted_by, quoted_at, responded_at, ' +
  'stripe_checkout_session_id, stripe_payment_intent_id, paid_at, completed_at, ' +
  'created_by, created_at, updated_at';

/** What both the client editor and the operator board render. */
export interface ChangeRequestView {
  id: string;
  request: string;
  classification: string;
  matchedRules: string[];
  status: ChangeRequestStatus;
  quoteMinor: number | null;
  currency: string;
  quoteNote: string | null;
  quotedAt: string | null;
  respondedAt: string | null;
  paidAt: string | null;
  completedAt: string | null;
  createdAt: string;
  /** Operator-only: the rule table's opening number. */
  suggestedQuoteMinor?: number;
}

export function toChangeRequestView(
  row: ChangeRequestRow,
  options: { forOperator?: boolean } = {}
): ChangeRequestView {
  const matchedRules = Array.isArray(row.matched_rules)
    ? row.matched_rules.filter((r): r is string => typeof r === 'string')
    : [];
  return {
    id: row.id,
    request: row.request,
    classification: row.classification,
    matchedRules,
    status: (CHANGE_REQUEST_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as ChangeRequestStatus)
      : 'requested',
    quoteMinor: row.quote_minor,
    currency: row.currency,
    quoteNote: row.quote_note,
    quotedAt: row.quoted_at,
    respondedAt: row.responded_at,
    paidAt: row.paid_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    ...(options.forOperator
      ? { suggestedQuoteMinor: suggestQuoteMinor(matchedRules) }
      : {}),
  };
}

export class ChangeRequestError extends Error {
  constructor(message: string, readonly code: string, readonly status: number) {
    super(message);
  }
}

export async function createChangeRequest(
  db: Db,
  input: {
    workspaceId: string;
    request: string;
    classification: ChangeRequestClassification;
    messageId: string | null;
    createdBy: string;
    currency?: string;
  }
): Promise<ChangeRequestRow> {
  const { data, error } = await db
    .from('flowstarter_change_requests')
    .insert({
      workspace_id: input.workspaceId,
      message_id: input.messageId,
      request: input.request.trim(),
      classification: input.classification.capability,
      matched_rules: input.classification.matched as unknown as Json,
      status: 'requested',
      currency: input.currency ?? 'eur',
      created_by: input.createdBy,
    })
    .select(CHANGE_REQUEST_COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as ChangeRequestRow;
}

export async function listChangeRequests(
  db: Db,
  workspaceId: string
): Promise<ChangeRequestRow[]> {
  const { data, error } = await db
    .from('flowstarter_change_requests')
    .select(CHANGE_REQUEST_COLUMNS)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as ChangeRequestRow[];
}

export async function getChangeRequest(
  db: Db,
  workspaceId: string,
  id: string
): Promise<ChangeRequestRow | null> {
  const { data, error } = await db
    .from('flowstarter_change_requests')
    .select(CHANGE_REQUEST_COLUMNS)
    .eq('workspace_id', workspaceId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as ChangeRequestRow | null) ?? null;
}

/**
 * Compare-and-set on the status read moments ago, so a second click or a
 * webhook arriving mid-request cannot skip a step.
 */
async function move(
  db: Db,
  row: ChangeRequestRow,
  to: ChangeRequestStatus,
  by: 'operator' | 'client' | 'stripe',
  patch: Record<string, unknown>
): Promise<ChangeRequestRow> {
  if (!canTransition(row.status, to, by)) {
    throw new ChangeRequestError(
      `A ${row.status} request cannot be marked ${to} by the ${by}.`,
      'CHANGE_REQUEST_TRANSITION',
      409
    );
  }
  const { data, error } = await db
    .from('flowstarter_change_requests')
    .update({ ...patch, status: to, updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('status', row.status)
    .select(CHANGE_REQUEST_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new ChangeRequestError(
      'This request changed while you were looking at it. Reload and try again.',
      'CHANGE_REQUEST_STALE',
      409
    );
  }
  return data as unknown as ChangeRequestRow;
}

export function quoteChangeRequest(
  db: Db,
  row: ChangeRequestRow,
  input: { amountMinor: number; note: string | null; quotedBy: string }
) {
  if (
    !Number.isInteger(input.amountMinor) ||
    input.amountMinor < 0 ||
    input.amountMinor > MAX_CHANGE_QUOTE_MINOR
  ) {
    throw new ChangeRequestError(
      'The quote must be between 0 and 100,000.',
      'CHANGE_REQUEST_AMOUNT',
      400
    );
  }
  return move(db, row, 'quoted', 'operator', {
    quote_minor: input.amountMinor,
    quote_note: input.note,
    quoted_by: input.quotedBy,
    quoted_at: new Date().toISOString(),
    responded_at: null,
    stripe_checkout_session_id: null,
  });
}

export function declineChangeRequest(
  db: Db,
  row: ChangeRequestRow,
  by: 'operator' | 'client'
) {
  return move(db, row, 'declined', by, {
    responded_at: new Date().toISOString(),
  });
}

/** A zero quote needs no Stripe: accepting it is paying it. */
export function acceptFreeChangeRequest(db: Db, row: ChangeRequestRow) {
  const now = new Date().toISOString();
  return move(db, row, 'paid', 'client', {
    responded_at: now,
    paid_at: now,
  });
}

export function acceptChangeRequest(
  db: Db,
  row: ChangeRequestRow,
  checkoutSessionId: string
) {
  return move(db, row, 'accepted', 'client', {
    responded_at: new Date().toISOString(),
    stripe_checkout_session_id: checkoutSessionId,
  });
}

export function markChangeRequestPaid(
  db: Db,
  row: ChangeRequestRow,
  input: { paymentIntentId: string | null }
) {
  return move(db, row, 'paid', 'stripe', {
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id: input.paymentIntentId,
  });
}

export function completeChangeRequest(db: Db, row: ChangeRequestRow) {
  return move(db, row, 'done', 'operator', {
    completed_at: new Date().toISOString(),
  });
}

/** Re-runs the classifier; exported so callers do not import two modules. */
export { classifyChangeRequest };
