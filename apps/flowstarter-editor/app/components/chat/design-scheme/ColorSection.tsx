/**
 * ColorSection Component
 *
 * Renders the color palette section with expandable color groups.
 */

import React from 'react';
import { Button } from '~/components/ui/Button';
import { paletteRoles } from '~/types/design-scheme';
import type { PaletteState } from './useDesignSchemeState';

interface ColorSectionProps {
  palette: PaletteState;
  mode: 'light' | 'dark';
  expandedColorGroups: string[];
  handleColorChange: (role: string, value: string) => void;
  handleReset: () => void;
  toggleColorGroup: (groupKey: string) => void;
}

const colorGroups = [
  {
    key: 'primary',
    label: 'Primary',
    colors: paletteRoles.filter((role) => role.key.toLowerCase().includes('primary')),
  },
  {
    key: 'secondary',
    label: 'Secondary',
    colors: paletteRoles.filter((role) => role.key.toLowerCase().includes('secondary')),
  },
  {
    key: 'accent',
    label: 'Accent',
    colors: paletteRoles.filter((role) => role.key.toLowerCase().includes('accent')),
  },
  {
    key: 'background',
    label: 'Base',
    colors: paletteRoles.filter(
      (role) =>
        role.key === 'background' || role.key === 'foreground' || role.key === 'text' || role.key === 'textSecondary',
    ),
  },
  {
    key: 'card',
    label: 'Card',
    colors: paletteRoles.filter((role) => role.key.toLowerCase().includes('card')),
  },
  {
    key: 'other',
    label: 'Other',
    colors: paletteRoles.filter(
      (role) =>
        !role.key.toLowerCase().includes('primary') &&
        !role.key.toLowerCase().includes('secondary') &&
        !role.key.toLowerCase().includes('accent') &&
        !role.key.toLowerCase().includes('card') &&
        role.key !== 'background' &&
        role.key !== 'foreground' &&
        role.key !== 'text' &&
        role.key !== 'textSecondary',
    ),
  },
].filter((group) => group.colors.length > 0);

export const ColorSection: React.FC<ColorSectionProps> = ({
  palette,
  mode,
  expandedColorGroups,
  handleColorChange,
  handleReset,
  toggleColorGroup,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-flowstarter-elements-textPrimary flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-flowstarter-elements-item-contentAccent"></div>
          Color Palette
        </h3>
        <Button onClick={handleReset} variant="ghost" size="sm" className="flex items-center gap-2">
          <span className="i-ph:arrow-clockwise text-sm" />
          Reset
        </Button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
        {colorGroups.map((group) => {
          const isExpanded = expandedColorGroups.includes(group.key);

          return (
            <div
              key={group.key}
              className="border border-flowstarter-elements-borderColor dark:border-flowstarter-elements-borderColor-dark rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleColorGroup(group.key)}
                className="flex w-full items-center justify-between p-3 text-left transition-colors bg-transparent hover:bg-flowstarter-elements-background-depth-2 dark:hover:bg-flowstarter-elements-background-depth-2-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flowstarter-elements-ring"
              >
                <span className="text-sm font-medium text-flowstarter-elements-textPrimary dark:text-flowstarter-elements-textPrimary-dark">
                  {group.label}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`w-4 h-4 text-flowstarter-elements-textSecondary dark:text-flowstarter-elements-textSecondary-dark transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <path d="M6.23 7.47a.75.75 0 0 1 1.06-.02L12 12.18l4.71-4.73a.75.75 0 1 1 1.06 1.06l-5.25 5.25a.75.75 0 0 1-1.06 0L6.21 8.53a.75.75 0 0 1 .02-1.06" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-flowstarter-elements-borderColor dark:border-flowstarter-elements-borderColor-dark">
                  {group.colors.map((role) => (
                    <div
                      key={role.key}
                      className="flex items-center justify-between p-3 bg-transparent hover:bg-flowstarter-elements-background-depth-2 dark:hover:bg-flowstarter-elements-background-depth-2-dark transition-colors border-b border-flowstarter-elements-borderColor dark:border-flowstarter-elements-borderColor-dark last:border-b-0"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-shrink-0">
                          <div
                            className="h-8 w-8 rounded border border-flowstarter-elements-borderColor dark:border-flowstarter-elements-borderColor-dark cursor-pointer hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flowstarter-elements-ring"
                            style={{ backgroundColor: palette[mode][role.key] }}
                            onClick={() => document.getElementById(`color-input-${role.key}`)?.click()}
                            role="button"
                            tabIndex={0}
                            aria-label={`Change ${role.label} color`}
                          />
                          <input
                            id={`color-input-${role.key}`}
                            type="color"
                            value={palette[mode][role.key]}
                            onChange={(e) => handleColorChange(role.key, e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            tabIndex={-1}
                          />
                        </div>
                        <span className="text-sm text-flowstarter-elements-textPrimary dark:text-flowstarter-elements-textPrimary-dark font-medium">
                          {role.label}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-flowstarter-elements-textSecondary dark:text-flowstarter-elements-textSecondary-dark">
                        {palette[mode][role.key]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
