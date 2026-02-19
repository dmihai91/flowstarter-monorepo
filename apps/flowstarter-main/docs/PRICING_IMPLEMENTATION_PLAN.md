# Flowstarter Pricing System Implementation Plan

## Overview

This document outlines the complete implementation plan for Flowstarter's pricing and subscription system using **Clerk Billing** with **Stripe** as the payment processor.

## Architecture Decision

### Why Clerk Billing?

1. **Already using Clerk** - `@clerk/nextjs` is already integrated for authentication
2. **Zero-integration billing** - Prebuilt components (`<PricingTable />`, billing portal)
3. **Entitlement management** - Built-in `has()` helper for feature gating
4. **Session-aware** - Subscriptions tied to authenticated users
5. **Low overhead** - Only 0.7% additional fee on top of Stripe's processing

### Hybrid Approach for Credits

Clerk Billing doesn't yet support usage-based/metered billing (on roadmap). We'll use:
- **Clerk Billing** → Subscription management (plans, billing cycles)
- **Supabase** → Credit tracking, usage logging
- **Stripe** → Credit pack purchases (one-time payments)

---

## Pricing Structure

### Subscription Tiers

| Tier | Monthly | Yearly | Credits | Sites | Credit Discount |
|------|---------|--------|---------|-------|-----------------|
| **Free** | $0 | $0 | 50 (lifetime) | 1 | None |
| **Starter** | $15 | $144 ($12/mo) | 300/month | 3 | 10% |
| **Pro** | $25 | $240 ($20/mo) | 800/month | 10 | 20% |
| **Business** | $45 | $456 ($38/mo) | 2,000/month | ∞ | 25% |

### Credit Packs (One-Time Purchase)

| Pack | Base Price | Credits |
|------|------------|---------|
| Small | $5 | 300 |
| Medium | $15 | 1,000 |
| Large | $40 | 3,000 |

---

## Phase 1: Database Schema

### New Supabase Tables

```sql
-- Migration: 20260125000000_subscriptions_and_credits.sql

-- User subscriptions (synced from Clerk)
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'business')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User credits balance
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  -- Monthly credits (reset each billing cycle)
  monthly_credits_remaining INTEGER NOT NULL DEFAULT 0,
  monthly_credits_total INTEGER NOT NULL DEFAULT 0,
  monthly_reset_at TIMESTAMPTZ,
  -- Lifetime/purchased credits (never expire)
  purchased_credits INTEGER NOT NULL DEFAULT 50, -- Free tier starts with 50
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions log
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Positive = add, Negative = deduct
  type TEXT NOT NULL CHECK (type IN (
    'monthly_allocation',    -- Monthly credits added
    'monthly_reset',         -- Monthly credits reset to 0
    'purchase',              -- Credit pack purchase
    'site_generation',       -- Used for site generation
    'edit',                  -- Used for AI edit
    'refund',                -- Credit refund
    'bonus',                 -- Promotional bonus
    'lifetime_grant'         -- Free tier lifetime credits
  )),
  description TEXT,
  balance_after INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit usage by project (for analytics)
CREATE TABLE project_credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  credits_used INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'generation', 'edit', 'regenerate'
  tokens_input INTEGER,
  tokens_output INTEGER,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_credit_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (clerk_user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can view own credits"
  ON user_credits FOR SELECT
  USING (clerk_user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (clerk_user_id = auth.jwt()->>'sub');

-- Indexes
CREATE INDEX idx_user_subscriptions_clerk_id ON user_subscriptions(clerk_user_id);
CREATE INDEX idx_user_credits_clerk_id ON user_credits(clerk_user_id);
CREATE INDEX idx_credit_transactions_clerk_id ON credit_transactions(clerk_user_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at);
CREATE INDEX idx_project_credit_usage_project ON project_credit_usage(project_id);
```

---

## Phase 2: Clerk Billing Setup

### 2.1 Clerk Dashboard Configuration

1. **Enable Billing** in Clerk Dashboard → Billing
2. **Connect Stripe Account** (create separate accounts for dev/prod)
3. **Create Plans:**

```
Plan: Starter
- Monthly: $15
- Yearly: $144
- Features: ['sites:3', 'credits:300', 'pages:10', 'domains:1', 'credit_discount:10']

Plan: Pro
- Monthly: $25
- Yearly: $240
- Features: ['sites:10', 'credits:800', 'pages:unlimited', 'domains:3', 'priority_ai', 'ecommerce:basic', 'credit_discount:20']

Plan: Business
- Monthly: $45
- Yearly: $456
- Features: ['sites:unlimited', 'credits:2000', 'pages:unlimited', 'domains:10', 'priority_ai', 'extended_ai', 'ecommerce:full', 'team:3', 'api_access', 'credit_discount:25']
```

