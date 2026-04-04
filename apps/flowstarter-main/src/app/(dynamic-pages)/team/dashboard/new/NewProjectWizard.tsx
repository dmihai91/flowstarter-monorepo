'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { useScaffoldForm } from '../components/scaffold/useScaffoldForm';
import { ScaffoldClientInfo } from '../components/scaffold/ScaffoldClientInfo';
import { ScaffoldInput } from '../components/scaffold/ScaffoldInput';
import { ScaffoldProgress } from '../components/scaffold/ScaffoldProgress';
import { ScaffoldClarify } from '../components/scaffold/ScaffoldClarify';
import { ScaffoldReview } from '../components/scaffold/ScaffoldReview';
import {
  mapRegistryTemplateToWizardTemplate,
  TemplateGallery,
  TemplatePicker,
  type WizardTemplate,
} from './TemplateGallery';
import { Button } from '@flowstarter/flow-design-system';
import { LogoStep } from './LogoStep';
import { IntegrationsStep } from './IntegrationsStep';
import { DomainStep } from './DomainStep';

// ── Brand tone options for personalization step ───────────────────────────────

const BRAND_TONES = [
  { id: 'professional', label: 'Professional', desc: 'Clean, corporate, trustworthy' },
  { id: 'bold', label: 'Bold', desc: 'Strong, confident, impactful' },
  { id: 'friendly', label: 'Friendly', desc: 'Warm, approachable, casual' },
  { id: 'warm', label: 'Warm', desc: 'Inviting, personal, comforting' },
  { id: 'energetic', label: 'Energetic', desc: 'Dynamic, vibrant, exciting' },
  { id: 'minimalist', label: 'Minimalist', desc: 'Simple, elegant, focused' },
] as const;

// ── Step config ────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Client & Brief', desc: 'Client info, industry, and AI brief' },
  { label: 'Review Brief', desc: 'Edit business details and goals' },
  { label: 'Pick Template', desc: 'Choose a site design for the client' },
  { label: 'Personalization', desc: 'Select brand tone for the project' },
  { label: 'Logo', desc: 'Upload or skip a logo' },
  { label: 'Integrations', desc: 'Calendly & Analytics setup' },
  { label: 'Domain', desc: 'Register a custom domain' },
  { label: 'Build', desc: 'Review summary and launch the build' },
];

