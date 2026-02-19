import { auth } from '@clerk/nextjs/server';

export async function getSupabaseJWT() {
  const template = process.env.CLERK_SUPABASE_TEMPLATE || 'supabase';
  try {
    const session = await auth();
    const token = await session.getToken({ template });
    // Lightweight debug breadcrumb (no secrets)
    console.info(
      `[Auth] getSupabaseJWT template=${template} hasToken=${Boolean(token)}`
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
