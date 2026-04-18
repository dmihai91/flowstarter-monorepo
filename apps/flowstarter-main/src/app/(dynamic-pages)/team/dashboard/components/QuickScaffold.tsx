'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2, ChevronDown, ArrowRight, X } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTranslations } from '@/lib/i18n';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  businessName: string;
}

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
  const { t } = useTranslations();
  const router = useRouter();
  const [client, setClient] = useState<ClientInfo>({
    name: '',
    email: '',
    phone: '',
    businessName: '',
  });
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'client' | 'describe'>('client');
  const placeholder = PLACEHOLDER_DESCRIPTIONS[0];

  const clientComplete =
    client.name.trim().length > 0 &&
    client.email.trim().length > 0 &&
    client.phone.trim().length > 0;

  const handleClientNext = useCallback(() => {
    if (!clientComplete) return;
    setStep('describe');
  }, [clientComplete]);

  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/team/projects/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectConfig: {
            name: client.name || 'Untitled Project',
            clientInfo: client,
            userInput: description,
            businessInfo: { summary: description },
          },
        }),
      });
      const data = res.ok ? ((await res.json()) as { projectId?: string }) : {};
      const draftId = data.projectId;
      router.push(
        draftId ? `/team/dashboard/new?draft=${draftId}` : '/team/dashboard/new'
      );
    } catch {
      router.push('/team/dashboard/new');
    } finally {
      setIsSaving(false);
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
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick project setup
            </p>
            <p className="text-sm text-gray-500 dark:text-white/40">
              {step === 'client'
                ? 'Step 1 — Client details'
                : 'Step 2 — Describe the project'}
            </p>
          </div>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step 1 — Client */}
      {step === 'client' && (
        <div className="space-y-4">
          {/* Row 1: Name + Email */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                id="qs-name"
                type="text"
                placeholder=" "
                value={client.name}
                onChange={(e) =>
                  setClient((p) => ({ ...p, name: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && handleClientNext()}
                autoFocus
                className="peer w-full px-3 pt-5 pb-1.5 text-base rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white focus:outline-none focus:border-[var(--purple)]/50 transition-colors"
              />
              <label
                htmlFor="qs-name"
                className="absolute left-3 top-1.5 text-[0.6rem] font-medium text-gray-400 dark:text-white/30 pointer-events-none transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[0.6rem] peer-focus:text-[var(--purple)]"
              >
                {t('scaffold.client.field.name')} *
              </label>
            </div>
            <div className="relative">
              <input
                id="qs-email"
                type="email"
                placeholder=" "
                value={client.email}
                onChange={(e) =>
                  setClient((p) => ({ ...p, email: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && handleClientNext()}
                className="peer w-full px-3 pt-5 pb-1.5 text-base rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white focus:outline-none focus:border-[var(--purple)]/50 transition-colors"
              />
              <label
                htmlFor="qs-email"
                className="absolute left-3 top-1.5 text-[0.6rem] font-medium text-gray-400 dark:text-white/30 pointer-events-none transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[0.6rem] peer-focus:text-[var(--purple)]"
              >
                {t('scaffold.client.field.email')} *
              </label>
            </div>
          </div>
          {/* Row 2: Phone + Business name */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                id="qs-phone"
                type="tel"
                placeholder=" "
                value={client.phone}
                onChange={(e) =>
                  setClient((p) => ({ ...p, phone: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && handleClientNext()}
                className="peer w-full px-3 pt-5 pb-1.5 text-base rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white focus:outline-none focus:border-[var(--purple)]/50 transition-colors"
              />
              <label
                htmlFor="qs-phone"
                className="absolute left-3 top-1.5 text-[0.6rem] font-medium text-gray-400 dark:text-white/30 pointer-events-none transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[0.6rem] peer-focus:text-[var(--purple)]"
              >
                {t('scaffold.client.field.phone')} *
              </label>
            </div>
            <div className="relative">
              <input
                id="qs-business"
                type="text"
                placeholder=" "
                value={client.businessName}
                onChange={(e) =>
                  setClient((p) => ({ ...p, businessName: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && handleClientNext()}
                className="peer w-full px-3 pt-5 pb-1.5 text-base rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white focus:outline-none focus:border-[var(--purple)]/50 transition-colors"
              />
              <label
                htmlFor="qs-business"
                className="absolute left-3 top-1.5 text-[0.6rem] font-medium text-gray-400 dark:text-white/30 pointer-events-none transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[0.6rem] peer-focus:text-[var(--purple)]"
              >
                {t('scaffold.client.field.businessName')}
              </label>
            </div>
          </div>
          {/* Row 3: Next button */}
          <div className="flex">
            <button
              onClick={handleClientNext}
              disabled={!clientComplete}
              className="ml-auto flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--purple)] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--purple)]/90 transition-all"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Describe */}
      {step === 'describe' && (
        <div className="space-y-2.5">
          <textarea
            autoFocus
            placeholder={placeholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-[var(--purple)]/50 transition-colors resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setStep('client')}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-500 dark:text-white/50 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={!description.trim() || isSaving}
              className="flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--purple)]/90 transition-all"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Continue to wizard'}
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
  const [isExpanded, setIsExpanded] = useLocalStorage(
    'scaffold-expanded',
    false
  );

  if (!isExpanded)
    return <CollapsedPill onExpand={() => setIsExpanded(true)} />;
  return <ExpandedForm onCollapse={() => setIsExpanded(false)} />;
}
