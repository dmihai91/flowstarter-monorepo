'use client';

import { useState } from 'react';
import { useTranslations } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2, Mail, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface WaitlistFormProps {
  source?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'hero';
}

type SubmissionState = 'idle' | 'submitting' | 'success' | 'already' | 'error';

export function WaitlistForm({
  source = 'landing_page',
  className = '',
  variant = 'default',
}: WaitlistFormProps) {
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<SubmissionState>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('waitlist.error.invalidEmail'));
      return;
    }

    setState('submitting');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          plan: 'free',
          source,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      if (data.message === 'already_registered') {
        setState('already');
        toast.info(t('waitlist.landing.alreadyInline'));
      } else {
        setState('success');
        toast.success(t('waitlist.landing.successInline'));
      }
    } catch (err) {
      console.error('Waitlist error:', err);
      setState('error');
      toast.error(t('waitlist.error.description'));
      // Reset to idle after error so user can try again
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const isSuccess = state === 'success' || state === 'already';

  if (variant === 'hero') {
    return (
      <div className={`w-full max-w-xl mx-auto ${className}`}>
        {isSuccess ? (
          <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl backdrop-blur-xl border border-green-200/60 dark:border-green-500/30 bg-green-50/80 dark:bg-green-900/20">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 font-medium">
              {state === 'already'
                ? t('waitlist.landing.alreadyInline')
                : t('waitlist.landing.successInline')}
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('waitlist.landing.emailPlaceholder')}
                  className="h-14 pl-12 text-base rounded-xl backdrop-blur-xl border-white/60 dark:border-white/30 bg-white/60 dark:bg-white/10 focus:border-[var(--purple)]/40 dark:focus:border-[var(--purple)]"
                  required
                  disabled={state === 'submitting'}
                />
              </div>
              <Button
                type="submit"
                disabled={state === 'submitting'}
                className="h-14 px-8 text-base font-medium rounded-xl bg-gradient-to-r from-[var(--purple)] to-pink-600 hover:from-[var(--purple)] hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {state === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('waitlist.landing.submitting')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {t('waitlist.landing.cta')}
                  </>
                )}
              </Button>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              {t('waitlist.landing.privacy')}
            </p>
          </form>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={className}>
        {isSuccess ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {state === 'already'
                ? t('waitlist.landing.alreadyInline')
                : t('waitlist.landing.successInline')}
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('waitlist.landing.emailPlaceholder')}
              className="h-10 text-sm"
              required
              disabled={state === 'submitting'}
            />
            <Button
              type="submit"
              size="sm"
              disabled={state === 'submitting'}
              className="h-10 px-4 bg-gradient-to-r from-[var(--purple)] to-pink-600 hover:from-[var(--purple)] hover:to-pink-700 text-white"
            >
              {state === 'submitting' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('waitlist.cta.joinWaitlist')
              )}
            </Button>
          </form>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('waitlist.landing.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm max-w-md mx-auto">
          {t('waitlist.landing.description')}
        </p>
      </div>

      {isSuccess ? (
        <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300 font-medium">
            {state === 'already'
              ? t('waitlist.landing.alreadyInline')
              : t('waitlist.landing.successInline')}
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('waitlist.landing.emailPlaceholder')}
                className="pl-10"
                required
                disabled={state === 'submitting'}
              />
            </div>
            <Button
              type="submit"
              disabled={state === 'submitting'}
              className="bg-gradient-to-r from-[var(--purple)] to-pink-600 hover:from-[var(--purple)] hover:to-pink-700 text-white"
            >
              {state === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('waitlist.landing.submitting')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('waitlist.landing.cta')}
                </>
              )}
            </Button>
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            {t('waitlist.landing.privacy')}
          </p>
        </form>
      )}
    </div>
  );
}
