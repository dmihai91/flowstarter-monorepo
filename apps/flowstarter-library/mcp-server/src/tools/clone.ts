import { z } from 'zod';
import { TemplateFetcher } from '../utils/template-fetcher.js';
import { scaffoldTemplate } from './scaffold.js';

export const CloneTemplateSchema = z.object({
  slug: z.string().describe('The template slug to clone (e.g., local-business-pro)'),
  projectName: z.string().describe('Name for the new project'),
  projectDescription: z.string().optional().describe('Optional description for the project'),
  customizations: z.record(z.unknown()).optional().describe('Optional customization parameters for the template')
});

export interface CloneResult {
  success: boolean;
  projectName: string;
  templateSlug: string;
  files: Array<{
    path: string;
    content: string;
    type: 'file';
  }>;
  metadata: {
    displayName: string;
    description: string;
    category: string;
    techStack: any;
    features: string[];
  };
  error?: string;
}

/**
 * Clone a template and prepare it for the coding agent
 * This function scaffolds a template and applies any customizations
 */
export async function cloneTemplate(
  args: z.infer<typeof CloneTemplateSchema>,
  fetcher: TemplateFetcher,
  templatesDir: string
): Promise<CloneResult> {
  try {
    // First, scaffold the template to get all files
    const scaffoldResult = await scaffoldTemplate(
      { slug: args.slug },
      fetcher,
      templatesDir
    );

    if (scaffoldResult.error || !scaffoldResult.scaffold) {
      return {
        success: false,
        projectName: args.projectName,
        templateSlug: args.slug,
        files: [],
        metadata: {
          displayName: '',
          description: '',
          category: '',
          techStack: {},
          features: []
        },
        error: scaffoldResult.error || 'Failed to scaffold template'
      };
    }

    const { template, files } = scaffoldResult.scaffold;

    // Apply customizations to package.json if provided
    let processedFiles = files;
    if (args.customizations || args.projectName !== template.metadata.name) {
      processedFiles = files.map(file => {
        if (file.path === 'package.json') {
          try {
            const packageJson = JSON.parse(file.content);
            // Update project name
            packageJson.name = args.projectName.toLowerCase().replace(/\s+/g, '-');
            
            // Update description if provided
            if (args.projectDescription) {
              packageJson.description = args.projectDescription;
            }

            // Apply any custom package.json modifications
            if (args.customizations?.packageJson) {
              Object.assign(packageJson, args.customizations.packageJson);
            }

            return {
              ...file,
              content: JSON.stringify(packageJson, null, 2)
            };
          } catch (e) {
            console.error('Failed to parse/update package.json:', e);
            return file;
          }
        }
        return file;
      });
    }

    // Return the cloned template data
    return {
      success: true,
      projectName: args.projectName,
      templateSlug: args.slug,
      files: processedFiles,
      metadata: {
        displayName: template.metadata.displayName,
        description: template.metadata.description,
        category: template.metadata.category,
        techStack: template.metadata.techStack,
        features: template.metadata.features
      }
    };
  } catch (error) {
    return {
      success: false,
      projectName: args.projectName,
      templateSlug: args.slug,
      files: [],
      metadata: {
        displayName: '',
        description: '',
        category: '',
        techStack: {},
        features: []
      },
      error: `Failed to clone template: ${error}`
    };
  }
}
