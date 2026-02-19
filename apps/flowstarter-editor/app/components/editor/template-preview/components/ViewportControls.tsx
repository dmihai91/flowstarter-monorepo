import type { ViewportType } from '~/components/editor/template-preview/types';
import { VIEWPORT_CONFIG } from '~/components/editor/template-preview/constants';
import { getColors } from '~/components/editor/hooks/useThemeStyles';

interface ViewportControlsProps {
  viewport: ViewportType;
  onViewportChange: (viewport: ViewportType) => void;
  isDark: boolean;
}

export function ViewportControls({ viewport, onViewportChange, isDark }: ViewportControlsProps) {
  const colors = getColors(isDark);

  return (
    <div className="flex items-center p-1 rounded-lg" style={{ background: colors.surfaceLight }}>
      {(Object.entries(VIEWPORT_CONFIG) as [ViewportType, (typeof VIEWPORT_CONFIG)['mobile']][]).map(
        ([key, config]) => (
          <button
            key={key}
            type="button"
            onClick={() => onViewportChange(key)}
            className="px-3 py-2 rounded-md flex items-center gap-2 transition-all"
            style={{
              background: viewport === key ? 'rgba(77, 93, 217, 0.3)' : 'transparent',
              color: viewport === key ? colors.textPrimary : colors.textMuted,
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
            </svg>
            <span className="text-sm font-medium">{config.label}</span>
          </button>
        ),
      )}
    </div>
  );
}
