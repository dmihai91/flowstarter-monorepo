import { FormTextarea } from '@/components/ui/form-textarea';
import {
  RESPONSE_STREAM_CONFIGS,
  ResponseStream,
} from '@/components/ui/response-stream';
import { DESCRIPTION_MAX, DESCRIPTION_MIN } from '@/lib/content-limits';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface AssistantInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  isFocused?: boolean;
  isStreaming?: boolean;
  isGenerating?: boolean;
  streamingText?: string;
  placeholderText?: string;
  placeholderKey?: number;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  generationStep?: string;
  // Additional props for extended functionality
  ref?: React.Ref<HTMLTextAreaElement>;
  hideLabel?: boolean;
  showLabel?: boolean;
  error?: string | null;
  touched?: boolean;
  moderationError?: unknown;
  onDismissModeration?: () => void;
  enableImageUpload?: boolean;
  images?: Array<{ url: string; name: string }>;
  onImagesChange?: (images: Array<{ url: string; name: string }>) => void;
  showGenerateButton?: boolean;
  onGenerate?: () => void;
  generateButtonText?: string;
  generatingButtonText?: string;
  generateButtonDisabled?: boolean;
  showValidationFeedback?: boolean;
  validationStatus?: 'sufficient' | 'insufficient' | null;
  validationMessage?: string;
  animatedPlaceholders?: string[];
  placeholderPrefix?: string;
  // Standard HTML textarea props
  placeholder?: string;
  rows?: number;
  className?: string;
  // Generate button integration
  showInlineGenerateButton?: boolean;
  onInlineGenerate?: () => void;
  inlineGenerateButtonDisabled?: boolean;
}

export function AssistantInput({
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  isFocused = false,
  isStreaming = false,
  isGenerating = false,
  streamingText = '',
  placeholderText,
  placeholderKey = 0,
  inputRef,
  placeholder,
  rows = 4,
  className,
}: AssistantInputProps) {
  const { t } = useTranslations();

  return (
    <div className={cn('w-full relative', className)}>
      <div className="relative">
        {/* Animated Placeholder */}
        {!value.trim() && !isFocused && !isStreaming && placeholderText && (
          <div className="pointer-events-none absolute left-0 top-2 px-2 text-sm z-20">
            <span className="text-gray-400 dark:text-gray-500">
              {t('common.eg')}{' '}
            </span>
            <ResponseStream
              key={placeholderKey}
              textStream={placeholderText}
              {...RESPONSE_STREAM_CONFIGS.placeholder}
              as="span"
              className="text-gray-400 dark:text-gray-500"
            />
          </div>
        )}

        {/* Final Result Streaming */}
        {!isGenerating && isStreaming && streamingText && (
          <div className="pointer-events-none absolute left-0 top-2 px-2 text-sm text-gray-700 dark:text-gray-300 z-20">
            <ResponseStream
              textStream={streamingText}
              {...RESPONSE_STREAM_CONFIGS.finalResult}
              as="div"
            />
          </div>
        )}

        <FormTextarea
          ref={inputRef}
          id="assistant-input"
          name="assistantInput"
          required
          minLength={DESCRIPTION_MIN}
          maxLength={DESCRIPTION_MAX}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          rows={rows}
          placeholder={placeholder}
          className={cn(
            'w-full text-base min-h-[50px] max-h-[100px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent! px-2 py-2 shadow-none outline-none wrap-break-word overflow-wrap-anywhere',
            isStreaming && streamingText && !isGenerating
              ? 'text-transparent'
              : 'text-gray-900 dark:text-white',
            'placeholder:text-gray-400 dark:placeholder:text-gray-300'
          )}
          disabled={disabled}
          showError={false}
        />
      </div>
    </div>
  );
}

AssistantInput.displayName = 'AssistantInput';
