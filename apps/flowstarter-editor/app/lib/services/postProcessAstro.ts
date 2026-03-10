import type { GeneratedFile } from './claude-agent/types';

type ContentImport = {
  alias: string;
  slug: string;
};

const CONTENT_IMPORT_RE =
  /^import\s*\{\s*frontmatter(?:\s+as\s+(\w+))?\s*\}\s*from\s*['"][^'"]*\/content\/([\w-]+)\.md['"]\s*;?\s*$/gm;

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;

export function fixContentImports(files: GeneratedFile[]): GeneratedFile[] {
  return files.map((file) => processFile(file));
}

function processFile(file: GeneratedFile): GeneratedFile {
  if (!file.path.endsWith('.astro')) return file;
  const imports = getContentImports(file.content);
  if (!imports.length) return file;
  const content = rewriteAstroContent(file.content, imports);
  if (content === file.content) return file;
  return { ...file, content };
}

function getContentImports(content: string): ContentImport[] {
  return Array.from(content.matchAll(CONTENT_IMPORT_RE), ([, alias, slug]) => ({
    alias: alias ?? 'frontmatter',
    slug,
  }));
}

function rewriteAstroContent(content: string, imports: ContentImport[]): string {
  const withoutImports = content.replace(CONTENT_IMPORT_RE, '');
  const frontmatter = withoutImports.match(FRONTMATTER_RE);
  if (!frontmatter) return replacePropertyAccess(withoutImports, imports);
  const script = rewriteFrontmatter(frontmatter[1], imports);
  const updated = withoutImports.replace(FRONTMATTER_RE, `---\n${script}\n---`);
  return replacePropertyAccess(updated, imports);
}

function rewriteFrontmatter(script: string, imports: ContentImport[]): string {
  return imports.reduce((nextScript, item) => replaceDestructuring(nextScript, item), script);
}

function replaceDestructuring(script: string, item: ContentImport): string {
  const pattern = new RegExp(
    `const\\s*\\{([\\s\\S]*?)\\}\\s*=\\s*${escapeRegExp(item.alias)}\\s*;?`,
    'g',
  );
  return script.replace(pattern, (_, rawFields: string) => createConstBlock(rawFields, item.slug));
}

function createConstBlock(rawFields: string, slug: string): string {
  const fields = rawFields
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean)
    .map((field) => createConstLine(field, slug))
    .filter(Boolean);
  return fields.join('\n');
}

function createConstLine(field: string, slug: string): string {
  const [source, target] = field.split(':').map((part) => part.trim());
  if (!source) return '';
  const name = target ?? source;
  return `const ${name} = ${buildLiteral(source, slug)};`;
}

function replacePropertyAccess(content: string, imports: ContentImport[]): string {
  return imports.reduce((nextContent, item) => replaceAliasProperties(nextContent, item), content);
}

function replaceAliasProperties(content: string, item: ContentImport): string {
  const pattern = new RegExp(`${escapeRegExp(item.alias)}\\.(\\w+)`, 'g');
  return content.replace(pattern, (_, prop: string) => buildLiteral(prop, item.slug));
}

function buildLiteral(prop: string, slug: string): string {
  const key = prop.toLowerCase();
  if (isCollectionKey(key)) return '[]';
  if (key.startsWith('is') || key.startsWith('has')) return 'false';
  if (key.includes('count') || key.includes('total') || key.includes('number')) return '0';
  if (key.includes('href') || key.includes('url') || key.includes('link')) return '"#"';
  if (key.includes('image') || key === 'src' || key.endsWith('icon')) return `"/images/${slug}.jpg"`;
  if (key.includes('cta') || key.includes('button') || key.includes('label')) return '"Learn more"';
  if (key === 'title' || key === 'heading' || key === 'name') return JSON.stringify(formatSlug(slug));
  if (key.includes('description') || key.includes('summary') || key.includes('body') || key.includes('text')) {
    return JSON.stringify(`${formatSlug(slug)} ${formatProp(prop)}`.trim());
  }
  return JSON.stringify(formatProp(prop));
}

function isCollectionKey(key: string): boolean {
  return /(items|list|services|features|steps|faqs|questions|testimonials|stats|members|cards)$/.test(key);
}

function formatSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function formatProp(prop: string): string {
  const spaced = prop
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim();
  return spaced ? spaced[0].toUpperCase() + spaced.slice(1) : 'Placeholder';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
