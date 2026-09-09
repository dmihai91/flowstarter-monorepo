/**
 * The rule behind the forced-password-change gate, on its own so it can be
 * tested without standing up Clerk's middleware.
 *
 * A client who paid as a guest was given an account whose password WE chose and
 * emailed. That password is only as private as their inbox, so it is treated as
 * expired from the moment it is issued: the account works, and it works for
 * exactly one thing until it is replaced.
 *
 * Three exemptions, and every one of them is load bearing:
 *   - the change page itself, or the redirect is a loop;
 *   - `/api`, or the request that saves the new password gets redirected
 *     instead of served, and the loop becomes unbreakable;
 *   - anything the caller has already decided is public. The gate runs after
 *     the middleware's own public-route check, so this is belt and braces for
 *     a caller that reorders things later.
 */

/** Where a client with a temporary password is held. */
export const PASSWORD_CHANGE_PATH = '/account/password';

/** The shape the flag arrives in, on the Clerk session token. */
export interface ForcedPasswordClaims {
  metadata?: { mustChangePassword?: boolean } | null;
}

/**
 * The path to redirect to, or null to let the request through.
 *
 * The flag is compared with `=== true` rather than coerced, so a session token
 * that carries `false`, a string, or nothing at all opens the gate. The failure
 * we care about is holding somebody hostage over a malformed claim, not letting
 * one temporary password live an extra minute.
 */
export function forcedPasswordChangeRedirect(
  pathname: string,
  sessionClaims: ForcedPasswordClaims | null | undefined
): string | null {
  if (sessionClaims?.metadata?.mustChangePassword !== true) return null;
  if (pathname.startsWith('/api')) return null;
  if (pathname.startsWith(PASSWORD_CHANGE_PATH)) return null;
  return PASSWORD_CHANGE_PATH;
}
