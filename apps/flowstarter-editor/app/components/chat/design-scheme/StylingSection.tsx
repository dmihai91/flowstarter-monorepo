/**
 * StylingSection Component
 *
 * Renders the styling options section (border radius, shadow, spacing).
 */

import React from 'react';
import { borderRadiusOptions, shadowOptions, spacingOptions } from '~/types/design-scheme';

interface StylingSectionProps {
  borderRadius: string;
  shadow: string;
  spacing: string;
  setBorderRadius: (radius: string) => void;
  setShadow: (shadow: string) => void;
  setSpacing: (spacing: string) => void;
  getBoxShadow: () => string;
}

export const StylingSection: React.FC<StylingSectionProps> = ({
  borderRadius,
  shadow,
  spacing,
  setBorderRadius,
  setShadow,
  setSpacing,
  getBoxShadow,
}) => {
  const getBorderRadiusPixels = (key: string): string => {
    switch (key) {
      case 'none':
        return '0px';
      case 'sm':
        return '0.25rem';
      case 'md':
        return '0.375rem';
      case 'lg':
        return '0.5rem';
      case 'xl':
        return '0.75rem';
      case 'full':
        return '9999px';
      default:
        return '0.375rem';
    }
  };

  const getSpacingPixels = (key: string): string => {
    switch (key) {
      case 'tight':
        return '0.5rem';
      case 'normal':
        return '1rem';
      case 'relaxed':
        return '1.25rem';
      case 'loose':
        return '1.5rem';
      default:
        return '1rem';
    }
  };

  return (
    <div className="space-y-6 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
      <div className="space-y-6 pr-2">
        <h3 className="text-lg font-semibold text-flowstarter-elements-textPrimary flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-flowstarter-elements-item-contentAccent"></div>
          Design Styling
        </h3>

        {/* Border Radius */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-flowstarter-elements-textPrimary">Border Radius</label>
          <div className="grid grid-cols-2 gap-2">
            {borderRadiusOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setBorderRadius(option.key)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-flowstarter-elements-borderColorActive ${
                  borderRadius === option.key
                    ? 'bg-flowstarter-elements-item-backgroundAccent border-flowstarter-elements-borderColorActive text-white'
                    : 'bg-flowstarter-elements-background-depth-3 dark:bg-flowstarter-elements-background-depth-3-dark border-flowstarter-elements-borderColor dark:border-flowstarter-elements-borderColor-dark hover:border-flowstarter-elements-borderColorActive text-flowstarter-elements-textSecondary dark:text-flowstarter-elements-textSecondary-dark hover:text-flowstarter-elements-textPrimary dark:hover:text-flowstarter-elements-textPrimary-dark'
                }`}
              >
                <div className="text-center space-y-1">
                  <div
                    className="w-6 h-6 mx-auto bg-current opacity-80"
                    style={{ borderRadius: getBorderRadiusPixels(option.key) }}
                  />
                  <div className="text-xs font-medium">{option.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Shadow */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-flowstarter-elements-textPrimary">Shadow</label>
          <div className="grid grid-cols-2 gap-2">
            {shadowOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setShadow(option.key)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-flowstarter-elements-borderColorActive ${
                  shadow === option.key
                    ? 'bg-flowstarter-elements-item-backgroundAccent border-flowstarter-elements-borderColorActive text-white'
                    : 'bg-flowstarter-elements-background-depth-3 dark:bg-flowstarter-elements-background-depth-3-dark border-flowstarter-elements-borderColor dark:border-flowstarter-elements-borderColor-dark hover:border-flowstarter-elements-borderColorActive text-flowstarter-elements-textSecondary dark:text-flowstarter-elements-textSecondary-dark hover:text-flowstarter-elements-textPrimary dark:hover:text-flowstarter-elements-textPrimary-dark'
                }`}
                style={{
                  boxShadow: shadow === option.key ? getBoxShadow() : 'none',
                }}
              >
                <div className="text-center space-y-1">
                  <div className="w-6 h-6 mx-auto bg-current rounded opacity-80" />
                  <div className="text-xs font-medium">{option.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Spacing */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-flowstarter-elements-textPrimary">Spacing</label>
          <div className="grid grid-cols-2 gap-2">
            {spacingOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSpacing(option.key)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-flowstarter-elements-borderColorActive ${
                  spacing === option.key
                    ? 'bg-flowstarter-elements-item-backgroundAccent border-flowstarter-elements-borderColorActive text-white'
                    : 'bg-flowstarter-elements-background-depth-3 dark:bg-flowstarter-elements-background-depth-3-dark border-flowstarter-elements-borderColor dark:border-flowstarter-elements-borderColor-dark hover:border-flowstarter-elements-borderColorActive text-flowstarter-elements-textSecondary dark:text-flowstarter-elements-textSecondary-dark hover:text-flowstarter-elements-textPrimary dark:hover:text-flowstarter-elements-textPrimary-dark'
                }`}
              >
                <div className="text-center space-y-1">
                  <div
                    className="flex justify-center items-center opacity-80"
                    style={{ gap: getSpacingPixels(option.key) }}
                  >
                    <div className="w-2 h-6 bg-current rounded" />
                    <div className="w-2 h-6 bg-current rounded" />
                    <div className="w-2 h-6 bg-current rounded" />
                  </div>
                  <div className="text-xs font-medium">{option.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
