'use client';

import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Layers,
  Mail,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  ProjectBriefDraft,
  ProjectGoal,
  OfferType,
  BrandTone,
  PagePref,
  Integration,
} from './useScaffoldForm';

// ── Option sets ────────────────────────────────────────────────────────────────

const GOAL_OPTIONS: { value: ProjectGoal; label: string; emoji: string }[] = [
  { value: 'leads', label: 'Generate leads', emoji: '🎯' },
  { value: 'bookings', label: 'Take bookings', emoji: '📅' },
  { value: 'sales', label: 'Drive sales', emoji: '💳' },
  { value: 'newsletter', label: 'Grow newsletter', emoji: '📬' },
  { value: 'awareness', label: 'Build awareness', emoji: '📣' },
];

const TONE_OPTIONS: { value: BrandTone; label: string; desc: string }[] = [
  {
    value: 'professional',
    label: 'Professional',
    desc: 'Polished, trustworthy',
  },
  { value: 'bold', label: 'Bold', desc: 'Direct, confident' },
  { value: 'warm', label: 'Warm', desc: 'Approachable, human' },
  { value: 'calming', label: 'Calming', desc: 'Soft, reassuring' },
  { value: 'modern', label: 'Modern', desc: 'Clean, minimal' },
  { value: 'premium', label: 'Premium', desc: 'Elevated, exclusive' },
];

const OFFER_OPTIONS: { value: OfferType; label: string }[] = [
  { value: 'premium', label: 'Premium' },
  { value: 'accessible', label: 'Accessible' },
  { value: 'free', label: 'Free' },
  { value: 'custom', label: 'Custom' },
];

const PAGE_OPTIONS: { value: PagePref; label: string; desc: string }[] = [
  {
    value: 'single-page',
    label: 'Single page',
    desc: 'One long scrollable page',
  },
  {
    value: 'multi-page',
    label: 'Multi-page',
    desc: 'Home + subpages (About, etc)',
  },
];

const INTEGRATION_OPTIONS: {
  value: Integration;
  label: string;
  emoji: string;
}[] = [
  { value: 'booking', label: 'Booking', emoji: '📅' },
  { value: 'newsletter', label: 'Newsletter', emoji: '📬' },
  { value: 'analytics', label: 'Analytics', emoji: '📊' },
  { value: 'leadCapture', label: 'Lead capture', emoji: '🎯' },
];

// ── Shared UI primitives ───────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[var(--purple)]/50 focus:ring-2 focus:ring-[var(--purple)]/20 transition-all"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[var(--purple)]/50 focus:ring-2 focus:ring-[var(--purple)]/20 transition-all resize-none"
    />
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
        active
          ? 'bg-[var(--purple)]/10 border-[var(--purple)]/40 text-[var(--purple)] dark:text-[#a5b4fc]'
          : 'bg-white dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-white/[0.07]'
      )}
    >
      {children}
    </button>
  );
}

// ── Step renderers ─────────────────────────────────────────────────────────────

function Step1Business({
  brief,
  update,
}: {
  brief: ProjectBriefDraft;
  update: <K extends keyof ProjectBriefDraft>(
    k: K,
    v: ProjectBriefDraft[K]
  ) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Project name</FieldLabel>
        <TextInput
          value={brief.projectName}
          onChange={(v) => update('projectName', v)}
          placeholder="e.g. Milano Bistro"
        />
      </div>
      <div>
        <FieldLabel>Industry</FieldLabel>
        <TextInput
          value={brief.industry}
          onChange={(v) => update('industry', v)}
          placeholder="e.g. Restaurant, Fitness, Legal"
        />
      </div>
      <div>
        <FieldLabel>Business summary</FieldLabel>
        <TextArea
          value={brief.summary}
          onChange={(v) => update('summary', v)}
          placeholder="What does this business do and who does it serve?"
          rows={3}
        />
      </div>
      <div>
        <FieldLabel>Target audience</FieldLabel>
        <TextInput
          value={brief.targetAudience}
          onChange={(v) => update('targetAudience', v)}
          placeholder="e.g. Young professionals in urban areas"
        />
      </div>
    </div>
  );
}

