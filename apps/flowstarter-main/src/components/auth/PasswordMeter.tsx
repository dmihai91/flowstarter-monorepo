'use client';

import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import PasswordStrengthBar from 'react-password-strength-bar';

export type RuleStatus = 'met' | 'unmet' | 'violated' | 'neutral';
export interface PasswordEvaluation {
  hasMinLength: boolean;
  hasMaxLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  isStrongLength: boolean;
}
export function evaluatePassword(password: string): PasswordEvaluation {
  const hasMinLength = password.length >= 8;
  const hasMaxLength = password.length <= 25;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isStrongLength = password.length >= 12;
  return { hasMinLength, hasMaxLength, hasLetter, hasNumber, isStrongLength };
}

export function PasswordMeter({
  password,
  className,
}: {
  password: string;
  className?: string;
}) {
  const { t } = useTranslations();

  return (
    <div className={cn('flex flex-col gap-1', className)} aria-live="polite">
      <PasswordStrengthBar
        password={password}
        minLength={8}
        shortScoreWord={t('auth.passwordStrength.veryWeak')}
        scoreWords={[
          t('auth.passwordStrength.veryWeak'),
          t('auth.passwordStrength.weak'),
          t('auth.passwordStrength.fair'),
          t('auth.passwordStrength.good'),
          t('auth.passwordStrength.strong'),
        ]}
        barColors={['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981']}
        className="mx-auto w-full"
      />
      <span className="sr-only">{t('auth.passwordStrength')}</span>
    </div>
  );
}
