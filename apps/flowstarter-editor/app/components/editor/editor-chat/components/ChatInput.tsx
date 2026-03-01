import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AttachedImage, OnboardingStep } from '~/components/editor/editor-chat/types';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  step: OnboardingStep;
  isDark: boolean;

  // Attachment props
  attachedImages: AttachedImage[];
  attachmentMenuOpen: boolean;
  setAttachmentMenuOpen: (open: boolean) => void;
  attachmentMenuRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScreenshot: () => void;
  onRemoveImage: (index: number) => void;
  onClearImages: () => void;
}

export function ChatInput({
  inputValue,
  onInputChange,
  onSend,
  step,
  isDark,
  attachedImages,
  attachmentMenuOpen,
  setAttachmentMenuOpen,
  attachmentMenuRef,
  fileInputRef,
  onFileSelect,
  onScreenshot,
  onRemoveImage,
  onClearImages,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (!inputValue && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [inputValue]);

  const handleSend = () => {
    onSend();
    onClearImages();

    // Reset textarea height immediately
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div
      className="px-3 sm:px-4 pt-2 sm:pt-3 pb-3 sm:pb-4 relative z-[1]"
      style={{
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
      }}
      style={{
        background: 'transparent',
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef as React.RefObject<HTMLInputElement>}
        type="file"
        accept="image/*"
        multiple
        onChange={onFileSelect}
        style={{ display: 'none' }}
      />

      {/* Glassmorphism prompt box */}
      <div
        style={{
          maxWidth: '100%',
          margin: '0 auto',
          background: isDark
            ? 'linear-gradient(135deg, rgba(39, 39, 42, 0.35) 0%, rgba(39, 39, 42, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
          backdropFilter: 'blur(24px) saturate(150%)',
          WebkitBackdropFilter: 'blur(24px) saturate(150%)',
          borderRadius: '16px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.7)',
          boxShadow: isDark
            ? '0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
          padding: '10px 14px',
        }}
      >
        {/* Attached images preview */}
        {attachedImages.length > 0 && (
          <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {attachedImages.map((img, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              >
                <img
                  src={img.preview}
                  alt={`Attachment ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  onClick={() => onRemoveImage(index)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', width: '100%' }}>
          {/* Add button with menu */}
          <div
            ref={attachmentMenuRef as React.RefObject<HTMLDivElement>}
            style={{ position: 'relative', alignSelf: 'center' }}
          >
            <motion.button
              onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: attachmentMenuOpen
                  ? isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.08)'
                  : 'transparent',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)',
                color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ rotate: attachmentMenuOpen ? 45 : 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </motion.button>

            {/* Attachment menu */}
            <AnimatePresence>
              {attachmentMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '0',
                    marginBottom: '8px',
                    background: isDark ? 'rgba(24, 24, 32, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '14px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: isDark ? '0 12px 40px rgba(0, 0, 0, 0.4)' : '0 12px 40px rgba(0, 0, 0, 0.12)',
                    overflow: 'hidden',
                    minWidth: '180px',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  {/* Upload Image button */}
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      color: isDark ? '#fff' : '#000',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    whileHover={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {t(EDITOR_LABEL_KEYS.CHAT_UPLOAD_IMAGE)}
                  </motion.button>

                  <div
                    style={{
                      height: '1px',
                      background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    }}
                  />

                  {/* Take Screenshot button */}
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 }}
                    onClick={onScreenshot}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      color: isDark ? '#fff' : '#000',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    whileHover={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="13" r="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t(EDITOR_LABEL_KEYS.CHAT_TAKE_SCREENSHOT)}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <textarea
            ref={textareaRef}
            data-testid="chat-input"
            value={inputValue}
            onChange={(e) => {
              onInputChange(e.target.value);

              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              step === 'describe'
                ? t(EDITOR_LABEL_KEYS.CHAT_PLACEHOLDER_DESCRIBE)
                : t(EDITOR_LABEL_KEYS.CHAT_PLACEHOLDER_CHANGES)
            }
            rows={1}
            style={{
              flex: 1,
              minWidth: 0,
              maxWidth: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: isDark ? '#fff' : '#000',
              fontSize: '14px',
              resize: 'none',
              minHeight: '36px',
              maxHeight: '150px',
              lineHeight: '1.5',
              padding: '8px 0',
              overflowY: 'auto',
            }}
          />

          {/* Send button */}
          <button
            data-testid="chat-send-button"
            onClick={handleSend}
            disabled={!inputValue.trim() && attachedImages.length === 0}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                inputValue.trim() || attachedImages.length > 0
                  ? isDark
                    ? '#fff'
                    : '#000'
                  : isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.08)',
              border: 'none',
              color:
                inputValue.trim() || attachedImages.length > 0
                  ? isDark
                    ? '#000'
                    : '#fff'
                  : isDark
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(0, 0, 0, 0.3)',
              cursor: inputValue.trim() || attachedImages.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              flexShrink: 0,
              alignSelf: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
