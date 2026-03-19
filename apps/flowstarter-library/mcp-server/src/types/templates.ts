export interface TemplateTheme {
  default: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

/**
 * Template-specific color palette
 * Each template has 5 curated palettes that match its style
 */
export interface TemplatePalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    'primary-dark'?: string;
    secondary: string;
    accent: string;
    background: string;
    surface?: string;
    text: string;
    'text-muted'?: string;
  };
}

/**
 * Template-specific font pairing
 * Each template has 5 curated font pairings that match its aesthetic
 */
export interface TemplateFont {
  id: string;
  name: string;
  heading: string;
  body: string;
  googleFonts?: string;
}

export interface TemplateConfig {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  category?: string;
  tags?: string[];
  framework?: string;
  features?: string[];
  bestFor?: string[];
  defaultTheme?: string;
  themes?: string[];
  placeholders?: Record<string, string>;
  // Legacy fields for backward compatibility
  projectName?: string;
  projectDescription?: string;
  targetUsers?: string;
  businessGoals?: string;
  theme?: TemplateTheme;
  hasThumbnail?: boolean;
  useCase?: string[];
  defaults?: Record<string, string>;
  techStack?: {
    framework?: string;
    styling?: string;
    typescript?: boolean;
    components?: string;
  };
  // Template-specific palettes and fonts
  palettes?: TemplatePalette[];
  fonts?: TemplateFont[];
  [key: string]: unknown;
}

export interface TemplateMetadata {
  name: string;
  slug: string;
  displayName: string;
  description: string;
  category: 'local-business' | 'personal-brand' | 'saas-product' | 'fitness' | 'beauty' | 'food-service' | 'health-wellness' | 'health-fitness' | 'beauty-wellness' | 'general';
  useCase: string[];
  targetAudience: string;
  features: string[];
  techStack: {
    framework: string;
    react: string;
    styling: string;
    icons: string;
    typescript: boolean;
    deployment: string;
  };
  stats: {
    fileCount: number;
    totalLOC: number;
    codeLOC: number;
    cssLOC: number;
  };
}

export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
  content?: string; // Only populated when requested
}

export interface Template {
  metadata: TemplateMetadata;
  config: TemplateConfig;
  contentStructure: string; // content.md as text
  fileTree: FileNode;
  packageJson: {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
  };
}

export interface TemplateListItem {
  slug: string;
  displayName: string;
  description: string;
  category: string;
  useCase: string[];
  fileCount: number;
  totalLOC: number;
  thumbnailUrl?: string;
  previewUrl?: string;
  theme?: TemplateTheme;
  palettes?: TemplatePalette[];
  fonts?: TemplateFont[];
}

export interface ScaffoldData {
  template: Template;
  files: Array<{
    path: string;
    content: string;
    type: 'file';
  }>;
}
