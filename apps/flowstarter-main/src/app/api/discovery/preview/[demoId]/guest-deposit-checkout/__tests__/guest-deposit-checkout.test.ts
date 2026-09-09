/**
 * The public endpoint that opens Stripe Checkout for a visitor with no account.
 *
 * It is unauthenticated and it creates a charge, so the cases that matter are
 * the ones where a crafted request tries to decide something the server owns:
 * the price, the preview, or how many sessions one IP may mint.
 *
 * Static imports throughout: vi.mock is hoisted above them, and the app's
 * tsconfig does not allow top-level await.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  clearClaimablePreviews,
  rememberClaimablePreview,
} from '@/lib/flowstarter/claim';
import { POST, __resetGuestDepositRateLimit } from '../route';

vi.mock('server-only', () => ({}));

const PREVIEW_ID = 'c1b2c3d4-1111-4111-8111-111111111111';

// ── Stripe ────────────────────────────────────────────────────────────────

interface CapturedSession {
  customer_email: string;
  line_items: Array<{ price_data: { unit_amount: number; currency: string } }>;
  metadata: Record<string, string>;
  payment_intent_data: { metadata: Record<string, string> };
  success_url: string;
  cancel_url: string;
}

const createSessionSpy = vi.fn(async (_params: CapturedSession) => ({
  id: 'cs_test_1',
  url: 'https://checkout.stripe.com/c/pay/cs_test_1',
}));

vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: createSessionSpy } };
  },
}));

vi.mock('@/lib/hosting/funnel-previews', () => ({
  saveFunnelPreview: vi.fn(async () => undefined),
  loadFunnelPreview: vi.fn(async () => null),
  claimFunnelPreview: vi.fn(async () => null),
  copyFunnelArtifactToTenant: vi.fn(async () => undefined),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────

function stashPreview(previewId = PREVIEW_ID) {
  rememberClaimablePreview({
    previewId,
    intake: {
      projectId: previewId,
      business: {
        name: 'Acme Bakery',
        niche: 'Bakery',
        location: 'Dublin',
        description: 'Sourdough, daily.',
      },
      socialMedia: [],
      locale: 'en',
      submittedAt: new Date().toISOString(),
      consent: { publicProfileAnalysis: false, acceptedAt: '' },
    } as never,
    brandConfig: { schemaVersion: '1.0' } as never,
    template: {
      slug: 'astro-service',
      reason: 'best fit',
      matchedSignals: [],
      confidence: 0.9,
    },
    files: [{ path: 'package.json', content: '{}', type: 'file' }],
  });
}

function checkoutRequest(body: Record<string, unknown>, ip = '203.0.113.7') {
  return new NextRequest(
    `http://localhost:3000/api/discovery/preview/${PREVIEW_ID}/guest-deposit-checkout`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }
  );
}

const params = (demoId = PREVIEW_ID) => ({
  params: Promise.resolve({ demoId }),
});

const VALID_BODY = {
  tier: 'pro' as const,
  email: 'Ada@Example.com',
  fullName: 'Ada Baker',
  businessName: 'Acme Bakery',
};

beforeEach(() => {
  clearClaimablePreviews();
  createSessionSpy.mockClear();
  __resetGuestDepositRateLimit();
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
});

describe('POST /api/discovery/preview/[demoId]/guest-deposit-checkout', () => {
  it('prices the deposit from the tier name, server-side', async () => {
    stashPreview();

    const response = await POST(checkoutRequest(VALID_BODY), params());
    const body = (await response.json()) as {
      url: string;
      amountMinor: number;
      currency: string;
    };

    expect(response.status).toBe(200);
    // 20% of the pro tier's published €1,199 setup fee.
    expect(body.amountMinor).toBe(23_980);
    expect(body.currency).toBe('eur');
    expect(body.url).toContain('checkout.stripe.com');

    const session = createSessionSpy.mock.calls[0][0];
    expect(session.line_items[0].price_data.unit_amount).toBe(23_980);
    expect(session.customer_email).toBe('ada@example.com');
    expect(session.success_url).toBe(
      `http://localhost:3000/welcome/${PREVIEW_ID}`
    );
    // The webhook reads the PaymentIntent, so the contract has to be on both.
    expect(session.payment_intent_data.metadata).toEqual(session.metadata);
    expect(session.metadata).toMatchObject({
      kind: 'flowstarter_guest_deposit',
      previewId: PREVIEW_ID,
      email: 'ada@example.com',
      tier: 'pro',
    });
  });

  it('ignores an amount the browser tries to name', async () => {
    stashPreview();

    const response = await POST(
      checkoutRequest({
        ...VALID_BODY,
        amountMinor: 1,
        unit_amount: 1,
        quoteMinor: 1,
        final_value_minor: 1,
      }),
      params()
    );
    const body = (await response.json()) as { amountMinor: number };

    expect(response.status).toBe(200);
    expect(body.amountMinor).toBe(23_980);
    const session = createSessionSpy.mock.calls[0][0];
    expect(session.line_items[0].price_data.unit_amount).toBe(23_980);
  });

  it('rejects a tier that is not one of the published four', async () => {
    stashPreview();

    const response = await POST(
      checkoutRequest({ ...VALID_BODY, tier: 'free' }),
      params()
    );

    expect(response.status).toBe(400);
    expect(createSessionSpy).not.toHaveBeenCalled();
  });

  it('rejects a request with no tier at all', async () => {
    stashPreview();

    const { tier: _tier, ...withoutTier } = VALID_BODY;
    const response = await POST(checkoutRequest(withoutTier), params());

    expect(response.status).toBe(400);
    expect(createSessionSpy).not.toHaveBeenCalled();
  });

  it('rejects an email it could never create an account against', async () => {
    stashPreview();

    const response = await POST(
      checkoutRequest({ ...VALID_BODY, email: 'not-an-address' }),
      params()
    );

    expect(response.status).toBe(400);
    expect(createSessionSpy).not.toHaveBeenCalled();
  });

  it('refuses to charge for a preview that no longer exists', async () => {
    // Nothing stashed. Taking money for a build with no source is the one
    // failure this endpoint exists to prevent.
    const response = await POST(checkoutRequest(VALID_BODY), params());

    expect(response.status).toBe(404);
    expect(createSessionSpy).not.toHaveBeenCalled();
  });

  it('rejects a preview id that is not a uuid', async () => {
    const response = await POST(
      checkoutRequest(VALID_BODY),
      params('../../etc/passwd')
    );

    expect(response.status).toBe(400);
    expect(createSessionSpy).not.toHaveBeenCalled();
  });

  it('rate limits one IP after five attempts a minute', async () => {
    stashPreview();

    for (let attempt = 0; attempt < 5; attempt++) {
      const ok = await POST(checkoutRequest(VALID_BODY), params());
      expect(ok.status).toBe(200);
    }

    const blocked = await POST(checkoutRequest(VALID_BODY), params());
    expect(blocked.status).toBe(429);
    expect(createSessionSpy).toHaveBeenCalledTimes(5);

    // A different visitor is unaffected.
    const other = await POST(
      checkoutRequest(VALID_BODY, '198.51.100.4'),
      params()
    );
    expect(other.status).toBe(200);
  });

  it('says so rather than dead-ending when Stripe is not configured', async () => {
    stashPreview();
    vi.stubEnv('STRIPE_SECRET_KEY', '');

    const response = await POST(checkoutRequest(VALID_BODY), params());

    expect(response.status).toBe(503);
    expect(createSessionSpy).not.toHaveBeenCalled();
  });
});
