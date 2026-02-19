import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface AutoCompleteOption {
  value: string;
  label: string;
}

interface AutoCompleteProps {
  options: AutoCompleteOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
}

export function AutoComplete({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results found',
  disabled,
  loading,
  triggerClassName,
  contentClassName,
}: AutoCompleteProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(
    undefined
  );

  React.useLayoutEffect(() => {
    const update = () => {
      if (triggerRef.current) {
        setTriggerWidth(triggerRef.current.offsetWidth);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full h-[48px] justify-between text-base font-normal leading-[normal] rounded-[8px]',
            '!bg-white/15 dark:!bg-[var(--surface-2)]/15 backdrop-blur-sm',
            'border-[1.5px] border-solid border-gray-300 dark:border-[var(--border-subtle)]',
            'text-gray-900 dark:text-white',
            'hover:border-gray-400 dark:hover:border-white/40',
            'focus-visible:ring-0 focus-visible:outline-none',
            'transition-all duration-200 px-[16px]',
            !selected && 'text-gray-500 dark:text-[var(--ui-text-placeholder)]',
            triggerClassName
          )}
        >
          {selected ? selected.label : loading ? 'Loading…' : placeholder}
          <ChevronDown className="h-4 w-4 ml-2 text-gray-500 dark:text-[var(--ui-text-placeholder)]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          'p-2 border-[1.5px] border-solid border-gray-300 dark:border-[var(--border-subtle)] rounded-[8px] bg-white/30 dark:bg-[var(--surface-2)]/30 backdrop-blur-xl shadow-lg',
          contentClassName
        )}
        style={{ width: triggerWidth }}
        sideOffset={4}
      >
        <Command className="rounded-[8px] border-0 bg-transparent">
          <div className="px-3 py-2">
            <CommandInput
              placeholder={searchPlaceholder}
              className="flex-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[var(--ui-text-placeholder)]"
            />
          </div>
          <CommandList
            className="max-h-80 overflow-y-auto overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandEmpty className="py-4 text-center text-sm text-gray-500 dark:text-[var(--ui-text-placeholder)]">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup className="p-2">
              {options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'text-base py-2.5 px-3 rounded-xl cursor-pointer text-gray-900 dark:text-white transition-all duration-200',
                      'hover:bg-white/30 dark:hover:bg-[var(--surface-2)]/30',
                      isSelected && 'bg-white/40 dark:bg-[var(--surface-2)]/40'
                    )}
                    aria-selected={isSelected}
                    data-selected-value={isSelected ? 'true' : 'false'}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default AutoComplete;
