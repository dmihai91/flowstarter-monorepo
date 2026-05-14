'use client';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

/**
 * Manages clipboard copy state with an auto-resetting "copied" label.
 *
 * Usage:
 *   const { copied, copyToClipboard } = useCopyToClipboard();
 *   // then in JSX: onClick={() => copyToClipboard(value, 'Label')}
 *   //             {copied === 'Label' ? <CheckIcon /> : <CopyIcon />}
 */
export function useCopyToClipboard(resetDelay = 2000): {
  copied: string | null;
  copyToClipboard: (text: string, label: string) => void;
} {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = useCallback(
    (text: string, label: string): void => {
      navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(null), resetDelay);
    },
    [resetDelay]
  );

  return { copied, copyToClipboard };
}
