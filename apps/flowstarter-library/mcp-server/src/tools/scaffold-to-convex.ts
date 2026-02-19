/**
 * Scaffold Template to Convex Tool
 *
 * This tool scaffolds a template directly to Convex, bypassing the browser.
 * The editor can then subscribe to Convex for real-time file updates.
 *
 * Flow:
 * 1. Generate unique URL ID
 * 2. Create project in Convex
 * 3. Read template files
 * 4. Apply customizations (palette, fonts)
 * 5. Write files to Convex
 * 6. Create initial snapshot
 * 7. Return project info
 */

import { z } from 'zod';
import * as path from 'path';
import * as fs from 'fs/promises';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import { buildFileTree, getAllFiles } from '../utils/file-reader.js';
import {
  convexClient,
  type ColorPalette,
  type FontPairing,
  type FileEntry,
} from '../utils/convex.js';

// Input schema
export const ScaffoldToConvexSchema = z.object({
  slug: z.string().describe('The template slug to scaffold'),
  projectName: z.string().describe('Name for the new project'),
  projectDescription: z.string().optional().describe('Optional project description'),
  palette: z
    .object({
      id: z.string(),
      name: z.string(),
      colors: z.object({
        primary: z.string(),
        secondary: z.string(),
        accent: z.string(),
        background: z.string(),
        text: z.string(),
      }),
    })
    .optional()
    .describe('Color palette for customization'),
  fonts: z
    .object({
      id: z.string(),
      name: z.string(),
      heading: z.object({ family: z.string(), weight: z.number() }),
      body: z.object({ family: z.string(), weight: z.number() }),
      googleFonts: z.string(),
    })
    .optional()
    .describe('Font pairing for customization'),
});

export type ScaffoldToConvexInput = z.infer<typeof ScaffoldToConvexSchema>;

export interface ScaffoldToConvexResult {
  success: boolean;
  projectId?: string;
  urlId?: string;
  fileCount?: number;
  error?: string;
}

/**
 * Apply customizations to template files
 */