function StepIndicator({
  current,
  reviewStep = 0,
  reviewStepCount = 0,
}: {
  current: number;
  reviewStep?: number;
  reviewStepCount?: number;
}) {
  const activeStep = STEPS[current];
  const isReviewPhase = current === 1 && reviewStepCount > 0;
  // During review, show sub-step X of Y as a suffix
  const descSuffix = isReviewPhase
    ? ` · ${reviewStep + 1} of ${reviewStepCount}`
    : '';
  const displayDesc = activeStep.desc + descSuffix;
  const REVIEW_STEPS = ['Business', 'Offer', 'Structure', 'Contact'];
  const reviewLabel = isReviewPhase
    ? REVIEW_STEPS[reviewStep] ?? activeStep.label
    : activeStep.label;
  return (
    <div className="w-full mb-6 rounded-[28px] border border-gray-200/60 bg-white/65 px-4 sm:px-6 py-4 sm:py-5 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
      {/* Mobile: compact progress */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--purple)] flex items-center justify-center text-xs font-bold text-white ring-4 ring-[var(--purple)]/20">
              {isReviewPhase ? reviewStep + 1 : current + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">
                {isReviewPhase ? reviewLabel : activeStep.label}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {displayDesc}
              </p>
            </div>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
            {isReviewPhase
              ? `${reviewStep + 1}/${reviewStepCount}`
              : `${current + 1}/${STEPS.length}`}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--purple)] rounded-full transition-all duration-500"
            style={{
              width: isReviewPhase
                ? `${((reviewStep + 1) / reviewStepCount) * 100}%`
                : `${((current + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Desktop: full step row */}
      <div className="hidden sm:flex items-start justify-between">
        {STEPS.map((step, i) => {
          const isActive = i === current;
          const isDone = i < current;
          const isLast = i === STEPS.length - 1;
          return (
            <div key={i} className="flex flex-1 items-start">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    isDone
                      ? 'bg-[var(--purple)] text-white'
                      : isActive
                      ? 'bg-[var(--purple)] text-white ring-4 ring-[var(--purple)]/20'
                      : 'bg-gray-100 text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-400'
                  }`}
                >
                  {isDone ? <Check className="h-5 w-5" /> : i + 1}
                </div>
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={`text-sm font-semibold leading-5 ${
                      isActive || isDone
                        ? 'text-zinc-900 dark:text-white'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`mt-0.5 text-xs leading-4 ${
                      isActive || isDone
                        ? 'text-zinc-500 dark:text-zinc-400'
                        : 'text-zinc-400 dark:text-zinc-600'
                    }`}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
              {!isLast && (
                <div
                  className={`mt-5 h-px flex-1 mx-3 transition-all duration-300 ${
                    isDone
                      ? 'bg-[var(--purple)]'
                      : 'bg-gray-200 dark:bg-white/[0.06]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Personalization step ──────────────────────────────────────────────────────

function PersonalizationStep({
  selectedTone,
  onSelect,
  onBack,
  onNext,
}: {
  selectedTone: string;
  onSelect: (tone: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
          Choose a brand tone
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          This sets the voice and feel of the site content.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BRAND_TONES.map((tone) => (
          <button
            key={tone.id}
            onClick={() => onSelect(tone.id)}
            className={`relative p-4 rounded-[20px] border text-left transition-all duration-200 ${
              selectedTone === tone.id
                ? 'border-[var(--purple)]/50 bg-[var(--purple)]/5 dark:bg-[var(--purple)]/10 ring-1 ring-[var(--purple)]/30'
                : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.06]'
            }`}
          >
            {selectedTone === tone.id && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--purple)] flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              {tone.label}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {tone.desc}
            </p>
          </button>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={onBack} variant="outline" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedTone}
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

// ── Build step (summary + launch) ────────────────────────────────────────────

function BuildStep({
  clientName,
  templateName,
  paletteName,
  fontName,
  brandTone,
  logoLabel,
  domainLabel,
  integrationsLabel,
  onBack,
  onLaunch,
  isLaunching,
}: {
  clientName: string;
  templateName: string;
  paletteName: string;
  fontName: string;
  brandTone: string;
  logoLabel: string;
  domainLabel: string;
  integrationsLabel: string;
  onBack: () => void;
  onLaunch: () => void;
  isLaunching: boolean;
}) {
  const rows = [
    { label: 'Client', value: clientName },
    { label: 'Template', value: templateName },
    { label: 'Palette', value: paletteName },
    { label: 'Font', value: fontName },
    { label: 'Brand Tone', value: brandTone },
    { label: 'Logo', value: logoLabel },
    { label: 'Domain', value: domainLabel },
    { label: 'Integrations', value: integrationsLabel },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
          Ready to build
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Review the summary below, then hand off to the editor.
        </p>
      </div>
      <div className="rounded-[20px] border border-gray-200/80 bg-white/95 p-5 space-y-3 dark:border-white/[0.06] dark:bg-white/[0.04]">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {row.label}
            </span>
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              {row.value || '—'}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button onClick={onBack} variant="outline" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button
          onClick={onLaunch}
          disabled={isLaunching}
          variant="accent"
          size="md"
          className="flex-1"
          icon={
            isLaunching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )
          }
        >
          {isLaunching ? 'Creating project...' : 'Build Site'}
        </Button>
      </div>
    </div>
  );
}

// ── Main wizard ────────────────────────────────────────────────────────────────

export function NewProjectWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLaunching, setIsLaunching] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<WizardTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Local state for the new combined step 1 fields
  const [industry, setIndustry] = useState('');
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [prompt, setPrompt] = useState('');

  const form = useScaffoldForm();

  // ── Draft persistence ────────────────────────────────────────────────────────
  const [draftId, setDraftId] = useState<string | null>(() =>
    searchParams.get('draft')
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraftMutation = useMutation({
    mutationFn: async (payload: {
      clientInfo: { name: string; email: string; phone: string };
      userInput?: string;
    }) => {
      const res = await fetch('/api/projects/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: draftId || undefined,
          projectConfig: {
            name:
              form.brief.projectName ||
              payload.clientInfo.name ||
              'Untitled Project',
            description: form.brief.summary || payload.userInput || '',
            currentStep: form.phase,
            clientInfo: payload.clientInfo,
            userInput: payload.userInput,
            businessInfo: {
              summary: form.brief.summary || payload.userInput || '',
              industry: form.brief.industry || industry || undefined,
            },
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to save draft');
      return res.json() as Promise<{ projectId?: string }>;
    },
    onSuccess: (data) => {
      if (data?.projectId && !draftId) setDraftId(data.projectId);
    },
    onError: (err) => {
      console.warn('[draft save]', err);
    },
  });

  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/local-templates');
        const data = (await response.json()) as {
          templates?: Array<{
            slug: string;
            name: string;
            description: string;
            category: string;
            palettes: WizardTemplate['palettes'];
            fonts: WizardTemplate['fonts'];
            defaultPaletteId?: string;
            defaultFontId?: string;
          }>;
        };

        if (!cancelled) {
          setTemplates(
            (data.templates ?? []).map(mapRegistryTemplateToWizardTemplate)
          );
        }
      } catch (error) {
        console.warn('[NewProjectWizard] Failed to load templates', error);
      } finally {
        if (!cancelled) {
          setTemplatesLoading(false);
        }
      }
    };

    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, []);



  useEffect(() => {
    if (!draftId) {
      return;
    }

    let cancelled = false;

    const loadDraft = async () => {
      try {
        const response = await fetch(
          `/api/projects/draft?projectId=${encodeURIComponent(draftId)}`
        );
        const payload = (await response.json()) as {
          draft?: {
            data?: string;
          } | null;
        };

        if (cancelled || !payload.draft?.data) {
          return;
        }

        const raw =
          typeof payload.draft.data === 'string'
            ? (JSON.parse(payload.draft.data) as Record<string, unknown>)
            : (payload.draft.data as unknown as Record<string, unknown>);

        form.hydrateDraft({
          currentStep: raw.currentStep as string | undefined,
          userInput: raw.userInput as string | undefined,
          clientInfo: raw.clientInfo as
            | { name?: string; email?: string; phone?: string }
            | undefined,
          businessInfo: raw.businessInfo as Record<string, unknown> | undefined,
          brandProfile: raw.brandProfile as Parameters<
            typeof form.hydrateDraft
          >[0]['brandProfile'],
          contactInfo: raw.contactInfo as Record<string, unknown> | undefined,
          template: raw.template as { id?: string } | undefined,
          palette: raw.palette as Parameters<
            typeof form.hydrateDraft
          >[0]['palette'],
          font: raw.font as Parameters<typeof form.hydrateDraft>[0]['font'],
        });

        if (typeof raw.industry === 'string' && raw.industry) {
          setIndustry(raw.industry);
        }
      } catch (error) {
        console.warn('[NewProjectWizard] Failed to hydrate draft', error);
      }
    };

    loadDraft();

    return () => {
      cancelled = true;
    };
  }, [draftId, form]);

  useEffect(() => {
    if (!form.selectedTemplateId || templates.length === 0) {
      return;
    }

    const selectedTemplate = templates.find(
      (template) => template.id === form.selectedTemplateId
    );
    if (!selectedTemplate) {
      return;
    }

    if (!form.selectedPalette) {
      const palette =
        selectedTemplate.palettes.find(
          (entry) => entry.id === selectedTemplate.defaultPaletteId
        ) || selectedTemplate.palettes[0];
      if (palette) {
        form.setSelectedPalette(palette);
      }
    }

    if (!form.selectedFont) {
      const font =
        selectedTemplate.fonts.find(
          (entry) => entry.id === selectedTemplate.defaultFontId
        ) || selectedTemplate.fonts[0];
      if (font) {
        form.setSelectedFont(font);
      }
    }
  }, [
    form,
    form.selectedFont,
    form.selectedPalette,
    form.selectedTemplateId,
    form.setSelectedFont,
    form.setSelectedPalette,
    templates,
  ]);

  // Sync draftId into URL so state survives page loads and redirects
  useEffect(() => {
    if (!draftId) return;
    const current = new URLSearchParams(window.location.search);
    if (current.get('draft') !== draftId) {
      const params = new URLSearchParams(current);
      params.set('draft', draftId);
      window.history.replaceState(
        null,
        '',
        `/team/dashboard/new?${params.toString()}`
      );
    }
  }, [draftId]);

  // Auto-save client info 800ms after last keystroke
  const scheduleSaveDraft = useCallback(
    (clientInfo: { name: string; email: string; phone: string }) => {
      if (!clientInfo.name && !clientInfo.email && !clientInfo.phone) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveDraftMutation.mutate({ clientInfo });
      }, 400);
    },
    [saveDraftMutation]
  );

  const stepIndex = (() => {
    switch (form.phase) {
      case 'client':
        return 0;
      case 'input':
      case 'progress':
      case 'clarify':
      case 'review':
        return 1;
      case 'template':
        return 2;
      case 'personalization':
        return 3;
      case 'logo':
        return 4;
      case 'integrations':
        return 5;
      case 'domain':
        return 6;
      case 'build':
        return 7;
      default:
        return 0;
    }
  })();

  const handleInitialStepSubmit = useCallback(() => {
    form.updateBrief('industry', industry);
    form.updateBrief('contactEmail', form.clientInfo.email);
    form.updateBrief('contactPhone', form.clientInfo.phone);

    // Persist client info to Supabase draft (best-effort, non-blocking)
    saveDraftMutation
      .mutateAsync({ clientInfo: form.clientInfo })
      .catch(() => {});

    if (mode === 'manual') {
      form.setPhase('review');
      return;
    }

    const description = [
      industry ? `Industry: ${industry}` : '',
      `Client: ${form.clientInfo.name}`,
      form.clientInfo.email ? `Client email: ${form.clientInfo.email}` : '',
      form.clientInfo.phone ? `Client phone: ${form.clientInfo.phone}` : '',
      `Project brief: ${prompt.trim()}`,
    ]
      .filter(Boolean)
      .join('\n');

    form.submitDescription(description);
  }, [form, industry, mode, prompt, saveDraftMutation]);

  const handleLaunch = useCallback(async () => {
    setIsLaunching(true);
    setLaunchError(null);

    try {
      const res = await fetch('/api/editor/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectConfig: {
            name: form.brief.projectName,
            projectName: form.brief.projectName,
            description: form.brief.summary,
            industry: form.brief.industry,
            clientName: form.clientInfo.name,
            clientEmail: form.clientInfo.email,
            clientPhone: form.clientInfo.phone,
            templateId: form.selectedTemplateId ?? undefined,
            planName: form.planName,
            totalFee: form.setupFee,
            depositAmount: Math.round(form.setupFee * 0.5),
            finalAmount: form.setupFee - Math.round(form.setupFee * 0.5),
            businessInfo: {
              summary: form.brief.summary,
              valueProposition: form.brief.valueProposition,
              targetAudience: form.brief.targetAudience,
              industry: form.brief.industry,
              goals: form.brief.goals,
              offerType: form.brief.offerType,
              brandTone: form.brief.brandTone,
              offerings: form.brief.offerings,
              desiredCustomerAction: form.brief.desiredCustomerAction,
              differentiators: form.brief.differentiators,
              trustSignals: form.brief.trustSignals,
              contentStylePreference: form.brief.contentStylePreference,
            },
            brandProfile: {
              brandTone: {
                primary: form.brief.brandTone,
                secondary: form.brief.brandSecondaryTones,
                notes: form.brief.brandNotes || undefined,
              },
              valueProposition:
                form.brief.valuePropositionDetail ||
                form.brief.valueProposition,
              primaryGoal: form.brief.primaryGoal || form.brief.goals[0],
              desiredCustomerAction: form.brief.desiredCustomerAction,
              differentiators: form.brief.differentiators,
              trustSignals: form.brief.trustSignals,
              contentStylePreference: form.brief.contentStylePreference,
              operatorNotes: form.brief.brandNotes || undefined,
            },
            contactInfo: {
              email: form.brief.contactEmail,
              phone: form.brief.contactPhone,
              address: form.brief.contactAddress,
            },
            siteInfo: {
              pagePreference: form.brief.pagePreference,
              integrations: form.brief.integrations,
            },
            palette: form.selectedPalette,
            font: form.selectedFont,
            logo: form.selectedLogo ?? undefined,
            integrations: form.selectedIntegrations ?? undefined,
            selectedDomain: form.selectedDomain ?? undefined,
          },
          mode: 'interactive',
        }),
      });

      if (!res.ok) throw new Error('Failed to create project');
      const { token, projectId, editorUrl } = (await res.json()) as {
        token: string;
        projectId: string;
        editorUrl: string;
      };

      if (form.setupFee > 0) {
        fetch('/api/projects/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, type: 'deposit' }),
        }).catch((invoiceErr) => {
          console.warn(
            '[handleLaunch] Deposit invoice failed (non-fatal):',
            invoiceErr
          );
        });
      }

      const EDITOR_URL =
        process.env.NEXT_PUBLIC_EDITOR_URL ?? 'https://editor.flowstarter.dev';
      window.open(editorUrl || `${EDITOR_URL}?handoff=${token}`, '_blank');
      router.push('/team/dashboard');
    } catch (err) {
      setLaunchError(
        err instanceof Error ? err.message : 'Something went wrong'
      );
    } finally {
      setIsLaunching(false);
    }
  }, [form, router]);

  const selectedTemplate =
    templates.find((template) => template.id === form.selectedTemplateId) ||
    null;

  return (
    <div className="py-4 sm:py-8 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Step indicator — hide during progress/clarify */}
        {!['progress', 'clarify'].includes(form.phase) && (
          <StepIndicator
            current={stepIndex}
            reviewStep={form.reviewStep}
            reviewStepCount={form.reviewStepCount}
          />
        )}

        {/* Content card */}
        <div className="rounded-[28px] sm:rounded-[36px] border border-gray-200/60 bg-white/70 px-4 py-6 sm:px-10 sm:py-10 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:shadow-[0_24px_64px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          {form.phase === 'client' && (
            <ScaffoldClientInfo
              clientInfo={form.clientInfo}
              onUpdate={(field, value) => {
                form.updateClientInfo(field, value);
                scheduleSaveDraft({ ...form.clientInfo, [field]: value });
              }}
              onSubmit={handleInitialStepSubmit}
              onCollapse={() => {}}
              industry={industry}
              onIndustryChange={setIndustry}
              mode={mode}
              onModeChange={setMode}
              prompt={prompt}
              onPromptChange={setPrompt}
            />
          )}

          {form.phase === 'input' && (
            <ScaffoldInput
              onSubmit={form.submitDescription}
              onCollapse={() => form.reset()}
              isEnriching={form.isEnriching}
            />
          )}

          {form.phase === 'progress' && (
            <ScaffoldProgress steps={form.aiSteps} />
          )}

          {form.phase === 'clarify' && (
            <ScaffoldClarify
              questions={form.followUpQuestions}
              answers={form.clarifyAnswers}
              onUpdateAnswer={form.updateClarifyAnswer}
              onSubmit={form.submitClarification}
              onReset={form.reset}
            />
          )}

          {form.phase === 'review' && (
            <ScaffoldReview
              brief={form.brief}
              reviewStep={form.reviewStep}
              reviewStepCount={form.reviewStepCount}
              isFirstStep={form.isFirstStep}
              isLastStep={form.isLastStep}
              onUpdateBrief={form.updateBrief}
              onToggleGoal={form.toggleGoal}
              onToggleIntegration={form.toggleIntegration}
              onNext={form.isLastStep ? form.proceedToTemplate : form.nextStep}
              onPrev={form.prevStep}
              onBackToInput={form.backToInput}
              onRegenerate={form.regenerate}
              onReset={form.reset}
            />
          )}

          {form.phase === 'template' && (
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                  Choose a template, palette, and font
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {form.templateRecommendations.length > 0
                    ? 'AI picked these based on your brief. Confirm the template and brand direction before launch.'
                    : 'Browse and select a template, then choose the palette and font for this project.'}
                </p>
              </div>
              <TemplatePicker
                templates={templates}
                selectedId={form.selectedTemplateId}
                recommendedIds={form.templateRecommendations}
                recommendedReasons={form.templateReasons}
                onSelect={(templateId) => {
                  form.setSelectedTemplateId(templateId);
                  form.setSelectedPalette(null);
                  form.setSelectedFont(null);
                }}
                onBrowseAll={() => setGalleryOpen(true)}
              />
              {templatesLoading ? (
                <div className="rounded-2xl border border-gray-200/70 bg-gray-50/70 px-4 py-3 text-sm text-zinc-500 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-zinc-400">
                  Loading templates...
                </div>
              ) : null}
              {selectedTemplate ? (
                <div className="grid gap-4 rounded-[28px] border border-gray-200/70 bg-white/80 p-5 dark:border-white/[0.06] dark:bg-white/[0.04] md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Palette variants
                      </h4>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Show these during the onboarding call and lock the
                        preferred direction before handoff.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {selectedTemplate.palettes.map((palette) => (
                        <button
                          key={palette.id}
                          type="button"
                          onClick={() => form.setSelectedPalette(palette)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-all ${
                            form.selectedPalette?.id === palette.id
                              ? 'border-[var(--purple)]/50 bg-[var(--purple)]/8'
                              : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">
                              {palette.name}
                            </p>
                            <p className="mt-1 text-[0.7rem] text-zinc-500 dark:text-zinc-400">
                              {palette.id}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {Object.values(palette.colors).map(
                              (color, index) => (
                                <span
                                  key={`${palette.id}-${index}`}
                                  className="h-4 w-4 rounded-full border border-black/10"
                                  style={{ backgroundColor: String(color) }}
                                />
                              )
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Font variants
                      </h4>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Pick the font pairing that matches the client’s tone and
                        positioning.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {selectedTemplate.fonts.map((font) => (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => form.setSelectedFont(font)}
                          className={`w-full rounded-2xl border px-3 py-3 text-left transition-all ${
                            form.selectedFont?.id === font.id
                              ? 'border-[var(--purple)]/50 bg-[var(--purple)]/8'
                              : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]'
                          }`}
                        >
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {font.name}
                          </p>
                          <p className="mt-1 text-[0.75rem] text-zinc-500 dark:text-zinc-400">
                            Heading: {font.heading.family}
                          </p>
                          <p className="text-[0.75rem] text-zinc-500 dark:text-zinc-400">
                            Body: {font.body.family}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => form.setPhase('review')}
                  variant="outline"
                  size="md"
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <Button
                  onClick={form.proceedToPersonalization}
                  disabled={
                    !form.selectedTemplateId ||
                    !form.selectedPalette ||
                    !form.selectedFont
                  }
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
          )}

          {form.phase === 'personalization' && (
            <PersonalizationStep
              selectedTone={form.brief.brandTone}
              onSelect={(tone) => form.updateBrief('brandTone', tone as import('../components/scaffold/useScaffoldForm').BrandTone)}
              onBack={() => form.setPhase('template')}
              onNext={form.proceedToLogo}
            />
          )}

          {form.phase === 'logo' && (
            <LogoStep
              onLogoSelected={(logo) => {
                form.setSelectedLogo(logo);
                form.proceedToIntegrations();
              }}
              onSkip={() => {
                form.setSelectedLogo({ type: 'none' });
                form.proceedToIntegrations();
              }}
              onBack={() => form.setPhase('personalization')}
            />
          )}

          {form.phase === 'integrations' && (
            <IntegrationsStep
              onComplete={(integrations) => {
                form.setSelectedIntegrations(integrations);
                form.proceedToDomain();
              }}
              onBack={() => form.setPhase('logo')}
            />
          )}

          {form.phase === 'domain' && (
            <DomainStep
              projectName={form.brief.projectName}
              clientName={form.clientInfo.name}
              onDomainSelected={(domain) => {
                form.setSelectedDomain(domain);
                form.proceedToBuild();
              }}
              onBack={() => form.setPhase('integrations')}
            />
          )}

          {form.phase === 'build' && (
            <BuildStep
              clientName={form.clientInfo.name}
              templateName={selectedTemplate?.name ?? form.selectedTemplateId ?? ''}
              paletteName={form.selectedPalette?.name ?? ''}
              fontName={form.selectedFont?.name ?? ''}
              brandTone={form.brief.brandTone}
              logoLabel={
                form.selectedLogo?.type === 'uploaded'
                  ? form.selectedLogo.name ?? 'Uploaded'
                  : form.selectedLogo?.type === 'text'
                  ? 'Text logo'
                  : 'None'
              }
              domainLabel={form.selectedDomain ?? 'None'}
              integrationsLabel={[
                form.selectedIntegrations?.calendly?.enabled ? 'Calendly' : '',
                form.selectedIntegrations?.googleAnalytics?.enabled ? 'GA4' : '',
              ].filter(Boolean).join(', ') || 'None'}
              onBack={() => form.setPhase('domain')}
              onLaunch={handleLaunch}
              isLaunching={isLaunching}
            />
          )}

          {launchError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-4 py-3">
              {launchError}
            </p>
          )}
        </div>
      </div>

      {galleryOpen && (
        <TemplateGallery
          templates={templates}
          selectedId={form.selectedTemplateId}
          recommendedIds={form.templateRecommendations}
          recommendedReasons={form.templateReasons}
          onSelect={(templateId) => {
            form.setSelectedTemplateId(templateId);
            form.setSelectedPalette(null);
            form.setSelectedFont(null);
          }}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}
