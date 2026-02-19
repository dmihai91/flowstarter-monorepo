import {
  RESPONSE_STREAM_CONFIGS,
  ResponseStream,
} from '@/components/ui/response-stream';
import { Loader2 } from 'lucide-react';

export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message?: string;
}

interface GenerationProgressProps {
  currentStep: string;
  steps: GenerationStep[];
  className?: string;
}

export function GenerationProgress({
  currentStep,
  steps,
  className = '',
}: GenerationProgressProps) {
  const step = steps.find((s) => s.id === currentStep);

  if (!step) return null;

  return (
    <div className={`flex items-start gap-2 px-1 py-2 text-sm ${className}`}>
      <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-blue-500 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <ResponseStream
          key={currentStep}
          textStream={step.label}
          {...RESPONSE_STREAM_CONFIGS.generationStatus}
          as="div"
          className="text-gray-700 dark:text-gray-300 break-words leading-tight"
        />
        {step.message && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <ResponseStream
              key={`${currentStep}-message`}
              textStream={step.message}
              {...RESPONSE_STREAM_CONFIGS.generationStatus}
              as="span"
            />
          </div>
        )}
      </div>
    </div>
  );
}
