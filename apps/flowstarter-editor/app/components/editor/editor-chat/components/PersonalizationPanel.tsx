/**
 * PersonalizationPanel Component
 *
 * Combined personalization step that includes:
 * - Color palette selection
 * - Font selection
 * - Logo upload/generation/skip
 * - AI images toggle (for template customization)
 */

import { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Type, ImageIcon, SkipForward, ChevronRight } from 'lucide-react';
import { PaletteSelector } from './PaletteSelector';
import { FontSelector } from './FontSelector';
import { LogoSection } from './LogoSection';
import { usePersonalizationPanel } from '../hooks/usePersonalizationPanel';
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

const SECTION_ANIMATION = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3 },
};

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
  const panel = usePersonalizationPanel({
    initialUseAiImages,
    businessInfo,
    onPaletteSelect,
    onFontSelect,
    onLogoSelect,
  });

  // Auto-select first template palette to skip palette section
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (autoSelectedRef.current) return;
    if (templatePalettes && templatePalettes.length > 0 && panel.currentSection === 'palette') {
      autoSelectedRef.current = true;
      // Convert TemplatePalette to ColorPalette and auto-select
      const first = templatePalettes[0];
      const autoColors = first.colors || {};
      const autoPalette: import('../types').ColorPalette = {
        name: first.name || 'Default',
        primary: autoColors.primary || '#3B82F6',
        secondary: autoColors.secondary || '#1E40AF',
        accent: autoColors.accent || '#F59E0B',
        background: autoColors.background || '#FFFFFF',
        text: autoColors.text || '#111827',
      };
      // Auto-select after a brief delay so the UI shows the transition
      setTimeout(() => panel.handlePaletteSelect(autoPalette), 300);
    } else if (templatePalette && panel.currentSection === 'palette') {
      autoSelectedRef.current = true;
      setTimeout(() => panel.handlePaletteSelect(templatePalette), 300);
    }
  }, [templatePalettes, templatePalette, panel.currentSection, panel.handlePaletteSelect]);

  // Theme colors - glassmorphism palette
  const colors = useMemo(
    () => ({
      cardBg: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.7)',
      inputBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.5)',
      border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      text: isDark ? '#ffffff' : '#111827',
      textSecondary: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6b7280',
    }),
    [isDark],
  );

  const headingColor = isDark ? '#fff' : '#1f2937';

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
      {/* Header: Progress + Skip to build */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
        {panel.sections.map((section, index) => (
          <div
            key={section}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background:
                index <= panel.sectionIndex
                  ? 'linear-gradient(135deg, rgba(77, 93, 217, 0.8), rgba(6, 182, 212, 0.6))'
                  : isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
        </div>
        <button
          onClick={panel.handleSkipAll}
          data-testid="skip-customization"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            marginLeft: '12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.45)',
            background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)';
            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.45)';
            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
          }}
        >
          Skip to build
          <SkipForward size={14} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Palette Section */}
        {panel.currentSection === 'palette' && (
          <motion.div key="palette" data-testid="palette-section" {...SECTION_ANIMATION}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Palette size={20} color={headingColor} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: headingColor }}>
                {t(EDITOR_LABEL_KEYS.PERSONALIZE_COLORS)}
              </h3>
              <button
                onClick={panel.handleSkipSection}
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                  background: 'transparent',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
              >
                Skip <ChevronRight size={14} />
              </button>
            </div>
            <PaletteSelector
              templatePalette={templatePalette || null}
              isDark={isDark}
              onSelect={panel.handlePaletteSelect}
              onCustomClick={onCustomPaletteClick || (() => {})}
              customColors={[]}
              templatePalettes={templatePalettes}
            />
          </motion.div>
        )}

        {/* Font Section */}
        {panel.currentSection === 'font' && (
          <motion.div key="font" data-testid="font-section" {...SECTION_ANIMATION}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Type size={20} color={headingColor} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: headingColor }}>
                {t(EDITOR_LABEL_KEYS.PERSONALIZE_FONTS)}
              </h3>
              <button
                onClick={panel.handleSkipSection}
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                  background: 'transparent',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
              >
                Skip <ChevronRight size={14} />
              </button>
            </div>
            <FontSelector
              isDark={isDark}
              fontsLoaded={fontsLoaded}
              onSelect={panel.handleFontSelect}
              templateFonts={templateFonts}
            />
          </motion.div>
        )}

        {/* Logo Section */}
        {panel.currentSection === 'logo' && (
          <motion.div key="logo" data-testid="logo-section" {...SECTION_ANIMATION}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ImageIcon size={20} color={headingColor} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: headingColor }}>
                {t(EDITOR_LABEL_KEYS.PERSONALIZE_LOGO)}
              </h3>
            </div>
            <LogoSection
              isDark={isDark}
              colors={colors}
              uploading={panel.uploading}
              generating={panel.generating}
              generationPrompt={panel.generationPrompt}
              generationError={panel.generationError}
              useAiImages={panel.useAiImages}
              fileInputRef={panel.fileInputRef}
              onPromptChange={panel.setGenerationPrompt}
              onFileUpload={panel.handleFileUpload}
              onGenerateLogo={panel.handleGenerateLogo}
              onSkipLogo={panel.handleSkipLogo}
              onToggleAiImages={() => panel.setUseAiImages(!panel.useAiImages)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
