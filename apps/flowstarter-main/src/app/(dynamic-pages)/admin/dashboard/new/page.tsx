'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { TeamDashboardShell } from '../components/TeamDashboardShell';
import {
  type BriefData,
  type Step,
  EMPTY_BRIEF,
  STEPS,
  MIN_DISCOVERY_NOTE_WORDS,
  discoveryNotesMeetMinimum,
} from './new-project.logic';
import { DiscoveryStep } from './components/DiscoveryStep';
import { ClientStep } from './components/ClientStep';
import { BriefStep } from './components/BriefStep';
import { SetupStep } from './components/SetupStep';

export default function NewProjectPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<BriefData>(EMPTY_BRIEF);
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
    if (!discoveryNotesMeetMinimum(discoveryNotes.trim())) {
      setAiError(
        t('admin.dashboard.newProject.discovery.notesMinLengthHint', {
          minWords: MIN_DISCOVERY_NOTE_WORDS,
        })
      );
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
      // 1. Create the project draft with client + commerce info
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

      // 2. Patch the project with the brief details
      const patchPayload: Record<string, unknown> = {
        concierge_stage: 'brief',
      };
      if (data.description) patchPayload.description = data.description;
      if (data.industry) patchPayload.industry = data.industry;
      if (data.targetAudience)
        patchPayload.target_audience = data.targetAudience;
      if (data.uvp) patchPayload.uvp = data.uvp;
      if (data.brandTone) patchPayload.brand_tone = data.brandTone;
      if (data.goal) patchPayload.goal = data.goal;
      if (data.tier) patchPayload.tier_name = data.tier;
      if (data.isFounding) patchPayload.is_founding = true;
      if (data.billingInterval)
        patchPayload.billing_interval = data.billingInterval;

      // Best-effort patch — project already exists even if this fails
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
    if (step === 1) return discoveryNotesMeetMinimum(discoveryNotes.trim());
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
      className="admin-new-project-wizard"
      title="New project"
      subtitle={t('admin.dashboard.newProject.subtitle')}
      showBackButton
      backHref="/admin/dashboard"
      backLabel="Dashboard"
    >
      {/* Step indicator */}
      <ol className="mb-7 flex items-center gap-2">
        {STEPS.map((s, idx) => {
          const isActive = s.n === step;
          const isDone = s.n < step;
          return (
            <li key={s.n} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => isDone && setStep(s.n)}
                disabled={!isDone && !isActive}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors',
                  isActive &&
                    'bg-[var(--ls-accent)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]',
                  isDone &&
                    !isActive &&
                    'cursor-pointer bg-[color-mix(in_oklab,var(--ls-accent)_18%,var(--ls-glass-bg))] text-[var(--ls-accent)] hover:bg-[color-mix(in_oklab,var(--ls-accent)_26%,var(--ls-glass-bg))]',
                  !isActive &&
                    !isDone &&
                    'npw-step-idle border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] text-[var(--ls-ink-faint)]'
                )}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  s.n
                )}
              </button>
              <span
                className={cn(
                  'min-w-0 truncate text-[11px] font-medium uppercase tracking-[0.14em]',
                  isActive
                    ? 'text-[var(--ls-ink)]'
                    : 'npw-step-idle text-[var(--ls-ink-faint)]'
                )}
                style={{ fontFamily: 'var(--ls-mono)' }}
              >
                {s.title}
              </span>
              {idx < STEPS.length - 1 && (
                <div
                  className="mx-1 h-px min-w-[0.5rem] flex-1 bg-[var(--ls-rule)]"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Step body — matches dashboard `ls-card` / Panel body rhythm */}
      <section className="ls-card">
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
      </section>

      <div className="mt-8 flex flex-col gap-3 border-t border-[var(--ls-rule)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] px-4 text-sm font-semibold text-[var(--ls-ink-dim)] transition-colors hover:border-[var(--ls-glass-edge)] hover:text-[var(--ls-ink)]"
          onClick={() =>
            step === 1
              ? router.push('/admin/dashboard')
              : setStep((step - 1) as Step)
          }
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back
        </button>

        {step < 4 ? (
          <button
            type="button"
            className={cn(
              'ls-cta ls-cta--sm',
              !canProceed() && 'pointer-events-none opacity-45'
            )}
            onClick={() => setStep((step + 1) as Step)}
            disabled={!canProceed()}
            aria-disabled={!canProceed()}
            title={
              step === 1 && !canProceed()
                ? t('admin.dashboard.newProject.discovery.notesMinLengthHint', {
                    minWords: MIN_DISCOVERY_NOTE_WORDS,
                  })
                : undefined
            }
          >
            Continue
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              'ls-cta ls-cta--sm',
              (!canProceed() || submitting) && 'pointer-events-none opacity-45'
            )}
            onClick={submit}
            disabled={!canProceed() || submitting}
          >
            {submitting ? (
              <>
                Creating…
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin"
                  aria-hidden
                />
              </>
            ) : (
              <>
                Create project
                <Check className="h-4 w-4 shrink-0" aria-hidden />
              </>
            )}
          </button>
        )}
      </div>
    </TeamDashboardShell>
  );
}
