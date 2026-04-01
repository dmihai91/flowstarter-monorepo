import { describe, expect, it } from 'vitest';
import { hasServerTeamAccess, isTeamEmail } from './serverTeamAccess';

describe('serverTeamAccess', () => {
  it('accepts known Flowstarter team email domains', () => {
    expect(isTeamEmail('operator@flowstarter.app')).toBe(true);
    expect(isTeamEmail('partner@example.com')).toBe(false);
  });

  it('accepts explicit team roles in session claims', () => {
    expect(
      hasServerTeamAccess({
        public_metadata: { role: 'team' },
        email: 'client@example.com',
      }),
    ).toBe(true);
  });

  it('accepts team users by email domain when no role is set', () => {
    expect(
      hasServerTeamAccess({
        email: 'operator@flowstarter.dev',
      }),
    ).toBe(true);
  });

  it('rejects non-team users', () => {
    expect(
      hasServerTeamAccess({
        email: 'client@example.com',
        public_metadata: { role: 'client' },
      }),
    ).toBe(false);
  });
});
