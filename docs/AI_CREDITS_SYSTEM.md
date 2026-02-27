# AI Credits System - Technical Specification

## Overview

Flowstarter uses an AI credit system to manage and meter AI-powered editing features. Credits are an abstraction over token costs that simplifies billing and provides a predictable user experience.

---

## 1. Business Requirements

### 1.1 Pricing Tiers

| Plan | Monthly Credits | Price | Credit Value |
|------|-----------------|-------|--------------|
| Standard | 1,000 | €39/mo | ~€0.039/credit |
| Future Pro | 3,000 | TBD | TBD |
| Future Enterprise | Unlimited | TBD | TBD |

### 1.2 Profitability Target

- **Target margin:** 50%+
- **Max AI cost per €39 plan:** ~€20/month
- **1,000 credits = max €20 in token costs**
- **1 credit ≈ €0.02 max cost**

---

## 2. Credit Conversion System

### 2.1 Token-to-Credit Conversion

Claude Opus 4 pricing (approximate):
- Input: $15/1M tokens = $0.000015/token
- Output: $75/1M tokens = $0.000075/token (5x more expensive)

**Conversion rates (1 credit = €0.02 max cost = ~$0.022):**

| Token Type | Tokens per Credit | Cost per Credit |
|------------|-------------------|-----------------|
| Input | 1,500 tokens | $0.0225 |
| Output | 300 tokens | $0.0225 |

**Simplified formula:**
```
credits_used = ceil(input_tokens / 1500) + ceil(output_tokens / 300)
```

### 2.2 Example Costs

| Edit Type | Input Tokens | Output Tokens | Credits Used |
|-----------|--------------|---------------|--------------|
| Tiny (text change) | 500 | 200 | 1 + 1 = 2 |
| Small (paragraph) | 1,000 | 500 | 1 + 2 = 3 |
| Medium (section) | 2,000 | 1,000 | 2 + 4 = 6 |
| Large (full page) | 5,000 | 2,500 | 4 + 9 = 13 |
| Complex (multi-page) | 10,000 | 5,000 | 7 + 17 = 24 |

**With 1,000 credits/month:**
- ~500 tiny edits, OR
- ~330 small edits, OR
- ~165 medium edits, OR
- ~75 large edits, OR
- ~40 complex edits

---

## 3. Database Schema

### 3.1 Core Tables

```sql
-- User credits balance and settings
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Current balance
  credits_remaining INTEGER NOT NULL DEFAULT 1000,
  
  -- Plan info
  plan_credits INTEGER NOT NULL DEFAULT 1000,  -- Monthly allocation
  plan_type VARCHAR(50) NOT NULL DEFAULT 'standard',
  
  -- Billing cycle
  billing_cycle_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  
  -- Rollover (future feature)
  rollover_credits INTEGER NOT NULL DEFAULT 0,
  max_rollover INTEGER NOT NULL DEFAULT 0,  -- 0 = no rollover
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Credit usage history (for analytics and disputes)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction details
  credits_used INTEGER NOT NULL,
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  
  -- What was this for?
  transaction_type VARCHAR(50) NOT NULL,  -- 'ai_edit', 'reset', 'bonus', 'refund', 'purchase'
  
  -- AI-specific metadata
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  operation_type VARCHAR(100),  -- 'text_edit', 'image_gen', 'page_create', etc.
  input_tokens INTEGER,
  output_tokens INTEGER,
  model_used VARCHAR(100),  -- 'claude-opus-4', etc.
  
  -- Request tracking
  request_id VARCHAR(255),  -- For debugging/support
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
```

### 3.2 Views for Analytics

```sql
-- Daily usage summary per user
CREATE VIEW user_daily_usage AS
SELECT 
  user_id,
  DATE(created_at) as usage_date,
  SUM(credits_used) as total_credits,
  COUNT(*) as total_operations,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens
FROM credit_transactions
WHERE transaction_type = 'ai_edit'
GROUP BY user_id, DATE(created_at);

-- Monthly usage summary
CREATE VIEW user_monthly_usage AS
SELECT 
  user_id,
  DATE_TRUNC('month', created_at) as usage_month,
  SUM(credits_used) as total_credits,
  COUNT(*) as total_operations
FROM credit_transactions
WHERE transaction_type = 'ai_edit'
GROUP BY user_id, DATE_TRUNC('month', created_at);
```

---

## 4. API Design

### 4.1 Credit Check Endpoint

```typescript
// GET /api/credits
// Returns current credit balance

interface CreditBalanceResponse {
  credits_remaining: number;
  plan_credits: number;
  plan_type: string;
  usage_this_cycle: number;
  next_reset_at: string;  // ISO timestamp
  days_until_reset: number;
}
```

### 4.2 Credit Deduction (Internal)