### 2.2 Environment Variables

```env
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx

# Stripe (for credit packs - direct integration)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx

# Credit pack price IDs (create in Stripe Dashboard)
STRIPE_PRICE_CREDITS_SMALL=price_xxx
STRIPE_PRICE_CREDITS_MEDIUM=price_xxx
STRIPE_PRICE_CREDITS_LARGE=price_xxx
```

---

## Phase 3: Backend Implementation

### 3.1 Credit Service

```typescript
// src/lib/services/credits.ts

import { createClient } from '@/supabase-clients/server';
import { auth } from '@clerk/nextjs/server';

export const TIER_CREDITS = {
  free: { monthly: 0, lifetime: 50 },
  starter: { monthly: 300, lifetime: 0 },
  pro: { monthly: 800, lifetime: 0 },
  business: { monthly: 2000, lifetime: 0 },
} as const;

export const CREDIT_COSTS = {
  site_generation: 20,
  edit: 3,
  regenerate_section: 5,
  template_preview: 1,
} as const;

export async function getUserCredits(clerkUserId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !data) {
    // Initialize credits for new user
    return initializeUserCredits(clerkUserId);
  }

  return {
    monthly: data.monthly_credits_remaining,
    purchased: data.purchased_credits,
    total: data.monthly_credits_remaining + data.purchased_credits,
    resetAt: data.monthly_reset_at,
  };
}

export async function deductCredits(
  clerkUserId: string,
  amount: number,
  type: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();

  // Get current balance
  const credits = await getUserCredits(clerkUserId);

  if (credits.total < amount) {
    throw new Error('Insufficient credits');
  }

  // Deduct from monthly first, then purchased
  let monthlyDeduct = Math.min(credits.monthly, amount);
  let purchasedDeduct = amount - monthlyDeduct;

  const { error } = await supabase
    .from('user_credits')
    .update({
      monthly_credits_remaining: credits.monthly - monthlyDeduct,
      purchased_credits: credits.purchased - purchasedDeduct,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', clerkUserId);

  if (error) throw error;

  // Log transaction
  await logCreditTransaction(clerkUserId, -amount, type, metadata);

  return credits.total - amount;
}

export async function addCredits(
  clerkUserId: string,
  amount: number,
  type: 'purchase' | 'monthly_allocation' | 'bonus' | 'refund',
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();

  const field = type === 'monthly_allocation'
    ? 'monthly_credits_remaining'
    : 'purchased_credits';

  const { data, error } = await supabase.rpc('add_credits', {
    p_clerk_user_id: clerkUserId,
    p_amount: amount,
    p_field: field,
  });

  if (error) throw error;

  await logCreditTransaction(clerkUserId, amount, type, metadata);

  return data;
}

async function logCreditTransaction(
  clerkUserId: string,
  amount: number,
  type: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  const credits = await getUserCredits(clerkUserId);

  await supabase.from('credit_transactions').insert({
    clerk_user_id: clerkUserId,
    amount,
    type,
    balance_after: credits.total,
    metadata: metadata || {},
  });
}
```

### 3.2 Subscription Service

```typescript
// src/lib/services/subscription.ts

import { auth } from '@clerk/nextjs/server';

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'business';

export async function getUserSubscription(): Promise<{
  tier: SubscriptionTier;
  features: string[];
  creditDiscount: number;
}> {
  const { has, userId } = await auth();

  if (!userId) {
    return { tier: 'free', features: [], creditDiscount: 0 };
  }

  // Check plans in order of priority (highest first)
  if (await has({ plan: 'business' })) {
    return {
      tier: 'business',
      features: ['sites:unlimited', 'credits:2000', 'api_access'],
      creditDiscount: 25
    };
  }

  if (await has({ plan: 'pro' })) {
    return {
      tier: 'pro',
      features: ['sites:10', 'credits:800', 'priority_ai'],
      creditDiscount: 20
    };
  }

  if (await has({ plan: 'starter' })) {
    return {
      tier: 'starter',
      features: ['sites:3', 'credits:300'],
      creditDiscount: 10
    };
  }

  return { tier: 'free', features: ['sites:1', 'credits:50'], creditDiscount: 0 };
}

export async function canCreateSite(): Promise<boolean> {
  const { tier } = await getUserSubscription();
  const siteCount = await getUserSiteCount();

  const limits = {
    free: 1,
    starter: 3,
    pro: 10,
    business: Infinity,
  };

  return siteCount < limits[tier];
}

export async function canBuyCredits(): Promise<boolean> {
  const { tier } = await getUserSubscription();
  return tier !== 'free';
}
```

### 3.3 Webhook Handlers

