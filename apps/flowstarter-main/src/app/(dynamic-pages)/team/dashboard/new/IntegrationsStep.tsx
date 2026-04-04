'use client';

import { useCallback, useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, BarChart3, Check, Globe, Loader2, Search } from 'lucide-react';
import { Button } from '@flowstarter/flow-design-system';
import type { IntegrationsConfig } from '../components/scaffold/useScaffoldForm';

interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: number; // USD cents
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 63);
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}/yr`;
}

export function IntegrationsStep({
  onComplete,
  onBack,
  projectName = '',
  clientName = '',
}: {
  onComplete: (integrations: IntegrationsConfig, domain: string | null) => void;
  onBack: () => void;
  projectName?: string;
  clientName?: string;
}) {
  // Integrations state
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [gaId, setGaId] = useState('');

  // Domain state
  const [keyword, setKeyword] = useState(() => slugify(clientName || projectName));
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const calendlyValid = !calendlyUrl || /^https?:\/\/.+calendly\.com\/.+/i.test(calendlyUrl);
  const gaValid = !gaId || /^G-[A-Z0-9]+$/i.test(gaId);

  const handleSearch = useCallback(async () => {
    const q = keyword.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    setSelectedDomain(null);
    try {
      const res = await fetch(`/api/domains/search?keyword=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = (await res.json()) as { domains: DomainSearchResult[] };
      setResults(data.domains);
    } catch {
      setSearchError('Could not search domains. Try again later.');
    } finally {
      setSearching(false);
    }
  }, [keyword]);

  const handleContinue = () => {
    const config: IntegrationsConfig = {};
    if (calendlyUrl.trim() && calendlyValid) {
      config.calendly = { enabled: true, url: calendlyUrl.trim() };
    }
    if (gaId.trim() && gaValid) {
      config.googleAnalytics = { enabled: true, measurementId: gaId.trim() };
    }
    onComplete(config, selectedDomain);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
          Integrations &amp; Domain
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Optional — connect services and register a domain before the build.
        </p>
      </div>

      {/* ── Integrations ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Calendly */}
        <div className="rounded-[20px] border border-gray-200/80 bg-white/95 p-5 space-y-3 dark:border-white/[0.06] dark:bg-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Calendly</p>
              <p className="text-xs text-zinc-400">Booking widget</p>
            </div>
            {calendlyUrl.trim() && calendlyValid && (
              <Check className="ml-auto w-4 h-4 text-green-500" />
            )}
          </div>
          <input
            type="url"
            placeholder="https://calendly.com/your-name"
            value={calendlyUrl}
            onChange={(e) => setCalendlyUrl(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-blue-400"
          />
          {calendlyUrl && !calendlyValid && (
            <p className="text-xs text-red-500">Enter a valid Calendly URL</p>
          )}
        </div>

        {/* Google Analytics */}
        <div className="rounded-[20px] border border-gray-200/80 bg-white/95 p-5 space-y-3 dark:border-white/[0.06] dark:bg-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Google Analytics</p>
              <p className="text-xs text-zinc-400">Visitor tracking</p>
            </div>
            {gaId.trim() && gaValid && (
              <Check className="ml-auto w-4 h-4 text-green-500" />
            )}
          </div>
          <input
            type="text"
            placeholder="G-XXXXXXXXXX"
            value={gaId}
            onChange={(e) => setGaId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3 py-2 text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-amber-400"
          />
          {gaId && !gaValid && (
            <p className="text-xs text-red-500">Format: G-XXXXXXXXXX</p>
          )}
        </div>
      </div>

      {/* ── Domain ────────────────────────────────────────────────────── */}
      <div className="rounded-[20px] border border-gray-200/80 bg-white/95 p-5 space-y-4 dark:border-white/[0.06] dark:bg-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Custom Domain</p>
            <p className="text-xs text-zinc-400">Register a domain or skip — site always gets a free .flowstarter.dev address</p>
          </div>
          {selectedDomain && <Check className="ml-auto w-4 h-4 text-green-500" />}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search domains (e.g. janedoe)"
            className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-purple-400"
          />
          <Button
            onClick={handleSearch}
            disabled={searching || !keyword.trim()}
            variant="accent"
            size="md"
            icon={searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          >
            Search
          </Button>
        </div>

        {searchError && (
          <p className="text-sm text-red-600 dark:text-red-400">{searchError}</p>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((r) => (
              <button
                key={r.domain}
                type="button"
                disabled={!r.available}
                onClick={() => setSelectedDomain(r.available ? (selectedDomain === r.domain ? null : r.domain) : null)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                  selectedDomain === r.domain
                    ? 'border-[var(--purple)]/50 bg-[var(--purple)]/5 dark:bg-[var(--purple)]/10 ring-1 ring-[var(--purple)]/30'
                    : r.available
                      ? 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.06]'
                      : 'border-gray-200/50 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{r.domain}</span>
                <div className="flex items-center gap-2">
                  {r.price != null && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatPrice(r.price)}</span>
                  )}
                  {r.available ? (
                    selectedDomain === r.domain ? (
                      <Check className="w-4 h-4 text-[var(--purple)]" />
                    ) : (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">Available</span>
                    )
                  ) : (
                    <span className="text-xs text-zinc-400">Taken</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedDomain && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedDomain}</span> will be registered and configured automatically on launch.
          </p>
        )}
      </div>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button onClick={onBack} variant="outline" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!calendlyValid || !gaValid}
          variant="accent"
          size="md"
          className="flex-1"
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
