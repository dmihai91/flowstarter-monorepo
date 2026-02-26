'use client';

import { Sparkles, Image as ImageIcon, Loader2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useWizardStore } from '@/store/wizard-store';

const SAMPLE_PROMPTS = [
  'A minimalist landing page for a SaaS product in the IT industry that helps teams collaborate better. Target audience: tech startups. Style: clean, modern, professional.',
  'Build a website for my local coffee shop in Brooklyn with online ordering capabilities. Warm and cozy aesthetic, showcasing our artisan coffee and pastries.',
  'A consulting site for a business coach offering 1-on-1 sessions and group workshops. Professional yet approachable, with booking integration and testimonials.',
];

export function QuickModeSection() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const setPrefillData = useWizardStore((state) => state.setPrefillData);
  const setSelectedIndustry = useWizardStore((state) => state.setSelectedIndustry);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsClassifying(true);

    try {
      // Call classification API to detect project type and industry
      const response = await fetch('/api/ai/classify-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      let platformType: string | undefined;
      let industry: string | undefined;

      if (response.ok) {
        const classification = await response.json();
        platformType = classification.platformType;
        industry = classification.industry;
      }

      const prefillData = {
        name: '',
        description: input,
        userDescription: input,
        targetUsers: '',
        businessGoals: '',
        USP: '',
        platformType,
        industry,
      };

      // Store prefill data in wizard store
      setPrefillData(prefillData);

      // Also set industry in the store directly for immediate use
      if (industry) {
        setSelectedIndustry(industry);
      }

      // Navigate to wizard with ai-generated flag
      router.push('/team/dashboard/new?mode=ai-generated');
    } catch (error) {
      console.error('[QuickMode] Classification error:', error);

      // Fall back to original behavior without classification
      const prefillData = {
        name: '',
        description: input,
        userDescription: input,
        targetUsers: '',
        businessGoals: '',
        USP: '',
      };
      setPrefillData(prefillData);
      router.push('/team/dashboard/new?mode=ai-generated');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="p-5 rounded-2xl border border-white/30 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.02] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Quick Mode - AI powered</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
        Hi! Let&apos;s build the best site for your client. Tell us about the project and our AI will guide you to build it. Be specific and offer all details about the: industry, audience, goals, visual style.
      </p>

      {/* Sample Prompts */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 dark:text-white/40 mb-2">
          We prepared some prompts for you: (click to use)
        </p>
        <div className="space-y-2">
          {SAMPLE_PROMPTS.slice(0, showMore ? undefined : 2).map((prompt, i) => (
            <button
              key={i}
              onClick={() => handlePromptClick(prompt)}
              className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:border-[var(--purple)]/30 transition-colors truncate"
            >
              {prompt}
            </button>
          ))}
        </div>
        {SAMPLE_PROMPTS.length > 2 && (
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-white/40 hover:text-[var(--purple)] transition-colors"
          >
            {showMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showMore ? 'Less' : 'More'}
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className="space-y-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your project or paste a reference..."
          className="min-h-[100px] resize-none border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-400 dark:text-white/40" />
            <span className="text-xs text-gray-400 dark:text-white/40">Supports images</span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isClassifying}
            className="bg-[var(--purple)] hover:bg-[var(--purple)]/90 text-white"
          >
            {isClassifying ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isClassifying ? 'Analyzing...' : 'Start Project'}
          </Button>
        </div>
      </div>
    </div>
  );
}
