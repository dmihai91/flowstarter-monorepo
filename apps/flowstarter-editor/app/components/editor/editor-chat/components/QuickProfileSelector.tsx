/**
 * QuickProfileSelector Component
 * 
 * Collects 3 essential business choices:
 * 1. Goal (leads / sales / bookings)
 * 2. Price point (premium / accessible / free-first)
 * 3. Brand tone (professional / bold / friendly)
 * 
 * Adapts copy for team vs client context.
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

const ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  mail: Mail, 'credit-card': CreditCard, calendar: Calendar,
  gem: Gem, tag: Tag, gift: Gift,
  briefcase: Briefcase, zap: Zap, smile: Smile,
};

interface QuickProfileSelectorProps {
  initialProfile?: Partial<QuickProfile>;
  onComplete: (profile: QuickProfile) => void;
  onChange?: (profile: Partial<QuickProfile>) => void;
  isDark?: boolean;
  isTeam?: boolean;
}

interface OptionCardProps<T extends string> {
  value: T;
  selected: boolean;
  option: { label: string; description: string; icon: string };
  onClick: (value: T) => void;
  isDark?: boolean;
}

function OptionCard<T extends string>({ value, selected, option, onClick, isDark = false }: OptionCardProps<T>) {
  const IconComponent = ICONS[option.icon];
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className="relative flex items-center gap-3 rounded-xl transition-all duration-200 text-left"
      style={{
        padding: '12px 14px',
        border: selected 
          ? '2px solid var(--purple, #4D5DD9)' 
          : isDark ? '2px solid rgba(255,255,255,0.08)' : '2px solid rgba(0,0,0,0.08)',
        background: selected
          ? isDark ? 'rgba(77, 93, 217, 0.12)' : 'rgba(77, 93, 217, 0.06)'
          : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(12px)',
        transform: selected ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {selected && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'var(--purple, #4D5DD9)' }}>
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: selected 
            ? isDark ? 'rgba(77, 93, 217, 0.2)' : 'rgba(77, 93, 217, 0.1)'
            : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        }}>
        {IconComponent && (
          <IconComponent className="w-4 h-4" 
            style={{ color: selected ? 'var(--purple, #4D5DD9)' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }} />
        )}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm leading-tight"
          style={{ color: isDark ? '#fafafa' : '#09090b' }}>{option.label}</div>
        <div className="text-xs mt-0.5 leading-snug"
          style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}>{option.description}</div>
      </div>
    </button>
  );
}

function QuestionSection({ title, subtitle, children, isDark = false }: {
  title: string; subtitle?: string; children: React.ReactNode; isDark?: boolean;
}) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold mb-0.5" style={{ color: isDark ? '#fafafa' : '#09090b' }}>{title}</h3>
      {subtitle && <p className="text-xs mb-2.5" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>{subtitle}</p>}
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export function QuickProfileSelector({ initialProfile, onComplete, onChange, isDark = false, isTeam = false }: QuickProfileSelectorProps) {
  const [goal, setGoal] = useState<BusinessGoal | null>(initialProfile?.goal ?? null);
  const [offerType, setOfferType] = useState<OfferType | null>(initialProfile?.offerType ?? null);
  const [tone, setTone] = useState<BrandTone | null>(initialProfile?.tone ?? null);

  const handleGoalChange = useCallback((value: BusinessGoal) => {
    setGoal(value);
    onChange?.({ goal: value, offerType, tone } as Partial<QuickProfile>);
  }, [offerType, tone, onChange]);

  const handleOfferTypeChange = useCallback((value: OfferType) => {
    setOfferType(value);
    onChange?.({ goal, offerType: value, tone } as Partial<QuickProfile>);
  }, [goal, tone, onChange]);

  const handleToneChange = useCallback((value: BrandTone) => {
    setTone(value);
    onChange?.({ goal, offerType, tone: value } as Partial<QuickProfile>);
  }, [goal, offerType, onChange]);

  const isComplete = goal && offerType && tone;

  const handleContinue = useCallback(() => {
    if (isComplete) onComplete({ goal, offerType, tone });
  }, [goal, offerType, tone, isComplete, onComplete]);

  return (
    <div className="rounded-2xl" style={{
      padding: '20px',
      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
      backdropFilter: 'blur(16px)',
    }}>
      <div className="mb-5">
        <h2 className="text-base font-bold mb-1" style={{ color: isDark ? '#fafafa' : '#09090b' }}>
          {isTeam ? 'Client Profile' : 'Quick Profile'}
        </h2>
        <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)' }}>
          {isTeam ? '3 quick choices to personalize their site' : '3 quick choices to personalize your site'}
        </p>
      </div>

      <QuestionSection title={isTeam ? "Client's main goal?" : "What's your main goal?"} subtitle={isTeam ? "Shapes their call-to-action" : "Shapes your call-to-action"} isDark={isDark}>
        {(Object.entries(QUICK_PROFILE_OPTIONS.goal) as [BusinessGoal, typeof QUICK_PROFILE_OPTIONS.goal.leads][]).map(([value, option]) => (
          <OptionCard key={value} value={value} selected={goal === value} option={option} onClick={handleGoalChange} isDark={isDark} />
        ))}
      </QuestionSection>

      <QuestionSection title={isTeam ? "Client's price point?" : "What's your price point?"} subtitle={isTeam ? "Affects their messaging" : "Affects your messaging"} isDark={isDark}>
        {(Object.entries(QUICK_PROFILE_OPTIONS.offerType) as [OfferType, typeof QUICK_PROFILE_OPTIONS.offerType['high-ticket']][]).map(([value, option]) => (
          <OptionCard key={value} value={value} selected={offerType === value} option={option} onClick={handleOfferTypeChange} isDark={isDark} />
        ))}
      </QuestionSection>

      <QuestionSection title={isTeam ? "Brand vibe?" : "What's your brand vibe?"} subtitle={isTeam ? "Sets the site's personality" : "Sets your site's personality"} isDark={isDark}>
        {(Object.entries(QUICK_PROFILE_OPTIONS.tone) as [BrandTone, typeof QUICK_PROFILE_OPTIONS.tone.professional][]).map(([value, option]) => (
          <OptionCard key={value} value={value} selected={tone === value} option={option} onClick={handleToneChange} isDark={isDark} />
        ))}
      </QuestionSection>

      <button type="button" onClick={handleContinue} disabled={!isComplete}
        className="w-full py-2.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200"
        style={{
          background: isComplete ? 'var(--purple, #4D5DD9)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
          color: isComplete ? '#fff' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          cursor: isComplete ? 'pointer' : 'not-allowed',
          boxShadow: isComplete ? '0 4px 12px rgba(77, 93, 217, 0.25)' : 'none',
        }}>
        Continue
      </button>
    </div>
  );
}

export default QuickProfileSelector;
