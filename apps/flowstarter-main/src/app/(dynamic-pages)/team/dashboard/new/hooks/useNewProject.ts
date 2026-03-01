'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { useProjectSuggestions } from '@/hooks/wizard/useProjectSuggestions';
import { insertProjectAction } from '@/data/user/projects';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ProjectData, emptyProjectData, detectIndustry } from '../constants';

export function useNewProject() {
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Store access
  const prefillData = useWizardStore((state) => state.prefillData);
  const setPrefillData = useWizardStore((state) => state.setPrefillData);
  const teamWizardData = useWizardStore((state) => state.teamWizardData);
  const setTeamWizardData = useWizardStore((state) => state.setTeamWizardData);

  // AI generation hook
  const aiHook = useProjectSuggestions('business');

  // Check if AI mode
  const isAIModeFromUrl = searchParams?.get('mode') === 'ai-generated';
  const [isAIMode, setIsAIMode] = useState(false);

  useEffect(() => {
    if (isAIModeFromUrl || teamWizardData?.isAIMode) {
      setIsAIMode(true);
    }
  }, [isAIModeFromUrl, teamWizardData?.isAIMode]);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(() => {
    const urlId = searchParams?.get('id');
    return urlId || teamWizardData?.projectId || null;
  });
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationStep, setGenerationStep] = useState<string>('classifying');
  const hasTriggeredGeneration = useRef(false);

  // Regeneration state
  const [regenField, setRegenField] = useState<string | null>(null);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Name validation state
  const [nameError, setNameError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const nameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // If not AI mode, skip generation
  useEffect(() => {
    if (!isAIMode) setIsGenerating(false);
  }, [isAIMode]);

  // Project data
  const [projectData, setProjectData] = useState<ProjectData>(() => {
    if (teamWizardData) {
      return {
        clientName: teamWizardData.clientName || '',
        clientEmail: teamWizardData.clientEmail || '',
        clientPhone: teamWizardData.clientPhone || '',
        businessName: teamWizardData.businessName || '',
        description: teamWizardData.description || '',
        industry: teamWizardData.industry || '',
        targetAudience: teamWizardData.targetAudience || '',
        uvp: teamWizardData.uvp || '',
        goal: teamWizardData.goal || '',
        offerType: teamWizardData.offerType || '',
        brandTone: teamWizardData.brandTone || '',
        businessEmail: teamWizardData.businessEmail || '',
        businessPhone: teamWizardData.businessPhone || '',
        businessAddress: teamWizardData.businessAddress || '',
        website: teamWizardData.website || '',
      };
    }
    return emptyProjectData;
  });

  const [step, setStep] = useState(() => teamWizardData?.step || 1);

  // Update field helper
  const updateField = useCallback((field: keyof ProjectData, value: string) => {
    setProjectData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Sync to store
  useEffect(() => {
    setTeamWizardData({ ...projectData, step, isAIMode, projectId });
  }, [projectData, step, isAIMode, projectId, setTeamWizardData]);

  // Update URL with project ID
  useEffect(() => {
    if (projectId && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('id', projectId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [projectId]);

  // Auto-save (debounced)
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!projectId || !projectData.businessName) return;

    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);

    autoSaveTimeout.current = setTimeout(async () => {
      try {
        const chatData = buildChatData(projectData, isAIMode);
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: projectData.businessName,
            description: projectData.description,
            chat: JSON.stringify(chatData),
          }),
        });
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 1000);

    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    };
  }, [projectData, projectId, isAIMode]);

  // Name validation
  const checkNameAvailability = useCallback(async (name: string) => {
    if (!name.trim()) {
      setNameError(null);
      return;
    }

    setIsCheckingName(true);
    try {
      const response = await fetch(`/api/projects/check-name?name=${encodeURIComponent(name)}&excludeId=${projectId || ''}`);
      const data = await response.json();
      setNameError(data.exists ? 'A project with this name already exists' : null);
    } catch {
      setNameError(null);
    } finally {
      setIsCheckingName(false);
    }
  }, [projectId]);

  // Debounced name check on manual edit
  const handleBusinessNameChange = useCallback((value: string) => {
    updateField('businessName', value);
    setNameError(null);

    if (nameCheckTimeout.current) clearTimeout(nameCheckTimeout.current);
    nameCheckTimeout.current = setTimeout(() => checkNameAvailability(value), 500);
  }, [updateField, checkNameAvailability]);

  // Process AI suggestions helper
  const processAISuggestions = useCallback(async (suggestions: any, draftProjectId: string | null) => {
    const description = prefillData?.description || teamWizardData?.description || '';
    
    // Process name to ensure uniqueness
    const processName = async (name: string): Promise<string> => {
      const res = await fetch(`/api/projects/check-name?name=${encodeURIComponent(name)}&excludeId=${draftProjectId || ''}`);
      const data = await res.json();
      if (!data.exists) return name;

      for (let i = 2; i <= 20; i++) {
        const newName = `${name} ${i}`;
        const checkRes = await fetch(`/api/projects/check-name?name=${encodeURIComponent(newName)}&excludeId=${draftProjectId || ''}`);
        const checkData = await checkRes.json();
        if (!checkData.exists) return newName;
      }
      return `${name} ${Date.now()}`;
    };

    const finalName = await processName(suggestions?.names?.[0] || 'New Project');
    const finalDescription = suggestions?.description || description;
    const finalTargetAudience = suggestions?.targetUsers || '';
    const finalUVP = suggestions?.USP || '';

    setProjectData((prev) => ({
      ...prev,
      businessName: finalName,
      description: finalDescription,
      industry: detectIndustry(description) || prev.industry,
      targetAudience: finalTargetAudience,
      uvp: finalUVP,
    }));

    // Save draft
    if (draftProjectId) {
      const chatData = buildChatData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        businessName: finalName,
        description: finalDescription,
        industry: detectIndustry(description) || '',
        targetAudience: finalTargetAudience,
        uvp: finalUVP,
        goal: '',
        offerType: '',
        brandTone: '',
        businessEmail: '',
        businessPhone: '',
        businessAddress: '',
        website: '',
      }, true);

      await fetch(`/api/projects/${draftProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          description: finalDescription,
          chat: JSON.stringify(chatData),
        }),
      });
    }
  }, [prefillData, teamWizardData]);

  // AI Generation
  const triggerAIGeneration = useCallback(async () => {
    if (hasTriggeredGeneration.current) return;
    hasTriggeredGeneration.current = true;

    const description = prefillData?.description || teamWizardData?.description;
    if (!description) {
      console.log('[AI Generation] No description found, skipping');
      setIsGenerating(false);
      setIsLoading(false);
      return;
    }

    try {
      // Create draft project
      setGenerationStep('classifying');
      console.log('[AI Generation] Creating draft project...');
      
      const draftRes = await fetch('/api/team/projects/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!draftRes.ok) throw new Error('Failed to create draft');
      const { projectId: newId } = await draftRes.json();
      setProjectId(newId);
      console.log('[AI Generation] Draft created:', newId);

      // Generate AI content
      setGenerationStep('generating');
      console.log('[AI Generation] Generating suggestions...');
      
      const suggestions = await aiHook.generateSuggestions({
        businessType: prefillData?.platformType || 'business',
        industry: prefillData?.industry || 'general',
        targetAudience: '',
        uniqueSellingPoint: description,
        description: description,
        goals: '',
        domain: prefillData?.industry || 'general',
        goal: [],
      });

      console.log('[AI Generation] Suggestions received:', suggestions);

      // Process suggestions immediately
      setGenerationStep('finalizing');
      
      if (suggestions) {
        await processAISuggestions(suggestions, newId);
      } else {
        // Fallback: use description as-is
        console.log('[AI Generation] No suggestions, using description as-is');
        setProjectData((prev) => ({
          ...prev,
          description: description,
          industry: detectIndustry(description) || prev.industry,
        }));
      }

      setIsGenerating(false);
      setIsLoading(false);
    } catch (error) {
      console.error('[AI Generation] Error:', error);
      toast.error('Failed to generate project');
      setIsGenerating(false);
      setIsLoading(false);
    }
  }, [prefillData, teamWizardData, aiHook, processAISuggestions]);

  // Start generation on mount (AI mode only)
  useEffect(() => {
    if (isAIMode && !hasTriggeredGeneration.current) {
      triggerAIGeneration();
    } else if (!isAIMode) {
      setIsLoading(false);
    }
  }, [isAIMode, triggerAIGeneration]);

  // Regeneration handler
  const handleRegenerate = useCallback(async (field: string, customPrompt?: string) => {
    setIsRegenerating(true);
    try {
      if (field === 'businessName') await aiHook.regenerateNames(customPrompt);
      else if (field === 'description') await aiHook.regenerateDescription(customPrompt);
      else if (field === 'uvp') await aiHook.regenerateUSP(customPrompt);

      toast.success(`${field === 'businessName' ? 'Name' : field === 'description' ? 'Description' : 'UVP'} regenerated`);
      setRegenField(null);
      setRegenPrompt('');
    } catch {
      toast.error('Failed to regenerate');
    } finally {
      setIsRegenerating(false);
    }
  }, [aiHook]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    setIsSaving(true);

    try {
      const chatData = buildChatData(projectData, isAIMode);
      let finalProjectId = projectId;

      if (projectId) {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: projectData.businessName,
            description: projectData.description,
            chat: JSON.stringify(chatData),
            is_draft: false,
            data: JSON.stringify({
              businessInfo: {
                description: projectData.description,
                uvp: projectData.uvp,
                targetAudience: projectData.targetAudience,
                industry: projectData.industry,
                goal: projectData.goal,
                offerType: projectData.offerType,
                brandTone: projectData.brandTone,
              },
              clientInfo: {
                name: projectData.clientName,
                email: projectData.clientEmail,
                phone: projectData.clientPhone,
              },
              contactInfo: {
                email: projectData.businessEmail,
                phone: projectData.businessPhone,
                address: projectData.businessAddress,
                website: projectData.website,
              },
              generatedByAI: isAIMode,
            }),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update project');
        }
      } else {
        const result = await insertProjectAction({
          name: projectData.businessName,
          description: projectData.description,
          chat: JSON.stringify(chatData),
          data: JSON.stringify({
            businessInfo: {
              description: projectData.description,
              uvp: projectData.uvp,
              targetAudience: projectData.targetAudience,
              industry: projectData.industry,
              goal: projectData.goal,
              offerType: projectData.offerType,
              brandTone: projectData.brandTone,
            },
            clientInfo: {
              name: projectData.clientName,
              email: projectData.clientEmail,
              phone: projectData.clientPhone,
            },
            contactInfo: {
              email: projectData.businessEmail,
              phone: projectData.businessPhone,
              address: projectData.businessAddress,
              website: projectData.website,
            },
            generatedByAI: isAIMode,
          }),
        });

        if (result?.serverError) throw new Error(result.serverError);
        if (result?.validationErrors) {
          throw new Error(Object.values(result.validationErrors).flat().join(', '));
        }
        finalProjectId = result?.data;
      }

      if (!finalProjectId) throw new Error('No project ID');

      toast.success('Project saved! Opening editor...');
      setTeamWizardData(null);
      setPrefillData(null);

      await queryClient.invalidateQueries({ queryKey: ['team-projects'] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Handoff to editor with all collected business data
      const editorUrl = process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5173';
      try {
        const handoffRes = await fetch('/api/editor/handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: finalProjectId,
            mode: 'interactive',
          }),
        });
        if (handoffRes.ok) {
          const handoffData = await handoffRes.json();
          window.open(`${editorUrl}?handoff=${handoffData.token}`, '_blank');
          router.push('/team/dashboard');
        } else {
          router.push('/team/dashboard');
        }
      } catch {
        router.push('/team/dashboard');
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      setIsSaving(false);
    }
  }, [projectData, projectId, isAIMode, queryClient, router, setTeamWizardData, setPrefillData]);

  // Can proceed to next step?
  const canProceed = useCallback(() => {
    if (nameError) return false;

    const clientInfoStep = isAIMode ? 2 : 1;
    const businessInfoStep = isAIMode ? 1 : 2;

    switch (step) {
      case clientInfoStep:
        return !!(projectData.clientName && projectData.clientEmail);
      case businessInfoStep:
        return !!(projectData.businessName && projectData.description && projectData.industry);
      case 3:
        return !!(projectData.goal && projectData.offerType && projectData.brandTone);
      case 4:
        return true;
      default:
        return false;
    }
  }, [step, projectData, nameError, isAIMode]);

  return {
    // State
    projectData,
    step,
    setStep,
    isAIMode,
    isLoading,
    isSaving,
    isGenerating,
    generationStep,
    userLoaded,
    projectId,

    // Name validation
    nameError,
    isCheckingName,

    // Regeneration
    regenField,
    setRegenField,
    regenPrompt,
    setRegenPrompt,
    isRegenerating,

    // AI hook data
    suggestions: aiHook.suggestions,
    loadingStates: aiHook.loadingStates,

    // Actions
    updateField,
    handleBusinessNameChange,
    handleRegenerate,
    handleSubmit,
    canProceed,
  };
}

function buildChatData(data: ProjectData, isAIMode: boolean) {
  return {
    clientInfo: {
      name: data.clientName,
      email: data.clientEmail,
      phone: data.clientPhone,
    },
    businessInfo: {
      name: data.businessName,
      industry: data.industry,
      description: data.description,
      targetAudience: data.targetAudience,
      uvp: data.uvp,
      goal: data.goal,
      offerType: data.offerType,
      brandTone: data.brandTone,
    },
    contactInfo: {
      email: data.businessEmail,
      phone: data.businessPhone,
      address: data.businessAddress,
      website: data.website,
    },
    generatedByAI: isAIMode,
  };
}
