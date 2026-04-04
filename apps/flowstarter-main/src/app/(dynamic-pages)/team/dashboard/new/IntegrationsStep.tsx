'use client';

import { useCallback, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Calendar, BarChart3, Check,
  Globe, Loader2, Search, Mail, CreditCard, Lock,
} from 'lucide-react';
import { Button } from '@flowstarter/flow-design-system';
import type { IntegrationsConfig } from '../components/scaffold/useScaffoldForm';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: number; // USD cents
}

export interface IntegrationsStepProps {
  onComplete: (integrations: IntegrationsConfig, domain: string | null) => void;
  onBack: () => void;
  projectName?: string;
  clientName?: string;
  /** Current plan — controls which integrations are available */
  planId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 63);
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}/yr`;
}

const GROWTH_PLANS = new Set(['GROWTH']);

function isGrowthPlan(planId?: string): boolean {
  return GROWTH_PLANS.has(planId ?? '');
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[20px] border border-gray-200/80 bg-white/95 p-5 space-y-3 dark:border-white/[0.06] dark:bg-white/[0.04] ${className}`}>
      {children}
    </div>
  );
}

function IntegrationHeader({
  icon,
  label,
  sublabel,
  checked,
  locked,
  lockLabel,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  checked?: boolean;
  locked?: boolean;
  lockLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
          {label}
          {locked && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              <Lock className="w-2.5 h-2.5" /> {lockLabel ?? 'Growth'}
            </span>
          )}
        </p>
        <p className="text-xs text-zinc-400">{sublabel}</p>
      </div>
      {checked && !locked && <Check className="ml-auto w-4 h-4 text-green-500" />}
    </div>
  );
}

function FieldInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  mono,
  focusColor = 'blue',
  disabled,
}: {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  focusColor?: 'blue' | 'amber' | 'purple' | 'green' | 'pink';
  disabled?: boolean;
}) {
  const focusClass: Record<string, string> = {
    blue: 'focus:border-blue-400',
    amber: 'focus:border-amber-400',
    purple: 'focus:border-purple-400',
    green: 'focus:border-green-400',
    pink: 'focus:border-pink-400',
  };
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none disabled:opacity-40 disabled:cursor-not-allowed ${mono ? 'font-mono' : ''} ${focusClass[focusColor]}`}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function IntegrationsStep({
  onComplete,
  onBack,
  projectName = '',
  clientName = '',
  planId,
}: IntegrationsStepProps) {
  // Show Growth integrations as configurable but flag them as growth-only.
  // The handoff payload will include them regardless — PaymentStep determines
  // whether they're actually provisioned based on the selected plan.
  // We treat them as always editable so the team can fill them in advance.
  const growth = isGrowthPlan(planId);

  // Calendly
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const calendlyValid = !calendlyUrl || /^https?:\/\/.+calendly\.com\/.+/i.test(calendlyUrl);

  // Google Analytics
  const [gaId, setGaId] = useState('');
  const gaValid = !gaId || /^G-[A-Z0-9]+$/i.test(gaId);

  // Mailchimp (Growth only)
  const [mcApiKey, setMcApiKey] = useState('');
  const [mcAudienceId, setMcAudienceId] = useState('');
  const mcValid = !mcApiKey || (mcApiKey.includes('-') && mcApiKey.length > 10);

  // Stripe (Growth only)
  const [stripePk, setStripePk] = useState('');
  const [stripePriceId, setStripePriceId] = useState('');
  const stripeValid = !stripePk || stripePk.startsWith('pk_');

  // Domain
  const [keyword, setKeyword] = useState(() => slugify(clientName || projectName));
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const canContinue = calendlyValid && gaValid && mcValid && stripeValid;

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
    if (mcApiKey.trim() && mcAudienceId.trim() && mcValid) {
      config.mailchimp = { enabled: true, apiKey: mcApiKey.trim(), audienceId: mcAudienceId.trim() };
    }
    if (stripePk.trim() && stripeValid) {
      config.stripe = { enabled: true, publishableKey: stripePk.trim(), priceId: stripePriceId.trim() || undefined };
    }
    onComplete(config, selectedDomain);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
          Integrations &amp; Domain
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Optional — connect services and register a domain before the build.
        </p>
      </div>

      {/* ── Row 1: Calendly + Google Analytics (all plans) ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Calendly */}
        <SectionCard>
          <IntegrationHeader
            icon={<div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0"><Calendar className="w-5 h-5" /></div>}
            label="Calendly"
            sublabel="Booking widget"
            checked={!!(calendlyUrl.trim() && calendlyValid)}
          />
          <FieldInput
            type="url"
            placeholder="https://calendly.com/your-name"
            value={calendlyUrl}
            onChange={setCalendlyUrl}
            focusColor="blue"
          />
          {calendlyUrl && !calendlyValid && (
            <p className="text-xs text-red-500">Enter a valid Calendly URL</p>
          )}
        </SectionCard>

        {/* Google Analytics */}
        <SectionCard>
          <IntegrationHeader
            icon={<div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0"><BarChart3 className="w-5 h-5" /></div>}
            label="Google Analytics"
            sublabel="Visitor tracking"
            checked={!!(gaId.trim() && gaValid)}
          />
          <FieldInput
            placeholder="G-XXXXXXXXXX"
            value={gaId}
            onChange={setGaId}
            mono
            focusColor="amber"
          />
          {gaId && !gaValid && (
            <p className="text-xs text-red-500">Format: G-XXXXXXXXXX</p>
          )}
        </SectionCard>
      </div>

      {/* ── Row 2: Mailchimp + Stripe (Growth only) ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mailchimp */}
        <SectionCard>
          <IntegrationHeader
            icon={<div className="w-9 h-9 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center text-yellow-600 shrink-0"><Mail className="w-5 h-5" /></div>}
            label="Mailchimp"
            sublabel="Email newsletter signup"
            checked={!!(mcApiKey.trim() && mcAudienceId.trim() && mcValid)}
            locked={!growth}
            lockLabel="Growth"
          />
          <FieldInput
            placeholder="API key (xxxx-us1)"
            value={mcApiKey}
            onChange={setMcApiKey}
            mono
            focusColor="pink"
          />
          <FieldInput
            placeholder="Audience ID"
            value={mcAudienceId}
            onChange={setMcAudienceId}
            mono
            focusColor="pink"
          />
          {mcApiKey && !mcValid && (
            <p className="text-xs text-red-500">Format: xxxxxxxxxxxxxx-us1</p>
          )}
        </SectionCard>

        {/* Stripe */}
        <SectionCard>
          <IntegrationHeader
            icon={<div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0"><CreditCard className="w-5 h-5" /></div>}
            label="Stripe"
            sublabel="Accept payments on the site"
            checked={!!(stripePk.trim() && stripeValid)}
            locked={!growth}
            lockLabel="Growth"
          />
          <FieldInput
            placeholder="Publishable key (pk_live_...)"
            value={stripePk}
            onChange={setStripePk}
            mono
            focusColor="purple"
          />
          <FieldInput
            placeholder="Price ID (price_...) — optional"
            value={stripePriceId}
            onChange={setStripePriceId}
            mono
            focusColor="purple"
          />
          {stripePk && !stripeValid && (
            <p className="text-xs text-red-500">Must start with pk_live_ or pk_test_</p>
          )}
        </SectionCard>
      </div>

      {!growth && (mcApiKey.trim() || stripePk.trim()) && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-xl px-4 py-2.5">
          Mailchimp and Stripe are available on the <span className="font-semibold">Growth plan</span>. Select Growth on the next step to activate them.
        </p>
      )}

      {/* ── Domain ────────────────────────────────────────────────── */}
      <SectionCard>
        <IntegrationHeader
          icon={<div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0"><Globe className="w-5 h-5" /></div>}
          label="Custom Domain"
          sublabel="Register a domain — site always gets a free .flowstarter.dev address"
          checked={!!selectedDomain}
        />
        <div className="flex gap-2">
          <FieldInput
            placeholder="Search domains (e.g. janedoe)"
            value={keyword}
            onChange={setKeyword}
            focusColor="purple"
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

        {searchError && <p className="text-sm text-red-600 dark:text-red-400">{searchError}</p>}

        {results.length > 0 && (
          <div className="space-y-2 pt-1">
            {results.map((r) => (
              <button
                key={r.domain}
                type="button"
                disabled={!r.available}
                onClick={() => r.available && setSelectedDomain(selectedDomain === r.domain ? null : r.domain)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 text-left transition-all ${
                  selectedDomain === r.domain
                    ? 'border-[var(--purple)]/50 bg-[var(--purple)]/5 dark:bg-[var(--purple)]/10 ring-1 ring-[var(--purple)]/30'
                    : r.available
                      ? 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.06]'
                      : 'border-gray-200/50 dark:border-white/[0.04] opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{r.domain}</span>
                <div className="flex items-center gap-2">
                  {r.price != null && (
                    <span className="text-xs text-zinc-500">{formatPrice(r.price)}</span>
                  )}
                  {r.available ? (
                    selectedDomain === r.domain
                      ? <Check className="w-4 h-4 text-[var(--purple)]" />
                      : <span className="text-xs font-medium text-green-600 dark:text-green-400">Available</span>
                  ) : (
                    <span className="text-xs text-zinc-400">Taken</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedDomain && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedDomain}</span> will be registered and configured automatically on launch.
          </p>
        )}
      </SectionCard>

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button onClick={onBack} variant="outline" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
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
