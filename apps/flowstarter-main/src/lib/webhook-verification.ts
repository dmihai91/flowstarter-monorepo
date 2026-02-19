/**
 * Webhook Verification Utilities
 *
 * Provides secure webhook signature verification for various providers.
 * Uses timing-safe comparisons and cryptographic verification.
 *
 * @module lib/webhook-verification
 */

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Webhook verification result
 */
export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
  payload?: unknown;
}

/**
 * Supported webhook providers
 */
export type WebhookProvider = 'clerk' | 'stripe' | 'generic';

/**
 * Webhook headers for verification
 */
export interface WebhookHeaders {
  'svix-id'?: string;
  'svix-timestamp'?: string;
  'svix-signature'?: string;
  'stripe-signature'?: string;
  'x-webhook-signature'?: string;
  'x-webhook-timestamp'?: string;
  [key: string]: string | undefined;
}

/**
 * Maximum age for webhook timestamp (5 minutes)
 */
const MAX_WEBHOOK_AGE_SECONDS = 300;

/**
 * Verify timestamp to prevent replay attacks
 */
function verifyTimestamp(
  timestamp: string | number,
  maxAgeSeconds = MAX_WEBHOOK_AGE_SECONDS
): { valid: boolean; error?: string } {
  const timestampNum =
    typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;

  if (isNaN(timestampNum)) {
    return { valid: false, error: 'Invalid timestamp format' };
  }

  const now = Math.floor(Date.now() / 1000);
  const age = now - timestampNum;

  if (age > maxAgeSeconds) {
    return {
      valid: false,
      error: 'Webhook timestamp too old (possible replay attack)',
    };
  }

  if (age < -60) {
    // Allow 1 minute clock skew into the future
    return { valid: false, error: 'Webhook timestamp in the future' };
  }

  return { valid: true };
}

/**
 * Timing-safe signature comparison
 */
function secureCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) {
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Verify Svix webhook signature (used by Clerk)
 *
 * Svix uses a multi-signature format: "v1,signature1 v1,signature2"
 * We need to try each signature until one matches.
 */
export function verifySvixSignature(
  payload: string,
  headers: WebhookHeaders,
  secret: string
): WebhookVerificationResult {
  const svixId = headers['svix-id'];
  const svixTimestamp = headers['svix-timestamp'];
  const svixSignature = headers['svix-signature'];

  // Validate required headers
  if (!svixId || !svixTimestamp || !svixSignature) {
    return {
      valid: false,
      error:
        'Missing required Svix headers (svix-id, svix-timestamp, svix-signature)',
    };
  }

  // Verify timestamp
  const timestampResult = verifyTimestamp(svixTimestamp);
  if (!timestampResult.valid) {
    return { valid: false, error: timestampResult.error };
  }

  // Prepare the signed payload
  const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;

  // Extract the secret (remove 'whsec_' prefix if present)
  const secretBytes = secret.startsWith('whsec_')
    ? Buffer.from(secret.slice(6), 'base64')
    : Buffer.from(secret, 'base64');

  // Calculate expected signature
  const expectedSignature = createHmac('sha256', secretBytes)
    .update(signedPayload)
    .digest('base64');

  // Svix sends multiple signatures, try each one
  const signatures = svixSignature.split(' ');
  let isValid = false;

  for (const sig of signatures) {
    const [version, signature] = sig.split(',');

    if (version !== 'v1') {
      continue; // Skip unsupported versions
    }

    if (secureCompare(signature, expectedSignature)) {
      isValid = true;
      break;
    }
  }

  if (!isValid) {
    return { valid: false, error: 'Invalid webhook signature' };
  }

  // Parse and return payload
  try {
    const parsedPayload = JSON.parse(payload);
    return { valid: true, payload: parsedPayload };
  } catch {
    return { valid: false, error: 'Invalid JSON payload' };
  }
}

/**
 * Verify Stripe webhook signature
 *
 * Stripe uses the format: "t=timestamp,v1=signature"
 */
export function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): WebhookVerificationResult {
  if (!signatureHeader) {
    return { valid: false, error: 'Missing Stripe signature header' };
  }

  // Parse the signature header
  const elements = signatureHeader.split(',');
  let timestamp: string | undefined;
  const signatures: string[] = [];

  for (const element of elements) {
    const [key, value] = element.split('=');
    if (key === 't') {
      timestamp = value;
    } else if (key === 'v1') {
      signatures.push(value);
    }
  }

  if (!timestamp) {
    return { valid: false, error: 'Missing timestamp in Stripe signature' };
  }

  if (signatures.length === 0) {
    return {
      valid: false,
      error: 'No v1 signatures found in Stripe signature',
    };
  }

  // Verify timestamp
  const timestampResult = verifyTimestamp(timestamp);
  if (!timestampResult.valid) {
    return { valid: false, error: timestampResult.error };
  }

  // Calculate expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Check if any signature matches
  const isValid = signatures.some((sig) =>
    secureCompare(sig, expectedSignature)
  );

  if (!isValid) {
    return { valid: false, error: 'Invalid Stripe webhook signature' };
  }

  try {
    const parsedPayload = JSON.parse(payload);
    return { valid: true, payload: parsedPayload };
  } catch {
    return { valid: false, error: 'Invalid JSON payload' };
  }
}

