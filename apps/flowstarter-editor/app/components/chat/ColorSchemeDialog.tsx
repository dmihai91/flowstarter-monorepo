/**
 * ColorSchemeDialog Component (Refactored)
 *
 * A dialog for customizing the design scheme including colors, typography, features, and styling.
 * Uses extracted hooks and components for better maintainability.
 */

import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/Button';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';

import type { DesignScheme } from '~/types/design-scheme';
import {
  useDesignSchemeState,
  DesignSchemePreview,
  ColorSection,
  TypographySection,
  FeaturesSection,
  StylingSection,
} from './design-scheme';

export interface ColorSchemeDialogProps {
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
}

const SECTION_TABS = [
  { key: 'colors', label: 'Colors' },
  { key: 'typography', label: 'Typography' },
  { key: 'features', label: 'Features' },
  { key: 'styling', label: 'Styling' },
] as const;

export const ColorSchemeDialog: React.FC<ColorSchemeDialogProps> = ({ setDesignScheme, designScheme }) => {
  const state = useDesignSchemeState({ designScheme, setDesignScheme });

  return (
    <>
      <IconButton title="Design System" className="transition-all" onClick={() => state.setIsDialogOpen(true)}>
        <div className="i-ph:palette text-xl"></div>
      </IconButton>

      <RadixDialog.Root open={state.isDialogOpen} onOpenChange={state.setIsDialogOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay asChild>
            <motion.div
              className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          </RadixDialog.Overlay>

          <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            <RadixDialog.Content asChild>
              <motion.div
                className={classNames(
                  'h-[90dvh] max-h-[900px] w-[95dvw] max-w-[1400px]',
                  'bg-flowstarter-elements-background-depth-1 border border-flowstarter-elements-borderColor rounded-xl shadow-2xl',
                  'flex flex-col overflow-hidden focus:outline-none px-0 py-0',
                )}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Close button */}
                <RadixDialog.Close asChild>
                  <button
                    className={classNames(
                      'absolute top-2 right-2 z-[10000] flex items-center justify-center',
                      'w-9 h-9 rounded-lg transition-all duration-200',
                      'bg-transparent text-flowstarter-elements-textTertiary',
                      'hover:bg-flowstarter-elements-background-depth-2 hover:text-flowstarter-elements-textPrimary',
                      'focus:outline-none focus:ring-2 focus:ring-flowstarter-elements-borderColor',
                    )}
                    aria-label="Close design settings"
                  >
                    <div className="i-lucide:x w-4 h-4" />
                  </button>
                </RadixDialog.Close>

                {/* Header */}
                <DialogHeader />

                {/* Content Area - Two Column Layout */}
                <div className="flex min-h-0 flex-1 gap-4 overflow-hidden px-6 pt-6 bg-flowstarter-elements-background-depth-1">
                  {/* Left Panel - Settings */}
                  <SettingsPanel state={state} />

                  {/* Right Panel - Preview */}
                  <PreviewPanel state={state} />
                </div>

                {/* Action Buttons */}
                <DialogFooter onCancel={() => state.setIsDialogOpen(false)} onSave={state.handleSave} />
              </motion.div>
            </RadixDialog.Content>
          </div>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      <DialogStyles />
    </>
  );
};

// ─── Sub-Components ─────────────────────────────────────────────────────────

const DialogHeader: React.FC = () => (
  <div className="border-b border-flowstarter-elements-borderColor p-6 bg-flowstarter-elements-background-depth-1">
    <h2 className="text-lg font-semibold text-flowstarter-elements-textPrimary">Design Palette (experimental)</h2>
    <p className="text-sm text-flowstarter-elements-textSecondary mt-1">
      Customize your color palette, typography, and design features. These preferences will guide the AI in creating
      designs that match your style.
    </p>
  </div>
);

