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
    const lowerQuery = query.toLowerCase();
    
    return this.getAllTemplates().filter(template => {
      const meta = template.metadata;
      return (
        (meta.displayName?.toLowerCase() || '').includes(lowerQuery) ||
        (meta.description?.toLowerCase() || '').includes(lowerQuery) ||
        (meta.category?.toLowerCase() || '').includes(lowerQuery) ||
        (Array.isArray(meta.useCase) 
          ? meta.useCase.some(uc => uc.toLowerCase().includes(lowerQuery))
          : (meta.useCase as any)?.toString().toLowerCase().includes(lowerQuery) || false) ||
        (meta.targetAudience?.toLowerCase() || '').includes(lowerQuery)
      );
    });
  }

  getTemplatesByCategory(category: string): Template[] {
    return this.getAllTemplates().filter(
      template => template.metadata.category === category
    );
  }
}
