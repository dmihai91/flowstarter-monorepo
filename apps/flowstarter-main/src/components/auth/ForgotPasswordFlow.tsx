'use client';

import { AuthSubmitButton } from './AuthSubmitButton';
import { EmailInput, isValidEmail } from '@/components/ui/email-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { TranslationFn } from '@/lib/i18n';

/** Default field chrome — callers may override (e.g. team admin login). */
export const DEFAULT_AUTH_FIELD_CLS =
  'h-12 rounded-lg bg-white/80 border border-white/40 dark:border-white/10 text-foreground placeholder:text-muted-foreground/50 dark:bg-[var(--surface-2)]/80 dark:text-white backdrop-blur-sm focus:ring-2 focus:ring-[var(--purple)]/30 focus:border-[var(--purple)]/50 transition-all';

// ── Send code step ──────────────────────────────────────────────────────────

interface ForgotSendProps {
  email: string;
  onEmailChange: (email: string) => void;
  error: string;
  isLoading: boolean;
  onSend: () => void;
  onBack: () => void;
  t: TranslationFn;
  /** Merged onto inputs; defaults to {@link DEFAULT_AUTH_FIELD_CLS}. */
  fieldClassName?: string;
}

export function ForgotPasswordSend({
  email,
  onEmailChange,
  error,
  isLoading,
  onSend,
  onBack,
  t,
  fieldClassName,
}: ForgotSendProps) {
  const fieldCls = fieldClassName ?? DEFAULT_AUTH_FIELD_CLS;
  const emailIsValid = isValidEmail(email);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!emailIsValid || isLoading) return;
    onSend();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">
          {t('auth.forgotPassword.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('auth.forgotPassword.description')}
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="resetEmail" className="text-sm text-muted-foreground">
            {t('auth.email')}
          </Label>
          <EmailInput
            id="resetEmail"
            placeholder={t('auth.email.placeholder')}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={fieldCls}
            required
          />
        </div>
        {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
        <AuthSubmitButton
          type="submit"
          disabled={isLoading || !emailIsValid}
          className="mt-4"
        >
          {isLoading
            ? t('auth.forgotPassword.sendingCode')
            : t('auth.forgotPassword.sendCode')}
        </AuthSubmitButton>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors text-center hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('auth.forgotPassword.backToSignIn')}
        </button>
      </form>
    </div>
  );
}

// ── Reset step (code + new password) ────────────────────────────────────────

interface ForgotResetProps {
  code: string;
  onCodeChange: (code: string) => void;
  newPassword: string;
  onNewPasswordChange: (pw: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (pw: string) => void;
  error: string;
  isLoading: boolean;
  onReset: () => void;
  onResend: () => void;
  onBack: () => void;
  t: TranslationFn;
  /** Merged onto inputs; defaults to {@link DEFAULT_AUTH_FIELD_CLS}. */
  fieldClassName?: string;
}

export function ForgotPasswordReset({
  code,
  onCodeChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  error,
  isLoading,
  onReset,
  onResend,
  onBack,
  t,
  fieldClassName,
}: ForgotResetProps) {
  const fieldCls = fieldClassName ?? DEFAULT_AUTH_FIELD_CLS;
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">
          {t('auth.forgotPassword.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('auth.forgotPassword.description')}
        </p>
      </div>
      <div className="flex flex-col space-y-5">
        <div className="space-y-2">
          <Label htmlFor="resetCode" className="text-sm text-muted-foreground">
            {t('auth.forgotPassword.enterCode')}
          </Label>
          <Input
            id="resetCode"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="123456"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            className={fieldCls}
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="newPassword"
            className="text-sm text-muted-foreground"
          >
            {t('auth.forgotPassword.newPassword')}
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              className={`${fieldCls} pr-12`}
            />
            {newPassword && (
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? (
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
            htmlFor="confirmPassword"
            className="text-sm text-muted-foreground"
          >
            {t('auth.forgotPassword.confirmPassword')}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              className={`${fieldCls} pr-12`}
            />
            {confirmPassword && (
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
        {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
        <AuthSubmitButton
          type="button"
          onClick={onReset}
          disabled={isLoading || !code || !newPassword || !confirmPassword}
          className="mt-4"
        >
          {isLoading
            ? t('auth.forgotPassword.resettingPassword')
            : t('auth.forgotPassword.resetPassword')}
        </AuthSubmitButton>
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onResend}
            disabled={isLoading}
            className="text-sm text-[var(--fs-ink-dim)] hover:text-gray-900 dark:hover:text-gray-200 transition-colors hover:underline"
          >
            {t('auth.forgotPassword.resendCode')}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--fs-ink-dim)] hover:text-gray-900 dark:hover:text-gray-200 transition-colors hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('auth.forgotPassword.backToSignIn')}
          </button>
        </div>
      </div>
    </div>
  );
}
