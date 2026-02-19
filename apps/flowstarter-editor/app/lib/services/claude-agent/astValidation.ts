/**
 * AST Validation & Pre-deployment Fixes
 *
 * Validates generated .astro files BEFORE uploading to the sandbox.
 * Catches import errors, missing components, and common LLM hallucinations
 * without needing a sandbox round-trip.
 */

// Packages known to be installed in the sandbox
const INSTALLED_PACKAGES = new Set([
  'astro',
  '@astrojs/tailwind',
  'tailwindcss',
]);

// Built-in/virtual modules that are always available
const BUILTIN_MODULES = new Set([
  'astro:content',
  'astro:assets',
  'astro:transitions',
  'astro:middleware',
  'astro:components',
  'node:fs',
  'node:path',
  'node:url',
]);

// Known bad packages that LLMs hallucinate
const KNOWN_BAD_PACKAGES: Record<string, string> = {
  'astro-icon': 'Not installed — use inline SVG or text instead',
  'astro-icon/components': 'Not installed — use inline SVG or text instead',
  '@astrojs/image': 'Deprecated — use astro:assets instead',
  '@astrojs/mdx': 'Not installed in sandbox',
  '@astrojs/sitemap': 'Not installed in sandbox',
  '@astrojs/react': 'Not installed in sandbox',
  '@astrojs/vue': 'Not installed in sandbox',
  '@astrojs/svelte': 'Not installed in sandbox',
  'astro-seo': 'Not installed — use <meta> tags directly',
  'astro-embed': 'Not installed — use native HTML embeds',
  '@fontsource': 'Not installed — use Google Fonts via <link>',
  'sharp': 'Not installed in sandbox',
};

interface ValidationIssue {
  file: string;
  line?: number;
  message: string;
  severity: 'error' | 'warning';
  autoFix?: () => string; // Returns fixed content
}

interface ImportInfo {
  source: string;
  specifiers: string;
  fullMatch: string;
  line: number;
}

interface ValidationResult {
  issues: ValidationIssue[];
  fixedFiles: Record<string, string>;
  fixCount: number;
  fixSummary: string[];
}

/**
 * Extract all import statements from file content
 */
function extractImports(content: string): ImportInfo[] {
  const imports: ImportInfo[] = [];
  const lines = content.split('\n');

  // Only look in frontmatter for .astro files
  let inFrontmatter = false;
  let frontmatterEnd = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        frontmatterEnd = i;
        break;
      }
    }
  }

  // Match import statements
  const importRegex = /^(import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))?\s+from\s+)?['"]([^'"]+)['"];?\s*)$/gm;

  for (let i = 0; i < frontmatterEnd; i++) {
    const line = lines[i];
    const match = line.match(/import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))?\s+from\s+)?['"]([^'"]+)['"]/);
    if (match) {
      imports.push({
        source: match[1],
        specifiers: line.replace(/from\s+['"][^'"]+['"];?\s*$/, '').replace(/^import\s+/, '').trim(),
        fullMatch: line,
        line: i + 1,
      });
    }
  }

  return imports;
}

/**
 * Check if an import source is a local/relative import
 */
function isLocalImport(source: string): boolean {
  return source.startsWith('.') || source.startsWith('/');
}

/**
 * Check if a package import is valid (installed or built-in)
 */
function isValidPackage(source: string): boolean {
  // Built-in modules
  if (BUILTIN_MODULES.has(source)) return true;
  if (source.startsWith('node:')) return true;

  // Check exact match
  if (INSTALLED_PACKAGES.has(source)) return true;

  // Check if it's a subpath of an installed package (e.g., 'astro/components')
  for (const pkg of INSTALLED_PACKAGES) {
    if (source.startsWith(pkg + '/')) return true;
  }

  return false;
}

/**
 * Check if a package is known to be problematic
 */
function getKnownBadReason(source: string): string | undefined {
  // Direct match
  if (KNOWN_BAD_PACKAGES[source]) return KNOWN_BAD_PACKAGES[source];

  // Subpath match (e.g., '@fontsource/inter' matches '@fontsource')
  for (const [pkg, reason] of Object.entries(KNOWN_BAD_PACKAGES)) {
    if (source.startsWith(pkg + '/') || source.startsWith(pkg)) return reason;
  }

  return undefined;
}

/**
 * Remove an import and its usages from .astro file content
 */
