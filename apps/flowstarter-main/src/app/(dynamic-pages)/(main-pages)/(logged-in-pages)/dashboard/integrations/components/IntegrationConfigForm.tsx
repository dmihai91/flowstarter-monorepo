'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ExternalLink, Loader2, Plug } from 'lucide-react';

interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder?: string;
  required?: boolean;
  help?: string;
}

export function IntegrationConfigForm({
  integrationId,
  fields,
  values,
  errors,
  touched,
  connecting,
  tutorialUrl,
  onChangeAction,
  onBlurAction,
  onCancelAction,
  onSubmitAction,
}: {
  integrationId: string;
  fields: FieldDef[];
  values: Record<string, string>;
  errors: Record<string, string | undefined>;
  touched: Record<string, boolean | undefined>;
  connecting: boolean;
  tutorialUrl?: string;
  onChangeAction: (field: string, value: string) => void;
  onBlurAction: (field: string) => void;
  onCancelAction: () => void;
  onSubmitAction: () => void;
}) {
  const { t } = useTranslations();
  const serverError = errors._server;

  return (
    <div className="space-y-5 pt-5 mt-5 border-t border-gray-200/50 dark:border-white/10">
      {fields.map((field) => {
        const hasError = touched[field.name] && !!errors[field.name];

        return (
          <div key={field.name} className="space-y-2">
            <Label
              htmlFor={`${integrationId}-${field.name}`}
              className="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.help && (
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {field.help}
              </p>
            )}
            <Input
              id={`${integrationId}-${field.name}`}
              type={field.type}
              placeholder={field.placeholder}
              value={values[field.name] || ''}
              onChange={(e) => onChangeAction(field.name, e.target.value)}
              onBlur={() => onBlurAction(field.name)}
              className={cn(
                'w-full backdrop-blur-sm',
                hasError &&
                  'border-red-500 dark:border-red-400 focus:ring-red-500/20'
              )}
              disabled={connecting}
            />
            {hasError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                {errors[field.name]}
              </p>
            )}
          </div>
        );
      })}

      {serverError && (
        <div className="p-4 rounded-2xl bg-linear-to-br from-red-50/95 to-red-100/80 dark:from-red-950/50 dark:to-red-900/40 border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm mt-4 shadow-sm">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            {serverError}
          </p>
        </div>
      )}

      {tutorialUrl && (
        <div className="pt-1">
          <a
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-2 font-medium group"
            href={tutorialUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            {t('integrations.learnHow')}
          </a>
        </div>
      )}

      <div className="flex gap-5 pt-3">
        <Button
          size="lg"
          onClick={onCancelAction}
          variant="outline"
          className="font-medium shadow-sm hover:shadow-md transition-shadow"
          disabled={connecting}
        >
          {t('integrations.cancel')}
        </Button>
        <Button
          size="md"
          onClick={onSubmitAction}
          disabled={connecting}
          className="w-full max-w-48 font-medium shadow-md hover:shadow-lg transition-shadow"
        >
          {connecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('integrations.connecting')}
            </>
          ) : (
            <>
              <Plug className="h-4 w-4" />
              {t('integrations.save')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
