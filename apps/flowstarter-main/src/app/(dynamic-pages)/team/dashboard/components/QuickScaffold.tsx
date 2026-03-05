'use client';

import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import { Wand2, Paperclip, Loader2, ArrowRight, X, ChevronDown, ChevronUp, Check, Pencil, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { GlassCard } from '@flowstarter/flow-design-system';

const EDITOR_URL = process.env.NEXT_PUBLIC_EDITOR_URL || (process.env.NODE_ENV === 'production' ? 'https://editor.flowstarter.dev' : 'http://localhost:5173');

export function QuickScaffold() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isExpanded, setIsExpanded] = useLocalStorage('scaffold-expanded', false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Review step state
  const [showReview, setShowReview] = useState(false);
  const [enrichedData, setEnrichedData] = useState<Record<string, string> | null>(null);
  const [aiSteps, setAiSteps] = useState<Array<{ label: string; done: boolean }>>([]);

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

    // Show AI progress steps
    setAiSteps([
      { label: 'Reading business description...', done: false },
      { label: 'Identifying industry & audience...', done: false },
      { label: 'Crafting value proposition...', done: false },
      { label: 'Generating project brief...', done: false },
    ]);

    // Animate steps
    const animateSteps = async () => {
      for (let i = 0; i < 4; i++) {
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        setAiSteps(prev => prev.map((s, j) => j <= i ? { ...s, done: true } : s));
      }
    };
    animateSteps();

    enrichMutation.mutate(
      { description: input },
      {
        onSuccess: async (enriched) => {
          // Complete all steps
          setAiSteps(prev => prev.map(s => ({ ...s, done: true })));
          await new Promise(r => setTimeout(r, 300));

          // Show review form
          setEnrichedData({
            businessName: enriched.businessName || '',
            description: enriched.description || input,
            industry: enriched.industry || '',
            targetAudience: enriched.targetAudience || '',
            uvp: enriched.uvp || '',
            goal: enriched.goal || '',
            offerType: enriched.offerType || '',
            brandTone: enriched.brandTone || '',
            offerings: enriched.offerings || '',
          });
          setShowReview(true);
          setAiSteps([]);
        },
        onError: async (error) => {
          console.error('[QuickScaffold] Enrichment error:', error);
          setAiSteps([]);
          // Fallback: open editor with just description
          handleLaunchEditor({ description: input, userDescription: input });
        },
      }
    );
  };

  const handleLaunchEditor = async (projectConfig: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/editor/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectConfig, mode: 'interactive' }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowReview(false);
        setEnrichedData(null);
        setInput('');
        window.open(data.editorUrl || `${EDITOR_URL}?handoff=${data.token}`, '_blank');
      } else {
        window.open(EDITOR_URL, '_blank');
      }
    } catch {
      window.open(EDITOR_URL, '_blank');
    }
  };

  const handleConfirmAndLaunch = () => {
    if (!enrichedData) return;
    handleLaunchEditor({
      name: enrichedData.businessName,
      description: enrichedData.description,
      userDescription: input,
      industry: enrichedData.industry,
      businessInfo: {
        description: enrichedData.description,
        uvp: enrichedData.uvp,
        targetAudience: enrichedData.targetAudience,
        industry: enrichedData.industry,
        goal: enrichedData.goal,
        offerType: enrichedData.offerType,
        brandTone: enrichedData.brandTone,
        offerings: enrichedData.offerings,
      },
    });
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


  // Typewriter placeholder
  const examples = [
    'Dental clinic in Bucharest, cosmetic dentistry & implants, premium pricing...',
    'Yoga studio offering group classes, private sessions, and retreat packages...',
    'Family law firm specializing in divorce mediation and custody agreements...',
    'Hair salon with bridal packages, color specialists, walk-ins welcome...',
    'Personal trainer, online coaching programs, meal plans, €49-199/mo...',
    'Real estate agent, luxury apartments in Cluj, virtual tours available...',
  ];
  const [placeholderText, setPlaceholderText] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const pauseRef = useRef(false);

  useEffect(() => {
    if (input) return; // Stop animation when user is typing
    const example = examples[exampleIndex];

    const timeout = setTimeout(() => {
      if (pauseRef.current) {
        pauseRef.current = false;
        setIsDeleting(true);
        return;
      }

      if (!isDeleting) {
        // Typing
        if (charIndex < example.length) {
          setPlaceholderText(example.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          // Pause at end
          pauseRef.current = true;
        }
      } else {
        // Deleting
        if (charIndex > 0) {
          setPlaceholderText(example.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          // Move to next example
          setIsDeleting(false);
          setExampleIndex((exampleIndex + 1) % examples.length);
        }
      }
    }, pauseRef.current ? 2000 : isDeleting ? 20 : 40 + Math.random() * 30);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, exampleIndex, input]);

  const isClassifying = enrichMutation.isPending;

  // AI progress steps view
  if (aiSteps.length > 0 && !showReview) {
    return (
      <GlassCard noHover>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[var(--purple)] animate-pulse" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">AI is analyzing...</h3>
            <p className="text-xs text-gray-500 dark:text-white/40">Building your project brief</p>
          </div>
        </div>
        <div className="space-y-3">
          {aiSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                step.done
                  ? 'bg-green-500 text-white'
                  : 'border-2 border-gray-300 dark:border-white/20'
              )}>
                {step.done ? <Check className="w-3 h-3" /> : (
                  i === aiSteps.filter(s => s.done).length
                    ? <Loader2 className="w-3 h-3 animate-spin text-[var(--purple)]" />
                    : null
                )}
              </div>
              <span className={cn(
                'text-sm transition-colors',
                step.done ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/30'
              )}>{step.label}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  // Review enriched data
  if (showReview && enrichedData) {
    const fields = [
      { key: 'businessName', label: 'Business Name' },
      { key: 'industry', label: 'Industry' },
      { key: 'description', label: 'Description' },
      { key: 'targetAudience', label: 'Target Audience' },
      { key: 'uvp', label: 'Value Proposition' },
      { key: 'offerings', label: 'Services / Offerings' },
      { key: 'brandTone', label: 'Brand Tone' },
      { key: 'goal', label: 'Primary Goal' },
    ].filter(f => enrichedData[f.key]);

    return (
      <GlassCard noHover>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white text-sm">Review Project Brief</h3>
              <p className="text-xs text-gray-500 dark:text-white/40">Edit any field before launching</p>
            </div>
          </div>
          <button
            onClick={() => { setShowReview(false); setEnrichedData(null); setAiSteps([]); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-5 max-h-[320px] overflow-y-auto pr-1">
          {fields.map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-500 dark:text-white/40 mb-1 block">{label}</label>
              <input
                type="text"
                value={enrichedData[key] || ''}
                onChange={(e) => setEnrichedData(prev => prev ? { ...prev, [key]: e.target.value } : prev)}
                className="w-full px-3 py-2 text-sm bg-white/80 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[var(--purple)]/30 transition-colors"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => { setShowReview(false); setEnrichedData(null); }}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Start Over
          </Button>
          <Button
            onClick={handleConfirmAndLaunch}
            variant="accent"
            size="sm"
            className="flex-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Open in Editor
          </Button>
        </div>
      </GlassCard>
    );
  }

  // Collapsed state - compact one-liner
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="group w-full flex items-center gap-2.5 px-3 py-3 sm:px-4 sm:py-3.5 rounded-2xl bg-white/80 dark:bg-[var(--glass-surface)]/80 backdrop-blur-2xl backdrop-saturate-150 border-t border-l border-white/40 dark:border-white/[0.08] border-b border-r border-black/[0.04] dark:border-black/[0.2] shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),1px_1px_0_rgba(0,0,0,0.03)_inset,-1px_-1px_0_rgba(255,255,255,1)_inset,0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2),1px_1px_0_rgba(0,0,0,0.3)_inset,-1px_-1px_0_rgba(255,255,255,0.08)_inset,0_1px_0_rgba(255,255,255,0.06)_inset] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08),-1px_-1px_0_rgba(255,255,255,1)_inset,0_1px_0_rgba(255,255,255,0.9)_inset] dark:hover:shadow-[0_12px_40px_rgba(124,58,237,0.15),-1px_-1px_0_rgba(255,255,255,0.08)_inset,0_1px_0_rgba(255,255,255,0.06)_inset] transition-all duration-300 overflow-hidden"
        type="button"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Wand2 className="w-4 h-4 text-[var(--purple)]" />
        </div>
        <span className="text-sm text-gray-600 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate min-w-0 flex-1 text-left">
          Describe a business to generate a draft
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[var(--purple)] flex-shrink-0 transition-colors" />
      </button>
    );
  }

  return (
    <GlassCard noHover>
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
                  <span className="text-[0.5625rem] text-gray-500 uppercase">
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
            ? 'border-[var(--purple)]/30 bg-white dark:bg-white/[0.06]'
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
          placeholder={input ? "" : placeholderText || "Describe your client's business..."}
          rows={2}
          className="w-full px-4 pt-4 pb-3 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 text-sm leading-relaxed resize-none focus:outline-none border-0 select-text"
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

      <p className="text-[0.6875rem] text-gray-400 dark:text-white/30 mt-2 text-center">
        AI creates a starting structure - you refine positioning and strategy
      </p>
    </GlassCard>
  );
}
