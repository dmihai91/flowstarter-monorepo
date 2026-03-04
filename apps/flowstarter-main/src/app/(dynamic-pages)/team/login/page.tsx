'use client';

import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';
import { useSignIn } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

type FlowStep = 'credentials' | 'totp' | 'email_code';

export default function TeamLoginPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations();

  // Honor external redirect_url (e.g. from editor subdomain), else default to team dashboard
  const getRedirectTarget = (): { url: string; external: boolean } => {
    // Check for explicit redirect_url (e.g. from editor subdomain)
    const redirectUrl = searchParams.get('redirect_url');
    if (redirectUrl) {
      try {
        const url = new URL(redirectUrl);
        if (
          url.hostname.endsWith('flowstarter.dev') ||
          url.hostname.endsWith('flowstarter.app') ||
          url.hostname === 'localhost'
        ) {
          const isCrossDomain = typeof window !== 'undefined' && url.hostname !== window.location.hostname;
          return { url: redirectUrl, external: isCrossDomain };
        }
      } catch {
        // Invalid URL, fall through
      }
    }
    // Check for 'next' param (set by middleware when redirecting unauthenticated users)
    const nextUrl = searchParams.get('next');
    if (nextUrl && nextUrl.startsWith('/')) {
      return { url: nextUrl, external: false };
    }
    return { url: '/team/dashboard', external: false };
  };

  const navigateToTarget = () => {
    const target = getRedirectTarget();
    // Always use full page reload after login to ensure Clerk session cookie is propagated
    window.location.href = target.url;
  };

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<FlowStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !email || !password) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        const target = getRedirectTarget();
        // Navigate first, then set active - avoids brief dashboard flash on cross-domain redirect
        if (target.external) {
          window.location.href = target.url;
          await setActive({ session: result.createdSessionId });
        } else {
          await setActive({ session: result.createdSessionId });
          navigateToTarget();
        }
      } else if (result.status === 'needs_second_factor') {
        const supportedFactors = result.supportedSecondFactors;

        const totpFactor = supportedFactors?.find((f) => f.strategy === 'totp');

        if (totpFactor) {
          setStep('totp');
        } else if (supportedFactors && supportedFactors.length > 0) {
          setError(
            `Second factor required: ${supportedFactors
              .map((f) => f.strategy)
              .join(', ')}`
          );
        } else {
          setError('Two-factor authentication required. Please contact admin.');
        }
      } else if (result.status === 'needs_first_factor') {
        setError('Password sign-in not available for this account');
      } else {
        setError(`Sign in incomplete: ${result.status}`);
      }
    } catch (err: unknown) {
      const clerkError = err as {
        errors?: Array<{ message?: string; code?: string }>;
      };
      const errorMessage =
        clerkError.errors?.[0]?.message || 'Invalid credentials';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
        const target = getRedirectTarget();
        // Navigate first, then set active - avoids brief dashboard flash on cross-domain redirect
        if (target.external) {
          window.location.href = target.url;
          await setActive({ session: result.createdSessionId });
        } else {
          await setActive({ session: result.createdSessionId });
          navigateToTarget();
        }
      } else {
        setError('Verification failed');
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string }> };
      setError(clerkError.errors?.[0]?.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setError('');
    setCode('');
    setStep('credentials');
  };

  if (!mounted || !isLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c]"
        suppressHydrationWarning
      >
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  return (
    <AuthLayout
      title={t('team.login.title')}
      subtitle={t('team.login.subtitle')}
      showTeamBadge={true} showStats={false}
    >
      <div className="w-full max-w-[520px] mx-auto">

        <div className="bg-white/95 dark:bg-[var(--surface-2)]/90 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl border border-gray-200/50 dark:border-white/10 p-8 shadow-lg dark:shadow-2xl">
          {/* Credentials Step */}
          {step === 'credentials' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('team.login.signInTitle')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                  {t('team.login.signInSubtitle')}
                </p>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm text-gray-600 dark:text-white/60"
                  >
                    {t('team.login.emailLabel')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('team.login.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-lg bg-white/80 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 dark:bg-[var(--surface-2)]/80"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm text-gray-600 dark:text-white/60"
                  >
                    {t('team.login.passwordLabel')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('team.login.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-lg bg-white/80 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 dark:bg-[var(--surface-2)]/80 pr-12"
                      required
                    />
                    {password && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/70 transition-colors"
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

                {error && <div className="text-red-500 text-sm">{error}</div>}

                <Button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  size="xl"
                  className="w-full font-semibold shadow-md"
                >
                  {isLoading ? t('team.login.signingIn') : t('team.login.signIn')}
                </Button>
              </form>
            </>
          )}

          {/* TOTP Step */}
          {step === 'totp' && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[var(--purple)]/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-[var(--purple)]" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('team.login.twoFactorTitle')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                  {t('team.login.twoFactorSubtitle')}
                </p>
              </div>

              <form onSubmit={handleTotpSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="code"
                    className="text-sm text-gray-600 dark:text-white/60"
                  >
                    {t('team.login.codeLabel')}
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="h-14 rounded-lg bg-white/80 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-gray-300 dark:placeholder:text-white/20 dark:bg-[var(--surface-2)]/80"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  size="xl"
                  className="w-full font-semibold shadow-md"
                >
                  {isLoading ? t('team.login.verifying') : t('team.login.verify')}
                </Button>

                <button
                  type="button"
                  onClick={goBack}
                  className="w-full text-sm text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70 transition-colors"
                >
                  &larr; {t('team.login.back')}
                </button>
              </form>
            </>
          )}

          {/* Email Code Step - kept for future use */}
        </div>
      </div>
    </AuthLayout>
  );
}
