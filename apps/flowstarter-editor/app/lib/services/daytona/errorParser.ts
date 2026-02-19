/**
 * Error Parser
 *
 * Parses error details from dev server output for better error reporting.
 * Enhanced with comprehensive Astro/Vite/esbuild patterns.
 */

import type { BuildErrorInfo } from './types';

/** Error patterns for parsing dev server output (ordered by specificity) */
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => { file?: string; line?: string; message: string };
}> = [
  // Astro compilation error: "src/components/Hero.astro:15:8 ERROR ..."
  {
    pattern: /(src\/[a-zA-Z0-9_.\-/]+\.(astro|tsx?|jsx?)):(\d+):(\d+)\s*(?:ERROR|error)/,
    extract: (m) => ({ file: m[1], line: m[3], message: m[0] }),
  },

  // Vite transform error: [vite] Internal server error: <message>\n  Plugin: ...\n  File: /home/daytona/src/...
  {
    pattern: /\[vite\]\s*Internal server error:\s*([^\n]+)[\s\S]*?File:\s*(?:\/home\/daytona\/)?([^\n]+)/,
    extract: (m) => ({ file: m[2].trim(), line: '0', message: m[1].trim() }),
  },

  // Astro ReferenceError: "X is not defined" with file path on next line
  {
    pattern: /ReferenceError[:\s]+([^\n]+is not defined)\n\s*([a-zA-Z0-9_./-]+\.(astro|tsx?|jsx?)):(\d+)/,
    extract: (m) => ({ file: m[2], line: m[4], message: `ReferenceError: ${m[1]}` }),
  },

  // Astro/Vite SyntaxError/TypeError/ReferenceError with file path
  {
    pattern: /(SyntaxError|TypeError|ReferenceError)[:\s]+([^\n]+)\n[\s\S]*?([a-zA-Z0-9_./-]+\.(astro|tsx?|jsx?)):(\d+)/,
    extract: (m) => ({ file: m[3], line: m[5], message: `${m[1]}: ${m[2]}` }),
  },

  // Astro [ERROR] with clear message and file info: [ERROR] Could not resolve "X" from "Y"
  {
    pattern: /\[ERROR\]\s*([^\n]+(?:Could not resolve|Cannot find)[^\n]*"([^"]+)"[^\n]*"([^"]+)")/,
    extract: (m) => ({ file: m[3], line: '0', message: m[1] }),
  },

  // esbuild style: [ERROR] ... \n\n    file:line:col:\n    N │ ...
  {
    pattern: /\[ERROR\][^\n]*\n\n\s+([a-zA-Z0-9_./-]+):(\d+):(\d+):\n\s+\d+\s*│\s*([^\n]*)/,
    extract: (m) => ({ file: m[1], line: m[2], message: m[4].trim() }),
  },

  // Vite/Rollup: "Could not resolve import"
  {
    pattern: /Could not resolve import\s+"([^"]+)"\s+(?:in|from)\s+"?([^"\n]+)"?/,
    extract: (m) => ({ file: m[2], line: '0', message: `Cannot resolve import "${m[1]}"` }),
  },

  // Astro AstroError: unknown file type
  {
    pattern: /AstroError[:\s]+([^\n]+)[\s\S]*?(?:File|at)\s*(?:\/home\/daytona\/)?([a-zA-Z0-9_./-]+)/,
    extract: (m) => ({ file: m[2], line: '0', message: `AstroError: ${m[1]}` }),
  },

  // Generic [ERROR] with file info
  {
    pattern: /\[ERROR\][^\n]*[\s\S]*?([a-zA-Z0-9_.-]+\.(ts|js|tsx|jsx|json|astro)):(\d+)/,
    extract: (m) => ({ file: m[1], line: m[3], message: m[0].split('\n')[0] }),
  },

  // PostCSS/Tailwind error
  {
    pattern: /(?:PostCSS|CssSyntaxError|tailwindcss)[:\s]+[^\n]*(?:\/home\/daytona\/)?([^\n:]+):(\d+)/,
    extract: (m) => ({ file: m[1].trim(), line: m[2], message: m[0].split('\n')[0] }),
  },

  // Node.js stack trace: at Something (/home/daytona/src/file.ts:10:5)
  {
    pattern: /at\s+(?:.+?\s+)?\(?(?:file:\/\/)?\/home\/daytona\/(.+?):(\d+):(\d+)\)?/,
    extract: (m) => ({ file: m[1], line: m[2], message: '' }),
  },

  // Generic "Cannot find module" with path
  {
    pattern: /Cannot find (?:module|package)\s+['"]([^'"]+)['"]/,
    extract: (m) => ({ file: '', line: '0', message: `Cannot find module '${m[1]}'` }),
  },

  // ReferenceError/TypeError/SyntaxError fallback (no file info)
  {
    pattern: /(ReferenceError|TypeError|SyntaxError)[:\s]+([^\n]*)/,
    extract: (m) => ({ file: '', line: '0', message: `${m[1]}: ${m[2]}` }),
  },

  // Generic [ERROR] fallback
  {
    pattern: /\[ERROR\]\s*([^\n]*)/,
    extract: (m) => ({ file: '', line: '0', message: m[1] }),
  },
];

