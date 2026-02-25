'use client';

import AuthLayout from '@/components/auth/AuthLayout';
import { SignIn } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function TeamLoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c]" suppressHydrationWarning>
        <style jsx global>{`
          body { background: #FAFAFA; }
          @media (prefers-color-scheme: dark) { body { background: #0a0a0c; } }
          .dark body { background: #0a0a0c; }
        `}</style>
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  return (
    <AuthLayout
      title="Team Login"
      subtitle="Sign in to manage client projects and configure services."
      showTeamBadge={true}
      hideFooterStats={true}
    >
      <div className="w-full max-w-[520px] mx-auto">
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white/95 dark:bg-[#1a1a2e]/90 backdrop-blur-2xl rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-lg",
              headerTitle: "text-xl font-semibold text-gray-900 dark:text-white",
              headerSubtitle: "text-sm text-gray-500 dark:text-white/50",
              socialButtonsBlockButton: "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10",
              formFieldLabel: "text-sm text-gray-600 dark:text-white/60",
              formFieldInput: "h-12 rounded-lg bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white",
              formButtonPrimary: "h-12 rounded-lg font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100",
              footerActionLink: "text-[var(--purple)] hover:text-[var(--purple)]/80",
              identityPreviewEditButton: "text-[var(--purple)]",
              formFieldAction: "text-[var(--purple)]",
              otpCodeFieldInput: "border-gray-200 dark:border-white/10",
            },
            layout: {
              socialButtonsPlacement: "bottom",
              showOptionalFields: false,
            },
          }}
          redirectUrl="/team/dashboard"
          signUpUrl="/team/login"
        />
      </div>
    </AuthLayout>
  );
}
