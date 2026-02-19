/**
 * QuickProfileSelector Component (Updated with Lucide Icons)
 * 
 * A single-step component that collects the 3 essential business choices:
 * 1. Goal (leads / sales / bookings)
 * 2. Offer Type (high-ticket / low-ticket / free)
 * 3. Tone (professional / bold / friendly)
 */

import { useState, useCallback } from 'react';
import { 
  Mail, CreditCard, Calendar, 
  Gem, Tag, Gift, 
  Briefcase, Zap, Smile,
  Check
} from 'lucide-react';
import type { QuickProfile, BusinessGoal, OfferType, BrandTone } from '../types';
import { QUICK_PROFILE_OPTIONS } from '../types';

// Icon mapping
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mail: Mail,
  'credit-card': CreditCard,
  calendar: Calendar,
  gem: Gem,
  tag: Tag,
  gift: Gift,
  briefcase: Briefcase,
  zap: Zap,
  smile: Smile,
};

interface QuickProfileSelectorProps {
  initialProfile?: Partial<QuickProfile>;
  onComplete: (profile: QuickProfile) => void;
  onChange?: (profile: Partial<QuickProfile>) => void;
  isDark?: boolean;
}

interface OptionCardProps<T extends string> {
  value: T;
  selected: boolean;
  option: { label: string; description: string; icon: string };
  onClick: (value: T) => void;
  isDark?: boolean;
}

function OptionCard<T extends string>({ 
  value, 
  selected, 
  option, 
  onClick,
  isDark = false 
}: OptionCardProps<T>) {
  const IconComponent = ICONS[option.icon];
  
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`
        relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200
        ${selected 
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md scale-[1.02]' 
          : isDark 
            ? 'border-gray-700 hover:border-gray-600 bg-gray-800 hover:shadow-sm'
            : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
        }
      `}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}
      
      {/* Icon */}
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center mb-2
        ${selected 
          ? 'bg-indigo-100 dark:bg-indigo-800' 
          : isDark ? 'bg-gray-700' : 'bg-gray-100'
        }
      `}>
        {IconComponent && (
          <IconComponent className={`w-5 h-5 ${selected ? 'text-indigo-600 dark:text-indigo-300' : isDark ? 'text-gray-300' : 'text-gray-600'}`} />
        )}
      </div>
      
      {/* Label */}
      <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {option.label}
      </span>
      
      {/* Description */}
      <span className={`text-xs mt-1 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {option.description}
      </span>
    </button>
  );
}

interface QuestionSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isDark?: boolean;
}

function QuestionSection({ title, subtitle, children, isDark = false }: QuestionSectionProps) {
  return (
    <div className="mb-6">
      <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      {subtitle && (
        <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  );
}

export function QuickProfileSelector({
  initialProfile,
  onComplete,
  onChange,
  isDark = false,
}: QuickProfileSelectorProps) {
  const [goal, setGoal] = useState<BusinessGoal | null>(initialProfile?.goal ?? null);
  const [offerType, setOfferType] = useState<OfferType | null>(initialProfile?.offerType ?? null);
  const [tone, setTone] = useState<BrandTone | null>(initialProfile?.tone ?? null);

  const handleGoalChange = useCallback((value: BusinessGoal) => {
    setGoal(value);
    const partial = { goal: value, offerType, tone };
    onChange?.(partial as Partial<QuickProfile>);
  }, [offerType, tone, onChange]);

  const handleOfferTypeChange = useCallback((value: OfferType) => {
    setOfferType(value);
    const partial = { goal, offerType: value, tone };
    onChange?.(partial as Partial<QuickProfile>);
  }, [goal, tone, onChange]);

  const handleToneChange = useCallback((value: BrandTone) => {
    setTone(value);
    const partial = { goal, offerType, tone: value };
    onChange?.(partial as Partial<QuickProfile>);
  }, [goal, offerType, onChange]);

  const isComplete = goal && offerType && tone;

  const handleContinue = useCallback(() => {
    if (isComplete) {
      onComplete({ goal, offerType, tone });
    }
  }, [goal, offerType, tone, isComplete, onComplete]);

  return (
    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Profile
        </h2>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          3 quick choices to personalize your site
        </p>
      </div>

      {/* Question 1: Goal */}
      <QuestionSection 
        title="What's your main goal?" 
        subtitle="This shapes your call-to-action"
        isDark={isDark}
      >
        {(Object.entries(QUICK_PROFILE_OPTIONS.goal) as [BusinessGoal, typeof QUICK_PROFILE_OPTIONS.goal.leads][]).map(
          ([value, option]) => (
            <OptionCard
              key={value}
              value={value}
              selected={goal === value}
              option={option}
              onClick={handleGoalChange}
              isDark={isDark}
            />
          )
        )}
      </QuestionSection>

      {/* Question 2: Offer Type */}
      <QuestionSection 
        title="What's your price point?" 
        subtitle="This affects your messaging strategy"
        isDark={isDark}
      >
        {(Object.entries(QUICK_PROFILE_OPTIONS.offerType) as [OfferType, typeof QUICK_PROFILE_OPTIONS.offerType['high-ticket']][]).map(
          ([value, option]) => (
            <OptionCard
              key={value}
              value={value}
              selected={offerType === value}
              option={option}
              onClick={handleOfferTypeChange}
              isDark={isDark}
            />
          )
        )}
      </QuestionSection>

      {/* Question 3: Tone */}
      <QuestionSection 
        title="What's your brand vibe?" 
        subtitle="This sets your site's personality"
        isDark={isDark}
      >
        {(Object.entries(QUICK_PROFILE_OPTIONS.tone) as [BrandTone, typeof QUICK_PROFILE_OPTIONS.tone.professional][]).map(
          ([value, option]) => (
            <OptionCard
              key={value}
              value={value}
              selected={tone === value}
              option={option}
              onClick={handleToneChange}
              isDark={isDark}
            />
          )
        )}
      </QuestionSection>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${goal ? 'bg-indigo-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${offerType ? 'bg-indigo-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${tone ? 'bg-indigo-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
      </div>

      {/* Continue button */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={!isComplete}
        className={`
          w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200
          ${isComplete
            ? 'bg-indigo-500 hover:bg-indigo-600 shadow-lg hover:shadow-xl cursor-pointer'
            : 'bg-gray-400 cursor-not-allowed opacity-50'
          }
        `}
      >
        Continue →
      </button>
    </div>
  );
}

export default QuickProfileSelector;
