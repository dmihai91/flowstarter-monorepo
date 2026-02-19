# Webhook Security Implementation

This document describes the webhook security implementation for Flowstarter.

## Overview

All incoming webhooks are protected by cryptographic signature verification to prevent:

- **Spoofing attacks**: Malicious actors sending fake webhook events
- **Replay attacks**: Re-sending captured webhook payloads
- **Tampering**: Modifying webhook payloads in transit

## Supported Providers

| Provider    | Signature Method   | Header Format                                 |
| ----------- | ------------------ | --------------------------------------------- |
| **Clerk**   | HMAC-SHA256 (Svix) | `svix-id`, `svix-timestamp`, `svix-signature` |
| **Stripe**  | HMAC-SHA256        | `stripe-signature`                            |
| **Generic** | HMAC-SHA256        | `x-webhook-signature`, `x-webhook-timestamp`  |

---

## Setup Guide

### 1. Clerk Webhooks

Clerk uses Svix for webhook delivery, providing robust signature verification.

#### Configuration Steps

1. **Go to Clerk Dashboard**

   - Navigate to: [Clerk Dashboard](https://dashboard.clerk.com) → Your App → Webhooks

2. **Create Webhook Endpoint**

   ```
   Endpoint URL: https://your-domain.com/api/webhooks/clerk
   ```

3. **Subscribe to Events**

   - `user.created` - New user registration
   - `user.updated` - User profile changes
   - `user.deleted` - User account deletion
   - `session.created` - New login session
   - `session.ended` - Session logout

4. **Copy Signing Secret**

   - After creating the endpoint, copy the "Signing Secret"
   - It starts with `whsec_`

5. **Set Environment Variable**
   ```env
   CLERK_WEBHOOK_SECRET=whsec_your_signing_secret_here
   ```

#### Testing Locally

Use Clerk's webhook testing feature or ngrok:

```bash
# Using ngrok for local development
ngrok http 3000

# Update Clerk webhook endpoint to ngrok URL
# https://xxxx-xx-xx-xxx-xx.ngrok.io/api/webhooks/clerk
```

---

### 2. Stripe Webhooks (Future)

If you integrate Stripe for payments:

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint**: `https://your-domain.com/api/webhooks/stripe`
3. **Subscribe to events**: `checkout.session.completed`, `customer.subscription.*`
4. **Copy signing secret** to `STRIPE_WEBHOOK_SECRET`

---

## Security Features

### 1. Signature Verification

All webhooks are verified using HMAC-SHA256:

```typescript
import { verifySvixSignature } from '@/lib/webhook-verification';

const verification = verifySvixSignature(payload, headers, secret);
if (!verification.valid) {
  return new Response('Invalid signature', { status: 401 });
}
```

### 2. Timestamp Validation

Webhooks older than 5 minutes are rejected to prevent replay attacks:

```typescript
// Built into verification - automatically rejects old webhooks
const MAX_WEBHOOK_AGE_SECONDS = 300; // 5 minutes
```

### 3. Timing-Safe Comparison

Signatures are compared using constant-time comparison to prevent timing attacks:

```typescript
import { timingSafeEqual } from 'crypto';

// Prevents attackers from determining correct signature character-by-character
```

### 4. Security Audit Logging

All webhook events are logged for monitoring:

```typescript
// Successful verification
logWebhookEvent('clerk', 'verified', { eventType: 'user.created' });

// Failed verification (potential attack)
logWebhookEvent('clerk', 'failed', { error: 'Invalid signature' });
```

---

## API Reference

### Webhook Verification Library

**Location**: `src/lib/webhook-verification.ts`

#### `verifySvixSignature()`

Verifies Clerk/Svix webhook signatures.

```typescript
function verifySvixSignature(
  payload: string,
  headers: WebhookHeaders,
  secret: string
): WebhookVerificationResult;
```

#### `verifyStripeSignature()`

Verifies Stripe webhook signatures.

```typescript
function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): WebhookVerificationResult;
```

#### `verifyGenericHmacSignature()`

Verifies generic HMAC-SHA256 signatures.

```typescript
function verifyGenericHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp?: string
): WebhookVerificationResult;
```

#### `verifyWebhook()`

Universal verification function that auto-selects provider.

```typescript
function verifyWebhook(
  provider: 'clerk' | 'stripe' | 'generic',
  payload: string,
  headers: WebhookHeaders,
  secret: string
): WebhookVerificationResult;
```

---

## Clerk Webhook Endpoint

**Location**: `src/app/api/webhooks/clerk/route.ts`

### Handled Events

| Event             | Action                                              |
| ----------------- | --------------------------------------------------- |
| `user.created`    | Log audit event                                     |
| `user.updated`    | Log audit event                                     |
| `user.deleted`    | Delete user data (projects, integrations, feedback) |
| `session.created` | Log for security monitoring                         |
| `session.ended`   | Log for security monitoring                         |

### Response Codes

| Code  | Meaning                                 |
| ----- | --------------------------------------- |
| `200` | Webhook processed successfully          |
| `401` | Invalid signature (verification failed) |
| `405` | Method not allowed (use POST)           |
| `500` | Server error or misconfiguration        |

---

## Monitoring & Alerts

### Security Events to Monitor

1. **`webhook.verification_failed`** - Potential spoofing attempt
2. **`user.deleted`** - User data cleanup triggered
3. **High volume of failed verifications** - Possible attack

### Recommended Alerts

```sql
-- Alert on failed webhook verifications
SELECT COUNT(*) as failed_count
FROM security_audit_logs
WHERE event = 'webhook.verification_failed'
  AND created_at > NOW() - INTERVAL '1 hour';

-- Alert if > 10 failures in an hour
```

---

## Troubleshooting

### Common Issues

#### 1. "Missing required Svix headers"

**Cause**: Request doesn't have `svix-id`, `svix-timestamp`, or `svix-signature` headers.

**Solution**: Ensure the webhook is coming from Clerk, not a manual test.

#### 2. "Webhook timestamp too old"

**Cause**: Webhook was delayed more than 5 minutes.

**Solution**: This is expected for very delayed webhooks. Clerk will retry.

#### 3. "Invalid webhook signature"

**Cause**: Wrong signing secret or tampered payload.

**Solution**:

- Verify `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- Ensure you're reading raw body, not parsed JSON

#### 4. "CLERK_WEBHOOK_SECRET is not configured"

**Cause**: Environment variable not set.

**Solution**: Add `CLERK_WEBHOOK_SECRET=whsec_...` to your `.env.local`

---

## Best Practices

1. **Never log webhook payloads** - They may contain PII
2. **Always verify signatures** - Never skip verification in production
3. **Use idempotent handlers** - Webhooks may be delivered multiple times
4. **Return 200 quickly** - Process asynchronously if needed
5. **Monitor failed verifications** - They may indicate attacks

---

## Environment Variables

| Variable                | Required                 | Description                              |
| ----------------------- | ------------------------ | ---------------------------------------- |
| `CLERK_WEBHOOK_SECRET`  | Yes (for Clerk webhooks) | Svix signing secret from Clerk dashboard |
| `STRIPE_WEBHOOK_SECRET` | No (future)              | Stripe webhook signing secret            |

---

## Files

| File                                  | Purpose                          |
| ------------------------------------- | -------------------------------- |
| `src/lib/webhook-verification.ts`     | Signature verification utilities |
| `src/app/api/webhooks/clerk/route.ts` | Clerk webhook handler            |
| `src/environment.d.ts`                | TypeScript types for env vars    |

---

_Last updated: December 2025_
