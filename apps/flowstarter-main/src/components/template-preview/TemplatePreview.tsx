'use client';

import * as React from 'react';
import { useTranslations } from '@/lib/i18n';
import type { AIContent, ProjectData } from './types';

// Generated preview components live here
import * as Previews from './previews';

// Context for template preview data
const TemplatePreviewContext = React.createContext<{
  projectData: ProjectData | null;
  theme: 'light' | 'dark';
  aiContent: AIContent | null;
} | null>(null);

// Hooks for preview components
export function useProjectData(): ProjectData | null {
  const context = React.useContext(TemplatePreviewContext);
  return context?.projectData || null;
}

export function useTemplateTheme(): 'light' | 'dark' {
  const context = React.useContext(TemplatePreviewContext);
  return context?.theme || 'light';
}

export function useAIContent(): AIContent | null {
  const context = React.useContext(TemplatePreviewContext);
  return context?.aiContent || null;
}

type TemplatePreviewProps = {
  templateId: string;
  theme?: 'light' | 'dark';
  projectData?: ProjectData | null;
  enhanceWithAI?: boolean;
};

function toPreviewComponentName(templateId: string): string {
  return (
    templateId
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('') + 'Preview'
  );
}

export default function TemplatePreview({
  templateId,
  theme = 'light',
  projectData = null,
}: TemplatePreviewProps) {
  useTranslations();

  const componentName = React.useMemo(
    () => toPreviewComponentName(templateId),
    [templateId]
  );

  const Comp = (Previews as Record<string, React.ComponentType | undefined>)[
    componentName
  ];

  const isDark = theme === 'dark';

  const contextValue = React.useMemo(
    () => ({
      projectData,
      theme,
      aiContent: null,
    }),
    [projectData, theme]
  );

  return (
    <TemplatePreviewContext.Provider value={contextValue}>
      <div
        className={`w-full h-full overflow-auto ${
          isDark ? 'bg-[#0b0b0e] text-gray-200' : 'bg-white text-slate-900'
        }`}
      >
        <div className="w-full">
          {Comp ? (
            <div className="*:max-w-full">
              <Comp />
            </div>
          ) : (
            <div className="p-8 text-sm text-center text-muted-foreground">
              Preview component not available for this template.
            </div>
          )}
        </div>
      </div>
    </TemplatePreviewContext.Provider>
  );
}
