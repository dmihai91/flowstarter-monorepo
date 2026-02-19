import type { GenerationStep } from '@/app/(dynamic-pages)/(main-pages)/components/FlowstarterAssistant';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { AssistantInput } from './AssistantInput';
import { GenerationProgress } from './GenerationProgress';
import { ImageUploadButton } from './ImageUploadButton';
import { QuickModePill } from './QuickModePill';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  disabled: boolean;
  isFocused: boolean;
  isStreaming: boolean;
  isGenerating: boolean;
  streamingText: string;
  currentStep?: string | null;
  generationSteps?: GenerationStep[];
  placeholderText: string;
  placeholderKey: number;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  validationStatus: 'sufficient' | 'insufficient' | null;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showInlineGenerateButton?: boolean;
  onInlineGenerate?: () => void;
  inlineGenerateButtonDisabled?: boolean;
}

export function InputArea({
  value,
  onChange,
  onFocus,
  onBlur,
  disabled,
  isFocused,
  isStreaming,
  isGenerating,
  streamingText,
  currentStep,
  generationSteps,
  placeholderText,
  placeholderKey,
  inputRef,
  isUploading,
  fileInputRef,
  onImageClick,
  onFileChange,
  showInlineGenerateButton = false,
  onInlineGenerate,
  inlineGenerateButtonDisabled = false,
}: InputAreaProps) {
  const { t } = useTranslations();

  return (
    <div className="flex-1 space-y-4 min-w-0">
      {/* Unified container for input and action buttons */}
      <div
        className={cn(
          'glass-3d rounded-[16px] px-4 py-4 sm:px-[24px] sm:py-[16px] bg-white/20 dark:bg-[hsl(240,9%,22%)]/20 backdrop-blur-xl border border-white/40 dark:border-white/40 min-w-0 overflow-hidden transition-all duration-500 shadow-lg hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08)]',
          isGenerating &&
            'border-[#c1c8ff] dark:border-[#c1c8ff] shadow-[0_0_12px_rgba(193,200,255,0.25),0_0_24px_rgba(193,200,255,0.15)]'
        )}
      >
        {/* Animated glowing effect overlay when generating */}
        {isGenerating && (
          <>
            {/* Pulsing glow layer */}
            <div className="absolute -inset-1 rounded-[16px] bg-gradient-to-r from-[#c1c8ff]/20 via-[#a5b4ff]/30 to-[#c1c8ff]/20 blur-xl animate-glow-pulse pointer-events-none -z-10" />
            {/* Rotating gradient layer */}
            <div className="absolute -inset-1 rounded-[16px] opacity-40 pointer-events-none -z-10 animate-glow-rotate">
              <div className="absolute inset-0 rounded-[16px] bg-gradient-conic from-[#c1c8ff] via-[#8b9dff] via-[#c1c8ff] via-[#a5b4ff] to-[#c1c8ff] blur-lg" />
            </div>
          </>
        )}
        <QuickModePill />
        <div className="text-sm font-normal leading-normal text-gray-600 dark:text-gray-400 mb-3 px-1 space-y-0.5">
          <p>{t('assistant.input.description')}</p>
          <p>{t('assistant.input.description.details')}</p>
        </div>
        <AssistantInput
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          isFocused={isFocused}
          isStreaming={isStreaming}
          isGenerating={isGenerating}
          streamingText={streamingText}
          placeholderText={placeholderText}
          placeholderKey={placeholderKey}
          inputRef={inputRef}
          showInlineGenerateButton={false}
        />

        {/* Bottom action bar with image upload and generate button */}
        <div className="mt-[20px] flex items-center justify-between gap-2 sm:gap-4">
          <ImageUploadButton
            isUploading={isUploading}
            isGenerating={isGenerating}
            onClick={onImageClick}
            fileInputRef={fileInputRef}
            onFileChange={onFileChange}
          />

          {showInlineGenerateButton && onInlineGenerate && (
            <button
              onClick={onInlineGenerate}
              disabled={inlineGenerateButtonDisabled || isGenerating}
              className="px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
              type="button"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-30"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-100"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="whitespace-nowrap">
                    {t('assistant.button.generating')}
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                  </svg>
                  <span className="whitespace-nowrap">
                    {t('assistant.button.generate')}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      {isGenerating &&
        currentStep &&
        generationSteps &&
        generationSteps.length > 0 && (
          <GenerationProgress
            currentStep={currentStep}
            steps={generationSteps}
          />
        )}
    </div>
  );
}
