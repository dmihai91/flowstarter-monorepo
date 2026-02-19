import { useTranslations } from '@/lib/i18n';
import { AlertTriangle, Shield, X } from 'lucide-react';
import { Button } from './button';

interface ContentModerationError {
  error: string;
  message: string;
  details: string[];
  code: string;
}

interface InlineModerationErrorProps {
  error: ContentModerationError;
  onDismiss?: () => void;
}

export function InlineModerationError({
  error,
  onDismiss,
}: InlineModerationErrorProps) {
  const { t } = useTranslations();

  if (error?.code !== 'CONTENT_REJECTED') return null;

  return (
    <div className="mt-2 rounded-xl border border-red-200/70 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-red-100 dark:bg-red-950/50 border border-red-200/60 dark:border-red-900/40 flex-shrink-0">
          <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                {t('moderation.inline.title')}
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                {error.message}
              </p>
              {error.details && error.details.length > 0 && (
                <ul className="space-y-1.5 mb-3">
                  {error.details.slice(0, 2).map((detail, index) => (
                    <li
                      key={index}
                      className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2 break-words"
                    >
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="flex-1">{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200"
                  onClick={() => window.open('/terms-of-service', '_blank')}
                >
                  {t('moderation.termsOfService')}
                </Button>
                <span className="text-red-400">•</span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200"
                  onClick={() => window.open('/content-guidelines', '_blank')}
                >
                  {t('moderation.contentGuidelines')}
                </Button>
              </div>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-auto p-1 text-red-400 hover:text-red-600 hover:bg-red-100/50 dark:hover:text-red-300 dark:hover:bg-red-900/30"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
