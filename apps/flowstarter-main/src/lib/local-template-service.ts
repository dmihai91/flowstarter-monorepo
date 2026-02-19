'use server';

import fs from 'fs/promises';
import path from 'path';

export interface TemplateFile {
  path: string;
  content: string;
  type: 'file' | 'dir';
}

/**
 * Get all available template IDs by scanning the local /templates directory
 */
export async function getAvailableTemplates(): Promise<string[]> {
  try {
    const templatesDir = path.join(process.cwd(), 'templates');
    const entries = await fs.readdir(templatesDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [
      'personal-brand',
      'course-launch',
      'local-business',
      'product-launch',
      'mini-ecommerce',
    ];
  }
}

export type RepoTemplate = {
  id: string;
  name: string;
  categoryId: string;
  thumbnailUrl?: string;
};

/**
 * Scan local repo templates with basic metadata for display
 */
export async function getRepoTemplates(): Promise<RepoTemplate[]> {
  const ids = await getAvailableTemplates();

  const mapCategory = (id: string): string => {
    if (id.startsWith('personal-brand')) return 'personal-brand';
    if (id.startsWith('local-business')) return 'local-business';
    if (id.startsWith('saas-') || id.startsWith('saas-product'))
      return 'saas-product';
    if (id.startsWith('services-')) return 'services-agencies';
    if (id.startsWith('education-') || id.startsWith('events-'))
      return 'education-events';
    if (id.startsWith('ecom-')) return 'ecommerce-light';
    return 'personal-brand';
  };

  const toName = (id: string): string => {
    return id
      .split('-')
      .map((w) =>
        w.match(/^\d+$/) ? w : w.charAt(0).toUpperCase() + w.slice(1)
      )
      .join(' ');
  };

  return ids.map((id) => ({
    id,
    name: toName(id),
    categoryId: mapCategory(id),
    // Note: Theme-aware components will append -dark.png as needed
    thumbnailUrl: `/assets/template-thumbnails/${id}.png`,
  }));
}

/**
 * Check if a template exists (always return true for known templates)
 */
export async function templateExists(templateId: string): Promise<boolean> {
  const availableTemplates = await getAvailableTemplates();
  return availableTemplates.includes(templateId);
}

/**
 * Download template files for a specific template ID
 * Now uses only fallback templates to avoid file system access
 */
export async function downloadTemplate(
  templateId: string
): Promise<TemplateFile[]> {
  return createFallbackTemplate(templateId);
}

/**
 * Get template name from ID
 */
function getTemplateName(templateId: string): string {
  const names: Record<string, string> = {
    'personal-brand': 'Personal Brand',
    'course-launch': 'Course Launch',
    'local-business': 'Local Business',
    'product-launch': 'Product Launch',
    'mini-ecommerce': 'Mini Ecommerce',
  };
  return (
    names[templateId] ||
    templateId
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}

/**
 * Create a template based on template ID
 */
function createFallbackTemplate(templateId: string): TemplateFile[] {
  const templateName = getTemplateName(templateId);

  // Base template structure
  const baseFiles: TemplateFile[] = [
    {
      path: 'package.json',
      content: JSON.stringify(
        {
          name: '{{PROJECT_NAME_SLUG}}',
          version: '1.0.0',
          private: true,
          description: '{{PROJECT_DESCRIPTION}}',
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint',
          },
          dependencies: {
            next: '^14.0.0',
            react: '^18.0.0',
            'react-dom': '^18.0.0',
            typescript: '^5.0.0',
            '@types/node': '^20.0.0',
            '@types/react': '^18.0.0',
            '@types/react-dom': '^18.0.0',
            tailwindcss: '^3.0.0',
            autoprefixer: '^10.0.0',
            postcss: '^8.0.0',
            'lucide-react': '^0.263.1',
          },
        },
        null,
        2
      ),
      type: 'file',
    },
    {
      path: 'README.md',
      content: `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Getting Started

This is a ${templateName} template created with Flowstarter.

### Target Audience
{{TARGET_USERS}}

### Business Goals
{{BUSINESS_GOALS}}

### Development

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This template is ready to be deployed on Vercel or any other Next.js hosting platform.
`,
      type: 'file',
    },
    {
      path: 'app/layout.tsx',
      content: `import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`,
      type: 'file',
    },
    {
      path: 'app/globals.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      type: 'file',
    },
    {
      path: 'tailwind.config.js',
      content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      type: 'file',
    },
  ];

  // Template-specific content
  const pageContent = getTemplatePageContent(templateId);
  baseFiles.push({
    path: 'app/page.tsx',
    content: pageContent,
    type: 'file',
  });

  return baseFiles;
}

/**
 * Get template-specific page content
 */
function getTemplatePageContent(templateId: string): string {
  switch (templateId) {
    case 'personal-brand':
      return `export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-slate-900">
              {{PROJECT_NAME}}
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#about" className="text-slate-600 hover:text-slate-900 transition-colors">About</a>
              <a href="#services" className="text-slate-600 hover:text-slate-900 transition-colors">Services</a>
              <a href="#contact" className="text-slate-600 hover:text-slate-900 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Welcome to {{PROJECT_NAME}}
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-5xl mx-auto">
            {{PROJECT_DESCRIPTION}}
          </p>
          <p className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto">
            Helping {{TARGET_USERS}} achieve their goals and succeed in today's competitive market.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-8 rounded-xl transition duration-300">
              Get Started
            </button>
            <button className="bg-white hover:bg-slate-50 text-slate-900 font-semibold py-4 px-8 rounded-xl border border-slate-300 transition duration-300">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}`;

    case 'course-launch':
      return `export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {{PROJECT_NAME}}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {{PROJECT_DESCRIPTION}}
          </p>
          <p className="text-lg text-gray-600 mb-12">
            Perfect for {{TARGET_USERS}} focused on {{BUSINESS_GOALS}}.
          </p>
          <div className="space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300">
              Enroll Now
            </button>
            <button className="bg-white hover:bg-gray-50 text-blue-600 font-bold py-3 px-6 rounded-xl border border-blue-600 transition duration-300">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}`;

    default:
      return `export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {{PROJECT_NAME}}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {{PROJECT_DESCRIPTION}}
          </p>
          <p className="text-lg text-gray-600 mb-12">
            Serving {{TARGET_USERS}} with focus on {{BUSINESS_GOALS}}.
          </p>
          <div className="space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300">
              Get Started
            </button>
            <button className="bg-white hover:bg-gray-50 text-blue-600 font-bold py-3 px-6 rounded-xl border border-blue-600 transition duration-300">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }
}

/**
 * Process template files with replacements
 */
export async function processTemplateFiles(
  files: TemplateFile[],
  replacements: Record<string, string>
): Promise<TemplateFile[]> {
  return files.map((file) => {
    if (file.type === 'file') {
      let content = file.content;
      Object.entries(replacements).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      return { ...file, content };
    }
    return file;
  });
}

/**
 * Save template files to Supabase
 * TODO: Implement proper file storage once generated_files table is created
 */
export async function saveTemplateFiles(
  projectId: string,
  files: TemplateFile[]
): Promise<void> {
  // TODO: Remove this when generated_files table is available
  console.log(`Saving ${files.length} files for project ${projectId}`);

  // Temporary: just log files instead of saving to database
  files.forEach((file) => {
    if (file.type === 'file') {
      console.log(`File: ${file.path} (${getFileType(file.path)})`);
    }
  });

  /* TODO: Uncomment when generated_files table is available
  const supabase = createSupabaseServerClient();

  for (const file of files) {
    if (file.type === 'file') {
      const { error } = await supabase.from('generated_files').insert({
        project_id: projectId,
        file_path: file.path,
        content: file.content,
        file_type: getFileType(file.path),
      });

      if (error) {
        console.error(`Error saving file ${file.path}:`, error);
        throw new Error(`Failed to save file: ${error.message}`);
      }
    }
  }
  */
}

/**
 * Get file type based on extension
 */
function getFileType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.tsx':
    case '.ts':
      return 'typescript';
    case '.jsx':
    case '.js':
      return 'javascript';
    case '.css':
      return 'css';
    case '.json':
      return 'json';
    case '.md':
      return 'markdown';
    default:
      return 'text';
  }
}
