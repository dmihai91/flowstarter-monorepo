// Polyfill localStorage/sessionStorage for Node.js 22+ SSR compatibility
import '@/lib/storage-polyfill';

import { DatabaseOfflineHandler } from '@/components/DatabaseOfflineHandler';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundary';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/lib/i18n';
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
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
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
                  const theme = localStorage.getItem('theme') || 'auto';
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const resolvedTheme = theme === 'auto' ? systemTheme : theme;
                  document.documentElement.classList.add(resolvedTheme);
                  if (resolvedTheme === 'dark') {
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="font-sans min-h-screen"
        style={{ fontFamily: 'var(--font-inter)' }}
        suppressHydrationWarning
      >
        <GoogleAnalytics
          measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''}
        />
        <ErrorBoundaryWrapper>
          <ThemeProvider>
            <I18nProvider initialLocale="en" initialMessages={{ en }}>
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