```typescript
// src/app/api/webhooks/clerk-billing/route.ts

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { addCredits, resetMonthlyCredits } from '@/lib/services/credits';
import { TIER_CREDITS } from '@/lib/services/credits';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id!,
      'svix-timestamp': svix_timestamp!,
      'svix-signature': svix_signature!,
    }) as WebhookEvent;
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  const eventType = evt.type;

  switch (eventType) {
    case 'user.created':
      // Initialize free tier credits
      await initializeUserCredits(evt.data.id);
      break;

    case 'subscription.created':
    case 'subscription.updated':
      await handleSubscriptionChange(evt.data);
      break;

    case 'subscription.deleted':
      await handleSubscriptionCanceled(evt.data);
      break;

    case 'invoice.paid':
      // Monthly billing cycle - refresh credits
      await handleInvoicePaid(evt.data);
      break;
  }

  return new Response('OK', { status: 200 });
}

async function handleSubscriptionChange(data: any) {
  const { user_id, plan_id, status } = data;

  // Update subscription in Supabase
  await updateUserSubscription(user_id, {
    tier: planIdToTier(plan_id),
    status,
  });

  // Allocate credits for new subscription
  if (status === 'active') {
    const tier = planIdToTier(plan_id);
    const credits = TIER_CREDITS[tier].monthly;
    await addCredits(user_id, credits, 'monthly_allocation');
  }
}

async function handleInvoicePaid(data: any) {
  const { user_id, subscription_id } = data;

  // Get tier from subscription
  const subscription = await getSubscription(subscription_id);
  const tier = planIdToTier(subscription.plan_id);

  // Reset and allocate monthly credits
  await resetMonthlyCredits(user_id, TIER_CREDITS[tier].monthly);
}
```

### 3.4 Stripe Webhook for Credit Packs

```typescript
// src/app/api/webhooks/stripe/route.ts

import Stripe from 'stripe';
import { headers } from 'next/headers';
import { addCredits } from '@/lib/services/credits';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const CREDIT_PACK_AMOUNTS: Record<string, number> = {
  [process.env.STRIPE_PRICE_CREDITS_SMALL!]: 300,
  [process.env.STRIPE_PRICE_CREDITS_MEDIUM!]: 1000,
  [process.env.STRIPE_PRICE_CREDITS_LARGE!]: 3000,
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === 'payment' && session.metadata?.type === 'credit_pack') {
      const clerkUserId = session.metadata.clerk_user_id;
      const priceId = session.metadata.price_id;
      const credits = CREDIT_PACK_AMOUNTS[priceId];

      await addCredits(clerkUserId, credits, 'purchase', {
        stripe_session_id: session.id,
        price_id: priceId,
      });
    }
  }

  return new Response('OK', { status: 200 });
}
```

---

## Phase 4: Frontend Implementation

### 4.1 Pricing Page with Clerk Components

```typescript
// src/app/(dynamic-pages)/pricing/page.tsx

'use client';

import { PricingTable } from '@clerk/nextjs';
import { CreditPacksSection } from './CreditPacksSection';
import { UsageExamples } from './UsageExamples';

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-16 text-center">
        <h1>Simple, Transparent Pricing</h1>
        <p>Start free with 50 lifetime credits. Upgrade when you need more.</p>
      </section>

      {/* Clerk's Built-in Pricing Table */}
      <section className="py-12">
        <PricingTable />
      </section>

      {/* Usage Examples */}
      <UsageExamples />

      {/* Credit Packs (custom component) */}
      <CreditPacksSection />

      {/* FAQ */}
      <FAQ />
    </div>
  );
}
```

### 4.2 Credit Balance Component

```typescript
// src/components/CreditBalance.tsx

'use client';

import { useCredits } from '@/hooks/useCredits';
import { Zap } from 'lucide-react';

export function CreditBalance() {
  const { credits, isLoading } = useCredits();

  if (isLoading) return <div className="animate-pulse">...</div>;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30">
      <Zap className="w-4 h-4 text-purple-600" />
      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
        {credits.total.toLocaleString()} credits
      </span>
    </div>
  );
}
```

### 4.3 Credit Purchase Flow