```typescript
// Called by AI service after successful operation
interface DeductCreditsRequest {
  user_id: string;
  credits: number;
  operation_type: string;
  project_id?: string;
  input_tokens: number;
  output_tokens: number;
  model_used: string;
  request_id: string;
}

interface DeductCreditsResponse {
  success: boolean;
  credits_remaining: number;
  credits_used: number;
  error?: string;
}
```

### 4.3 Pre-flight Check

```typescript
// Called BEFORE making AI request
// GET /api/credits/check?estimated_credits=10

interface CreditCheckResponse {
  can_proceed: boolean;
  credits_remaining: number;
  estimated_cost: number;
  warning?: string;  // "Low credits" if < 10% remaining
}
```

---

## 5. Service Layer

### 5.1 Credit Service

```typescript
// lib/services/credit-service.ts

export class CreditService {
  
  /**
   * Get user's current credit balance
   */
  async getBalance(userId: string): Promise<CreditBalance>
  
  /**
   * Check if user has enough credits
   */
  async hasCredits(userId: string, required: number): Promise<boolean>
  
  /**
   * Deduct credits after AI operation
   * Returns false if insufficient credits
   */
  async deductCredits(params: DeductParams): Promise<DeductResult>
  
  /**
   * Calculate credits from token usage
   */
  calculateCredits(inputTokens: number, outputTokens: number): number
  
  /**
   * Reset credits for billing cycle
   */
  async resetCredits(userId: string): Promise<void>
  
  /**
   * Add bonus credits (promotions, support)
   */
  async addCredits(userId: string, amount: number, reason: string): Promise<void>
  
  /**
   * Get usage history
   */
  async getUsageHistory(userId: string, days?: number): Promise<Transaction[]>
}
```

### 5.2 Integration with AI Service

```typescript
// In AI edit handler

async function handleAIEdit(request: AIEditRequest) {
  const creditService = new CreditService();
  
  // 1. Estimate credits needed (rough estimate)
  const estimatedCredits = estimateCredits(request.prompt);
  
  // 2. Pre-flight check
  const canProceed = await creditService.hasCredits(
    request.userId, 
    estimatedCredits
  );
  
  if (!canProceed) {
    throw new InsufficientCreditsError({
      required: estimatedCredits,
      available: await creditService.getBalance(request.userId)
    });
  }
  
  // 3. Make AI request
  const result = await anthropicClient.complete(request);
  
  // 4. Calculate actual credits used
  const actualCredits = creditService.calculateCredits(
    result.usage.input_tokens,
    result.usage.output_tokens
  );
  
  // 5. Deduct credits
  await creditService.deductCredits({
    userId: request.userId,
    credits: actualCredits,
    operationType: 'ai_edit',
    projectId: request.projectId,
    inputTokens: result.usage.input_tokens,
    outputTokens: result.usage.output_tokens,
    modelUsed: 'claude-opus-4',
    requestId: result.id
  });
  
  return result;
}
```

---

## 6. UI Components

### 6.1 Credit Display (Header/Sidebar)

```
┌─────────────────────────────┐
│  ⚡ 847 / 1,000 credits     │
│  ████████████░░░ 85%        │
│  Resets in 12 days          │
└─────────────────────────────┘
```

### 6.2 Low Credit Warning

Show warning banner when < 10% credits remaining:
```
⚠️ You have 87 credits remaining. Consider upgrading or waiting for reset on Mar 15.
```

### 6.3 Out of Credits State

```
┌─────────────────────────────────────────────┐
│  😅 You've used all your credits this month │
│                                             │
│  • Credits reset on March 15                │
│  • Or purchase additional credits           │
│                                             │
│  [Buy 500 credits - €19]  [Upgrade Plan]    │
└─────────────────────────────────────────────┘
```

### 6.4 Credit Usage in Editor

Show estimated cost before confirming edit:
```
┌────────────────────────────────────────┐
│  This edit will use approximately:     │
│  ~8 credits (based on content length)  │
│                                        │
│  [Cancel]  [Apply Edit - 8 credits]    │
└────────────────────────────────────────┘
```

---

## 7. Billing Integration

### 7.1 Monthly Reset (Cron Job)

```typescript
// Run daily at 00:00 UTC
async function resetExpiredCredits() {
  const expiredUsers = await db.query(`
    SELECT user_id, plan_credits, rollover_credits, max_rollover
    FROM user_credits
    WHERE next_reset_at <= NOW()
    AND plan_type != 'unlimited'
  `);
  
  for (const user of expiredUsers) {
    // Calculate rollover (if enabled)
    const currentBalance = user.credits_remaining;
    const rollover = Math.min(currentBalance, user.max_rollover);
    
    await db.query(`
      UPDATE user_credits
      SET 
        credits_remaining = $1 + $2,
        rollover_credits = $2,
        billing_cycle_start = NOW(),
        next_reset_at = NOW() + INTERVAL '1 month',
        updated_at = NOW()
      WHERE user_id = $3
    `, [user.plan_credits, rollover, user.user_id]);
    
    // Log the reset
    await logTransaction(user.user_id, {
      type: 'reset',
      credits_before: currentBalance,
      credits_after: user.plan_credits + rollover
    });
  }
}
```