/** File extensions that indicate source files */
const SOURCE_EXTENSIONS = ['.astro', '.tsx', '.ts', '.jsx', '.js', '.json', '.css', '.mjs'];

/**
 * Parse error details from dev server output
 */
export function parseErrorDetails(output: string): { file: string; line: string; message: string } | null {
  for (const { pattern, extract } of ERROR_PATTERNS) {
    const match = output.match(pattern);

    if (match) {
      const result = extract(match);
      const file = result.file ? normalizeFilePath(result.file, output) : '';

      // If we have a message but no file, try to find the file from context
      if (!file && result.message) {
        const fileFromContext = extractFileFromContext(output, result.message);
        if (fileFromContext) {
          return {
            file: normalizeFilePath(fileFromContext, output),
            line: result.line || '0',
            message: result.message,
          };
        }
      }

      return {
        file,
        line: result.line || '0',
        message: result.message,
      };
    }
  }

  return null;
}

/**
 * Extract all errors from output (returns multiple for compound issues)
 */
export function parseAllErrors(output: string): Array<{ file: string; line: string; message: string }> {
  const errors: Array<{ file: string; line: string; message: string }> = [];
  const seen = new Set<string>();

  for (const { pattern, extract } of ERROR_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags + (pattern.flags.includes('g') ? '' : 'g'));
    let match;

    while ((match = regex.exec(output)) !== null) {
      const result = extract(match);
      const file = result.file ? normalizeFilePath(result.file, output) : '';
      const key = `${file}:${result.line}:${result.message.slice(0, 50)}`;

      if (!seen.has(key)) {
        seen.add(key);
        errors.push({
          file,
          line: result.line || '0',
          message: result.message,
        });
      }
    }

    // Limit to first 5 errors
    if (errors.length >= 5) break;
  }

  return errors;
}

/**
 * Try to extract a file name from surrounding context
 */
