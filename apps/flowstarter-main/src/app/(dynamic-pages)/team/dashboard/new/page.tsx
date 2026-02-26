'use client';

import { Button } from '@/components/ui/button';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TeamHeader } from '../../components/TeamHeader';
import FooterCompact from '@/components/FooterCompact';
import { Label } from '@/components/ui/label';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { useProjectSuggestions } from '@/hooks/wizard/useProjectSuggestions';
import { insertProjectAction } from '@/data/user/projects';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Users,
  Target,
  Sparkles,
  Mail,
  Phone,
  Globe,
  Loader2,
  Check,
  RefreshCw,
} from 'lucide-react';

type BusinessGoal = 'leads' | 'sales' | 'bookings';
type BrandTone = 'professional' | 'friendly' | 'bold' | 'elegant' | 'playful';
type OfferType = 'services' | 'products' | 'both' | 'info';

interface ProjectData {
  // Client info
  clientName: string;
  clientEmail: string;
  clientPhone: string;

  // Business info
  businessName: string;
  description: string;
  industry: string;
  targetAudience: string;
  uvp: string;

  // Quick profile
  goal: BusinessGoal | '';
  offerType: OfferType | '';
  brandTone: BrandTone | '';

  // Contact
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  website: string;
}

const industries = [
  'Consulting',
  'Coaching & Training',
  'Health & Wellness',
  'Beauty & Spa',
  'Restaurant & Food',
  'Retail & E-commerce',
  'Real Estate',
  'Legal Services',
  'Financial Services',
  'Technology',
  'Creative & Design',
  'Education',
  'Construction & Trades',
  'Automotive',
  'Other',
];

const goalOptions: { value: BusinessGoal; label: string; desc: string }[] = [
  {
    value: 'leads',
    label: 'Get Leads',
    desc: 'Collect contact information from potential clients',
  },
  {
    value: 'bookings',
    label: 'Get Bookings',
    desc: 'Allow clients to schedule appointments',
  },
  {
    value: 'sales',
    label: 'Sell Products',
    desc: 'Sell products or services online',
  },
];

const offerOptions: { value: OfferType; label: string }[] = [
  { value: 'services', label: 'Services' },
  { value: 'products', label: 'Products' },
  { value: 'both', label: 'Both' },
  { value: 'info', label: 'Information only' },
];

const toneOptions: { value: BrandTone; label: string; emoji: string }[] = [
  { value: 'professional', label: 'Professional', emoji: '👔' },
  { value: 'friendly', label: 'Friendly', emoji: '😊' },
  { value: 'bold', label: 'Bold', emoji: '🔥' },
  { value: 'elegant', label: 'Elegant', emoji: '✨' },
  { value: 'playful', label: 'Playful', emoji: '🎨' },
];

