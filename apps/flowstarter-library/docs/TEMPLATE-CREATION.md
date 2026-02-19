# Creating New Templates for Flowstarter

This guide enables designers to create new templates by prompting Claude (cloud) with their Figma designs.

## Quick Start

When prompting Claude to create a template, include:
1. This document
2. The COMPONENT-PATTERNS.md file
3. Your Figma design description or screenshots

---

## Template Structure

Every template lives in `/templates/{template-slug}/` with this structure:

```
templates/
└── {template-slug}/
    ├── config.json           # Template metadata
    ├── start/                # Source code
    │   ├── package.json
    │   ├── vite.config.ts
    │   ├── tailwind.config.ts
    │   └── src/
    │       ├── content/              # Content system
    │       │   ├── content.md        # Source of truth for all content
    │       │   ├── parseMarkdown.ts  # Markdown parser utility
    │       │   └── useContent.ts     # Hook that exports typed content
    │       ├── routes/
    │       │   ├── __root.tsx
    │       │   └── index.tsx         # Main page with themes
    │       └── components/           # React components
    └── .vinxi/build/client/  # Built output (generated)
```

---

## Content System Architecture

Templates use a **markdown-based content system** that separates content from code.

### Overview

```
content.md ──(parseMarkdown.ts)──> JavaScript Object ──(useContent.ts)──> Typed Content with Icons
```

### 1. content.md - The Source of Truth

All template content lives in `src/content/content.md` using YAML-like syntax:

```markdown
# Template Name - Content

## navigation

brand: {{PROJECT_NAME}}
cta: Get Started
links:
  - label: Features
    href: "#features"
  - label: Pricing
    href: "#pricing"

## hero

badge: New Feature Available
title: Your Main Headline Here
subtitle: {{PROJECT_DESCRIPTION}}
primaryCta: Start Free Trial
stats:
  - value: "10,000+"
    label: Active Users
  - value: "99.9%"
    label: Uptime

## features

badge: Features
title: Everything You Need
items:
  - icon: Zap
    title: Lightning Fast
    description: Optimized for speed.
  - icon: Shield
    title: Secure by Default
    description: Enterprise-grade security.
```

### 2. Available Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{PROJECT_NAME}}` | Brand/project name | "FlowSync" |
| `{{PROJECT_DESCRIPTION}}` | Short description | "Modern project management" |
| `{{TARGET_USERS}}` | Target audience | "product teams" |
| `{{BUSINESS_GOALS}}` | Business objectives | "streamline workflows" |
| `{{YEAR}}` | Current year | "2026" |
| `{{PROJECT_NAME_SLUG}}` | URL-safe name | "flowsync" |

### 3. parseMarkdown.ts - The Parser

**Copy this file from an existing template** (e.g., `templates/local-business-pro/start/src/content/parseMarkdown.ts`).

Features:
- Parses `## section` headers into object keys
- Handles YAML-like key: value pairs
- Supports nested arrays and objects with indentation
- Replaces `{{PLACEHOLDER}}` syntax with actual values

### 4. useContent.ts - The Hook

This file:
1. Imports raw markdown using Vite's `?raw` suffix
2. Parses it with the markdown parser
3. Replaces placeholders with project values
4. Maps icon strings to Lucide React components
5. Exports typed content

```typescript
import { parseMarkdownContent, replacePlaceholders } from './parseMarkdown';
import contentMarkdown from './content.md?raw';
import { Zap, Shield, Users, Globe, LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = { Zap, Shield, Users, Globe };

const PROJECT_VALUES = {
  PROJECT_NAME: 'YourBrand',
  PROJECT_DESCRIPTION: 'Your description',
  TARGET_USERS: 'your audience',
  BUSINESS_GOALS: 'your goals',
  YEAR: new Date().getFullYear().toString(),
};

function processWithIcons(obj: any): any {
  if (Array.isArray(obj)) return obj.map(item => processWithIcons(item));
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'icon' && typeof value === 'string') {
        result[key] = iconMap[value] || Globe;
      } else {
        result[key] = processWithIcons(value);
      }
    }
    return result;
  }
  return obj;
}

const rawParsed = parseMarkdownContent(contentMarkdown);
const withPlaceholders = replacePlaceholders(rawParsed, PROJECT_VALUES);
export const content = processWithIcons(withPlaceholders) as SiteContent;
```

---

## Creating a New Template

### Step 1: Copy parseMarkdown.ts

```bash
cp templates/local-business-pro/start/src/content/parseMarkdown.ts \
   templates/my-template/start/src/content/
```

### Step 2: Create content.md

Create `src/content/content.md` with all your sections using YAML-like syntax.

### Step 3: Create useContent.ts

1. Import all icons used in content.md
2. Define PROJECT_VALUES for demo content
3. Create TypeScript interfaces for each section
4. Export typed content

### Step 4: Create Components

Each component receives `content` and `theme` props:

```typescript
interface HeroProps {
  content: HeroContent;
  theme: { button: string; };
}

export function Hero({ content, theme }: HeroProps) {
  return (
    <section>
      <h1>{content.title}</h1>
      <p>{content.subtitle}</p>
      <a className={theme.button}>{content.primaryCta}</a>
    </section>
  );
}
```

### Step 5: Create index.tsx

Import content from useContent and pass to components:

```typescript
import { content } from '../content/useContent';

function HomePage() {
  return (
    <div>
      <Hero content={content.hero} theme={currentTheme} />
      <Features content={content.features} theme={currentTheme} />
    </div>
  );
}
```

---

## Theme System

Every template supports 8 color themes via URL: `?theme=modern`

| Theme | Colors | Best For |
|-------|--------|----------|
| modern | Blue/Purple | Tech, SaaS |
| vibrant | Rose/Orange | Creative |
| ocean | Cyan/Blue | Professional |
| forest | Green/Teal | Nature, Health |
| midnight | Dark Indigo | Luxury |
| sunset | Orange/Pink | Warm |
| minimal | Zinc/Slate | Minimalist |
| rose | Rose/Pink | Beauty |

---

## Build & Test

```bash
cd templates/your-template/start
bun install
npx vite build --outDir .vinxi/build/client
cp -r .vinxi/build/client ../.vinxi/build/
```

---

## Checklist

- [ ] content.md contains all section content with placeholders
- [ ] parseMarkdown.ts copied from existing template
- [ ] useContent.ts maps all icons and has TypeScript interfaces
- [ ] All 8 themes defined in index.tsx
- [ ] Components accept content and theme props
- [ ] Build completes without errors