### 7.2 Stripe Webhook Handler

```typescript
// On subscription created/renewed
async function handleSubscriptionActive(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;
  const planCredits = getPlanCredits(subscription.items[0].price.id);
  
  await db.query(`
    INSERT INTO user_credits (user_id, plan_credits, plan_type)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE SET
      plan_credits = $2,
      plan_type = $3,
      updated_at = NOW()
  `, [userId, planCredits, subscription.metadata.plan_type]);
}

// On subscription cancelled
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;
  
  // Keep credits until period end, then set to 0
  // Or immediately set to free tier (if any)
  await db.query(`
    UPDATE user_credits
    SET plan_type = 'cancelled'
    WHERE user_id = $1
  `, [userId]);
}
```

---

## 8. Edge Cases & Error Handling

### 8.1 Race Conditions

Use database transactions with row-level locking:

```typescript
async function deductCredits(userId: string, amount: number) {
  return db.transaction(async (tx) => {
    // Lock the row
    const user = await tx.query(`
      SELECT * FROM user_credits
      WHERE user_id = $1
      FOR UPDATE
    `, [userId]);
    
    if (user.credits_remaining < amount) {
      throw new InsufficientCreditsError();
    }
    
    await tx.query(`
      UPDATE user_credits
      SET credits_remaining = credits_remaining - $1
      WHERE user_id = $2
    `, [amount, userId]);
  });
}
```

### 8.2 Failed AI Requests

- If AI request fails AFTER credits deducted: **refund credits**
- If AI request fails BEFORE completion: **no charge**
- Track failed requests for monitoring

### 8.3 Partial Operations

For streaming responses:
- Estimate credits before
- Charge actual after complete
- If stream interrupted: charge for tokens received

---

## 9. Monitoring & Alerts

### 9.1 Metrics to Track

- Average credits per edit (by operation type)
- Credits used vs plan allocation (utilization rate)
- Users hitting credit limit
- Revenue per credit (actual cost vs charged)

### 9.2 Alerts

- User approaching limit (90%, then 100%)
- Unusual usage spike (possible abuse)
- Margin dropping below threshold

---

## 10. Future Considerations

### 10.1 Credit Packs (One-time Purchase)

```
- 500 credits: €19 (€0.038/credit)
- 1,500 credits: €49 (€0.033/credit) - Best Value
- 5,000 credits: €149 (€0.030/credit)
```

### 10.2 Rollover Credits

Allow unused credits to roll over (capped):
- Standard: 100 credits max rollover
- Pro: 500 credits max rollover

### 10.3 Team/Agency Plans

Shared credit pool across team members.

### 10.4 Usage-Based Pricing

Alternative model: €X per 100 credits used (no monthly cap).

---

## 11. Implementation Phases

### Phase 1: Core System (MVP)
- [ ] Database schema
- [ ] Credit service
- [ ] Basic deduction on AI calls
- [ ] Credit display in UI (balance only)

### Phase 2: Full Integration
- [ ] Pre-flight checks
- [ ] Low credit warnings
- [ ] Out of credits handling
- [ ] Usage history view

### Phase 3: Billing Integration
- [ ] Stripe webhook handlers
- [ ] Monthly reset cron
- [ ] Credit pack purchases

### Phase 4: Analytics & Optimization
- [ ] Usage dashboards
- [ ] Cost monitoring
- [ ] Margin alerts
- [ ] Conversion optimization

---

## 12. Configuration

```typescript
// config/credits.ts

export const CREDIT_CONFIG = {
  // Conversion rates
  INPUT_TOKENS_PER_CREDIT: 1500,
  OUTPUT_TOKENS_PER_CREDIT: 300,
  
  // Plan allocations
  PLANS: {
    standard: { credits: 1000, price: 39 },
    pro: { credits: 3000, price: 79 },
    enterprise: { credits: -1, price: 199 }, // -1 = unlimited
  },
  
  // Warnings
  LOW_CREDIT_THRESHOLD: 0.10, // 10%
  
  // Rollover
  DEFAULT_MAX_ROLLOVER: 0,
  
  // Pricing (EUR)
  CREDIT_PACKS: [
    { credits: 500, price: 19 },
    { credits: 1500, price: 49 },
    { credits: 5000, price: 149 },
  ],
};
```

---

## Summary

| Aspect | Decision |
|--------|----------|
| Credit unit | 1 credit ≈ €0.02 AI cost |
| Monthly allocation | 1,000 credits (Standard) |
| Input conversion | 1,500 tokens = 1 credit |
| Output conversion | 300 tokens = 1 credit |
| Typical edit cost | 3-13 credits |
| Edits per month | ~75-330 depending on complexity |
| Target margin | 50%+ |
| Reset cycle | Monthly (billing date) |
| Rollover | Not initially (future feature) |

---

*Document version: 1.0*
*Last updated: February 27, 2026*
