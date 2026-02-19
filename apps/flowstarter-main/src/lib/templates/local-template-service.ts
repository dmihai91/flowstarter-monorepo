import fs from 'fs/promises';
import path from 'path';

export interface ProjectData {
  name: string;
  description?: string;
  targetUsers?: string;
  businessGoals?: string;
  slug?: string;
}

export interface TemplateFile {
  path: string;
  content: string;
}

export class LocalTemplateService {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(process.cwd(), 'templates');
  }

  /**
   * Read all files from a template directory
   */
  async readTemplate(templateId: string): Promise<TemplateFile[]> {
    const templatePath = path.join(this.templatesDir, templateId);

    try {
      await fs.access(templatePath);
    } catch {
      throw new Error(`Template not found: ${templateId}`);
    }

    const files: TemplateFile[] = [];
    await this.readDirectory(templatePath, templatePath, files);

    return files;
  }

  /**
   * Recursively read all files in a directory
   */
  private async readDirectory(
    dirPath: string,
    basePath: string,
    files: TemplateFile[]
  ): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      // Skip node_modules, .next, and other build directories
      if (
        entry.name === 'node_modules' ||
        entry.name === '.next' ||
        entry.name === 'dist' ||
        entry.name === '.git' ||
        entry.name.startsWith('.')
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        await this.readDirectory(fullPath, basePath, files);
      } else {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          files.push({
            path: relativePath,
            content,
          });
        } catch (error) {
          console.warn(`Failed to read file ${relativePath}:`, error);
        }
      }
    }
  }

  /**
   * Read and process the main page.tsx file with variable replacement
   */
  async getProcessedTemplate(
    templateId: string,
    projectData: ProjectData
  ): Promise<string> {
    const templatePath = path.join(
      this.templatesDir,
      templateId,
      'app',
      'page.tsx'
    );

    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      return this.replaceVariables(content, projectData);
    } catch (error) {
      throw new Error(
        `Failed to read template ${templateId}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Parse content.md file and extract key-value pairs
   */
  private parseContentMd(content: string): Record<string, string> {
    const replacements: Record<string, string> = {};
    const lines = content.split('\n');
    let currentSection = '';

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      // Section headings like "## Hero Section"
      const h2 = line.match(/^##\s+(.+)$/);
      if (h2) {
        const sectionRaw = h2[1].trim().toUpperCase();
        const section = sectionRaw
          .replace(/[^A-Z0-9]+/g, '_')
          .replace(/_SECTION$/g, '')
          .replace(/_CONTENT$/g, '')
          .replace(/__+/g, '_')
          .replace(/^_|_$/g, '');
        currentSection = section;
        continue;
      }

      // Bullet key-value lines: "- key: value"
      const kv = line.match(/^\s*-\s+([A-Za-z0-9_]+):\s*(.+)$/);
      if (kv) {
        const [, keyRaw, val] = kv;
        const value = val.trim();
        // Normalize camelCase to SNAKE_CASE
        const key = keyRaw.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

        // Namespaced key first if section is known
        if (currentSection) {
          const namespaced = `${currentSection}_${key}`;
          replacements[namespaced] = value;
        }
        // Also expose non-namespaced key (last one wins)
        replacements[key] = value;
      }
    }

    return replacements;
  }

  /**
   * Replace template variables with actual project data
   */
  replaceVariables(content: string, projectData: ProjectData): string {
    let processed = content;

    const replacements: Record<string, string> = {
      PROJECT_NAME: projectData.name || 'Your Business',
      PROJECT_DESCRIPTION:
        projectData.description || 'Your business description',
      TARGET_USERS: projectData.targetUsers || 'your target customers',
      BUSINESS_GOALS: projectData.businessGoals || 'your business goals',
      PROJECT_NAME_SLUG:
        projectData.slug ||
        projectData.name?.toLowerCase().replace(/\s+/g, '-') ||
        'your-business',
      YEAR: new Date().getFullYear().toString(),
    };

    // Replace all {{VARIABLE}} placeholders
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processed = processed.replace(regex, value);
    }

    return processed;
  }

  /**
   * Read and parse content.md from template
   */
  async getTemplateContent(
    templateId: string
  ): Promise<Record<string, string>> {
    const contentPath = path.join(this.templatesDir, templateId, 'content.md');

    try {
      const content = await fs.readFile(contentPath, 'utf-8');
      return this.parseContentMd(content);
    } catch (error) {
      // If content.md doesn't exist, return empty object
      return {};
    }
  }

  /**
   * Get template with all files processed
   */
  async getFullTemplate(
    templateId: string,
    projectData: ProjectData
  ): Promise<TemplateFile[]> {
    const files = await this.readTemplate(templateId);
    const contentReplacements = await this.getTemplateContent(templateId);

    return files.map((file) => {
      let processed = this.replaceVariables(file.content, projectData);

      // Also apply content.md replacements
      for (const [key, value] of Object.entries(contentReplacements)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        processed = processed.replace(regex, value);
      }

      return {
        path: file.path,
        content: processed,
      };
    });
  }

  /**
   * Check if template exists
   */
  async templateExists(templateId: string): Promise<boolean> {
    const templatePath = path.join(this.templatesDir, templateId);
    try {
      await fs.access(templatePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const localTemplateService = new LocalTemplateService();
