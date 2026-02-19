import type { ColorPalette } from '~/lib/stores/palettes';
import type { Template, ViewportType } from '~/components/editor/template-preview/types';
import { getColors } from '~/components/editor/hooks/useThemeStyles';
import { ViewportControls } from './ViewportControls';
import { ThemeButton } from './ThemeButton';

interface TemplateHeaderProps {
  template: Template;
  viewport: ViewportType;
  onViewportChange: (viewport: ViewportType) => void;
  selectedPalette: ColorPalette;
  isLoadingTheme: boolean;
  isDropdownOpen: boolean;
  themeButtonRef: React.RefObject<HTMLButtonElement | null>;
  onThemeButtonClick: () => void;
  onUseTemplate: () => void;
  onClose: () => void;
  isDark: boolean;
}

export function TemplateHeader({
  template,
  viewport,
  onViewportChange,
  selectedPalette,
  isLoadingTheme,
  isDropdownOpen,
  themeButtonRef,
  onThemeButtonClick,
  onUseTemplate,
  onClose,
  isDark,
}: TemplateHeaderProps) {
  const colors = getColors(isDark);

  return (
    <div
      className="flex items-center justify-between px-5 py-4 border-b"
      style={{ borderColor: colors.surfaceLight, background: colors.surfaceSubtle, flexShrink: 0 }}
    >
      {/* Left: Template Info */}
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #4D5DD9 0%, #6B7AE8 100%)' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            {template.name}
          </h2>
          <p className="text-sm capitalize" style={{ color: colors.textMuted }}>
            {template.category?.replace('-', ' ')}
          </p>
        </div>
      </div>

      {/* Center: Viewport Controls */}
      <ViewportControls viewport={viewport} onViewportChange={onViewportChange} isDark={isDark} />

      {/* Right: Theme + Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Button */}
        <ThemeButton
          ref={themeButtonRef}
          selectedPalette={selectedPalette}
          isLoading={isLoadingTheme}
          isDropdownOpen={isDropdownOpen}
          onClick={onThemeButtonClick}
          isDark={isDark}
        />

        {/* Divider */}
        <div className="w-px h-8" style={{ background: colors.surfaceLight }} />

        {/* Use Template Button */}
        <button
          type="button"
          onClick={onUseTemplate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #4D5DD9 0%, #6B7AE8 100%)',
            boxShadow: '0 4px 16px rgba(77, 93, 217, 0.4)',
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Use Template
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
          style={{ background: colors.surfaceLight }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: colors.textMuted }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
