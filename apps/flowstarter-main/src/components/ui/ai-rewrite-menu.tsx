import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { MagicWandIcon } from './magic-wand-icon';
import { Textarea } from './textarea';

export type AiRewriteAction =
  | 'regenerate'
  | 'shorter'
  | 'punchy'
  | 'alternatives'
  | 'benefits'
  | 'custom';

interface AiRewriteMenuProps {
  onSelect: (action: AiRewriteAction) => void;
  className?: string;
  align?: 'start' | 'end' | 'center';
  disabled?: boolean;
  loading?: boolean;
  showBenefits?: boolean;
  label?: string;
  onCustomPrompt?: (prompt: string) => void;
  isGlobalGenerating?: boolean;
  presetsDisabled?: boolean;
  customPlaceholder?: string;
}

export function AiRewriteMenu({
  onSelect,
  className,
  align = 'end',
  disabled,
  loading,
  showBenefits,
  label,
  onCustomPrompt,
  isGlobalGenerating = false,
  presetsDisabled = false,
  customPlaceholder,
}: AiRewriteMenuProps) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showError, setShowError] = useState(false);

  const isCustomPromptValid = (() => {
    const normalized = customPrompt.replace(/\s+/g, ' ').trim();
    if (!normalized) return false;

    // Split by sentence-ending punctuation or newlines
    const withPunctuation = normalized.match(/[^.!?\n]+[.!?]+/g) || [];

    // If no punctuation found, treat the whole text as one sentence
    // and check if it's reasonable length (not too short)
    if (withPunctuation.length === 0) {
      const words = normalized.split(/\s+/).length;
      return words >= 3; // At least 3 words to be valid
    }

    // Check remaining text after punctuated sentences
    const lastPunctuationIndex = normalized.lastIndexOf(
      withPunctuation[withPunctuation.length - 1]
    );
    const remainingText = normalized
      .substring(
        lastPunctuationIndex +
          withPunctuation[withPunctuation.length - 1].length
      )
      .trim();

    // Count total sentences (punctuated + unpunctuated remainder if meaningful)
    let count = withPunctuation.length;
    if (remainingText && remainingText.split(/\s+/).length >= 3) {
      count++;
    }

    return count >= 1 && count <= 2;
  })();

  const isButtonDisabled = disabled || loading || isGlobalGenerating;
  const showLoadingSpinner = loading && !isGlobalGenerating;

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            aria-label={label}
            disabled={isButtonDisabled}
            className={cn(
              // Premium glass-style button
              'h-10 px-4 rounded-lg bg-white/30 dark:bg-[var(--surface-2)]/30 backdrop-blur-sm border border-gray-300 dark:border-[var(--border-subtle)] text-gray-900 dark:text-white shadow-none',
              // Premium hover
              'hover:bg-white/40 dark:hover:bg-[var(--surface-2)]/40 hover:border-gray-400 dark:hover:border-white/40',
              // Subtle focus ring
              'focus-visible:ring-1 focus-visible:ring-gray-300 dark:focus-visible:ring-white/30 focus-visible:ring-offset-0',
              // Disabled state overrides
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:saturate-75 disabled:hover:bg-white/30 dark:disabled:hover:bg-[var(--surface-2)]/30 disabled:hover:border-gray-300 dark:disabled:hover:border-[var(--border-subtle)]',
              'transition-all duration-200',
              className
            )}
          >
            {showLoadingSpinner ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-700 dark:text-gray-300" />
            ) : (
              <MagicWandIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
            )}
            <span className={cn('ml-2 font-semibold text-sm hidden sm:inline')}>
              {t('ai.assist')}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          hideArrow
          className={cn(
            'w-56',
            '**:data-[slot=dropdown-menu-item]:rounded-md **:data-[slot=dropdown-menu-item]:px-2.5 **:data-[slot=dropdown-menu-item]:py-2'
          )}
        >
          <DropdownMenuItem
            disabled={presetsDisabled}
            onClick={() => onSelect('shorter')}
          >
            {t('ai.makeItShorter')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={presetsDisabled}
            onClick={() => onSelect('punchy')}
          >
            {t('ai.makeItPunchy')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={presetsDisabled}
            onClick={() => onSelect('alternatives')}
          >
            {t('ai.exploreAlternatives')}
          </DropdownMenuItem>
          {showBenefits && (
            <DropdownMenuItem
              disabled={presetsDisabled}
              onClick={() => onSelect('benefits')}
            >
              {t('ai.clarifyBenefits')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              setCustomOpen(true);
            }}
          >
            {t('ai.customPrompt')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={customOpen}
        onOpenChange={(open) => {
          setCustomOpen(open);
          if (!open) {
            setShowError(false);
            setCustomPrompt('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto !bg-[var(--surface-2)] border border-gray-300 dark:border-slate-700 shadow-2xl !px-8">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('ai.customPrompt')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <Textarea
              value={customPrompt}
              onChange={(e) => {
                setCustomPrompt(e.target.value);
                if (showError) setShowError(false);
              }}
              onBlur={() => {
                if (customPrompt.trim() && !isCustomPromptValid) {
                  setShowError(true);
                }
              }}
              placeholder={
                customPlaceholder || t('ai.customPrompt.placeholder')
              }
              className="min-h-[120px] text-base border-2 focus:ring-2 resize-none transition-all duration-200 bg-white dark:bg-[var(--surface-1)] border-gray-300 dark:border-slate-600 focus:border-primary focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 rounded-xl"
            />
            {(() => {
              const hasText = customPrompt.trim();
              if (hasText && isCustomPromptValid) {
                return (
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    ✓ {t('ai.customPrompt.valid')}
                  </p>
                );
              }
              if (hasText && showError) {
                return (
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    ⚠ {t('ai.customPrompt.lengthHint')}
                  </p>
                );
              }
              if (hasText) {
                return (
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {t('ai.customPrompt.lengthHint')}
                  </p>
                );
              }
              return (
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('ai.customPrompt.lengthHint')}
                </p>
              );
            })()}
          </div>

          <DialogFooter className="!gap-6 border-t border-gray-400/30 dark:border-gray-600/30 py-4 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomOpen(false)}
              className="surface-1 hover:bg-gray-200 dark:hover:bg-gray-700 w-full sm:w-32 h-10 mt-0"
            >
              {t('app.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!isCustomPromptValid}
              onClick={() => {
                const prompt = customPrompt.trim();
                if (prompt) {
                  onCustomPrompt?.(prompt);
                } else {
                  onSelect('custom');
                }
                setCustomPrompt('');
                setShowError(false);
                setCustomOpen(false);
              }}
              className="w-full sm:w-32 h-10"
            >
              {t('app.apply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AiRewriteMenu;
