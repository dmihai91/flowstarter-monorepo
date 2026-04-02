'use client';

import { useTypewriter } from '@/hooks/useTypewriter';
import { cn } from '@/lib/utils';

interface TypewriterTextProps {
  value: string;
  className?: string;
  speed?: number;
  delay?: number;
}

/**
 * Renders text with a typewriter animation when value first populates.
 * Shows a blinking cursor until done.
 */
export function TypewriterText({
  value,
  className,
  speed = 18,
  delay = 0,
}: TypewriterTextProps) {
  const { displayed, done } = useTypewriter(value, { speed, delay });

  return (
    <span className={className}>
      {displayed}
      {!done && (
        <span className="inline-block w-px h-[1em] bg-current ml-px align-middle animate-[blink_0.8s_step-end_infinite] opacity-70" />
      )}
    </span>
  );
}

interface TypewriterInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onValueChange: (v: string) => void;
  aiValue?: string; // the AI-inferred value — triggers typewriter when set
  speed?: number;
}

/**
 * Input that typewriters the initial AI-inferred value, then lets the user edit freely.
 */
export function TypewriterInput({
  value,
  onValueChange,
  aiValue,
  speed = 18,
  className,
  ...rest
}: TypewriterInputProps) {
  const { displayed, done } = useTypewriter(aiValue ?? '', {
    speed,
    enabled: !!aiValue,
  });

  // Once AI value is fully typed, sync it into the controlled value (once)
  return (
    <div className="relative">
      <input
        {...rest}
        value={!done && aiValue ? displayed : value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(className, !done && aiValue && 'caret-transparent')}
      />
      {!done && aiValue && (
        <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 pr-3 text-xs text-[var(--purple)]/60">
          typing…
        </span>
      )}
    </div>
  );
}
