import * as path from 'path';
import * as fs from 'fs/promises';
import { Template } from '../types/templates.js';
import { parseTemplate } from './template-parser.js';

export class TemplateFetcher {
  private templates: Map<string, Template> = new Map();
  private templatesDir: string;

  constructor(templatesDir: string) {
    this.templatesDir = templatesDir;
  }

  async initialize(): Promise<void> {
    this.templates.clear();
    console.log(`Scanning templates directory: ${this.templatesDir}`);
    
    try {
      const entries = await fs.readdir(this.templatesDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Skip non-template directories
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }
          
          const templatePath = path.join(this.templatesDir, entry.name);
          
          // Check if it looks like a template (has package.json, config.json, or template.json)
          const hasPackageJson = await fs.access(path.join(templatePath, 'package.json'))
            .then(() => true)
            .catch(() => false);
          const hasConfigJson = await fs.access(path.join(templatePath, 'config.json'))
            .then(() => true)
            .catch(() => false);
          const hasTemplateJson = await fs.access(path.join(templatePath, 'template.json'))
            .then(() => true)
            .catch(() => false);
          
          if (!hasPackageJson && !hasConfigJson && !hasTemplateJson) {
            continue;
          }
          
          console.log(`Loading template: ${entry.name}`);
          
          try {
            const template = await parseTemplate(templatePath, entry.name);
            if (template.config.catalogEnabled === false) {
              console.log(`Skipping catalog-disabled template: ${entry.name}`);
              continue;
            }
            this.templates.set(entry.name, template);
            console.log(`✓ Loaded ${entry.name} (${template.metadata.stats.fileCount} files, ${template.metadata.stats.totalLOC} LOC)`);
          } catch (error) {
            console.error(`Failed to load template ${entry.name}:`, error);
          }
        }
      }
      
      console.log(`\nLoaded ${this.templates.size} templates successfully`);
    } catch (error) {
      console.error('Failed to scan templates directory:', error);
      throw error;
    }
  }

  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  getTemplate(slug: string): Template | undefined {
    return this.templates.get(slug);
  }

  searchTemplates(query: string): Template[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return this.getAllTemplates();
    const tokens = Array.from(
      new Set(lowerQuery.split(/[^a-z0-9]+/).filter(token => token.length >= 2))
    );

    return this.getAllTemplates().map(template => {
      const meta = template.metadata;
      const haystack = [
        meta.displayName,
        meta.description,
        meta.category,
        meta.targetAudience,
        ...(Array.isArray(meta.useCase) ? meta.useCase : []),
        ...(Array.isArray(meta.features) ? meta.features : []),
        ...(Array.isArray(template.config.bestFor) ? template.config.bestFor : []),
      ].join(' ').toLowerCase();
      const tokenScore = tokens.reduce(
        (score, token) => score + (haystack.includes(token) ? 1 : 0),
        0
      );
      const phraseBonus = haystack.includes(lowerQuery) ? tokens.length + 1 : 0;
      return { template, score: tokenScore + phraseBonus };
    })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score || a.template.metadata.slug.localeCompare(b.template.metadata.slug))
      .map(result => result.template);
  }

  getTemplatesByCategory(category: string): Template[] {
    return this.getAllTemplates().filter(
      template => template.metadata.category === category
    );
  }
}
