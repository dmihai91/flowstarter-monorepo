'use client';

import { AuthSubmitButton } from './AuthSubmitButton';
import { EmailInput, isValidEmail } from '@/components/ui/email-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';
import { useSignIn } from '@clerk/nextjs/legacy';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useClerkErrorHandler, useEdgeBrowserDetection } from './hooks';
import { ForgotPasswordSend, ForgotPasswordReset } from './ForgotPasswordFlow';
import { isTrustedHost, isTeamEmail } from '@flowstarter/platform-config';

type FlowStep = 'credentials' | 'forgot' | 'forgot-code' | 'mfa';

type MfaReturnStep = 'credentials' | 'forgot-code';

function supportedMfaStrategies(
  factors: Array<{ strategy: string }> | null | undefined
): { totp: boolean; backup: boolean } {
  const list = factors ?? [];
  return {
    totp: list.some((f) => f.strategy === 'totp'),
    backup: list.some((f) => f.strategy === 'backup_code'),
  };
}

interface LoginFormProps {
  /** Controls forgot password and redirect behaviour. */
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
 * Both variants share the same email + password + forgot-password UI. The
 * `variant` prop only changes redirect behaviour (team accounts go to
 * `/admin/dashboard`, client accounts to `/dashboard`).
 *
 * Social auth (Google / Apple) is not shown here. When Clerk requires a second
 * factor after password or password-reset, TOTP and backup codes are supported;
 * other factors (e.g. SMS/email code) show a short explanation.
 */
export function LoginForm({ variant }: LoginFormProps) {
  const { signIn, setActive } = useSignIn();
  const { t } = useTranslations();
  const { handleError } = useClerkErrorHandler();
  const isEdgeBrowser = useEdgeBrowserDetection();
  const searchParams = useSearchParams();

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
      return { url: '/admin/dashboard', external: false };
    }

    // Client: route team-domain emails to the admin dashboard
    if (userEmail && isTeamEmail(userEmail)) {
      return { url: '/admin/dashboard', external: false };
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
  /*  Local state                                                        */
  /* ------------------------------------------------------------------ */

  const [step, setStep] = useState<FlowStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot-password (shared between client + team)
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const [mfaReturnStep, setMfaReturnStep] =
    useState<MfaReturnStep>('credentials');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaStrategy, setMfaStrategy] = useState<'totp' | 'backup_code'>(
    'totp'
  );
  const [mfaChoices, setMfaChoices] = useState({ totp: false, backup: false });
  const [isMfaLoading, setIsMfaLoading] = useState(false);

  const goBackFromMfa = () => {
    setError('');
    setMfaCode('');
    setStep(mfaReturnStep);
  };

  const enterMfaStep = (returnStep: MfaReturnStep) => {
    if (!signIn) return;
    const { totp, backup } = supportedMfaStrategies(
      signIn.supportedSecondFactors
    );
    if (!totp && !backup) {
      setError(t('auth.mfa.unsupportedFactor'));
      return;
    }
    setError('');
    setMfaChoices({ totp, backup });
    setMfaStrategy(totp ? 'totp' : 'backup_code');
    setMfaCode('');
    setMfaReturnStep(returnStep);
    setStep('mfa');
  };