function Step2Offer({
  brief,
  update,
  toggleGoal,
}: {
  brief: ProjectBriefDraft;
  update: <K extends keyof ProjectBriefDraft>(
    k: K,
    v: ProjectBriefDraft[K]
  ) => void;
  toggleGoal: (g: ProjectGoal) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Value proposition</FieldLabel>
        <TextArea
          value={brief.valueProposition}
          onChange={(v) => update('valueProposition', v)}
          placeholder="What makes this business stand out?"
          rows={2}
        />
      </div>
      <div>
        <FieldLabel>Services / offerings (one per line)</FieldLabel>
        <TextArea
          value={brief.offerings.join('\n')}
          onChange={(v) =>
            update(
              'offerings',
              v
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder={'Haircut & styling\nColour treatment\nBridal packages'}
          rows={3}
        />
      </div>
      <div>
        <FieldLabel>Primary goals</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map(({ value, label, emoji }) => (
            <PillButton
              key={value}
              active={brief.goals.includes(value)}
              onClick={() => toggleGoal(value)}
            >
              {emoji} {label}
            </PillButton>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Offer positioning</FieldLabel>
        <div className="flex gap-2 flex-wrap">
          {OFFER_OPTIONS.map(({ value, label }) => (
            <PillButton
              key={value}
              active={brief.offerType === value}
              onClick={() => update('offerType', value)}
            >
              {label}
            </PillButton>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Brand tone</FieldLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TONE_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => update('brandTone', value)}
              className={cn(
                'p-2.5 rounded-xl border text-left transition-all',
                brief.brandTone === value
                  ? 'bg-[var(--purple)]/10 border-[var(--purple)]/40'
                  : 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.06]'
              )}
            >
              <p
                className={cn(
                  'text-xs font-semibold',
                  brief.brandTone === value
                    ? 'text-[var(--purple)] dark:text-[#a5b4fc]'
                    : 'text-zinc-700 dark:text-zinc-300'
                )}
              >
                {label}
              </p>
              <p className="text-[0.6rem] text-zinc-400 dark:text-zinc-500 mt-0.5">
                {desc}
              </p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Primary business goal</FieldLabel>
        <TextInput
          value={brief.primaryGoal}
          onChange={(v) => update('primaryGoal', v)}
          placeholder="e.g. Book more consultations"
        />
      </div>
      <div>
        <FieldLabel>Primary call to action</FieldLabel>
        <TextInput
          value={brief.desiredCustomerAction}
          onChange={(v) => update('desiredCustomerAction', v)}
          placeholder="e.g. Schedule a discovery call"
        />
      </div>
      <div>
        <FieldLabel>Differentiators (one per line)</FieldLabel>
        <TextArea
          value={brief.differentiators.join('\n')}
          onChange={(v) =>
            update(
              'differentiators',
              v
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder={
            '15 years of experience\nCertified specialists\nFast turnaround'
          }
          rows={3}
        />
      </div>
      <div>
        <FieldLabel>Trust signals (one per line)</FieldLabel>
        <TextArea
          value={brief.trustSignals.join('\n')}
          onChange={(v) =>
            update(
              'trustSignals',
              v
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder={
            '5-star reviews\nRecognized partners\nMoney-back guarantee'
          }
          rows={3}
        />
      </div>
      <div>
        <FieldLabel>Content style preference</FieldLabel>
        <TextInput
          value={brief.contentStylePreference}
          onChange={(v) => update('contentStylePreference', v)}
          placeholder="e.g. concise, persuasive, conversational"
        />
      </div>
      <div>
        <FieldLabel>Operator notes</FieldLabel>
        <TextArea
          value={brief.brandNotes}
          onChange={(v) => update('brandNotes', v)}
          placeholder="Anything the build agent should preserve about the client's voice or positioning"
          rows={3}
        />
      </div>
    </div>
  );
}

function Step3Structure({
  brief,
  update,
  toggleIntegration,
}: {
  brief: ProjectBriefDraft;
  update: <K extends keyof ProjectBriefDraft>(
    k: K,
    v: ProjectBriefDraft[K]
  ) => void;
  toggleIntegration: (i: Integration) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Site structure</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {PAGE_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => update('pagePreference', value)}
              className={cn(
                'p-3 rounded-xl border text-left transition-all',
                brief.pagePreference === value
                  ? 'bg-[var(--purple)]/10 border-[var(--purple)]/40'
                  : 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.06]'
              )}
            >
              <p
                className={cn(
                  'text-xs font-semibold',
                  brief.pagePreference === value
                    ? 'text-[var(--purple)] dark:text-[#a5b4fc]'
                    : 'text-zinc-700 dark:text-zinc-300'
                )}
              >
                {label}
              </p>
              <p className="text-[0.6rem] text-zinc-400 dark:text-zinc-500 mt-0.5">
                {desc}
              </p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Integrations needed</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {INTEGRATION_OPTIONS.map(({ value, label, emoji }) => (
            <PillButton
              key={value}
              active={brief.integrations.includes(value)}
              onClick={() => toggleIntegration(value)}
            >
              {emoji} {label}
            </PillButton>
          ))}
        </div>
        <p className="text-[0.6rem] text-zinc-400 dark:text-zinc-500 mt-2">
          Select all that apply — can be changed later
        </p>
      </div>
    </div>
  );
}

function Step4Contact({
  brief,
  update,
}: {
  brief: ProjectBriefDraft;
  update: <K extends keyof ProjectBriefDraft>(
    k: K,
    v: ProjectBriefDraft[K]
  ) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Business email</FieldLabel>
        <TextInput
          value={brief.contactEmail}
          onChange={(v) => update('contactEmail', v)}
          placeholder="hello@business.com"
        />
      </div>
      <div>
        <FieldLabel>Phone number</FieldLabel>
        <TextInput
          value={brief.contactPhone}
          onChange={(v) => update('contactPhone', v)}
          placeholder="+40 721 000 000"
        />
      </div>
      <div>
        <FieldLabel>Address (optional)</FieldLabel>
        <TextInput
          value={brief.contactAddress}
          onChange={(v) => update('contactAddress', v)}
          placeholder="Str. Florilor 12, Cluj-Napoca"
        />
      </div>
    </div>
  );
}

// ── Step metadata ──────────────────────────────────────────────────────────────

const STEP_META = [
  {
    title: 'Business',
    subtitle: 'Name, industry and what you do',
    icon: <Building2 className="w-4 h-4 text-[var(--purple)]" />,
  },
  {
    title: 'Offer',
    subtitle: 'Services, goals and brand positioning',
    icon: <Sparkles className="w-4 h-4 text-[var(--purple)]" />,
  },
  {
    title: 'Structure',
    subtitle: 'Site layout and integrations',
    icon: <Layers className="w-4 h-4 text-[var(--purple)]" />,
  },
  {
    title: 'Contact',
    subtitle: 'How clients reach the business',
    icon: <Mail className="w-4 h-4 text-[var(--purple)]" />,
  },
];

// ── Main component ─────────────────────────────────────────────────────────────

interface ScaffoldReviewProps {
  brief: ProjectBriefDraft;
  reviewStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  reviewStepCount: number;
  onUpdateBrief: <K extends keyof ProjectBriefDraft>(
    key: K,
    value: ProjectBriefDraft[K]
  ) => void;
  onToggleGoal: (goal: ProjectGoal) => void;
  onToggleIntegration: (integration: Integration) => void;
  onNext: () => void;
  onPrev: () => void;
  onBackToInput: () => void;
  onRegenerate: () => void;
  onReset: () => void;
}

export function ScaffoldReview({
  brief,
  reviewStep,
  isFirstStep,
  isLastStep,
  reviewStepCount,
  onUpdateBrief,
  onToggleGoal,
  onToggleIntegration,
  onNext,
  onPrev,
  onBackToInput,
  onRegenerate,
  onReset,
}: ScaffoldReviewProps) {
  const meta = STEP_META[reviewStep];

  // Per-step required field validation
  const canProceed = (() => {
    if (reviewStep === 0) {
      return (
        brief.projectName.trim().length > 0 &&
        brief.summary.trim().length > 0 &&
        brief.targetAudience.trim().length > 0
      );
    }
    if (reviewStep === 1) {
      return brief.goals.length > 0 && brief.valueProposition.trim().length > 0;
    }
    // Steps 2 and 3 have no hard requirements
    return true;
  })();

  return (
    <div className="rounded-[var(--fs-radius-2xl)] border p-6 backdrop-blur-2xl backdrop-saturate-150" style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)', boxShadow: 'var(--fs-card-shadow)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center shrink-0 text-base">
            {meta.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {meta.title}
            </h3>
            <p className="text-[0.6875rem] text-zinc-500 dark:text-zinc-400">
              {meta.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRegenerate}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-[var(--purple)] hover:bg-[var(--purple)]/10 transition-colors"
            title="Re-run AI"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-5">
        {Array.from({ length: reviewStepCount }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-0.5 flex-1 rounded-full transition-all duration-300',
              i <= reviewStep
                ? 'bg-[var(--purple)]'
                : 'bg-gray-200 dark:bg-white/[0.06]'
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="mb-5">
        {reviewStep === 0 && (
          <Step1Business brief={brief} update={onUpdateBrief} />
        )}
        {reviewStep === 1 && (
          <Step2Offer
            brief={brief}
            update={onUpdateBrief}
            toggleGoal={onToggleGoal}
          />
        )}
        {reviewStep === 2 && (
          <Step3Structure
            brief={brief}
            update={onUpdateBrief}
            toggleIntegration={onToggleIntegration}
          />
        )}
        {reviewStep === 3 && (
          <Step4Contact brief={brief} update={onUpdateBrief} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={isFirstStep ? onBackToInput : onPrev}
          className="flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[var(--purple)] text-white text-sm font-semibold hover:bg-[var(--purple)]/90 transition-all shadow-[0_4px_12px_rgba(99,102,241,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLastStep ? (
            <>
              <Sparkles className="w-3.5 h-3.5" /> Done — pick template
            </>
          ) : (
            <>
              Next <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 text-center">
        Step {reviewStep + 1} of {reviewStepCount}
      </p>
    </div>
  );
}
