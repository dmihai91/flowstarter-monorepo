'use client';
import { useTranslations } from '@/lib/i18n';

import AuthLayout from '@/components/auth/AuthLayout';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { EmailInput } from '@/components/ui/email-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTeamJoinValidation, useTeamJoin } from '@/hooks/useTeamJoin';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const inputCls =
  'h-12 rounded-lg bg-white/80 border border-white/40 dark:border-white/10 text-foreground placeholder:text-muted-foreground/50 dark:bg-[var(--surface-2)]/80 dark:text-white backdrop-blur-sm';

function JoinPageContent() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    data: validationData,
    isLoading: isValidating,
    error: validationError,
  } = useTeamJoinValidation(token);
  const joinMutation = useTeamJoin();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (joinMutation.isSuccess) {
      const timer = setTimeout(() => {
        router.push('/admin/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [joinMutation.isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

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

  if (!token) {
    return (
      <AuthLayout title="Invalid Invitation">
        <AuthFormCard>
          <div className="text-center space-y-5 py-2">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-[var(--fs-ink-faint)]">
              Invalid invitation link
            </p>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--fs-rule-strong)] px-5 text-sm font-medium text-[var(--fs-ink)] transition-colors hover:bg-[var(--fs-glass-bg)]"
            >
              Go to Homepage
            </Link>
          </div>
        </AuthFormCard>
      </AuthLayout>
    );
  }

  if (isValidating) {
    return (
      <AuthLayout title="Validating invitation">
        <AuthFormCard>
          <div className="flex flex-col items-center justify-center gap-3 py-6">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--purple)]" />
            <p className="text-sm text-[var(--fs-ink-faint)]">
              Checking your invitation…
            </p>
          </div>
        </AuthFormCard>
      </AuthLayout>
    );
  }

  if (validationError || !validationData?.valid) {
    const errorMessage =
      validationError instanceof Error
        ? validationError.message
        : validationData?.error || t('team.join.invalidInvitation');

    return (
      <AuthLayout title="Invalid Invitation">
        <AuthFormCard>
          <div className="text-center space-y-5 py-2">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm text-[var(--fs-ink-faint)]">{errorMessage}</p>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--fs-rule-strong)] px-5 text-sm font-medium text-[var(--fs-ink)] transition-colors hover:bg-[var(--fs-glass-bg)]"
            >
              Go to Homepage
            </Link>
          </div>
        </AuthFormCard>
      </AuthLayout>
    );
  }

  if (joinMutation.isSuccess) {
    return (
      <AuthLayout title="Account Created">
        <AuthFormCard>
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-sm text-[var(--fs-ink-faint)]">
              Redirecting you to sign in…
            </p>
            <Loader2 className="w-5 h-5 animate-spin text-[var(--purple)] mx-auto" />
          </div>
        </AuthFormCard>
      </AuthLayout>
    );
  }

  const email = validationData.email || '';

  return (
    <AuthLayout
      title="Join the team"
      subtitle="You've been invited to collaborate on Flowstarter"
    >
      <AuthFormCard
        footer={
          <p className="text-xs text-[var(--fs-ink-faint)]">
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
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="join-email"
              className="text-sm text-muted-foreground"
            >
              Email
            </Label>
            <EmailInput
              id="join-email"
              value={email}
              onChange={() => {}}
              disabled
              showInlineError={false}
              className={`${inputCls} opacity-70`}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="join-password"
              className="text-sm text-muted-foreground"
            >
              Create password
            </Label>
            <div className="relative">
              <Input
                id="join-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('team.join.passwordPlaceholder')}
                className={`${inputCls} pr-12`}
                required
                minLength={8}
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="join-confirm"
              className="text-sm text-muted-foreground"
            >
              Confirm password
            </Label>
            <Input
              id="join-confirm"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('team.join.repeatPassword')}
              className={inputCls}
              required
            />
          </div>

          {(submitError || joinMutation.error) && (
            <div className="text-red-400 text-xs mt-1">
              {submitError || joinMutation.error?.message}
            </div>
          )}

          <AuthSubmitButton
            type="submit"
            disabled={joinMutation.isPending}
            className="mt-4"
          >
            {joinMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account…
              </span>
            ) : (
              'Create Account'
            )}
          </AuthSubmitButton>
        </form>
      </AuthFormCard>
    </AuthLayout>
  );
}

export default function TeamJoinPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Loading">
          <AuthFormCard>
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-7 h-7 animate-spin text-[var(--purple)]" />
            </div>
          </AuthFormCard>
        </AuthLayout>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}
