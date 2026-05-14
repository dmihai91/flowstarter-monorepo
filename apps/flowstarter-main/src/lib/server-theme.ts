import { cookies, headers } from 'next/headers';

const THEME_COOKIE = 'flowstarter_theme';

export type ServerThemePreference = 'light' | 'dark' | 'auto';

/**
 * Matches the blocking inline script in app/layout.tsx as far as cookies + Client
 * Hints allow (~= flowstarter_theme + system preference). Keeps ThemeProvider /
 * Clerk appearance identical on SSR and the first hydrated frame so we avoid
 * React #418-style mismatches from server `light` vs client `dark`.
 */
export async function getServerThemeInit(): Promise<{
  initialTheme: ServerThemePreference;
  initialResolvedTheme: 'light' | 'dark';
}> {
  const cookieStore = await cookies();
  const headerList = await headers();
  const raw = cookieStore.get(THEME_COOKIE)?.value;

  let cookiePref: 'light' | 'dark' | 'system' = 'system';
  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    cookiePref = raw;
  }

  const initialTheme: ServerThemePreference =
    cookiePref === 'system' ? 'auto' : cookiePref;

  const ch = headerList.get('sec-ch-prefers-color-scheme');
  const systemIsDark = ch === 'dark';

  const initialResolvedTheme: 'light' | 'dark' =
    cookiePref === 'light'
      ? 'light'
      : cookiePref === 'dark'
      ? 'dark'
      : systemIsDark
      ? 'dark'
      : 'light';

  return { initialTheme, initialResolvedTheme };
}
