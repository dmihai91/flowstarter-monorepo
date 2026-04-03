'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  mapRegistryTemplateToWizardTemplate,
  type WizardTemplate,
} from './TemplateGallery';
import type { useScaffoldForm } from '../components/scaffold/useScaffoldForm';

type ScaffoldForm = ReturnType<typeof useScaffoldForm>;

export function useWizardState(form: ScaffoldForm) {
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
      case 'payment':
        return 3;
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

  return {
    isLaunching,
    galleryOpen,
    setGalleryOpen,
    launchError,
    templates,
    templatesLoading,
    industry,
    setIndustry,
    mode,
    setMode,
    prompt,
    setPrompt,
    stepIndex,
    scheduleSaveDraft,
    handleInitialStepSubmit,
    handleLaunch,
    selectedTemplate,
  };
}
