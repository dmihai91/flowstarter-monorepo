'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  useCheckDomainAvailabilityMutation,
  useDomainSuggestionsMutation,
} from '../../../../../../../../../../hooks/wizard/useDomainApi';

interface DomainBuySectionProps {
  baseName: string;
}

export function DomainBuySection({ baseName }: DomainBuySectionProps) {
  const { t } = useTranslations();
  const availability = useCheckDomainAvailabilityMutation();
  const suggestions = useDomainSuggestionsMutation();
  const [buyDomainInput, setBuyDomainInput] = useState('');
  const [buyingDomain, setBuyingDomain] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    try {
      const c = document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('fs_country='))
        ?.split('=')[1];
      setCountry(c || null);
    } catch {
      setCountry(null);
    }
  }, []);

  const getRegistrarUrl = (domain: string, fallback?: string) => {
    const isRo = domain.toLowerCase().endsWith('.ro');
    if (country?.toUpperCase() === 'RO' && isRo) {
      return `https://www.rotld.ro/whois?domain=${encodeURIComponent(domain)}`;
    }
    return (
      fallback ||
      `https://www.godaddy.com/domains/searchresults.aspx?checkAvail=1&domainToCheck=${encodeURIComponent(
        domain
      )}`
    );
  };

  useEffect(() => {
    if (!baseName) return;

    // Debounce automatic refresh when the project name changes
    const id = setTimeout(() => {
      suggestions.reset();
      suggestions.mutate(baseName);
    }, 700);
    return () => clearTimeout(id);
  }, [baseName]);

  // Reset availability banner when input changes
  useEffect(() => {
    if (availability.data || availability.error) {
      availability.reset();
    }
  }, [buyDomainInput, availability.data, availability.error, availability]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="mt-2 px-3 py-2 rounded-md border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>{t('domain.buy.postPurchaseHint')}</span>
          </div>
        </div>
      </div>

      {/* Moved refresh control below suggestions */}

      <div className="space-y-3">
        <Label className="text-sm text-gray-700 dark:text-gray-300">
          {t('domain.buy.inputLabel')}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={buyDomainInput}
              onChange={(e) => setBuyDomainInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !availability.isPending &&
                  buyDomainInput.trim()
                ) {
                  availability.mutate(buyDomainInput.trim().toLowerCase());
                }
              }}
              placeholder={baseName ? `${baseName}.com` : 'yourbrand.com'}
              className="h-10 pr-9"
            />
            {buyDomainInput.trim() && (
              <Button
                variant="transparent"
                size="sm"
                onClick={() => {
                  setBuyDomainInput('');
                  availability.reset();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                aria-label={t('app.clear')}
                title={t('app.clear')}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">{t('app.clear')}</span>
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              buyDomainInput.trim() &&
              availability.mutate(buyDomainInput.trim().toLowerCase())
            }
            disabled={availability.isPending || !buyDomainInput.trim()}
            className="h-10"
          >
            {availability.isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {t('domain.buy.checking')}
              </>
            ) : (
              <>
                <Search className="h-3 w-3 mr-1" />
                {t('domain.buy.check')}
              </>
            )}
          </Button>
        </div>

        {availability.data && (
          <div
            className={`p-3 rounded-xl border ${
              availability.data.isAvailable
                ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700'
                : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700'
            } mt-2`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                {availability.data.isAvailable ? (
                  <CheckCircle
                    className="h-4 w-4 mt-0.5"
                    style={{ color: 'var(--green)' }}
                  />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {availability.data.isAvailable
                      ? `${availability.data.domain} ${t(
                          'domain.buy.availableShort'
                        )}`
                      : `${availability.data.domain} ${t(
                          'domain.buy.notAvailableShort'
                        )}`}
                  </p>
                  {availability.data.error && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {availability.data.error}
                    </p>
                  )}
                </div>
              </div>
              {availability.data.registrarInfo?.website && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      getRegistrarUrl(
                        availability.data!.domain,
                        availability.data!.registrarInfo!.website
                      ),
                      '_blank'
                    )
                  }
                  className="text-xs h-7"
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  {country?.toUpperCase() === 'RO' &&
                  String(availability.data?.domain || '')
                    .toLowerCase()
                    .endsWith('.ro')
                    ? t('domain.buy.buyOnRoTLD')
                    : t('domain.buy.buyOnGoDaddy')}
                </Button>
              )}
            </div>
          </div>
        )}
        {!availability.data && availability.error && (
          <div className="p-3 rounded-xl border bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700 mt-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  {t('domain.buy.couldNotVerifyAvailability')}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {t('domain.buy.pleaseTryAgainOrCheckWithYourRegistrar')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {Array.isArray(suggestions.data) && suggestions.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mt-7">
          {suggestions.data
            .filter(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (s: any) =>
                s?.isFlowstarterSubdomain !== true &&
                !String(s.domain).endsWith('.flowstarter.io')
            )
            .slice(0, 12) // Show up to 12 options
            .map((s) => (
              <div
                key={s.domain}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() =>
                  window.open(getRegistrarUrl(String(s.domain)), '_blank')
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                    {s.domain}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    .{s.tld}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {s.note}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          setBuyingDomain(s.domain);
                          const res = await availability.mutateAsync(
                            String(s.domain).toLowerCase()
                          );
                          const url = getRegistrarUrl(
                            String(s.domain),
                            res?.registrarInfo?.website
                          );
                          window.open(url, '_blank');
                        } finally {
                          setBuyingDomain(null);
                        }
                      }}
                      disabled={buyingDomain === s.domain}
                      className="text-xs h-6 px-2 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    >
                      {buyingDomain === s.domain ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          {t('domain.buy.checking')}
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          {country?.toUpperCase() === 'RO' &&
                          String(s.domain).toLowerCase().endsWith('.ro')
                            ? t('domain.buy.buyOnRoTLD')
                            : t('domain.buy.buyOnGoDaddy')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center p-6 text-gray-500 dark:text-gray-400">
          <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {suggestions.isPending
              ? t('domain.buy.generating')
              : t('domain.buy.enterName')}
          </p>
          <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
            {t('domain.buy.postPurchaseHint')}
          </p>
        </div>
      )}

      {baseName && (
        <div className="flex justify-center mt-4">
          {suggestions.isPending ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[--border-subtle] bg-[var(--surface-2)]/70 dark:bg-[var(--surface-2)]/70 px-3 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('domain.buy.generating')}
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => suggestions.mutate(baseName)}
              disabled={!baseName?.trim()}
              className="text-sm rounded-full"
            >
              <Search className="h-3 w-3 mr-1" />
              {t('domain.buy.refresh')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
