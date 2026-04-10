import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import {
  getSharedCookieDomain,
  getTeamLoginUrl,
  getAllowedRedirectOrigins,
} from "@flowstarter/platform-config";

export const metadata: Metadata = {
  title: "Flowstarter Editor",
  description: "AI-powered site editor — powered by Flowstarter",
};

function EditorClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl={getTeamLoginUrl()}
      signUpUrl={getTeamLoginUrl()}
      allowedRedirectOrigins={getAllowedRedirectOrigins()}
    >
      {children}
    </ClerkProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
    document.documentElement.classList.add('dark');
  }
})();
`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#101014] text-white antialiased">
        <EditorClerkProvider>{children}</EditorClerkProvider>
      </body>
    </html>
  );
}
