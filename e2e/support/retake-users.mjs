/**
 * Mints and destroys the two Clerk users the re-take run films with.
 *
 * The instance is Clerk's TEST instance (sk_test_/pk_test_ in the app's own
 * .env), and every user this creates is deleted again by `delete`, which then
 * asks Clerk for the user back and requires a 404. A run that leaves an
 * account behind has left a real account behind, so the teardown verifies
 * rather than assumes.
 *
 * The operator address is at flowstarter.dev because operator role resolves
 * from the email domain — the same rule the app applies to a real teammate,
 * with no publicMetadata poked in to fake it.
 *
 *   node e2e/support/retake-users.mjs mint
 *   node e2e/support/retake-users.mjs delete
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { loadEnv } from './showcase-lib.mjs';

export const USERS_FILE = '/tmp/retake-users.json';
const SK = loadEnv().CLERK_SECRET_KEY;
const API = 'https://api.clerk.com/v1';

const clerk = async (path, init = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${SK}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

async function mint() {
  const stamp = Date.now();
  const spec = {
    client: {
      email: `retake-client-${stamp}@example.com`,
      password: `Rc-${randomBytes(12).toString('base64url')}`,
      first_name: 'Nadia',
      last_name: 'Marsh',
    },
    operator: {
      email: `retake-operator-${stamp}@flowstarter.dev`,
      password: `Ro-${randomBytes(12).toString('base64url')}`,
      first_name: 'Owen',
      last_name: 'Reilly',
    },
  };

  const out = {};
  for (const [role, who] of Object.entries(spec)) {
    const { status, body } = await clerk('/users', {
      method: 'POST',
      body: JSON.stringify({
        email_address: [who.email],
        password: who.password,
        // This instance requires a name on a user; Clerk refuses the create
        // without one, so the two demo people have names.
        first_name: who.first_name,
        last_name: who.last_name,
        skip_password_checks: true,
      }),
    });
    if (status !== 200) {
      throw new Error(`mint ${role} -> ${status} ${JSON.stringify(body).slice(0, 300)}`);
    }
    out[role] = { ...who, id: body.id };
    console.log(`minted ${role}  ${body.id}  ${who.email}`);
  }
  writeFileSync(USERS_FILE, JSON.stringify(out, null, 2));
}

async function destroy() {
  if (!existsSync(USERS_FILE)) {
    console.log('no user file — nothing to delete');
    return;
  }
  const users = JSON.parse(readFileSync(USERS_FILE, 'utf8'));
  let clean = true;
  for (const [role, who] of Object.entries(users)) {
    const del = await clerk(`/users/${who.id}`, { method: 'DELETE' });
    // The proof is the read-back, not the delete's own status code.
    const after = await clerk(`/users/${who.id}`);
    const gone = after.status === 404;
    if (!gone) clean = false;
    console.log(
      `deleted ${role} ${who.id} -> DELETE ${del.status} · GET ${after.status} ${
        gone ? '(gone)' : '(STILL PRESENT)'
      }`
    );
  }
  if (!clean) process.exitCode = 1;
}

// Only when run directly: the recorders import USERS_FILE from here, and an
// import must not mint or delete anything.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2];
  if (cmd === 'mint') await mint();
  else if (cmd === 'delete') await destroy();
  else {
    console.error('usage: retake-users.mjs mint|delete');
    process.exit(1);
  }
}
