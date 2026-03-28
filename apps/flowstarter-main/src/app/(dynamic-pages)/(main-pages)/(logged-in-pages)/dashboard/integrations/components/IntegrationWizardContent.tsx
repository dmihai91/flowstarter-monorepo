'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/lib/i18n';
import { useEffect, useState } from 'react';

type Provider = 'google-analytics' | 'calendly' | 'cal-com' | 'mailchimp';

// Providers that use API key entry instead of OAuth redirect
const API_KEY_PROVIDERS: Provider[] = ['cal-com'];

interface Props {
  provider: Provider;
  initialStatus: string | null;
  onComplete?: () => void;
  onClose?: () => void;
}

interface GAAccountTree {
  account: { id: string; name: string };
  property: { id: string; name: string };
  streams: Array<{ id: string; name: string; measurementId?: string }>;
}

export function IntegrationWizardContent({
  provider,
  initialStatus,
  onComplete,
  onClose,
}: Props) {
  const { t } = useTranslations();
  const isApiKeyProvider = API_KEY_PROVIDERS.includes(provider);
  const [step, setStep] = useState<1 | 2 | 3>(
    initialStatus === 'success' ? 2 : 1
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GA resource selection state
  const [gaTree, setGaTree] = useState<GAAccountTree[] | null>(null);
  const [selection, setSelection] = useState<{
    accountId?: string;
    propertyId?: string;
    streamId?: string;
    measurementId?: string;
  }>({});

  // API key provider state (Cal.com)
  const [apiKey, setApiKey] = useState('');
  const [eventUrl, setEventUrl] = useState('');
  const [verifying, setVerifying] = useState(false);

  const disabled = loading || verifying;

  useEffect(() => {
    if (initialStatus === 'success') {
      void loadResources();
    }
  }, []);

  async function startOAuth() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations/${provider}/oauth/start`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to start OAuth');
      const { authorizeUrl } = (await res.json()) as { authorizeUrl: string };
      window.location.href = authorizeUrl;
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  async function connectWithApiKey() {
    setError(null);
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }
    setVerifying(true);
    try {
      // Verify the key first
      const verifyRes = await fetch(`/api/integrations/${provider}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim(), eventUrl: eventUrl.trim() || undefined }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.ok) {
        throw new Error(verifyData.error || 'API key verification failed');
      }

      // Save via finalize
      const finalizeRes = await fetch(`/api/integrations/${provider}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            api_key: apiKey.trim(),
            event_url: eventUrl.trim() || undefined,
          },
        }),
      });
      if (!finalizeRes.ok) throw new Error('Failed to save credentials');

      setStep(3);
      setTimeout(() => onComplete?.(), 1500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setVerifying(false);
    }
  }

  async function loadResources() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations/${provider}/resources`);
      if (!res.ok) throw new Error('Failed to load resources');
      const data = await res.json();
      if (provider === 'google-analytics') {
        setGaTree(data.accounts as GAAccountTree[]);
      }
      setStep(2);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function finalize() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations/${provider}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection }),
      });
      if (!res.ok) throw new Error('Failed to save configuration');
      setStep(3);
      setTimeout(() => onComplete?.(), 1500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const providerLabel =
    provider === 'google-analytics'
      ? 'Google Analytics'
      : provider === 'calendly'
        ? 'Calendly'
        : provider === 'cal-com'
          ? 'Cal.com'
          : 'Mailchimp';

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* Step 1 — OAuth providers */}
        {step === 1 && !isApiKeyProvider && (
          <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/55 dark:bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] space-y-4">
            {loading && (
              <div className="text-center py-8">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Starting authorization...
                </p>
              </div>
            )}
            {!loading && !error && (
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Click the button below to authorize {providerLabel}.
                </p>
                <Button onClick={startOAuth} disabled={disabled} className="gap-2">
                  Authorize {providerLabel}
                </Button>
              </div>
            )}
            {error && (
              <div className="space-y-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <Button onClick={startOAuth} disabled={disabled} className="gap-2">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 1 — API key providers (Cal.com) */}
        {step === 1 && isApiKeyProvider && (
          <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/55 dark:bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] space-y-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Key
                </label>
                <Input
                  type="password"
                  placeholder="cal_live_xxxxxxxxxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={disabled}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get your API key from Cal.com → Settings → Developer → API Keys
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Booking Link{' '}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://cal.com/yourname/30min"
                  value={eventUrl}
                  onChange={(e) => setEventUrl(e.target.value)}
                  disabled={disabled}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  The booking link shown on your site
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={connectWithApiKey}
                  disabled={disabled || !apiKey.trim()}
                >
                  {verifying ? 'Verifying…' : `Connect ${providerLabel}`}
                </Button>
                {onClose && (
                  <Button onClick={onClose} variant="outline" disabled={disabled}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — GA property selection */}
        {step === 2 && provider === 'google-analytics' && (
          <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/55 dark:bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Select GA4 resources
            </h2>
            {!gaTree && <p className="text-sm">Loading resources…</p>}
            {gaTree && (
              <div className="space-y-3">
                <label className="block text-sm font-medium">Account</label>
                <select
                  className="w-full border rounded-md p-2 bg-white/80 dark:bg-gray-900/40"
                  value={selection.accountId || ''}
                  onChange={(e) =>
                    setSelection((s) => ({ ...s, accountId: e.target.value }))
                  }
                >
                  <option value="" disabled>Select account</option>
                  {gaTree.map((a) => (
                    <option key={a.account.id} value={a.account.id}>
                      {a.account.name}
                    </option>
                  ))}
                </select>

                {selection.accountId && (
                  <>
                    <label className="block text-sm font-medium">Property</label>
                    <select
                      className="w-full border rounded-md p-2 bg-white/80 dark:bg-gray-900/40"
                      value={selection.propertyId || ''}
                      onChange={(e) =>
                        setSelection((s) => ({ ...s, propertyId: e.target.value }))
                      }
                    >
                      <option value="" disabled>Select property</option>
                      {gaTree
                        .filter((g) => g.account.id === selection.accountId)
                        .map((g) => (
                          <option key={g.property.id} value={g.property.id}>
                            {g.property.name}
                          </option>
                        ))}
                    </select>
                  </>
                )}

                {selection.propertyId && (
                  <>
                    <label className="block text-sm font-medium">Data stream</label>
                    <select
                      className="w-full border rounded-md p-2 bg-white/80 dark:bg-gray-900/40"
                      value={selection.streamId || ''}
                      onChange={(e) =>
                        setSelection((s) => ({ ...s, streamId: e.target.value }))
                      }
                    >
                      <option value="" disabled>Select stream</option>
                      {gaTree
                        .filter((g) => g.property.id === selection.propertyId)
                        .flatMap((g) => g.streams)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.measurementId ? `(${s.measurementId})` : ''}
                          </option>
                        ))}
                    </select>
                  </>
                )}

                <div className="pt-4 flex gap-3">
                  <Button
                    onClick={finalize}
                    disabled={!selection.streamId || disabled}
                  >
                    {loading ? 'Saving…' : 'Save & Connect'}
                  </Button>
                  {onClose && (
                    <Button onClick={onClose} variant="outline" disabled={disabled}>
                      Cancel
                    </Button>
                  )}
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/55 dark:bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <p className="text-green-700 dark:text-green-400 font-medium">
              {providerLabel} connected successfully. You can manage this
              integration from the Integrations page.
            </p>
            {onClose && (
              <div className="pt-4">
                <Button onClick={onClose}>{t('app.close')}</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
