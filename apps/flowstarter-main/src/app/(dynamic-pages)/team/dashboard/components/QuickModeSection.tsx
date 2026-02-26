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
      textareaRef.current.style.height = '24px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  };

  const suggestions = [
    "A bakery website with online ordering",
    "Landing page for my fitness app",
    "Portfolio site for photography",
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--purple)]/70 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-[15px]">
            What would you like to build?
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/50">
            AI will generate your project details
          </p>
        </div>
      </div>

      {/* Chat input container */}
      <div 
        className={`relative rounded-2xl transition-all duration-200 ${
          isFocused 
            ? 'shadow-[0_0_0_2px_var(--purple),0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_2px_var(--purple),0_4px_20px_rgba(0,0,0,0.3)]' 
            : 'shadow-[0_2px_8px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.08)]'
        }`}
      >
        <div className="bg-white dark:bg-[#2a2a2f] rounded-2xl">
          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="px-4 pt-3 flex flex-wrap gap-2">
              {attachments.map((file, i) => (
                <div key={i} className="relative group">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10">
                      <span className="text-xs text-gray-500 dark:text-white/50 text-center px-1 truncate">
                        {file.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="flex items-end gap-2 p-3">
            {/* Attach button */}
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
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Textarea */}
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={`Message Flowstarter...`}
                rows={1}
                className="w-full bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 text-[15px] leading-6 resize-none focus:outline-none py-1.5"
                style={{ height: '24px', maxHeight: '150px' }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isClassifying}
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                input.trim() && !isClassifying
                  ? 'bg-[var(--purple)] text-white hover:bg-[var(--purple)]/90 active:scale-95'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-300 dark:text-white/20 cursor-not-allowed'
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

      {/* Suggestions */}
      {!input && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(suggestion);
                textareaRef.current?.focus();
              }}
              className="px-4 py-2 text-sm rounded-xl bg-white dark:bg-[#2a2a2f] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:border-[var(--purple)]/50 hover:text-[var(--purple)] transition-colors shadow-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
