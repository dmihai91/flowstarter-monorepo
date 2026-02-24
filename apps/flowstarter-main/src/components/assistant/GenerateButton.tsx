import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { Sparkles, Wand2 } from 'lucide-react';

interface GenerateButtonProps {
  isGenerating: boolean;
  isDisabled: boolean;
  onClick: () => void;
  variant?: 'mobile' | 'desktop';
}

export function GenerateButton({
  isGenerating,
  isDisabled,
  onClick,
}: GenerateButtonProps) {
  const { t } = useTranslations();

  return (
    <Button
      variant="accent"
      onClick={onClick}
      disabled={isDisabled}
      size="sm"
      className={`relative overflow-hidden transition-all duration-200 ${
        isGenerating ? 'cursor-not-allowed' : ''
      }`}
    >
      {isGenerating && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-[var(--purple)] via-pink-500 via-orange-500 to-yellow-500 opacity-50 animate-shimmer-rainbow" />
      )}
      {isGenerating ? (
        <>
          {t('assistant.button.generating')}
          <Sparkles className="h-3.5 w-3.5 ml-2 animate-spin" />
        </>
      ) : (
        <>
          {t('assistant.button.generate')}
          <Wand2 className="h-3.5 w-3.5 ml-2" />
        </>
      )}
    </Button>
  );
}
