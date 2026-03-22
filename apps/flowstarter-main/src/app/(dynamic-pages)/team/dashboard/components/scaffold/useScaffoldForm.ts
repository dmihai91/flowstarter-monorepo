'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import type { EngineArtifacts } from '@/lib/engine/contracts';

const EDITOR_URL =
  process.env.NEXT_PUBLIC_EDITOR_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://editor.flowstarter.dev'
    : 'http://localhost:5173');

export type ScaffoldPhase = 'client' | 'input' | 'progress' | 'clarify' | 'review';

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
}

export interface EnrichedFields {
  siteName: string;
  industry: string;
  description: string;
  targetAudience: string;
  uvp: string;
  offerings: string;
  brandTone: string;
  goal: string;
  offerType: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

export interface AiStep {
  label: string;
  done: boolean;
}

type ConciergeResponse =
  | {
      status: 'needsMoreInfo';
      followUpQuestions: string[];
    }
  | ({
      status: 'complete';
    } & EngineArtifacts);

const EMPTY_CLIENT: ClientInfo = { name: '', email: '', phone: '' };

const EMPTY_FIELDS: EnrichedFields = {
  siteName: '',
  industry: '',
  description: '',
  targetAudience: '',
  uvp: '',
  offerings: '',
  brandTone: '',
  goal: '',
  offerType: '',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
};

const REVIEW_STEP_COUNT = 4;

export function useScaffoldForm() {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<ScaffoldPhase>('client');
  const [clientInfo, setClientInfo] = useState<ClientInfo>(EMPTY_CLIENT);
  const [userInput, setUserInput] = useState('');
  const [fields, setFields] = useState<EnrichedFields>(EMPTY_FIELDS);
  const [reviewStep, setReviewStep] = useState(0);
  const [aiSteps, setAiSteps] = useState<AiStep[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [clarifyAnswers, setClarifyAnswers] = useState<string[]>([]);
  const [engineArtifacts, setEngineArtifacts] = useState<EngineArtifacts | null>(null);

  // ── AI enrichment mutation ──
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

  // ── Animate progress steps ──
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

  // ── Handle enrichment response (shared by submit + clarify) ──
  const handleEnrichResponse = useCallback(
    async (enriched: ConciergeResponse, originalDesc: string) => {
      setAiSteps((prev) => prev.map((s) => ({ ...s, done: true })));
      await new Promise((r) => setTimeout(r, 300));

      if (enriched.status === 'needsMoreInfo') {
        const questions = enriched.followUpQuestions;
        setFollowUpQuestions(questions);
        setClarifyAnswers(questions.map(() => ''));
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

      const brief = enriched.projectBrief;
      setFields({
        siteName: brief.siteName || '',
        description: brief.summary || originalDesc,
        industry: brief.industry || '',
        targetAudience: brief.targetAudience || '',
        uvp: brief.usp || '',
        goal: brief.goal || '',
        offerType: brief.offerType || '',
        brandTone: brief.brandTone || '',
        offerings: brief.offerings.join(', '),
        contactEmail: brief.contact.email || '',
        contactPhone: brief.contact.phone || '',
        contactAddress: brief.contact.address || '',
      });
      setReviewStep(0);
      setPhase('review');
      setAiSteps([]);
    },
    []
  );

  // ── Submit description for enrichment ──
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
            launchEditor({ description, userDescription: description });
          },
        }
      );
    },
    [enrichMutation, animateProgress, handleEnrichResponse]
  );

  // ── Submit clarification answers ──
  const submitClarification = useCallback(() => {
    const combined = [
      userInput,
      ...followUpQuestions.map(
        (q, i) => (clarifyAnswers[i]?.trim() ? `${q} ${clarifyAnswers[i]}` : '')
      ).filter(Boolean),
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
          launchEditor({ description: combined, userDescription: combined });
        },
      }
    );
  }, [userInput, followUpQuestions, clarifyAnswers, enrichMutation, animateProgress, handleEnrichResponse]);

  // ── Update a single clarify answer ──
  const updateClarifyAnswer = useCallback(
    (index: number, value: string) => {
      setClarifyAnswers((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    },
    []
  );

  // ── Regenerate (re-run enrichment, keep operator contact info) ──
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

          // needsMoreInfo on regenerate is unlikely, but handle it
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

          const brief = enriched.projectBrief;
          setFields((prev) => ({
            ...prev,
            siteName: brief.siteName || prev.siteName,
            description: brief.summary || prev.description,
            industry: brief.industry || prev.industry,
            targetAudience: brief.targetAudience || prev.targetAudience,
            uvp: brief.usp || prev.uvp,
            goal: brief.goal || prev.goal,
            offerType: brief.offerType || prev.offerType,
            brandTone: brief.brandTone || prev.brandTone,
            offerings: brief.offerings.join(', ') || prev.offerings,
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

  // ── Field update ──
  const updateField = useCallback(
    (key: keyof EnrichedFields, value: string) => {
      setFields((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ── AI field rewrite ──
  const [rewritingField, setRewritingField] = useState<keyof EnrichedFields | null>(null);

  const rewriteFieldMutation = useMutation({
    mutationFn: async (params: {
      key: keyof EnrichedFields;
      action: string;
      customPrompt?: string;
    }) => {
      const res = await fetch('/api/ai/rewrite-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: fields[params.key],
          action: params.action,
          fieldName: params.key,
          businessContext: fields.description,
          customPrompt: params.customPrompt,
        }),
      });
      if (!res.ok) throw new Error('Rewrite failed');
      return res.json();
    },
  });

  const rewriteField = useCallback(
    (key: keyof EnrichedFields, action: string, customPrompt?: string) => {
      if (!fields[key]?.trim()) return;
      setRewritingField(key);
      rewriteFieldMutation.mutate(
        { key, action, customPrompt },
        {
          onSuccess: (data) => {
            if (data.rewritten) {
              setFields((prev) => ({ ...prev, [key]: data.rewritten }));
            }
            setRewritingField(null);
          },
          onError: () => setRewritingField(null),
        }
      );
    },
    [fields, rewriteFieldMutation]
  );

  // ── Step navigation ──
  const nextStep = useCallback(() => {
    setReviewStep((s) => Math.min(s + 1, REVIEW_STEP_COUNT - 1));
  }, []);

  const prevStep = useCallback(() => {
    setReviewStep((s) => Math.max(s - 1, 0));
  }, []);

  const isLastStep = reviewStep === REVIEW_STEP_COUNT - 1;
  const isFirstStep = reviewStep === 0;

  // ── Launch editor (React Query mutation) ──
  const handoffMutation = useMutation({
    mutationFn: async (config?: Record<string, unknown>) => {
      const projectConfig = config || {
        name: fields.siteName,
        projectName: fields.siteName,
        description: fields.description,
        userDescription: userInput,
        industry: fields.industry,
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        clientPhone: clientInfo.phone,
        businessInfo: {
          description: fields.description,
          uvp: fields.uvp,
          targetAudience: fields.targetAudience,
          industry: fields.industry,
          goal: fields.goal,
          offerType: fields.offerType,
          brandTone: fields.brandTone,
          offerings: fields.offerings,
        },
        contactInfo: {
          email: fields.contactEmail,
          phone: fields.contactPhone,
          address: fields.contactAddress,
        },
        flowstarterEngine: engineArtifacts || undefined,
        template: engineArtifacts
          ? {
              id: engineArtifacts.templateSelection.selectedTemplateId,
              name: engineArtifacts.templateSelection.selectedTemplateName,
            }
          : undefined,
      };

      const res = await fetch('/api/editor/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectConfig, mode: 'interactive' }),
      });
      if (!res.ok) throw new Error('Handoff failed');
      return res.json() as Promise<{ editorUrl: string; token: string; projectId: string }>;
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
    [handoffMutation, engineArtifacts]
  );

  // ── Client info ──
  const updateClientInfo = useCallback(
    (key: keyof ClientInfo, value: string) => {
      setClientInfo((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const submitClientInfo = useCallback(() => {
    setPhase('input');
  }, []);

  // ── Reset ──
  const reset = useCallback(() => {
    setPhase('client');
    setClientInfo(EMPTY_CLIENT);
    setFields(EMPTY_FIELDS);
    setUserInput('');
    setReviewStep(0);
    setAiSteps([]);
    setFollowUpQuestions([]);
    setClarifyAnswers([]);
    setEngineArtifacts(null);
  }, []);

  return {
    // State
    phase,
    clientInfo,
    userInput,
    fields,
    reviewStep,
    aiSteps,
    followUpQuestions,
    clarifyAnswers,
    isEnriching: enrichMutation.isPending,
    rewritingField,
    rewriteField,
    // Review navigation
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    reviewStepCount: REVIEW_STEP_COUNT,
    // Actions
    submitClientInfo,
    updateClientInfo,
    submitDescription,
    submitClarification,
    updateClarifyAnswer,
    regenerate,
    updateField,
    launchEditor,
    reset,
  };
}
