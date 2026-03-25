'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2, ChevronDown, ArrowRight, Loader2, X, User, Mail, Phone } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTranslations } from '@/lib/i18n';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientInfo { name: string; email: string; phone: string; }

// ── Collapsed pill ─────────────────────────────────────────────────────────────

function CollapsedPill({ onExpand }: { onExpand: () => void }) {
  const { t } = useTranslations();
  return (
    <button
      onClick={onExpand}
      type="button"
      className="group flex w-full items-center gap-2.5 rounded-[28px] border border-gray-200/80 bg-white/95 px-3 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(0,0,0,0.10)] dark:border-white/[0.06] dark:bg-white/[0.05] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:px-4 sm:py-3.5"
    >
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center shrink-0">
        <Wand2 className="w-4 h-4 text-[var(--purple)]" />
      </div>
      <span className="flex-1 text-left text-sm text-gray-600 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate">
        {t('scaffold.collapsed.prompt')}
      </span>
      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[var(--purple)] shrink-0 transition-colors" />
    </button>
  );
}

// ── Expanded form ─────────────────────────────────────────────────────────────

const PLACEHOLDER_DESCRIPTIONS = [
  'A local bakery in Cluj that wants to attract walk-in customers and sell custom cakes online...',
  'A freelance graphic designer looking to showcase their portfolio and get new clients...',
  'A yoga studio offering classes and online memberships...',
];

function ExpandedForm({ onCollapse }: { onCollapse: () => void }) {
  const router = useRouter();
  const [client, setClient]       = useState<ClientInfo>({ name: '', email: '', phone: '' });
  const [description, setDescription] = useState('');
  const [step, setStep]           = useState<'client' | 'describe'>('client');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const placeholder = PLACEHOLDER_DESCRIPTIONS[0];

  const clientComplete = client.name.trim().length > 0 && client.email.trim().length > 0;

  const handleClientNext = useCallback(() => {
    if (!clientComplete) return;
    setStep('describe');
  }, [clientComplete]);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/engine/concierge', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          description,
          client: {
            name:  client.name  || undefined,
            email: client.email || undefined,
            phone: client.phone || undefined,
          },
        }),
      });

      if (!res.ok) throw new Error('AI request failed');
      const data = await res.json();

      // Persist prefill to Supabase, redirect wizard with the draft id
      const prefillRes = await fetch('/api/wizard/prefill', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ clientInfo: client, userInput: description, aiResponse: data }),
      });
      if (!prefillRes.ok) throw new Error('Failed to save prefill');
      const { prefillId } = await prefillRes.json() as { prefillId: string };

      router.push('/team/dashboard/new?prefill=' + prefillId);
    } catch {
      setError('Something went wrong. Try again or go to the full wizard.');
    } finally {
      setLoading(false);
    }
  }, [description, client, router]);

  return (
    <div className="rounded-[28px] border border-gray-200/80 bg-white/95 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:border-white/[0.06] dark:bg-white/[0.05] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center shrink-0">
            <Wand2 className="w-3.5 h-3.5 text-[var(--purple)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Quick project setup</p>
            <p className="text-xs text-gray-500 dark:text-white/40">
              {step === 'client' ? 'Step 1 — Client details' : 'Step 2 — Describe the project'}
            </p>
          </div>
        </div>
        <button onClick={onCollapse} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step 1 — Client */}
      {step === 'client' && (
        <div className="space-y-2.5">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Client name *"
              value={client.name}
              onChange={e => setClient(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleClientNext()}
              autoFocus
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:border-[var(--purple)]/50 transition-colors"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white/30 pointer-events-none" />
            <input
              type="email"
              placeholder="Email (optional)"
              value={client.email}
              onChange={e => setClient(p => ({ ...p, email: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleClientNext()}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:border-[var(--purple)]/50 transition-colors"
            />
            {client.name.trim() && !client.email.trim() && (
              <p className="text-[0.6rem] text-amber-500 mt-1 ml-1">Email required to send invoices</p>
            )}
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white/30 pointer-events-none" />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={client.phone}
              onChange={e => setClient(p => ({ ...p, phone: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleClientNext()}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:border-[var(--purple)]/50 transition-colors"
            />
          </div>
          <button
            onClick={handleClientNext}
            disabled={!clientComplete}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--purple)]/90 transition-all"
          >
            Next <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Step 2 — Describe */}
      {step === 'describe' && (
        <div className="space-y-2.5">
          <textarea
            autoFocus
            placeholder={placeholder}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-[var(--purple)]/50 transition-colors resize-none"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setStep('client')}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-500 dark:text-white/50 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={!description.trim() || loading}
              className="flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--purple)]/90 transition-all"
            >
              {loading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysing...</>
                : <><Wand2 className="w-3.5 h-3.5" /> Generate brief</>}
            </button>
          </div>
          <p className="text-[0.6rem] text-gray-400 dark:text-white/25 text-center">
            AI will infer the rest — you can review and edit before launch
          </p>
        </div>
      )}
    </div>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────

export function QuickScaffold() {
  const [isExpanded, setIsExpanded] = useLocalStorage('scaffold-expanded', false);

  if (!isExpanded) return <CollapsedPill onExpand={() => setIsExpanded(true)} />;
  return <ExpandedForm onCollapse={() => setIsExpanded(false)} />;
}
