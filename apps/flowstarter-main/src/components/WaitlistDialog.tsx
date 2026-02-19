'use client';

import { useState } from 'react';
import { useTranslations } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Mail, Sparkles, User } from 'lucide-react';

type PlanKey = 'free' | 'starter' | 'pro' | 'business';

interface WaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: PlanKey;
}

type SubmissionState = 'idle' | 'submitting' | 'success' | 'already' | 'error';

export function WaitlistDialog({
  open,
  onOpenChange,
  plan,
}: WaitlistDialogProps) {
  const { t } = useTranslations();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<SubmissionState>('idle');
  const [error, setError] = useState('');

  const planName = plan ? t(`pricing.plan.${plan}` as any) : 'Flowstarter';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('waitlist.error.invalidEmail'));
      return;
    }

    setState('submitting');
    setError('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          plan: plan || 'free',
          source: 'pricing_page',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      if (data.message === 'already_registered') {
        setState('already');
      } else {
        setState('success');
      }
    } catch (err) {
      console.error('Waitlist error:', err);
      setState('error');
      setError(t('waitlist.error.description'));
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setState('idle');
      setName('');
      setEmail('');
      setError('');
    }, 200);
  };

  const renderContent = () => {
    if (state === 'success' || state === 'already') {
      return (
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {state === 'already'
              ? t('waitlist.already.title')
              : t('waitlist.success.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {state === 'already'
              ? t('waitlist.already.description')
              : plan
              ? t('waitlist.success.description', { plan: planName })
              : t('waitlist.success.descriptionGeneric')}
          </p>
          <Button onClick={handleClose} variant="outline">
            {t('waitlist.close')}
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="waitlist-name"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('waitlist.form.name')}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="waitlist-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('waitlist.form.namePlaceholder')}
              className="pl-10"
              disabled={state === 'submitting'}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="waitlist-email"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('waitlist.form.email')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="waitlist-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder={t('waitlist.form.emailPlaceholder')}
              className="pl-10"
              required
              disabled={state === 'submitting'}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          disabled={state === 'submitting'}
        >
          {state === 'submitting' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('waitlist.form.submitting')}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {t('waitlist.form.submit')}
            </>
          )}
        </Button>
      </form>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">
              {t('waitlist.badge')}
            </Badge>
            {plan && (
              <Badge
                variant="outline"
                className="text-gray-600 dark:text-gray-400"
              >
                {planName}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl">{t('waitlist.title')}</DialogTitle>
          <DialogDescription>
            {plan
              ? t('waitlist.description', { plan: planName })
              : t('waitlist.descriptionGeneric')}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