function extractFileFromContext(output: string, errorMessage: string): string | null {
  // Look for source file paths near the error
  const filePattern = /([a-zA-Z0-9_./-]*(?:src\/)?[a-zA-Z0-9_.-]+\.(astro|tsx?|jsx?|css|mjs))/g;
  let match;

  while ((match = filePattern.exec(output)) !== null) {
    if (isSourceFile(match[1])) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if filename is a source file
 */
function isSourceFile(filename: string): boolean {
  return SOURCE_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

/**
 * Normalize file path to include src/ prefix when appropriate
 */
function normalizeFilePath(file: string, output: string): string {
  // Remove leading slashes and /home/daytona/ prefix
  let normalized = file
    .replace(/^\/home\/daytona\//, '')
    .replace(/^\/+/, '');

  // Add src/ prefix for common directories
  if (
    normalized.startsWith('pages/') ||
    normalized.startsWith('layouts/') ||
    normalized.startsWith('components/') ||
    normalized.startsWith('styles/') ||
    normalized.startsWith('lib/') ||
    normalized.startsWith('utils/')
  ) {
    normalized = 'src/' + normalized;
  } else if (
    !normalized.startsWith('src/') &&
    !normalized.startsWith('public/') &&
    !normalized.includes('.config.') &&
    !normalized.startsWith('package') &&
    output.includes('src/' + normalized)
  ) {
    normalized = 'src/' + normalized;
  }

  return normalized;
}

/**
 * Check if dev server output contains fatal errors
 * Improved: More precise detection to avoid false positives
 */
export function hasFatalError(output: string, serverStarted: boolean): boolean {
  // If server started successfully, only consider post-start crashes
  if (serverStarted) {
    // Look for crashes AFTER the "ready" message
    const readyIndex = output.indexOf('ready in');
    if (readyIndex >= 0) {
      const postReady = output.slice(readyIndex);
      return (
        postReady.includes('FATAL') ||
        postReady.includes('Segmentation fault') ||
        postReady.includes('process exited')
      );
    }
    return false;
  }

  // Server didn't start — check for actual fatal errors
  const fatalIndicators = [
    'SyntaxError',
    'ReferenceError',
    'TypeError: ',  // Note: trailing space to avoid "TypeError" in stack traces that aren't the actual error
    'Cannot find module',
    'Cannot find package',
    'is not defined',
    'ENOENT',
    'AstroError',
    'Could not resolve',
    'Transform failed',
    'Build failed',
    'Unexpected token',
  ];

  const hasFatal = fatalIndicators.some((indicator) => output.includes(indicator));

  // Also check for [ERROR] but exclude known non-fatal patterns
  const hasError =
    output.includes('[ERROR]') &&
    !output.includes('Failed to scan for dependencies') &&
    !output.includes('Failed to load config');

  return hasFatal || hasError;
}

/**
 * Check if dev server successfully started based on output
 */
export function checkServerStarted(output: string): boolean {
  // Astro: "ready in Xms" + URL info
  if (output.includes('ready in') && (output.includes('localhost:') || output.includes('Network'))) {
    return true;
  }

  // Vite: "Local:   http://localhost:XXXX/"
  if (/Local:\s+https?:\/\/localhost:\d+/i.test(output)) {
    return true;
  }

  return false;
}

/**
 * Extract port from dev server output
 */
export function extractPort(output: string): number | null {
  // Try multiple port patterns
  const patterns = [
    /localhost:(\d+)/i,
    /Local:\s+https?:\/\/[^:]+:(\d+)/i,
    /Network:\s+https?:\/\/[^:]+:(\d+)/i,
    /listening on.*?:(\d+)/i,
    /port\s+(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match) {
      const port = parseInt(match[1], 10);
      if (port > 0 && port < 65536) {
        return port;
      }
    }
  }

  return null;
}

/**
 * Create build error info from error details
 */
export function createBuildError(
  errorDetails: { file: string; line: string; message: string } | null,
  output: string,
): BuildErrorInfo | undefined {
  if (!errorDetails) {
    // Last-resort: try to create some error info from the raw output
    const firstError = output.match(/(?:\[ERROR\]|Error:|error:)\s*([^\n]{10,200})/);
    if (firstError) {
      return {
        file: '',
        line: '0',
        message: firstError[1].trim(),
        fullOutput: output,
      };
    }
    return undefined;
  }

  return {
    file: errorDetails.file,
    line: errorDetails.line,
    message: errorDetails.message || 'Unknown build error',
    fullOutput: output,
  };
}

/**
 * Extract build errors from a dev log file content
 * Returns null if no errors found
 */
export function extractBuildErrorFromLog(logContent: string): BuildErrorInfo | null {
  if (!logContent || logContent.length < 10) return null;

  // First check if the log indicates the server is actually running fine
  if (checkServerStarted(logContent) && !hasFatalError(logContent, true)) {
    return null;
  }

  // Check for fatal errors
  if (hasFatalError(logContent, false)) {
    const errorDetails = parseErrorDetails(logContent);
    return {
      file: errorDetails?.file || '',
      line: errorDetails?.line || '0',
      message: errorDetails?.message || 'Build error detected in dev log',
      fullOutput: logContent,
    };
  }

  return null;
}

