'use client';

import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { ColorPalette } from './ColorPaletteSelector';

interface PaletteDropdownProps {
  palettes: ColorPalette[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  className?: string;
  /** Label shown above dropdown in popover */
  label?: string;
}

/**
 * Palette Dropdown Selector
 *
 * A dropdown/popover component for selecting color palettes.
 * Shows color swatches inline with the palette name.
 * Matches Figma design with rounded color squares and border highlights.
 */
export function PaletteDropdown({
  palettes,
  selectedIndex,
  onSelect,
  className,
  label = 'Choose Theme',
}: PaletteDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedPalette = palettes[selectedIndex] || palettes[0];

  // Get first 3 colors for display
  const getDisplayColors = (palette: ColorPalette) => {
    const colors = Object.values(palette.colors);
    return colors.slice(0, 3);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-3 px-4 py-2.5 rounded-full',
            'bg-[#1a1a2e] hover:bg-[#252540]',
            'border border-[#3d3d5c]',
            'text-white font-medium text-sm',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            className
          )}
        >
          {/* Color Swatches - 3 rounded squares */}
          <div className="flex gap-1">
            {getDisplayColors(selectedPalette).map((color, idx) => (
              <div
                key={`trigger-${idx}`}
                className="w-6 h-6 rounded-lg shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Palette Name */}
          <span className="text-white">{selectedPalette.name}</span>

          {/* Chevron */}
          {open ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          'w-80 p-0',
          'bg-[#1a1a2e] border-[#3d3d5c]',
          'rounded-2xl shadow-2xl'
        )}
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#3d3d5c]">
          <span className="text-base font-semibold text-white">{label}</span>
        </div>

        {/* Palette List */}
        <div className="py-2 max-h-[400px] overflow-y-auto">
          {palettes.map((palette, index) => {
            const isSelected = index === selectedIndex;
            const displayColors = getDisplayColors(palette);

            return (
              <button
                key={`${palette.name}-${index}`}
                type="button"
                onClick={() => {
                  onSelect(index);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-4 px-5 py-3.5 mx-2 my-1',
                  'transition-all duration-150 rounded-xl',
                  'w-[calc(100%-16px)]',
                  isSelected
                    ? 'bg-[#252540] border-2 border-primary'
                    : 'hover:bg-[#252540] border-2 border-transparent'
                )}
              >
                {/* Color Swatches - 3 rounded squares */}
                <div className="flex gap-1.5">
                  {displayColors.map((color, idx) => (
                    <div
                      key={`option-${index}-${idx}`}
                      className="w-8 h-8 rounded-lg shadow-md"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Palette Name */}
                <span
                  className={cn(
                    'flex-1 text-left text-sm font-medium',
                    isSelected ? 'text-white' : 'text-gray-300'
                  )}
                >
                  {palette.name}
                </span>

                {/* Checkmark */}
                {isSelected && <Check className="w-5 h-5 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default PaletteDropdown;
