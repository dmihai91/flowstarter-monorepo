/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI Audit Logging
 *
 * Privacy-conscious audit logging for AI operations.
 * NO PII is stored - user IDs are hashed for correlation only.
 *
 * What we DON'T store:
 * - IP addresses
 * - User agents
 * - Email addresses
 * - Usernames
 *
 * What we DO store:
 * - Anonymized user hash
 * - Route, agent, action
 * - Encrypted payload (for debugging)
 */

import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';

// AES-GCM encryption with Web Crypto (Node 18+)
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Anonymize user ID with a one-way hash
 * Same salt as security audit for consistency
 */
function anonymizeUserId(userId: string | null): string {
  if (!userId || userId === 'anonymous') return 'anonymous';

  const salt = process.env.AUDIT_HASH_SALT || 'flowstarter-audit';
  return createHash('sha256')
    .update(`${salt}:${userId}`)
    .digest('hex')
    .substring(0, 16);
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptJSONString(payload: unknown): Promise<string> {
  const secret = process.env.AI_AUDIT_ENC_KEY || '';
  if (!secret || secret.length < 16) {
    throw new Error('AI_AUDIT_ENC_KEY not configured');
  }
  const key = await importKey(secret.padEnd(32, '0').slice(0, 32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = encoder.encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(cipher).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return Buffer.from(combined).toString('base64');
}

export async function decryptJSONString(b64: string): Promise<any> {
  const secret = process.env.AI_AUDIT_ENC_KEY || '';
  if (!secret || secret.length < 16) {
    throw new Error('AI_AUDIT_ENC_KEY not configured');
  }
  const raw = Buffer.from(b64, 'base64');
  const iv = raw.subarray(0, 12);
  const cipher = raw.subarray(12);
  const key = await importKey(secret.padEnd(32, '0').slice(0, 32));
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipher
  );
  return JSON.parse(decoder.decode(new Uint8Array(plain)));
}

export type AuditPayload = {
  context?: Record<string, any>;
  result?: Record<string, any> | null;
  status?: 'ok' | 'error';
  meta?: Record<string, any>;
};

export async function saveAuditLog(args: {
  userId: string;
  route?: string | null;
  agent?: string | null;
  action?: string | null;
  projectId?: string | null;
  pipelineId?: string | null;
  payload: AuditPayload;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const encrypted = await encryptJSONString(args.payload);

  // Store anonymized user hash instead of actual user ID
  const userHash = anonymizeUserId(args.userId);

  const { error } = await supabase.from('ai_audit_logs').insert({
    user_id: userHash, // Now stores hash, not actual ID
    username: null, // No longer stored
    ip: null, // No longer stored
    user_agent: null, // No longer stored
    route: args.route || null,
    agent: args.agent || null,
    action: args.action || null,
    project_id: args.projectId || null,
    pipeline_id: args.pipelineId || null,
    encrypted_payload: encrypted,
  });
  if (error) throw error;
}

export async function auditAiEvent(args: {
  req: NextRequest;
  userId?: string | null;
  route: string;
  agent: string;
  action: string;
  projectId?: string | null;
  pipelineId?: string | null;
  context?: Record<string, any>;
  result?: Record<string, any> | null;
  status?: 'ok' | 'error';
  sessionClaims?: unknown;
  meta?: Record<string, any>;
}) {
  // No longer extract PII from request or session
  // IP, user agent, and username are intentionally not collected

  await saveAuditLog({
    userId: args.userId || 'anonymous',
    route: args.route,
    agent: args.agent,
    action: args.action,
    projectId: args.projectId ?? null,
    pipelineId: args.pipelineId ?? null,
    payload: {
      context: args.context,
      result: args.result ?? null,
      status: args.status ?? 'ok',
      meta: args.meta,
    },
  });
}
