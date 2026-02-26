'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, RefreshCw, X } from 'lucide-react';

interface RegenerationCardProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onRegenerate: () => void;
  onClose: () => void;
  isRegenerating: boolean;
  placeholder?: string;
}

export function RegenerationCard({
  prompt,
  setPrompt,
  onRegenerate,
  onClose,
  isRegenerating,
  placeholder = "e.g., Make it more modern...",
}: RegenerationCardProps) {
  return (
    <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-[var(--purple)]/5 to-blue-500/5 border border-[var(--purple)]/20">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-[var(--purple)]" />
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-sm text-gray-600 dark:text-white/70">
            Regenerate with custom instructions (optional)
          </p>
          <Input
            placeholder={placeholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-10 text-sm bg-white dark:bg-white/10"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="bg-[var(--purple)] hover:bg-[var(--purple)]/90 text-white"
            >
              {isRegenerating ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              )}
              Regenerate
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
