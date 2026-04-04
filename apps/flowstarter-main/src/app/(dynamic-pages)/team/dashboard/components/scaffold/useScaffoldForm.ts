'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import type { EngineArtifacts } from '@/lib/engine/contracts';

const EDITOR_URL =
  process.env.NEXT_PUBLIC_EDITOR_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://editor.flowstarter.dev'
    : 'http://localhost:5173');

export type ScaffoldPhase =
  | 'client'
  | 'input'
  | 'progress'
  | 'clarify'
  | 'review'
  | 'template'
  | 'personalization'
  | 'logo'
  | 'integrations'
  | 'domain'
  | 'payment'
  | 'build';

export interface SelectedLogo {
  type: 'uploaded' | 'text' | 'none';
  url?: string;
  name?: string;
}

export interface IntegrationsConfig {
  calendly?: { enabled: boolean; url: string };
  googleAnalytics?: { enabled: boolean; measurementId: string };
  // Growth plan only
  mailchimp?: { enabled: boolean; audienceId: string; apiKey: string };
  stripe?: { enabled: boolean; publishableKey: string; priceId?: string };
}

// ── Enums (mirrors editor-engine contracts) ────────────────────────────────────

export type ProjectGoal =
  | 'leads'
  | 'bookings'
  | 'sales'
  | 'newsletter'
  | 'awareness';
export type OfferType = 'premium' | 'accessible' | 'free' | 'custom';
export type BrandTone =
  | 'professional'
  | 'warm'
  | 'premium'
  | 'playful'
  | 'minimalist'
  | 'bold'
  | 'calming'
  | 'trustworthy'
  | 'energetic'
  | 'modern';
export type PagePref = 'single-page' | 'multi-page';
export type Integration =
  | 'booking'
  | 'newsletter'
  | 'analytics'
  | 'leadCapture';

export interface TemplatePalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export interface TemplateFont {
  id: string;
  name: string;
  heading: {
    family: string;
    weight?: number;
  };
  body: {
    family: string;
    weight?: number;
  };
}

export interface BrandProfile {
  brandTone: {
    primary: BrandTone;
    secondary?: BrandTone[];
    notes?: string;
  };
  valueProposition?: string;
  primaryGoal?: string;
  desiredCustomerAction?: string;
  differentiators?: string[];
  trustSignals?: string[];
  contentStylePreference?: string;
  operatorNotes?: string;
}

// ── Draft type — all fields editable, matches ProjectBrief structure ──────────

export interface ProjectBriefDraft {
  // Section 1 — Business
  projectName: string;
  industry: string;
  summary: string;
  targetAudience: string;
  // Section 2 — Offer
  valueProposition: string;
  offerings: string[]; // shown as comma-joined textarea
  goals: ProjectGoal[];
  offerType: OfferType;
  brandTone: BrandTone;
  // Section 3 — Structure
  pagePreference: PagePref;
  integrations: Integration[];
  // Section 4 — Contact
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  valuePropositionDetail: string;
  primaryGoal: string;
  desiredCustomerAction: string;
  differentiators: string[];
  trustSignals: string[];
  contentStylePreference: string;
  brandSecondaryTones: BrandTone[];
  brandNotes: string;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
}

export interface AiStep {
  label: string;
  done: boolean;
}

type ConciergeResponse =
  | { status: 'needsMoreInfo'; followUpQuestions: string[] }
  | ({ status: 'complete' } & EngineArtifacts);

// ── Defaults ──────────────────────────────────────────────────────────────────

const EMPTY_CLIENT: ClientInfo = { name: '', email: '', phone: '' };

const EMPTY_BRIEF: ProjectBriefDraft = {
  projectName: '',
  industry: '',
  summary: '',
  targetAudience: '',
  valueProposition: '',
  offerings: [],
  goals: [],
  offerType: 'accessible',
  brandTone: 'professional',
  pagePreference: 'multi-page',
  integrations: [],
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  valuePropositionDetail: '',
  primaryGoal: '',
  desiredCustomerAction: '',
  differentiators: [],
  trustSignals: [],
  contentStylePreference: '',
  brandSecondaryTones: [],
  brandNotes: '',
};

const REVIEW_STEP_COUNT = 4;

// ── Helpers ───────────────────────────────────────────────────────────────────