function removeImportAndUsages(content: string, imp: ImportInfo): string {
  let fixed = content;

  // Remove the import line
  fixed = fixed.replace(imp.fullMatch + '\n', '');
  fixed = fixed.replace(imp.fullMatch, '');

  // If importing a named component (e.g., `import Icon from '...'`), remove JSX usage
  const defaultImportMatch = imp.specifiers.match(/^(\w+)$/);
  if (defaultImportMatch) {
    const componentName = defaultImportMatch[1];

    // Remove self-closing tags: <ComponentName ... />
    fixed = fixed.replace(
      new RegExp(`<${componentName}\\s+[^>]*\\/?>`, 'g'),
      '<!-- removed: ' + componentName + ' -->'
    );

    // Remove opening + closing tags: <ComponentName ...>...</ComponentName>
    fixed = fixed.replace(
      new RegExp(`<${componentName}\\s[^>]*>[\\s\\S]*?<\\/${componentName}>`, 'g'),
      '<!-- removed: ' + componentName + ' -->'
    );
  }

  // Handle named imports: import { Icon, Something } from '...'
  const namedImportMatch = imp.specifiers.match(/^\{([^}]+)\}$/);
  if (namedImportMatch) {
    const names = namedImportMatch[1].split(',').map(n => n.trim().split(/\s+as\s+/).pop()!.trim());
    for (const name of names) {
      fixed = fixed.replace(
        new RegExp(`<${name}\\s+[^>]*\\/?>`, 'g'),
        '<!-- removed: ' + name + ' -->'
      );
      fixed = fixed.replace(
        new RegExp(`<${name}\\s[^>]*>[\\s\\S]*?<\\/${name}>`, 'g'),
        '<!-- removed: ' + name + ' -->'
      );
    }
  }

  return fixed;
}

/**
 * Validate local imports — check that referenced files exist in the project
 */
function validateLocalImports(
  filePath: string,
  imports: ImportInfo[],
  allFiles: Record<string, string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fileDir = filePath.split('/').slice(0, -1).join('/');

  for (const imp of imports) {
    if (!isLocalImport(imp.source)) continue;

    // Resolve the import path
    let resolvedPath = imp.source;
    if (resolvedPath.startsWith('.')) {
      // Relative import — resolve against file directory
      const parts = fileDir.split('/');
      const importParts = resolvedPath.split('/');

      for (const part of importParts) {
        if (part === '..') parts.pop();
        else if (part !== '.') parts.push(part);
      }
      resolvedPath = parts.join('/');
    }

    // Normalize: remove leading /
    resolvedPath = resolvedPath.replace(/^\//, '');

    // Check with various extensions
    const extensions = ['', '.astro', '.ts', '.tsx', '.js', '.jsx', '.css'];
    const found = extensions.some(ext => {
      const fullPath = resolvedPath + ext;
      return allFiles[fullPath] || allFiles['src/' + fullPath] || allFiles[fullPath.replace(/^src\//, '')];
    });

    if (!found) {
      issues.push({
        file: filePath,
        line: imp.line,
        message: `Local import "${imp.source}" resolves to "${resolvedPath}" which doesn't exist in the project`,
        severity: 'warning', // Warning because it might be resolved at build time
      });
    }
  }

  return issues;
}

/**
 * Check for components used in template but never imported
 */
function checkUndefinedComponents(
  filePath: string,
  content: string,
  imports: ImportInfo[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Only check .astro files
  if (!filePath.endsWith('.astro')) return issues;

  // Get the HTML template part (after second ---)
  const parts = content.split('---');
  if (parts.length < 3) return issues; // No frontmatter or not an .astro file
  const template = parts.slice(2).join('---');

  // Find all PascalCase component usages in template
  const componentUsages = new Set<string>();
  const componentRegex = /<([A-Z][a-zA-Z0-9]+)[\s>/]/g;
  let match;
  while ((match = componentRegex.exec(template)) !== null) {
    // Skip HTML elements that happen to be PascalCase (Fragment, etc.)
    const name = match[1];
    if (!['Fragment', 'Script', 'Style', 'Markdown'].includes(name)) {
      componentUsages.add(name);
    }
  }

  // Get all imported names
  const importedNames = new Set<string>();
  for (const imp of imports) {
    // Default import
    const defaultMatch = imp.specifiers.match(/^(\w+)$/);
    if (defaultMatch) importedNames.add(defaultMatch[1]);

    // Named imports
    const namedMatch = imp.specifiers.match(/\{([^}]+)\}/);
    if (namedMatch) {
      namedMatch[1].split(',').forEach(n => {
        const alias = n.trim().split(/\s+as\s+/);
        importedNames.add(alias[alias.length - 1].trim());
      });
    }

    // Combined: import Default, { Named } from '...'
    const combinedMatch = imp.specifiers.match(/^(\w+)\s*,/);
    if (combinedMatch) importedNames.add(combinedMatch[1]);
  }

  // Check for undefined components
  for (const component of componentUsages) {
    if (!importedNames.has(component)) {
      issues.push({
        file: filePath,
        message: `Component <${component}> is used in template but never imported`,
        severity: 'warning',
      });
    }
  }

  return issues;
}

/**
 * Check for basic Astro frontmatter syntax issues
 */
function checkFrontmatterSyntax(
  filePath: string,
  content: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!filePath.endsWith('.astro')) return issues;

  // Check frontmatter delimiters
  const fmMatches = content.match(/^---$/gm);
  if (fmMatches && fmMatches.length % 2 !== 0) {
    issues.push({
      file: filePath,
      message: 'Unmatched frontmatter delimiters (odd number of --- lines)',
      severity: 'error',
    });
  }

  // Check for imports without semicolons (common LLM error)
  const lines = content.split('\n');
  let inFrontmatter = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '---') {
      inFrontmatter = !inFrontmatter;
      continue;
    }
    if (inFrontmatter && line.startsWith('import ') && !line.endsWith(';') && !line.endsWith('{')) {
      issues.push({
        file: filePath,
        line: i + 1,
        message: `Import statement missing semicolon: "${line}"`,
        severity: 'error',
      });
    }
  }

  return issues;
}

