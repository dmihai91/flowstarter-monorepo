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
        <style jsx global>{`
          /* Hide Clerk branding and customize header */
          .cl-internal-b3fm6y { display: none !important; }
          .cl-headerTitle { display: none !important; }
          .cl-headerSubtitle { display: none !important; }
          .cl-header { display: none !important; }
          
          /* Hide social login for team */
          .cl-socialButtonsBlockButton { display: none !important; }
          .cl-socialButtonsProviderIcon { display: none !important; }
          .cl-dividerRow { display: none !important; }
          
          /* Hide passkey option */
          .cl-alternativeMethods { display: none !important; }
          
          /* Hide sign up link */
          .cl-footerAction { display: none !important; }
          
          /* Card styling */
          .cl-card {
            background: rgba(255, 255, 255, 0.95) !important;
            border: 1px solid rgba(229, 231, 235, 0.5) !important;
            border-radius: 1rem !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
            padding: 2rem !important;
          }
          
          .dark .cl-card {
            background: rgba(26, 26, 46, 0.9) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          
          /* Form field styling */
          .cl-formFieldLabel {
            font-size: 0.875rem !important;
            color: rgb(75, 85, 99) !important;
            font-weight: 500 !important;
          }
          
          .dark .cl-formFieldLabel {
            color: rgba(255, 255, 255, 0.6) !important;
          }
          
          .cl-formFieldInput {
            height: 3rem !important;
            border-radius: 0.5rem !important;
            border: 1px solid rgb(229, 231, 235) !important;
            background: rgba(255, 255, 255, 0.8) !important;
            font-size: 1rem !important;
          }
          
          .dark .cl-formFieldInput {
            background: rgba(255, 255, 255, 0.05) !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            color: white !important;
          }
          
          .cl-formFieldInput:focus {
            border-color: #7B6AD8 !important;
            box-shadow: 0 0 0 3px rgba(123, 106, 216, 0.1) !important;
          }
          
          /* Button styling */
          .cl-formButtonPrimary {
            height: 3rem !important;
            border-radius: 0.5rem !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
            background: rgb(17, 24, 39) !important;
            transition: all 0.2s !important;
          }
          
          .cl-formButtonPrimary:hover {
            background: rgb(31, 41, 55) !important;
          }
          
          .dark .cl-formButtonPrimary {
            background: white !important;
            color: rgb(17, 24, 39) !important;
          }
          
          .dark .cl-formButtonPrimary:hover {
            background: rgb(243, 244, 246) !important;
          }
          
          /* Link styling */
          .cl-footerActionLink,
          .cl-formFieldAction {
            color: #7B6AD8 !important;
          }
          
          /* OTP input styling */
          .cl-otpCodeFieldInput {
            border-radius: 0.5rem !important;
            border: 1px solid rgb(229, 231, 235) !important;
          }
          
          .dark .cl-otpCodeFieldInput {
            border-color: rgba(255, 255, 255, 0.1) !important;
            background: rgba(255, 255, 255, 0.05) !important;
            color: white !important;
          }
          
          /* Error styling */
          .cl-formFieldErrorText {
            color: rgb(220, 38, 38) !important;
            font-size: 0.875rem !important;
          }
          
          /* Powered by Clerk - hide it */
          .cl-internal-1dauvpw { display: none !important; }
          .cl-footer { display: none !important; }
        `}</style>
        
        {/* Custom header inside the card area */}
        <div className="bg-white/95 dark:bg-[#1a1a2e]/90 backdrop-blur-2xl rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-lg overflow-hidden">
          <div className="text-center pt-8 pb-4 px-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
              Team access only. Contact admin for credentials.
            </p>
          </div>
          
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-none bg-transparent pt-0",
                formButtonPrimary: "bg-gray-900 hover:bg-gray-800",
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
      </div>
    </AuthLayout>
  );
}
