import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Integration test: ensures no page imports old header components
 * and AppHeader is the single source of truth.
 */

function getAllTsxFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory() && !entry.includes('node_modules') && !entry.includes('.next')) {
          files.push(...getAllTsxFiles(full));
        } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
          files.push(full);
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return files;
}

const SRC = join(__dirname, '..', '..', '..');
const allFiles = getAllTsxFiles(SRC);

describe('Header Architecture (no duplicates)', () => {
  it('no file imports ClientHeader (except its own definition)', () => {
    const violations: string[] = [];
    for (const f of allFiles) {
      if (f.includes('ClientHeader.tsx')) continue;
      if (f.includes('__tests__')) continue;
      const content = readFileSync(f, 'utf-8');
      if (content.includes("import") && content.includes("ClientHeader")) {
        violations.push(f.replace(SRC, 'src'));
      }
    }
    expect(violations).toEqual([]);
  });

  it('no file imports TeamHeader (except its own definition and full-width pages)', () => {
    const violations: string[] = [];
    for (const f of allFiles) {
      if (f.includes('TeamHeader.tsx')) continue;
      if (f.includes('__tests__')) continue;
      const content = readFileSync(f, 'utf-8');
      if (content.includes("import") && content.includes("TeamHeader")) {
        violations.push(f.replace(SRC, 'src'));
      }
    }
    expect(violations).toEqual([]);
  });

  it('no file imports ClientUserMenu (except its own definition)', () => {
    const violations: string[] = [];
    for (const f of allFiles) {
      if (f.includes('ClientUserMenu.tsx')) continue;
      if (f.includes('__tests__')) continue;
      const content = readFileSync(f, 'utf-8');
      if (content.includes("import") && content.includes("ClientUserMenu")) {
        violations.push(f.replace(SRC, 'src'));
      }
    }
    expect(violations).toEqual([]);
  });

  it('no file imports TeamUserMenu (except its own definition)', () => {
    const violations: string[] = [];
    for (const f of allFiles) {
      if (f.includes('TeamUserMenu.tsx')) continue;
      if (f.includes('__tests__')) continue;
      const content = readFileSync(f, 'utf-8');
      if (content.includes("import") && content.includes("TeamUserMenu")) {
        violations.push(f.replace(SRC, 'src'));
      }
    }
    expect(violations).toEqual([]);
  });

  it('layout files render AppHeader only once per branch', () => {
    const layoutFiles = allFiles.filter(f => f.endsWith('layout.tsx'));
    for (const f of layoutFiles) {
      const content = readFileSync(f, 'utf-8');
      if (!content.includes('AppHeader')) continue;
      
      // Count AppHeader usages (not imports)
      const usages = (content.match(/<AppHeader/g) || []).length;
      const imports = (content.match(/import.*AppHeader/g) || []).length;
      const actualRenders = usages; // Each <AppHeader is a render
      
      // A layout with conditional branches may have 2 renders (one per branch)
      // but should never have more than 2
      expect(actualRenders).toBeLessThanOrEqual(2);
    }
  });
});

describe('Loading Architecture (DRY)', () => {
  it('PageLoader re-exports from AppLoader', () => {
    const content = readFileSync(join(SRC, 'components/ui/page-loader.tsx'), 'utf-8');
    expect(content).toContain('app-loading');
  });

  it('all loading.tsx files use PageLoader or AppLoader', () => {
    const loadingFiles = allFiles.filter(f => f.endsWith('loading.tsx'));
    for (const f of loadingFiles) {
      const content = readFileSync(f, 'utf-8');
      const usesUnified = content.includes('PageLoader') || content.includes('AppLoader') || content.includes('LoadingScreen');
      expect(usesUnified).toBe(true);
    }
  });
});
