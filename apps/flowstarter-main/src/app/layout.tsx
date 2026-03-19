// Polyfill localStorage/sessionStorage for Node.js 22+ SSR compatibility
import '@/lib/storage-polyfill';

import { DatabaseOfflineHandler } from '@/components/DatabaseOfflineHandler';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundary';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/lib/i18n';
import ro from '@/locales/ro';
import { getServerT } from '@/lib/i18n-server';
import en from '@/locales/en';
import '@/styles/globals.css';
import '@fontsource/inter/latin.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/roboto-mono/latin.css';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ClerkThemeWrapper } from './components/ClerkThemeWrapper';
import { ClientLayout } from './components/ClientLayout';
import { NavigationWrapper } from './components/NavigationWrapper';

const inter = {
  variable: '--font-inter',
};

const roboto_mono = {
  variable: '--font-roboto-mono',
};

const poppins = {
  variable: '--font-poppins',
};

export async function generateMetadata(): Promise<Metadata> {
  // Get locale from headers or use default 'en'
  // In a real app, you'd get this from headers/cookies
  const locale = 'en';
  const t = await getServerT(locale);

  return {
    title: t('app.title'),
    description: t('app.description'),
    openGraph: {
      title: t('app.title'),
      description: t('app.description'),
      siteName: 'Flowstarter',
      type: 'website',
      url: 'https://flowstarter.dev',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('app.title'),
      description: t('app.description'),
    },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get nonce from middleware for CSP
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || '';

  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${roboto_mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Read from shared cookie first (synced across subdomains)
                  var cookieTheme = document.cookie.split(';').map(function(c) { return c.trim(); })
                    .find(function(c) { return c.startsWith('flowstarter_theme='); });
                  var theme = cookieTheme ? cookieTheme.split('=')[1] : null;
                  // Fall back to localStorage, then default to system
                  if (!theme || !['light','dark','system'].includes(theme)) {
                    theme = localStorage.getItem('theme') || localStorage.getItem('flowstarter_theme') || 'system';
                  }
                  // Migrate localStorage to cookie
                  if (!cookieTheme && theme !== 'system') {
                    var domain = location.hostname.includes('flowstarter.dev') ? '; domain=.flowstarter.dev' : '';
                    document.cookie = 'flowstarter_theme=' + theme + '; path=/; max-age=31536000; SameSite=Lax' + domain;
                  }
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var resolvedTheme = theme === 'system' ? systemTheme : theme;
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(resolvedTheme);
                  document.documentElement.setAttribute('data-theme', resolvedTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="font-sans min-h-screen bg-[var(--landing-bg)] dark:bg-[var(--landing-dark-surface,#0a0a0f)]"
        style={{ fontFamily: 'var(--font-inter)' }}
        suppressHydrationWarning
      >
        <GoogleAnalytics
          measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''}
        />
        <ErrorBoundaryWrapper>
          <ThemeProvider>
            <I18nProvider initialLocale="en" initialMessages={{ en, ro }}>
              <ClerkThemeWrapper>
                <DatabaseOfflineHandler>
                  <ClientLayout>
                    <NavigationWrapper />
                    {children}
                  </ClientLayout>
                </DatabaseOfflineHandler>
              </ClerkThemeWrapper>
            </I18nProvider>
          </ThemeProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
