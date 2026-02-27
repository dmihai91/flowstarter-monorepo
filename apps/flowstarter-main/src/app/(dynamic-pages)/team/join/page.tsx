'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';
import { useTeamJoinValidation, useTeamJoin } from '@/hooks/useTeamJoin';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense, useEffect } from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react';

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // React Query hooks
  const { data: validationData, isLoading: isValidating, error: validationError } = useTeamJoinValidation(token);
  const joinMutation = useTeamJoin();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Redirect on success
  useEffect(() => {
    if (joinMutation.isSuccess) {
      const timer = setTimeout(() => {
        router.push('/team/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [joinMutation.isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate passwords
    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }

    if (!token) return;

    joinMutation.mutate(token);
  };

  // Error state - no token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c] px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-500 dark:text-white/50 mb-6">Invalid invitation link</p>
          <Link href="/">
            <Button variant="outline" className="rounded-xl">
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)] mx-auto mb-4" />
          <p className="text-gray-500 dark:text-white/50">
            Validating invitation...
          </p>
        </div>
      </div>
    );
  }

  // Validation error state
  if (validationError || !validationData?.valid) {
    const errorMessage = validationError instanceof Error 
      ? validationError.message 
      : validationData?.error || 'Invalid invitation';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c] px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-500 dark:text-white/50 mb-6">{errorMessage}</p>
          <Link href="/">
            <Button variant="outline" className="rounded-xl">
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (joinMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c] px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Account Created!
          </h1>
          <p className="text-gray-500 dark:text-white/50 mb-6">
            Redirecting you to sign in...
          </p>
          <Loader2 className="w-5 h-5 animate-spin text-[var(--purple)] mx-auto" />
        </div>
      </div>
    );
  }

  const email = validationData.email || '';
  const inviterName = 'Your team';

  // Form state
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }
      `}</style>

      <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#0a0a0c] font-display">
        {/* Header */}
        <header className="p-6">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <Logo size="md" />
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Join the team
              </h1>
              <p className="text-gray-500 dark:text-white/50">
                {inviterName} has invited you to join Flowstarter
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 shadow-xl shadow-gray-200/20 dark:shadow-none">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email (readonly) */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 dark:text-white/60">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      disabled
                      className="h-12 pl-11 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 dark:text-white/60">
                    Create password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="h-12 pl-11 pr-11 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 dark:text-white/60">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="h-12 pl-11 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                      required
                    />
                  </div>
                </div>

                {/* Error message */}
                {(submitError || joinMutation.error) && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {submitError || joinMutation.error?.message}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={joinMutation.isPending}
                  className="w-full h-12 rounded-lg font-semibold bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-md transition-all disabled:opacity-50"
                >
                  {joinMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </div>

            <p className="text-center text-sm text-gray-400 dark:text-white/30 mt-6">
              By joining, you agree to our{' '}
              <Link
                href="/terms"
                className="text-[var(--purple)] hover:underline"
              >
                Terms
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="text-[var(--purple)] hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

export default function TeamJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
        </div>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}
