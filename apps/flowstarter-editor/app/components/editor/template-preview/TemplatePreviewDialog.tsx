import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Check } from 'lucide-react';
import { getTemplateLiveUrl } from '~/lib/config/templates';
import { getAllPalettes, type ColorPalette } from '~/lib/stores/palettes';
import { useThemeStyles, getColors } from '~/components/editor/hooks/useThemeStyles';
import type { TemplatePreviewDialogProps, ViewportType } from './types';
import { useTemplateTheme } from './hooks';
import { BrowserChrome, TemplateHeader } from './components';

export function TemplatePreviewDialog({
  isOpen,
  template,
  initialPalette,
  recommendationPalettes,
  onClose,
  onUseTemplate,
}: TemplatePreviewDialogProps) {
  const [viewport, setViewport] = useState<ViewportType>('desktop');
  const [iframeLoading, setIframeLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Get app theme for UI styling
  const { isDark: appIsDark } = useThemeStyles();
  const colors = getColors(appIsDark);

  const { selectedPalette, setSelectedPalette, templatePalette, isLoadingTheme } = useTemplateTheme(
    template,
    isOpen,
    initialPalette,
  );

  // Handle escape key for closing
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Reset loading state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIframeLoading(true);
    } else {
      setShowDropdown(false);
    }
  }, [isOpen]);

  const handleToggleDropdown = useCallback(() => {
    if (themeButtonRef.current) {
      setButtonRect(themeButtonRef.current.getBoundingClientRect());
    }

    setShowDropdown((prev) => !prev);
  }, []);

  const handleSelectPalette = useCallback(
    (palette: ColorPalette) => {
      setSelectedPalette(palette);
      setShowDropdown(false);
      setIframeLoading(true);
    },
    [setSelectedPalette],
  );

  const handleCloseDropdown = useCallback(() => {
    setShowDropdown(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setIframeLoading(true);

    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
  }, []);

  /*
   * Note: iframe src is now set directly via the src attribute using iframeSrc
   * which is computed from getTemplateLiveUrl() - no useEffect needed
   */

  const handleUseTemplate = useCallback(() => {
    if (template) {
      onUseTemplate(template, selectedPalette);
    }
  }, [template, selectedPalette, onUseTemplate]);

  // Determine if using template's original theme or a custom palette
  const isDefaultTheme = selectedPalette.id === 'default';

  // Template preview mode (light/dark) - default to dark for original theme
  const previewMode: 'dark' | 'light' = 'dark';

  // Memoize iframe URL to prevent unnecessary reloads
  const iframeSrc = useMemo(() => {
    if (!template?.id) {
      return '';
    }

    return getTemplateLiveUrl(template.id, isDefaultTheme ? undefined : selectedPalette.id, previewMode);
  }, [template?.id, isDefaultTheme, selectedPalette.id, previewMode]);

  /*
   * Memoize all palettes to prevent unnecessary recalculations
   * Include recommendation palettes (converted to ColorPalette format) at the top
   */
  const allPalettes = useMemo(() => {
    // Convert recommendation palettes (TemplatePalette) to ColorPalette format
    const recommendationColorPalettes: ColorPalette[] = (recommendationPalettes || []).map((p) => ({
      id: p.id,
      name: p.name,
      colors: [p.colors.primary, p.colors.secondary, p.colors.accent, p.colors.background] as [
        string,
        string,
        string,
        string,
      ],
    }));

    // Build palette list: template default, recommendation palettes, then standard palettes
    const basePalettes = [templatePalette, ...recommendationColorPalettes, ...getAllPalettes(templatePalette)];

    // Dedupe by id
    return basePalettes.filter((palette, index, self) => index === self.findIndex((p) => p.id === palette.id));
  }, [templatePalette, recommendationPalettes]);

  if (!template) {
    return null;
  }

  // Don't render anything if not open
  if (!isOpen) {
    return null;
  }

  // Guard against null selectedPalette (can happen during initialization)
  if (!selectedPalette) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{
          background: appIsDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(12px)',
        }}
        onClick={onClose}
      />
      {/* Modal */}
      <div
        ref={dialogRef}
        className="fixed z-50 p-0 rounded-xl overflow-hidden"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '98vw',
          height: '98vh',
          maxWidth: '1920px',
          maxHeight: '98vh',
          background: colors.bgPrimary,
          border: colors.borderLight,
          boxShadow: appIsDark ? '0 32px 64px rgba(0,0,0,0.5)' : '0 32px 64px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex flex-col" style={{ height: '100%' }}>
          <TemplateHeader
            template={template}
            viewport={viewport}
            onViewportChange={setViewport}
            selectedPalette={selectedPalette}
            isLoadingTheme={isLoadingTheme}
            isDropdownOpen={showDropdown}
            themeButtonRef={themeButtonRef}
            onThemeButtonClick={handleToggleDropdown}
            onUseTemplate={handleUseTemplate}
            onClose={onClose}
            isDark={appIsDark}
          />

          <BrowserChrome templateId={template.id} onRefresh={handleRefresh} isDark={appIsDark} />

          {/* Preview Area with Iframe - Full height */}
          <div
            className="relative"
            style={{
              flex: 1,
              minHeight: 0,
              background: previewMode === 'dark' ? '#0a0a0e' : '#fafafa',
            }}
          >
            {/* Loading overlay */}
            {(iframeLoading || isLoadingTheme) && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center"
                style={{ background: 'rgba(10,10,14,0.95)' }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#4D5DD9] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-white/50">Loading preview...</span>
                </div>
              </div>
            )}

            {/* Iframe for template preview */}
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                background: '#0a0a0e',
                opacity: isLoadingTheme ? 0 : 1,
                pointerEvents: isLoadingTheme ? 'none' : 'auto',
              }}
              onLoad={handleIframeLoad}
              title={`Template preview: ${template?.id}`}
              // Allow all features for proper template rendering
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          {/* Inline Theme Dropdown - rendered inside dialog to avoid z-index issues */}
          {showDropdown && (
            <>
              {/* Backdrop to close dropdown */}
              <div onClick={handleCloseDropdown} className="fixed inset-0" style={{ zIndex: 100 }} />

              {/* Dropdown positioned below theme button */}
              <div
                className="absolute"
                style={{
                  top: buttonRect ? buttonRect.bottom - (dialogRef.current?.getBoundingClientRect()?.top || 0) + 8 : 0,
                  right: 180,
                  zIndex: 101,
                  width: 280,
                  maxHeight: 400,
                  background: appIsDark ? '#18181f' : '#ffffff',
                  border: `1px solid ${appIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: 12,
                  boxShadow: appIsDark ? '0 16px 48px rgba(0,0,0,0.5)' : '0 16px 48px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${appIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: appIsDark ? '#fff' : '#000',
                    }}
                  >
                    Choose Theme
                  </div>
                </div>

                {/* Scrollable list */}
                <div
                  style={{
                    maxHeight: 340,
                    overflowY: 'auto',
                    padding: 8,
                  }}
                >
                  {allPalettes.map((palette) => {
                    const isSelected = selectedPalette.id === palette.id;
                    return (
                      <div
                        key={palette.id}
                        onClick={() => handleSelectPalette(palette)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          background: isSelected
                            ? appIsDark
                              ? 'rgba(99,102,241,0.15)'
                              : 'rgba(99,102,241,0.1)'
                            : 'transparent',
                          border: isSelected ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                          marginBottom: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {/* Color bars preview */}
                        <div
                          style={{
                            display: 'flex',
                            borderRadius: 6,
                            overflow: 'hidden',
                            width: 56,
                            height: 32,
                            flexShrink: 0,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }}
                        >
                          {palette.colors.slice(0, 4).map((color, i) => (
                            <div
                              key={i}
                              style={{
                                flex: 1,
                                background: color,
                              }}
                            />
                          ))}
                        </div>

                        {/* Name */}
                        <span
                          style={{
                            flex: 1,
                            fontSize: 13,
                            fontWeight: 500,
                            color: isSelected
                              ? appIsDark
                                ? '#fff'
                                : '#000'
                              : appIsDark
                                ? 'rgba(255,255,255,0.7)'
                                : 'rgba(0,0,0,0.7)',
                          }}
                        >
                          {palette.name}
                        </span>

                        {/* Check mark */}
                        {isSelected && <Check size={16} color="#6366f1" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
