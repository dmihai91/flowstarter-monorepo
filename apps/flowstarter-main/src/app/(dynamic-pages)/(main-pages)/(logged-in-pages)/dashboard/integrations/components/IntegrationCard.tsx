'use client';

import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { useIntegrations, type Integration } from '@/hooks/useIntegrations';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Check, Loader2, Plug } from 'lucide-react';

export function IntegrationCard({
  integration,
  onConnect,
}: {
  integration: Integration;
  onConnect?: () => void;
}) {
  const { t } = useTranslations();
  const { handleDisconnect, isConnected, isConnecting } = useIntegrations();

  const connected = isConnected(integration.id);
  const connecting = isConnecting(integration.id);

  const handleConnectClick = () => {
    onConnect?.();
  };

  return (
    <GlassCard
      className={cn(
        'group relative',
        connected && 'ring-2 ring-emerald-500/30 dark:ring-emerald-500/20'
      )}
    >
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
        <span
          className={cn(
            'inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-sm sm:text-xs font-bold border backdrop-blur-sm shadow-sm',
            connected
              ? 'bg-emerald-100/90 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
              : 'bg-gray-100/90 dark:bg-white/10 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-white/18'
          )}
        >
          {connected && (
            <span className="inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-pulse mr-1 sm:mr-2" />
          )}
          {connected
            ? t('integrations.status.connected')
            : t('integrations.status.notConnected')}
        </span>
      </div>

      <div className="pb-3 relative z-10 w-full">
        <div className="flex items-start gap-3 sm:gap-5 w-full">
          <div
            className={cn(
              'shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 sm:group-hover:scale-110 sm:group-hover:rotate-3 backdrop-blur-sm border',
              connected
                ? 'bg-emerald-500/20 dark:bg-emerald-500/30 border-emerald-500/40 dark:border-emerald-500/30'
                : 'bg-white/20 dark:bg-[rgba(58,58,74,0.2)] border-white/40 dark:border-white/10'
            )}
          >
            <integration.icon
              className={cn(
                'h-6 w-6 sm:h-7 sm:w-7',
                connected
                  ? 'text-white'
                  : integration.iconColor || 'text-gray-700 dark:text-gray-300'
              )}
            />
          </div>
          <div className="flex-1 min-w-0 w-full pr-34">
            <h3
              className="text-base sm:text-xl font-bold mb-1 sm:mb-1.5 sm:group-hover:opacity-80 transition-colors w-full"
              style={{ color: 'var(--copy-headlines)' }}
            >
              {integration.name}
            </h3>
            <p
              className="text-xs sm:text-sm leading-relaxed"
              style={{ color: 'var(--copy-body)' }}
            >
              {integration.description}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-3 space-y-3 sm:space-y-4 relative z-10">
        <div className="w-full">
          <h3 className="text-sm sm:text-xs font-bold text-gray-700 dark:text-gray-200 tracking-wider uppercase mb-2 sm:mb-3">
            {t('integrations.keyFeatures')}
          </h3>
          <ul className="space-y-2 sm:space-y-2.5 w-full">
            {integration.features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 w-full"
              >
                <div className="shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-linear-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </div>
                <span className="flex-1">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full pt-2">
          {connected ? (
            <Button
              onClick={() => handleDisconnect(integration.id)}
              disabled={connecting}
              variant="outline"
              className="w-full h-9 sm:h-10 font-medium text-xs sm:text-sm shadow-sm sm:hover:shadow-md transition-shadow touch-manipulation"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  {t('integrations.connecting')}
                </>
              ) : (
                <>
                  <Plug className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  {t('integrations.disconnect')}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleConnectClick}
              className="w-full h-9 sm:h-10 font-medium text-xs sm:text-sm gap-2 bg-gray-900 text-white active:bg-gray-800 sm:hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:active:bg-gray-200 dark:sm:hover:bg-gray-200 rounded-lg shadow-sm transition-all max-w-full sm:max-w-32 touch-manipulation"
            >
              {t('integrations.connect')}
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
