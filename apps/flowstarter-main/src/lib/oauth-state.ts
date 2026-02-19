/**
 * OAuth State Management
 *
 * Provides utilities for generating and validating OAuth state parameters
 * to prevent CSRF attacks during OAuth flows.
 *
 * Usage:
 * 1. In oauth/start: Generate state, store in cookie, include in OAuth URL
 * 2. In oauth/callback: Validate state from URL matches cookie, then clear cookie
 */

import { randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const OAUTH_STATE_COOKIE_PREFIX = 'oauth_state_';
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export interface OAuthStatePayload {
  /** Random state value for CSRF protection */
  state: string;
  /** Timestamp when state was created */
  createdAt: number;
  /** Optional: URL to redirect to after OAuth completes */
  returnTo?: string;
}

/**
 * Generate a cryptographically secure OAuth state parameter
 */
export function generateOAuthState(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create and store OAuth state in a secure cookie
 *
 * @param provider - OAuth provider name (e.g., 'google-analytics', 'calendly')
 * @param returnTo - Optional URL to redirect after OAuth completes
 * @returns The generated state value to include in OAuth authorization URL
 */
export async function createOAuthState(
  provider: string,
  returnTo?: string
): Promise<string> {
  const state = generateOAuthState();
  const payload: OAuthStatePayload = {
    state,
    createdAt: Date.now(),
    returnTo,
  };

  const cookieStore = await cookies();
  cookieStore.set(
    `${OAUTH_STATE_COOKIE_PREFIX}${provider}`,
    JSON.stringify(payload),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    }
  );

  return state;
}

/**
 * Validate OAuth state from callback against stored cookie
 *
 * @param provider - OAuth provider name
 * @param receivedState - State parameter from OAuth callback URL
 * @returns Object with validation result and optional returnTo URL
 */
export async function validateOAuthState(
  provider: string,
  receivedState: string | null
): Promise<{ valid: boolean; returnTo?: string; error?: string }> {
  if (!receivedState) {
    return { valid: false, error: 'Missing state parameter' };
  }

  const cookieStore = await cookies();
  const cookieName = `${OAUTH_STATE_COOKIE_PREFIX}${provider}`;
  const storedValue = cookieStore.get(cookieName)?.value;

  if (!storedValue) {
    return { valid: false, error: 'OAuth session expired or not found' };
  }

  let payload: OAuthStatePayload;
  try {
    payload = JSON.parse(storedValue);
  } catch {
    // Clear invalid cookie
    cookieStore.delete(cookieName);
    return { valid: false, error: 'Invalid OAuth session data' };
  }

  // Check expiry
  if (Date.now() - payload.createdAt > STATE_EXPIRY_MS) {
    cookieStore.delete(cookieName);
    return { valid: false, error: 'OAuth session expired' };
  }

  // Timing-safe comparison to prevent timing attacks
  const storedState = payload.state;
  if (storedState.length !== receivedState.length) {
    cookieStore.delete(cookieName);
    return { valid: false, error: 'Invalid state parameter' };
  }

  const isValid = timingSafeEqual(
    Buffer.from(storedState),
    Buffer.from(receivedState)
  );

  // Always clear the state cookie after validation attempt (one-time use)
  cookieStore.delete(cookieName);

  if (!isValid) {
    return { valid: false, error: 'State mismatch - possible CSRF attack' };
  }

  return { valid: true, returnTo: payload.returnTo };
}

/**
 * Clear OAuth state cookie (for cleanup on error or cancellation)
 */
export async function clearOAuthState(provider: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`${OAUTH_STATE_COOKIE_PREFIX}${provider}`);
}