```typescript
// src/components/CreditPackPurchase.tsx

'use client';

import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CREDIT_PACKS = [
  { id: 'small', credits: 300, basePrice: 5 },
  { id: 'medium', credits: 1000, basePrice: 15 },
  { id: 'large', credits: 3000, basePrice: 40 },
];

export function CreditPackPurchase() {
  const { subscription, isLoading } = useSubscription();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  if (subscription.tier === 'free') {
    return (
      <div className="text-center p-6 bg-gray-100 rounded-lg">
        <p>Upgrade to a paid plan to purchase credit packs</p>
      </div>
    );
  }

  const handlePurchase = async (packId: string) => {
    setPurchasing(packId);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {CREDIT_PACKS.map((pack) => {
        const discountedPrice = pack.basePrice * (1 - subscription.creditDiscount / 100);

        return (
          <div key={pack.id} className="p-6 border rounded-lg text-center">
            <div className="text-2xl font-bold">{pack.credits.toLocaleString()}</div>
            <div className="text-gray-500">credits</div>

            {subscription.creditDiscount > 0 && (
              <div className="text-sm text-gray-400 line-through">${pack.basePrice}</div>
            )}
            <div className="text-xl font-bold">${discountedPrice.toFixed(2)}</div>

            <button
              onClick={() => handlePurchase(pack.id)}
              disabled={!!purchasing}
              className="mt-4 w-full py-2 bg-purple-600 text-white rounded"
            >
              {purchasing === pack.id ? 'Processing...' : 'Buy'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

---

## Phase 5: Integration with Editor

### 5.1 Credit Check Before AI Operations

```typescript
// In flowstarter-editor: app/lib/services/creditGate.ts

export async function checkCreditsBeforeOperation(
  operation: 'site_generation' | 'edit' | 'regenerate_section'
): Promise<{ allowed: boolean; creditsRequired: number; creditsAvailable: number }> {
  const response = await fetch('/api/credits/check', {
    method: 'POST',
    body: JSON.stringify({ operation }),
  });

  return response.json();
}

export async function deductCreditsForOperation(
  operation: string,
  metadata: { projectId?: string; model?: string }
): Promise<{ success: boolean; remainingCredits: number }> {
  const response = await fetch('/api/credits/deduct', {
    method: 'POST',
    body: JSON.stringify({ operation, metadata }),
  });

  return response.json();
}
```

### 5.2 UI Warning for Low Credits

```typescript
// components/LowCreditsWarning.tsx

export function LowCreditsWarning({ credits }: { credits: number }) {
  if (credits > 20) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
      <p className="text-yellow-800">
        You have {credits} credits remaining.
        <a href="/pricing" className="underline ml-1">Get more</a>
      </p>
    </div>
  );
}
```

---

## Phase 6: Testing Checklist

### Subscription Flow
- [ ] New user gets 50 lifetime credits
- [ ] Upgrade to Starter allocates 300 monthly credits
- [ ] Upgrade to Pro allocates 800 monthly credits
- [ ] Downgrade preserves purchased credits
- [ ] Cancellation keeps access until period end
- [ ] Monthly renewal resets credits

### Credit Flow
- [ ] Site generation deducts 20 credits
- [ ] Edit deducts 3 credits
- [ ] Insufficient credits shows error
- [ ] Monthly credits used before purchased
- [ ] Credit pack purchase adds to purchased balance

### Edge Cases
- [ ] User with 0 monthly + 10 purchased can still use 10
- [ ] Webhook retry doesn't double-credit
- [ ] Failed payment pauses credit allocation

---

## Phase 7: Monitoring & Analytics

### Key Metrics to Track
- Monthly Recurring Revenue (MRR)
- Credit utilization rate per tier
- Upgrade/downgrade conversion rates
- Credit pack purchase frequency
- Average credits per site generation

### Supabase Dashboard Queries

```sql
-- Monthly credit usage by tier
SELECT
  us.tier,
  DATE_TRUNC('month', ct.created_at) as month,
  SUM(ABS(ct.amount)) as credits_used
FROM credit_transactions ct
JOIN user_subscriptions us ON ct.clerk_user_id = us.clerk_user_id
WHERE ct.amount < 0
GROUP BY us.tier, month
ORDER BY month DESC;

-- Top credit consumers
SELECT
  clerk_user_id,
  SUM(ABS(amount)) as total_used
FROM credit_transactions
WHERE amount < 0 AND created_at > NOW() - INTERVAL '30 days'
GROUP BY clerk_user_id
ORDER BY total_used DESC
LIMIT 20;
```

---

## Implementation Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| **Phase 1: Database** | 1 day | None |
| **Phase 2: Clerk Setup** | 1 day | Stripe account |
| **Phase 3: Backend** | 3 days | Phase 1, 2 |
| **Phase 4: Frontend** | 2 days | Phase 3 |
| **Phase 5: Editor Integration** | 2 days | Phase 3 |
| **Phase 6: Testing** | 2 days | Phase 4, 5 |
| **Phase 7: Monitoring** | 1 day | Phase 6 |

**Total: ~12 days**

---

## Resources

- [Clerk Billing Documentation](https://clerk.com/docs/guides/billing/overview)
- [Clerk Billing for B2C](https://clerk.com/docs/nextjs/guides/billing/for-b2c)
- [Stripe Webhooks](https://docs.stripe.com/webhooks)
- [Stripe Checkout for One-Time Payments](https://docs.stripe.com/payments/checkout)
