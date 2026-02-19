/**
 * Calendly OAuth Callback
 *
 * ⚠️ SECURITY: This is a stub implementation. Before going to production:
 *
 * 1. Validate OAuth state parameter (CSRF protection):
 *    ```typescript
 *    import { validateOAuthState } from '@/lib/oauth-state';
 *    const { valid, error } = await validateOAuthState('calendly', url.searchParams.get('state'));
 *    if (!valid) return redirect with error
 *    ```
 *
 * 2. Verify user authentication:
 *    ```typescript
 *    const { userId } = await auth();
 *    if (!userId) return redirect to sign-in
 *    ```
 *
 * 3. Exchange authorization code for tokens
 * 4. Store tokens using authenticated Supabase client (useServerSupabaseWithAuth)
 *
 * @see src/lib/oauth-state.ts for OAuth state utilities
 * @see src/app/api/integrations/google-analytics/oauth/callback/route.ts for reference implementation
 */
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // TODO: Implement proper OAuth flow with state validation
  // This stub always redirects with success - NOT SAFE FOR PRODUCTION
  const url = new URL(req.url);
  const base = `${url.protocol}//${url.host}`;
  return NextResponse.redirect(
    `${base}/dashboard/integrations?provider=calendly&status=success`
  );
}
