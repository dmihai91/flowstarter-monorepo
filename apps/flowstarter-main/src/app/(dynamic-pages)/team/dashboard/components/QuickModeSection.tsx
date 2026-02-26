'use client';

import { Sparkles, Image as ImageIcon, Loader2, Send, FileText, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useWizardStore } from '@/store/wizard-store';
import { useUser } from '@clerk/nextjs';

export function QuickModeSection() {
  const router = useRouter();
  const { user } = useUser();
  const [input, setInput] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setPrefillData = useWizardStore((state) => state.setPrefillData);
  const setSelectedIndustry = useWizardStore((state) => state.setSelectedIndustry);
  
  const firstName = user?.firstName || 'there';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files].slice(0, 5)); // Max 5 files
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

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

      // Navigate to OLD wizard that handles AI generation
      router.push('/dashboard/new?mode=ai-generated');
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
      router.push('/dashboard/new?mode=ai-generated');
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

  return (
    <div className="p-4 rounded-2xl border border-white/30 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.02] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
      {/* Header + Badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Quick Mode - AI powered</span>
        </div>
      </div>

      {/* Compact description */}
      <p className="text-sm text-gray-600 dark:text-white/60 mb-3">
        Hi {firstName}! Tell me what you want to create, I&apos;ll handle the rest. Include: industry, audience, goals, visual style.
      </p>

      {/* Input + Sample prompt inline */}
      <div className="space-y-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="A landing page for a SaaS product in the IT industry that helps teams collaborate better..."
          className="min-h-[80px] resize-none border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 text-sm"
        />
        
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, i) => (
              <div key={i} className="relative group">
                {file.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-white/10"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 text-gray-400 dark:text-white/40 hover:text-[var(--purple)] transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-gray-400 dark:text-white/40 hover:text-[var(--purple)] transition-colors"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isClassifying}
            size="sm"
            className="bg-[var(--purple)] hover:bg-[var(--purple)]/90 text-white rounded-full px-4"
          >
            {isClassifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
