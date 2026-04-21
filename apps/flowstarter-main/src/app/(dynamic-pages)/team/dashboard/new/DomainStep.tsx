'use client';

import { useCallback, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Loader2,
  Search,
} from 'lucide-react';
import { Button } from '@flowstarter/flow-design-system';

interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: number; // USD cents
  currency?: string;
}

interface DomainStepProps {
  projectName: string;
  clientName: string;
  onDomainSelected: (domain: string | null) => void;
  onBack: () => void;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 63);
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}/yr`;
}

export function DomainStep({
  projectName,
  clientName,
  onDomainSelected,
  onBack,
}: DomainStepProps) {
  const [keyword, setKeyword] = useState(() =>
    slugify(clientName || projectName)
  );
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    const q = keyword.trim();
    if (!q) return;

    setSearching(true);
    setSearchError(null);
    setResults([]);
    setSelected(null);

    try {
      const res = await fetch(
        `/api/domains/search?keyword=${encodeURIComponent(q)}`
      );
      if (!res.ok) throw new Error('Search failed');
      const data = (await res.json()) as { domains: DomainSearchResult[] };
      setResults(data.domains);
    } catch {
      setSearchError('Could not search domains. Try again later.');
    } finally {
      setSearching(false);
    }
  }, [keyword]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch]
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
          Custom Domain
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Search for a domain to register, or skip to add one later.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search domains..."
          className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-blue-400"
        />
        <Button
          onClick={handleSearch}
          disabled={searching || !keyword.trim()}
          variant="accent"
          size="md"
          icon={
            searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )
          }
        >
          Search
        </Button>
      </div>

      {/* Error */}
      {searchError && (
        <p className="text-sm text-red-600 dark:text-red-400">{searchError}</p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => (
            <button
              key={r.domain}
              type="button"
              disabled={!r.available}
              onClick={() => setSelected(r.domain)}
              className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition-all ${
                selected === r.domain
                  ? 'border-[var(--purple)]/50 bg-[var(--purple)]/5 dark:bg-[var(--purple)]/10 ring-1 ring-[var(--purple)]/30'
                  : r.available
                  ? 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.06]'
                  : 'border-gray-200/50 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {r.domain}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {r.price != null && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatPrice(r.price)}
                  </span>
                )}
                {r.available ? (
                  selected === r.domain ? (
                    <Check className="w-4 h-4 text-[var(--purple)]" />
                  ) : (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Available
                    </span>
                  )
                ) : (
                  <span className="text-xs text-zinc-400">Taken</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Confirmation */}
      {selected && (
        <div
          className="rounded-[var(--fs-radius-2xl)] border p-4 backdrop-blur-2xl backdrop-saturate-150"
          style={{
            background: 'var(--fs-glass-bg)',
            borderColor: 'var(--fs-glass-edge)',
            boxShadow: 'var(--fs-card-shadow)',
          }}
        >
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-semibold text-zinc-900 dark:text-white">
              {selected}
            </span>{' '}
            will be registered and configured automatically.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={onBack}
          variant="outline"
          size="md"
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
        {selected ? (
          <Button
            onClick={() => onDomainSelected(selected)}
            variant="accent"
            size="md"
            className="flex-1"
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            Confirm &amp; Continue
          </Button>
        ) : (
          <Button
            onClick={() => onDomainSelected(null)}
            variant="accent"
            size="md"
            className="flex-1"
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            Skip — add domain later
          </Button>
        )}
      </div>
    </div>
  );
}
