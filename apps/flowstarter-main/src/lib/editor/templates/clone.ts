import * as fs from 'fs';
import * as path from 'path';
import type { Sandbox } from '@daytonaio/sdk';

const TEMPLATES_DIR = path.resolve(process.cwd(), '../../apps/flowstarter-library/templates');

export interface CloneProgress {
  stage: 'reading' | 'uploading' | 'installing' | 'starting' | 'done' | 'error';
  message: string;
  progress?: number;
}

export async function cloneTemplateToSandbox(
  sandbox: Sandbox,
  templateSlug: string,
  onProgress?: (p: CloneProgress) => void
): Promise<boolean> {
  const templateDir = path.join(TEMPLATES_DIR, templateSlug);
  if (!fs.existsSync(templateDir)) {
    onProgress?.({ stage: 'error', message: `Template "${templateSlug}" not found` });
    return false;
  }

  const workDir = (await sandbox.getWorkDir()) || '/home/daytona';

  onProgress?.({ stage: 'reading', message: 'Reading template files...' });
  const files = getAllFiles(templateDir);

  onProgress?.({ stage: 'uploading', message: `Uploading ${files.length} files...` });
  for (const file of files) {
    const relativePath = path.relative(templateDir, file);
    const content = fs.readFileSync(file, 'utf-8');
    await sandbox.files.writeFile(`/workspace/${relativePath}`, content);
  }

  onProgress?.({ stage: 'installing', message: 'Installing dependencies...' });
  await sandbox.process.executeCommand('cd /workspace && npm install', workDir);

  onProgress?.({ stage: 'starting', message: 'Starting dev server...' });
  sandbox.process.executeCommand('cd /workspace && npm run dev -- --host 0.0.0.0', workDir).catch(() => {});

  onProgress?.({ stage: 'done', message: 'Ready!' });
  return true;
}

function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  const skip = ['node_modules', '.astro', 'dist', '.git'];
  
  for (const entry of fs.readdirSync(dir)) {
    if (skip.includes(entry)) continue;
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      files.push(...getAllFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

export function getTemplateConfig(slug: string) {
  const configPath = path.join(TEMPLATES_DIR, slug, 'config.json');
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}
