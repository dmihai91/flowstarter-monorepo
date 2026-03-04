'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { useEffect, useState } from 'react';

type Provider = 'google-analytics' | 'calendly' | 'mailchimp';

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
  const [step, setStep] = useState<1 | 2 | 3>(
    initialStatus === 'success' ? 2 : 1
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalized resource state (MVP: support GA first)
  const [gaTree, setGaTree] = useState<GAAccountTree[] | null>(null);
  const [selection, setSelection] = useState<{
    accountId?: string;
    propertyId?: string;
    streamId?: string;
    measurementId?: string;
  }>({});
  const disabled = loading;

  useEffect(() => {
    if (initialStatus === 'success') {
      void loadResources();
    }
    // Don't auto-start OAuth - let user click the button
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
      // Call onComplete after a short delay to show success message
      setTimeout(() => {
        onComplete?.();
      }, 1500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {step === 1 && (
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
                  Click the button below to authorize this integration.
                </p>
                <Button
                  onClick={startOAuth}
                  disabled={disabled}
                  className="gap-2"
                >
                  Authorize{' '}
                  {provider === 'google-analytics' && 'Google Analytics'}
                  {provider === 'calendly' && 'Calendly'}
                  {provider === 'mailchimp' && 'Mailchimp'}
                </Button>
              </div>
            )}
            {error && (
              <div className="space-y-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
                <Button
                  onClick={startOAuth}
                  disabled={disabled}
                  className="gap-2"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}

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
                  <option value="" disabled>
                    Select account
                  </option>
                  {gaTree.map((a) => (
                    <option key={a.account.id} value={a.account.id}>
                      {a.account.name}
                    </option>
                  ))}
                </select>

                {selection.accountId && (
                  <>
                    <label className="block text-sm font-medium">
                      Property
                    </label>
                    <select
                      className="w-full border rounded-md p-2 bg-white/80 dark:bg-gray-900/40"
                      value={selection.propertyId || ''}
                      onChange={(e) =>
                        setSelection((s) => ({
                          ...s,
                          propertyId: e.target.value,
                        }))
                      }
                    >
                      <option value="" disabled>
                        Select property
                      </option>
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
                    <label className="block text-sm font-medium">
                      Data stream
                    </label>
                    <select
                      className="w-full border rounded-md p-2 bg-white/80 dark:bg-gray-900/40"
                      value={selection.streamId || ''}
                      onChange={(e) =>
                        setSelection((s) => ({
                          ...s,
                          streamId: e.target.value,
                        }))
                      }
                    >
                      <option value="" disabled>
                        Select stream
                      </option>
                      {gaTree
                        .filter((g) => g.property.id === selection.propertyId)
                        .flatMap((g) => g.streams)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}{' '}
                            {s.measurementId ? `(${s.measurementId})` : ''}
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
                    <Button
                      onClick={onClose}
                      variant="outline"
                      disabled={disabled}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-3">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/55 dark:bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <p className="text-green-700 dark:text-green-400 font-medium">
              Connected successfully. You can manage this integration from the
              Integrations page.
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
