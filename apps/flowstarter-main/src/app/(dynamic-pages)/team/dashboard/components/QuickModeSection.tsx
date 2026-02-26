'use client';

import { Sparkles, Image as ImageIcon, Loader2, ArrowUp, FileText, X, Zap } from 'lucide-react';
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

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  const suggestions = [
    "A bakery website with online ordering",
    "Landing page for a fitness app",
    "Portfolio for a photographer",
  ];

  return (
    <div className="relative">
      {/* Gradient glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r from-[var(--purple)]/20 via-blue-500/20 to-[var(--purple)]/20 rounded-3xl blur-xl transition-opacity duration-500 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className={`relative rounded-2xl border transition-all duration-300 ${
        isFocused 
          ? 'border-[var(--purple)]/30 bg-white dark:bg-[#1a1a1f] shadow-xl shadow-[var(--purple)]/10' 
          : 'border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1a1a1f]/80'
      } backdrop-blur-xl overflow-hidden`}>
        
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-[var(--purple)]/70 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">What would you like to build?</h3>
              <p className="text-sm text-gray-500 dark:text-white/50">Describe your project, AI will handle the rest</p>
            </div>
          </div>
        </div>

        {/* Input area - glassmorphism style */}
        <div className="px-5 pb-4">
          <div className={`relative rounded-2xl transition-all duration-300 ${
            isFocused 
              ? 'bg-white/90 dark:bg-white/[0.08] border border-[var(--purple)]/20 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.1)_inset]' 
              : 'bg-white/60 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset]'
          } backdrop-blur-xl`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={`Hi ${firstName}! Describe your business or project idea...`}
              rows={1}
              className="w-full px-4 pt-4 pb-14 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 text-[15px] leading-relaxed resize-none focus:outline-none min-h-[80px] max-h-[200px]"
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
                        className="w-14 h-14 object-cover rounded-xl border border-gray-200 dark:border-white/10"
                      />
                    ) : (
                      <div className="w-14 h-14 flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom toolbar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
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
                  className="p-2.5 rounded-xl text-gray-400 dark:text-white/40 hover:text-[var(--purple)] hover:bg-[var(--purple)]/10 transition-all"
                  title="Add image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-gray-400 dark:text-white/40 hover:text-[var(--purple)] hover:bg-[var(--purple)]/10 transition-all"
                  title="Add document"
                >
                  <FileText className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isClassifying}
                className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
                  input.trim() && !isClassifying
                    ? 'bg-gradient-to-br from-[var(--purple)] to-[var(--purple)]/80 text-white shadow-[0_4px_12px_rgba(var(--purple-rgb),0.4),0_1px_0_rgba(255,255,255,0.2)_inset] hover:shadow-[0_6px_20px_rgba(var(--purple-rgb),0.5)] hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-100 dark:bg-white/[0.06] text-gray-300 dark:text-white/20 cursor-not-allowed'
                }`}
              >
                {isClassifying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowUp className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick suggestions */}
        {!input && (
          <div className="px-5 pb-5 pt-1">
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-white/40 mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-medium">Quick start</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(suggestion);
                    textareaRef.current?.focus();
                  }}
                  className="px-4 py-2 text-sm rounded-xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-gray-600 dark:text-white/60 hover:border-[var(--purple)]/30 hover:text-[var(--purple)] hover:bg-[var(--purple)]/5 backdrop-blur-sm transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_1px_0_rgba(255,255,255,0.05)_inset]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
