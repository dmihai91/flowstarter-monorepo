import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Flowstarter — your business, online this week',
  description:
    'Describe your business. A crew of AI agents builds your brand, copy and website — you watch it happen live.',
};

// Theme before paint is handled WITHOUT an inline script (those trip React's
// script-tag warning whenever hydration recovers): the "auto" mode resolves in
// pure CSS via prefers-color-scheme (globals.css); explicit picks are applied
// by ThemeProvider after mount.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
            body attributes before hydration; only attribute diffs are suppressed. */}
        <body suppressHydrationWarning>
          <Providers>
            <div className="app-shell">
              <div className="ambient">
                <div className="blob3" />
              </div>
              {children}
            </div>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
