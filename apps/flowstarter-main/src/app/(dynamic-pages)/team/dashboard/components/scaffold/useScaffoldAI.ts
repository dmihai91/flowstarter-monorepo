'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import type { EngineArtifacts } from '@/lib/engine/contracts';
import type {
  AiStep,
  ClientInfo,
  ConciergeResponse,
  ProjectBriefDraft,
  ScaffoldPhase,
} from './scaffold-types';
import { briefFromEngine } from './scaffold-types';

// ── AI enrichment hook ──────────────────────────────────────────────────────

interface UseScaffoldAIOptions {
  clientInfo: ClientInfo;
  selectedTemplateId: string | null;
  setPhase: (phase: ScaffoldPhase) => void;
  setBrief: React.Dispatch<React.SetStateAction<ProjectBriefDraft>>;
  setReviewStep: (step: number) => void;
  setEngineArtifacts: (artifacts: EngineArtifacts | null) => void;
  setTemplateRecommendations: (recs: string[]) => void;
  setTemplateReasons: (reasons: Record<string, string>) => void;
  setSelectedTemplateId: (id: string | null) => void;
  launchEditor: (config?: Record<string, unknown>) => void;
}

export function useScaffoldAI(opts: UseScaffoldAIOptions) {
  const {
    clientInfo,
    selectedTemplateId,
    setPhase,
    setBrief,
    setReviewStep,
    setEngineArtifacts,
    setTemplateRecommendations,
    setTemplateReasons,
    setSelectedTemplateId,
    launchEditor,
  } = opts;

  const [userInput, setUserInput] = useState('');
  const [aiSteps, setAiSteps] = useState<AiStep[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [clarifyAnswers, setClarifyAnswers] = useState<string[]>([]);

  // ── AI rewrite ────────────────────────────────────────────────────────────
  const [rewritingField, setRewritingField] = useState<
    keyof ProjectBriefDraft | null
  >(null);

  const rewriteFieldMutation = useMutation({
    mutationFn: async (params: {
      key: keyof ProjectBriefDraft;
      action: string;
      value: string;
      businessContext: string;
      customPrompt?: string;
    }) => {
      const res = await fetch('/api/ai/rewrite-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: params.value,
          action: params.action,
          fieldName: params.key,
          businessContext: params.businessContext,
          customPrompt: params.customPrompt,
        }),
      });
      if (!res.ok) throw new Error('Rewrite failed');
      return res.json() as Promise<{ rewritten?: string }>;
    },
  });

  const rewriteField = useCallback(
    (
      brief: ProjectBriefDraft,
      key: keyof ProjectBriefDraft,
      action: string,
      customPrompt?: string
    ) => {
      const v = brief[key];
      const strV = Array.isArray(v)
        ? (v as string[]).join(', ')
        : String(v ?? '');
      if (!strV.trim()) return;
      setRewritingField(key);
      rewriteFieldMutation.mutate(
        {
          key,
          action,
          value: strV,
          businessContext: brief.summary,
          customPrompt,
        },
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
    [rewriteFieldMutation, setBrief]
  );

  // ── Enrichment mutation ───────────────────────────────────────────────────
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
            businessName: clientInfo.businessName || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error('Enrichment failed');
      return res.json() as Promise<ConciergeResponse>;
    },
  });

  // ── Animate progress ──────────────────────────────────────────────────────
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

  // ── Handle enrichment response ────────────────────────────────────────────
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
    [
      selectedTemplateId,
      setPhase,
      setBrief,
      setReviewStep,
      setEngineArtifacts,
      setTemplateRecommendations,
      setTemplateReasons,
      setSelectedTemplateId,
    ]
  );

  // ── Submit description ────────────────────────────────────────────────────
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
    [
      enrichMutation,
      animateProgress,
      handleEnrichResponse,
      setPhase,
      launchEditor,
    ]
  );

  // ── Submit clarification ──────────────────────────────────────────────────
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
  }, [
    userInput,
    followUpQuestions,
    clarifyAnswers,
    enrichMutation,
    animateProgress,
    handleEnrichResponse,
    setPhase,
    launchEditor,
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
  }, [
    userInput,
    enrichMutation,
    animateProgress,
    setPhase,
    setBrief,
    setEngineArtifacts,
  ]);

  return {
    userInput,
    setUserInput,
    aiSteps,
    setAiSteps,
    followUpQuestions,
    setFollowUpQuestions,
    clarifyAnswers,
    setClarifyAnswers,
    isEnriching: enrichMutation.isPending,
    rewritingField,
    submitDescription,
    submitClarification,
    updateClarifyAnswer,
    regenerate,
    rewriteField,
  };
}
