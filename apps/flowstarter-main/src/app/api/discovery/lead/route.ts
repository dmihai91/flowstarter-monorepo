/**
 * POST /api/discovery/lead
 *
 * Best-effort lead capture from the public discovery wizard. Called when the
 * prospect completes the wizard but BEFORE they've booked the call, so we
 * never lose their interest if they bounce on the Calendly step.
 *
 * - No auth required (public wizard).
 * - Per-IP in-memory rate limit.
 * - Sends a notification email to the team (best-effort).
 * - Returns 200 even on email failure so the client can move on to Calendly.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';

/**
 * Untyped service-role client — `discovery_leads` isn't in the generated
 * Database types yet (additive migration). Safe: server-only, service key.
 */
function leadStore() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const TIER = z.enum(['starter', 'pro', 'commerce', 'custom']);

const DiscoveryLeadSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email(),
  businessName: z.string().max(200).optional().default(''),
  industry: z.string().max(200).optional().default(''),
  description: z.string().min(1).max(5000),
  targetAudience: z.string().max(500).optional().default(''),
  // Free-form (chips + freetext, comma-joined) — see discovery.logic.
  goal: z.string().max(400).optional().default(''),
  secondaryGoals: z.array(z.string().max(120)).optional().default([]),
  brandTone: z.string().max(400).optional().default(''),
  pageCount: z.enum(['lt-5', '5-7', '8-15', '15+', 'unsure', '']).optional(),
  timeline: z
    .enum(['asap', '4-weeks', '1-3-months', 'flexible', ''])
    .optional(),
  commerceMode: z
    .enum(['none', 'few-services', 'digital', 'physical', 'mixed', ''])
    .optional(),
  catalogSize: z
    .enum(['na', '1-5', '6-25', '26-100', '100+', 'unsure'])
    .optional(),
  customIntegrations: z.string().max(2000).optional().default(''),
  selectedTier: TIER,
  subscription: z.enum(['starter', 'pro', 'max', '']).optional().default(''),
  source: z.string().max(100).optional().default('cta'),
});

type DiscoveryLead = z.infer<typeof DiscoveryLeadSchema>;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function row(label: string, value: string | undefined): string {
  if (!value) return '';
  return `<tr><td style="padding:6px 12px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;vertical-align:top;white-space:nowrap;">${escapeHtml(
    label
  )}</td><td style="padding:6px 12px;font-size:14px;color:#111827;">${escapeHtml(
    value
  )}</td></tr>`;
}

function buildEmailHtml(lead: DiscoveryLead): string {
  const submittedAt = new Date().toISOString();
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 4px;">New discovery lead</h1>
  <p style="font-size:13px;color:#6b7280;margin:0 0 16px;">Recommended tier: <strong style="color:#7c3aed;">${escapeHtml(
    lead.selectedTier
  )}</strong> · Source: ${escapeHtml(lead.source)}</p>
  <table style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    ${row('Name', lead.fullName)}
    ${row('Email', lead.email)}
    ${row('Business', lead.businessName)}
    ${row('Industry', lead.industry)}
    ${row('Description', lead.description)}
    ${row('Target audience', lead.targetAudience)}
    ${row('Primary goal', lead.goal)}
    ${row('Secondary goals', lead.secondaryGoals?.join(', '))}
    ${row('Brand tone', lead.brandTone)}
    ${row('Page count', lead.pageCount)}
    ${row('Timeline', lead.timeline)}
    ${row('Commerce mode', lead.commerceMode)}
    ${row('Catalog size', lead.catalogSize)}
    ${row('Custom integrations', lead.customIntegrations)}
    ${row('Monthly plan', lead.subscription)}
    ${row('Submitted at', submittedAt)}
  </table>
</div>`;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many submissions' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = DiscoveryLeadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    );
  }

  const lead = result.data;
  const notifyTo =
    process.env.DISCOVERY_LEAD_NOTIFY_EMAIL || 'hello@flowstarter.net';

  // Persist (best-effort) — never block the prospect on a DB hiccup.
  let leadId: string | null = null;
  const store = leadStore();
  if (store) {
    try {
      const { data, error } = await store
        .from('discovery_leads')
        .insert({
          full_name: lead.fullName,
          email: lead.email,
          business_name: lead.businessName || null,
          industry: lead.industry || null,
          description: lead.description,
          target_audience: lead.targetAudience || null,
          goal: lead.goal || null,
          secondary_goals: lead.secondaryGoals?.length
            ? lead.secondaryGoals
            : null,
          brand_tone: lead.brandTone || null,
          page_count: lead.pageCount || null,
          timeline: lead.timeline || null,
          commerce_mode: lead.commerceMode || null,
          catalog_size: lead.catalogSize || null,
          custom_integrations: lead.customIntegrations || null,
          selected_tier: lead.selectedTier,
          subscription: lead.subscription || null,
          source: lead.source || null,
        })
        .select('id')
        .single();
      if (error) throw error;
      leadId = (data as { id: string } | null)?.id ?? null;
    } catch (err) {
      console.error('[discovery/lead] persist failed', err);
    }
  }

  // Fire-and-log: never block the client on email failure
  try {
    await sendEmail({
      to: notifyTo,
      subject: `New discovery lead — ${lead.fullName} (${lead.selectedTier})`,
      html: buildEmailHtml(lead),
      replyTo: lead.email,
    });
  } catch (err) {
    console.error('[discovery/lead] email failed', err);
  }

  return NextResponse.json({ ok: true, leadId });
}
