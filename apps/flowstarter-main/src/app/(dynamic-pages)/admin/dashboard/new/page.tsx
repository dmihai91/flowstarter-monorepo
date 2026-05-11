'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@flowstarter/flow-design-system';
import { TeamDashboardShell } from '../components/TeamDashboardShell';

type Step = 1 | 2 | 3 | 4;

interface BriefData {
  // Client
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientBusinessName: string;
  // Brief
  description: string;
  industry: string;
  targetAudience: string;
  uvp: string;
  brandTone: 'professional' | 'bold' | 'friendly' | '';
  goal: 'leads' | 'sales' | 'bookings' | '';
  // Setup
  tier: 'essential' | 'pro' | 'commerce' | 'custom' | '';
  commerceMode: 'none' | 'shopify_external' | 'shopify_native' | 'custom_inhouse' | '';
  isFounding: boolean;
  billingInterval: 'monthly' | 'annual';
}

const EMPTY: BriefData = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientBusinessName: '',
  description: '',
  industry: '',
  targetAudience: '',
  uvp: '',
  brandTone: '',
  goal: '',
  tier: '',
  commerceMode: '',
  isFounding: false,
  billingInterval: 'monthly',
};

const STEPS: Array<{ n: Step; title: string }> = [
  { n: 1, title: 'Discovery' },
  { n: 2, title: 'Client' },
  { n: 3, title: 'Brief' },
  { n: 4, title: 'Setup' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<BriefData>(EMPTY);
  const [discoveryNotes, setDiscoveryNotes] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiQuestions, setAiQuestions] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof BriefData>(key: K, value: BriefData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const runAiExtract = async () => {
    if (discoveryNotes.trim().length < 10) {
      setAiError('Add at least a sentence or two of discovery notes.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiQuestions(null);
    try {
      const res = await fetch('/api/admin/ai/extract-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: discoveryNotes }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'AI extraction failed');
      }
      if (json.status === 'needsMoreInfo') {
        setAiQuestions(json.followUpQuestions || []);
        return;
      }
      // status === 'complete' → prefill data
      setData((prev) => ({
        ...prev,
        clientBusinessName: json.siteName || prev.clientBusinessName,
        description: json.description || prev.description,
        industry: json.industry || prev.industry,
        targetAudience: json.targetAudience || prev.targetAudience,
        uvp: json.uvp || prev.uvp,
        brandTone: json.brandTone || prev.brandTone,
        goal: json.goal || prev.goal,
        clientEmail: json.contactEmail || prev.clientEmail,
        clientPhone: json.contactPhone || prev.clientPhone,
      }));
      setStep(2);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI extraction failed');
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 1. Create the workspace draft with client + commerce info
      const draftRes = await fetch('/api/admin/projects/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectConfig: {
            name: data.clientBusinessName || data.clientName || undefined,
            siteKind: data.tier === 'commerce' ? 'shopify_liquid' : 'astro',
            clientInfo: {
              name: data.clientName || undefined,
              email: data.clientEmail || undefined,
              phone: data.clientPhone || undefined,
              businessName: data.clientBusinessName || undefined,
            },
            commerceInfo: data.commerceMode
              ? { mode: data.commerceMode }
              : undefined,
            businessInfo: { summary: data.description || undefined },
          },
        }),
      });
      const draftJson = await draftRes.json();
      if (!draftRes.ok) {
        throw new Error(draftJson.error || 'Failed to create project');
      }
      const projectId = draftJson.id || draftJson.projectId;

      // 2. Patch the workspace with the brief details
      const patchPayload: Record<string, unknown> = {
        concierge_stage: 'brief',
      };
      if (data.description) patchPayload.description = data.description;
      if (data.industry) patchPayload.industry = data.industry;
      if (data.targetAudience) patchPayload.target_audience = data.targetAudience;
      if (data.uvp) patchPayload.uvp = data.uvp;
      if (data.brandTone) patchPayload.brand_tone = data.brandTone;
      if (data.goal) patchPayload.goal = data.goal;
      if (data.tier) patchPayload.tier_name = data.tier;
      if (data.isFounding) patchPayload.is_founding = true;
      if (data.billingInterval) patchPayload.billing_interval = data.billingInterval;

      // Best-effort patch — workspace already exists even if this fails
      await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchPayload),
      }).catch(() => undefined);

      router.push(`/admin/dashboard/projects/${projectId}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create project'
      );
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return true; // Discovery is optional
    if (step === 2)
      return (
        data.clientName.trim().length > 0 &&
        /\S+@\S+\.\S+/.test(data.clientEmail)
      );
    if (step === 3) return data.description.trim().length > 0;
    if (step === 4) return data.tier !== '';
    return true;
  };

  return (
    <TeamDashboardShell
      title="New project"
      subtitle="Capture a discovery brief and spin up the workspace"
      maxWidth="7xl"
      showBackButton
      backHref="/admin/dashboard"
      backLabel="Dashboard"
    >
      {/* Step indicator */}
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((s, idx) => {
          const isActive = s.n === step;
          const isDone = s.n < step;
          return (
            <li key={s.n} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => isDone && setStep(s.n)}
                disabled={!isDone && !isActive}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--purple)] text-white shadow-sm'
                    : isDone
                    ? 'bg-[var(--purple)]/15 text-[var(--purple)] cursor-pointer hover:bg-[var(--purple)]/25'
                    : 'bg-gray-100 dark:bg-white/5 text-[var(--fs-ink-faint)]'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : s.n}
              </button>
              <span
                className={`text-xs font-medium ${
                  isActive
                    ? 'text-[var(--fs-ink)]'
                    : 'text-[var(--fs-ink-faint)]'
                }`}
              >
                {s.title}
              </span>
              {idx < STEPS.length - 1 && (
                <div className="ml-1 mr-1 h-px flex-1 bg-[var(--fs-rule)]" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Step body */}
      <div
        className="rounded-[var(--fs-radius-2xl)] border p-6 sm:p-8"
        style={{
          background: 'var(--fs-glass-bg)',
          borderColor: 'var(--fs-glass-edge)',
          boxShadow: 'var(--fs-card-shadow)',
        }}
      >
        {step === 1 && (
          <DiscoveryStep
            notes={discoveryNotes}
            setNotes={setDiscoveryNotes}
            onExtract={runAiExtract}
            loading={aiLoading}
            error={aiError}
            questions={aiQuestions}
          />
        )}

        {step === 2 && <ClientStep data={data} update={update} />}
        {step === 3 && <BriefStep data={data} update={update} />}
        {step === 4 && (
          <SetupStep
            data={data}
            update={update}
            submitting={submitting}
            submitError={submitError}
          />
        )}
      </div>

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() =>
            step === 1
              ? router.push('/admin/dashboard')
              : setStep((step - 1) as Step)
          }
        >
          Back
        </Button>

        {step < 4 ? (
          <Button
            variant="brand"
            size="sm"
            icon={<ArrowRight className="h-4 w-4" />}
            iconPosition="right"
            onClick={() => setStep((step + 1) as Step)}
            disabled={!canProceed()}
          >
            {step === 1 ? 'Continue without AI' : 'Continue'}
          </Button>
        ) : (
          <Button
            variant="brand"
            size="sm"
            icon={
              submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )
            }
            iconPosition="right"
            onClick={submit}
            disabled={!canProceed() || submitting}
          >
            {submitting ? 'Creating…' : 'Create project'}
          </Button>
        )}
      </div>
    </TeamDashboardShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEPS

function DiscoveryStep({
  notes,
  setNotes,
  onExtract,
  loading,
  error,
  questions,
}: {
  notes: string;
  setNotes: (v: string) => void;
  onExtract: () => void;
  loading: boolean;
  error: string | null;
  questions: string[] | null;
}) {
  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-[var(--fs-ink)]">
        Paste discovery notes (optional)
      </h2>
      <p className="mb-4 text-sm text-[var(--fs-ink-faint)]">
        Drop in raw notes from your discovery call and AI will pre-fill the
        next steps. Or skip and fill manually.
      </p>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={9}
        placeholder="e.g. 'Spoke with Maria — runs a small dental clinic in Bucharest, 2 dentists, mostly word-of-mouth. Wants a clean modern site to attract younger patients, online booking would be nice. Budget around €2k. Tone friendly but professional…'"
        className="w-full rounded-xl border bg-white dark:bg-white/[0.03] px-4 py-3 text-sm text-[var(--fs-ink)] placeholder:text-[var(--fs-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/30 dark:border-white/15 border-gray-300/90"
      />

      {questions && questions.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="mb-1.5 flex items-center gap-1.5 font-medium">
            <AlertCircle className="h-4 w-4" /> Need a bit more context
          </div>
          <ul className="ml-5 list-disc space-y-0.5 text-xs">
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={
            loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )
          }
          onClick={onExtract}
          disabled={loading || notes.trim().length < 10}
          className="text-[var(--purple)] hover:bg-[var(--purple)]/10"
        >
          {loading ? 'Extracting…' : 'Extract with AI'}
        </Button>
      </div>
    </div>
  );
}

function ClientStep({
  data,
  update,
}: {
  data: BriefData;
  update: <K extends keyof BriefData>(key: K, value: BriefData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-[var(--fs-ink)]">
        Client details
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name *">
          <input
            value={data.clientName}
            onChange={(e) => update('clientName', e.target.value)}
            placeholder="Maria Ionescu"
            className={inputClass}
          />
        </Field>
        <Field label="Business name">
          <input
            value={data.clientBusinessName}
            onChange={(e) => update('clientBusinessName', e.target.value)}
            placeholder="Smile Dental Clinic"
            className={inputClass}
          />
        </Field>
        <Field label="Email *">
          <input
            type="email"
            value={data.clientEmail}
            onChange={(e) => update('clientEmail', e.target.value)}
            placeholder="maria@example.com"
            className={inputClass}
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            value={data.clientPhone}
            onChange={(e) => update('clientPhone', e.target.value)}
            placeholder="+40 7XX XXX XXX"
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}

function BriefStep({
  data,
  update,
}: {
  data: BriefData;
  update: <K extends keyof BriefData>(key: K, value: BriefData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-[var(--fs-ink)]">
        Business brief
      </h2>

      <Field label="Business description *">
        <textarea
          rows={3}
          value={data.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="What the business does, in 1–2 sentences."
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Industry">
          <input
            value={data.industry}
            onChange={(e) => update('industry', e.target.value)}
            placeholder="dental, fitness, restaurant…"
            className={inputClass}
          />
        </Field>
        <Field label="Target audience">
          <input
            value={data.targetAudience}
            onChange={(e) => update('targetAudience', e.target.value)}
            placeholder="Who their ideal clients are"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Unique value proposition">
        <textarea
          rows={2}
          value={data.uvp}
          onChange={(e) => update('uvp', e.target.value)}
          placeholder="What makes them stand out"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand tone">
          <select
            value={data.brandTone}
            onChange={(e) =>
              update('brandTone', e.target.value as BriefData['brandTone'])
            }
            className={inputClass}
          >
            <option value="">Select…</option>
            <option value="professional">Professional</option>
            <option value="bold">Bold</option>
            <option value="friendly">Friendly</option>
          </select>
        </Field>
        <Field label="Primary goal">
          <select
            value={data.goal}
            onChange={(e) =>
              update('goal', e.target.value as BriefData['goal'])
            }
            className={inputClass}
          >
            <option value="">Select…</option>
            <option value="leads">Leads</option>
            <option value="sales">Sales</option>
            <option value="bookings">Bookings</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

function SetupStep({
  data,
  update,
  submitting,
  submitError,
}: {
  data: BriefData;
  update: <K extends keyof BriefData>(key: K, value: BriefData[K]) => void;
  submitting: boolean;
  submitError: string | null;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-[var(--fs-ink)]">
        Tier & commerce
      </h2>

      <Field label="Tier *">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { v: 'essential', label: 'Essential', sub: 'Service site' },
              { v: 'pro', label: 'Pro', sub: 'Service+' },
              { v: 'commerce', label: 'Commerce', sub: 'Shopify' },
              { v: 'custom', label: 'Custom', sub: 'Bespoke' },
            ] as const
          ).map((opt) => {
            const active = data.tier === opt.v;
            return (
              <button
                key={opt.v}
                type="button"
                onClick={() => update('tier', opt.v)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  active
                    ? 'border-[var(--purple)] bg-[var(--purple)]/10 text-[var(--fs-ink)]'
                    : 'border-[var(--fs-rule)] bg-white/60 dark:bg-white/[0.03] text-[var(--fs-ink-dim)] hover:border-[var(--purple)]/40'
                }`}
              >
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="text-[0.65rem] text-[var(--fs-ink-faint)]">
                  {opt.sub}
                </div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Commerce mode">
        <select
          value={data.commerceMode}
          onChange={(e) =>
            update('commerceMode', e.target.value as BriefData['commerceMode'])
          }
          className={inputClass}
        >
          <option value="">None / not applicable</option>
          <option value="shopify_external">Shopify (external link)</option>
          <option value="shopify_native">Shopify (native theme)</option>
          <option value="custom_inhouse">Custom in-house</option>
        </select>
      </Field>

      <Field label="Billing">
        <div className="flex items-center gap-2">
          {(['monthly', 'annual'] as const).map((b) => {
            const active = data.billingInterval === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => update('billingInterval', b)}
                className={`rounded-xl border px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                  active
                    ? 'border-[var(--purple)] bg-[var(--purple)]/10 text-[var(--fs-ink)]'
                    : 'border-[var(--fs-rule)] bg-white/60 dark:bg-white/[0.03] text-[var(--fs-ink-dim)]'
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </Field>

      <label className="flex items-start gap-2 rounded-xl border border-[var(--fs-rule)] bg-white/60 dark:bg-white/[0.03] p-3 cursor-pointer">
        <input
          type="checkbox"
          checked={data.isFounding}
          onChange={(e) => update('isFounding', e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className="font-medium text-[var(--fs-ink)]">
            Founding client
          </span>
          <span className="block text-[0.7rem] text-[var(--fs-ink-faint)]">
            One of the first 10 per tier — discounted setup, 50/50 billing.
          </span>
        </span>
      </label>

      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {submitError}
        </div>
      )}

      {submitting && (
        <p className="text-xs text-[var(--fs-ink-faint)]">
          Creating workspace…
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-xl border bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-[var(--fs-ink)] placeholder:text-[var(--fs-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/30 dark:border-white/15 border-gray-300/90';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--fs-ink-dim)]">
        {label}
      </span>
      {children}
    </label>
  );
}
