import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n';
import type { ProjectWizardStep } from '@/types/project-config';
import { ChevronLeft, ChevronRight, Rocket } from 'lucide-react';

interface WizardHeaderProps {
  currentStep: ProjectWizardStep;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled: boolean;
  isLastStep: boolean;
  onFinish: () => void;
}

export function WizardHeader({
  currentStep,
  onBack,
  onNext,
  isNextDisabled,
  isLastStep,
  onFinish,
}: WizardHeaderProps) {
  const { t } = useTranslations();
  const showBackButton = currentStep !== 'template';

  return (
    <Card className="border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('app.back')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLastStep ? (
            <Button onClick={onFinish} disabled={isNextDisabled}>
              <Rocket className="h-4 w-4 mr-2" />
              {t('app.createProject')}
            </Button>
          ) : (
            <Button onClick={onNext} disabled={isNextDisabled}>
              {t('app.continue')}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
