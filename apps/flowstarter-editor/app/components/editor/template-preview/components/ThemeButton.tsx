import { forwardRef } from 'react';
import { ChevronDown, Palette } from 'lucide-react';
import type { ColorPalette } from '~/lib/stores/palettes';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface ThemeButtonProps {
  selectedPalette: ColorPalette;
  isLoading: boolean;
  isDropdownOpen: boolean;
  onClick: () => void;
  isDark: boolean;
}

export const ThemeButton = forwardRef<HTMLButtonElement, ThemeButtonProps>(
  ({ selectedPalette, isLoading, isDropdownOpen, onClick, isDark }, ref) => {
    const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
    const hoverBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    const activeBg = isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)';
    const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const activeBorder = '#6366f1';
    const textColor = isDark ? '#fff' : '#18181b';
    const mutedColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';

    return (
      <button
        ref={ref}
        type="button"
        disabled={isLoading}
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: isDropdownOpen ? activeBg : bg,
          border: `1px solid ${isDropdownOpen ? activeBorder : border}`,
          borderRadius: 10,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          opacity: isLoading ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isDropdownOpen) {
            e.currentTarget.style.background = hoverBg;
          }
        }}
        onMouseLeave={(e) => {
          if (!isDropdownOpen) {
            e.currentTarget.style.background = bg;
          }
        }}
      >
        {/* Color bars - vertical strips like the dropdown */}
        <div
          style={{
            display: 'flex',
            borderRadius: 4,
            overflow: 'hidden',
            width: 48,
            height: 20,
          }}
        >
          {selectedPalette.colors.slice(0, 4).map((color, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: color,
              }}
            />
          ))}
        </div>

        {/* Text */}
        <span style={{ fontSize: 13, fontWeight: 500, color: textColor }}>
          {isLoading ? t(EDITOR_LABEL_KEYS.COMMON_LOADING) : selectedPalette.name}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={14}
          style={{
            color: mutedColor,
            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>
    );
  },
);

ThemeButton.displayName = 'ThemeButton';
