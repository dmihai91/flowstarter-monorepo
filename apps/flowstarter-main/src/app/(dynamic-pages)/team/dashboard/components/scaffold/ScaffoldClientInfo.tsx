'use client';

import { Input as FlowInput, Button } from '@flowstarter/flow-design-system';
import { useTranslations } from '@/lib/i18n';
import { ArrowRight, PenLine, Sparkles, User } from 'lucide-react';
import type { ClientInfo } from './useScaffoldForm';
import { useCallback, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { z } from 'zod';
import { useAnimatedPlaceholder } from '@/hooks/useAnimatedPlaceholder';

const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[+]?[\d\s()-]{7,}$/.test(val), 'Invalid phone'),
});

type FieldErrors = Partial<Record<'name' | 'email' | 'phone', string>>;

const INDUSTRIES = [
  'Coffee & Food',
  'Beauty & Wellness',
  'Health & Medical',
  'Fitness & Sports',
  'Legal & Consulting',
  'Real Estate',
  'Education & Training',
  'Photography & Creative',
  'Retail & E-commerce',
  'Technology & SaaS',
  'Travel & Hospitality',
  'Construction & Trades',
  'Finance & Accounting',
  'Non-profit & Community',
  'Other',
];

interface ScaffoldClientInfoProps {
  clientInfo: ClientInfo;
  onUpdate: (key: keyof ClientInfo, value: string) => void;
  onSubmit: () => void;
  onCollapse: () => void;
  industry?: string;
  onIndustryChange?: (value: string) => void;
  mode?: 'ai' | 'manual';
  onModeChange?: (mode: 'ai' | 'manual') => void;
  prompt?: string;
  onPromptChange?: (value: string) => void;
}

