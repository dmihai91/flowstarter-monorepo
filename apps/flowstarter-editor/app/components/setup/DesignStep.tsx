/**
 * Design Step
 *
 * Color palette and font selection.
 */

import { Check } from 'lucide-react';
import type { SetupData } from './SetupWizard';

const PALETTES = [
  { id: 'emerald', name: 'Emerald', colors: ['#059669', '#10B981', '#34D399', '#A7F3D0'] },
  { id: 'blue', name: 'Ocean', colors: ['#2563EB', '#3B82F6', '#60A5FA', '#BFDBFE'] },
  { id: 'amber', name: 'Amber', colors: ['#D97706', '#F59E0B', '#FBBF24', '#FDE68A'] },
  { id: 'rose', name: 'Rose', colors: ['#E11D48', '#F43F5E', '#FB7185', '#FECDD3'] },
  { id: 'violet', name: 'Violet', colors: ['#7C3AED', '#8B5CF6', '#A78BFA', '#DDD6FE'] },
  { id: 'neutral', name: 'Monochrome', colors: ['#171717', '#404040', '#737373', '#D4D4D4'] },
];

const FONT_PAIRS = [
  { id: 'modern', heading: 'DM Sans', body: 'Inter', label: 'Modern' },
  { id: 'editorial', heading: 'Playfair Display', body: 'Source Serif 4', label: 'Editorial' },
  { id: 'minimal', heading: 'Outfit', body: 'Work Sans', label: 'Minimal' },
  { id: 'bold', heading: 'Sora', body: 'Nunito', label: 'Bold' },
  { id: 'elegant', heading: 'Cormorant Garamond', body: 'Lato', label: 'Elegant' },
];

interface DesignStepProps {
  data: SetupData;
  onUpdate: (updates: Partial<SetupData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function DesignStep({ data, onUpdate, onNext, onPrev }: DesignStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
          Customize your design
        </h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm">
          Choose colors and fonts that match your brand.
        </p>
      </div>

      {/* Color palette */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
          Color palette
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PALETTES.map((palette) => {
            const isSelected = data.palette === palette.id;
            return (
              <button
                key={palette.id}
                onClick={() => onUpdate({ palette: palette.id })}
                className={`relative p-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-emerald-500'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  {palette.colors.map((color) => (
                    <div
                      key={color}
                      className="flex-1 h-8 rounded-md"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600 dark:text-zinc-400">
                  {palette.name}
                </span>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check size={12} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Font pair */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
          Fonts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FONT_PAIRS.map((pair) => {
            const isSelected =
              data.headingFont === pair.heading && data.bodyFont === pair.body;
            return (
              <button
                key={pair.id}
                onClick={() =>
                  onUpdate({ headingFont: pair.heading, bodyFont: pair.body })
                }
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-emerald-500'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                }`}
              >
                <p className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1" style={{ fontFamily: pair.heading }}>
                  {pair.heading}
                </p>
                <p className="text-sm text-gray-500 dark:text-zinc-400" style={{ fontFamily: pair.body }}>
                  {pair.body} &middot; {pair.label}
                </p>
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check size={12} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
