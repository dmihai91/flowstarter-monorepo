'use client';

import { AuthSubmitButton } from './AuthSubmitButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';
import { useSignIn } from '@clerk/nextjs/legacy';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  useClerkErrorHandler,
  useEdgeBrowserDetection,
  useSocialAuth,
} from './hooks';
import { SocialAuth } from './SocialAuth';
import { TOTPStep } from './TOTPStep';
import { ForgotPasswordSend, ForgotPasswordReset } from './ForgotPasswordFlow';
import { isTrustedHost, isTeamEmail } from '@flowstarter/platform-config';

type FlowStep = 'credentials' | 'totp' | 'forgot' | 'forgot-code';

interface LoginFormProps {
  /** Controls social auth, 2FA, forgot password, and redirect behaviour. */
  variant: 'client' | 'team';
}

function clerkErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'errors' in error) {
    const msg = (error as { errors?: Array<{ message?: string }> }).errors?.[0]
      ?.message;
    if (msg) return msg;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * Unified login form used by both the client and team login pages.
 *
 * client variant  → social auth, forgot-password flow
 * team variant    → TOTP 2FA step, team-specific redirect logic
 */
export function LoginForm({ variant }: LoginFormProps) {
  const { signIn, setActive } = useSignIn();
  const { t } = useTranslations();
  const { handleError } = useClerkErrorHandler();
  const isEdgeBrowser = useEdgeBrowserDetection();
  const searchParams = useSearchParams();

  const isClient = variant === 'client';
  const isTeam = variant === 'team';

  /* ------------------------------------------------------------------ */
  /*  Redirect helpers                                                   */
  /* ------------------------------------------------------------------ */

  const getRedirectTarget = (
    userEmail?: string
  ): { url: string; external: boolean } => {
    // Honour explicit redirect_url (e.g. editor subdomain)
    const redirectUrl = searchParams.get('redirect_url');
    if (redirectUrl) {
      try {
        const url = new URL(redirectUrl);
        if (isTrustedHost(url.hostname)) {
          const isCrossDomain =
            typeof window !== 'undefined' &&
            url.hostname !== window.location.hostname;
          return { url: redirectUrl, external: isCrossDomain };
        }
      } catch {
        /* invalid URL – fall through */
      }
    }

    if (isTeam) {
      const nextUrl = searchParams.get('next');
      if (nextUrl && nextUrl.startsWith('/'))
        return { url: nextUrl, external: false };
      return { url: '/team/dashboard', external: false };
    }

    // Client: route team-domain emails to team dashboard
    if (userEmail && isTeamEmail(userEmail)) {
      return { url: '/team/dashboard', external: false };
    }
    return { url: '/dashboard', external: false };
  };

  const navigate = async (sessionId: string | null, userEmail?: string) => {
    if (!setActive) return;

    const target = getRedirectTarget(userEmail);
    if (target.external) {
      // Activate session first so transfer-token API can read it
      await setActive({ session: sessionId });
      // Fetch a short-lived Clerk sign-in token for the cross-domain app
      try {
        const res = await fetch('/api/auth/transfer-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ redirectUrl: target.url }),
        });
        if (res.ok) {
          const { url } = await res.json();
          window.location.href = url;
          return;
        }
      } catch {
        // fall through to plain redirect
      }
      window.location.href = target.url;
    } else {
      await setActive({ session: sessionId });
      window.location.href = target.url;
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Social auth (client only)                                          */
  /* ------------------------------------------------------------------ */

  const defaultRedirect = getRedirectTarget().url;
  const { isGoogleLoading, isAppleLoading, handleGoogleAuth, handleAppleAuth } =
    useSocialAuth(isClient ? signIn : undefined, {
      redirectUrlComplete: defaultRedirect,
    });

  /* ------------------------------------------------------------------ */
  /*  Local state                                                        */
  /* ------------------------------------------------------------------ */

  const [step, setStep] = useState<FlowStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA (team)
  const [code, setCode] = useState('');

  // Forgot-password (client)
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const goBack = () => {
    setError('');
    setCode('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setStep('credentials');
  };

  /* ------------------------------------------------------------------ */
  /*  Credentials submit (shared)                                        */
  /* ------------------------------------------------------------------ */

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !email || !password) return;
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === 'complete') {
        await navigate(result.createdSessionId, email);
      } else if (isTeam && result.status === 'needs_second_factor') {
        const hasTOTP = result.supportedSecondFactors?.some(
          (f) => f.strategy === 'totp'
        );
        if (hasTOTP) {
          setStep('totp');
        } else {
          setError('Two-factor authentication required. Please contact admin.');
        }
      } else if (result.status === 'needs_first_factor') {
        setError('Password sign-in not available for this account');
      } else {
        setError(`Sign in incomplete: ${result.status}`);
      }
    } catch (err: unknown) {
      if (isClient) {
        const message = handleError(err, 'signIn');
        if (message === '__SESSION_EXISTS__') {
          window.location.href = getRedirectTarget(email).url;
          return;
        }
        setError(message);
      } else {
        const ce = err as { errors?: Array<{ message?: string }> };
        setError(ce.errors?.[0]?.message || t('team.login.invalidCredentials'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  TOTP submit (team)                                                 */
  /* ------------------------------------------------------------------ */

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !code) return;
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code,
      });
      if (result.status === 'complete') {
        await navigate(result.createdSessionId, email);
      } else {
        setError('Verification failed');
      }
    } catch (err: unknown) {
      const ce = err as { errors?: Array<{ message?: string }> };
      setError(ce.errors?.[0]?.message || t('team.login.invalidCode'));
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Forgot-password handlers (client)                                  */
  /* ------------------------------------------------------------------ */

  const handleForgotSend = async () => {
    if (!signIn || !resetEmail) return;
    setIsResetLoading(true);
    setError('');
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: resetEmail,
      });
      setStep('forgot-code');
    } catch (err: unknown) {
      setError(clerkErrorMessage(err, t('auth.errors.somethingWentWrong')));
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleForgotReset = async () => {
    if (!signIn || !resetCode || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setError(t('auth.forgotPassword.passwordsDoNotMatch'));
      return;
    }
    setIsResetLoading(true);
    setError('');
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      });
      if (result.status === 'complete') {
        await navigate(result.createdSessionId, resetEmail);
      }
    } catch (err: unknown) {
      setError(clerkErrorMessage(err, t('auth.forgotPassword.invalidCode')));
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleForgotResend = async () => {
    if (!signIn || !resetEmail) return;
    setIsResetLoading(true);
    setError('');
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: resetEmail,
      });
    } catch (err: unknown) {
      setError(clerkErrorMessage(err, t('auth.errors.somethingWentWrong')));
    } finally {
      setIsResetLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Shared input classes                                               */
  /* ------------------------------------------------------------------ */

  const inputCls =
    'h-12 rounded-lg bg-white/80 border border-white/40 dark:border-white/10 text-foreground placeholder:text-muted-foreground/50 dark:bg-[var(--surface-2)]/80 dark:text-white backdrop-blur-sm';

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  /* ---- TOTP step (team) ---- */
  if (isTeam && step === 'totp') {
    return (
      <TOTPStep
        code={code}
        onCodeChange={setCode}
        error={error}
        isLoading={isLoading}
        onSubmit={handleTotpSubmit}
        onBack={goBack}
        t={t}
      />
    );
  }

  /* ---- Forgot-password: send code (client) ---- */
  if (isClient && step === 'forgot') {
    return (
      <ForgotPasswordSend
        email={resetEmail}
        onEmailChange={setResetEmail}
        error={error}
        isLoading={isResetLoading}
        onSend={handleForgotSend}
        onBack={goBack}
        t={t}
      />
    );
  }

  /* ---- Forgot-password: enter code + new password (client) ---- */
  if (isClient && step === 'forgot-code') {
    return (
      <ForgotPasswordReset
        code={resetCode}
        onCodeChange={setResetCode}
        newPassword={newPassword}
        onNewPasswordChange={setNewPassword}
        confirmPassword={confirmPassword}
        onConfirmPasswordChange={setConfirmPassword}
        error={error}
        isLoading={isResetLoading}
        onReset={handleForgotReset}
        onResend={handleForgotResend}
        onBack={goBack}
        t={t}
      />
    );
  }

  /* ---- Credentials step (shared) ---- */
  return (
    <div className="w-full">
      {/* Social auth (client only) */}
      {isClient && (
        <SocialAuth
          onGoogleClick={handleGoogleAuth}
          onAppleClick={handleAppleAuth}
          isGoogleLoading={isGoogleLoading}
          isAppleLoading={isAppleLoading}
        />
      )}

      {/* CAPTCHA Element for Clerk */}
      <div id="clerk-captcha" />

      <form
        onSubmit={handleCredentialsSubmit}
        className="flex flex-col space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-muted-foreground">
            {isTeam ? t('team.login.emailLabel') : t('auth.email')}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={
              isTeam
                ? t('team.login.emailPlaceholder')
                : t('auth.email.placeholder')
            }
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            required
            autoFocus={isTeam}
          />
        </div>

        <div className="space-y-2 -mt-1">
          <Label htmlFor="password" className="text-sm text-muted-foreground">
            {isTeam ? t('team.login.passwordLabel') : t('auth.password')}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={
                isTeam
                  ? t('team.login.passwordPlaceholder')
                  : t('auth.password.placeholder')
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pr-12`}
              required
            />
            {(isTeam || !isEdgeBrowser) && password && (
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
          {/* Forgot password (client only) */}
          {isClient && (
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('forgot');
                  setResetEmail(email);
                }}
                className="text-sm text-[var(--fs-ink-dim)] hover:text-[var(--fs-ink)] transition-colors hover:underline"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>
          )}
        </div>

        {error && <div className="text-red-400 text-xs mt-1">{error}</div>}

        <AuthSubmitButton
          type="submit"
          disabled={isLoading || !email || !password}
          className="mt-4"
        >
          {isLoading
            ? isTeam
              ? t('team.login.signingIn')
              : t('auth.signIn.signingIn')
            : isTeam
            ? t('team.login.signIn')
            : t('auth.signIn')}
        </AuthSubmitButton>
      </form>
    </div>
  );
}
