/**
 * Types for Template Clone Operations
 */

import type { ColorPalette } from '~/lib/config/palettes';
import type { FontPairing } from '~/lib/config/fonts';
import type { Template } from '~/components/onboarding';

// File structure from MCP scaffold_template response
export interface ScaffoldFile {
  path: string;
  content: string;
  type: 'file';
}

export interface ScaffoldData {
  template: {
    metadata: {
      name: string;
      slug: string;
      displayName: string;
      description: string;
      category: string;
      features: string[];
      techStack: {
        framework: string;
        styling: string;
        typescript: boolean;
      };
    };
    packageJson: {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
  };
  files: ScaffoldFile[];
}

export interface CachedScaffold {
  slug: string;
  data: ScaffoldData;
  cachedAt: number;
}

export interface CloneOptions {
  template: Template;
  projectName: string;
  palette: ColorPalette;
  fonts: FontPairing;
}

export interface CloneResult {
  urlId: string;
  projectId: string;
}

export interface UseTemplateCloneResult {
  cloneTemplate: (options: CloneOptions) => Promise<CloneResult>;
  isCloning: boolean;
  error: string | null;
}