export function ScaffoldClientInfo({
  clientInfo,
  onUpdate,
  onSubmit,
  industry = '',
  onIndustryChange,
  mode = 'ai',
  onModeChange,
  prompt = '',
  onPromptChange,
}: ScaffoldClientInfoProps) {
  const { t } = useTranslations();
  const { user } = useUser();
  const [errors, setErrors] = useState<FieldErrors>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const _firstName = user?.firstName || 'there';

  const validateField = useCallback(
    (field: 'name' | 'email' | 'phone', value: string) => {
      if (debounceTimers.current[field])
        clearTimeout(debounceTimers.current[field]);
      debounceTimers.current[field] = setTimeout(() => {
        const result = clientSchema.shape[field].safeParse(value);
        setErrors((prev) => ({
          ...prev,
          [field]: result.success
            ? undefined
            : t(`scaffold.client.error.${field}` as const),
        }));
      }, 400);
    },
    [t]
  );

  const hasValidClient =
    clientInfo.name.trim().length >= 2 && clientInfo.email.includes('@');
  const hasEnoughAiContext = mode === 'manual' || prompt.trim().length >= 20;
  const animatedPlaceholder = useAnimatedPlaceholder({
    enabled: mode === 'ai' && prompt.trim() === '',
  });
  const canContinue = hasValidClient && hasEnoughAiContext;

  const handleSubmit = () => {
    const result = clientSchema.safeParse(clientInfo);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = t(`scaffold.client.error.${field}` as const);
        }
      }
      setErrors(fieldErrors);
      return;
    }

    if (mode === 'ai' && prompt.trim().length < 20) {
      return;
    }

    setErrors({});
    onSubmit();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-[var(--purple)]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            New client project
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Add the client basics, then describe the project for AI to draft the
            brief
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-[32px] border border-gray-200/80 bg-white/95 p-6 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:border-white/[0.06] dark:bg-white/[0.05] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.06)_inset]">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Client details
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FlowInput
              label={`${t('scaffold.client.field.name')} *`}
              placeholder={t('scaffold.client.placeholder.name')}
              value={clientInfo.name}
              onChange={(e) => {
                onUpdate('name', e.target.value);
                validateField('name', e.target.value);
              }}
              error={!!errors.name}
              errorText={errors.name}
              inputSize="lg"
            />
            <FlowInput
              label={`${t('scaffold.client.field.email')} *`}
              type="email"
              placeholder={t('scaffold.client.placeholder.email')}
              value={clientInfo.email}
              onChange={(e) => {
                onUpdate('email', e.target.value);
                validateField('email', e.target.value);
              }}
              error={!!errors.email}
              errorText={errors.email}
              inputSize="lg"
            />
          </div>

          <div className="mt-4 sm:max-w-[calc(50%-0.5rem)]">
            <FlowInput
              label={t('scaffold.client.field.phone')}
              placeholder={t('scaffold.client.placeholder.phone')}
              value={clientInfo.phone}
              onChange={(e) => {
                onUpdate('phone', e.target.value);
                if (e.target.value) validateField('phone', e.target.value);
                else setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              error={!!errors.phone}
              errorText={errors.phone}
              inputSize="lg"
            />
          </div>
        </section>

        <section className="rounded-[32px] border border-gray-200/80 bg-white/95 p-6 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:border-white/[0.06] dark:bg-white/[0.05] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.06)_inset]">
          <p className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
            Industry
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            What industry does your client&apos;s business operate in?
          </p>
          <div className="relative">
            <select
              value={industry}
              onChange={(e) => onIndustryChange?.(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.05] px-4 py-3 pr-10 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple)]/20 transition-all"
            >
              <option value="">Select an industry...</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-[32px] border border-gray-200/80 bg-white/95 p-6 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.06)_inset]">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
              How do you want to proceed?
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              You can change this later without losing any of the collected
              information.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onModeChange?.('ai')}
            className={`relative flex w-full items-start gap-3 rounded-[20px] border p-4 text-left transition-all duration-200 backdrop-blur-sm ${
              mode === 'ai'
                ? 'border-[var(--purple)] bg-[var(--purple)]/6 ring-1 ring-[var(--purple)]/30 dark:bg-[var(--purple)]/10'
                : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/[0.07] dark:bg-white/[0.04] dark:hover:border-white/[0.14]'
            }`}
          >
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--purple)]/10">
              <Sparkles className="h-4.5 w-4.5 text-[var(--purple)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Generate with AI
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Start from a guided prompt and let AI produce the initial brief,
                structure, and recommendations.
              </p>
            </div>
            <div
              className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                mode === 'ai'
                  ? 'border-[var(--purple)]'
                  : 'border-zinc-300 dark:border-zinc-600'
              }`}
            >
              {mode === 'ai' && (
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--purple)]" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onModeChange?.('manual')}
            className={`relative flex w-full items-start gap-3 rounded-[20px] border p-4 text-left transition-all duration-200 backdrop-blur-sm ${
              mode === 'manual'
                ? 'border-[var(--purple)] bg-[var(--purple)]/6 ring-1 ring-[var(--purple)]/30 dark:bg-[var(--purple)]/10'
                : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/[0.07] dark:bg-white/[0.04] dark:hover:border-white/[0.14]'
            }`}
          >
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <PenLine className="h-4.5 w-4.5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Fill in manually
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Skip AI generation and go straight to the editable brief to
                capture the business details yourself.
              </p>
            </div>
            <div
              className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                mode === 'manual'
                  ? 'border-[var(--purple)]'
                  : 'border-zinc-300 dark:border-zinc-600'
              }`}
            >
              {mode === 'manual' && (
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--purple)]" />
              )}
            </div>
          </button>
        </section>
      </div>

      {mode === 'ai' && (
        <section className="rounded-[32px] border border-gray-200/80 bg-white/95 p-6 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:border-white/[0.06] dark:bg-white/[0.05] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.06)_inset]">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-[var(--purple)]" />
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Assistant prompt
            </p>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            Describe the business, audience, offer, tone, or goals. The more
            specific you are, the better the generated brief will be.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange?.(e.target.value)}
            placeholder={
              animatedPlaceholder ||
              'Describe the business, audience, offer, tone, or goals…'
            }
            rows={5}
            className="w-full rounded-[20px] border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.05] px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-40 focus:outline-none focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple)]/20 resize-none transition-all"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>
              Include audience, offer, style, and the main action you want
              visitors to take.
            </span>
            <span
              className={
                prompt.trim().length < 20
                  ? 'text-amber-600 dark:text-amber-400'
                  : ''
              }
            >
              {prompt.trim().length} chars
            </span>
          </div>
        </section>
      )}

      <div className="flex items-center justify-end">
        <Button
          onClick={handleSubmit}
          variant="accent"
          size="lg"
          disabled={!canContinue}
          className="w-full sm:w-auto sm:min-w-56"
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          {mode === 'ai'
            ? 'Generate project brief'
            : 'Continue to brief editor'}
        </Button>
      </div>
    </div>
  );
}
