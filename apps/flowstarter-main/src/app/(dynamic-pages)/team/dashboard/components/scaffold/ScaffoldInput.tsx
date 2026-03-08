'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ArrowRight, ChevronUp, Loader2, Paperclip, Wand2, X } from 'lucide-react';
import { GlassCard } from '@flowstarter/flow-design-system';
import { useEffect, useRef, useState } from 'react';

const EXAMPLES = [
  'Dental clinic in Bucharest specializing in cosmetic dentistry and implants. Premium pricing, Dr. Maria Ionescu. Services: consultations \u20ac50, teeth whitening \u20ac200, veneers \u20ac400/tooth, full implants \u20ac800-1500. Target: professionals 30-55...',
  'Yoga studio in Cluj offering group classes (\u20ac12/session), private sessions (\u20ac45), monthly unlimited pass (\u20ac89), and weekend retreat packages (\u20ac250). Instructors certified in Hatha, Vinyasa, Yin. Target: women 25-50, stress relief focus...',
  'Family law firm, 15 years experience in divorce mediation and custody agreements. Fixed fee consultations (\u20ac150), mediation packages (\u20ac800-2000). Offices in Bucharest and Timisoara. Calm, empathetic brand tone...',
];

interface ScaffoldInputProps {
  onSubmit: (description: string) => void;
  onCollapse: () => void;
  isEnriching: boolean;
}

export function ScaffoldInput({ onSubmit, onCollapse, isEnriching }: ScaffoldInputProps) {
  const { t } = useTranslations();
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Typewriter placeholder
  const [placeholderText, setPlaceholderText] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const pauseRef = useRef(false);

  useEffect(() => {
    if (input) return;
    const example = EXAMPLES[exampleIndex];

    const timeout = setTimeout(() => {
      if (pauseRef.current) {
        pauseRef.current = false;
        setIsDeleting(true);
        return;
      }

      if (!isDeleting) {
        if (charIndex < example.length) {
          setPlaceholderText(example.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          pauseRef.current = true;
        }
      } else {
        if (charIndex > 0) {
          setPlaceholderText(example.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setExampleIndex((exampleIndex + 1) % EXAMPLES.length);
        }
      }
    }, pauseRef.current ? 2000 : isDeleting ? 20 : 40 + Math.random() * 30);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, exampleIndex, input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '80px';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(input);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 5));
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

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
              {t('scaffold.input.title')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/40">
              {t('scaffold.input.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Guidance chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {[
          t('scaffold.input.chip.services'),
          t('scaffold.input.chip.location'),
          t('scaffold.input.chip.clients'),
          t('scaffold.input.chip.style'),
        ].map((hint) => (
          <span
            key={hint}
            className="text-[0.625rem] px-2 py-0.5 rounded-full bg-[var(--purple)]/8 text-[var(--purple)] border border-[var(--purple)]/15"
          >
            {hint}
          </span>
        ))}
      </div>

      {/* Attachments */}
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

      {/* Textarea */}
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
          placeholder={input ? '' : placeholderText || t('scaffold.input.placeholder')}
          rows={3}
          className="w-full px-4 pt-4 pb-3 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 text-sm leading-relaxed resize-none focus:outline-none outline-none ring-0 focus:ring-0 border-0 shadow-none select-text"
          style={{ minHeight: '80px', maxHeight: '200px' }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-2 pb-2">
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
              className="p-1.5 rounded-md text-gray-400 hover:text-[var(--purple)] hover:bg-[var(--purple)]/10 transition-colors"
              title={t('scaffold.input.attachFiles')}
            >
              <Paperclip className="w-4 h-4" />
            </button>
            {input.length > 0 && (
              <span className={cn(
                'text-[0.625rem]',
                input.length < 50 ? 'text-amber-500' : 'text-gray-400 dark:text-white/30'
              )}>
                {input.length < 50 ? t('scaffold.input.moreDetail') : t('scaffold.input.charCount', { count: input.length })}
              </span>
            )}
          </div>

          <Button
            onClick={() => onSubmit(input)}
            disabled={!input.trim() || input.length < 20 || isEnriching}
            variant="accent"
            size="sm"
          >
            {isEnriching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t('scaffold.input.analyzing')}
              </>
            ) : (
              <>
                {t('scaffold.input.generate')}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      <p className="text-[0.625rem] text-gray-400 dark:text-white/30 mt-2 text-center">
        {t('scaffold.input.hint')}
      </p>
    </GlassCard>
  );
}
