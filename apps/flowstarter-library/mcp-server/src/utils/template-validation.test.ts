import { describe, it, expect } from 'vitest';
import { parseMarkdownContent } from './parseMarkdown.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.resolve(__dirname, '../../../templates');

// Get list of template directories
function getTemplateDirectories(): string[] {
  const items = fs.readdirSync(templatesDir);
  return items.filter((item) => {
    const itemPath = path.join(templatesDir, item);
    return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
  });
}

describe('Template Content Validation', () => {
  const templates = getTemplateDirectories();

  describe.each(templates)('Template: %s', (templateName) => {
    const contentPath = path.join(
      templatesDir,
      templateName,
      'start/src/content/content.md'
    );

    it('should have a content.md file', () => {
      expect(fs.existsSync(contentPath)).toBe(true);
    });

    it('should parse content.md without errors', () => {
      const content = fs.readFileSync(contentPath, 'utf-8');
      expect(() => parseMarkdownContent(content)).not.toThrow();
    });

    it('should have required common sections', () => {
      const content = fs.readFileSync(contentPath, 'utf-8');
      const parsed = parseMarkdownContent(content);

      // Common sections that all templates should have
      expect(parsed.navigation).toBeDefined();
      expect(parsed.hero).toBeDefined();
      expect(parsed.footer).toBeDefined();
    });

    it('should have valid navigation section', () => {
      const content = fs.readFileSync(contentPath, 'utf-8');
      const parsed = parseMarkdownContent(content);
      const nav = parsed.navigation;

      expect(nav.brand).toBeDefined();
      expect(typeof nav.brand).toBe('string');
      expect(nav.links).toBeDefined();
      expect(Array.isArray(nav.links)).toBe(true);
    });

    it('should have valid hero section', () => {
      const content = fs.readFileSync(contentPath, 'utf-8');
      const parsed = parseMarkdownContent(content);
      const hero = parsed.hero;

      expect(hero.title).toBeDefined();
      expect(typeof hero.title).toBe('string');
    });

    it('should have valid footer section', () => {
      const content = fs.readFileSync(contentPath, 'utf-8');
      const parsed = parseMarkdownContent(content);
      const footer = parsed.footer;

      // Footer should have either brand or copyright
      const hasBrand = footer.brand !== undefined;
      const hasCopyright = footer.copyright !== undefined;
      expect(hasBrand || hasCopyright).toBe(true);
    });

    it('should not have sections with lowercase duplicates', () => {
      const content = fs.readFileSync(contentPath, 'utf-8');
      const parsed = parseMarkdownContent(content);
      const sectionNames = Object.keys(parsed);

      // Check for potential case collisions
      const lowercaseNames = sectionNames.map((n) => n.toLowerCase());
      const uniqueLowercase = new Set(lowercaseNames);

      expect(lowercaseNames.length).toBe(uniqueLowercase.size);
    });

    it('should have all array items be consistent types', () => {
      const content = fs.readFileSync(contentPath, 'utf-8');
      const parsed = parseMarkdownContent(content);

      function checkArrayConsistency(obj: any, path = ''): void {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;

          if (Array.isArray(value) && value.length > 0) {
            const firstType = typeof value[0];
            const isFirstObject =
              firstType === 'object' && value[0] !== null;

            for (let i = 1; i < value.length; i++) {
              const itemType = typeof value[i];
              const isObject = itemType === 'object' && value[i] !== null;

              if (isFirstObject !== isObject) {
                throw new Error(
                  `Inconsistent array at ${currentPath}: mixed objects and primitives`
                );
              }
            }
          }

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            checkArrayConsistency(value, currentPath);
          }
        }
      }

      expect(() => checkArrayConsistency(parsed)).not.toThrow();
    });

    it('should not have text with colons parsed as objects in string arrays', () => {
      const content = fs.readFileSync(contentPath, 'utf-8');
      const parsed = parseMarkdownContent(content);

      function findStringArrays(obj: any, path = ''): void {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;

          if (Array.isArray(value)) {
            // If this looks like it should be a string array (paragraphs, certifications, areas)
            if (
              key === 'paragraphs' ||
              key === 'certifications' ||
              key === 'areas'
            ) {
              for (let i = 0; i < value.length; i++) {
                if (typeof value[i] === 'object' && value[i] !== null) {
                  throw new Error(
                    `${currentPath}[${i}] should be a string but is an object: ${JSON.stringify(value[i])}`
                  );
                }
              }
            }
          }

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            findStringArrays(value, currentPath);
          }
        }
      }

      expect(() => findStringArrays(parsed)).not.toThrow();
    });
  });
});

describe('Template Config Validation', () => {
  const templates = getTemplateDirectories();

  describe.each(templates)('Template: %s', (templateName) => {
    const configPath = path.join(templatesDir, templateName, 'config.json');

    it('should have a config.json file', () => {
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should have valid JSON in config.json', () => {
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should have required config fields', () => {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Config should have id and category
      expect(config.id).toBeDefined();
      expect(typeof config.id).toBe('string');
      expect(config.category).toBeDefined();
      expect(typeof config.category).toBe('string');
    });
  });
});
