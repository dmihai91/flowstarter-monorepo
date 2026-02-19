import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFilteredPalettes } from '~/lib/stores/palettes';
import type { ColorPalette } from '~/components/editor/editor-chat/types';
import type { TemplatePalette } from '~/components/editor/template-preview/types';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface PaletteSelectorProps {
  templatePalette: ColorPalette | null;
  isDark: boolean;
  onSelect: (palette: ColorPalette) => void;
  onCustomClick: () => void;
  customColors: string[];

  /** Template-specific curated palettes (if provided, these are shown instead of global palettes) */
  templatePalettes?: TemplatePalette[];
}

/**
 * Convert TemplatePalette to ColorPalette format
 */
function toColorPalette(palette: TemplatePalette): ColorPalette {
  return {
    id: palette.id,
    name: palette.name,
    colors: [palette.colors.primary, palette.colors.secondary, palette.colors.accent, palette.colors.background],
  };
}

export function PaletteSelector({
  templatePalette,
  isDark,
  onSelect,
  onCustomClick,
  customColors,
  templatePalettes,
}: PaletteSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Use template-specific palettes if provided, otherwise fall back to global filtered palettes
  const palettes: ColorPalette[] = templatePalettes
    ? templatePalettes.map(toColorPalette)
    : getFilteredPalettes(templatePalette);

  // If using global palettes and there's a template palette, prepend it
  const allPalettes =
    !templatePalettes && templatePalette ? [{ ...templatePalette, isTemplate: true }, ...palettes] : palettes;

  const handleSelect = (palette: ColorPalette) => {
    setSelectedId(palette.id);
    setTimeout(() => {
      onSelect(palette);
    }, 200);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-10 grid grid-cols-2 gap-4 mt-4">
      <AnimatePresence>
        {allPalettes.map((palette, index) => {
          const isTemplate = 'isTemplate' in palette && palette.isTemplate;
          const isSelected = selectedId === palette.id;
          const isHovered = hoveredId === palette.id;
          const isFirst = index === 0 && templatePalettes && templatePalettes.length > 0;

          return (
            <motion.button
              key={palette.id}
              data-testid={`palette-option-${palette.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              onClick={() => handleSelect(palette)}
              onMouseEnter={() => setHoveredId(palette.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group text-left p-5 rounded-2xl relative cursor-pointer"
              style={{
                background: isDark ? '#14141e' : '#ffffff',
                border: isSelected
                  ? '2px solid rgba(99, 102, 241, 0.8)'
                  : isTemplate || isFirst
                    ? isDark
                      ? '2px solid rgba(99, 102, 241, 0.4)'
                      : '2px solid rgba(99, 102, 241, 0.3)'
                    : isHovered
                      ? isDark
                        ? '1px solid rgba(255, 255, 255, 0.2)'
                        : '1px solid rgba(0, 0, 0, 0.15)'
                      : isDark
                        ? '1px solid rgba(255, 255, 255, 0.08)'
                        : '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: isSelected
                  ? '0 0 0 4px rgba(99, 102, 241, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)'
                  : isTemplate || isFirst
                    ? isDark
                      ? '0 4px 24px rgba(99, 102, 241, 0.2)'
                      : '0 4px 20px rgba(99, 102, 241, 0.15)'
                    : isHovered
                      ? isDark
                        ? '0 12px 40px rgba(0, 0, 0, 0.5)'
                        : '0 12px 40px rgba(0, 0, 0, 0.12)'
                      : isDark
                        ? '0 4px 24px rgba(0, 0, 0, 0.4)'
                        : '0 4px 20px rgba(0, 0, 0, 0.08)',
                transform: isHovered && !isSelected ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.2s ease-out',
              }}
            >
              {/* Recommended badge for template or first curated palette */}
              {(isTemplate || isFirst) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -top-2.5 -right-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  {isTemplate ? t(EDITOR_LABEL_KEYS.PALETTE_RECOMMENDED) : t(EDITOR_LABEL_KEYS.PALETTE_BEST_MATCH)}
                </motion.div>
              )}

              {/* Color bar */}
              <div
                className="flex h-14 rounded-xl overflow-hidden mb-4"
                style={{
                  boxShadow: isDark ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {palette.colors.map((color, i) => (
                  <motion.div
                    key={i}
                    className="flex-1"
                    style={{
                      backgroundColor: color,
                      transform: isHovered ? 'scaleY(1.08)' : 'scaleY(1)',
                      transition: 'transform 0.2s ease-out',
                    }}
                  />
                ))}
              </div>

              {/* Palette name */}
              <div className="flex items-center justify-between">
                <span
                  className="text-base font-medium transition-colors duration-200"
                  style={{
                    color: isHovered
                      ? isDark
                        ? '#fff'
                        : '#1a1a2e'
                      : isDark
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(0,0,0,0.8)',
                  }}
                >
                  {isTemplate ? t(EDITOR_LABEL_KEYS.PALETTE_TEMPLATE) : palette.name}
                </span>
                <motion.svg
                  animate={{
                    x: isHovered && !isSelected ? 3 : 0,
                    opacity: isSelected ? 0 : 1,
                  }}
                  className="w-5 h-5"
                  style={{
                    color: isTemplate || isFirst ? '#6366F1' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </motion.svg>
              </div>

              {/* Selection indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute inset-0 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(99, 102, 241, 1)',
                        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)',
                      }}
                    >
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}

        
      </AnimatePresence>
    </motion.div>
  );
}
