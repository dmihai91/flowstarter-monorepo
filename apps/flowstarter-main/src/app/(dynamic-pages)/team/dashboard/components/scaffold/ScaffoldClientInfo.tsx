'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';
import { ArrowRight, User, X } from 'lucide-react';
import { GlassCard } from '@flowstarter/flow-design-system';
import type { ClientInfo } from './useScaffoldForm';
import { useCallback, useRef, useState } from 'react';
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().refine(
    (val) => !val || /^[+]?[\d\s()-]{7,}$/.test(val),
    'Invalid phone'
  ),
});

type FieldErrors = Partial<Record<'name' | 'email' | 'phone', string>>;

interface ScaffoldClientInfoProps {
  clientInfo: ClientInfo;
  onUpdate: (key: keyof ClientInfo, value: string) => void;
  onSubmit: () => void;
  onCollapse: () => void;
}

export function ScaffoldClientInfo({
  clientInfo,
  onUpdate,
  onSubmit,
  onCollapse,
}: ScaffoldClientInfoProps) {
  const { t } = useTranslations();
  const [errors, setErrors] = useState<FieldErrors>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const validateField = useCallback(
    (field: 'name' | 'email' | 'phone', value: string) => {
      if (debounceTimers.current[field]) clearTimeout(debounceTimers.current[field]);
      debounceTimers.current[field] = setTimeout(() => {
        const result = clientSchema.shape[field].safeParse(value);
        setErrors((prev) => ({
          ...prev,
          [field]: result.success ? undefined : t(`scaffold.client.error.${field}` as const),
        }));
      }, 400);
    },
    [t]
  );

  const canContinue =
    clientInfo.name.trim().length >= 2 && clientInfo.email.includes('@');

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
    setErrors({});
    onSubmit();
  };

  return (
    <GlassCard noHover>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-[var(--purple)]" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
              {t('scaffold.client.title')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/40">
              {t('scaffold.client.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-3 mb-5">
        <div>
          <Label className="text-xs font-medium text-gray-500 dark:text-white/40">
            {t('scaffold.client.field.name')} *
          </Label>
          <Input
            placeholder={t('scaffold.client.placeholder.name')}
            value={clientInfo.name}
            onChange={(e) => {
              onUpdate('name', e.target.value);
              validateField('name', e.target.value);
            }}
            className={`mt-1 ${errors.name ? 'border-red-400 dark:border-red-500/50' : ''}`}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <Label className="text-xs font-medium text-gray-500 dark:text-white/40">
            {t('scaffold.client.field.email')} *
          </Label>
          <Input
            type="email"
            placeholder={t('scaffold.client.placeholder.email')}
            value={clientInfo.email}
            onChange={(e) => {
              onUpdate('email', e.target.value);
              validateField('email', e.target.value);
            }}
            className={`mt-1 ${errors.email ? 'border-red-400 dark:border-red-500/50' : ''}`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <Label className="text-xs font-medium text-gray-500 dark:text-white/40">
            {t('scaffold.client.field.phone')}
          </Label>
          <Input
            placeholder={t('scaffold.client.placeholder.phone')}
            value={clientInfo.phone}
            onChange={(e) => {
              onUpdate('phone', e.target.value);
              if (e.target.value) validateField('phone', e.target.value);
              else setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            className={`mt-1 ${errors.phone ? 'border-red-400 dark:border-red-500/50' : ''}`}
          />
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Continue */}
      <Button
        onClick={handleSubmit}
        variant="accent"
        size="sm"
        disabled={!canContinue}
        className="w-full"
      >
        {t('scaffold.action.continue')}
        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
      </Button>
    </GlassCard>
  );
}
