/**
 * FeaturesSection Component
 *
 * Renders the design features selection section (rounded, border, gradient, shadow, etc.).
 */

import React from 'react';
import { designFeatures } from '~/types/design-scheme';

interface FeaturesSectionProps {
  features: string[];
  handleFeatureToggle: (key: string) => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ features, handleFeatureToggle }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-flowstarter-elements-textPrimary flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-flowstarter-elements-item-contentAccent"></div>
        Design Features
      </h3>

      <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
        {designFeatures.map((f) => {
          const isSelected = features.includes(f.key);

          return (
            <div key={f.key} className="feature-card-container p-2">
              <button
                type="button"
                onClick={() => handleFeatureToggle(f.key)}
                className={`group relative w-full p-6 text-sm font-medium transition-all duration-200 bg-flowstarter-elements-background-depth-3 text-flowstarter-elements-item-textSecondary ${
                  f.key === 'rounded'
                    ? isSelected
                      ? 'rounded-3xl'
                      : 'rounded-xl'
                    : f.key === 'border'
                      ? 'rounded-lg'
                      : 'rounded-xl'
                } ${
                  f.key === 'border'
                    ? isSelected
                      ? 'border-3 border-flowstarter-elements-borderColorActive bg-flowstarter-elements-item-backgroundAccent text-white'
                      : 'border-2 border-flowstarter-elements-borderColor dark:border-flowstarter-elements-borderColor-dark hover:border-flowstarter-elements-borderColorActive text-flowstarter-elements-textSecondary dark:text-flowstarter-elements-textSecondary-dark'
                    : f.key === 'gradient'
                      ? ''
                      : isSelected
                        ? 'bg-flowstarter-elements-item-backgroundAccent text-white shadow-lg'
                        : 'bg-flowstarter-elements-background-depth-3 dark:bg-flowstarter-elements-background-depth-3-dark hover:bg-flowstarter-elements-background-depth-2 dark:hover:bg-flowstarter-elements-background-depth-2-dark text-flowstarter-elements-textSecondary dark:text-flowstarter-elements-textSecondary-dark hover:text-flowstarter-elements-textPrimary dark:hover:text-flowstarter-elements-textPrimary-dark'
                } ${f.key === 'shadow' ? (isSelected ? 'shadow-xl' : 'shadow-lg') : 'shadow-md'}`}
                style={{
                  ...(f.key === 'gradient' && {
                    background: isSelected
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'var(--flowstarter-elements-background-depth-3)',
                    color: isSelected ? 'white' : 'var(--flowstarter-elements-textSecondary)',
                  }),
                }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-flowstarter-elements-background-depth-1 bg-opacity-20">
                    <FeatureIcon featureKey={f.key} isSelected={isSelected} />
                  </div>

                  <div className="text-center">
                    <div className="font-semibold">{f.label}</div>
                    {isSelected && <div className="mt-2 w-8 h-1 bg-current rounded-full mx-auto opacity-60" />}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface FeatureIconProps {
  featureKey: string;
  isSelected: boolean;
}

const FeatureIcon: React.FC<FeatureIconProps> = ({ featureKey, isSelected }) => {
  switch (featureKey) {
    case 'rounded':
      return (
        <div
          className={`w-6 h-6 bg-current transition-all duration-200 ${
            isSelected ? 'rounded-full' : 'rounded'
          } opacity-80`}
        />
      );
    case 'border':
      return (
        <div
          className={`w-6 h-6 rounded-lg transition-all duration-200 ${
            isSelected ? 'border-3 border-current opacity-90' : 'border-2 border-current opacity-70'
          }`}
        />
      );
    case 'gradient':
      return (
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 via-pink-400 to-indigo-400 opacity-90" />
      );
    case 'shadow':
      return (
        <div className="relative">
          <div
            className={`w-6 h-6 bg-current rounded-lg transition-all duration-200 ${
              isSelected ? 'opacity-90' : 'opacity-70'
            }`}
          />
          <div
            className={`absolute top-1 left-1 w-6 h-6 bg-current rounded-lg transition-all duration-200 ${
              isSelected ? 'opacity-40' : 'opacity-30'
            }`}
          />
        </div>
      );
    case 'frosted-glass':
      return (
        <div className="relative">
          <div
            className={`w-6 h-6 rounded-lg transition-all duration-200 backdrop-blur-sm bg-white/20 border border-white/30 ${
              isSelected ? 'opacity-90' : 'opacity-70'
            }`}
          />
          <div
            className={`absolute inset-0 w-6 h-6 rounded-lg transition-all duration-200 backdrop-blur-md bg-gradient-to-br from-white/10 to-transparent ${
              isSelected ? 'opacity-60' : 'opacity-40'
            }`}
          />
        </div>
      );
    default:
      return null;
  }
};