  const goBack = () => {
    setError('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setStep('credentials');
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !mfaCode.trim()) return;
    setIsMfaLoading(true);
    setError('');
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: mfaStrategy,
        code: mfaCode.trim(),
      });
      if (result.status === 'complete') {
        const userEmail = mfaReturnStep === 'credentials' ? email : resetEmail;
        await navigate(result.createdSessionId, userEmail);
      } else if (result.status === 'needs_second_factor') {
        setError(t('auth.mfa.invalidCode'));
      } else {
        setError(t('auth.errors.signInInvalid'));
      }
    } catch (err: unknown) {
      const message = handleError(err, 'signIn');
      if (message === '__SESSION_EXISTS__') {
        const userEmail = mfaReturnStep === 'credentials' ? email : resetEmail;
        window.location.href = getRedirectTarget(userEmail).url;
        return;
      }
      setError(clerkErrorMessage(err, t('auth.mfa.invalidCode')));
    } finally {
      setIsMfaLoading(false);
    }
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
      } else if (result.status === 'needs_second_factor') {
        enterMfaStep('credentials');
      } else if (result.status === 'needs_first_factor') {
        setError(t('auth.errors.signInInvalid'));
      } else {
        setError(t('auth.errors.signInInvalid'));
      }
    } catch (err: unknown) {
      const message = handleError(err, 'signIn');
      if (message === '__SESSION_EXISTS__') {
        window.location.href = getRedirectTarget(email).url;
        return;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Forgot-password handlers (shared)                                  */
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
      } else if (result.status === 'needs_second_factor') {
        enterMfaStep('forgot-code');
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

  /* Team login is only `/admin/login` — stronger dark borders/fill vs glass card. */
  const inputCls = [
    'h-12 rounded-lg bg-white/80 border border-white/40 text-foreground backdrop-blur-sm',
    'placeholder:text-muted-foreground/50',
    isTeam
      ? 'dark:border-white/24 dark:bg-[var(--surface-2)]/92 dark:text-white dark:placeholder:text-muted-foreground/60'
      : 'dark:border-white/10 dark:bg-[var(--surface-2)]/80 dark:text-white',
  ].join(' ');

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  /* ---- Second factor (TOTP / backup code) ---- */
  if (step === 'mfa') {
    const hint =
      mfaStrategy === 'totp'
        ? t('auth.mfa.totpHint')
        : t('auth.mfa.backupHint');
    const fieldCls = `${inputCls} focus:ring-2 focus:ring-[var(--purple)]/30 focus:border-[var(--purple)]/50 transition-all`;
    const showToggle = mfaChoices.totp && mfaChoices.backup;

    return (
      <div className="w-full">
        <div id="clerk-captcha" />

        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{t('auth.mfa.title')}</h2>
            <p className="text-sm text-muted-foreground">{hint}</p>
          </div>

          {showToggle ? (
            <div className="flex rounded-lg border border-white/40 p-1 bg-white/50 dark:border-white/15 dark:bg-[var(--surface-2)]/60">
              <button
                type="button"
                onClick={() => {
                  setMfaStrategy('totp');
                  setMfaCode('');
                  setError('');
                }}
                className={
                  mfaStrategy === 'totp'
                    ? 'flex-1 rounded-md bg-[var(--purple)]/15 py-2 text-sm font-medium text-foreground transition-colors'
                    : 'flex-1 rounded-md py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
                }
              >
                {t('auth.mfa.useAuthenticatorApp')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMfaStrategy('backup_code');
                  setMfaCode('');
                  setError('');
                }}
                className={
                  mfaStrategy === 'backup_code'
                    ? 'flex-1 rounded-md bg-[var(--purple)]/15 py-2 text-sm font-medium text-foreground transition-colors'
                    : 'flex-1 rounded-md py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
                }
              >
                {t('auth.mfa.useBackupCode')}
              </button>
            </div>
          ) : null}

          <form onSubmit={handleMfaSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="mfa-code"
                className="text-sm text-muted-foreground"
              >
                {t('auth.mfa.codeLabel')}
              </Label>
              <Input
                id="mfa-code"
                type="text"
                inputMode={mfaStrategy === 'totp' ? 'numeric' : 'text'}
                autoComplete={mfaStrategy === 'totp' ? 'one-time-code' : 'off'}
                placeholder={
                  mfaStrategy === 'totp'
                    ? t('auth.mfa.codePlaceholder.totp')
                    : t('auth.mfa.codePlaceholder.backup')
                }
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className={fieldCls}
                autoFocus
              />
            </div>
            {error ? (
              <p
                role="alert"
                className="text-xs leading-snug text-red-600 dark:text-red-400"
              >
                {error}
              </p>
            ) : null}
            <AuthSubmitButton
              type="submit"
              disabled={isMfaLoading || !mfaCode.trim()}
            >
              {isMfaLoading ? t('auth.mfa.verifying') : t('auth.mfa.verify')}
            </AuthSubmitButton>
            <button
              type="button"
              onClick={goBackFromMfa}
              className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('auth.mfa.back')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ---- Forgot-password: send code (shared) ---- */
  if (step === 'forgot') {
    return (
      <ForgotPasswordSend
        email={resetEmail}
        onEmailChange={setResetEmail}
        error={error}
        isLoading={isResetLoading}
        onSend={handleForgotSend}
        onBack={goBack}
        t={t}
        fieldClassName={`${inputCls} focus:ring-2 focus:ring-[var(--purple)]/30 focus:border-[var(--purple)]/50 transition-all`}
      />
    );
  }

  /* ---- Forgot-password: enter code + new password (shared) ---- */
  if (step === 'forgot-code') {
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
        fieldClassName={`${inputCls} focus:ring-2 focus:ring-[var(--purple)]/30 focus:border-[var(--purple)]/50 transition-all`}
      />
    );
  }

  /* ---- Credentials step (shared) ---- */
  const emailIsValid = isValidEmail(email);

  return (
    <div className="w-full">
      {/* CAPTCHA Element for Clerk */}
      <div id="clerk-captcha" />

      <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-muted-foreground">
            {isTeam ? t('team.login.emailLabel') : t('auth.email')}
          </Label>
          <EmailInput
            id="email"
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

        <div className="space-y-2">
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
          {/* Forgot password — available to both client and team accounts. */}
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
          {error ? (
            <p
              role="alert"
              className="text-xs leading-snug text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          ) : null}
        </div>

        <AuthSubmitButton
          type="submit"
          disabled={isLoading || !emailIsValid || !password}
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
