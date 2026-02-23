/**
 * Clerk Server Utilities
 * 
 * Server-side Clerk configuration for Cloudflare Workers
 */

import { createClerkClient } from '@clerk/remix/api.server';

export function getClerkClient(context: { cloudflare?: { env: Record<string, string> } }) {
  const secretKey = context.cloudflare?.env?.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is not configured');
  }
  
  return createClerkClient({ secretKey });
}

export function getClerkEnv(context: { cloudflare?: { env: Record<string, string> } }) {
  return {
    publishableKey: context.cloudflare?.env?.CLERK_PUBLISHABLE_KEY 
      || process.env.CLERK_PUBLISHABLE_KEY 
      || '',
    secretKey: context.cloudflare?.env?.CLERK_SECRET_KEY 
      || process.env.CLERK_SECRET_KEY 
      || '',
  };
}

/**
 * Team email domains that are allowed to access the editor
 */
export const TEAM_EMAIL_DOMAINS = ['flowstarter.co', 'flowstarter.com'];

/**
 * Check if a user email is a team member
 */
export function isTeamEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return TEAM_EMAIL_DOMAINS.includes(domain);
}
