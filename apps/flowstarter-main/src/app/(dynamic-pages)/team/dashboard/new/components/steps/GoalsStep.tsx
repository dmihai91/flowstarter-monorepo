'use client';

import { Target, Check } from 'lucide-react';
import { StepHeader } from '../StepHeader';
import { cardClass, ProjectData, goalOptions, offerOptions, toneOptions, BusinessGoal, OfferType, BrandTone } from '../../constants';

interface GoalsStepProps {
  projectData: ProjectData;
  updateField: (field: keyof ProjectData, value: string) => void;
}

export function GoalsStep({ projectData, updateField }: GoalsStepProps) {
  return (
    <div className="space-y-8">
      <StepHeader icon={Target} title="Website Goals" subtitle="What should this website achieve?" />

      <div className={`${cardClass} p-6 space-y-6`}>
        {/* Primary Goal */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-white/70">Primary Goal *</label>
          <div className="grid gap-3">
            {goalOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('goal', option.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  projectData.goal === option.value
                    ? 'border-[var(--purple)] bg-[var(--purple)]/5'
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                    <div className="text-sm text-gray-500 dark:text-white/50">{option.desc}</div>
                  </div>
                  {projectData.goal === option.value && (
                    <div className="w-6 h-6 rounded-full bg-[var(--purple)] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Offer Type */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-white/70">What do they offer? *</label>
          <div className="flex flex-wrap gap-2">
            {offerOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('offerType', option.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  projectData.offerType === option.value
                    ? 'bg-[var(--purple)] text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/15'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Tone */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-white/70">Brand Tone *</label>
          <div className="flex flex-wrap gap-2">
            {toneOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('brandTone', option.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  projectData.brandTone === option.value
                    ? 'bg-[var(--purple)] text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/15'
                }`}
              >
                <span className="mr-1.5">{option.emoji}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