/**
 * Fix missing semicolons in import statements
 */
function fixMissingSemicolons(content: string): string {
  const lines = content.split('\n');
  let inFrontmatter = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '---') {
      inFrontmatter = !inFrontmatter;
      continue;
    }
    if (inFrontmatter && trimmed.startsWith('import ') && trimmed.match(/from\s+['"][^'"]+['"]$/) && !trimmed.endsWith(';')) {
      lines[i] = lines[i] + ';';
    }
  }

  return lines.join('\n');
}

/**
 * Parse package.json from files to get actual dependencies
 */
function parseInstalledPackages(files: Record<string, string>): Set<string> {
  const packages = new Set(INSTALLED_PACKAGES);

  const packageJson = files['package.json'];
  if (packageJson) {
    try {
      const parsed = JSON.parse(packageJson);
      if (parsed.dependencies) {
        for (const dep of Object.keys(parsed.dependencies)) {
          packages.add(dep);
        }
      }
      if (parsed.devDependencies) {
        for (const dep of Object.keys(parsed.devDependencies)) {
          packages.add(dep);
        }
      }
    } catch {
      // Invalid package.json, use defaults
    }
  }

  return packages;
}

/**
 * Main validation function — run on all files before deployment
 *
 * Returns fixed files and a summary of what was fixed.
 * Auto-fixes what it can; reports what it can't.
 */
export function validateAndFixFiles(
  files: Record<string, string>,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const fixedFiles = { ...files };
  let fixCount = 0;
  const fixSummary: string[] = [];
  const installedPackages = parseInstalledPackages(files);

  for (const [filePath, content] of Object.entries(files)) {
    // Only validate .astro, .ts, .tsx, .js, .jsx files
    if (!/\.(astro|ts|tsx|js|jsx)$/.test(filePath)) continue;

    let currentContent = content;
    let fileModified = false;

    // 1. Extract and validate imports
    const imports = extractImports(currentContent);

    for (const imp of imports) {
      if (isLocalImport(imp.source)) continue; // Skip local imports for package validation

      // Check if it's a known bad package
      const badReason = getKnownBadReason(imp.source);
      if (badReason) {
        console.log(`[ASTValidation] Removing bad import "${imp.source}" from ${filePath}: ${badReason}`);
        currentContent = removeImportAndUsages(currentContent, imp);
        fileModified = true;
        fixCount++;
        fixSummary.push(`Removed "${imp.source}" from ${filePath.split('/').pop()} (${badReason})`);
        continue;
      }

      // Check if package is installed
      if (!isValidPackage(imp.source) && !installedPackages.has(imp.source)) {
        // Check subpath
        const basePkg = imp.source.startsWith('@')
          ? imp.source.split('/').slice(0, 2).join('/')
          : imp.source.split('/')[0];

        if (!installedPackages.has(basePkg)) {
          console.log(`[ASTValidation] Removing unknown package import "${imp.source}" from ${filePath}`);
          currentContent = removeImportAndUsages(currentContent, imp);
          fileModified = true;
          fixCount++;
          fixSummary.push(`Removed unknown import "${imp.source}" from ${filePath.split('/').pop()}`);
        }
      }
    }

    // 2. Fix missing semicolons in frontmatter imports
    if (filePath.endsWith('.astro')) {
      const beforeSemifix = currentContent;
      currentContent = fixMissingSemicolons(currentContent);
      if (currentContent !== beforeSemifix) {
        fileModified = true;
        fixCount++;
        fixSummary.push(`Fixed missing semicolons in ${filePath.split('/').pop()}`);
      }
    }

    // 3. Check frontmatter syntax
    const fmIssues = checkFrontmatterSyntax(filePath, currentContent);
    issues.push(...fmIssues);

    // 4. Check for undefined components (warning only, don't auto-fix)
    const reExtractedImports = extractImports(currentContent);
    const componentIssues = checkUndefinedComponents(filePath, currentContent, reExtractedImports);
    issues.push(...componentIssues);

    // 5. Validate local imports
    const localImportIssues = validateLocalImports(filePath, reExtractedImports, files);
    issues.push(...localImportIssues);

    if (fileModified) {
      fixedFiles[filePath] = currentContent;
    }
  }

  return { issues, fixedFiles, fixCount, fixSummary };
}

