import { describe, expect, it } from 'vitest';

import { withEditorReturnUrl } from '~/lib/clerkSession';

describe('withEditorReturnUrl', () => {
  it('sets redirect_url when missing', () => {
    const out = withEditorReturnUrl(
      'https://flowstarter.dev/admin/login',
      'https://code.flowstarter.dev/projects/x',
    );
    expect(out).toContain('redirect_url=');
    expect(decodeURIComponent(new URL(out).searchParams.get('redirect_url')!)).toBe(
      'https://code.flowstarter.dev/projects/x',
    );
  });

  it('does not overwrite existing redirect_url', () => {
    const base =
      'https://flowstarter.dev/admin/login?redirect_url=https%3A%2F%2Fold.example.com%2Fa';
    const out = withEditorReturnUrl(base, 'https://code.flowstarter.dev/new');
    expect(new URL(out).searchParams.get('redirect_url')).toBe('https://old.example.com/a');
  });

  it('replaces redirect_url when it targets /api/clerk/me', () => {
    const base =
      'https://flowstarter.net/sign-in?redirect_url=' +
      encodeURIComponent('http://localhost:5773/api/clerk/me');
    const out = withEditorReturnUrl(base, 'http://localhost:5733/projects/abc');
    expect(decodeURIComponent(new URL(out).searchParams.get('redirect_url')!)).toBe(
      'http://localhost:5733/projects/abc',
    );
  });

  it('when current page is under /api/, uses origin root as return', () => {
    const base =
      'https://flowstarter.net/sign-in?redirect_url=' +
      encodeURIComponent('http://localhost:5773/api/clerk/me');
    const out = withEditorReturnUrl(base, 'http://localhost:5773/api/clerk/me');
    expect(decodeURIComponent(new URL(out).searchParams.get('redirect_url')!)).toBe(
      'http://localhost:5773/',
    );
  });
});
