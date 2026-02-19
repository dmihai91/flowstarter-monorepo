# Flowstarter Template Library - Agent Guide

This document explains how the template system works and how to add new templates.

## Agent Instructions

**IMPORTANT**: See **[AGENTS.md](AGENTS.md)** for detailed coding agent instructions including:
- Content architecture (markdown-based content files)
- Single content prop pattern for components
- Icon handling and mapping
- Theme system and defaults
- File structure requirements

## Documentation for Template Creation

For designers creating new templates via Claude (cloud), see:

- **[docs/TEMPLATE-CREATION.md](docs/TEMPLATE-CREATION.md)** - Step-by-step guide for creating new templates
- **[docs/COMPONENT-PATTERNS.md](docs/COMPONENT-PATTERNS.md)** - Copy-pasteable code patterns for all component types

## Project Structure

```
flowstarter-library/
├── mcp-server/                    # MCP server that provides template APIs
├── templates/                     # All template directories
│   └── {template-slug}/           # Individual template
│       ├── config.json            # Template metadata
│       ├── thumbnail.png          # Template thumbnail
│       ├── thumbnail-light.png    # Light mode thumbnail
│       ├── thumbnail-dark.png     # Dark mode thumbnail
│       ├── start/                 # Source code directory
│       │   ├── src/
│       │   │   ├── content/       # CONTENT SYSTEM
│       │   │   │   ├── content.md       # Source of truth for all content
│       │   │   │   ├── parseMarkdown.ts # Markdown parser (copy from existing)
│       │   │   │   └── useContent.ts    # Hook with types and icon mapping
│       │   │   ├── routes/
│       │   │   │   ├── __root.tsx
│       │   │   │   └── index.tsx  # Main page with themes
│       │   │   ├── components/    # React components
│       │   │   └── styles/
│       │   │       ├── globals.css
│       │   │       └── safelist.ts
│       │   ├── tailwind.config.ts
│       │   ├── vite.config.ts
│       │   └── package.json
│       └── .vinxi/build/client/   # Built output (served by MCP server)
├── templates-showcase/            # Showcase React app
├── scripts/                       # Build and utility scripts
└── package.json
```

## Content System Architecture

Templates use a **markdown-based content system** that separates content from code:

```
content.md ──(parseMarkdown.ts)──> JS Object ──(useContent.ts)──> Typed Content with Icons
```

### Key Files (in `start/src/content/`)

1. **content.md** - Source of truth for all template content using YAML-like syntax
2. **parseMarkdown.ts** - Parser utility (copy from existing template, don't write from scratch)
3. **useContent.ts** - Exports typed content with icon mapping

### Placeholder Variables

Available in `content.md`:
- `{{PROJECT_NAME}}` - Project/brand name
- `{{PROJECT_DESCRIPTION}}` - Project description
- `{{TARGET_USERS}}` - Target audience
- `{{BUSINESS_GOALS}}` - Business objectives
- `{{YEAR}}` - Current year

### Example content.md Structure

```markdown
## navigation

brand: {{PROJECT_NAME}}
cta: Get Started
links:
  - label: Features
    href: "#features"

## hero

badge: New Feature
title: Main Headline
subtitle: {{PROJECT_DESCRIPTION}}
primaryCta: Start Free Trial
stats:
  - value: "10k+"
    label: Users

## features

badge: Features
title: Why Choose Us
items:
  - icon: Zap
    title: Fast
    description: Lightning speed
```

## Theme System

Templates support 8 color themes via URL: `?theme=modern`

| Theme | Colors | Default For |
|-------|--------|-------------|
| `modern` | Blue/Purple | saas-product-pro |
| `vibrant` | Rose/Orange | - |
| `ocean` | Cyan/Blue | - |
| `forest` | Green/Teal | local-business-pro |
| `midnight` | Dark Indigo | - |
| `sunset` | Orange/Pink | personal-brand-pro |
| `minimal` | Zinc/Slate | - |
| `rose` | Rose/Pink | - |

### Theme Implementation

Themes are defined in `src/routes/index.tsx`:

```typescript
const themes: Record<string, any> = {
  modern: {
    gradient: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700',
    button: 'bg-white text-blue-600',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    // ... more theme properties
  },
  // ... other themes
};
```

## Adding a New Template

### Quick Steps

1. **Copy parseMarkdown.ts** from existing template
2. **Create content.md** with all content using placeholders
3. **Create useContent.ts** with icon mapping and TypeScript interfaces
4. **Build components** using single `content` prop pattern
5. **Create index.tsx** with all 8 themes
6. **Build**: `npx vite build --outDir .vinxi/build/client`
7. **Copy build**: `cp -r .vinxi/build/client ../.vinxi/build/`

### Component Pattern

All components receive a single `content` prop:

```typescript
interface HeroProps {
  content: HeroContent;
  theme: ThemeConfig;
}

export function Hero({ content, theme }: HeroProps) {
  return (
    <section>
      <h1>{content.title}</h1>
      <p>{content.subtitle}</p>
    </section>
  );
}
```

## Build Commands

From project root:
- `bun run dev` - Start dev servers (MCP + Showcase)
- `bun run build` - Build MCP server
- `bun run build:templates` - Build all templates
- `bun run build:showcase` - Build showcase app

From template directory:
```bash
cd templates/my-template/start
bun install
npx vite build --outDir .vinxi/build/client
cp -r .vinxi/build/client ../.vinxi/build/
```

## MCP Server Endpoints

- `GET /api/templates/:slug/live` - Live preview (`?mode=dark`, `?theme=ocean`)
- `GET /api/templates/:slug/thumbnail` - Thumbnail image
- `GET /api/templates/:slug/assets/*` - Static assets

## Troubleshooting

### Dark mode not working
- Add `postcss.config.js` to `start/` directory
- Create `src/styles/safelist.ts` with all dark mode classes
- Verify Tailwind config has `darkMode: 'class'`

### Build errors
- Use plain Vite: `npx vite build --outDir .vinxi/build/client`
- Ensure `parseMarkdown.ts` is copied from existing template

### Content not updating
- Edit `content.md` (source of truth)
- If new icons used, add to `iconMap` in `useContent.ts`
- Rebuild template
