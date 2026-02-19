import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const GetCodingGuideSchema = z.object({
  templateSlug: z.string().optional().describe('Optional: Get guidance specific to a template slug'),
  topic: z.enum(['content', 'components', 'themes', 'icons', 'structure', 'all']).optional().describe('Specific topic to get guidance on'),
});

export type GetCodingGuideInput = z.infer<typeof GetCodingGuideSchema>;

export interface CodingGuideResult {
  overview: string;
  contentArchitecture: {
    description: string;
    sourceFile: string;
    placeholders: { name: string; description: string; example: string }[];
    structure: string;
  };
  componentPattern: {
    description: string;
    example: string;
    rules: string[];
  };
  iconHandling: {
    description: string;
    example: string;
    commonIcons: string[];
  };
  themeSystem: {
    description: string;
    availableThemes: { name: string; colors: string; bestFor: string }[];
    defaultThemes: { template: string; theme: string }[];
    usageExample: string;
  };
  fileStructure: {
    description: string;
    structure: string;
    keyFiles: { path: string; purpose: string }[];
  };
  modificationRules: {
    toModifyContent: string[];
    toModifyStyles: string[];
    toAddSections: string[];
    toChangeTheme: string[];
  };
}

export function getCodingGuide(input: GetCodingGuideInput): CodingGuideResult {
  const guide: CodingGuideResult = {
    overview: `
Flowstarter templates use a markdown-based content system with TypeScript/React components.
The key principle is: content lives in content.md, components receive a single \`content\` prop.
    `.trim(),

    contentArchitecture: {
      description: 'All template content is stored in a single markdown file (content.md) that serves as the source of truth.',
      sourceFile: 'templates/{template}/start/src/content/content.md',
      placeholders: [
        { name: '{{PROJECT_NAME}}', description: 'Business/product name', example: '"FlowSync"' },
        { name: '{{PROJECT_DESCRIPTION}}', description: 'Brief description', example: '"Modern project management"' },
        { name: '{{TARGET_USERS}}', description: 'Target audience', example: '"product teams"' },
        { name: '{{BUSINESS_GOALS}}', description: 'Primary objectives', example: '"streamline workflows"' },
        { name: '{{YEAR}}', description: 'Current year', example: '"2026"' },
      ],
      structure: `
## section_name

key: value
nested:
  - item: value
    icon: IconName
items:
  - title: First Item
    description: Description here
    icon: Zap
      `.trim(),
    },

    componentPattern: {
      description: 'All components MUST accept a single content prop (plus optional theme). Never use individual props.',
      example: `
// CORRECT - Single content prop
interface HeroProps {
  content: HeroContent;
  theme?: ThemeConfig;
}

export function Hero({ content, theme }: HeroProps) {
  return (
    <section>
      <span className={theme.badge}>{content.badge}</span>
      <h1>{content.title}</h1>
      <p>{content.subtitle}</p>
      <a className={theme.button}>{content.primaryCta}</a>
    </section>
  );
}

// WRONG - Individual props
export function Hero({ title, subtitle, badge }) { ... }
      `.trim(),
      rules: [
        'Components receive one `content` object, not individual props',
        'Theme is passed as a separate optional prop',
        'TypeScript interfaces define content shape in useContent.ts',
        'Icons are LucideIcon components, not strings',
      ],
    },

    iconHandling: {
      description: 'Icons are specified as string names in content.md and mapped to Lucide React components in useContent.ts.',
      example: `
// In content.md
features:
  - icon: Zap
    title: Fast

// In useContent.ts
import { Zap, Shield, Users } from 'lucide-react';
const iconMap = { Zap, Shield, Users };

// In component
{items.map(item => {
  const IconComponent = item.icon;
  return <IconComponent className="h-6 w-6" />;
})}
      `.trim(),
      commonIcons: [
        'Zap', 'Shield', 'Users', 'Globe', 'Star', 'Check', 'ChevronRight',
        'Play', 'ArrowRight', 'Phone', 'Mail', 'MapPin', 'Clock', 'Calendar',
        'Heart', 'Award', 'TrendingUp', 'Settings', 'Lock', 'Sparkles',
      ],
    },

    themeSystem: {
      description: 'Templates support 8 color themes selectable via URL parameter ?theme=name',
      availableThemes: [
        { name: 'modern', colors: 'Blue/Purple', bestFor: 'Tech, SaaS' },
        { name: 'vibrant', colors: 'Rose/Orange', bestFor: 'Creative' },
        { name: 'ocean', colors: 'Cyan/Blue', bestFor: 'Professional' },
        { name: 'forest', colors: 'Green/Teal', bestFor: 'Nature, Eco' },
        { name: 'midnight', colors: 'Dark Indigo', bestFor: 'Luxury' },
        { name: 'sunset', colors: 'Orange/Pink', bestFor: 'Warm, Personal' },
        { name: 'minimal', colors: 'Zinc/Slate', bestFor: 'Minimalist' },
        { name: 'rose', colors: 'Rose/Pink', bestFor: 'Beauty, Lifestyle' },
      ],
      defaultThemes: [
        { template: 'local-business-pro', theme: 'forest' },
        { template: 'saas-product-pro', theme: 'modern' },
        { template: 'personal-brand-pro', theme: 'sunset' },
      ],
      usageExample: `
// In index.tsx
const themes = {
  modern: {
    gradient: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700',
    button: 'bg-white text-blue-600 hover:bg-blue-50',
    badge: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    cardBg: 'bg-blue-500/10 border-blue-500/20',
  },
  // ... other themes
};

function HomePage() {
  const { theme } = Route.useSearch();
  const currentTheme = themes[theme] || themes.modern;
  return <Hero content={content.hero} theme={currentTheme} />;
}
      `.trim(),
    },

    fileStructure: {
      description: 'Standard template file structure',
      structure: `
templates/{template-name}/
├── config.json              # Template metadata
├── thumbnail.png            # Preview image
├── thumbnail-light.png      # Light mode thumbnail
├── thumbnail-dark.png       # Dark mode thumbnail
└── start/
    └── src/
        ├── content/
        │   ├── content.md       # *** SOURCE OF TRUTH ***
        │   ├── parseMarkdown.ts # Parser (copy, don't write)
        │   └── useContent.ts    # Types & icon mapping
        ├── routes/
        │   ├── __root.tsx       # Layout wrapper
        │   └── index.tsx        # Main page with themes
        ├── components/          # Section components
        │   ├── Hero.tsx
        │   ├── Features.tsx
        │   ├── Pricing.tsx
        │   └── ...
        └── styles/
            ├── globals.css
            └── safelist.ts      # Tailwind safelist
      `.trim(),
      keyFiles: [
        { path: 'src/content/content.md', purpose: 'All text content - MODIFY THIS FOR CONTENT CHANGES' },
        { path: 'src/content/useContent.ts', purpose: 'TypeScript types and icon mapping - UPDATE when adding icons' },
        { path: 'src/routes/index.tsx', purpose: 'Main page, theme definitions - MODIFY for layout/theme changes' },
        { path: 'src/components/*.tsx', purpose: 'Section components - MODIFY for structural changes' },
        { path: 'tailwind.config.ts', purpose: 'Tailwind configuration - MODIFY for custom styles' },
      ],
    },

    modificationRules: {
      toModifyContent: [
        'Edit content.md file directly',
        'Use placeholders ({{PROJECT_NAME}}) for customizable values',
        'Keep YAML-like structure: key: value',
        'Arrays use - prefix for items',
      ],
      toModifyStyles: [
        'Add/modify theme objects in index.tsx',
        'Use Tailwind classes in theme definitions',
        'Update safelist.ts if adding dynamic classes',
        'Use dark: prefix for dark mode variants',
      ],
      toAddSections: [
        '1. Add new section in content.md with ## header',
        '2. Add TypeScript interface in useContent.ts',
        '3. Create component file in src/components/',
        '4. Import and use in index.tsx',
        '5. Add icon mappings if using new icons',
      ],
      toChangeTheme: [
        'Modify theme object in index.tsx themes constant',
        'Each theme has: gradient, button, badge, cardBg, etc.',
        'Test with ?theme=name URL parameter',
        'Update default theme assignment if needed',
      ],
    },
  };

  return guide;
}
