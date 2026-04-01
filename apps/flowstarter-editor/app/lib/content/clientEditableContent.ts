export interface ClientEditableContentState {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
}

export interface ClientEditableFileSet {
  heroFilePath: string | null;
  siteFilePath: string | null;
}

const EMPTY_STATE: ClientEditableContentState = {
  siteName: '',
  siteTagline: '',
  siteDescription: '',
  heroHeadline: '',
  heroSubheadline: '',
  contactEmail: '',
  contactPhone: '',
  contactLocation: '',
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readQuotedValue(content: string, key: string): string {
  const match = content.match(new RegExp(`^${escapeRegExp(key)}:\\s*"([\\s\\S]*?)"$`, 'm'));
  return match?.[1].replace(/\\n/g, '\n') ?? '';
}

function readNestedQuotedValue(content: string, section: string, key: string): string {
  const sectionMatch = content.match(new RegExp(`^${escapeRegExp(section)}:\\n((?:  .*(?:\\n|$))+)`, 'm'));

  if (!sectionMatch) {
    return '';
  }

  const keyMatch = sectionMatch[1].match(new RegExp(`^\\s{2}${escapeRegExp(key)}:\\s*"([\\s\\S]*?)"$`, 'm'));

  return keyMatch?.[1].replace(/\\n/g, '\n') ?? '';
}

function toQuotedValue(value: string): string {
  return value.replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

function insertBeforeFrontmatterEnd(content: string, block: string): string {
  const endMarker = '\n---';
  const endIndex = content.lastIndexOf(endMarker);

  if (endIndex === -1) {
    return `${content.trimEnd()}\n${block}\n`;
  }

  const prefix = content.slice(0, endIndex).replace(/\s*$/, '');
  const suffix = content.slice(endIndex);

  return `${prefix}\n${block}${suffix}`;
}

export function upsertFrontmatterValue(content: string, key: string, value: string): string {
  const line = `${key}: "${toQuotedValue(value)}"`;
  const linePattern = new RegExp(`^${escapeRegExp(key)}:\\s*"([\\s\\S]*?)"$`, 'm');

  if (linePattern.test(content)) {
    return content.replace(linePattern, line);
  }

  return insertBeforeFrontmatterEnd(content, line);
}

export function upsertNestedFrontmatterValue(content: string, section: string, key: string, value: string): string {
  const sectionPattern = new RegExp(`^${escapeRegExp(section)}:\\n((?:  .*(?:\\n|$))+)`, 'm');
  const nestedLine = `  ${key}: "${toQuotedValue(value)}"`;

  if (!sectionPattern.test(content)) {
    return insertBeforeFrontmatterEnd(content, `${section}:\n${nestedLine}`);
  }

  return content.replace(sectionPattern, (fullMatch, block: string) => {
    const nestedPattern = new RegExp(`^\\s{2}${escapeRegExp(key)}:\\s*"([\\s\\S]*?)"$`, 'm');

    if (nestedPattern.test(block)) {
      return fullMatch.replace(nestedPattern, nestedLine);
    }

    return `${section}:\n${block}${nestedLine}\n`;
  });
}

export function getClientEditableFiles(files: Array<{ path: string; content: string }>): ClientEditableFileSet {
  const heroFile = files.find((file) => file.path.endsWith('content/hero.md'));
  const siteFile = files.find((file) => file.path.endsWith('content/site.md'));

  return {
    heroFilePath: heroFile?.path ?? null,
    siteFilePath: siteFile?.path ?? null,
  };
}

export function parseClientEditableContent(
  files: Array<{ path: string; content: string }>,
): ClientEditableContentState {
  const { heroFilePath, siteFilePath } = getClientEditableFiles(files);
  const heroContent = files.find((file) => file.path === heroFilePath)?.content ?? '';
  const siteContent = files.find((file) => file.path === siteFilePath)?.content ?? '';
  const usesContactBlock = /(?:^|\n)contact:\n/m.test(siteContent);

  return {
    ...EMPTY_STATE,
    siteName: readQuotedValue(siteContent, 'name'),
    siteTagline: readQuotedValue(siteContent, 'tagline'),
    siteDescription: readQuotedValue(siteContent, 'description'),
    heroHeadline: readQuotedValue(heroContent, 'headline'),
    heroSubheadline: readQuotedValue(heroContent, 'subheadline'),
    contactEmail: usesContactBlock
      ? readNestedQuotedValue(siteContent, 'contact', 'email')
      : readQuotedValue(siteContent, 'email'),
    contactPhone: usesContactBlock
      ? readNestedQuotedValue(siteContent, 'contact', 'phone')
      : readQuotedValue(siteContent, 'phone'),
    contactLocation: usesContactBlock
      ? readNestedQuotedValue(siteContent, 'contact', 'address')
      : readQuotedValue(siteContent, 'location'),
  };
}
