import * as path from 'path';
import * as fs from 'fs/promises';
import { readFileContent, buildFileTree, countLinesOfCode } from './file-reader.js';
import { FileNode } from '../types/templates.js';
import { Template, TemplateMetadata, TemplateConfig } from '../types/templates.js';

// Legacy category and display name mappings for backward compatibility
const TEMPLATE_CATEGORIES: Record<string, string> = {
  'local-business-pro': 'local-business',
  'personal-brand-pro': 'personal-brand',
  'saas-product-pro': 'saas-product',
  'fitness-coach': 'fitness',
  'beauty-salon': 'beauty',
  'restaurant-cafe': 'food-service',
  'therapist-wellness': 'health-wellness'
};

const TEMPLATE_DISPLAY_NAMES: Record<string, string> = {
  'local-business-pro': 'Local Business Pro',
  'personal-brand-pro': 'Personal Brand Pro',
  'saas-product-pro': 'SaaS Product Pro',
  'fitness-coach': 'Fitness Coach',
  'beauty-salon': 'Beauty Salon',
  'restaurant-cafe': 'Restaurant & Cafe',
  'therapist-wellness': 'Therapist & Wellness'
};

export async function parseTemplate(
  templatePath: string,
  templateName: string
): Promise<Template> {
  // Parse defaults.md (if it exists) to populate placeholders
  const defaultsPath = path.join(templatePath, 'defaults.md');
  const defaults: Record<string, string> = {};
  try {
    const defaultsContent = await readFileContent(defaultsPath);
    defaultsContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) return;
      
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        defaults[key.trim()] = valueParts.join('=').trim();
      }
    });
  } catch (error) {
    // Defaults file is optional
  }
  
  // Parse config.json or template.json (fallback)
  const configPath = path.join(templatePath, 'config.json');
  const templateJsonPath = path.join(templatePath, 'template.json');
  let config: TemplateConfig = {};
  
  try {
    const configContent = await readFileContent(configPath);
    const parsedConfig = JSON.parse(configContent);
    config = parsedConfig;
  } catch {
    try {
      const templateContent = await readFileContent(templateJsonPath);
      const parsedConfig = JSON.parse(templateContent);
      config = parsedConfig;
    } catch {
      console.warn(`No config.json or template.json found for ${templateName}`);
    }
  }

  // Parse content.md
  const contentPath = path.join(templatePath, 'content.md');
  let contentStructure = '';
  try {
    contentStructure = await readFileContent(contentPath);
  } catch (error) {
    console.warn(`No content.md found for ${templateName}`);
  }

  // Parse package.json
  const packagePath = path.join(templatePath, 'package.json');
  let packageJson = {
    dependencies: {},
    devDependencies: {},
    scripts: {}
  };
  try {
    const packageContent = await readFileContent(packagePath);
    const pkg = JSON.parse(packageContent);
    packageJson = {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      scripts: pkg.scripts || {}
    };
  } catch (error) {
    console.warn(`No package.json found for ${templateName}`);
  }

  // Parse README.md for description and use cases
  const readmePath = path.join(templatePath, 'README.md');
  let description = '';
  let targetAudience = '';
  let features: string[] = [];
  
  try {
    const readmeContent = await readFileContent(readmePath);
    
    // Extract description (first paragraph after title)
    const descMatch = readmeContent.match(/^# .+\n\n(.+)/m);
    if (descMatch) {
      let desc = descMatch[1].trim();
      
      // Replace placeholders if we have defaults
      if (Object.keys(defaults).length > 0) {
        Object.entries(defaults).forEach(([key, value]) => {
          desc = desc.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
      }
      
      description = desc;
    }

    // Extract target audience
    const targetMatch = readmeContent.match(/### Target Audience\n\n(.+)/m);
    if (targetMatch) {
      let target = targetMatch[1].trim();
      // Replace placeholders in target audience
      if (Object.keys(defaults).length > 0) {
        Object.entries(defaults).forEach(([key, value]) => {
          target = target.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
      }
      targetAudience = target;
    }

    // Extract features (bulleted list)
    const featuresMatch = readmeContent.match(/## Features\n\n((?:- .+\n?)+)/m);
    if (featuresMatch) {
      features = featuresMatch[1]
        .split('\n')
        .filter(line => line.startsWith('- '))
        .map(line => line.replace(/^- \*\*(.+?)\*\* - (.+)/, '$1: $2').trim());
    }
  } catch (error) {
    console.warn(`No README.md found for ${templateName}`);
  }

  // Build file tree from src/ directory (Astro templates)
  const srcPath = path.join(templatePath, 'src');
  const isAstroTemplate = true;

  let fileTree: FileNode = { path: '.', name: 'src', type: 'directory', children: [] };
  let fileCount = 0;
  let codeLOC = 0;
  let cssLOC = 0;

  try {
    await fs.access(srcPath);
    fileTree = await buildFileTree(srcPath);
    fileCount = countFiles(fileTree);
    codeLOC = await countLinesOfCode(srcPath, ['.ts', '.tsx', '.js', '.jsx', '.astro']);
    cssLOC = await countLinesOfCode(srcPath, ['.css', '.scss']);
  } catch {
    console.warn(`No src/ directory found for ${templateName}, using empty file tree`);
  }
  const totalLOC = codeLOC + cssLOC;

  // Determine use cases - prefer config.json, fall back to hardcoded
  const useCase = config.tags || getUseCases(templateName);
  
  // Get display name and category from config.json if available
  const displayName = config.name || TEMPLATE_DISPLAY_NAMES[templateName] || templateName;
  const category = (config.category || TEMPLATE_CATEGORIES[templateName] || 'general') as TemplateMetadata['category'];
  
  // Determine tech stack based on template type
  const framework = isAstroTemplate ? 'Astro' : 'TanStack Start';
  const reactVersion = isAstroTemplate ? '19' : '19';

  const metadata: TemplateMetadata = {
    name: templateName,
    slug: templateName,
    displayName,
    description: config.description || description || `Premium ${templateName} template`,
    category,
    useCase,
    targetAudience: targetAudience || 'Various businesses',
    features: config.features || features,
    techStack: {
      framework,
      react: reactVersion,
      styling: 'Tailwind CSS',
      icons: 'Lucide React',
      typescript: true,
      deployment: 'Vercel'
    },
    stats: {
      fileCount,
      totalLOC,
      codeLOC,
      cssLOC
    }
  };

  return {
    metadata,
    config,
    contentStructure,
    fileTree,
    packageJson
  };
}

function countFiles(node: any): number {
  if (node.type === 'file') {
    return 1;
  }
  if (node.children) {
    return node.children.reduce((sum: number, child: any) => sum + countFiles(child), 0);
  }
  return 0;
}

function getUseCases(templateName: string): string[] {
  const useCases: Record<string, string[]> = {
    'local-business-pro': [
      'Restaurants',
      'Cafes',
      'Salons',
      'Gyms',
      'Service businesses'
    ],
    'personal-brand-pro': [
      'Consultants',
      'Freelancers',
      'Coaches',
      'Executives',
      'Professionals'
    ],
    'saas-product-pro': [
      'Software products',
      'Web applications',
      'Digital services',
      'SaaS platforms'
    ],
    'fitness-coach': [
      'Personal trainers',
      'Fitness coaches',
      'Gym owners',
      'Yoga instructors',
      'Online fitness'
    ],
    'beauty-salon': [
      'Hair salons',
      'Nail salons',
      'Barber shops',
      'Spas',
      'Beauty studios'
    ],
    'restaurant-cafe': [
      'Restaurants',
      'Cafes',
      'Bistros',
      'Bakeries',
      'Food service'
    ],
    'therapist-wellness': [
      'Therapists',
      'Counselors',
      'Psychologists',
      'Life coaches',
      'Wellness practitioners'
    ]
  };

  return useCases[templateName] || [];
}
