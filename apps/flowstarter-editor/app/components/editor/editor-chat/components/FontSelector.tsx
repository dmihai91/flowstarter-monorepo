import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FONT_PAIRINGS } from '~/components/editor/editor-chat/constants';
import type { SystemFont } from '~/components/editor/editor-chat/types';
import type { TemplateFont } from '~/components/editor/template-preview/types';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface FontSelectorProps {
  isDark: boolean;
  fontsLoaded: boolean;
  onSelect: (font: SystemFont) => void;

  /** Template-specific curated fonts (if provided, these are shown instead of global fonts) */
  templateFonts?: TemplateFont[];
}

/**
 * Convert TemplateFont to SystemFont format
 */
function toSystemFont(font: TemplateFont): SystemFont {
  return {
    id: font.id,
    name: font.name,
    heading: font.heading,
    body: font.body,
  };
}

export function FontSelector({ isDark, fontsLoaded, onSelect, templateFonts }: FontSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Use template-specific fonts if provided, otherwise use global fonts
  const fonts: SystemFont[] = Array.isArray(templateFonts) && templateFonts.length > 0 ? templateFonts.map(toSystemFont) : FONT_PAIRINGS;

  const handleSelect = (font: SystemFont) => {
    setSelectedId(font.id);
    setTimeout(() => {
      onSelect(font);
    }, 200);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-10 grid grid-cols-3 gap-3 mt-4">
      <AnimatePresence>
        {fonts.map((font, index) => {
          const isSelected = selectedId === font.id;
          const isHovered = hoveredId === font.id;
          const isFirst = index === 0 && templateFonts && templateFonts.length > 0;

          return (
            <motion.button
              key={`${font.id}-${fontsLoaded}`}
              data-testid={`font-option-${font.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              onClick={() => handleSelect(font)}
              onMouseEnter={() => setHoveredId(font.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group text-left p-4 rounded-xl relative cursor-pointer"
              style={{
                background: isDark ? '#14141e' : '#ffffff',
                border: isSelected
                  ? '2px solid rgba(99, 102, 241, 0.8)'
                  : isFirst
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
                  : isFirst
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
              {/* Best Match badge for first curated font */}
              {isFirst && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(77, 93, 217, 0.8), rgba(6, 182, 212, 0.6))',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  {t(EDITOR_LABEL_KEYS.FONT_BEST_MATCH)}
                </motion.div>
              )}

              {/* Font Preview */}
              <div className="flex flex-col items-center gap-1 mb-3">
                <motion.span
                  animate={{
                    scale: isHovered ? 1.05 : 1,
                    color: isHovered
                      ? isDark
                        ? '#fff'
                        : '#1a1a2e'
                      : isDark
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(0,0,0,0.85)',
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl leading-none"
                  style={{
                    fontFamily: `'${font.heading}', sans-serif`,
                    fontWeight: 600,
                  }}
                >
                  Aa
                </motion.span>
                <span
                  className="text-xs leading-tight text-center"
                  style={{
                    fontFamily: `'${font.body}', sans-serif`,
                    fontWeight: 400,
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  }}
                >
                  Quick fox
                </span>
              </div>

              {/* Font Name */}
              <div className="mb-1">
                <span
                  className="text-sm font-semibold transition-colors duration-200"
                  style={{
                    fontFamily: `'${font.heading}', sans-serif`,
                    color: isHovered
                      ? isDark
                        ? '#818cf8'
                        : '#4338ca'
                      : isDark
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(0,0,0,0.85)',
                  }}
                >
                  {font.name}
                </span>
              </div>

              {/* Font Family Names */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] truncate"
                  style={{
                    fontFamily: `'${font.body}', sans-serif`,
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)',
                    maxWidth: '80%',
                  }}
                >
                  {font.heading === font.body ? font.heading : `${font.heading} + ${font.body}`}
                </span>
                <motion.svg
                  animate={{
                    x: isHovered && !isSelected ? 2 : 0,
                    opacity: isSelected ? 0 : 1,
                  }}
                  className="w-4 h-4 flex-shrink-0"
                  style={{
                    color: isFirst ? '#6366F1' : isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
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
                    className="absolute inset-0 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(99, 102, 241, 1)',
                        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)',
                      }}
                    >
                      <svg
                        className="w-5 h-5 text-white"
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
