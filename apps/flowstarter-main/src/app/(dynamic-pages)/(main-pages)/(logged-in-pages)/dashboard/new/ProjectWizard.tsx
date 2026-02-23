'use client';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useCreateProjectFromConfig } from '@/hooks/useCreateProjectFromConfig';
import { useInvalidateDashboardStats } from '@/hooks/useDashboardStats';
import { useWizardDraft } from '@/hooks/wizard/useWizardDraft';
import { useTranslations } from '@/lib/i18n';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safe-storage';
import { useProjectAIStore } from '@/store/ai-suggestions-store';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectConfig, ProjectWizardStep } from '@/types/project-config';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { TemplateStep } from './components/wizard/components/templates/TemplateStep';
import { WizardLayout } from './components/wizard/components/WizardLayout';
import { DetailsStep } from './components/wizard/DetailsStep';
import { ReviewStep } from './components/wizard/ReviewStep';

const useWizardSteps = (templateFirst: boolean = false) => {
  const { t } = useTranslations();

  return useMemo(() => {
    const reviewDescription =
      t('wizard.review.desc') || 'Review your website before launching it';

    // Default flow: details → template → review
    // Template-first flow: template → details → review
    // Note: design step temporarily removed until implemented
    const baseSteps = [
      {
        id: 'details' as const,
        title: t('wizard.details.title') || "Let's get to know your project",
        description:
          t('wizard.details.desc') || 'Define Audience, Goals and more',
      },
      {
        id: 'template' as const,
        title: t('wizard.template.title') || 'Choose Site Structure',
        description:
          t('wizard.template.descStructure') ||
          'Pick how you want to build your website',
      },
      // Design step temporarily disabled - returns null in renderStep
      // {
      //   id: 'design' as const,
      //   title: t('wizard.design.title'),
      //   description: t('wizard.design.desc'),
      // },
      {
        id: 'review' as const,
        title: t('wizard.review.title') || 'Review & Launch',
        description: reviewDescription,
      },
    ].filter((step) => step && step.id && step.title && step.description);

    if (templateFirst && baseSteps.length >= 2) {
      // Move template to first position
      const [details, template, ...rest] = baseSteps;
      return [template, details, ...rest].filter(
        (step) => step && step.id && step.title && step.description
      );
    }

    return baseSteps;
  }, [t, templateFirst]);
};

const initialProjectConfig: ProjectConfig = {
  template: {
    id: '',
    name: '',
    description: '',
    category: 'business',
    features: [],
    complexity: 'simple',
  },
  name: '',
  description: '',
  targetUsers: '',
  businessGoals: '',
  brandTone: '',
  keyServices: '',
  USP: '',
  publishImmediately: true,
  designConfig: {
    selectedPalette: 0,
    primaryColor: '#3b82f6',
    logoOption: 'ai',
    logoPrompt: '',
    generatedPalettes: [],
  },
  domainConfig: {
    domain: '',
    provider: 'platform',
    domainType: 'hosted',
  },
};

// Draft persistence is handled via /api/projects/draft

/**
 * ProjectWizard URL Routing Guide
 *
 * The wizard determines the flow based on URL parameters and draft existence:
 *
 * 1. AI-Generated Mode (from dashboard assistant):
 *    /dashboard/new?mode=ai-generated
 *    - Loads prefilled data from wizard store
 *    - Starts at 'details' step in 'refine' phase
 *    - Shows completed project details for review/editing
 *
 * 2. Template Gallery Mode:
 *    /dashboard/new?path=gallery
 *    - Starts at 'template' step
 *    - User browses and selects template first
 *
 * 3. Scratch/Recommendations Mode:
 *    /dashboard/new?path=scratch
 *    /dashboard/new?path=recommendations
 *    - Starts at 'details' step in 'collect' phase
 *    - User fills details manually or with AI assistance
 *
 * 4. Continue Draft:
 *    /wizard/project/{draftId}
 *    - Loads specific draft by ID from URL path parameter
 *    - Draft ID is part of the URL structure
 *
 * 5. Continue From Refresh:
 *    /dashboard/new (on refresh)
 *    - Automatically restores the most recent draft session
 *    - Uses localStorage to track current draft ID
 *    - Falls back to fetching latest draft from server if localStorage is empty
 *    - Preserves wizard state (step, phase, form data) after page refresh
 *
 * 6. Create New (Fresh Start):
 *    /dashboard/new?fresh=true
 *    - Starts fresh wizard without loading any draft
 *    - Clears localStorage draft tracking
 *    - Starts at 'details' step in 'collect' phase
 *
 * Query Parameters:
 * - mode=ai-generated: Indicates prefilled AI data
 * - path=gallery|scratch|recommendations: Entry flow
 * - step=details|template|design|review: Direct step navigation
 * - fresh=true: Start fresh without loading any draft
 */
