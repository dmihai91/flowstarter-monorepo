import type { Metadata } from "next";
import { CodeClerkProvider } from "@/components/auth/CodeClerkProvider";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowstarter Code",
  description: "Secure coding agent — powered by Flowstarter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Inline theme script — runs synchronously before paint, no flash */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var stored = localStorage.getItem('fs-theme');
    var dark = stored === 'dark' ||
      (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch(e) {
    // SSR / private mode — default to system via CSS media query
    document.documentElement.classList.add('system-theme');
  }
})();
`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--ui-bg-base)] text-[var(--ui-text-primary)] antialiased transition-colors duration-200">
        <CodeClerkProvider>
          <I18nProvider>{children}</I18nProvider>
        </CodeClerkProvider>
      </body>
    </html>
  );
}
