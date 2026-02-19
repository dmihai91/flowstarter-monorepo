/**
 * TypographySection Component
 *
 * Renders the typography/font selection section.
 */

import React from 'react';
import { designFonts } from '~/types/design-scheme';

interface TypographySectionProps {
  font: string[];
  handleFontToggle: (key: string) => void;
}

export const TypographySection: React.FC<TypographySectionProps> = ({ font, handleFontToggle }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-flowstarter-elements-textPrimary flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-flowstarter-elements-item-contentAccent"></div>
        Typography
      </h3>

      <div className="grid grid-cols-3 gap-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
        {designFonts.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => handleFontToggle(f.key)}
            className={`group p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-flowstarter-elements-borderColorActive ${
              font.includes(f.key)
                ? 'bg-flowstarter-elements-item-backgroundAccent border-flowstarter-elements-borderColorActive text-white shadow-lg'
                : 'bg-flowstarter-elements-background-depth-3 dark:bg-flowstarter-elements-background-depth-3-dark border-flowstarter-elements-borderColor dark:border-flowstarter-elements-borderColor-dark hover:border-flowstarter-elements-borderColorActive hover:bg-flowstarter-elements-background-depth-2 dark:hover:bg-flowstarter-elements-background-depth-2-dark'
            }`}
          >
            <div className="text-center space-y-2">
              <div
                className={`text-2xl font-medium transition-colors ${
                  font.includes(f.key) ? 'text-white' : 'text-flowstarter-elements-textPrimary'
                }`}
                style={{ fontFamily: f.key }}
              >
                {f.preview}
              </div>
              <div
                className={`text-sm font-medium transition-colors ${
                  font.includes(f.key) ? 'text-white' : 'text-flowstarter-elements-textSecondary'
                }`}
              >
                {f.label}
              </div>
              {font.includes(f.key) && (
                <div className="w-6 h-6 mx-auto bg-flowstarter-elements-item-contentAccent rounded-full flex items-center justify-center">
                  <span className="i-ph:check text-white text-sm" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