interface SettingsPanelProps {
  state: ReturnType<typeof useDesignSchemeState>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ state }) => (
  <div className="w-80 flex flex-col gap-4">
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Tab Navigation */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-flowstarter-elements-background-depth-1 dark:bg-flowstarter-elements-background-depth-1-dark border border-flowstarter-elements-borderColor dark:border-flowstarter-elements-borderColor-dark rounded-lg mb-4">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => state.setActiveSection(tab.key)}
            className={classNames(
              'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flowstarter-elements-ring',
              state.activeSection === tab.key
                ? 'bg-flowstarter-elements-item-backgroundAccent border-flowstarter-elements-borderColorActive text-white shadow-sm'
                : 'bg-flowstarter-elements-background-depth-3 dark:bg-flowstarter-elements-background-depth-3-dark text-flowstarter-elements-textSecondary dark:text-flowstarter-elements-textSecondary-dark hover:text-flowstarter-elements-textPrimary dark:hover:text-flowstarter-elements-textPrimary-dark hover:bg-flowstarter-elements-background-depth-2 dark:hover:bg-flowstarter-elements-background-depth-2-dark',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {state.activeSection === 'colors' && (
          <ColorSection
            palette={state.palette}
            mode={state.mode}
            expandedColorGroups={state.expandedColorGroups}
            handleColorChange={state.handleColorChange}
            handleReset={state.handleReset}
            toggleColorGroup={state.toggleColorGroup}
          />
        )}
        {state.activeSection === 'typography' && (
          <TypographySection font={state.font} handleFontToggle={state.handleFontToggle} />
        )}
        {state.activeSection === 'features' && (
          <FeaturesSection features={state.features} handleFeatureToggle={state.handleFeatureToggle} />
        )}
        {state.activeSection === 'styling' && (
          <StylingSection
            borderRadius={state.borderRadius}
            shadow={state.shadow}
            spacing={state.spacing}
            setBorderRadius={state.setBorderRadius}
            setShadow={state.setShadow}
            setSpacing={state.setSpacing}
            getBoxShadow={state.getBoxShadow}
          />
        )}
      </div>
    </div>
  </div>
);

interface PreviewPanelProps {
  state: ReturnType<typeof useDesignSchemeState>;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ state }) => (
  <div className="flex flex-1 flex-col gap-4">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-flowstarter-elements-textPrimary">Live Preview</h3>
      <ModeToggle mode={state.mode} setMode={state.setMode} />
    </div>

    {/* Preview Container */}
    <div className="flex-1 rounded-xl border border-flowstarter-elements-borderColor overflow-hidden bg-flowstarter-elements-background-depth-3">
      <DesignSchemePreview
        palette={state.palette}
        mode={state.mode}
        font={state.font}
        features={state.features}
        getBorderRadius={state.getBorderRadius}
        getBoxShadow={state.getBoxShadow}
        getSpacingPixels={state.getSpacingPixels}
        spacing={state.spacing}
      />
    </div>

    <p className="text-xs text-flowstarter-elements-textSecondary text-center">
      Preview updates in real-time as you change settings
    </p>
  </div>
);

interface ModeToggleProps {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, setMode }) => (
  <div className="flex items-center gap-1 p-1 bg-flowstarter-elements-background-depth-1 dark:bg-flowstarter-elements-background-depth-1-dark border border-flowstarter-elements-borderColor dark:border-flowstarter-elements-borderColor-dark rounded-lg">
    <button
      onClick={() => setMode('light')}
      className={classNames(
        'p-1.5 rounded-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flowstarter-elements-ring',
        mode === 'light'
          ? 'bg-flowstarter-elements-item-backgroundAccent border-flowstarter-elements-borderColorActive text-white shadow-sm'
          : 'bg-flowstarter-elements-background-depth-3 dark:bg-flowstarter-elements-background-depth-3-dark text-flowstarter-elements-textSecondary dark:text-flowstarter-elements-textSecondary-dark hover:text-flowstarter-elements-textPrimary dark:hover:text-flowstarter-elements-textPrimary-dark hover:bg-flowstarter-elements-background-depth-2 dark:hover:bg-flowstarter-elements-background-depth-2-dark',
      )}
      title="Light mode"
    >
      <span className="i-ph:sun text-base" />
    </button>
    <button
      onClick={() => setMode('dark')}
      className={classNames(
        'p-1.5 rounded-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flowstarter-elements-ring',
        mode === 'dark'
          ? 'bg-flowstarter-elements-item-backgroundAccent border-flowstarter-elements-borderColorActive text-white shadow-sm'
          : 'bg-flowstarter-elements-background-depth-3 dark:bg-flowstarter-elements-background-depth-3-dark text-flowstarter-elements-textSecondary dark:text-flowstarter-elements-textSecondary-dark hover:text-flowstarter-elements-textPrimary dark:hover:text-flowstarter-elements-textPrimary-dark hover:bg-flowstarter-elements-background-depth-2 dark:hover:bg-flowstarter-elements-background-depth-2-dark',
      )}
      title="Dark mode"
    >
      <span className="i-ph:moon text-base" />
    </button>
  </div>
);

interface DialogFooterProps {
  onCancel: () => void;
  onSave: () => void;
}

const DialogFooter: React.FC<DialogFooterProps> = ({ onCancel, onSave }) => (
  <div className="flex justify-end items-center gap-3 px-6 py-4 bg-flowstarter-elements-background-depth-1 border-t border-flowstarter-elements-borderColor">
    <Button variant="secondary" onClick={onCancel}>
      Cancel
    </Button>
    <Button
      variant="ghost"
      onClick={onSave}
      className="bg-flowstarter-elements-button-primary-background hover:bg-flowstarter-elements-button-primary-backgroundHover text-flowstarter-elements-button-primary-text"
    >
      Save Changes
    </Button>
  </div>
);

const DialogStyles: React.FC = () => (
  <style>{`
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: var(--flowstarter-elements-textTertiary) transparent;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: var(--flowstarter-elements-textTertiary);
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: var(--flowstarter-elements-textSecondary);
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .feature-card-container {
      min-height: 140px;
      display: flex;
      align-items: stretch;
    }
    .feature-card-container button {
      flex: 1;
    }
  `}</style>
);
