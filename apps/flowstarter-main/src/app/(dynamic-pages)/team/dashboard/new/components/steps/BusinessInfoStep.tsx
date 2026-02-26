'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Sparkles, AlertCircle } from 'lucide-react';
import { StepHeader } from '../StepHeader';
import { RegenerationCard } from '../RegenerationCard';
import { cardClass, ProjectData, industries } from '../../constants';

interface BusinessInfoStepProps {
  projectData: ProjectData;
  updateField: (field: keyof ProjectData, value: string) => void;
  handleBusinessNameChange: (value: string) => void;
  isAIMode: boolean;
  nameError: string | null;
  regenField: string | null;
  setRegenField: (field: string | null) => void;
  regenPrompt: string;
  setRegenPrompt: (value: string) => void;
  isRegenerating: boolean;
  handleRegenerate: (field: string, prompt?: string) => void;
}

export function BusinessInfoStep({
  projectData,
  updateField,
  handleBusinessNameChange,
  isAIMode,
  nameError,
  regenField,
  setRegenField,
  regenPrompt,
  setRegenPrompt,
  isRegenerating,
  handleRegenerate,
}: BusinessInfoStepProps) {
  const subtitle = isAIMode
    ? 'Review AI-generated details and edit if needed'
    : 'Tell us about the business';

  return (
    <div className="space-y-8">
      <StepHeader icon={Building2} title="Business Details" subtitle={subtitle} />

      <div className={`${cardClass} p-6 space-y-5`}>
        {/* Business Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Business Name *</Label>
            {isAIMode && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
                  AI Generated
                </span>
                <button
                  type="button"
                  onClick={() => setRegenField(regenField === 'businessName' ? null : 'businessName')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    regenField === 'businessName'
                      ? 'bg-[var(--purple)]/10 text-[var(--purple)]'
                      : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-[var(--purple)]'
                  }`}
                  title="Regenerate with AI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <Input
            placeholder="Acme Consulting"
            value={projectData.businessName}
            onChange={(e) => handleBusinessNameChange(e.target.value)}
            className={`h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 ${
              nameError ? 'border-red-500 dark:border-red-500' : ''
            }`}
          />
          {nameError && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {nameError}
            </p>
          )}
          {regenField === 'businessName' && (
            <RegenerationCard
              prompt={regenPrompt}
              setPrompt={setRegenPrompt}
              onRegenerate={() => handleRegenerate('businessName', regenPrompt)}
              onClose={() => setRegenField(null)}
              isRegenerating={isRegenerating}
              placeholder="e.g., Make it more modern, include 'Tech'..."
            />
          )}
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Industry *</Label>
          <Select value={projectData.industry} onValueChange={(v) => updateField('industry', v)}>
            <SelectTrigger className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Business Description *</Label>
            {isAIMode && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
                  AI Generated
                </span>
                <button
                  type="button"
                  onClick={() => setRegenField(regenField === 'description' ? null : 'description')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    regenField === 'description'
                      ? 'bg-[var(--purple)]/10 text-[var(--purple)]'
                      : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-[var(--purple)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <Textarea
            placeholder="Describe the business..."
            value={projectData.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="min-h-[100px] bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 resize-none"
          />
          {regenField === 'description' && (
            <RegenerationCard
              prompt={regenPrompt}
              setPrompt={setRegenPrompt}
              onRegenerate={() => handleRegenerate('description', regenPrompt)}
              onClose={() => setRegenField(null)}
              isRegenerating={isRegenerating}
              placeholder="e.g., Focus on sustainability, add more details..."
            />
          )}
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Target Audience</Label>
          <Input
            placeholder="e.g., Small business owners, young professionals"
            value={projectData.targetAudience}
            onChange={(e) => updateField('targetAudience', e.target.value)}
            className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
          />
        </div>

        {/* UVP */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 dark:text-white/70">Unique Value Proposition</Label>
            {isAIMode && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
                  AI Generated
                </span>
                <button
                  type="button"
                  onClick={() => setRegenField(regenField === 'uvp' ? null : 'uvp')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    regenField === 'uvp'
                      ? 'bg-[var(--purple)]/10 text-[var(--purple)]'
                      : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-[var(--purple)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <Textarea
            placeholder="What makes this business unique?"
            value={projectData.uvp}
            onChange={(e) => updateField('uvp', e.target.value)}
            className="min-h-[80px] bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 resize-none"
          />
          {regenField === 'uvp' && (
            <RegenerationCard
              prompt={regenPrompt}
              setPrompt={setRegenPrompt}
              onRegenerate={() => handleRegenerate('uvp', regenPrompt)}
              onClose={() => setRegenField(null)}
              isRegenerating={isRegenerating}
              placeholder="e.g., Emphasize customer service..."
            />
          )}
        </div>
      </div>
    </div>
  );
}
