/**
 * Integration tests for the billing API endpoints.
 *
 * Mocks Stripe SDK + Supabase service-role client so we exercise the full
 * route logic (auth, validation, ensure-customer, persist, error mapping)
 * without hitting Stripe live.
 *
 * Tests the 20/80 + subscription flow end-to-end:
 *   1. POST /api/team/projects/[id]/billing/deposit-invoice
 *   2. POST /api/team/projects/[id]/billing/final-invoice
 *   3. POST /api/team/projects/[id]/billing/activate-subscription
 *   4. POST /api/team/projects/[id]/billing/cancel-subscription
 *   5. POST /api/team/projects/[id]/billing/portal-link
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// ─── Stripe SDK mock ────────────────────────────────────────────────────────
const stripeMock = {
  customers: { create: vi.fn() },
  invoices: { create: vi.fn(), finalizeInvoice: vi.fn() },
  invoiceItems: { create: vi.fn() },
  subscriptions: {
    create: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
  },
  billingPortal: { sessions: { create: vi.fn() } },
};

vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      customers = stripeMock.customers;
      invoices = stripeMock.invoices;
      invoiceItems = stripeMock.invoiceItems;
      subscriptions = stripeMock.subscriptions;
      billingPortal = stripeMock.billingPortal;
    },
  };
});

// ─── Supabase mock ──────────────────────────────────────────────────────────
type SbBuilder = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  insert?: ReturnType<typeof vi.fn>;
  single?: ReturnType<typeof vi.fn>;
};
const supabaseMock = {
  from: vi.fn(),
};

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => supabaseMock,
}));

// ─── Auth mock ──────────────────────────────────────────────────────────────
vi.mock('@/lib/api-auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api-auth')>(
    '@/lib/api-auth'
  );
  return {
    ...actual,
    requireTeamAuth: async () => ({
      authorized: true as const,
      userId: 'user_team_1',
      role: 'team' as const,
    }),
  };
});

// ─── platform-config mock (for portal-link safe-redirect check) ─────────────
vi.mock('@flowstarter/platform-config', () => ({
  getMainUrl: () => 'https://flowstarter.dev',
}));

// ─── Helpers ────────────────────────────────────────────────────────────────
function setupProjectFetch(project: Record<string, unknown> | null) {
  const builder: SbBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: project, error: null }),
    update: vi.fn(),
  };
  supabaseMock.from.mockReturnValue(builder);
  return builder;
}

function setupProjectFetchAndUpdate(project: Record<string, unknown> | null) {
  const updateChain = {
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  const builder: SbBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: project, error: null }),
    update: vi.fn().mockReturnValue(updateChain),
  };
  supabaseMock.from.mockReturnValue(builder);
  return { builder, updateChain };
}

function makeReq(body: unknown, url = 'https://example.com/test'): NextRequest {
  return {
    json: async () => body,
    url,
    headers: new Headers(),
  } as unknown as NextRequest;
}

const baseProject = {
  id: 'proj_1',
  user_id: 'user_1',
  client_email: 'client@example.com',
  client_name: 'Ana Pop',
  client_business_name: 'Acme Coaching',
  setup_fee: 799,
  monthly_fee: 49,
  billing_interval: 'monthly',
  stripe_customer_id: null,
  stripe_subscription_id: null,
  subscription_status: null,
  subscription_trial_ends: null,
  deposit_status: null,
  deposit_invoice_id: null,
  final_status: null,
  final_invoice_id: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(stripeMock).forEach((group) => {
    if (typeof group === 'object' && group !== null) {
      Object.values(group).forEach((fn) => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
          (fn as ReturnType<typeof vi.fn>).mockReset();
        } else if (typeof fn === 'object' && fn !== null) {
          // sessions.create etc.
          Object.values(fn).forEach((nested) => {
            if (typeof nested === 'function' && 'mockReset' in nested) {
              (nested as ReturnType<typeof vi.fn>).mockReset();
            }
          });
        }
      });
    }
  });
  supabaseMock.from.mockReset();
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
});

describe('POST /api/team/projects/[id]/billing/deposit-invoice', () => {
  it('creates customer + invoice on first call, persists IDs', async () => {
    setupProjectFetchAndUpdate({ ...baseProject });
    stripeMock.customers.create.mockResolvedValue({ id: 'cus_new' });
    stripeMock.invoices.create.mockResolvedValue({ id: 'in_draft' });
    stripeMock.invoiceItems.create.mockResolvedValue({});
    stripeMock.invoices.finalizeInvoice.mockResolvedValue({
      id: 'in_final',
      hosted_invoice_url: 'https://invoice.stripe.com/abc',
      status: 'open',
    });

    const { POST } = await import(
      '../../../[id]/billing/deposit-invoice/route'
    );
    const res = await POST(makeReq({}), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.invoice.id).toBe('in_final');
    expect(body.invoice.hostedUrl).toBe('https://invoice.stripe.com/abc');
    expect(body.invoice.amountMinor).toBe(15980); // €799 × 0.2 × 100
    expect(stripeMock.customers.create).toHaveBeenCalledOnce();
    expect(stripeMock.invoices.create).toHaveBeenCalledOnce();
    expect(stripeMock.invoiceItems.create).toHaveBeenCalledOnce();
    expect(stripeMock.invoices.finalizeInvoice).toHaveBeenCalledWith(
      'in_draft'
    );
  });

  it('refuses if deposit already paid', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      stripe_customer_id: 'cus_existing',
      deposit_status: 'paid',
    });

    const { POST } = await import(
      '../../../[id]/billing/deposit-invoice/route'
    );
    const res = await POST(makeReq({}), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(409);
  });

  it('returns 400 when setup_fee is missing and no amount in body', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      setup_fee: 0,
      stripe_customer_id: 'cus_existing',
    });
    const { POST } = await import(
      '../../../[id]/billing/deposit-invoice/route'
    );
    const res = await POST(makeReq({}), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(400);
    expect(stripeMock.invoices.create).not.toHaveBeenCalled();
  });

  it('returns 500 when STRIPE_SECRET_KEY is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { POST } = await import(
      '../../../[id]/billing/deposit-invoice/route'
    );
    const res = await POST(makeReq({}), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(500);
  });
});

describe('POST /api/team/projects/[id]/billing/final-invoice', () => {
  it('refuses if deposit not yet paid', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      stripe_customer_id: 'cus_existing',
      deposit_status: 'sent',
    });
    const { POST } = await import('../../../[id]/billing/final-invoice/route');
    const res = await POST(makeReq({}), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.deposit_status).toBe('sent');
  });

  it('creates the remaining 80% when deposit is paid', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      stripe_customer_id: 'cus_existing',
      deposit_status: 'paid',
    });
    stripeMock.invoices.create.mockResolvedValue({ id: 'in_draft2' });
    stripeMock.invoiceItems.create.mockResolvedValue({});
    stripeMock.invoices.finalizeInvoice.mockResolvedValue({
      id: 'in_final2',
      hosted_invoice_url: 'https://invoice.stripe.com/def',
      status: 'open',
    });
    const { POST } = await import('../../../[id]/billing/final-invoice/route');
    const res = await POST(makeReq({}), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invoice.amountMinor).toBe(63920); // remaining 80%
    expect(stripeMock.invoices.create).toHaveBeenCalledOnce();
  });

  it('refuses if final already paid', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      stripe_customer_id: 'cus_existing',
      deposit_status: 'paid',
      final_status: 'paid',
    });
    const { POST } = await import('../../../[id]/billing/final-invoice/route');
    const res = await POST(makeReq({}), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/team/projects/[id]/billing/activate-subscription', () => {
  beforeEach(() => {
    process.env.STRIPE_CONCIERGE_PRODUCT_ID = 'prod_test_concierge';
  });

  it('refuses when both invoices not yet paid', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      stripe_customer_id: 'cus_existing',
      deposit_status: 'paid',
      final_status: 'sent', // not paid
    });
    const { POST } = await import(
      '../../../[id]/billing/activate-subscription/route'
    );
    const res = await POST(makeReq({}), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(409);
    expect(stripeMock.subscriptions.create).not.toHaveBeenCalled();
  });

  it('creates subscription with 30-day trial when both invoices paid', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      stripe_customer_id: 'cus_existing',
      deposit_status: 'paid',
      final_status: 'paid',
    });
    stripeMock.subscriptions.create.mockResolvedValue({
      id: 'sub_1',
      status: 'trialing',
      trial_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      items: {
        data: [
          { current_period_end: Math.floor(Date.now() / 1000) + 60 * 86400 },
        ],
      },
    });
    const { POST } = await import(
      '../../../[id]/billing/activate-subscription/route'
    );
    const res = await POST(makeReq({}), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(200);
    const arg = stripeMock.subscriptions.create.mock.calls[0]?.[0];
    expect(arg).toMatchObject({
      customer: 'cus_existing',
      trial_period_days: 30,
      metadata: { workspaceId: 'proj_1' },
    });
    expect(arg?.items[0].price_data.unit_amount).toBe(4900); // €49 × 100
    expect(arg?.items[0].price_data.product).toBe('prod_test_concierge');
  });

  it('honours ?force=true even with unpaid invoices', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      stripe_customer_id: 'cus_existing',
      deposit_status: null,
      final_status: null,
    });
    stripeMock.subscriptions.create.mockResolvedValue({
      id: 'sub_force',
      status: 'trialing',
      trial_end: null,
      items: { data: [{ current_period_end: null }] },
    });
    const { POST } = await import(
      '../../../[id]/billing/activate-subscription/route'
    );
    const res = await POST(makeReq({}, 'https://example.com/?force=true'), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(200);
    expect(stripeMock.subscriptions.create).toHaveBeenCalledOnce();
  });
});

describe('POST /api/team/projects/[id]/billing/cancel-subscription', () => {
  it('cancels at period end by default', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      stripe_customer_id: 'cus_existing',
      stripe_subscription_id: 'sub_active',
    });
    stripeMock.subscriptions.update.mockResolvedValue({
      id: 'sub_active',
      status: 'active',
      cancel_at_period_end: true,
    });
    const { POST } = await import(
      '../../../[id]/billing/cancel-subscription/route'
    );
    const res = await POST(makeReq({}), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subscription.cancelAtPeriodEnd).toBe(true);
    expect(stripeMock.subscriptions.update).toHaveBeenCalledWith('sub_active', {
      cancel_at_period_end: true,
    });
    expect(stripeMock.subscriptions.cancel).not.toHaveBeenCalled();
  });

  it('cancels immediately with ?immediate=true', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      stripe_customer_id: 'cus_existing',
      stripe_subscription_id: 'sub_active',
    });
    stripeMock.subscriptions.cancel.mockResolvedValue({
      id: 'sub_active',
      status: 'canceled',
      cancel_at_period_end: false,
    });
    const { POST } = await import(
      '../../../[id]/billing/cancel-subscription/route'
    );
    const res = await POST(makeReq({}, 'https://example.com/?immediate=true'), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(200);
    expect(stripeMock.subscriptions.cancel).toHaveBeenCalledWith('sub_active');
  });

  it('returns 404 when project has no subscription', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      stripe_customer_id: 'cus_existing',
      stripe_subscription_id: null,
    });
    const { POST } = await import(
      '../../../[id]/billing/cancel-subscription/route'
    );
    const res = await POST(makeReq({}), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/team/projects/[id]/billing/portal-link', () => {
  it('creates portal session and returns URL', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      stripe_customer_id: 'cus_existing',
    });
    stripeMock.billingPortal.sessions.create.mockResolvedValue({
      url: 'https://billing.stripe.com/p/session/xyz',
    });
    const { POST } = await import('../../../[id]/billing/portal-link/route');
    const res = await POST(makeReq({}), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe('https://billing.stripe.com/p/session/xyz');
  });

  it('rejects unsafe returnUrl (open redirect)', async () => {
    setupProjectFetchAndUpdate({
      ...baseProject,
      stripe_customer_id: 'cus_existing',
    });
    stripeMock.billingPortal.sessions.create.mockResolvedValue({
      url: 'https://billing.stripe.com/p/session/xyz',
    });
    const { POST } = await import('../../../[id]/billing/portal-link/route');
    await POST(makeReq({ returnUrl: 'https://attacker.com/evil' }), {
      params: Promise.resolve({ id: 'proj_1' }),
    });
    const arg = stripeMock.billingPortal.sessions.create.mock.calls[0]?.[0];
    // returnUrl should fall back to platform URL, not the attacker URL
    const returnHost = new URL(arg?.return_url).hostname;
    expect(
      returnHost === 'flowstarter.dev' ||
        returnHost.endsWith('.flowstarter.dev')
    ).toBe(true);
  });
});
