'use client';

import { Sparkles, Paperclip, Loader2, ArrowUp, X } from 'lucide-react';
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
      textareaRef.current.style.height = '80px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  };

  const suggestions = [
    "A modern bakery website with online ordering for cakes and pastries, targeting local customers",
    "Landing page for a fitness coaching app with booking system and testimonials",
    "Minimalist portfolio for a wedding photographer showcasing galleries and contact form",
  ];

  // 3D card style
  const cardClass = "rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-xl shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset]";

  return (
    <div className={`${cardClass} p-5`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--purple)]/70 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-[15px]">
            What would you like to build?
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/50">
            AI generates your project instantly
          </p>
        </div>
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
                  className="w-14 h-14 object-cover rounded-xl border border-black/[0.08] dark:border-white/[0.08]"
                />
              ) : (
                <div className="w-14 h-14 flex items-center justify-center rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-gray-50 dark:bg-white/5">
                  <span className="text-[10px] text-gray-500 uppercase">{file.name.split('.').pop()}</span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input container - glassmorphism style matching other UI elements */}
      <div 
        className={`relative rounded-2xl border backdrop-blur-xl transition-all duration-200 overflow-hidden ${
          isFocused 
            ? 'border-[var(--purple)]/50 bg-white/95 dark:bg-white/[0.06] shadow-[0_0_0_3px_rgba(var(--purple-rgb),0.1),0_4px_16px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,1)_inset] dark:shadow-[0_0_0_3px_rgba(var(--purple-rgb),0.15),0_4px_16px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.08)_inset]' 
            : 'border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset,0_-1px_0_rgba(0,0,0,0.02)_inset] dark:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset]'
        }`}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={`Describe your project, ${firstName}...`}
          rows={3}
          className="w-full px-4 pt-4 pb-2 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50 text-[15px] leading-relaxed resize-none focus:outline-none border-0 border-none outline-none ring-0 shadow-none appearance-none"
          style={{ minHeight: '88px', maxHeight: '150px', border: 'none', outline: 'none', boxShadow: 'none' }}
        />
        
        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-3">
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
              className="p-2 rounded-lg text-gray-400 hover:text-[var(--purple)] hover:bg-[var(--purple)]/10 transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isClassifying}
            className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
              input.trim() && !isClassifying
                ? 'bg-[var(--purple)] text-white shadow-md shadow-[var(--purple)]/25 hover:shadow-lg hover:shadow-[var(--purple)]/30 active:scale-[0.98]'
                : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/30 cursor-not-allowed'
            }`}
          >
            {isClassifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-4 h-4" />
                <span>Create</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {!input && (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(suggestion);
                textareaRef.current?.focus();
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-gray-600 dark:text-white/60 hover:border-[var(--purple)]/40 hover:text-[var(--purple)] hover:bg-[var(--purple)]/5 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
