import { describe, expect, it } from 'vitest';
import { guestNameParts } from '../guest-credentials';

describe('the name a paid guest account is created with', () => {
  it('splits the intake name into first and last', () => {
    expect(guestNameParts('Maria Ionescu', 'm@example.com')).toEqual({
      firstName: 'Maria',
      lastName: 'Ionescu',
    });
    expect(guestNameParts('  Ana  Maria Radu ', 'a@example.com')).toEqual({
      firstName: 'Ana',
      lastName: 'Maria Radu',
    });
  });

  it('never leaves a required field empty: a single word or no name still creates the account', () => {
    expect(guestNameParts('Maria', 'm@example.com')).toEqual({
      firstName: 'Maria',
      lastName: 'Client',
    });
    expect(guestNameParts('', 'bogdan+clerk_test@example.com')).toEqual({
      firstName: 'Bogdan',
      lastName: 'Client',
    });
    expect(guestNameParts(null, '@example.com').firstName).toBe('Client');
  });
});
