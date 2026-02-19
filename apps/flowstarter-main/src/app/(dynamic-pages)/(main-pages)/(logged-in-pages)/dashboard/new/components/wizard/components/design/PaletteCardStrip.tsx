'use client';

import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';
import type { ColorPalette } from './ColorPaletteSelector';

interface PaletteCardStripProps {
  palettes: ColorPalette[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  className?: string;
  /** Maximum number of palettes to show (default: 6) */
  maxVisible?: number;
}

/**
 * Palette Card Strip
 *
 * A horizontal strip of palette cards matching the Figma design.
 * Each card shows:
 * - Horizontal color swatches
 * - Badge (if provided, e.g., "Original")
 * - Label below
 * - Checkmark when selected, chevron when not
 */
export function PaletteCardStrip({
  palettes,
  selectedIndex,
  onSelect,
  className,
  maxVisible = 6,
}: PaletteCardStripProps) {
  const visiblePalettes = palettes.slice(0, maxVisible);

  return (
    <div
      className={cn(
        'flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent',
        className
      )}
    >
      {visiblePalettes.map((palette, index) => {
        const isSelected = selectedIndex === index;
        const colorValues = Object.values(palette.colors).slice(0, 4);

        return (
          <button
            key={`${palette.name}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              'group relative flex-shrink-0 rounded-2xl p-3 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'min-w-[160px]',
              isSelected
                ? 'bg-[#1a1a2e] ring-2 ring-primary shadow-lg'
                : 'bg-[#1a1a2e]/60 hover:bg-[#1a1a2e] border border-[#3d3d5c]/50 hover:border-[#3d3d5c]'
            )}
          >
            {/* Badge */}
            {palette.badge && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold shadow-md',
                    palette.badge === 'Original'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-violet-500 text-white'
                  )}
                >
                  {palette.badge}
                </span>
              </div>
            )}

            {/* Color Swatches - Horizontal strip */}
            <div className="flex rounded-lg overflow-hidden h-14">
              {colorValues.map((color, idx) => (
                <div
                  key={`${palette.name}-color-${idx}`}
                  className="flex-1 transition-transform duration-200 group-hover:scale-y-105"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Label and Action */}
            <div className="mt-3 flex items-center justify-between">
              <span
                className={cn(
                  'text-sm font-semibold transition-colors',
                  isSelected ? 'text-white' : 'text-gray-300'
                )}
              >
                {palette.name}
              </span>

              {/* Selection Indicator */}
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-[#3d3d5c] text-gray-400 group-hover:bg-[#4d4d6c]'
                )}
              >
                {isSelected ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default PaletteCardStrip;
