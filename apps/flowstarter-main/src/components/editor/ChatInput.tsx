'use client';

import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/lib/i18n';
import { Loader2, Plus, Send, X } from 'lucide-react';
import NextImage from 'next/image';
import { useState } from 'react';

interface ChatInputProps {
  onSend: (message: string, imageData?: string | null) => Promise<void>;
  isDisabled?: boolean;
  attachedImage: string | null;
  isUploadingImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageAttach: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveImage: () => void;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isDisabled = false,
  attachedImage,
  isUploadingImage,
  fileInputRef,
  onImageAttach,
  onRemoveImage,
  placeholder,
}: ChatInputProps) {
  const { t } = useTranslations();
  const [input, setInput] = useState('');

  const defaultPlaceholder = placeholder || t('editor.inputPlaceholder');

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isDisabled) return;

    const userRequest = input.trim() || '(Image attached)';
    const imageData = attachedImage;

    setInput('');
    await onSend(userRequest, imageData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col items-start shrink-0 w-full backdrop-blur-xl border border-white/60 dark:border-white/10 bg-white/55 dark:bg-white/[0.04] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]"
      style={{
        padding: '20px 20px 20px 28px',
        gap: '12px',
      }}
    >
      {/* Image preview */}
      {attachedImage && (
        <div className="mb-2 relative inline-block">
          <NextImage
            src={attachedImage}
            alt={t('editor.attachedImageAlt')}
            className="max-w-[200px] max-h-[150px] rounded-xl border border-white/10 object-contain"
          />
          <button
            onClick={onRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all hover:scale-110"
            aria-label={t('editor.removeImage')}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Input container */}
      <div className="flex items-center gap-3 w-full">
        {/* Left: Image attachment button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageAttach}
          className="hidden"
          disabled={isDisabled || isUploadingImage}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled || isUploadingImage || !!attachedImage}
          className="flex items-center justify-center shrink-0 rounded-full border-2 dark:border-white border-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
          type="button"
          title={t('editor.attachImage')}
          style={{
            width: '24px',
            height: '24px',
            padding: 0,
          }}
        >
          {isUploadingImage ? (
            <Loader2 className="size-3 animate-spin dark:text-white text-gray-800" />
          ) : (
            <Plus className="size-3 dark:text-white text-gray-800" />
          )}
        </button>

        {/* Textarea for input */}
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={input ? '' : defaultPlaceholder}
            className="w-full resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none outline-none dark:text-white text-gray-900 placeholder:dark:text-[#a1a1af] placeholder:text-gray-500"
            disabled={isDisabled}
            rows={3}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              lineHeight: '20px',
              minHeight: '60px',
              padding: '4px 0',
            }}
          />
        </div>

        {/* Right: Send button */}
        <button
          onClick={handleSend}
          disabled={(!input.trim() && !attachedImage) || isDisabled}
          className="flex items-center justify-center shrink-0 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 dark:bg-white bg-gray-900"
          style={{
            width: '32px',
            height: '32px',
            padding: 0,
          }}
          type="button"
          aria-label="Send message"
        >
          {isDisabled ? (
            <Loader2 className="size-4 animate-spin dark:text-black text-white" />
          ) : (
            <Send className="size-4 dark:text-black text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
