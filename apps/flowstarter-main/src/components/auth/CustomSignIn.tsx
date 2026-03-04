'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';
import { useSignIn } from '@clerk/nextjs';
import { useFormik } from 'formik';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as Yup from 'yup';
import {
  useClerkErrorHandler,
  useEdgeBrowserDetection,
  useSocialAuth,
} from './hooks';
import { SocialAuth } from './SocialAuth';

export function CustomSignIn() {
  const { signIn, setActive } = useSignIn();
  const { t } = useTranslations();
  const { handleError } = useClerkErrorHandler();
  const isEdgeBrowser = useEdgeBrowserDetection();
  const searchParams = useSearchParams();

  const navigateTo = (url: string) => {
    window.location.href = url;
  };

  // Team email domains - redirect to team dashboard
  const TEAM_EMAIL_DOMAINS = ['flowstarter.app'];

  // Get redirect URL based on user email or query params
  const getRedirectUrl = (userEmail?: string): string => {
    // Check for explicit redirect_url param first - if it's an external URL
    // (e.g. from the editor subdomain), always honor it regardless of role.
    const redirectUrl = searchParams.get('redirect_url');
    if (redirectUrl) {
      try {
        const url = new URL(redirectUrl);
        if (
          url.hostname.endsWith('flowstarter.dev') ||
          url.hostname.endsWith('flowstarter.app') ||
          url.hostname === 'localhost'
        ) {
          return redirectUrl;
        }
      } catch {
        // Invalid URL, fall through
      }
    }

    // No external redirect - route team members to team dashboard
    if (userEmail) {
      const domain = userEmail.split('@')[1]?.toLowerCase();
      if (domain && TEAM_EMAIL_DOMAINS.includes(domain)) {
        return '/team/dashboard';
      }
    }

    return '/dashboard';
  };

  // Default redirect (social auth can't know email ahead of time)
  const defaultRedirect = getRedirectUrl();

  const {
    isGoogleLoading,
    isAppleLoading,
    handleGoogleAuth: handleGoogleSignIn,
    handleAppleAuth: handleAppleSignIn,
  } = useSocialAuth(signIn, { redirectUrlComplete: defaultRedirect });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t('auth.enterValidEmail'))
        .required(t('auth.emailRequired')),
      password: Yup.string().required(t('auth.passwordRequired')),
    }),
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!signIn) return;
      setIsLoading(true);
      setError('');
      try {
        const result = await signIn.create({
          identifier: values.email,
          password: values.password,
        });

        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          // Redirect based on email - team members go to editor
          navigateTo(getRedirectUrl(values.email));
        }
      } catch (err: unknown) {
        const message = handleError(err, 'signIn');
        // If session already exists, redirect
        if (message === '__SESSION_EXISTS__') {
          navigateTo(getRedirectUrl(values.email));
          return;
        }
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleForgotPassword = async () => {
    if (!signIn || !resetEmail) return;
    setIsResetLoading(true);
    setError('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: resetEmail,
      });
      setResetStep('code');
      // toast removed - no toast lib imported
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.message || t('auth.errors.somethingWentWrong')
      );
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
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
        await setActive({ session: result.createdSessionId });
        window.location.href = getRedirectUrl(resetEmail);
      }
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.message || t('auth.forgotPassword.invalidCode')
      );
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleResendResetCode = async () => {
    if (!signIn || !resetEmail) return;
    setIsResetLoading(true);
    setError('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: resetEmail,
      });
      // toast removed - no toast lib imported
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.message || t('auth.errors.somethingWentWrong')
      );
    } finally {
      setIsResetLoading(false);
    }
  };

  // Forgot Password UI
  if (showForgotPassword) {
    return (
      <div className="w-full max-w-[520px] mx-auto space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">
            {t('auth.forgotPassword.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('auth.forgotPassword.description')}
          </p>
        </div>

        {resetStep === 'email' ? (
          <div className="flex flex-col space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="resetEmail"
                className="text-sm text-muted-foreground"
              >
                {t('auth.email')}
              </Label>
              <Input
                id="resetEmail"
                type="email"
                placeholder={t('auth.email.placeholder')}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="h-12 rounded-lg bg-white/80 border border-white/40 dark:border-white/10 text-foreground placeholder:text-muted-foreground dark:bg-[var(--surface-2)]/80 dark:text-white backdrop-blur-sm"
              />
            </div>

            {error && <div className="text-red-400 text-xs mt-1">{error}</div>}

            <Button
              onClick={handleForgotPassword}
              disabled={isResetLoading || !resetEmail}
              variant="outline"
              size="lg"
              className="w-full mt-4"
            >
              {isResetLoading
                ? t('auth.forgotPassword.sendingCode')
                : t('auth.forgotPassword.sendCode')}
            </Button>

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
                setResetEmail('');
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center hover:underline"
            >
              {t('auth.forgotPassword.backToSignIn')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="resetCode"
                className="text-sm text-muted-foreground"
              >
                {t('auth.forgotPassword.enterCode')}
              </Label>
              <Input
                id="resetCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="h-12 rounded-lg bg-white/80 border border-white/40 dark:border-white/10 text-foreground dark:bg-[var(--surface-2)]/80 dark:text-white backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="text-sm text-muted-foreground"
              >
                {t('auth.forgotPassword.newPassword')}
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 rounded-lg bg-white/80 border border-white/40 dark:border-white/10 text-foreground dark:bg-[var(--surface-2)]/80 dark:text-white backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm text-muted-foreground"
              >
                {t('auth.forgotPassword.confirmPassword')}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 rounded-lg bg-white/80 border border-white/40 dark:border-white/10 text-foreground dark:bg-[var(--surface-2)]/80 dark:text-white backdrop-blur-sm"
              />
            </div>

            {error && <div className="text-red-400 text-xs mt-1">{error}</div>}

            <Button
              onClick={handleResetPassword}
              disabled={
                isResetLoading || !resetCode || !newPassword || !confirmPassword
              }
              variant="outline"
              size="lg"
              className="w-full mt-4"
            >
              {isResetLoading
                ? t('auth.forgotPassword.resettingPassword')
                : t('auth.forgotPassword.resetPassword')}
            </Button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleResendResetCode}
                disabled={isResetLoading}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors hover:underline"
              >
                {t('auth.forgotPassword.resendCode')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetStep('email');
                  setError('');
                  setResetEmail('');
                  setResetCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors hover:underline"
              >
                {t('auth.forgotPassword.backToSignIn')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[520px] mx-auto">
      {/* Social Buttons */}
      <SocialAuth
        onGoogleClick={handleGoogleSignIn}
        onAppleClick={handleAppleSignIn}
        isGoogleLoading={isGoogleLoading}
        isAppleLoading={isAppleLoading}
      />

      {/* CAPTCHA Element for Clerk */}
      <div id="clerk-captcha" />

      {/* Email Form */}
      <form onSubmit={formik.handleSubmit} className="flex flex-col space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-muted-foreground">
            {t('auth.email')}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t('auth.email.placeholder')}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="h-12 rounded-lg bg-white/80 border border-white/40 dark:border-white/10 text-foreground placeholder:text-muted-foreground/50 dark:bg-[var(--surface-2)]/80 dark:text-white backdrop-blur-sm"
            required
          />
          {formik.touched.email && formik.errors.email && (
            <div className="text-red-400 text-xs mt-1">
              {formik.errors.email}
            </div>
          )}
        </div>

        <div className="space-y-2 -mt-1">
          <Label htmlFor="password" className="text-sm text-muted-foreground">
            {t('auth.password')}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.password.placeholder')}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="h-12 rounded-lg bg-white/80 border border-white/40 dark:border-white/10 text-foreground placeholder:text-muted-foreground/50 dark:bg-[var(--surface-2)]/80 dark:text-white pr-12 backdrop-blur-sm"
              required
            />
            {!isEdgeBrowser && formik.values.password && (
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
          {formik.touched.password && formik.errors.password && (
            <div className="text-red-400 text-xs mt-1">
              {formik.errors.password}
            </div>
          )}
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setResetEmail(formik.values.email);
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors hover:underline"
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
        </div>

        {error && <div className="text-red-400 text-xs mt-1">{error}</div>}

        <Button
          type="submit"
          size="xl"
          disabled={isLoading || !formik.isValid}
          className="w-full font-semibold mt-4 shadow-md"
        >
          {isLoading ? t('auth.signIn.signingIn') : t('auth.signIn')}
        </Button>
      </form>
    </div>
  );
}