export default function ProjectWizard({
  initialAvailableIds,
  draftId: draftIdProp,
  customSteps,
}: {
  initialAvailableIds?: string[];
  draftId?: string;
  customSteps?: Array<{
    id: ProjectWizardStep;
    title: string;
    description: string;
  }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const stepParam = searchParams.get('step') as ProjectWizardStep | null;
  const pathParam = searchParams.get('path') as
    | ('recommendations' | 'gallery' | 'scratch')
    | null;
  const prefillParam = searchParams.get('prefill');
  const modeParam = searchParams.get('mode'); // 'ai-generated' indicates prefilled data

  const {
    currentStep,
    setCurrentStep,
    projectConfig,
    setProjectConfig,
    isLoaded,
    setIsLoaded,
    setWizardActions,
    setIsDiscarding,
    detailsPhase,
    prefillData,
  } = useWizardStore(
    useShallow((state) => ({
      currentStep: state.currentStep,
      setCurrentStep: state.setCurrentStep,
      projectConfig: state.projectConfig,
      setProjectConfig: state.setProjectConfig,
      isLoaded: state.isLoaded,
      setIsLoaded: state.setIsLoaded,
      setWizardActions: state.setWizardActions,
      setIsDiscarding: state.setIsDiscarding,
      detailsPhase: state.detailsPhase,
      prefillData: state.prefillData,
    }))
  );

  const setDetailsPhase = useWizardStore((s) => s.setDetailsPhase);
  const setShowSummary = useWizardStore((s) => s.setShowSummary);
  const setSkipLoadingScreen = useWizardStore((s) => s.setSkipLoadingScreen);
  const setPrefillData = useWizardStore((s) => s.setPrefillData);
  const setPrefillImages = useWizardStore((s) => s.setPrefillImages);

  const isDiscarding = useWizardStore((s) => s.isDiscarding);

  // Strategy for draft loading:
  // 1. If draftId is provided via prop (from /wizard/project/{id}), use it directly
  // 2. If 'fresh=true' query param, start fresh without loading any draft
  // 3. If on /dashboard/new, attempt to load the most recent draft from localStorage or API
  // 4. Use 'latest' as a special identifier to fetch the most recent draft
  const freshParam = searchParams.get('fresh');
  const reset = useWizardStore((s) => s.reset);
  const [effectiveDraftId, setEffectiveDraftId] = useState<
    string | undefined | 'latest'
  >(() => {
    if (draftIdProp) return draftIdProp;

    // If explicitly starting fresh, don't load any draft
    if (freshParam === 'true') {
      console.log(
        '[ProjectWizard] Starting fresh - clearing draft localStorage'
      );
      safeRemoveItem('flowstarter_current_draft');
      return undefined;
    }

    // Check localStorage for ongoing draft session
    const storedDraftId = safeGetItem('flowstarter_current_draft');
    if (storedDraftId) {
      console.log(
        '[ProjectWizard] Found draft ID in localStorage:',
        storedDraftId
      );
      return storedDraftId;
    }
    // Default to 'latest' to fetch most recent draft from server
    return 'latest';
  });

  // Reset wizard store state when starting fresh to prevent state leakage
  useEffect(() => {
    if (freshParam === 'true') {
      console.log('[ProjectWizard] Fresh start - resetting wizard store state');
      reset(initialProjectConfig);
    }
  }, [freshParam, reset]);

  const shouldLoadDraft = Boolean(effectiveDraftId);
  const projectDraftId =
    effectiveDraftId === 'latest' ? undefined : effectiveDraftId;

  console.log('[ProjectWizard] Draft props:', {
    draftIdProp,
    effectiveDraftId,
    shouldLoadDraft,
    projectDraftId,
  });

  const createProject = useCreateProjectFromConfig(projectDraftId);
  const resetHostedAvailability = useWizardStore(
    (s) => s.resetHostedAvailability
  );
  const setSelectedIndustry = useWizardStore((s) => s.setSelectedIndustry);
  const setHasAIGenerated = useWizardStore((s) => s.setHasAIGenerated);
  const setLastGeneratedDescription = useWizardStore(
    (s) => s.setLastGeneratedDescription
  );
  const invalidateDashboardStats = useInvalidateDashboardStats();

  const {
    deleteDraftAndReset,
    saveStatus,
    lastSavedAt,
    isOffline,
    draftError,
    loadedDraftId,
  } = useWizardDraft(initialProjectConfig, shouldLoadDraft, projectDraftId);

  // Update localStorage and effectiveDraftId when a draft is loaded or created
  useEffect(() => {
    if (loadedDraftId && loadedDraftId !== effectiveDraftId) {
      console.log('[ProjectWizard] Updating draft ID:', loadedDraftId);
      setEffectiveDraftId(loadedDraftId);
      safeSetItem('flowstarter_current_draft', loadedDraftId);
    }
  }, [loadedDraftId, effectiveDraftId]);
  const aiReset = useProjectAIStore((s) => s.reset);
  const isGenerating = useProjectAIStore((s) => s.isGenerating);
  const aiLoading = useProjectAIStore((s) => s.loading);
  const isAnyFieldLoading = Object.values(aiLoading).some((loading) => loading);

  // Initialize step on mount for gallery flow
  useEffect(() => {
    if (pathParam === 'gallery' && !customSteps) {
      setCurrentStep('template'); // Start at template for gallery flow
    }
    // Only run on mount
    // eslint-disable-next-line
  }, []);

  // Apply prefill from store or URL parameter (for backwards compatibility)
  useEffect(() => {
    // Skip prefill if we're loading a specific draft from URL
    // This prevents prefill data from overwriting draft data
    if (draftIdProp) {
      console.log(
        '[ProjectWizard] Skipping prefill - loading draft from URL:',
        draftIdProp
      );
      // Clear any stale prefill data to prevent it from interfering
      if (prefillData) {
        console.log(
          '[ProjectWizard] Clearing stale prefill data when loading draft'
        );
        setPrefillData(null);
        setPrefillImages([]);
      }
      return;
    }

    let dataToApply: Partial<ProjectConfig> | null = null;
    const isAIGenerated = modeParam === 'ai-generated';

    // Priority 1: Check store for prefill data
    if (prefillData) {
      dataToApply = prefillData;
      // Don't clear prefillData yet - wait until draft is saved
      // This ensures data survives page refreshes before autosave completes
    }
    // Priority 2: Check URL parameter for backwards compatibility
    else if (prefillParam) {
      try {
        dataToApply = JSON.parse(
          Buffer.from(prefillParam, 'base64').toString('utf-8')
        ) as Partial<ProjectConfig>;
      } catch {
        // ignore malformed prefill
      }
    }

    // Apply the data if we have any
    if (dataToApply) {
      const merged: ProjectConfig = {
        ...projectConfig,
        ...dataToApply,
        // Deep merge designConfig to preserve existing nested fields
        designConfig: {
          ...projectConfig.designConfig,
          ...dataToApply.designConfig,
          businessInfo: {
            ...projectConfig.designConfig?.businessInfo,
            ...dataToApply.designConfig?.businessInfo,
          },
        },
      } as ProjectConfig;
      setProjectConfig(merged);

      // Set industry in wizard store if present
      if (dataToApply?.designConfig?.businessInfo?.industry) {
        setSelectedIndustry(dataToApply.designConfig.businessInfo.industry);
      }

      // If coming from AI generation or has generated content, go to refine phase
      const hasGeneratedContent = Boolean(
        dataToApply?.targetUsers ||
          dataToApply?.businessGoals ||
          dataToApply?.USP ||
          dataToApply?.name
      );

      if (isAIGenerated || hasGeneratedContent) {
        setHasAIGenerated(true);
        // Set phase to 'refine' so user sees the completed details immediately
        setDetailsPhase('refine');
        // Show summary view for AI-generated content
        setShowSummary(true);

        // Set lastGeneratedDescription to enable Continue button validation
        if (dataToApply.description) {
          setLastGeneratedDescription(dataToApply.description);
        }

        // Show success toast only when user lands on project details page after AI generation
        if (isAIGenerated) {
          toast.success(t('assistant.toast.success'), {
            description: t('assistant.toast.successDescription'),
          });
        }
      }

      // Stay on details step to show the generated content
      if (
        (dataToApply?.name || dataToApply?.description) &&
        pathParam !== 'gallery'
      ) {
        setCurrentStep('details');
      }
    }
    // Only run on mount
    // eslint-disable-next-line
  }, []);

  // Clear prefill data once draft is successfully saved
  // This prevents stale prefill data from persisting after it's been saved to draft
  useEffect(() => {
    if (prefillData && (saveStatus === 'saved' || loadedDraftId)) {
      console.log(
        '[ProjectWizard] Draft saved successfully, clearing prefill data'
      );
      setPrefillData(null);
    }
  }, [prefillData, saveStatus, loadedDraftId, setPrefillData]);

  // Reset skipLoadingScreen flag once wizard is loaded
  useEffect(() => {
    if (isLoaded) {
      setSkipLoadingScreen(false);
    }
  }, [isLoaded, setSkipLoadingScreen]);

  // Reset isDiscarding when unmounting to ensure clean state on next visit
  // NOTE: We don't reset isLoaded here anymore because it causes issues when resuming
  // from the dashboard - the draft data would flash as empty before being rehydrated.
  // Instead, useWizardDraft handles the isLoaded state based on draft context changes.
  useEffect(() => {
    return () => {
      // Reset isDiscarding to ensure clean state
      setIsDiscarding(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use customSteps if provided, otherwise determine order based on entry flow
  // Template is first only when explicitly choosing template flow (path=gallery)
  const isTemplateFirstFlow = customSteps
    ? customSteps[0]?.id === 'template'
    : pathParam === 'gallery';
  const defaultSteps = useWizardSteps(isTemplateFirstFlow);
  const steps = useMemo(
    () =>
      (customSteps || defaultSteps).filter(
        (step) => step && step.id && step.title && step.description
      ),
    [customSteps, defaultSteps]
  );

  // Show toast notification when draft save fails
  useEffect(() => {
    if (draftError) {
      console.log('[ProjectWizard] Draft error detected:', draftError);
      toast.error(t('draft.saveDraftFailed'), {
        description: t('draft.saveDraftFailedDescription'),
      });
    }
  }, [draftError, t]);

  // Header action removed: chat interface now collects details inline

  // Initialize flow based on entry point - run once on load
  useEffect(() => {
    if (!isLoaded || !steps || steps.length === 0) return;

    // Sync explicit step from URL (user navigating back/forward)
    if (stepParam) {
      const valid = steps.some((s) => s && s.id === stepParam);
      // Validate that user can access the requested step
      const canAccessStep =
        stepParam === 'details' ||
        stepParam === 'template' ||
        (stepParam === 'review' && projectConfig.template?.id);

      if (valid && canAccessStep && currentStep !== stepParam) {
        setCurrentStep(stepParam);
      } else if (!canAccessStep) {
        // Redirect to template step if trying to access review without template
        console.log(
          `[ProjectWizard] Cannot access ${stepParam} - missing template. Redirecting...`
        );
        const redirectStep = projectConfig.template?.id
          ? stepParam
          : 'template';
        setCurrentStep(redirectStep);
        updateURL(redirectStep);
      } else if (steps[0] && currentStep !== steps[0].id) {
        setCurrentStep(steps[0].id);
      }
    } else if (pathParam === 'gallery') {
      // Gallery flow starts at template step
      const templateStep = steps.find((s) => s && s.id === 'template');
      if (templateStep && currentStep !== 'template') {
        setCurrentStep('template');
      } else if (steps[0] && currentStep !== steps[0].id) {
        setCurrentStep(steps[0].id);
      }
    } else if (customSteps && customSteps.length > 0) {
      // If custom steps provided, start at the first step in the array
      if (customSteps[0]?.id && currentStep !== customSteps[0].id) {
        setCurrentStep(customSteps[0].id);
      }
    } else if (loadedDraftId) {
      // When resuming a draft, respect the step restored from the draft
      // Don't override it - useWizardDraft already set the correct step
      console.log(
        `[ProjectWizard] Resuming draft ${loadedDraftId}, keeping restored step: ${currentStep}`
      );
      // Update URL to reflect the restored step
      updateURL(currentStep);
    } else {
      // Default flow starts at details step (only for new projects)
      const detailsStep = steps.find((s) => s && s.id === 'details');
      if (detailsStep && currentStep !== 'details') {
        setCurrentStep('details');
      } else if (steps[0] && currentStep !== steps[0].id) {
        setCurrentStep(steps[0].id);
      }
    }

    // Only run once when wizard loads
    // eslint-disable-next-line
  }, [isLoaded, steps]);

  // Keyboard navigation
  useEffect(() => {
    const goToTemplateHandler = () => {
      setCurrentStep('template');
      updateURL('template');
    };
    window.addEventListener('go-to-template-step', goToTemplateHandler);

    const goToStepHandler = (e: Event) => {
      const customEvent = e as CustomEvent<{ step: ProjectWizardStep }>;
      if (customEvent.detail?.step) {
        const targetStep = customEvent.detail.step;
        // Validate before navigating to review step
        if (
          targetStep === 'review' &&
          !useWizardStore.getState().projectConfig.template?.id
        ) {
          console.log(
            '[ProjectWizard] Cannot navigate to review - no template selected'
          );
          return;
        }
        setCurrentStep(targetStep);
        updateURL(targetStep);
      }
    };
    window.addEventListener('wizard-go-to-step', goToStepHandler);

    return () => {
      window.removeEventListener('go-to-template-step', goToTemplateHandler);
      window.removeEventListener('wizard-go-to-step', goToStepHandler);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'Enter' && !isNextDisabled()) {
          event.preventDefault();
          currentStep === 'review' ? handleFinish() : handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line
  }, [currentStep]);

  // NOTE: Removed URL sync useEffect to prevent infinite loops and race conditions.
  // URL is now updated directly in handleNext, handleBack, and other navigation handlers.

  // Autosave handled in useWizardDraft

  // Update URL when step changes
  const updateURL = (step: ProjectWizardStep) => {
    const url = new URL(window.location.href);
    url.searchParams.set('step', step);
    // Remove path param - not needed anymore
    url.searchParams.delete('path');
    window.history.pushState({}, '', url.toString());
  };

  const handleNext = async () => {
    // Find current step index and get next step
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex === -1 || currentIndex >= steps.length - 1) {
      return; // Already at last step or invalid step
    }

    const nextStep = steps[currentIndex + 1].id;

    // Validate before navigating to review step
    if (nextStep === 'review' && !projectConfig.template?.id) {
      toast.error('Please select a template before proceeding to review');
      return;
    }

    setCurrentStep(nextStep);
    updateURL(nextStep);
  };

  const handleBack = () => {
    // Find current step index and get previous step
    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    if (currentIndex === -1) {
      return; // Invalid step
    }

    if (currentIndex === 0) {
      // At first step, go back to dashboard
      router.push('/dashboard');
      return;
    }

    const prevStep = steps[currentIndex - 1].id;
    setCurrentStep(prevStep);
    updateURL(prevStep);
  };

  const handleFinish = useCallback(async () => {
    try {
      console.log('Creating project with config:', projectConfig);

      // Prefetch the dashboard page while creating the project
      router.prefetch('/dashboard');

      const projectId = await createProject.create(projectConfig);

      toast.success('Project created successfully!');
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('fs_show_saved_modal', '1');
          // Store the new project ID for highlighting
          if (projectId) {
            window.sessionStorage.setItem('fs_new_project_id', projectId);
          }
          // Clear draft localStorage since project is now created
          safeRemoveItem('flowstarter_current_draft');
        }
      } catch {
        // ignore
      }

      // Navigate immediately - the projects list is already refetched
      router.push(`/dashboard`);

      // Note: we no longer delete the draft here to avoid loops.
      // Draft clearing is handled only via explicit Start Over.
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create project'
      );
    }
  }, [projectConfig, router, createProject]);

  const isNextDisabled = () => {
    // Dynamic step validation based on current step
    switch (currentStep) {
      case 'template':
        // Require template selection (including scratch)
        return !projectConfig.template.id;
      case 'details':
        // Allow proceeding if basic fields are filled and platform type is selected
        return !(
          projectConfig.name?.trim() &&
          projectConfig.description?.trim() &&
          projectConfig.platformType
        );
      case 'design':
        return false;
      default:
        return false;
    }
  };

  // Allow publish only when all steps are valid AND user is on review step AND site has been generated
  const hasGeneratedSite = useWizardStore((s) => s.hasGeneratedSite);
  const canPublish = useMemo(() => {
    const detailsValid = Boolean(
      projectConfig.name?.trim() &&
        projectConfig.description?.trim() &&
        projectConfig.targetUsers?.trim()
    );
    const templateValid = Boolean(projectConfig.template.id);
    const designValid = true;
    const onReviewStep = currentStep === 'review';
    return (
      detailsValid &&
      templateValid &&
      designValid &&
      onReviewStep &&
      hasGeneratedSite
    );
  }, [projectConfig, currentStep, hasGeneratedSite]);

  // Autosave element for navbar
  const autosaveElement = useMemo(() => {
    if (isOffline) {
      return <span>{t('app.offline')}</span>;
    } else if (saveStatus === 'saving') {
      return <span>{t('app.saving')}</span>;
    } else if (saveStatus === 'saved') {
      return (
        <span>
          {`Saved${
            lastSavedAt
              ? ` · ${new Date(lastSavedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : ''
          }`}
        </span>
      );
    } else if (saveStatus === 'error') {
      return <span>{t('app.saveFailed')}</span>;
    } else if (saveStatus === 'idle') {
      return <span>Draft</span>;
    }
    return null;
  }, [isOffline, saveStatus, lastSavedAt, t]);

  // Handle cancel action
  const handleCancel = useCallback(async () => {
    // Show loading screen while discarding
    setIsDiscarding(true);

    try {
      // Perform cleanup operations
      await deleteDraftAndReset();
      invalidateDashboardStats();
      try {
        aiReset();
      } catch (e) {
        console.warn('Failed to reset AI store', e);
      }
      // Clear any AI prefill data and images so a new wizard starts clean
      setPrefillData(null);
      setPrefillImages([]);
      resetHostedAvailability();
      setSelectedIndustry(undefined);
      setHasAIGenerated(false);

      // Clear draft localStorage since draft is deleted
      safeRemoveItem('flowstarter_current_draft');

      // Navigate to dashboard after cleanup
      router.replace('/dashboard');
    } catch (error) {
      console.error('Error during draft deletion:', error);
      // Still invalidate stats even on error
      invalidateDashboardStats();
      // Navigate anyway
      router.replace('/dashboard');
    } finally {
      setIsDiscarding(false);
    }
  }, [
    router,
    deleteDraftAndReset,
    invalidateDashboardStats,
    aiReset,
    resetHostedAvailability,
    setSelectedIndustry,
    setHasAIGenerated,
    setIsDiscarding,
  ]);

  // Track autosave status as a serializable value to prevent unnecessary updates
  const autosaveKey = useMemo(() => {
    if (isOffline) return 'offline';
    if (saveStatus === 'saving') return 'saving';
    if (saveStatus === 'saved') return `saved-${lastSavedAt || ''}`;
    if (saveStatus === 'error') return 'error';
    if (saveStatus === 'idle') return 'idle';
    return 'none';
  }, [isOffline, saveStatus, lastSavedAt]);

  // Memoize canJumpToDetails to prevent unnecessary recalculations
  const canJumpToDetails = useMemo(() => {
    return Boolean(
      (projectConfig.name || '').trim() ||
        (projectConfig.description || '').trim() ||
        (projectConfig.USP || '').trim()
    );
  }, [projectConfig.name, projectConfig.description, projectConfig.USP]);

  const prevAutosaveKeyRef = useRef<string>('');
  const prevCanPublishRef = useRef<boolean>(false);
  const prevCanJumpToDetailsRef = useRef<boolean>(false);

  // Update wizard actions in store whenever they change
  useEffect(() => {
    const currentCanPublish = !createProject.isPending && canPublish;
    const autosaveChanged = prevAutosaveKeyRef.current !== autosaveKey;
    const canPublishChanged = prevCanPublishRef.current !== currentCanPublish;
    const canJumpChanged = prevCanJumpToDetailsRef.current !== canJumpToDetails;

    // Only update if values actually changed
    if (autosaveChanged || canPublishChanged || canJumpChanged) {
      setWizardActions({
        onCancel: handleCancel,
        onPublish: handleFinish,
        canPublish: currentCanPublish,
        autosaveElement,
        // Put header action here so it renders inside WizardSectionHeader
        ...(currentStep === 'details' && canJumpToDetails
          ? {
              // action is read by WizardLayout via headerAction prop
              // The actual element is passed from here in props below
            }
          : {}),
      });

      prevAutosaveKeyRef.current = autosaveKey;
      prevCanPublishRef.current = currentCanPublish;
      prevCanJumpToDetailsRef.current = canJumpToDetails;
    }
  }, [
    canPublish,
    createProject.isPending,
    autosaveKey,
    autosaveElement,
    canJumpToDetails,
    currentStep,
    handleCancel,
    handleFinish,
  ]);

  // Show loading overlay only when actually loading a draft or discarding
  // For new projects (shouldLoadDraft=false), skip the loading screen entirely
  const showLoadingScreen = isDiscarding || (shouldLoadDraft && !isLoaded);

  if (showLoadingScreen) {
    return (
      <LoadingScreen
        message={
          isDiscarding ? t('draft.discardingDraft') : t('app.loadingExperience')
        }
      />
    );
  }

  // Render the appropriate step based on currentStep
  const renderStep = () => {
    switch (currentStep) {
      case 'template':
        return (
          <TemplateStep
            onTemplateSelect={(template) => {
              setProjectConfig({
                ...projectConfig,
                template,
              });
            }}
            selectedTemplate={projectConfig.template}
            onNext={handleNext}
            onBack={handleBack}
            projectConfig={projectConfig}
            onProjectConfigChange={setProjectConfig}
            initialAvailableIds={initialAvailableIds}
          />
        );
      case 'details':
        return (
          <DetailsStep
            projectConfig={projectConfig}
            onProjectConfigChange={setProjectConfig}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'design':
        // TO DO
        return null;
      case 'review':
        return (
          <ReviewStep
            projectConfig={projectConfig}
            onProjectConfigChange={setProjectConfig}
            onNext={handleNext}
            onBack={handleBack}
            projectId={loadedDraftId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <WizardLayout
      currentStep={currentStep}
      steps={steps}
      canProceed={!isNextDisabled()}
      isGenerating={isGenerating || isAnyFieldLoading}
      onNext={currentStep === 'review' ? handleFinish : handleNext}
      onPrevious={handleBack}
      canSubmitForReview={!createProject.isPending && canPublish}
      onSubmitForReview={handleFinish}
      headerAction={
        currentStep === 'details' &&
        detailsPhase === 'collect' &&
        Boolean(
          (projectConfig.name || '').trim() ||
            (projectConfig.description || '').trim() ||
            (projectConfig.USP || '').trim()
        )
      }
    >
      {renderStep()}
    </WizardLayout>
  );
}
