import { AlertCircle, CheckCircle2 } from 'lucide-react';

export type ValidationStatus = 'sufficient' | 'insufficient' | null;

interface ValidationIndicatorProps {
  status: ValidationStatus;
  sufficientMessage: string;
  insufficientMessage: string;
  className?: string;
}

export function ValidationIndicator({
  status,
  sufficientMessage,
  insufficientMessage,
  className = '',
}: ValidationIndicatorProps) {
  if (!status) return null;

  return (
    <div
      className={`flex items-center justify-end gap-2 text-xs mt-2 mb-1 ${className}`}
    >
      {status === 'sufficient' && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>{sufficientMessage}</span>
        </div>
      )}
      {status === 'insufficient' && (
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span>{insufficientMessage}</span>
        </div>
      )}
    </div>
  );
}
