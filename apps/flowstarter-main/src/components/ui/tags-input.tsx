import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import * as React from 'react';
import { useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface TagsInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  suggestions?: string[];
  minCharsForSuggestions?: number;
  enableCommaSeparator?: boolean;
}

export function TagsInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  className,
  suggestions,
  minCharsForSuggestions,
  enableCommaSeparator,
}: TagsInputProps) {
  const { t } = useTranslations();
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [width, setWidth] = React.useState<number | undefined>(undefined);

  // Base separators: semicolons or newlines
  // If comma is enabled, also split on commas that are NOT thousands separators
  // i.e., split on "," unless it is followed by exactly 3 digits at a word boundary (e.g., 1,000)
  const separatorRegex = React.useMemo(() => {
    if (enableCommaSeparator) {
      return /(?:;\s*|\n+|,(?!\d{3}\b)\s*)/g;
    }
    return /(?:;\s*|\n+)/g;
  }, [enableCommaSeparator]);
  const tags = React.useMemo(() => {
    return value
      .split(separatorRegex)
      .map((t) => t.trim())
      .filter(Boolean);
  }, [value, separatorRegex]);

  const commitTag = (tag: string) => {
    const next = tag.trim();
    if (!next) return;
    const nextTags = Array.from(new Set([...tags, next]));
    // Join using newlines so Enter creates distinct chips consistently
    onChange(nextTags.join('\n'));
    setInputValue('');
    setOpen(false);
  };

  const removeTagAt = (index: number) => {
    const nextTags = tags.filter((_, i) => i !== index);
    onChange(nextTags.join('\n'));
  };

  const filteredSuggestions = React.useMemo(() => {
    const source = suggestions || [];
    const minChars = Math.max(1, minCharsForSuggestions ?? 1);
    const query = inputValue.trim().toLowerCase();
    if (query.length < minChars) return [];
    return source
      .filter((s) => !tags.includes(s))
      .filter((s) => s.toLowerCase().includes(query))
      .slice(0, 8);
  }, [suggestions, inputValue, tags, minCharsForSuggestions]);

  React.useLayoutEffect(() => {
    const update = () => {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    setOpen(filteredSuggestions.length > 0);
  }, [filteredSuggestions.length]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      commitTag(inputValue);
    } else if (enableCommaSeparator && e.key === ',') {
      e.preventDefault();
      commitTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue.length === 0) {
      removeTagAt(tags.length - 1);
    }
  };

  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    e.preventDefault();
    const pasted = text
      .split(separatorRegex)
      .map((t) => t.trim())
      .filter(Boolean);
    if (pasted.length) {
      const next = Array.from(new Set([...tags, ...pasted]));
      // Keep consistent newline-joined internal value
      onChange(next.join('\n'));
      setInputValue('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          ref={containerRef}
          className={cn(
            'min-h-[46px] w-full rounded-[8px] border-[1.5px] border-solid !bg-transparent border-gray-300 dark:border-[var(--border-subtle)] text-gray-900 dark:text-white outline-none transition-all duration-200 px-[12px] py-[8px] sm:px-[16px] sm:py-[10px] flex flex-wrap items-center gap-[6px] focus-within:ring-0 focus-within:outline-none focus-within:border-gray-400 dark:focus-within:border-white/40',
            disabled && 'opacity-60 cursor-not-allowed',
            className
          )}
          style={{
            backgroundColor: 'transparent',
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {tags.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              className="inline-flex items-center gap-[6px] px-[6px] py-[5px] sm:px-[8px] sm:py-[7px] rounded-[6px] text-sm font-medium leading-[14px] bg-transparent border border-solid border-[#000000] dark:border-white text-[#000000] dark:text-white"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTagAt(idx);
                }}
                className="rounded-[9px] h-[16px] w-[16px] flex items-center justify-center border-[1.1px] border-solid border-[#000000] dark:border-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="h-[10px] w-[10px] text-[#000000] dark:text-white stroke-[2.5]" />
              </button>
            </span>
          ))}
          <input
            id={id}
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={tags.length === 0 ? placeholder : undefined}
            disabled={disabled}
            className="flex-1 min-w-32 !bg-transparent outline-none text-base font-normal leading-normal placeholder:text-gray-400 dark:placeholder:text-[var(--ui-text-placeholder)] border-0 focus:border-0 appearance-none text-gray-900 dark:text-white"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="p-2 rounded-[8px] border-[1.5px] border-solid border-gray-300 dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--surface-2)] shadow-lg"
        style={{ width }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {filteredSuggestions.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            {t('tagsInput.noSuggestions')}
          </div>
        ) : (
          <ul className="max-h-56 overflow-y-auto">
            {filteredSuggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => commitTag(s)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default TagsInput;
