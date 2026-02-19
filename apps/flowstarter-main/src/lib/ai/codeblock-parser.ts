export type ParsedFile = {
  path: string;
  language: string;
  content: string;
};

// Parse triple-fenced code blocks with required metadata
// ```<lang> path=/path/to/file.ext start=1
// // content
// ```
export function parseCodeblocks(text: string): ParsedFile[] {
  const results: ParsedFile[] = [];
  if (!text) return results;

  // Support both LF and CRLF after the header line
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
  // Ensure it starts with a single leading slash and no Windows backslashes
  const unix = p.replace(/\\/g, '/');
  return unix.startsWith('/') ? unix : '/' + unix.replace(/^\/*/, '');
}
