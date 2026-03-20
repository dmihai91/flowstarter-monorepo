'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';
import { useSignUp } from '@clerk/nextjs/legacy';
import { useFormik } from 'formik';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import * as Yup from 'yup';
import zxcvbn from 'zxcvbn';
import {
  useClerkErrorHandler,
  useEdgeBrowserDetection,
  useSocialAuth,
} from './hooks';
import { PasswordMeter } from './PasswordMeter';
import { SocialAuth } from './SocialAuth';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 25;

export function CustomSignUp() {
  const { signUp } = useSignUp();
  const { t } = useTranslations();
  const { handleError } = useClerkErrorHandler();
  const isEdgeBrowser = useEdgeBrowserDetection();
  const {
    isGoogleLoading,
    isAppleLoading,
    handleGoogleAuth: handleGoogleSignUp,
    handleAppleAuth: handleAppleSignUp,
  } = useSocialAuth(signUp);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      fullName: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t('auth.enterValidEmail'))
        .required(t('auth.emailRequired')),
      fullName: Yup.string().required(t('auth.fullNameRequired')),
      password: Yup.string()
        .required(t('auth.passwordRequired'))
        .min(
          MIN_PASSWORD_LENGTH,
          t('auth.passwordMinLength', { min: MIN_PASSWORD_LENGTH })
        )
        .max(
          MAX_PASSWORD_LENGTH,
          t('auth.passwordMaxLength', { max: MAX_PASSWORD_LENGTH })
        )
        .matches(/[a-zA-Z]/, t('auth.passwordMustContainLetters'))
        .matches(/\d/, t('auth.passwordMustContainNumbers'))
        .test('zxcvbn-strength', t('auth.passwordTooWeak'), (value) => {
          if (!value) return false;
          try {
            const { score } = zxcvbn(value);
            return score >= 2;
          } catch {
            return true;
          }
        }),
    }),
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!signUp) return;

      setIsLoading(true);
      setError('');
      try {
        const [firstName, ...lastNameParts] = values.fullName.trim().split(' ');
        const lastName = lastNameParts.join(' ') || '';

        const result = await signUp.create({
          emailAddress: values.email,
          password: values.password,
          firstName,
          lastName,
        });

        // If account is already complete (rare with email verification required), send to login
        if (result.status === 'complete') {
          window.location.href = '/login?message=account_created_verified';
          return;
        }

        // Otherwise, send verification code via email and show code entry step
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });
        setIsVerifying(true);
      } catch (err: unknown) {
        const message = handleError(err, 'signUp');
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || !verificationCode.trim()) return;
    setIsVerifyingCode(true);
    setError('');

    try {
      const attempt = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (attempt.status === 'complete') {
        window.location.href = '/login?message=account_created_verified';
        return;
      }

      setError(t('auth.errors.invalidOrExpiredCode'));
    } catch (err) {
      setError(t('auth.errors.invalidOrExpiredCode'));
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUp) return;
    setIsResending(true);
    setError('');
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } catch {
      setError(t('auth.errors.failedToResendCode'));
    } finally {
      setIsResending(false);
    }
  };

  // Validation moved to Formik + Yup schema above

  // Verification step UI
  if (isVerifying) {
    return (
      <div className="w-full max-w-[520px] mx-auto space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">
            {t('auth.notice.verificationSent.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('auth.notice.verificationSent.desc')}
          </p>
        </div>

        <form onSubmit={handleVerifyCode} className="flex flex-col space-y-5">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm text-muted-foreground">
              {t('auth.signUp.enterVerificationCode')}
            </Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="h-12 rounded-lg bg-white/80 border border-white/40 dark:border-white/10 text-foreground dark:bg-[var(--surface-2)]/80 dark:text-white backdrop-blur-sm"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 dark:text-red-400 text-xs mt-1">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
            <Button
              type="submit"
              variant="outline"
              size="lg"
              disabled={isVerifyingCode}
              className="w-full sm:w-auto"
            >
              {isVerifyingCode
                ? t('auth.signUp.verifying')
                : t('auth.signUp.verifyEmail')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={isResending}
              onClick={handleResendCode}
              className="w-full sm:w-auto"
            >
              {isResending
                ? t('auth.signUp.resending')
                : t('auth.signUp.resendCode')}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[520px] mx-auto">
      {/* Social Buttons */}
      <SocialAuth
        onGoogleClick={handleGoogleSignUp}
        onAppleClick={handleAppleSignUp}
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
            <div className="text-red-500 dark:text-red-400 text-xs mt-1">
              {formik.errors.email}
            </div>
          )}
        </div>

        <div className="space-y-2 -mt-1">
          <Label htmlFor="fullName" className="text-sm text-muted-foreground">
            {t('auth.signUp.fullName')}
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder={t('auth.signUp.fullName.placeholder')}
            value={formik.values.fullName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="h-12 rounded-lg bg-white/80 border border-white/40 dark:border-white/10 text-foreground placeholder:text-muted-foreground/50 dark:bg-[var(--surface-2)]/80 dark:text-white backdrop-blur-sm"
            required
          />
          {formik.touched.fullName && formik.errors.fullName && (
            <div className="text-red-500 dark:text-red-400 text-xs mt-1">
              {formik.errors.fullName}
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
          <div className="text-xs text-muted-foreground mt-1">
            {t('auth.signUp.passwordRequirements', { min: 8, max: 25 })}
          </div>
          {formik.values.password && (
            <PasswordMeter password={formik.values.password} className="mt-2" />
          )}
          {formik.touched.password && formik.errors.password && (
            <div className="text-red-500 dark:text-red-400 text-xs mt-1">
              {formik.errors.password}
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 dark:text-red-400 text-xs mt-1">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="xl"
          disabled={isLoading || !formik.isValid}
          className="w-full font-semibold mt-4 shadow-md"
        >
          {isLoading
            ? t('auth.signUp.creatingAccount')
            : t('auth.signUp.createFreeAccount')}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground mt-6">
        {t('auth.signUp.byContinuing', { appName: t('app.name') })}
        <a
          href="#"
          className="underline text-muted-foreground ml-1 mr-1 hover:text-foreground transition-colors"
        >
          {t('auth.signUp.termsOfService')}
        </a>
        {`${t('common.and')} `}
        <a
          href="#"
          className="underline text-muted-foreground ml-1 hover:text-foreground transition-colors"
        >
          {t('auth.signUp.privacyPolicy')}
        </a>
      </div>
    </div>
  );
}
