/**
 * Utility functions for template customization.
 * SSE helpers, file identification, code cleaning, and CSS/config injection.
 */

import type { StreamEvent, CustomizationRequest } from './types';

export function sendSSE(controller: ReadableStreamDefaultController, event: StreamEvent) {
  const data = JSON.stringify(event);
  controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

export function normalizeFilePaths(files: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    normalized[normalizePath(path)] = content;
  }
  return normalized;
}

export function identifyFilesToModify(files: Record<string, string>): string[] {
  const modifiableExtensions = ['.tsx', '.ts', '.jsx', '.js', '.astro', '.html', '.md'];
  const excludePatterns = [
    'node_modules', '.git', 'package-lock.json', 'pnpm-lock.yaml',
    '.d.ts', 'tsconfig', 'vite.config', 'postcss.config', 'eslint', 'prettier',
    'main.tsx', 'main.ts', 'main.jsx', 'main.js', 'routeTree.gen',
    '__root.tsx', '__root.ts', 'tailwind.config', 'package.json',
    'globals.css', 'global.css',
  ];

  return Object.keys(files).filter((path) => {
    const hasValidExtension = modifiableExtensions.some((ext) => path.endsWith(ext));
    if (!hasValidExtension) return false;
    const isExcluded = excludePatterns.some((p) => path.toLowerCase().includes(p.toLowerCase()));
    return !isExcluded;
  });
}

export function cleanCodeBlockWrapper(content: string): string {
  let cleaned = content.trim();

  const codeBlockPattern = /^```[\w]*\n?([\s\S]*?)```$/;
  const match = cleaned.match(codeBlockPattern);
  if (match) cleaned = match[1].trim();

  // Clean HTML artifacts
  cleaned = cleaned.replace(/<\/?span[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?div[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?pre[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?code[^>]*>/gi, '');
  cleaned = cleaned.replace(/[0-9a-fA-F]{6}">/g, '');
  cleaned = cleaned.replace(/style="[^"]*"/gi, '');

  // HTML entities
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");

  return cleaned.trim();
}

function injectViteServerConfig(content: string): string {
  if (content.includes('server:')) return content;
  const pluginsMatch = content.match(/plugins:\s*\[[\s\S]*?\],?/);
  if (pluginsMatch) {
    return content.replace(
      pluginsMatch[0],
      `${pluginsMatch[0]}\n  server: { host: '0.0.0.0', port: 5173 },`,
    );
  }
  return content;
}

function injectTailwindColors(
  content: string,
  palette: CustomizationRequest['palette'],
  fonts: CustomizationRequest['fonts'],
): string {
  const colorConfig = `
    colors: {
      primary: '${palette.primary}',
      secondary: '${palette.secondary}',
      accent: '${palette.accent}',
      background: '${palette.background}',
      foreground: '${palette.text}',
    },
    fontFamily: {
      heading: ['${fonts.heading}', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      body: ['${fonts.body}', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    },`;

  if (content.includes('extend: {')) {
    return content.replace('extend: {', `extend: {${colorConfig}`);
  }
  if (content.includes('theme: {')) {
    return content.replace('theme: {', `theme: {\n    extend: {${colorConfig}\n    },`);
  }
  return content;
}

export function applyDirectCustomizations(
  files: Record<string, string>,
  palette: CustomizationRequest['palette'],
  fonts: CustomizationRequest['fonts'],
): void {
  const cssVars = `
/* Custom Theme Variables */
:root {
  --color-primary: ${palette.primary};
  --color-secondary: ${palette.secondary};
  --color-accent: ${palette.accent};
  --color-background: ${palette.background};
  --color-text: ${palette.text};
  --font-heading: '${fonts.heading}', ui-sans-serif, system-ui, sans-serif;
  --font-body: '${fonts.body}', ui-sans-serif, system-ui, sans-serif;
}
`;

  for (const [path, content] of Object.entries(files)) {
    if (path.includes('global') && path.endsWith('.css')) {
      if (!content.includes('--color-primary')) {
        files[path] = cssVars + '\n' + content;
      }
    }
    if (path.includes('tailwind.config')) {
      files[path] = injectTailwindColors(content, palette, fonts);
    }
    if (path.includes('vite.config') && path.endsWith('.ts')) {
      files[path] = injectViteServerConfig(content);
    }
    if (path.endsWith('.html') && !content.includes('fonts.googleapis.com')) {
      const fontLink = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${fonts.heading.replace(/ /g, '+')}:wght@400;500;600;700&family=${fonts.body.replace(/ /g, '+')}:wght@400;500&display=swap" rel="stylesheet">`;
      files[path] = content.replace('</head>', `${fontLink}\n</head>`);
    }
  }
}
