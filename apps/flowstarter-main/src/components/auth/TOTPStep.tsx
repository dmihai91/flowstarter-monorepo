'use client';

import { AuthSubmitButton } from './AuthSubmitButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TranslationFn } from '@/lib/i18n';
import { ShieldCheck } from 'lucide-react';

interface TOTPStepProps {
  code: string;
  onCodeChange: (code: string) => void;
  error: string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  t: TranslationFn;
}

export function TOTPStep({
  code,
  onCodeChange,
  error,
  isLoading,
  onSubmit,
  onBack,
  t,
}: TOTPStepProps) {
  return (
    <div className="space-y-5">
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

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm text-muted-foreground">
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
            onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ''))}
            className="h-14 rounded-lg bg-white/80 border border-white/40 dark:border-white/10 text-foreground text-center text-2xl tracking-[0.5em] font-mono placeholder:text-muted-foreground/30 dark:bg-[var(--surface-2)]/80 dark:text-white backdrop-blur-sm"
            required
            autoFocus
          />
        </div>
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
        <AuthSubmitButton
          type="submit"
          disabled={isLoading || code.length !== 6}
        >
          {isLoading ? t('team.login.verifying') : t('team.login.verify')}
        </AuthSubmitButton>
        <button
          type="button"
          onClick={onBack}
          className="w-full text-sm text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70 transition-colors"
        >
          &larr; {t('team.login.back')}
        </button>
      </form>
    </div>
  );
}