function briefFromEngine(
  brief: EngineArtifacts['projectBrief']
): ProjectBriefDraft {
  const goal = brief.goal as ProjectGoal | undefined;
  return {
    projectName: brief.siteName || '',
    industry: brief.industry || '',
    summary: brief.summary || '',
    targetAudience: brief.targetAudience || '',
    valueProposition: brief.usp || '',
    offerings: brief.offerings || [],
    goals: goal ? [goal] : [],
    offerType: (brief.offerType as OfferType) || 'accessible',
    brandTone: (brief.brandTone as BrandTone) || 'professional',
    pagePreference: 'multi-page',
    integrations: [],
    contactEmail: brief.contact.email || '',
    contactPhone: brief.contact.phone || '',
    contactAddress: brief.contact.address || '',
    valuePropositionDetail: '',
    primaryGoal: '',
    desiredCustomerAction: '',
    differentiators: [],
    trustSignals: [],
    contentStylePreference: '',
    brandSecondaryTones: [],
    brandNotes: '',
  };
}

function toBrandProfile(brief: ProjectBriefDraft): BrandProfile {
  return {
    brandTone: {
      primary: brief.brandTone,
      secondary:
        brief.brandSecondaryTones.length > 0
          ? brief.brandSecondaryTones
          : undefined,
      notes: brief.brandNotes || undefined,
    },
    valueProposition:
      brief.valuePropositionDetail || brief.valueProposition || undefined,
    primaryGoal: brief.primaryGoal || brief.goals[0] || undefined,
    desiredCustomerAction: brief.desiredCustomerAction || undefined,
    differentiators:
      brief.differentiators.length > 0 ? brief.differentiators : undefined,
    trustSignals:
      brief.trustSignals.length > 0 ? brief.trustSignals : undefined,
    contentStylePreference: brief.contentStylePreference || undefined,
    operatorNotes: brief.brandNotes || undefined,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useScaffoldForm() {
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<ScaffoldPhase>('client');
  const [clientInfo, setClientInfo] = useState<ClientInfo>(EMPTY_CLIENT);
  const [userInput, setUserInput] = useState('');
  const [brief, setBrief] = useState<ProjectBriefDraft>(EMPTY_BRIEF);
  const [reviewStep, setReviewStepState] = useState(0);
  const reviewStepRef = useRef(0);
  const setReviewStep = useCallback((val: number | ((s: number) => number)) => {
    setReviewStepState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      reviewStepRef.current = next;
      return next;
    });
  }, []);
  const [aiSteps, setAiSteps] = useState<AiStep[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [clarifyAnswers, setClarifyAnswers] = useState<string[]>([]);
  const [engineArtifacts, setEngineArtifacts] =
    useState<EngineArtifacts | null>(null);

  // Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [selectedPalette, setSelectedPalette] =
    useState<TemplatePalette | null>(null);
  const [selectedFont, setSelectedFont] = useState<TemplateFont | null>(null);
  const [templateRecommendations, setTemplateRecommendations] = useState<
    string[]
  >([]);
  const [templateReasons, setTemplateReasons] = useState<
    Record<string, string>
  >({});

  // Logo & Integrations
  const [selectedLogo, setSelectedLogo] = useState<SelectedLogo | null>(null);
  const [selectedIntegrations, setSelectedIntegrations] =
    useState<IntegrationsConfig | null>(null);

  // Domain
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Payment
  const [planName, setPlanName] = useState<string>('STARTER');
  const [setupFee, setSetupFee] = useState<number>(0);

  // ── AI enrichment mutation ─────────────────────────────────────────────────
  const enrichMutation = useMutation({
    mutationFn: async ({ description }: { description: string }) => {
      const res = await fetch('/api/engine/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          client: {
            name: clientInfo.name || undefined,
            email: clientInfo.email || undefined,
            phone: clientInfo.phone || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error('Enrichment failed');
      return res.json() as Promise<ConciergeResponse>;
    },
  });

  // ── Animate progress steps ─────────────────────────────────────────────────
  const animateProgress = useCallback(async (labels?: string[]) => {
    const stepLabels = labels ?? [
      'Reading business description...',
      'Identifying industry & audience...',
      'Crafting value proposition...',
      'Generating project brief...',
    ];
    const steps: AiStep[] = stepLabels.map((label) => ({ label, done: false }));
    setAiSteps(steps);
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      setAiSteps((prev) =>
        prev.map((s, j) => (j <= i ? { ...s, done: true } : s))
      );
    }
  }, []);

  // ── Handle enrichment response ─────────────────────────────────────────────
  const handleEnrichResponse = useCallback(
    async (enriched: ConciergeResponse, _originalDesc: string) => {
      setAiSteps((prev) => prev.map((s) => ({ ...s, done: true })));
      await new Promise((r) => setTimeout(r, 300));

      if (enriched.status === 'needsMoreInfo') {
        setFollowUpQuestions(enriched.followUpQuestions);
        setClarifyAnswers(enriched.followUpQuestions.map(() => ''));
        setAiSteps([]);
        setPhase('clarify');
        return;
      }

      setEngineArtifacts({
        projectBrief: enriched.projectBrief,
        templateSelection: enriched.templateSelection,
        assemblySpec: enriched.assemblySpec,
        contentMap: enriched.contentMap,
        validationReport: enriched.validationReport,
      });

      setBrief(briefFromEngine(enriched.projectBrief));
      setReviewStep(0);

      // Extract template recommendations
      if (enriched.templateSelection) {
        const recs: string[] = [];
        const reasons: Record<string, string> = {};
        const sel = enriched.templateSelection;
        if (sel.selectedTemplateId) {
          recs.push(sel.selectedTemplateId);
          reasons[sel.selectedTemplateId] =
            sel.reasons?.[0] ?? 'Best match for your business';
        }
        for (const alt of (sel.alternatives ?? []).slice(0, 2)) {
          if (alt.templateId && !recs.includes(alt.templateId)) {
            recs.push(alt.templateId);
            reasons[alt.templateId] = alt.reasons?.[0] ?? '';
          }
        }
        setTemplateRecommendations(recs);
        setTemplateReasons(reasons);
        if (!selectedTemplateId && recs[0]) setSelectedTemplateId(recs[0]);
      }

      setPhase('review');
      setAiSteps([]);
    },
    [selectedTemplateId]
  );

  // ── Submit description ─────────────────────────────────────────────────────
  const submitDescription = useCallback(
    (description: string) => {
      if (!description.trim()) return;
      setUserInput(description);
      setPhase('progress');
      animateProgress();
      enrichMutation.mutate(
        { description },
        {
          onSuccess: (enriched) => handleEnrichResponse(enriched, description),
          onError: () => {
            setAiSteps([]);
            launchEditor({ description });
          },
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enrichMutation, animateProgress, handleEnrichResponse]
  );

  // ── Submit clarification ───────────────────────────────────────────────────
  const submitClarification = useCallback(() => {
    const combined = [
      userInput,
      ...followUpQuestions
        .map((q, i) =>
          clarifyAnswers[i]?.trim() ? `${q} ${clarifyAnswers[i]}` : ''
        )
        .filter(Boolean),
    ].join('\n');
    setUserInput(combined);
    setPhase('progress');
    animateProgress();
    enrichMutation.mutate(
      { description: combined },
      {
        onSuccess: (enriched) => handleEnrichResponse(enriched, combined),
        onError: () => {
          setAiSteps([]);
          launchEditor({ description: combined });
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userInput,
    followUpQuestions,
    clarifyAnswers,
    enrichMutation,
    animateProgress,
    handleEnrichResponse,
  ]);

  const updateClarifyAnswer = useCallback((index: number, value: string) => {
    setClarifyAnswers((prev) => {
      const n = [...prev];
      n[index] = value;
      return n;
    });
  }, []);

  // ── Regenerate ────────────────────────────────────────────────────────────
  const regenerate = useCallback(() => {
    if (!userInput.trim()) return;
    setPhase('progress');
    animateProgress();
    enrichMutation.mutate(
      { description: userInput },
      {
        onSuccess: async (enriched) => {
          setAiSteps((prev) => prev.map((s) => ({ ...s, done: true })));
          await new Promise((r) => setTimeout(r, 300));
          if (enriched.status === 'needsMoreInfo') {
            setAiSteps([]);
            setPhase('review');
            return;
          }
          setEngineArtifacts({
            projectBrief: enriched.projectBrief,
            templateSelection: enriched.templateSelection,
            assemblySpec: enriched.assemblySpec,
            contentMap: enriched.contentMap,
            validationReport: enriched.validationReport,
          });
          setBrief((prev) => ({
            ...briefFromEngine(enriched.projectBrief),
            // Preserve operator-entered contact if already set
            contactEmail:
              prev.contactEmail ||
              briefFromEngine(enriched.projectBrief).contactEmail,
            contactPhone:
              prev.contactPhone ||
              briefFromEngine(enriched.projectBrief).contactPhone,
            contactAddress:
              prev.contactAddress ||
              briefFromEngine(enriched.projectBrief).contactAddress,
          }));
          setPhase('review');
          setAiSteps([]);
        },
        onError: () => {
          setAiSteps([]);
          setPhase('review');
        },
      }
    );
  }, [userInput, enrichMutation, animateProgress]);

  // ── Brief field updates ────────────────────────────────────────────────────
  const updateBrief = useCallback(
    <K extends keyof ProjectBriefDraft>(
      key: K,
      value: ProjectBriefDraft[K]
    ) => {
      setBrief((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Toggle helpers for array fields
  const toggleGoal = useCallback((goal: ProjectGoal) => {
    setBrief((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  }, []);

  const toggleIntegration = useCallback((integration: Integration) => {
    setBrief((prev) => ({
      ...prev,
      integrations: prev.integrations.includes(integration)
        ? prev.integrations.filter((i) => i !== integration)
        : [...prev.integrations, integration],
    }));
  }, []);

  // ── AI field rewrite ───────────────────────────────────────────────────────
  const [rewritingField, setRewritingField] = useState<
    keyof ProjectBriefDraft | null
  >(null);

  const rewriteFieldMutation = useMutation({
    mutationFn: async (params: {
      key: keyof ProjectBriefDraft;
      action: string;
      customPrompt?: string;
    }) => {
      const value = brief[params.key];
      const strValue = Array.isArray(value)
        ? (value as string[]).join(', ')
        : String(value ?? '');
      const res = await fetch('/api/ai/rewrite-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: strValue,
          action: params.action,
          fieldName: params.key,
          businessContext: brief.summary,
          customPrompt: params.customPrompt,
        }),
      });
      if (!res.ok) throw new Error('Rewrite failed');
      return res.json();
    },
  });

  const rewriteField = useCallback(
    (key: keyof ProjectBriefDraft, action: string, customPrompt?: string) => {
      const v = brief[key];
      const strV = Array.isArray(v)
        ? (v as string[]).join(', ')
        : String(v ?? '');
      if (!strV.trim()) return;
      setRewritingField(key);
      rewriteFieldMutation.mutate(
        { key, action, customPrompt },
        {
          onSuccess: (data) => {
            if (data.rewritten)
              setBrief((prev) => ({ ...prev, [key]: data.rewritten }));
            setRewritingField(null);
          },
          onError: () => setRewritingField(null),
        }
      );
    },
    [brief, rewriteFieldMutation]
  );

  // ── Phase transitions ──────────────────────────────────────────────────────
  const proceedToTemplate = useCallback(() => setPhase('template'), []);

  // Safe review next — reads current step from ref (always fresh), no stale closure
  const reviewNext = useCallback(() => {
    const current = reviewStepRef.current;
    if (current >= REVIEW_STEP_COUNT - 1) {
      setPhase('template');
    } else {
      setReviewStep(current + 1);
    }
  }, []);
  const proceedToPersonalization = useCallback(
    () => setPhase('personalization'),
    []
  );
  const proceedToLogo = useCallback(() => setPhase('logo'), []);
  const proceedToIntegrations = useCallback(
    () => setPhase('integrations'),
    []
  );

  const proceedToBuild = useCallback(() => setPhase('build'), []);

  // ── Review navigation ──────────────────────────────────────────────────────
  const nextStep = useCallback(
    () => setReviewStep((s) => Math.min(s + 1, REVIEW_STEP_COUNT - 1)),
    []
  );
  const prevStep = useCallback(
    () => setReviewStep((s) => Math.max(s - 1, 0)),
    []
  );
  const isLastStep = reviewStep === REVIEW_STEP_COUNT - 1;
  const isFirstStep = reviewStep === 0;

  // ── Handoff / launch ───────────────────────────────────────────────────────
  const handoffMutation = useMutation({
    mutationFn: async (config?: Record<string, unknown>) => {
      const projectConfig = config ?? {
        name: brief.projectName,
        projectName: brief.projectName,
        description: brief.summary,
        userDescription: userInput,
        industry: brief.industry,
        templateId: selectedTemplateId ?? undefined,
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        clientPhone: clientInfo.phone,
        businessInfo: {
          summary: brief.summary,
          industry: brief.industry,
          targetAudience: brief.targetAudience,
          valueProposition: brief.valueProposition,
          offerings: brief.offerings,
          goals: brief.goals,
          offerType: brief.offerType,
          brandTone: brief.brandTone,
          desiredCustomerAction: brief.desiredCustomerAction,
          differentiators: brief.differentiators,
          trustSignals: brief.trustSignals,
          contentStylePreference: brief.contentStylePreference,
        },
        brandProfile: toBrandProfile(brief),
        siteInfo: {
          pagePreference: brief.pagePreference,
          integrations: brief.integrations,
        },
        contactInfo: {
          email: brief.contactEmail,
          phone: brief.contactPhone,
          address: brief.contactAddress,
        },
        flowstarterEngine: engineArtifacts ?? undefined,
        template: selectedTemplateId
          ? { id: selectedTemplateId }
          : engineArtifacts
          ? {
              id: engineArtifacts.templateSelection.selectedTemplateId,
              name: engineArtifacts.templateSelection.selectedTemplateName,
            }
          : undefined,
        palette: selectedPalette ?? undefined,
        font: selectedFont ?? undefined,
        logo: selectedLogo ?? undefined,
        integrations: selectedIntegrations ?? undefined,
      };

      const res = await fetch('/api/editor/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectConfig, mode: 'interactive' }),
      });
      if (!res.ok) throw new Error('Handoff failed');
      return res.json() as Promise<{
        editorUrl: string;
        token: string;
        projectId: string;
      }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      reset();
      window.open(
        data.editorUrl || `${EDITOR_URL}?handoff=${data.token}`,
        '_blank'
      );
    },
    onError: () => {
      window.open(EDITOR_URL, '_blank');
    },
  });

  const launchEditor = useCallback(
    (config?: Record<string, unknown>) => {
      handoffMutation.mutate(config);
    },
    [handoffMutation]
  );

  // ── Client info ────────────────────────────────────────────────────────────
  const updateClientInfo = useCallback(
    (key: keyof ClientInfo, value: string) => {
      setClientInfo((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const submitClientInfo = useCallback(() => setPhase('input'), []);
  const backToInput = useCallback(() => setPhase('input'), []);

  const hydrateDraft = useCallback(
    (draft: {
      clientInfo?: Partial<ClientInfo>;
      userInput?: string;
      currentStep?: string;
      businessInfo?: Record<string, unknown>;
      brandProfile?: BrandProfile;
      contactInfo?: Record<string, unknown>;
      template?: { id?: string };
      palette?: TemplatePalette;
      font?: TemplateFont;
    }) => {
      if (draft.clientInfo) {
        setClientInfo((prev) => ({
          ...prev,
          name: draft.clientInfo?.name || prev.name,
          email: draft.clientInfo?.email || prev.email,
          phone: draft.clientInfo?.phone || prev.phone,
        }));
      }

      if (typeof draft.userInput === 'string') {
        setUserInput(draft.userInput);
      }

      const businessInfo = draft.businessInfo ?? {};
      const brandProfile = draft.brandProfile;
      const contactInfo = draft.contactInfo ?? {};

      setBrief((prev) => ({
        ...prev,
        projectName:
          (businessInfo.projectName as string | undefined) || prev.projectName,
        industry:
          (businessInfo.industry as string | undefined) || prev.industry,
        summary:
          (businessInfo.summary as string | undefined) ||
          (businessInfo.description as string | undefined) ||
          prev.summary,
        targetAudience:
          (businessInfo.targetAudience as string | undefined) ||
          prev.targetAudience,
        valueProposition:
          (businessInfo.valueProposition as string | undefined) ||
          prev.valueProposition,
        offerings: Array.isArray(businessInfo.offerings)
          ? (businessInfo.offerings as string[])
          : prev.offerings,
        goals: Array.isArray(businessInfo.goals)
          ? (businessInfo.goals as ProjectGoal[])
          : prev.goals,
        offerType:
          (businessInfo.offerType as OfferType | undefined) || prev.offerType,
        brandTone:
          brandProfile?.brandTone.primary ||
          (businessInfo.brandTone as BrandTone | undefined) ||
          prev.brandTone,
        contactEmail:
          (contactInfo.email as string | undefined) || prev.contactEmail,
        contactPhone:
          (contactInfo.phone as string | undefined) || prev.contactPhone,
        contactAddress:
          (contactInfo.address as string | undefined) || prev.contactAddress,
        valuePropositionDetail:
          brandProfile?.valueProposition || prev.valuePropositionDetail,
        primaryGoal: brandProfile?.primaryGoal || prev.primaryGoal,
        desiredCustomerAction:
          brandProfile?.desiredCustomerAction ||
          (businessInfo.desiredCustomerAction as string | undefined) ||
          prev.desiredCustomerAction,
        differentiators:
          brandProfile?.differentiators ||
          (Array.isArray(businessInfo.differentiators)
            ? (businessInfo.differentiators as string[])
            : prev.differentiators),
        trustSignals:
          brandProfile?.trustSignals ||
          (Array.isArray(businessInfo.trustSignals)
            ? (businessInfo.trustSignals as string[])
            : prev.trustSignals),
        contentStylePreference:
          brandProfile?.contentStylePreference ||
          (businessInfo.contentStylePreference as string | undefined) ||
          prev.contentStylePreference,
        brandSecondaryTones:
          brandProfile?.brandTone.secondary || prev.brandSecondaryTones,
        brandNotes:
          brandProfile?.operatorNotes ||
          brandProfile?.brandTone.notes ||
          prev.brandNotes,
      }));

      if (draft.template?.id) {
        setSelectedTemplateId(draft.template.id);
      }
      if (draft.palette) {
        setSelectedPalette(draft.palette);
      }
      if (draft.font) {
        setSelectedFont(draft.font);
      }

      switch (draft.currentStep) {
        case 'template':
        case 'personalization':
        case 'logo':
        case 'integrations':
        case 'build':
        case 'review':
        case 'input':
        case 'client':
          setPhase(draft.currentStep);
          break;
        case 'payment':
          setPhase('build');
          break;
        default:
          if (draft.template?.id) {
            setPhase('template');
          } else if (businessInfo.summary || businessInfo.description) {
            setPhase('review');
          } else if (draft.clientInfo?.name || draft.clientInfo?.email) {
            setPhase('client');
          }
      }
    },
    []
  );

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setPhase('client');
    setClientInfo(EMPTY_CLIENT);
    setBrief(EMPTY_BRIEF);
    setUserInput('');
    setReviewStep(0);
    setAiSteps([]);
    setFollowUpQuestions([]);
    setClarifyAnswers([]);
    setEngineArtifacts(null);
    setSelectedTemplateId(null);
    setSelectedPalette(null);
    setSelectedFont(null);
    setSelectedLogo(null);
    setSelectedIntegrations(null);
    setSelectedDomain(null);
    setTemplateRecommendations([]);
    setTemplateReasons({});
    setPlanName('STARTER');
    setSetupFee(0);
  }, []);

  return {
    // State
    phase,
    setPhase,
    clientInfo,
    userInput,
    brief,
    reviewStep,
    aiSteps,
    followUpQuestions,
    clarifyAnswers,
    isEnriching: enrichMutation.isPending,
    rewritingField,
    // Review navigation
    nextStep,
    prevStep,
    isFirstStep,
    backToInput,
    isLastStep,
    reviewStepCount: REVIEW_STEP_COUNT,
    // Actions
    submitClientInfo,
    updateClientInfo,
    hydrateDraft,
    submitDescription,
    submitClarification,
    updateClarifyAnswer,
    regenerate,
    updateBrief,
    toggleGoal,
    toggleIntegration,
    rewriteField,
    launchEditor,
    reset,
    // Template
    selectedTemplateId,
    setSelectedTemplateId,
    selectedPalette,
    setSelectedPalette,
    selectedFont,
    setSelectedFont,
    templateRecommendations,
    templateReasons,
    proceedToTemplate,
    reviewNext,
    proceedToPersonalization,
    proceedToLogo,
    proceedToIntegrations,

    proceedToPayment: () => setPhase('payment'),
    proceedToBuild,
    // Logo & Integrations
    selectedLogo,
    setSelectedLogo,
    selectedIntegrations,
    setSelectedIntegrations,
    // Domain
    selectedDomain,
    setSelectedDomain,
    // Payment (kept for handoff payload)
    planName,
    setPlanName,
    setupFee,
    setSetupFee,
  };
}
