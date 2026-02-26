'use client';

import { Sparkles, Image as ImageIcon, Loader2, ArrowUp, FileText, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/store/wizard-store';
import { useUser } from '@clerk/nextjs';

export function QuickModeSection() {
  const router = useRouter();
  const { user } = useUser();
  const [input, setInput] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const setPrefillData = useWizardStore((state) => state.setPrefillData);
  const setSelectedIndustry = useWizardStore((state) => state.setSelectedIndustry);
  
  const firstName = user?.firstName || 'there';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files].slice(0, 5));
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsClassifying(true);

    try {
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

      setPrefillData(prefillData);

      if (industry) {
        setSelectedIndustry(industry);
      }

      router.push('/team/dashboard/new?mode=ai-generated');
    } catch (error) {
      console.error('[QuickMode] Classification error:', error);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  };

  const suggestions = [
    "Bakery with online ordering",
    "Fitness app landing page",
    "Photography portfolio",
  ];

  // 3D card style matching the rest of the app
  const cardClass = [
    "rounded-2xl border border-black/[0.08] dark:border-white/[0.08]",
    "bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl",
    "shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.02)_inset]",
    "dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset]",
  ].join(" ");

  return (
    <div className={`${cardClass} p-5 transition-all duration-300 ${isFocused ? 'ring-2 ring-[var(--purple)]/20' : ''}`}>
      {/* Header row */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-[var(--purple)]/70 flex items-center justify-center shadow-lg shadow-[var(--purple)]/25 flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">
            What would you like to build?
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/50">
            Describe your project and AI will generate everything
          </p>
        </div>
      </div>

      {/* Input container */}
      <div className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
        isFocused 
          ? 'ring-2 ring-[var(--purple)]/30' 
          : ''
      }`}>
        {/* Textarea with gradient border effect */}
        <div className="relative bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-white/[0.04] dark:to-white/[0.02] rounded-xl border border-gray-200/80 dark:border-white/[0.08]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={`Hi ${firstName}! Describe your business idea...`}
            rows={2}
            className="w-full px-4 pt-3.5 pb-14 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 text-[15px] leading-relaxed resize-none focus:outline-none"
            style={{ minHeight: '100px' }}
          />
          
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {attachments.map((file, i) => (
                <div key={i} className="relative group">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
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

          {/* Bottom bar */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
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
                className="p-2 rounded-lg text-gray-400 hover:text-[var(--purple)] hover:bg-[var(--purple)]/10 transition-colors"
                title="Add image"
              >
                <ImageIcon className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-gray-400 hover:text-[var(--purple)] hover:bg-[var(--purple)]/10 transition-colors"
                title="Add document"
              >
                <FileText className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isClassifying}
              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
                input.trim() && !isClassifying
                  ? 'bg-[var(--purple)] text-white shadow-md shadow-[var(--purple)]/30 hover:shadow-lg hover:shadow-[var(--purple)]/40 hover:brightness-110 active:scale-95'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed'
              }`}
            >
              {isClassifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick suggestions - only show when empty */}
      {!input && (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(suggestion);
                textareaRef.current?.focus();
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-[var(--purple)]/40 hover:text-[var(--purple)] hover:bg-[var(--purple)]/5 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