/**
 * Verify generic HMAC-SHA256 webhook signature
 *
 * For custom webhooks using standard HMAC-SHA256 signing
 */
export function verifyGenericHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp?: string
): WebhookVerificationResult {
  if (!signature) {
    return { valid: false, error: 'Missing webhook signature' };
  }

  // Verify timestamp if provided
  if (timestamp) {
    const timestampResult = verifyTimestamp(timestamp);
    if (!timestampResult.valid) {
      return { valid: false, error: timestampResult.error };
    }
  }

  // Calculate expected signature
  const dataToSign = timestamp ? `${timestamp}.${payload}` : payload;
  const expectedSignature = createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');

  // Support both hex and base64 encoded signatures
  const hexMatch = secureCompare(signature, expectedSignature);
  const base64Signature = createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64');
  const base64Match = secureCompare(signature, base64Signature);

  if (!hexMatch && !base64Match) {
    return { valid: false, error: 'Invalid webhook signature' };
  }

  try {
    const parsedPayload = JSON.parse(payload);
    return { valid: true, payload: parsedPayload };
  } catch {
    return { valid: false, error: 'Invalid JSON payload' };
  }
}

/**
 * Universal webhook verification function
 *
 * Automatically detects provider based on headers and verifies accordingly.
 */
export function verifyWebhook(
  provider: WebhookProvider,
  payload: string,
  headers: WebhookHeaders,
  secret: string
): WebhookVerificationResult {
  switch (provider) {
    case 'clerk':
      return verifySvixSignature(payload, headers, secret);

    case 'stripe':
      return verifyStripeSignature(
        payload,
        headers['stripe-signature'] || '',
        secret
      );

    case 'generic':
      return verifyGenericHmacSignature(
        payload,
        headers['x-webhook-signature'] || '',
        secret,
        headers['x-webhook-timestamp']
      );

    default:
      return { valid: false, error: `Unknown webhook provider: ${provider}` };
  }
}

/**
 * Extract headers from a Request object into a plain object
 */
export function extractWebhookHeaders(request: Request): WebhookHeaders {
  const headers: WebhookHeaders = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  return headers;
}

/**
 * Log webhook security event (for audit purposes)
 */
export function logWebhookEvent(
  provider: WebhookProvider,
  event: 'received' | 'verified' | 'failed',
  details: {
    eventType?: string;
    error?: string;
    webhookId?: string;
  }
): void {
  const logLevel = event === 'failed' ? 'warn' : 'info';
  const logData = {
    timestamp: new Date().toISOString(),
    provider,
    event,
    ...details,
  };

  if (logLevel === 'warn') {
    console.warn('[Webhook Security]', JSON.stringify(logData));
  } else {
    console.info('[Webhook Security]', JSON.stringify(logData));
  }
}
