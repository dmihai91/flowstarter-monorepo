import { describe, expect, it } from 'vitest';
import { getInitials } from '../user-utils';

describe('getInitials', () => {
  it('returns first + last initials when both present', () => {
    expect(getInitials({ firstName: 'Darius', lastName: 'Popescu' })).toBe('DP');
  });

  it('returns first initial when only firstName', () => {
    expect(getInitials({ firstName: 'Darius' })).toBe('D');
  });

  it('returns email initial when no name', () => {
    expect(getInitials({ emailAddresses: [{ emailAddress: 'test@example.com' }] })).toBe('T');
  });

  it('returns U as fallback', () => {
    expect(getInitials({})).toBe('U');
  });

  it('handles null values', () => {
    expect(getInitials({ firstName: null, lastName: null })).toBe('U');
  });

  it('uppercases initials', () => {
    expect(getInitials({ firstName: 'darius', lastName: 'popescu' })).toBe('DP');
  });
});
