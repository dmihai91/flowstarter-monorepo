/**
 * The gate that holds a guest-provisioned client on the password page.
 *
 * Two ways to get this wrong, and both are worse than the problem it solves:
 * letting a password we chose and emailed stay in use forever, or locking a
 * paying client inside a redirect loop they cannot leave. The cases below are
 * the exemptions that keep the second one from happening.
 */
import { describe, expect, it } from 'vitest';
import {
  PASSWORD_CHANGE_PATH,
  forcedPasswordChangeRedirect,
} from '../forced-password-change';

const FLAGGED = { metadata: { mustChangePassword: true } };

describe('forcedPasswordChangeRedirect', () => {
  it('sends a flagged client from an app page to the password page', () => {
    expect(forcedPasswordChangeRedirect('/dashboard', FLAGGED)).toBe(
      PASSWORD_CHANGE_PATH
    );
    expect(
      forcedPasswordChangeRedirect('/dashboard/projects/abc', FLAGGED)
    ).toBe(PASSWORD_CHANGE_PATH);
  });

  it('lets the password page itself through', () => {
    // Otherwise the redirect is a loop and the client can never escape it.
    expect(forcedPasswordChangeRedirect(PASSWORD_CHANGE_PATH, FLAGGED)).toBe(
      null
    );
    expect(
      forcedPasswordChangeRedirect(
        `${PASSWORD_CHANGE_PATH}?from=login`,
        FLAGGED
      )
    ).toBe(null);
  });

  it('lets API routes through', () => {
    // The request that clears the flag is an API call. Redirecting it would
    // make the loop unbreakable.
    expect(
      forcedPasswordChangeRedirect('/api/account/password-changed', FLAGGED)
    ).toBe(null);
    expect(forcedPasswordChangeRedirect('/api/anything', FLAGGED)).toBe(null);
  });

  it('leaves an unflagged user alone', () => {
    expect(forcedPasswordChangeRedirect('/dashboard', undefined)).toBe(null);
    expect(forcedPasswordChangeRedirect('/dashboard', null)).toBe(null);
    expect(forcedPasswordChangeRedirect('/dashboard', {})).toBe(null);
    expect(forcedPasswordChangeRedirect('/dashboard', { metadata: null })).toBe(
      null
    );
    expect(
      forcedPasswordChangeRedirect('/dashboard', {
        metadata: { mustChangePassword: false },
      })
    ).toBe(null);
  });

  it('opens the gate the moment the flag stops being exactly true', () => {
    // The session token can carry a stale or oddly shaped claim for a minute
    // after the change. Holding somebody hostage over that is the worse bug.
    const odd = { metadata: { mustChangePassword: 'true' } } as unknown as {
      metadata: { mustChangePassword?: boolean };
    };
    expect(forcedPasswordChangeRedirect('/dashboard', odd)).toBe(null);
  });
});
