// Clerk-backed identity helpers (server-only).
import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isTeamEmail } from '@flowstarter/platform-config';
import { headers } from 'next/headers';

export interface Identity {
  userId: string;
  email: string;
}

/** Throws a Response(401) when unauthenticated — for route handlers. */
export async function requireIdentity(): Promise<Identity> {
  const { userId } = await auth();
  if (!userId) {
    throw new Response(JSON.stringify({ error: 'Sign in required' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    throw new Response(JSON.stringify({ error: 'Account has no email address' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  return { userId, email };
}

/** Admin = team email domain (publicMetadata.role fallback) — mirrors flowstarter-main. */
export async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = (user.publicMetadata as { role?: string } | null)?.role;
  if (role === 'team' || role === 'admin') return true;
  const email = user.primaryEmailAddress?.emailAddress;
  const host = (await headers()).get('host') ?? undefined;
  return !!email && isTeamEmail(email, host?.split(':')[0]);
}

export async function clientIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null
  );
}
