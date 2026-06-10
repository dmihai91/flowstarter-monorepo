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

// Resolve theme before paint to avoid a flash (cookie-less: localStorage + system).
const themeScript = `
(function(){
  try {
    var m = localStorage.getItem('fs-theme-mode');
    var sys = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'studio';
    var t = (m === 'studio' || m === 'midnight') ? m : sys;
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) { document.documentElement.setAttribute('data-theme', 'studio'); }
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" data-theme="studio" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
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
