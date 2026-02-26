'use client';

import { Button } from '@/components/ui/button';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useWizardStore } from '@/store/wizard-store';
import { useProjectSuggestions } from '@/hooks/wizard/useProjectSuggestions';
import { toast } from 'sonner';
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
  Check
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
  { value: 'leads', label: 'Get Leads', desc: 'Collect contact information from potential clients' },
  { value: 'bookings', label: 'Get Bookings', desc: 'Allow clients to schedule appointments' },
  { value: 'sales', label: 'Sell Products', desc: 'Sell products or services online' },
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

export default function NewProjectPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get prefill data from wizard store (set by Quick Mode)
  const prefillData = useWizardStore((state) => state.prefillData);
  const setPrefillData = useWizardStore((state) => state.setPrefillData);
  const selectedIndustry = useWizardStore((state) => state.selectedIndustry);
  
  // AI generation hook (from old wizard)
  const { generateSuggestions, isGeneratingWithAI } = useProjectSuggestions('business');
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasTriggeredGeneration = useRef(false);
  
  const [projectData, setProjectData] = useState<ProjectData>({
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
  });

  // Check if user is team member
  useEffect(() => {
    if (userLoaded) {
      const metadata = user?.publicMetadata as { role?: string } | undefined;
      const role = metadata?.role?.toLowerCase();
      const isTeam = role === 'team' || role === 'admin';
      
      if (!user || !isTeam) {
        router.push('/team/login');
      } else {
        setIsLoading(false);
      }
    }
  }, [user, userLoaded, router]);

  // Trigger AI generation when prefill data is present
  useEffect(() => {
    if (hasTriggeredGeneration.current || !prefillData || isLoading) return;
    
    const isAIGenerated = searchParams.get('mode') === 'ai-generated';
    if (!isAIGenerated) return;
    
    const userDescription = prefillData.description || prefillData.userDescription || '';
    if (!userDescription) return;
    
    hasTriggeredGeneration.current = true;
    setIsGenerating(true);
    
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
    }).then((result) => {
      if (result) {
        // Apply generated data to form
        setProjectData(prev => ({
          ...prev,
          businessName: Array.isArray(result.names) && result.names.length > 0 
            ? result.names[Math.floor(Math.random() * result.names.length)] 
            : prev.businessName,
          description: result.description || userDescription,
          targetAudience: result.targetUsers || '',
          uvp: result.USP || '',
          industry: selectedIndustry || prefillData.industry || '',
        }));
        
        // Skip to step 2 (business details)
        setStep(2);
        
        toast.success('AI generated project details', {
          description: 'Review and complete the remaining fields',
        });
      }
      setIsGenerating(false);
      setPrefillData(null);
    }).catch(() => {
      setIsGenerating(false);
      setPrefillData(null);
    });
  }, [prefillData, isLoading, searchParams, selectedIndustry, generateSuggestions, setPrefillData]);

  const updateField = (field: keyof ProjectData, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    // TODO: Save to database and create project
    console.log('Project data:', projectData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Redirect to dashboard or editor
    router.push('/team/dashboard');
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return projectData.clientName && projectData.clientEmail;
      case 2:
        return projectData.businessName && projectData.description && projectData.industry;
      case 3:
        return projectData.goal && projectData.offerType && projectData.brandTone;
      case 4:
        return true; // Contact info is optional
      default:
        return false;
    }
  };

  if (isLoading || !userLoaded || isGenerating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
        {isGenerating && (
          <div className="text-center">
            <p className="text-gray-900 dark:text-white font-medium">Generating project details...</p>
            <p className="text-sm text-gray-500 dark:text-white/50">AI is analyzing your description</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Outfit', system-ui, sans-serif; }
      `}</style>
      
      <div className="min-h-screen font-display relative">
        {/* Gradient background with flow lines */}
        <GradientBackground variant="dashboard" className="fixed" />
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/team/dashboard"
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </div>
            
            {/* Progress */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-1 rounded-full transition-colors ${
                    s <= step ? 'bg-[var(--purple)]' : 'bg-gray-200 dark:bg-white/10'
                  }`}
                />
              ))}
            </div>
            
            <div className="text-sm text-gray-500 dark:text-white/50">
              Step {step} of 4
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-2xl mx-auto px-6 py-12">
          {/* Step 1: Client Info */}
          {step === 1 && (
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

              <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200/50 dark:border-white/10 p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                    Client Name *
                  </Label>
                  <Input
                    placeholder="John Smith"
                    value={projectData.clientName}
                    onChange={(e) => updateField('clientName', e.target.value)}
                    className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
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
                    className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
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
                    className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--purple)]/10 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-7 h-7 text-[var(--purple)]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Business Details
                </h1>
                <p className="text-gray-500 dark:text-white/50">
                  Tell us about the business
                </p>
              </div>

              <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200/50 dark:border-white/10 p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                    Business Name *
                  </Label>
                  <Input
                    placeholder="Acme Consulting"
                    value={projectData.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                    Industry *
                  </Label>
                  <select
                    value={projectData.industry}
                    onChange={(e) => updateField('industry', e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                  >
                    <option value="">Select industry...</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                    Description *
                  </Label>
                  <textarea
                    placeholder="What does this business do? Who do they serve?"
                    value={projectData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                    Target Audience
                  </Label>
                  <Input
                    placeholder="e.g., Small business owners in Berlin"
                    value={projectData.targetAudience}
                    onChange={(e) => updateField('targetAudience', e.target.value)}
                    className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-white/70">
                    Unique Value Proposition
                  </Label>
                  <Input
                    placeholder="What makes this business different?"
                    value={projectData.uvp}
                    onChange={(e) => updateField('uvp', e.target.value)}
                    className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  />
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
                <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200/50 dark:border-white/10 p-6">
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
                        <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                        <div className="text-sm text-gray-500 dark:text-white/50">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Offer Type */}
                <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200/50 dark:border-white/10 p-6">
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
                        <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand Tone */}
                <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200/50 dark:border-white/10 p-6">
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
                        <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
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

              <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200/50 dark:border-white/10 p-6 space-y-5">
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
                        onChange={(e) => updateField('businessEmail', e.target.value)}
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
                        onChange={(e) => updateField('businessPhone', e.target.value)}
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
                    onChange={(e) => updateField('businessAddress', e.target.value)}
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
                    <span className="text-gray-500 dark:text-white/50">Client:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{projectData.clientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-white/50">Business:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{projectData.businessName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-white/50">Industry:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{projectData.industry}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-white/50">Goal:</span>
                    <span className="ml-2 text-gray-900 dark:text-white capitalize">{projectData.goal}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className="text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}
            
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-[var(--purple)] to-blue-500 hover:from-[var(--purple)]/90 hover:to-blue-500/90 text-white font-semibold rounded-xl shadow-lg shadow-[var(--purple)]/20 h-11 px-6"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-gradient-to-r from-[var(--purple)] to-blue-500 hover:from-[var(--purple)]/90 hover:to-blue-500/90 text-white font-semibold rounded-xl shadow-lg shadow-[var(--purple)]/20 h-11 px-6"
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
        </main>
      </div>
    </>
  );
}
