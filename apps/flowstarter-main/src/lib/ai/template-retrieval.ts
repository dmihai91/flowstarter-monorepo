'use server';

import fs from 'fs/promises';
import type { Dirent } from 'fs';
import path from 'path';

type CodeChunk = {
  filePath: string;
  content: string;
  score: number;
};

type RetrievalParams = {
  templateData: {
    name?: string;
    description?: string;
    category?: string;
    tech_stack?: string[];
    features?: string[];
  };
  userQuery: string;
  maxFiles?: number;
  maxCharsPerFile?: number;
};

const ALLOWED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.json',
  '.md',
]);

let cachedIndex: Array<{ filePath: string; content: string }> | null = null;

async function listTemplateFiles(): Promise<string[]> {
  const templatesRoot = path.join(process.cwd(), 'templates');
  const results: string[] = [];

  async function walk(dir: string) {
    let entries: Dirent[] = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ALLOWED_EXTENSIONS.has(ext)) {
          results.push(full);
        }
      }
    }
  }

  await walk(templatesRoot);
  return results;
}

async function loadIndex(): Promise<
  Array<{ filePath: string; content: string }>
> {
  if (cachedIndex) return cachedIndex;
  const files = await listTemplateFiles();
  const loaded: Array<{ filePath: string; content: string }> = [];
  for (const f of files) {
    try {
      const content = await fs.readFile(f, 'utf8');
      // Skip huge files
      if (content.length > 200_000) continue;
      loaded.push({ filePath: toRepoRelative(f), content });
    } catch {
      // ignore
    }
  }
  cachedIndex = loaded;
  return loaded;
}

function toRepoRelative(absPath: string): string {
  const root = process.cwd();
  return absPath.startsWith(root)
    ? absPath.slice(root.length).replace(/\\/g, '/')
    : absPath.replace(/\\/g, '/');
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function scoreDocument(
  queryTokens: string[],
  filePath: string,
  content: string
): number {
  // Simple scoring: term frequency in file name and content with higher weight for file path
  const nameTokens = tokenize(path.basename(filePath));
  const contentTokens = tokenize(content.slice(0, 8000)); // cap for speed
  const nameSet = new Set(nameTokens);
  let score = 0;
  for (const t of queryTokens) {
    if (nameSet.has(t)) score += 4; // path hit is strong
  }
  // Count up to a small cap per token
  const counts: Record<string, number> = {};
  for (const ct of contentTokens) {
    if (!counts[ct]) counts[ct] = 0;
    counts[ct]++;
  }
  for (const t of queryTokens) {
    if (counts[t]) score += Math.min(6, counts[t]);
  }
  return score;
}

export async function retrieveTemplateExamples({
  templateData,
  userQuery,
  maxFiles = 8,
  maxCharsPerFile = 1600,
}: RetrievalParams): Promise<{
  contextText: string;
  sources: Array<{ filePath: string; score: number }>;
}> {
  const index = await loadIndex();
  if (!index.length) return { contextText: '', sources: [] };

  const queryParts: string[] = [];
  if (templateData?.name) queryParts.push(templateData.name);
  if (templateData?.description) queryParts.push(templateData.description);
  if (templateData?.category) queryParts.push(templateData.category);
  if (templateData?.tech_stack?.length)
    queryParts.push(...templateData.tech_stack);
  if (templateData?.features?.length) queryParts.push(...templateData.features);
  if (userQuery) queryParts.push(userQuery);

  const queryTokens = tokenize(queryParts.join(' '));
  if (!queryTokens.length) return { contextText: '', sources: [] };

  const scored: CodeChunk[] = index.map(({ filePath, content }) => ({
    filePath,
    content,
    score: scoreDocument(queryTokens, filePath, content),
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, maxFiles);
  if (!top.length) return { contextText: '', sources: [] };

  const contextPieces = top.map((t) => {
    const trimmed = t.content.slice(0, maxCharsPerFile);
    return [`// SOURCE: ${t.filePath}`, trimmed, ''].join('\n');
  });

  const header = [
    'Reference examples from existing templates (do not copy blindly; adapt to the new template).',
    'Each section shows a file path and a code excerpt:',
    '',
  ].join('\n');

  return {
    contextText: `${header}\n${contextPieces.join('\n')}`,
    sources: top.map((t) => ({ filePath: t.filePath, score: t.score })),
  };
}
