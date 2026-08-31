/**
 * The account half of the guest deposit: a paying client who never signed in.
 *
 * The old flow made people create an account before they were allowed to pay,
 * which put a sign-up form between a decided buyer and their card. The new one
 * takes the money first and mints the account afterwards, from the email Stripe
 * charged. That means this module has to do something the rest of the app never
 * does: choose a password on a human's behalf.
 *
 * Two rules follow from that, and neither is negotiable:
 *   - the temporary password is generated from `node:crypto`, is 24 characters
 *     wide, and is NEVER logged, never written to Supabase, and never returned
 *     anywhere except into the body of the one email we send. It exists in
 *     memory for the length of one webhook and then it is gone;
 *   - the account is flagged `publicMetadata.mustChangePassword`, which the
 *     middleware turns into a hard gate. A password we chose is a password the
 *     client has to replace before they can use the product.
 */
import { randomInt } from 'node:crypto';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * No `l`, `I`, `1`, `O` or `0`. The client reads this out of an email and types
 * it into a form once; a character they cannot tell apart from another one is a
 * failed sign-in and a support message, not a security feature.
 */
const PASSWORD_ALPHABET =
  'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** 24 characters over a 56-symbol alphabet is about 139 bits of entropy. */
const PASSWORD_LENGTH = 24;

/**
 * A temporary password nobody has ever seen, including us.
 *
 * `randomInt` rather than `randomBytes` + modulo: the alphabet does not divide
 * 256 evenly, so the naive version quietly biases the first few letters.
 */
export function generateTempPassword(length = PASSWORD_LENGTH): string {
  let out = '';
  for (let index = 0; index < length; index++) {
    out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  }
  return out;
}

export type GuestAccountKind =
  /** No Clerk user had this address; we created one and chose its password. */
  | 'created'
  /**
   * A Clerk user existed but still carried `mustChangePassword`, which means an
   * earlier attempt at this same provisioning created it and then died before
   * the email went out. The password it was given is unrecoverable by design,
   * so a fresh one is issued.
   */
  | 'reissued'
  /** A real account that already belongs to this person. Left untouched. */
  | 'existing';

export interface GuestAccount {
  clerkUserId: string;
  email: string;
  kind: GuestAccountKind;
  /**
   * Present only for `created` and `reissued`. The caller must put it in the
   * email and then let it fall out of scope.
   */
  tempPassword?: string;
}

/**
 * Finds the Clerk user for a paid deposit's email address, or creates one.
 *
 * Idempotent in the way a webhook needs: called twice for the same address it
 * returns the same user the second time. It is NOT idempotent about the
 * password, and must not be: see `reissued` above. The caller is responsible
 * for not reaching this function at all once provisioning has been recorded as
 * finished, which is what keeps a redelivered Stripe event from invalidating a
 * password the client has already been emailed.
 */
export async function findOrCreateGuestUser(
  email: string
): Promise<GuestAccount> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error('A guest account needs an email address');

  const clerk = await clerkClient();

  // Clerk's `emailAddress` filter is a case-insensitive PARTIAL match, so
  // "ada@example.com" also returns "ada@example.com.br". Re-check exactly.
  const found = await clerk.users.getUserList({
    emailAddress: [normalized],
    limit: 20,
  });
  const existing = found.data.find((user) =>
    user.emailAddresses.some(
      (address) => address.emailAddress.toLowerCase() === normalized
    )
  );

  if (existing) {
    const mustChange =
      (existing.publicMetadata as { mustChangePassword?: unknown } | null)
        ?.mustChangePassword === true;
    if (!mustChange) {
      return { clerkUserId: existing.id, email: normalized, kind: 'existing' };
    }
    const tempPassword = generateTempPassword();
    await clerk.users.updateUser(existing.id, {
      password: tempPassword,
      skipPasswordChecks: true,
    });
    return {
      clerkUserId: existing.id,
      email: normalized,
      kind: 'reissued',
      tempPassword,
    };
  }

  const tempPassword = generateTempPassword();
  const created = await clerk.users.createUser({
    emailAddress: [normalized],
    password: tempPassword,
    // Backend-created addresses are verified by default, which is what we want:
    // Stripe already charged this address, so it is as confirmed as it gets, and
    // a verification round trip between paying and signing in helps nobody.
    skipPasswordChecks: true,
    publicMetadata: { mustChangePassword: true },
  });

  return {
    clerkUserId: created.id,
    email: normalized,
    kind: 'created',
    tempPassword,
  };
}

/**
 * Drops the forced-password-change flag once the client has chosen their own.
 *
 * `updateUserMetadata` deep-merges, so `role` and anything else already on the
 * user survives. The flag is set to `false` rather than deleted because the
 * middleware tests for `=== true` and a false is easier to read in the Clerk
 * dashboard than an absence.
 */
export async function clearMustChangePassword(
  clerkUserId: string
): Promise<void> {
  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { mustChangePassword: false },
  });
}
