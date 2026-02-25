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
          /* Hide everything we don't need */
          .cl-headerTitle, .cl-headerSubtitle, .cl-header,
          .cl-socialButtonsBlockButton, .cl-socialButtons, .cl-socialButtonsProviderIcon,
          .cl-dividerRow, .cl-dividerLine, .cl-dividerText,
          .cl-alternativeMethods, .cl-footerAction, .cl-footer,
          .cl-internal-b3fm6y, .cl-internal-1dauvpw,
          [data-localization-key="signIn.start.actionLink"],
          [data-localization-key="dividerText"] { 
            display: none !important; 
          }
          
          /* Root styling */
          .cl-rootBox {
            width: 100% !important;
          }
          
          /* Card - make transparent since we have our own wrapper */
          .cl-card {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 2rem 2rem 2rem !important;
          }
          
          /* Form field label */
          .cl-formFieldLabel {
            font-size: 0.875rem !important;
            font-weight: 500 !important;
            color: rgb(75, 85, 99) !important;
            margin-bottom: 0.5rem !important;
          }
          
          .dark .cl-formFieldLabel {
            color: rgba(255, 255, 255, 0.6) !important;
          }
          
          /* Form field input */
          .cl-formFieldInput,
          .cl-formFieldInput[type="email"],
          .cl-formFieldInput[type="password"],
          .cl-formFieldInput[type="text"] {
            height: 3rem !important;
            border-radius: 0.5rem !important;
            border: 1px solid rgb(229, 231, 235) !important;
            background: white !important;
            font-size: 1rem !important;
            padding: 0 1rem !important;
            color: rgb(17, 24, 39) !important;
          }
          
          .dark .cl-formFieldInput,
          .dark .cl-formFieldInput[type="email"],
          .dark .cl-formFieldInput[type="password"],
          .dark .cl-formFieldInput[type="text"] {
            background: rgba(255, 255, 255, 0.05) !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            color: white !important;
          }
          
          .cl-formFieldInput::placeholder {
            color: rgb(156, 163, 175) !important;
          }
          
          .dark .cl-formFieldInput::placeholder {
            color: rgba(255, 255, 255, 0.3) !important;
          }
          
          .cl-formFieldInput:focus {
            border-color: #7B6AD8 !important;
            box-shadow: 0 0 0 3px rgba(123, 106, 216, 0.15) !important;
            outline: none !important;
          }
          
          /* Primary button */
          .cl-formButtonPrimary,
          button.cl-formButtonPrimary {
            height: 3rem !important;
            border-radius: 0.5rem !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
            background-color: rgb(17, 24, 39) !important;
            color: white !important;
            border: none !important;
            margin-top: 0.5rem !important;
            transition: background-color 0.2s !important;
          }
          
          .cl-formButtonPrimary:hover,
          button.cl-formButtonPrimary:hover {
            background-color: rgb(31, 41, 55) !important;
          }
          
          .dark .cl-formButtonPrimary,
          .dark button.cl-formButtonPrimary {
            background-color: white !important;
            color: rgb(17, 24, 39) !important;
          }
          
          .dark .cl-formButtonPrimary:hover,
          .dark button.cl-formButtonPrimary:hover {
            background-color: rgb(243, 244, 246) !important;
          }
          
          /* Form field row spacing */
          .cl-formFieldRow {
            margin-bottom: 1.25rem !important;
          }
          
          /* Links */
          .cl-footerActionLink,
          .cl-formFieldAction {
            color: #7B6AD8 !important;
          }
          
          /* OTP/verification code inputs */
          .cl-otpCodeFieldInput {
            border-radius: 0.5rem !important;
            border: 1px solid rgb(229, 231, 235) !important;
            font-size: 1.5rem !important;
          }
          
          .dark .cl-otpCodeFieldInput {
            border-color: rgba(255, 255, 255, 0.1) !important;
            background: rgba(255, 255, 255, 0.05) !important;
            color: white !important;
          }
          
          /* Error messages */
          .cl-formFieldErrorText {
            color: rgb(220, 38, 38) !important;
            font-size: 0.875rem !important;
            margin-top: 0.25rem !important;
          }
          
          /* Alert/info boxes */
          .cl-alert {
            border-radius: 0.5rem !important;
            font-size: 0.875rem !important;
          }
          
          /* Back button */
          .cl-identityPreviewEditButton {
            color: #7B6AD8 !important;
          }
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
            routing="hash"
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
            forceRedirectUrl="/team/dashboard"
            signUpUrl="/team/login"
          />
        </div>
      </div>
    </AuthLayout>
  );
}
