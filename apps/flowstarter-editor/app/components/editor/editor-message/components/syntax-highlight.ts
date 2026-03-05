/** Language detection for syntax highlighting based on file extension. */
export function getLanguageFromPath(path: string): { display: string; shiki: string } {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, { display: string; shiki: string }> = {
    ts: { display: 'TypeScript', shiki: 'typescript' },
    tsx: { display: 'React', shiki: 'tsx' },
    js: { display: 'JavaScript', shiki: 'javascript' },
    jsx: { display: 'React', shiki: 'jsx' },
    css: { display: 'CSS', shiki: 'css' },
    scss: { display: 'SCSS', shiki: 'scss' },
    html: { display: 'HTML', shiki: 'html' },
    json: { display: 'JSON', shiki: 'json' },
    md: { display: 'Markdown', shiki: 'markdown' },
    py: { display: 'Python', shiki: 'python' },
    rs: { display: 'Rust', shiki: 'rust' },
    go: { display: 'Go', shiki: 'go' },
    java: { display: 'Java', shiki: 'java' },
    kt: { display: 'Kotlin', shiki: 'kotlin' },
    swift: { display: 'Swift', shiki: 'swift' },
    yml: { display: 'YAML', shiki: 'yaml' },
    yaml: { display: 'YAML', shiki: 'yaml' },
    toml: { display: 'TOML', shiki: 'toml' },
    sql: { display: 'SQL', shiki: 'sql' },
    sh: { display: 'Shell', shiki: 'bash' },
    bash: { display: 'Bash', shiki: 'bash' },
  };
  return langMap[ext] || { display: 'Text', shiki: 'text' };
}

const DARK_COLORS = {
  keyword: '#c792ea', string: '#c3e88d', comment: '#676e95', number: '#f78c6c',
  function: '#82aaff', type: '#ffcb6b', operator: '#89ddff', punctuation: '#89ddff',
  property: '#f07178', tag: '#f07178', attr: '#c792ea', variable: '#eeffff',
};

const LIGHT_COLORS = {
  keyword: '#7c3aed', string: '#059669', comment: '#6b7280', number: '#ea580c',
  function: '#2563eb', type: '#ca8a04', operator: '#374151', punctuation: '#374151',
  property: '#dc2626', tag: '#dc2626', attr: '#7c3aed', variable: '#111827',
};

/** Lightweight regex-based syntax highlighting (alternative to shiki). */
export function highlightCode(code: string, lang: string, isDark: boolean): string {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  // Escape HTML
  let highlighted = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (['typescript', 'tsx', 'javascript', 'jsx'].includes(lang)) {
    highlighted = highlightJS(highlighted, colors);
  } else if (lang === 'json') {
    highlighted = highlightJSON(highlighted, colors);
  } else if (lang === 'css' || lang === 'scss') {
    highlighted = highlightCSS(highlighted, colors);
  } else if (lang === 'html') {
    highlighted = highlightHTML(highlighted, colors);
  } else if (lang === 'markdown') {
    highlighted = highlightMarkdown(highlighted, colors);
  }

  return highlighted;
}

function highlightJS(code: string, colors: typeof DARK_COLORS): string {
  let h = code;
  // Comments
  h = h.replace(/(\/{2}[^\n]*|\/\*[\s\S]*?\*\/)/g, `<span style="color:${colors.comment}">$1</span>`);
  // Strings
  h = h.replace(/(['"\`])(?:(?!\1)[^\\]|\\.)*?\1/g, `<span style="color:${colors.string}">$&</span>`);
  // Keywords
  const kw = /\b(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|new|this|super|async|await|try|catch|throw|default|switch|case|break|continue|typeof|instanceof|in|of|as|is)\b/g;
  h = h.replace(kw, `<span style="color:${colors.keyword}">$1</span>`);
  // Types
  h = h.replace(/\b([A-Z][a-zA-Z0-9]*)\b(?!\s*:)/g, `<span style="color:${colors.type}">$1</span>`);
  // Numbers
  h = h.replace(/\b(\d+\.?\d*)\b/g, `<span style="color:${colors.number}">$1</span>`);
  // Function calls
  h = h.replace(/\b([a-z_][a-zA-Z0-9_]*)\s*(?=\()/g, `<span style="color:${colors.function}">$1</span>`);
  return h;
}

function highlightJSON(code: string, colors: typeof DARK_COLORS): string {
  let h = code;
  h = h.replace(/"([^"\\]|\\.)*"/g, (match) => {
    const style = match.endsWith('":') ? colors.property : colors.string;
    return `<span style="color:${style}">${match}</span>`;
  });
  h = h.replace(/:\s*(\d+\.?\d*)/g, `: <span style="color:${colors.number}">$1</span>`);
  h = h.replace(/\b(true|false|null)\b/g, `<span style="color:${colors.keyword}">$1</span>`);
  return h;
}

function highlightCSS(code: string, colors: typeof DARK_COLORS): string {
  let h = code;
  h = h.replace(/^([.#]?[a-zA-Z_-][a-zA-Z0-9_-]*)/gm, `<span style="color:${colors.tag}">$1</span>`);
  h = h.replace(/([a-z-]+)\s*:/g, `<span style="color:${colors.property}">$1</span>:`);
  h = h.replace(/:\s*([^;{]+)/g, `: <span style="color:${colors.string}">$1</span>`);
  return h;
}

function highlightHTML(code: string, colors: typeof DARK_COLORS): string {
  let h = code;
  h = h.replace(/(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g, `<span style="color:${colors.tag}">$1</span>`);
  h = h.replace(/([a-zA-Z-]+)=/g, `<span style="color:${colors.attr}">$1</span>=`);
  return h;
}

function highlightMarkdown(code: string, colors: typeof DARK_COLORS): string {
  let h = code;
  h = h.replace(/^(#{1,6})\s+(.*)$/gm, `<span style="color:${colors.keyword}">$1</span> <span style="color:${colors.type}">$2</span>`);
  h = h.replace(/\*\*([^*]+)\*\*/g, `<span style="color:${colors.keyword};font-weight:bold">**$1**</span>`);
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<span style="color:${colors.function}">[$1]</span><span style="color:${colors.string}">($2)</span>`);
  return h;
}