function NewProjectPageContent() {
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Get prefill data from wizard store (set by Quick Mode)
  const prefillData = useWizardStore((state) => state.prefillData);
  const setPrefillData = useWizardStore((state) => state.setPrefillData);
  const selectedIndustry = useWizardStore((state) => state.selectedIndustry);
  const teamWizardData = useWizardStore((state) => state.teamWizardData);
  const setTeamWizardData = useWizardStore((state) => state.setTeamWizardData);

  // AI generation hook (from old wizard)
  const {
    generateSuggestions,
    isGeneratingWithAI,
    regenerateNames,
    regenerateDescription,
    regenerateUSP,
    suggestions,
    loadingStates,
  } = useProjectSuggestions('business');

  // Check if we're in AI generation mode - from URL or stored data
  const isAIModeFromUrl = searchParams?.get('mode') === 'ai-generated';
  const [isAIMode, setIsAIMode] = useState(false);

  // Update AI mode when URL or stored data changes
  useEffect(() => {
    if (isAIModeFromUrl || teamWizardData?.isAIMode) {
      setIsAIMode(true);
    }
  }, [isAIModeFromUrl, teamWizardData?.isAIMode]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(() => {
    // Check URL first, then stored data
    const urlId = searchParams?.get('id');
    return urlId || teamWizardData?.projectId || null;
  });
  const [isGenerating, setIsGenerating] = useState(true); // Start true, will be set false after generation or if not AI mode
  const [generationStep, setGenerationStep] = useState<string>('classifying');
  const hasTriggeredGeneration = useRef(false);

  // Regeneration panel state
  const [regenField, setRegenField] = useState<string | null>(null);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // If not AI mode, immediately set isGenerating to false
  useEffect(() => {
    if (!isAIMode) {
      setIsGenerating(false);
    }
  }, [isAIMode]);

  // Generation steps for display
  const generationSteps = [
    { id: 'classifying', label: 'Analyzing your description...' },
    { id: 'generating', label: 'Generating business details...' },
    { id: 'finalizing', label: 'Preparing your project...' },
  ];

  const [projectData, setProjectData] = useState<ProjectData>(() => {
    // Initialize from stored data if available
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
    return {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      businessName: '',
      description: '',
      industry: '',
      targetAudience: '',
      uvp: '',
      goal: '',
      offerType: '',
      brandTone: '',
      businessEmail: '',
      businessPhone: '',
      businessAddress: '',
      website: '',
    };
  });

  // Restore step from stored data
  const [step, setStep] = useState(() => teamWizardData?.step || 1);

  // Save wizard data to store whenever it changes
  useEffect(() => {
    setTeamWizardData({
      ...projectData,
      step,
      isAIMode,
      projectId,
    });
  }, [projectData, step, isAIMode, projectId, setTeamWizardData]);
  
  // Update URL with project ID
  useEffect(() => {
    if (projectId && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('id', projectId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [projectId]);

  // Check if user is team member and create draft project
  useEffect(() => {
    if (userLoaded) {
      const metadata = user?.publicMetadata as { role?: string } | undefined;
      const role = metadata?.role?.toLowerCase();
      const isTeam = role === 'team' || role === 'admin';

      if (!user || !isTeam) {
        router.push('/team/login');
      } else {
        setIsLoading(false);
        
        // Create draft project if none exists
        if (!projectId) {
          createDraftProject();
        }
      }
    }
  }, [user, userLoaded, router, projectId]);
  
  // Create a draft project
  const createDraftProject = async () => {
    try {
      const result = await insertProjectAction({
        name: 'Untitled Project',
        description: '',
        chat: JSON.stringify({ draft: true }),
      });
      
      if (result?.data) {
        setProjectId(result.data);
        console.log('Draft project created:', result.data);
      }
    } catch (error) {
      console.error('Failed to create draft project:', error);
    }
  };

  // Trigger AI generation when prefill data is present
  useEffect(() => {
    if (hasTriggeredGeneration.current || !prefillData || isLoading) return;

    const isAIGenerated = searchParams?.get('mode') === 'ai-generated';
    if (!isAIGenerated) return;

    const userDescription =
      prefillData.description || prefillData.userDescription || '';
    if (!userDescription) return;

    hasTriggeredGeneration.current = true;
    setIsGenerating(true);
    setGenerationStep('classifying');

    // Run async generation
    const runGeneration = async () => {
      // Small delay to show first step
      await new Promise((r) => setTimeout(r, 500));
      setGenerationStep('generating');

      // Call the SAME AI generation as old wizard
      generateSuggestions({
        businessType: prefillData.platformType || 'business',
        industry: selectedIndustry || prefillData.industry || 'general',
        targetAudience: '',
        uniqueSellingPoint: userDescription,
        description: userDescription,
        goals: '',
        domain: selectedIndustry || prefillData.industry || 'general',
        goal: [],
      })
        .then(async (result) => {
          setGenerationStep('finalizing');
          await new Promise((r) => setTimeout(r, 300));

          console.log('[TeamWizard] AI generation result:', result);

          // Apply AI-generated data to form (use whatever we got, fall back to user input)
          const generatedName =
            Array.isArray(result?.names) && result.names.length > 0
              ? result.names[Math.floor(Math.random() * result.names.length)]
              : '';

          setProjectData((prev) => ({
            ...prev,
            businessName: generatedName || prev.businessName,
            description: result?.description || userDescription,
            targetAudience: result?.targetUsers || '',
            uvp: result?.USP || '',
            industry: selectedIndustry || prefillData.industry || '',
            brandTone: (result?.brandTone?.toLowerCase() as BrandTone) || '',
          }));

          // Start at step 1 (Business Details is shown at step 1 in AI mode)
          setStep(1);

          if (
            result &&
            (generatedName || result.description !== userDescription)
          ) {
            toast.success('AI generated business details', {
              description: 'Review and edit the generated info',
            });
          } else {
            toast.info('Using your description', {
              description: 'Fill in the remaining details',
            });
          }
          setIsGenerating(false);
          setPrefillData(null);
        })
        .catch((error) => {
          console.error('AI generation failed:', error);
          // Fallback - use the description directly
          setProjectData((prev) => ({
            ...prev,
            description: userDescription,
            industry: selectedIndustry || prefillData.industry || '',
          }));
          setStep(2);
          setIsGenerating(false);
          setPrefillData(null);
          toast.error('AI generation failed', {
            description: 'Please fill in the business details manually',
          });
        });
    };

    runGeneration();
  }, [
    prefillData,
    isLoading,
    searchParams,
    selectedIndustry,
    generateSuggestions,
    setPrefillData,
  ]);

  const updateField = (field: keyof ProjectData, value: string) => {
    setProjectData((prev) => ({ ...prev, [field]: value }));
  };

  // Watch for suggestion updates and apply to form
  useEffect(() => {
    if (
      suggestions?.names &&
      suggestions.names.length > 0 &&
      loadingStates?.names === false
    ) {
      const newName =
        suggestions.names[Math.floor(Math.random() * suggestions.names.length)];
      if (newName && newName !== projectData.businessName) {
        updateField('businessName', newName);
      }
    }
  }, [suggestions?.names, loadingStates?.names]);

  useEffect(() => {
    if (suggestions?.description && loadingStates?.description === false) {
      if (suggestions.description !== projectData.description) {
        updateField('description', suggestions.description);
      }
    }
  }, [suggestions?.description, loadingStates?.description]);

  useEffect(() => {
    if (suggestions?.USP && loadingStates?.USP === false) {
      if (suggestions.USP !== projectData.uvp) {
        updateField('uvp', suggestions.USP);
      }
    }
  }, [suggestions?.USP, loadingStates?.USP]);

  // Handle regeneration with custom prompt
  const handleRegenerate = async (field: string) => {
    setIsRegenerating(true);
    try {
      const customPrompt = regenPrompt.trim();

      if (field === 'businessName') {
        await regenerateNames(customPrompt || undefined);
      } else if (field === 'description') {
        await regenerateDescription(customPrompt || undefined);
      } else if (field === 'uvp') {
        await regenerateUSP(customPrompt || undefined);
      }

      toast.success(
        `${
          field === 'businessName'
            ? 'Name'
            : field === 'description'
            ? 'Description'
            : 'UVP'
        } regenerated`
      );
      setRegenField(null);
      setRegenPrompt('');
    } catch (error) {
      console.error('Regeneration failed:', error);
      toast.error('Failed to regenerate');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      // Build project data for database
      const chatData = {
        clientInfo: {
          name: projectData.clientName,
          email: projectData.clientEmail,
          phone: projectData.clientPhone,
        },
        businessInfo: {
          name: projectData.businessName,
          industry: projectData.industry,
          description: projectData.description,
          targetAudience: projectData.targetAudience,
          uvp: projectData.uvp,
          goal: projectData.goal,
          offerType: projectData.offerType,
          brandTone: projectData.brandTone,
        },
        contactInfo: {
          email: projectData.businessEmail,
          phone: projectData.businessPhone,
          address: projectData.businessAddress,
          website: projectData.website,
        },
        generatedByAI: isAIMode,
      };

      // If we have a project ID, update via API; otherwise create new
      let finalProjectId = projectId;
      
      if (projectId) {
        // Update existing project via API
        console.log('Updating project:', projectId);
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: projectData.businessName,
            description: projectData.description,
            chat: JSON.stringify(chatData),
            is_draft: false,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update project');
        }
      } else {
        // Create new project
        console.log('Creating new project');
        const result = await insertProjectAction({
          name: projectData.businessName,
          description: projectData.description,
          chat: JSON.stringify(chatData),
        });

        if (result?.serverError) {
          throw new Error(result.serverError);
        }

        if (result?.validationErrors) {
          const errors = Object.values(result.validationErrors).flat().join(', ');
          throw new Error(errors);
        }

        finalProjectId = result?.data;
      }
      
      if (!finalProjectId) {
        throw new Error('No project ID');
      }
      
      console.log('Project saved with ID:', finalProjectId);

      toast.success('Project saved!', {
        description: `Project ID: ${finalProjectId}`,
      });

      // Clear stored wizard data
      setTeamWizardData(null);
      setPrefillData(null);
      
      // Invalidate project queries so dashboard refreshes
      await queryClient.invalidateQueries({ queryKey: ['team-projects'] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Redirect to project page with UID
      router.push(`/team/dashboard/projects/${finalProjectId}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project', {
        description:
          error instanceof Error ? error.message : 'Please try again',
      });
      setIsSaving(false);
    }
  };

  const canProceed = () => {
    // In AI mode, steps 1 and 2 are swapped (Business Details first)
    const clientInfoStep = isAIMode ? 2 : 1;
    const businessInfoStep = isAIMode ? 1 : 2;
    
    switch (step) {
      case clientInfoStep:
        return projectData.clientName && projectData.clientEmail;
      case businessInfoStep:
        return (
          projectData.businessName &&
          projectData.description &&
          projectData.industry
        );
      case 3:
        return (
          projectData.goal && projectData.offerType && projectData.brandTone
        );
      case 4:
        return true; // Contact info is optional
      default:
        return false;
    }
  };

  // Show generation screen while generating (AI mode starts with isGenerating=true)
  const showGenerationScreen = isGenerating && isAIMode;
  const showLoading = (isLoading || !userLoaded) && !showGenerationScreen;

  // Generation screen - show immediately for AI mode
  if (showGenerationScreen) {
    const currentIdx = generationSteps.findIndex(
      (gs) => gs.id === generationStep
    );

    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <TeamHeader />
        <div className="flex-1 flex flex-col items-center justify-center relative mt-16">
          <GradientBackground variant="dashboard" className="fixed inset-0" />

          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--purple)]/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative z-10 flex flex-col items-center w-full max-w-xl mx-auto px-6">
            {/* Glassmorphism card for generation */}
            <div className="w-full rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset] p-6">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-[var(--purple)]/70 flex items-center justify-center shadow-lg shadow-[var(--purple)]/25">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  {/* Spinning ring */}
                  <div className="absolute inset-0 -m-1">
                    <svg
                      className="w-16 h-16 animate-spin"
                      style={{ animationDuration: '3s' }}
                    >
                      <circle
                        cx="32"
                        cy="32"
                        r="30"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="2"
                        strokeDasharray="60 140"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="var(--purple)" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Building your project
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-white/50">
                    AI is generating your business details
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {generationSteps.map((s, i) => {
                  const isActive = s.id === generationStep;
                  const isComplete = i < currentIdx;

                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-[var(--purple)]/10'
                          : isComplete
                          ? 'bg-green-500/5'
                          : 'bg-gray-50 dark:bg-white/[0.02]'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isComplete
                            ? 'bg-green-500 text-white'
                            : isActive
                            ? 'bg-[var(--purple)] text-white'
                            : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/30'
                        }`}
                      >
                        {isComplete ? (
                          <Check className="w-4 h-4" />
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="text-xs font-medium">{i + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium transition-all ${
                          isActive
                            ? 'text-gray-900 dark:text-white'
                            : isComplete
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-400 dark:text-white/40'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <FooterCompact />
      </div>
    );
  }

  // Simple loading state for auth check (non-AI mode)
  if (showLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <GradientBackground variant="dashboard" className="fixed" />
        <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset] p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--purple)]/70 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
            <p className="text-gray-600 dark:text-white/70 font-medium">
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3D card style (same as dashboard)
  const cardClass = [
    'rounded-2xl border border-black/[0.08] dark:border-white/[0.08]',
    'bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl',
    'shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.02)_inset]',
    'dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset]',
  ].join(' ');

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }
      `}</style>

      {/* Dashboard gradient background with flow lines */}
      <GradientBackground variant="dashboard" className="fixed" />

      <div className="min-h-screen font-display relative flex flex-col">
        {/* Same header as dashboard */}
        <TeamHeader />

        {/* Spacer for fixed header */}
        <div className="h-16" />

        {/* Progress bar below header */}
        <div className="sticky top-16 z-50 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-center gap-6">
            {/* Progress */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-10 h-1.5 rounded-full transition-colors ${
                    s <= step
                      ? 'bg-[var(--purple)]'
                      : 'bg-gray-200 dark:bg-white/10'
                  }`}
                />
              ))}
            </div>

            <div className="text-sm text-gray-500 dark:text-white/50">
              Step {step} of 4
            </div>
          </div>
        </div>

        {/* Main content - add bottom padding for fixed nav */}
        <main className="flex-1 min-w-[800px] max-w-5xl mx-auto px-6 py-12 pb-32">
          {/* Step 1: Client Info (or Step 2 in AI mode) */}
          {(isAIMode ? step === 2 : step === 1) && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--purple)]/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-[var(--purple)]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Client Information
                </h1>
                <p className="text-gray-500 dark:text-white/50">
                  Who is this website for?
                </p>
              </div>

              <div className={`${cardClass} p-6 space-y-5`}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                    Client Name *
                  </Label>
                  <Input
                    placeholder="John Smith"
                    value={projectData.clientName}
                    onChange={(e) => updateField('clientName', e.target.value)}
                    className="h-12 bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                    Client Email *
                  </Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={projectData.clientEmail}
                    onChange={(e) => updateField('clientEmail', e.target.value)}
                    className="h-12 bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                    Client Phone
                  </Label>
                  <Input
                    type="tel"
                    placeholder="+49 123 456 7890"
                    value={projectData.clientPhone}
                    onChange={(e) => updateField('clientPhone', e.target.value)}
                    className="h-12 bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Info (or Step 1 in AI mode) */}
          {(isAIMode ? step === 1 : step === 2) && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--purple)]/10 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-7 h-7 text-[var(--purple)]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Business Details
                </h1>
                <p className="text-gray-500 dark:text-white/50">
                  {isAIMode
                    ? 'Review AI-generated details and edit if needed'
                    : 'Tell us about the business'}
                </p>
              </div>

              <div className={`${cardClass} p-6 space-y-5`}>
                {/* Business Name Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                      Business Name *
                    </Label>
                    <div className="flex items-center gap-2">
                      {isAIMode && (
                        <>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
                            AI Generated
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setRegenField(
                                regenField === 'businessName'
                                  ? null
                                  : 'businessName'
                              )
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              regenField === 'businessName'
                                ? 'bg-[var(--purple)]/10 text-[var(--purple)]'
                                : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-[var(--purple)]'
                            }`}
                            title="Regenerate with AI"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <Input
                    placeholder="Acme Consulting"
                    value={projectData.businessName}
                    onChange={(e) =>
                      updateField('businessName', e.target.value)
                    }
                    className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  />
                  {/* Regeneration Card */}
                  {regenField === 'businessName' && (
                    <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-[var(--purple)]/5 to-blue-500/5 border border-[var(--purple)]/20">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-[var(--purple)]" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <p className="text-sm text-gray-600 dark:text-white/70">
                            Regenerate with custom instructions (optional)
                          </p>
                          <Input
                            placeholder="e.g., Make it more modern, include 'Tech' in the name..."
                            value={regenPrompt}
                            onChange={(e) => setRegenPrompt(e.target.value)}
                            className="h-10 text-sm bg-white dark:bg-white/10"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRegenerate('businessName')}
                              disabled={isRegenerating}
                              className="bg-[var(--purple)] hover:bg-[var(--purple)]/90 text-white"
                            >
                              {isRegenerating ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                  Regenerate
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRegenField(null);
                                setRegenPrompt('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                    Industry *
                  </Label>
                  <Select
                    value={projectData.industry}
                    onValueChange={(value) => updateField('industry', value)}
                  >
                    <SelectTrigger className="w-full h-12 px-4 rounded-xl bg-white dark:bg-white/5 border border-gray-300/90 dark:border-white/15 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Select industry..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl">
                      {industries.map((ind) => (
                        <SelectItem 
                          key={ind} 
                          value={ind}
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                      Description *
                    </Label>
                    <div className="flex items-center gap-2">
                      {isAIMode && (
                        <>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
                            AI Generated
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setRegenField(
                                regenField === 'description'
                                  ? null
                                  : 'description'
                              )
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              regenField === 'description'
                                ? 'bg-[var(--purple)]/10 text-[var(--purple)]'
                                : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-[var(--purple)]'
                            }`}
                            title="Regenerate with AI"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <textarea
                    placeholder="What does this business do? Who do they serve?"
                    value={projectData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none"
                  />
                  {/* Regeneration Card */}
                  {regenField === 'description' && (
                    <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-[var(--purple)]/5 to-blue-500/5 border border-[var(--purple)]/20">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-[var(--purple)]" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <p className="text-sm text-gray-600 dark:text-white/70">
                            Regenerate with custom instructions (optional)
                          </p>
                          <Input
                            placeholder="e.g., Make it shorter, focus on sustainability..."
                            value={regenPrompt}
                            onChange={(e) => setRegenPrompt(e.target.value)}
                            className="h-10 text-sm bg-white dark:bg-white/10"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRegenerate('description')}
                              disabled={isRegenerating}
                              className="bg-[var(--purple)] hover:bg-[var(--purple)]/90 text-white"
                            >
                              {isRegenerating ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                  Regenerate
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRegenField(null);
                                setRegenPrompt('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                      Target Audience
                    </Label>
                    {isAIMode && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
                        AI Generated
                      </span>
                    )}
                  </div>
                  <Input
                    placeholder="e.g., Small business owners in Berlin"
                    value={projectData.targetAudience}
                    onChange={(e) =>
                      updateField('targetAudience', e.target.value)
                    }
                    className="h-12 bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  />
                </div>

                {/* UVP Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                      Unique Value Proposition
                    </Label>
                    <div className="flex items-center gap-2">
                      {isAIMode && (
                        <>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
                            AI Generated
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setRegenField(regenField === 'uvp' ? null : 'uvp')
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              regenField === 'uvp'
                                ? 'bg-[var(--purple)]/10 text-[var(--purple)]'
                                : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-[var(--purple)]'
                            }`}
                            title="Regenerate with AI"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <Input
                    placeholder="What makes this business different?"
                    value={projectData.uvp}
                    onChange={(e) => updateField('uvp', e.target.value)}
                    className="h-12 bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  />
                  {/* Regeneration Card */}
                  {regenField === 'uvp' && (
                    <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-[var(--purple)]/5 to-blue-500/5 border border-[var(--purple)]/20">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-[var(--purple)]" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <p className="text-sm text-gray-600 dark:text-white/70">
                            Regenerate with custom instructions (optional)
                          </p>
                          <Input
                            placeholder="e.g., Emphasize quality, mention 24/7 support..."
                            value={regenPrompt}
                            onChange={(e) => setRegenPrompt(e.target.value)}
                            className="h-10 text-sm bg-white dark:bg-white/10"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRegenerate('uvp')}
                              disabled={isRegenerating}
                              className="bg-[var(--purple)] hover:bg-[var(--purple)]/90 text-white"
                            >
                              {isRegenerating ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                  Regenerate
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRegenField(null);
                                setRegenPrompt('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Quick Profile */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--purple)]/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-7 h-7 text-[var(--purple)]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Quick Profile
                </h1>
                <p className="text-gray-500 dark:text-white/50">
                  Goals and brand identity
                </p>
              </div>

              <div className="space-y-6">
                {/* Goal */}
                <div className={`${cardClass} p-6`}>
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70 mb-4 block">
                    Primary Goal *
                  </Label>
                  <div className="space-y-3">
                    {goalOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('goal', option.value)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          projectData.goal === option.value
                            ? 'border-[var(--purple)] bg-[var(--purple)]/5'
                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-white/50">
                          {option.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Offer Type */}
                <div className={`${cardClass} p-6`}>
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70 mb-4 block">
                    What do they offer? *
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {offerOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('offerType', option.value)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          projectData.offerType === option.value
                            ? 'border-[var(--purple)] bg-[var(--purple)]/5'
                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand Tone */}
                <div className={`${cardClass} p-6`}>
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70 mb-4 block">
                    Brand Tone *
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {toneOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('brandTone', option.value)}
                        className={`px-4 py-3 rounded-xl border-2 transition-all ${
                          projectData.brandTone === option.value
                            ? 'border-[var(--purple)] bg-[var(--purple)]/5'
                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                        }`}
                      >
                        <span className="mr-2">{option.emoji}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Contact Details */}
          {step === 4 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--purple)]/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-[var(--purple)]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Business Contact
                </h1>
                <p className="text-gray-500 dark:text-white/50">
                  Contact information for the website (optional)
                </p>
              </div>

              <div className={`${cardClass} p-6 space-y-5`}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                      Business Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="info@business.com"
                        value={projectData.businessEmail}
                        onChange={(e) =>
                          updateField('businessEmail', e.target.value)
                        }
                        className="h-12 pl-11 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                      Business Phone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="tel"
                        placeholder="+49 123 456 7890"
                        value={projectData.businessPhone}
                        onChange={(e) =>
                          updateField('businessPhone', e.target.value)
                        }
                        className="h-12 pl-11 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                    Business Address
                  </Label>
                  <Input
                    placeholder="123 Main Street, Berlin, Germany"
                    value={projectData.businessAddress}
                    onChange={(e) =>
                      updateField('businessAddress', e.target.value)
                    }
                    className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                    Existing Website
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="url"
                      placeholder="https://current-website.com"
                      value={projectData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      className="h-12 pl-11 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-[var(--purple)]/5 to-blue-500/5 rounded-2xl border border-[var(--purple)]/20 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--purple)]" />
                  Project Summary
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-white/50">
                      Client:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {projectData.clientName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-white/50">
                      Business:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {projectData.businessName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-white/50">
                      Industry:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {projectData.industry}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-white/50">
                      Goal:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white capitalize">
                      {projectData.goal}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Fixed Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Back/Cancel button */}
            {step === 1 ? (
              <Link href="/team/dashboard">
                <Button
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className="text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            {/* Continue button */}
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                variant="accent"
                size="lg"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                variant="accent"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Wrap in Suspense to show loading immediately
export default function NewProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 relative">
          <GradientBackground variant="dashboard" className="fixed" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--purple)]/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--purple)]" />
            </div>
            <p className="text-gray-900 dark:text-white font-medium">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <NewProjectPageContent />
    </Suspense>
  );
}