function applyCustomizations(
  files: Array<{ path: string; content: string }>,
  projectName: string,
  projectDescription?: string,
  palette?: ColorPalette,
  fonts?: FontPairing
): Array<{ path: string; content: string }> {
  // Generate slug from project name
  const projectNameSlug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const currentYear = new Date().getFullYear().toString();
  
  // Default description if not provided
  const description = projectDescription || `Welcome to ${projectName}`;

  return files.map((file) => {
    let content = file.content;

    // Apply template placeholder replacements to all files
    // Handle both {{PLACEHOLDER}} and {{ PLACEHOLDER }} formats
    content = content.replace(/\{\{\s*PROJECT_NAME\s*\}\}/g, projectName);
    content = content.replace(/\{\{\s*PROJECT_DESCRIPTION\s*\}\}/g, description);
    content = content.replace(/\{\{\s*PROJECT_NAME_SLUG\s*\}\}/g, projectNameSlug);
    content = content.replace(/\{\{\s*YEAR\s*\}\}/g, currentYear);
    content = content.replace(/\{\{\s*year\s*\}\}/g, currentYear);
    
    // TARGET_USERS and BUSINESS_GOALS - use generic defaults based on project description
    content = content.replace(/\{\{\s*TARGET_USERS\s*\}\}/g, 'our valued customers');
    content = content.replace(/\{\{\s*BUSINESS_GOALS\s*\}\}/g, 'delivering exceptional value');

    // Apply color placeholders (used in tailwind.config.ts and other config files)
    if (palette) {
      content = content.replace(/\{\{\s*PRIMARY_COLOR\s*\}\}/g, palette.colors.primary);
      content = content.replace(/\{\{\s*SECONDARY_COLOR\s*\}\}/g, palette.colors.secondary);
      content = content.replace(/\{\{\s*ACCENT_COLOR\s*\}\}/g, palette.colors.accent);
      content = content.replace(/\{\{\s*BACKGROUND_COLOR\s*\}\}/g, palette.colors.background);
      content = content.replace(/\{\{\s*TEXT_COLOR\s*\}\}/g, palette.colors.text);
    } else {
      // Default colors if no palette provided
      content = content.replace(/\{\{\s*PRIMARY_COLOR\s*\}\}/g, '#3B82F6');
      content = content.replace(/\{\{\s*SECONDARY_COLOR\s*\}\}/g, '#6366F1');
      content = content.replace(/\{\{\s*ACCENT_COLOR\s*\}\}/g, '#8B5CF6');
      content = content.replace(/\{\{\s*BACKGROUND_COLOR\s*\}\}/g, '#0F172A');
      content = content.replace(/\{\{\s*TEXT_COLOR\s*\}\}/g, '#FFFFFF');
    }

    // Apply font placeholders (used in tailwind.config.ts and other config files)
    if (fonts) {
      content = content.replace(/\{\{\s*HEADING_FONT\s*\}\}/g, fonts.heading.family);
      content = content.replace(/\{\{\s*BODY_FONT\s*\}\}/g, fonts.body.family);
    } else {
      // Default fonts if no font pairing provided
      content = content.replace(/\{\{\s*HEADING_FONT\s*\}\}/g, 'Montserrat');
      content = content.replace(/\{\{\s*BODY_FONT\s*\}\}/g, 'Inter');
    }

    // Apply palette customizations to CSS/TSX files
    if (palette && (file.path.endsWith('.css') || file.path.endsWith('.tsx') || file.path.endsWith('.ts'))) {
      // Replace common color patterns
      const colorReplacements: Record<string, string> = {
        // Primary colors
        '#3B82F6': palette.colors.primary,
        '#2563EB': palette.colors.primary,
        'rgb(59, 130, 246)': palette.colors.primary,
        // Secondary colors
        '#6366F1': palette.colors.secondary,
        '#4F46E5': palette.colors.secondary,
        // Accent colors
        '#8B5CF6': palette.colors.accent,
        '#7C3AED': palette.colors.accent,
        // Background colors
        '#0F172A': palette.colors.background,
        '#1E293B': palette.colors.background,
      };

      for (const [from, to] of Object.entries(colorReplacements)) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), to);
      }
    }

    // Apply font customizations
    if (fonts && (file.path.endsWith('.css') || file.path.endsWith('.tsx') || file.path.endsWith('.html'))) {
      // Replace font family references
      content = content.replace(/font-family:\s*['"]?Inter['"]?/gi, `font-family: '${fonts.body.family}'`);
      content = content.replace(/fontFamily:\s*['"]?Inter['"]?/gi, `fontFamily: '${fonts.body.family}'`);
    }

    // Fix vite.config.ts to use correct routes directory for TanStack Router
    // Templates with src/routes/ need TanStackRouterVite configured properly
    if (file.path.endsWith('vite.config.ts')) {
      // Check if it uses TanStackRouterVite without routesDirectory config
      if (content.includes('TanStackRouterVite()') && !content.includes('routesDirectory')) {
        content = content.replace(
          'TanStackRouterVite()',
          `TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    })`
        );
        console.log('[applyCustomizations] Updated vite.config.ts with routes directory');
      }

      // Add server configuration for Daytona/container environments
      // This ensures the dev server binds to 0.0.0.0 so it's accessible externally
      if (!content.includes('server:') && !content.includes('server :')) {
        // Find the plugins array and add server config after it
        const pluginsMatch = content.match(/plugins:\s*\[[\s\S]*?\],?/);
        if (pluginsMatch) {
          content = content.replace(
            pluginsMatch[0],
            `${pluginsMatch[0]}
  server: {
    host: '0.0.0.0',
    port: 5173,
  },`
          );
          console.log('[applyCustomizations] Added server config to vite.config.ts for container compatibility');
        }
      }
    }

    // Convert package.json from TanStack Start (vinxi) to simple Vite for WebContainer compatibility
    // WebContainer doesn't fully support vinxi, but vite works fine
    if (file.path.endsWith('package.json')) {
      try {
        const pkg = JSON.parse(content);
        let modified = false;

        // Convert scripts from vinxi to vite
        if (pkg.scripts) {
          if (pkg.scripts.dev === 'vinxi dev') {
            pkg.scripts.dev = 'vite';
            modified = true;
          }
          if (pkg.scripts.build === 'vinxi build') {
            pkg.scripts.build = 'vite build';
            modified = true;
          }
          if (pkg.scripts.start === 'vinxi start') {
            pkg.scripts.start = 'vite preview';
            modified = true;
          }
        }

        // Remove vinxi from devDependencies (not needed for WebContainer)
        if (pkg.devDependencies?.vinxi) {
          delete pkg.devDependencies.vinxi;
          modified = true;
        }

        // Remove TanStack Start dependencies (not needed for simple Vite)
        if (pkg.dependencies?.['@tanstack/react-start']) {
          delete pkg.dependencies['@tanstack/react-start'];
          modified = true;
        }
        if (pkg.devDependencies?.['@tanstack/start-config']) {
          delete pkg.devDependencies['@tanstack/start-config'];
          modified = true;
        }

        if (modified) {
          content = JSON.stringify(pkg, null, 2);
          console.log('[applyCustomizations] Converted package.json from vinxi to vite');
        }
      } catch (e) {
        // If JSON parsing fails, leave content as-is
        console.warn('[applyCustomizations] Failed to parse package.json:', e);
      }
    }

    // Inject Google Fonts into index.html if fonts are specified
    if (file.path.endsWith('index.html') && fonts && !content.includes('fonts.googleapis.com')) {
      const headingFont = fonts.heading.family.replace(/ /g, '+');
      const bodyFont = fonts.body.family.replace(/ /g, '+');
      const googleFontsLink = `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${headingFont}:wght@500;600;700&family=${bodyFont}:wght@400;500;600;700&display=swap" rel="stylesheet">`;

      // Inject before </head>
      content = content.replace('</head>', `${googleFontsLink}\n  </head>`);
      console.log('[applyCustomizations] Injected Google Fonts into index.html');
    }

    return { path: file.path, content };
  });
}

/**
 * Scaffold a template directly to Convex
 */
export async function scaffoldToConvex(
  input: ScaffoldToConvexInput,
  fetcher: TemplateFetcher,
  templatesDir: string
): Promise<ScaffoldToConvexResult> {
  const startTime = Date.now();
  console.log(`[scaffold_to_convex] Starting scaffold for template "${input.slug}"`);

  try {
    // 1. Check if Convex is available
    console.log('[scaffold_to_convex] Checking Convex availability...');
    const isConvexAvailable = await convexClient.checkConvexHealth();
    if (!isConvexAvailable) {
      return {
        success: false,
        error: 'Convex server is not available. Please ensure Convex dev server is running.',
      };
    }

    // 2. Generate unique URL ID
    console.log('[scaffold_to_convex] Generating URL ID...');
    const urlId = await convexClient.generateUrlId(input.projectName);
    console.log(`[scaffold_to_convex] Generated URL ID: ${urlId}`);

    // 3. Create project in Convex
    console.log('[scaffold_to_convex] Creating project in Convex...');
    const projectId = await convexClient.createProject({
      name: input.projectName,
      urlId,
      description: input.projectDescription || `Created from template: ${input.slug}`,
      palette: input.palette,
      fonts: input.fonts,
      metadata: {
        templateId: input.slug,
      },
    });
    console.log(`[scaffold_to_convex] Created project: ${projectId}`);

    // 4. Read template files
    // Support both new structure (sources in root) and legacy structure (sources in start/)
    console.log('[scaffold_to_convex] Reading template files...');
    const templatePath = path.join(templatesDir, input.slug);
    const startPath = path.join(templatePath, 'start');

    // Check if template uses new structure (src/ in root) or legacy structure (start/src/)
    let scaffoldPath = templatePath;
    try {
      const startStats = await fs.stat(startPath);
      if (startStats.isDirectory()) {
        scaffoldPath = startPath;
        console.log('[scaffold_to_convex] Using legacy structure (start/ directory)');
      }
    } catch {
      // start/ doesn't exist, use root (new structure)
      console.log('[scaffold_to_convex] Using new structure (sources in root)');
    }

    const fileTree = await buildFileTree(scaffoldPath);
    const rawFiles = await getAllFiles(scaffoldPath, fileTree);
    console.log(`[scaffold_to_convex] Read ${rawFiles.length} files from template`);

    // 5. Apply customizations (placeholders, palette, fonts)
    console.log('[scaffold_to_convex] Applying customizations...');
    const customizedFiles = applyCustomizations(
      rawFiles,
      input.projectName,
      input.projectDescription,
      input.palette,
      input.fonts
    );

    // 5.5. Generate routeTree.gen.ts for TanStack Router if needed
    // Check if template uses TanStack Router (has routes directory and main.tsx imports routeTree.gen)
    // Paths are now normalized to forward slashes by file-reader.ts
    const hasRoutesDir = customizedFiles.some(f => f.path.includes('/routes/'));
    const mainTsx = customizedFiles.find(f => f.path.endsWith('main.tsx'));
    const needsRouteTree = hasRoutesDir && mainTsx && mainTsx.content.includes('routeTree.gen');

    console.log('[scaffold_to_convex] Route check - hasRoutesDir:', hasRoutesDir, 'mainTsx:', !!mainTsx, 'needsRouteTree:', needsRouteTree);

    if (needsRouteTree) {
      // Find route files to generate routeTree.gen.ts
      const routeFiles = customizedFiles.filter(f => f.path.includes('/routes/') && f.path.endsWith('.tsx'));
      const hasRootRoute = routeFiles.some(f => f.path.endsWith('__root.tsx'));
      const hasIndexRoute = routeFiles.some(f => f.path.endsWith('index.tsx'));
      console.log('[scaffold_to_convex] Route files found:', routeFiles.length, 'hasRoot:', hasRootRoute, 'hasIndex:', hasIndexRoute);

      if (hasRootRoute && hasIndexRoute) {
        // Generate routeTree.gen.ts content
        // Uses direct imports (not lazy loading) to match the template's createFileRoute pattern
        const routeTreeContent = `/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.

import { Route as rootRoute } from './routes/__root'
import { Route as IndexRoute } from './routes/index'

// Create and export the route tree

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRoute
      parentRoute: typeof rootRoute
    }
  }
}

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/'
  fileRoutesByTo: FileRoutesByTo
  to: '/'
  id: '__root__' | '/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
`;

        // Determine the correct path based on template structure
        // If routes are in src/routes, put routeTree.gen.ts in src/
        const routeTreePath = '/src/routeTree.gen.ts';
        customizedFiles.push({ path: routeTreePath, content: routeTreeContent });
        console.log('[scaffold_to_convex] Generated routeTree.gen.ts for TanStack Router');
      }
    }

    // 6. Convert to FileEntry format and sync to Convex
    console.log('[scaffold_to_convex] Syncing files to Convex...');
    const fileEntries: FileEntry[] = customizedFiles.map((f) => ({
      path: f.path.startsWith('/') ? f.path : `/${f.path}`,
      content: f.content,
      type: 'file',
      isBinary: false,
    }));

    await convexClient.syncFiles(projectId, fileEntries, true);
    console.log(`[scaffold_to_convex] Synced ${fileEntries.length} files`);

    // 7. Create initial snapshot (skip for now - files are stored, snapshot is optional)
    // Note: Snapshot creation is skipped to avoid Convex body size limits
    // The files are already synced and can be used for the project
    console.log('[scaffold_to_convex] Skipping snapshot creation (files already synced)');

    const duration = Date.now() - startTime;
    console.log(`[scaffold_to_convex] Completed successfully in ${duration}ms`);

    return {
      success: true,
      projectId,
      urlId,
      fileCount: fileEntries.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[scaffold_to_convex] Failed:`, error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
