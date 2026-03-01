'use client';

import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import { useWizardStore } from '@/store/wizard-store';
import { Wand2, Paperclip, Loader2, ArrowRight, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';

const EDITOR_URL = process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5173';

export function QuickScaffold() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isExpanded, setIsExpanded] = useLocalStorage('scaffold-expanded', false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const setPrefillData = useWizardStore((state) => state.setPrefillData);
  const setSelectedIndustry = useWizardStore((state) => state.setSelectedIndustry);

  // React Query mutation for AI enrichment
  const enrichMutation = useMutation({
    mutationFn: async ({ description }: { description: string }) => {
      const res = await fetch('/api/ai/enrich-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error('Enrichment failed');
      return res.json();
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 5));
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    enrichMutation.mutate(
      { description: input },
      {
        onSuccess: async (enriched) => {
          setPrefillData({
            name: enriched.businessName || '',
            description: enriched.description || input,
            userDescription: input,
            targetUsers: enriched.targetAudience || '',
            businessGoals: enriched.goal || '',
            USP: enriched.uvp || '',
            industry: enriched.industry || '',
          });

          if (enriched.industry) {
            setSelectedIndustry(enriched.industry);
          }

          // Create project with ALL enriched data and handoff to editor
          try {
            const res = await fetch('/api/editor/handoff', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectConfig: {
                  name: enriched.businessName,
                  description: enriched.description || input,
                  userDescription: input,
                  industry: enriched.industry,
                  businessInfo: {
                    description: enriched.description || input,
                    uvp: enriched.uvp,
                    targetAudience: enriched.targetAudience,
                    industry: enriched.industry,
                    goal: enriched.goal,
                    offerType: enriched.offerType,
                    brandTone: enriched.brandTone,
                    offerings: enriched.offerings,
                  },
                  contactInfo: {
                    email: enriched.contactEmail || '',
                    phone: enriched.contactPhone || '',
                    address: enriched.contactAddress || '',
                    website: enriched.website || '',
                  },
                },
                mode: 'interactive',
              }),
            });
            if (res.ok) {
              const data = await res.json();
              window.open(\`\${EDITOR_URL}?handoff=\${data.token}\`, '_blank');
            } else {
              window.open(EDITOR_URL, '_blank');
            }
          } catch {
            window.open(EDITOR_URL, '_blank');
          }
        },
        onError: async (error) => {
          console.error('[QuickScaffold] Enrichment error:', error);
          // Fallback: handoff with just the description
          try {
            const res = await fetch('/api/editor/handoff', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectConfig: { description: input, userDescription: input },
                mode: 'interactive',
              }),
            });
            if (res.ok) {
              const data = await res.json();
              window.open(\`\${EDITOR_URL}?handoff=\${data.token}\`, '_blank');
            } else {
              window.open(EDITOR_URL, '_blank');
            }
          } catch {
            window.open(EDITOR_URL, '_blank');
          }
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const isClassifying = enrichMutation.isPending;

  // Glassmorphism card style
  const glassCard = 'rounded-2xl border-t border-l border-white/40 dark:border-white/[0.08] border-b border-r border-black/[0.04] dark:border-black/[0.2] bg-white/55 dark:bg-white/[0.03] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),1px_1px_0_rgba(0,0,0,0.03)_inset,-1px_-1px_0_rgba(255,255,255,1)_inset,1px_1px_0_rgba(0,0,0,0.03)_inset,-1px_-1px_0_rgba(255,255,255,1)_inset,0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2),1px_1px_0_rgba(0,0,0,0.3)_inset,-1px_-1px_0_rgba(255,255,255,0.08)_inset,0_1px_0_rgba(255,255,255,0.06)_inset]';

  // Collapsed state - compact one-liner
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 ${glassCard} hover:border-[var(--purple)]/30 hover:bg-white/80 dark:hover:bg-white/[0.06] hover:shadow-[0_8px_32px_rgba(124,58,237,0.1)] transition-all duration-300 group`}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center group-hover:from-[var(--purple)]/30 group-hover:to-blue-500/30 transition-colors">
          <Wand2 className="w-4 h-4 text-[var(--purple)]" />
        </div>
        <span className="text-sm text-gray-600 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          Quick scaffold - paste client brief to generate draft structure
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[var(--purple)] ml-auto transition-colors" />
      </button>
    );
  }

  return (
    <div className={`${glassCard} p-5`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-[var(--purple)]" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
              AI Draft Generator
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/40">
              Creates initial structure from brief
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, i) => (
            <div key={i} className="relative group">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-12 h-12 object-cover rounded-lg border border-black/[0.08] dark:border-white/[0.08]"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-gray-50 dark:bg-white/5">
                  <span className="text-[9px] text-gray-500 uppercase">
                    {file.name.split('.').pop()}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(i)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Compact Input */}
      <div
        className={cn(
          'relative rounded-xl border backdrop-blur-xl transition-all duration-200 overflow-hidden',
          isFocused
            ? 'border-[var(--purple)]/50 bg-white dark:bg-white/[0.06] shadow-[0_0_0_2px_rgba(var(--purple-rgb),0.1)]'
            : 'border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03]'
        )}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Paste client brief or describe project..."
          rows={2}
          className="w-full px-3 pt-3 pb-2 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 text-sm leading-relaxed resize-none focus:outline-none border-0"
          style={{
            minHeight: '56px',
            maxHeight: '120px',
          }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-md text-gray-400 hover:text-[var(--purple)] hover:bg-[var(--purple)]/10 transition-colors"
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isClassifying}
            variant="accent"
            size="sm"
          >
            {isClassifying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Generate Draft
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-white/30 mt-2 text-center">
        AI creates a starting structure - you refine positioning and strategy
      </p>
    </div>
  );
}
