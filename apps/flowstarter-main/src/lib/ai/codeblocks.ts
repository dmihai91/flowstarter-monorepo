export type ParsedFile = {
  path: string;
  language: string;
  content: string;
};

/** Parse triple-fenced code blocks with path metadata from agent-style output. */
export function parseCodeblocks(text: string): ParsedFile[] {
  const results: ParsedFile[] = [];
  if (!text) return results;

  const regex = /```(\w+)\s+path=([^\s]+)\s+start=\d+\r?\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const [, language, rawPath, body] = match;
    const path = normalizePath(rawPath);
    results.push({ path, language, content: body.trimEnd() });
  }
  return results;
}

function normalizePath(p: string): string {
  const unix = p.replace(/\\/g, '/');
  return unix.startsWith('/') ? unix : '/' + unix.replace(/^\/*/, '');
}
