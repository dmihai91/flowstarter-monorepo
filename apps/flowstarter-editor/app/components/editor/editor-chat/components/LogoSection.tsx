/**
 * LogoSection Component
 *
 * Logo upload, AI generation, AI images toggle, and skip options.
 * Part of the PersonalizationPanel flow.
 */

import { memo } from 'react';
import { Upload, Sparkles, ArrowRight, Wand2 } from 'lucide-react';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface LogoSectionColors {
  cardBg: string;
  inputBg: string;
  border: string;
  text: string;
  textSecondary: string;
}

interface LogoSectionProps {
  isDark: boolean;
  colors: LogoSectionColors;
  uploading: boolean;
  generating: boolean;
  generationPrompt: string;
  generationError: string | null;
  useAiImages: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPromptChange: (value: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateLogo: () => void;
  onSkipLogo: () => void;
  onToggleAiImages: () => void;
}

export const LogoSection = memo(function LogoSection({
  isDark,
  colors,
  uploading,
  generating,
  generationPrompt,
  generationError,
  useAiImages,
  fileInputRef,
  onPromptChange,
  onFileUpload,
  onGenerateLogo,
  onSkipLogo,
  onToggleAiImages,
}: LogoSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Error message */}
      {generationError && (
        <div
          style={{
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '14px',
          }}
        >
          {generationError}
        </div>
      )}

      {/* Upload option */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{
          padding: '16px',
          background: isDark ? '#14141e' : '#fff',
          border: `2px dashed ${isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)'}`,
          borderRadius: '12px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: uploading ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!uploading) {
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.background = isDark ? '#1f1f2e' : '#f9fafb';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)';
          e.currentTarget.style.background = isDark ? '#14141e' : '#fff';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(77, 93, 217, 0.8), rgba(6, 182, 212, 0.6))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Upload size={24} color="#fff" />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#fff' : '#1f2937', marginBottom: '4px' }}>
              {uploading ? t(EDITOR_LABEL_KEYS.PERSONALIZE_UPLOADING) : t(EDITOR_LABEL_KEYS.PERSONALIZE_UPLOAD_LOGO)}
            </div>
            <div style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
              {t(EDITOR_LABEL_KEYS.PERSONALIZE_LOGO_FORMATS)}
            </div>
          </div>
        </div>
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileUpload} style={{ display: 'none' }} />

      {/* Generate option */}
      <div
        style={{
          padding: '16px',
          background: isDark ? '#14141e' : '#fff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={24} color="#fff" />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#fff' : '#1f2937', marginBottom: '4px' }}>
              {t(EDITOR_LABEL_KEYS.PERSONALIZE_GENERATE_AI)}
            </div>
            <div style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
              {t(EDITOR_LABEL_KEYS.PERSONALIZE_AI_POWERED)}
            </div>
          </div>
        </div>

        <input
          type="text"
          value={generationPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && generationPrompt.trim() && !generating) {
              onGenerateLogo();
            }
          }}
          placeholder={t(EDITOR_LABEL_KEYS.PERSONALIZE_LOGO_PLACEHOLDER)}
          disabled={generating}
          style={{
            width: '100%',
            padding: '12px',
            background: isDark ? '#1a1a24' : '#f9fafb',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: '8px',
            fontSize: '14px',
            color: isDark ? '#fff' : '#1f2937',
            marginBottom: '8px',
          }}
        />

        <button
          onClick={onGenerateLogo}
          disabled={!generationPrompt.trim() || generating}
          style={{
            width: '100%',
            padding: '10px',
            background:
              generating || !generationPrompt.trim()
                ? isDark
                  ? 'rgba(99, 102, 241, 0.3)'
                  : 'rgba(99, 102, 241, 0.2)'
                : 'linear-gradient(135deg, rgba(77, 93, 217, 0.8), rgba(6, 182, 212, 0.6))',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: generating || !generationPrompt.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {generating ? (
            <>
              <Sparkles size={16} />
              {t(EDITOR_LABEL_KEYS.PERSONALIZE_GENERATING)}
            </>
          ) : (
            t(EDITOR_LABEL_KEYS.PERSONALIZE_GENERATE_AI)
          )}
        </button>
      </div>

      {/* AI Images Toggle */}
      <div
        data-testid="ai-images-toggle"
        onClick={onToggleAiImages}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          borderRadius: '12px',
          background: useAiImages ? 'rgba(251, 146, 60, 0.1)' : colors.cardBg,
          border: `1px solid ${useAiImages ? 'rgba(251, 146, 60, 0.3)' : colors.border}`,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: useAiImages ? 'rgba(251, 146, 60, 0.2)' : colors.inputBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Wand2 size={20} style={{ color: useAiImages ? '#FB923C' : colors.textSecondary }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: colors.text }}>Generate AI Images</div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
            Create custom images for your site (slower build)
          </div>
        </div>
        <div
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            background: useAiImages ? '#FB923C' : colors.inputBg,
            position: 'relative',
            transition: 'background 0.2s',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#ffffff',
              position: 'absolute',
              top: '2px',
              left: useAiImages ? '22px' : '2px',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </div>
      </div>

      {/* Skip option */}
      <button
        data-testid="skip-logo-button"
        onClick={onSkipLogo}
        style={{
          padding: '12px',
          background: 'transparent',
          border: 'none',
          fontSize: '14px',
          color: '#6366f1',
          cursor: 'pointer',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {t(EDITOR_LABEL_KEYS.PERSONALIZE_SKIP)}
        <ArrowRight size={16} />
      </button>
    </div>
  );
});
