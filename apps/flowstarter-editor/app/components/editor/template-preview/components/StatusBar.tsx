import type { ColorPalette } from '~/lib/stores/palettes';
import type { ViewportType } from '~/components/editor/template-preview/types';
import { VIEWPORT_CONFIG } from '~/components/editor/template-preview/constants';
import { getColors } from '~/components/editor/hooks/useThemeStyles';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface StatusBarProps {
  viewport: ViewportType;
  selectedPalette: ColorPalette;
  isDark: boolean;
}

export function StatusBar({ viewport, selectedPalette, isDark }: StatusBarProps) {
  const colors = getColors(isDark);

  return (
    <div
      className="flex items-center justify-between px-5 py-2.5 border-t"
      style={{ borderColor: colors.surfaceLight, background: colors.surfaceMedium }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs" style={{ color: colors.textMuted }}>
            {t(EDITOR_LABEL_KEYS.STATUS_LIVE_PREVIEW)}
          </span>
        </div>
        <span className="text-xs" style={{ color: colors.textDisabled }}>
          •
        </span>
        <span className="text-xs" style={{ color: colors.textMuted }}>
          {viewport === 'desktop' ? t(EDITOR_LABEL_KEYS.VIEWPORT_FULL_WIDTH) : `${VIEWPORT_CONFIG[viewport].width}px`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1">
          {selectedPalette.colors.slice(0, 4).map((color, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full border"
              style={{ background: color, borderColor: colors.bgPrimary }}
            />
          ))}
        </div>
        <span className="text-xs" style={{ color: colors.textMuted }}>
          {selectedPalette.name}
        </span>
      </div>
    </div>
  );
}
