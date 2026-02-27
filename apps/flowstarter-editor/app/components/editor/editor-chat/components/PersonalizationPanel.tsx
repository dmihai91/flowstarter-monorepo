/**
 * PersonalizationPanel Component
 *
 * Combined personalization step that includes:
 * - Color palette selection
 * - Font selection
 * - Logo upload/generation/skip
 * - AI images toggle (for template customization)
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Type, Upload, Sparkles, ArrowRight, ImageIcon, Wand2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { useMutation as useReactQueryMutation } from '@tanstack/react-query';
import { api } from '~/convex/_generated/api';
import type { Id } from '~/convex/_generated/dataModel';
import { PaletteSelector } from './PaletteSelector';
import { FontSelector } from './FontSelector';
import type { LogoInfo, ColorPalette, SystemFont, BusinessInfo } from '../types';
import type { TemplatePalette, TemplateFont } from '~/components/editor/template-preview/types';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface PersonalizationPanelProps {
  isDark: boolean;
  fontsLoaded: boolean;
  templatePalette?: ColorPalette | null;
  templatePalettes?: TemplatePalette[];
  templateFonts?: TemplateFont[];
  businessInfo?: Partial<BusinessInfo>;
  initialUseAiImages?: boolean;
  onPaletteSelect: (palette: ColorPalette) => void;
  onCustomPaletteClick?: () => void;
  onFontSelect: (font: SystemFont) => void;
  onLogoSelect: (logo: LogoInfo, useAiImages?: boolean) => void;
}

type PersonalizationSection = 'palette' | 'font' | 'logo';

export function PersonalizationPanel({
  isDark,
  fontsLoaded,
  templatePalette,
  templatePalettes,
  templateFonts,
  businessInfo,
  initialUseAiImages = false,
  onPaletteSelect,
  onCustomPaletteClick,
  onFontSelect,
  onLogoSelect,
}: PersonalizationPanelProps) {
  const [currentSection, setCurrentSection] = useState<PersonalizationSection>('palette');
  const [selectedLogo, setSelectedLogo] = useState<LogoInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [useAiImages, setUseAiImages] = useState(initialUseAiImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex mutations for logo upload
  const generateUploadUrl = useMutation(api.logos.generateUploadUrl);
  const saveLogo = useMutation(api.logos.saveLogo);

  // Handle palette selection
  const handlePaletteSelect = useCallback(
    (palette: ColorPalette) => {
      onPaletteSelect(palette);
      setCurrentSection('font');
    },
    [onPaletteSelect],
  );

  // Handle font selection
  const handleFontSelect = useCallback(
    (font: SystemFont) => {
      onFontSelect(font);
      setTimeout(() => {
        setCurrentSection('logo');
      }, 100);
    },
    [onFontSelect],
  );

  // Handle logo upload
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (!file) {
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setGenerationError('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setGenerationError('Please upload an image file');
        return;
      }

      setUploading(true);
      setGenerationError(null);

      try {
        const uploadUrl = await generateUploadUrl();

        const uploadResult = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadResult.ok) {
          throw new Error('Failed to upload file');
        }

        const uploadData = (await uploadResult.json()) as { storageId: Id<'_storage'> };

        const result = await saveLogo({
          projectId: businessInfo?.uvp || 'temp',
          storageId: uploadData.storageId,
          type: 'uploaded',
        });

        const logoInfo: LogoInfo = {
          type: 'uploaded',
          url: result.url!,
          file,
        };

        setSelectedLogo(logoInfo);
        onLogoSelect(logoInfo, useAiImages);
      } catch (error) {
        console.error('Error uploading logo:', error);
        setGenerationError('Failed to upload logo. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl, saveLogo, businessInfo, onLogoSelect, useAiImages],
  );

  // React Query mutation for logo generation
  const generateLogoMutation = useReactQueryMutation({
    mutationFn: async (params: { prompt: string; businessInfo: Partial<BusinessInfo> | undefined }) => {
      const response = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: params.prompt,
          businessInfo: {
            uvp: params.businessInfo?.uvp,
            brandTone: params.businessInfo?.brandTone,
            industry: params.businessInfo?.industry,
          },
        }),
      });

      const data = (await response.json()) as { success?: boolean; imageUrl?: string; error?: string };

      if (!data.success || !data.imageUrl) {
        throw new Error(data.error || 'Failed to generate logo');
      }

      return data.imageUrl;
    },
    retry: 1,
    retryDelay: 2000,
  });

  // Handle logo generation
  const handleGenerateLogo = useCallback(async () => {
    if (!generationPrompt.trim()) {
      return;
    }

    setGenerating(true);
    setGenerationError(null);

    try {
      const imageUrl = await generateLogoMutation.mutateAsync({
        prompt: generationPrompt,
        businessInfo,
      });

      setGeneratedImageUrl(imageUrl);

      const logoInfo: LogoInfo = {
        type: 'generated',
        url: imageUrl,
        prompt: generationPrompt,
      };

      setSelectedLogo(logoInfo);
      onLogoSelect(logoInfo, useAiImages);
    } catch (error) {
      console.error('Error generating logo:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate logo');
    } finally {
      setGenerating(false);
    }
  }, [generationPrompt, businessInfo, onLogoSelect, generateLogoMutation, useAiImages]);

  // Handle skip logo
  const handleSkipLogo = useCallback(() => {
    const logoInfo: LogoInfo = {
      type: 'none',
    };

    setSelectedLogo(logoInfo);
    onLogoSelect(logoInfo, useAiImages);
  }, [onLogoSelect, useAiImages]);

  const sections: PersonalizationSection[] = ['palette', 'font', 'logo'];
  const sectionIndex = sections.indexOf(currentSection);

  // Theme colors - glassmorphism palette
  const colors = {
    cardBg: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.7)',
    inputBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.5)',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    text: isDark ? '#ffffff' : '#111827',
    textSecondary: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6b7280',
  };

  return (
    <div
      data-testid="personalization-panel"
      style={{
        background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '20px',
        padding: '24px',
        marginTop: '16px',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: isDark
          ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
      }}
    >
      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {sections.map((section, index) => {
          const isActive = index <= sectionIndex;

          return (
            <div
              key={section}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: isActive
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
                transition: 'background 0.3s ease',
              }}
            />
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Palette Section */}
        {currentSection === 'palette' && (
          <motion.div
            key="palette"
            data-testid="palette-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Palette size={20} color={isDark ? '#fff' : '#1f2937'} />
              <h3
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: isDark ? '#fff' : '#1f2937',
                }}
              >
                {t(EDITOR_LABEL_KEYS.PERSONALIZE_COLORS)}
              </h3>
            </div>
            <PaletteSelector
              templatePalette={templatePalette || null}
              isDark={isDark}
              onSelect={handlePaletteSelect}
              onCustomClick={onCustomPaletteClick || (() => {})}
              customColors={[]}
              templatePalettes={templatePalettes}
            />
          </motion.div>
        )}

        {/* Font Section */}
        {currentSection === 'font' && (
          <motion.div
            key="font"
            data-testid="font-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Type size={20} color={isDark ? '#fff' : '#1f2937'} />
              <h3
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: isDark ? '#fff' : '#1f2937',
                }}
              >
                {t(EDITOR_LABEL_KEYS.PERSONALIZE_FONTS)}
              </h3>
            </div>
            <FontSelector
              isDark={isDark}
              fontsLoaded={fontsLoaded}
              onSelect={handleFontSelect}
              templateFonts={templateFonts}
            />
          </motion.div>
        )}

        {/* Logo Section */}
        {currentSection === 'logo' && (
          <motion.div
            key="logo"
            data-testid="logo-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ImageIcon size={20} color={isDark ? '#fff' : '#1f2937'} />
              <h3
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: isDark ? '#fff' : '#1f2937',
                }}
              >
                {t(EDITOR_LABEL_KEYS.PERSONALIZE_LOGO)}
              </h3>
            </div>

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
                  marginBottom: '12px',
                }}
              >
                {generationError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Upload size={24} color="#fff" />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isDark ? '#fff' : '#1f2937',
                        marginBottom: '4px',
                      }}
                    >
                      {uploading
                        ? t(EDITOR_LABEL_KEYS.PERSONALIZE_UPLOADING)
                        : t(EDITOR_LABEL_KEYS.PERSONALIZE_UPLOAD_LOGO)}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                      }}
                    >
                      {t(EDITOR_LABEL_KEYS.PERSONALIZE_LOGO_FORMATS)}
                    </div>
                  </div>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

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
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isDark ? '#fff' : '#1f2937',
                        marginBottom: '4px',
                      }}
                    >
                      {t(EDITOR_LABEL_KEYS.PERSONALIZE_GENERATE_AI)}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                      }}
                    >
                      {t(EDITOR_LABEL_KEYS.PERSONALIZE_AI_POWERED)}
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && generationPrompt.trim() && !generating) {
                      handleGenerateLogo();
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
                  onClick={handleGenerateLogo}
                  disabled={!generationPrompt.trim() || generating}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background:
                      generating || !generationPrompt.trim()
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.3)'
                          : 'rgba(99, 102, 241, 0.2)'
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
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
                onClick={() => setUseAiImages(!useAiImages)}
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
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: useAiImages ? 'rgba(251, 146, 60, 0.2)' : colors.inputBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Wand2 size={20} style={{ color: useAiImages ? '#FB923C' : colors.textSecondary }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: colors.text }}>
                    Generate AI Images
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                    Create custom images for your site (slower build)
                  </div>
                </div>
                <div style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: useAiImages ? '#FB923C' : colors.inputBg,
                  position: 'relative',
                  transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: '2px',
                    left: useAiImages ? '22px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>

              {/* Skip option */}
              <button
                data-testid="skip-logo-button"
                onClick={handleSkipLogo}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
