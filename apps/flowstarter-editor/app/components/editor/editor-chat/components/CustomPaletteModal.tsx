import { motion } from 'framer-motion';
import type { ColorPalette } from '~/components/editor/editor-chat/types';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface CustomPaletteModalProps {
  isOpen: boolean;
  isDark: boolean;
  customColors: string[];
  onColorsChange: (colors: string[]) => void;
  onClose: () => void;
  onSubmit: (palette: ColorPalette) => void;
}

export function CustomPaletteModal({
  isOpen,
  isDark,
  customColors,
  onColorsChange,
  onClose,
  onSubmit,
}: CustomPaletteModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleColorChange = (index: number, value: string) => {
    const newColors = [...customColors];
    newColors[index] = value;
    onColorsChange(newColors);
  };

  const handleSubmit = () => {
    const customPalette: ColorPalette = {
      id: 'custom',
      name: 'Custom',
      colors: customColors,
    };
    onSubmit(customPalette);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md p-6 rounded-2xl"
        style={{
          background: isDark ? '#14141e' : '#ffffff',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: isDark ? '#fff' : '#000' }}>
          {t(EDITOR_LABEL_KEYS.PALETTE_CREATE_TITLE)}
        </h3>

        {/* Color Pickers */}
        <div className="space-y-3 mb-6">
          {[
            { key: EDITOR_LABEL_KEYS.PALETTE_COLOR_PRIMARY, label: t(EDITOR_LABEL_KEYS.PALETTE_COLOR_PRIMARY) },
            { key: EDITOR_LABEL_KEYS.PALETTE_COLOR_SECONDARY, label: t(EDITOR_LABEL_KEYS.PALETTE_COLOR_SECONDARY) },
            { key: EDITOR_LABEL_KEYS.PALETTE_COLOR_ACCENT, label: t(EDITOR_LABEL_KEYS.PALETTE_COLOR_ACCENT) },
            { key: EDITOR_LABEL_KEYS.PALETTE_COLOR_BACKGROUND, label: t(EDITOR_LABEL_KEYS.PALETTE_COLOR_BACKGROUND) },
          ].map(({ key, label }, i) => (
            <div key={key} className="flex items-center gap-3">
              <label className="w-24 text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
                {label}
              </label>
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="w-10 h-10 rounded-lg cursor-pointer overflow-hidden"
                  style={{
                    backgroundColor: customColors[i],
                    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                  }}
                >
                  <input
                    type="color"
                    value={customColors[i]}
                    onChange={(e) => handleColorChange(i, e.target.value)}
                    className="w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={customColors[i]}
                  onChange={(e) => handleColorChange(i, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    color: isDark ? '#fff' : '#000',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div
          className="flex h-12 rounded-lg overflow-hidden mb-6"
          style={{
            boxShadow: isDark ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {customColors.map((color, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            }}
          >
            {t(EDITOR_LABEL_KEYS.COMMON_CANCEL)}
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
            style={{
              background: customColors[0],
            }}
          >
            {t(EDITOR_LABEL_KEYS.PALETTE_USE)}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
