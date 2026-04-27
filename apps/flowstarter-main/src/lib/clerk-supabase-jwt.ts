import { auth } from '@clerk/nextjs/server';

export async function getSupabaseJWT() {
  const template = process.env.CLERK_SUPABASE_TEMPLATE;
  try {
    const session = await auth();
    // Preferred path for Supabase Third-Party Auth integration:
    // use Clerk's default session token (no JWT template).
    let token = await session.getToken();
    let strategy = 'default-session-token';

    // Backward-compatible fallback for legacy template-based setups.
    if (!token && template) {
      token = await session.getToken({ template });
      strategy = `template:${template}`;
    }

    // Lightweight debug breadcrumb (no secrets)
    console.info(
      `[Auth] getSupabaseJWT strategy=${strategy} hasToken=${Boolean(token)}`
    );
    return token;
  } catch (error) {
    console.error('[Auth] getSupabaseJWT error', error);
    return null;
  }
}

// This function should be called in your middleware or API routes
export async function getSupabaseUser() {
  const session = await auth();
  if (!session) return null;

  const userId = session.userId;
  if (!userId) return null;

  return {
    id: userId,
    role: 'authenticated',
  };
}
